/**
 * O COMPILADOR — tempo 3 vira código (ver docs/CONCEPCAO-V2.md).
 *
 *   npm run compilar          conteudo/**.md → src/conteudo.gerado.ts
 *
 * O conteúdo mora em arquivo no git, e o Worker não tem banco para ele. Este
 * script lê cada peça, valida o frontmatter e escreve um módulo TypeScript
 * que entra no bundle. Publicar é: escrever o arquivo, rodar isto, deploy.
 *
 * ⚠️ ELE ABORTA. Peça sem autor, notícia sem fonte, veredito fora da
 * categoria, arte que não existe, imagem sem crédito ou sem licença, Giro
 * com número que não está no dossiê — qualquer uma dessas para o build com o
 * arquivo e o motivo na tela. Se o compilador deixasse passar, o QA teria de
 * pegar depois, e "depois" é com a página já no ar.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditarNumeros } from '../src/giro/auditar.ts';
import {
  FORMATOS_POR_SECAO,
  LICENCAS_IMAGEM,
  SECOES,
  TEMAS,
  VEREDITOS,
  type LicencaImagem,
  type Peca,
  type Secao,
  type Veredito,
} from '../src/conteudo/tipos.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTEUDO = join(RAIZ, 'conteudo');
const ARTE = join(CONTEUDO, 'arte');
const IMAGENS = join(RAIZ, 'publico', 'imagens');
const SAIDA = join(RAIZ, 'src', 'conteudo.gerado.ts');

/* ------------------------------------------------------------ frontmatter */

type Bruto = Record<string, string | Record<string, string>>;

/**
 * YAML mínimo, de propósito: `chave: valor` e UM nível de aninhamento. Não é
 * um parser de YAML — é o suficiente para peça, e recusa o resto em vez de
 * adivinhar.
 */
function lerFrontmatter(texto: string, arquivo: string): { meta: Bruto; corpo: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(texto);
  if (!m) falhar(arquivo, 'sem frontmatter (o arquivo tem de começar com ---)');

  const meta: Bruto = {};
  let aninhado: string | null = null;

  for (const linhaBruta of m![1]!.split(/\r?\n/)) {
    if (!linhaBruta.trim() || linhaBruta.trim().startsWith('#')) continue;
    const recuada = /^\s+/.test(linhaBruta);
    const linha = linhaBruta.trim();
    const i = linha.indexOf(':');
    if (i < 0) falhar(arquivo, `linha sem "chave: valor" no frontmatter: "${linha}"`);
    const chave = linha.slice(0, i).trim();
    const valor = desaspar(linha.slice(i + 1).trim());

    if (recuada) {
      if (!aninhado) falhar(arquivo, `campo recuado sem pai: "${linha}"`);
      (meta[aninhado!] as Record<string, string>)[chave] = valor;
      continue;
    }
    if (valor === '') {
      aninhado = chave;
      meta[chave] = {};
      continue;
    }
    aninhado = null;
    meta[chave] = valor;
  }
  return { meta, corpo: m![2]!.trim() };
}

const desaspar = (v: string) => (/^(['"]).*\1$/.test(v) ? v.slice(1, -1) : v);

function falhar(arquivo: string, motivo: string): never {
  console.error(`\n✗ ${arquivo.replace(RAIZ, '.')}\n  ${motivo}\n`);
  process.exit(1);
}

/* -------------------------------------------------------------- validação */

function texto(meta: Bruto, chave: string, arquivo: string): string {
  const v = meta[chave];
  if (typeof v !== 'string' || !v.trim()) falhar(arquivo, `falta "${chave}"`);
  return (v as string).trim();
}

function entre<T extends string>(valor: string, permitidos: readonly T[], chave: string, arquivo: string): T {
  if (!(permitidos as readonly string[]).includes(valor)) {
    falhar(arquivo, `"${chave}: ${valor}" não é um dos permitidos: ${permitidos.join(' | ')}`);
  }
  return valor as T;
}

function bloco(meta: Bruto, chave: string, campos: string[], arquivo: string): Record<string, string> {
  const b = meta[chave];
  if (!b || typeof b !== 'object') falhar(arquivo, `falta o bloco "${chave}:" (${campos.join(', ')})`);
  for (const k of campos) if (!(b as Record<string, string>)[k]) falhar(arquivo, `falta "${chave}.${k}"`);
  return b as Record<string, string>;
}

function compilarPeca(caminho: string, secao: Secao): Peca {
  const nome = basename(caminho);
  const mNome = /^(\d{4}-\d{2}-\d{2})-([a-z0-9-]+)\.md$/.exec(nome);
  if (!mNome) falhar(caminho, 'o nome do arquivo tem de ser AAAA-MM-DD-slug-em-minusculas.md');

  const { meta, corpo } = lerFrontmatter(readFileSync(caminho, 'utf8'), caminho);

  const secaoDeclarada = entre(texto(meta, 'secao', caminho), SECOES, 'secao', caminho);
  if (secaoDeclarada !== secao) falhar(caminho, `está na pasta "${secao}" mas declara "secao: ${secaoDeclarada}"`);

  const formato = entre(texto(meta, 'formato', caminho), FORMATOS_POR_SECAO[secao], 'formato', caminho);
  const tema = entre(texto(meta, 'tema', caminho), TEMAS, 'tema', caminho);
  const data = texto(meta, 'data', caminho);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || Number.isNaN(Date.parse(data))) falhar(caminho, `"data: ${data}" não é AAAA-MM-DD`);
  if (data !== mNome![1]) falhar(caminho, `a data do nome do arquivo (${mNome![1]}) não bate com "data: ${data}"`);

  const peca: Peca = {
    slug: mNome![2]!,
    secao,
    tema,
    formato,
    titulo: texto(meta, 'titulo', caminho),
    lead: texto(meta, 'lead', caminho),
    autor: texto(meta, 'autor', caminho),
    data,
    corpo,
    palavras: corpo.trim() ? corpo.trim().split(/\s+/).length : 0,
  };

  if (peca.corpo.length < 80) falhar(caminho, 'o corpo tem menos de 80 caracteres — isso não é uma peça');

  /* Notícia é sobre terceiro: credita, linka, e diz o que muda aqui. */
  if (secao === 'noticias') {
    peca.veredito = entre(texto(meta, 'veredito', caminho), VEREDITOS, 'veredito', caminho) as Veredito;
    const f = bloco(meta, 'fonte', ['nome', 'url', 'idioma'], caminho);
    if (!/^https?:\/\//.test(f['url']!)) falhar(caminho, `"fonte.url" precisa ser http(s): ${f['url']}`);
    peca.fonte = { nome: f['nome']!, url: f['url']!, idioma: f['idioma']!, publicado: f['publicado'] };
    if (!/^##\s*O que isso muda aqui/m.test(corpo)) {
      falhar(caminho, 'notícia sem a seção "## O que isso muda aqui" — é a camada que separa leitura de tradução');
    }
  } else if (typeof meta['veredito'] === 'string') {
    falhar(caminho, `"${secao}" não leva veredito — ele é categoria da notícia`);
  }

  /* Imagem real só entra com crédito e licença. "Peguei da matéria" não é
     licença, e o compilador não tem como saber se é — então exige que
     alguém declare, e a declaração vai para a tela junto com a imagem. */
  if (meta['imagem'] !== undefined) {
    const im = bloco(meta, 'imagem', ['arquivo', 'credito', 'licenca', 'alt'], caminho);
    if (!existsSync(join(IMAGENS, im['arquivo']!))) falhar(caminho, `"imagem.arquivo: ${im['arquivo']}" não existe em publico/imagens/`);
    if (!/\.(jpe?g|png|webp|avif)$/i.test(im['arquivo']!)) falhar(caminho, `"imagem.arquivo" tem de ser jpg, png, webp ou avif`);
    const tamanho = statSync(join(IMAGENS, im['arquivo']!)).size;
    if (tamanho > 600_000) falhar(caminho, `imagem com ${(tamanho / 1024).toFixed(0)} KB — o teto é 600 KB; redimensione`);
    peca.imagem = {
      arquivo: im['arquivo']!,
      credito: im['credito']!,
      licenca: entre(im['licenca']!, LICENCAS_IMAGEM, 'imagem.licenca', caminho) as LicencaImagem,
      alt: im['alt']!,
    };
  }

  if (typeof meta['arte'] === 'string') {
    const arte = meta['arte'] as string;
    if (!existsSync(join(ARTE, arte))) falhar(caminho, `"arte: ${arte}" não existe em conteudo/arte/`);
    peca.arte = arte;
  }

  /* O Giro: cada número da prosa tem de existir no dossiê. `numeros:` é a
     lista de permitidos, copiada do dossiê — e a auditoria roda aqui, antes
     de a edição virar bundle. */
  if (secao === 'giro') {
    const permitidos = texto(meta, 'numeros', caminho)
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(Number);
    if (permitidos.some((n) => !Number.isFinite(n))) falhar(caminho, '"numeros:" tem de ser inteiros separados por vírgula');
    const auditoria = auditarNumeros(`${peca.titulo}\n${peca.lead}\n${corpo}`, permitidos);
    if (!auditoria.passou) {
      falhar(caminho, `números na prosa que não estão no dossiê: ${auditoria.inventados.join(', ')} — confira em "numeros:"`);
    }
  }

  return peca;
}

/* --------------------------------------------------------------- a escrita */

function listar(pasta: string): string[] {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta)
    .filter((n) => n.endsWith('.md'))
    .map((n) => join(pasta, n))
    .filter((p) => statSync(p).isFile())
    .sort();
}

const pecas: Peca[] = [];
for (const secao of SECOES) for (const caminho of listar(join(CONTEUDO, secao))) pecas.push(compilarPeca(caminho, secao));

for (const secao of SECOES) {
  const vistos = new Set<string>();
  for (const p of pecas.filter((x) => x.secao === secao)) {
    if (vistos.has(p.slug)) falhar(join(CONTEUDO, secao), `slug repetido na seção: "${p.slug}"`);
    vistos.add(p.slug);
  }
}

const artes: Record<string, string> = {};
for (const p of pecas) {
  if (p.arte && !(p.arte in artes)) {
    const svg = readFileSync(join(ARTE, p.arte), 'utf8');
    if (!/^\s*<svg[\s>]/.test(svg)) falhar(join(ARTE, p.arte), 'arte tem de ser SVG');
    if (/<script/i.test(svg)) falhar(join(ARTE, p.arte), 'SVG com <script> não entra');
    if (/(fill|stroke)\s*=\s*"#/.test(svg)) falhar(join(ARTE, p.arte), 'arte com cor crua — as artes vestem os tokens (classes .a-*)');
    artes[p.arte] = svg.trim();
  }
}

pecas.sort((a, b) => b.data.localeCompare(a.data) || a.slug.localeCompare(b.slug));

const modulo = `/* eslint-disable */
/**
 * GERADO por scripts/compilar.ts — NÃO EDITE.
 *
 * O conteúdo mora em conteudo/**.md. Este arquivo é a versão compilada que
 * entra no bundle do Worker. Editar aqui é perder a edição no próximo build.
 *
 * ${pecas.length} peça(s) · ${Object.keys(artes).length} arte(s) · ${pecas.filter((p) => p.imagem).length} imagem(ns) · gerado em ${new Date().toISOString()}
 */
import type { Peca } from './conteudo/tipos';

export const PECAS: readonly Peca[] = ${JSON.stringify(pecas, null, 2)};

export const ARTES: Readonly<Record<string, string>> = ${JSON.stringify(artes, null, 2)};
`;

mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, modulo, 'utf8');

const porSecao = SECOES.map((s) => `${s} ${pecas.filter((p) => p.secao === s).length}`).join(' · ');
console.log(`✓ ${pecas.length} peça(s) compiladas (${porSecao}) · ${Object.keys(artes).length} arte(s) · ${pecas.filter((p) => p.imagem).length} imagem(ns)`);
console.log(`→ ${SAIDA.replace(RAIZ, '.')}`);
