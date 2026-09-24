/**
 * O COMPILADOR — tempo 3 vira código (ver docs/CONCEPCAO-V2.md).
 *
 *   npm run compilar          conteudo/**.md → src/conteudo.gerado.ts
 *
 * O conteúdo mora em arquivo no git, e o Worker não tem banco para ele. Este
 * script lê cada peça, valida o frontmatter e escreve um módulo TypeScript
 * que entra no bundle. Publicar é: escrever o arquivo, rodar isto, deploy.
 *
 * Também produz o que a página precisa e não dá para fazer no Worker:
 *   - a imagem de compartilhamento (og:image) de cada peça sem foto, rasterizada
 *     da arte SVG com o Chromium do Playwright, em publico/og/ (só quando falta
 *     ou quando a arte mudou — o caminho rápido não abre navegador);
 *   - a imagem padrão do site e os ícones PNG (apple-touch-icon, manifesto);
 *   - o hash SHA-256 do único script inline, que a Content-Security-Policy exige.
 *
 * ⚠️ ELE ABORTA. Peça sem autor, autor que não existe em conteudo/autores/,
 * notícia sem fonte, veredito fora da categoria, arte que não existe, imagem
 * sem crédito ou sem licença, dois destaques, Giro com número que não está
 * no dossiê — qualquer uma dessas para o build com o arquivo e o motivo na
 * tela.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { auditarNumeros } from '../src/giro/auditar.ts';
import { gerarCapa } from '../src/ui/capa.ts';
import { TEMA_SCRIPT } from '../src/ui/tema.ts';
import {
  FORMATOS_POR_SECAO,
  LICENCAS_IMAGEM,
  SECOES,
  SECOES_PATROCINAVEIS,
  TEMAS,
  VEREDITOS,
  type Autor,
  type LicencaImagem,
  type Peca,
  type Secao,
  type Veredito,
} from '../src/conteudo/tipos.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTEUDO = join(RAIZ, 'conteudo');
const ARTE = join(CONTEUDO, 'arte');
const AUTORES_DIR = join(CONTEUDO, 'autores');
const PUBLICO = join(RAIZ, 'publico');
const IMAGENS = join(PUBLICO, 'imagens');
const FOTOS = join(PUBLICO, 'autores');
const OG = join(PUBLICO, 'og');
const ICONES = join(PUBLICO, 'icones');
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

/**
 * Tipografia: o que não pode quebrar no fim da linha.
 *
 * A manchete da peça principal quebrava em "...por US$ / 12,9 bilhões" — o
 * símbolo da moeda órfão numa linha e o valor na seguinte. São 52 ocorrências
 * de `R$ <número>` e `US$ <número>` no conteúdo de hoje, e cada uma é um
 * sorteio a cada largura de tela.
 *
 * Resolve-se aqui, no compilador, e não em cada componente: o texto entra
 * uma vez, é normalizado uma vez, e todo lugar que imprime título, lead ou
 * corpo herda de graça — sem custo em requisição e sem ninguém ter de
 * lembrar.
 *
 * ⚠️ `[ \t]` e não `\s`: `\s` casaria a quebra de linha, e juntar duas linhas
 * do markdown com um espaço inquebrável mudaria a estrutura do texto (um
 * parágrafo que vira outro). A lista de unidades é curta de propósito —
 * "5 m" pode ser metro ou não, e grudar errado é pior que não grudar.
 */
const NBSP = ' ';
function naoQuebrar(s: string): string {
  return s
    // ⚠️ sem `\b` antes do grupo: € e £ NÃO são caracteres de palavra, então
    // depois de um espaço não existe fronteira e o casamento falhava só para
    // eles. A asserção de QA pegou isto em dois textos com valores em euro.
    .replace(/(R\$|US\$|€|£)[ \t]+(?=\d)/g, `$1${NBSP}`)
    .replace(/(\d)[ \t]+(mil|milhão|milhões|bilhão|bilhões|trilhão|trilhões)\b/gi, `$1${NBSP}$2`)
    .replace(/(\d)[ \t]+(dias?|anos?|meses|mês)\b/gi, `$1${NBSP}$2`);
}

/**
 * Largura e altura de um JPEG ou PNG, lidas do cabeçalho do arquivo. Vão no
 * og:image:width/height e no JSON-LD — e o compartilhamento não precisa
 * baixar a imagem para saber o tamanho dela.
 */
function medidasDaImagem(caminho: string): { largura: number; altura: number } | null {
  const b = readFileSync(caminho);
  if (b[0] === 0x89 && b[1] === 0x50) return { largura: b.readUInt32BE(16), altura: b.readUInt32BE(20) }; // PNG
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) return null;
      const marcador = b[i + 1]!;
      const tamanho = b.readUInt16BE(i + 2);
      if ((marcador >= 0xc0 && marcador <= 0xc3) || (marcador >= 0xc5 && marcador <= 0xc7) || (marcador >= 0xc9 && marcador <= 0xcb) || (marcador >= 0xcd && marcador <= 0xcf)) {
        return { altura: b.readUInt16BE(i + 5), largura: b.readUInt16BE(i + 7) };
      }
      i += 2 + tamanho;
    }
  }
  return null;
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

  const slug = mNome![2]!;
  const peca: Peca = {
    slug,
    secao,
    tema,
    formato,
    titulo: naoQuebrar(texto(meta, 'titulo', caminho)),
    lead: naoQuebrar(texto(meta, 'lead', caminho)),
    /* autor entra logo abaixo: boletim gerado não tem, e é o único caso */
    data,
    og: `/og/${secao}-${slug}.png`,
    corpo: naoQuebrar(corpo),
    palavras: corpo.trim() ? corpo.trim().split(/\s+/).length : 0,
  };

  if (peca.corpo.length < 80) falhar(caminho, 'o corpo tem menos de 80 caracteres — isso não é uma peça');

  /* --------------------------------------------------- boletim gerado
   * `gerado: true` é a ÚNICA porta por onde entra texto sem autor, e ela só
   * abre no Giro. Existe porque o Giro é balanço de números medidos, montado
   * por função pura sobre a apuração (src/giro/redigir.ts) — mesmos dados,
   * mesmo texto, nenhum modelo de linguagem envolvido.
   *
   * O site não pode fingir que isso foi escrito por alguém: a peça sai com o
   * aviso na página, a assinatura mostra a origem no lugar de um nome, e as
   * promessas do rodapé foram ESTREITADAS para notícia, artigo e relatório —
   * que continuam exigindo autor com arquivo em conteudo/autores/.
   */
  if (typeof meta['gerado'] === 'string') {
    if (meta['gerado'] !== 'true') falhar(caminho, `"gerado" só aceita "true" (ou não existir)`);
    if (secao !== 'giro') falhar(caminho, `"${secao}" não aceita texto gerado — só o Giro é boletim de números`);
    if (typeof meta['autor'] === 'string') falhar(caminho, 'boletim gerado não leva "autor": ele não foi escrito por uma pessoa, e dizer que foi é o que esta trava impede');
    peca.gerado = true;
  } else {
    peca.autor = texto(meta, 'autor', caminho);
  }

  /* O título curto: o que a busca mostra. Até 53, senão não é curto. */
  if (typeof meta['titulo_curto'] === 'string') {
    const curto = (meta['titulo_curto'] as string).trim();
    // 53 + " — Instituto Automação" (22) = 75: o que cabe num resultado de busca sem cortar
    if (curto.length > 53) falhar(caminho, `"titulo_curto" tem ${curto.length} caracteres — o teto é 53`);
    if (curto.length < 20) falhar(caminho, `"titulo_curto" tem ${curto.length} caracteres — curto demais para dizer algo`);
    // o teto de 53 é medido ANTES de grudar: o inquebrável não muda o comprimento
    peca.tituloCurto = naoQuebrar(curto);
  }
  if (typeof meta['destaque'] === 'string') {
    if (meta['destaque'] !== 'true') falhar(caminho, `"destaque" só aceita "true" (ou não existir)`);
    peca.destaque = true;
  }

  /* O artigo fixo da capa: só artigo, e o site inteiro tem um (ver adiante). */
  if (typeof meta['fixo'] === 'string') {
    if (meta['fixo'] !== 'true') falhar(caminho, `"fixo" só aceita "true" (ou não existir)`);
    if (secao !== 'artigos') falhar(caminho, `"fixo" é o slot de artigo da capa — "${secao}" não tem esse slot`);
    peca.fixo = true;
  }

  /* --------------------------------------------------------- publicidade
   * Peça paga entra rotulada ou não entra. Três recusas, e as três existem
   * porque a alternativa é combinar o rótulo no dia da venda:
   *
   *   1. "patrocinada" só aceita "true" — meio-termo não existe;
   *   2. paga sem "patrocinador" não compila: rótulo sem o nome de quem
   *      pagou informa menos do que parece ("publicidade" de quem?);
   *   3. paga fora de artigo/relatório não compila — notícia leva veredito
   *      e Giro leva a medição, e nenhum dos dois está à venda.
   *
   * Um "patrocinador" solto, sem "patrocinada: true", também para o build:
   * é o erro de digitação que publicaria a peça paga sem rótulo nenhum.
   */
  const temPatrocinador = typeof meta['patrocinador'] === 'string' && (meta['patrocinador'] as string).trim() !== '';
  if (typeof meta['patrocinada'] === 'string') {
    if (meta['patrocinada'] !== 'true') falhar(caminho, `"patrocinada" só aceita "true" (ou não existir)`);
    if (!temPatrocinador) {
      falhar(caminho, '"patrocinada: true" sem "patrocinador" — o rótulo tem de dizer quem pagou (CDC art. 36)');
    }
    if (!SECOES_PATROCINAVEIS.includes(secao)) {
      falhar(
        caminho,
        `"${secao}" não aceita peça paga — só ${SECOES_PATROCINAVEIS.join(' e ')}. ` +
          'Notícia carrega o veredito e o Giro carrega a medição; nenhum dos dois está à venda.',
      );
    }
    peca.patrocinada = { anunciante: (meta['patrocinador'] as string).trim() };
  } else if (temPatrocinador) {
    falhar(caminho, '"patrocinador" sem "patrocinada: true" — assim a peça sairia paga e sem rótulo');
  }

  /* Notícia é sobre terceiro: credita, linka, e diz o que muda aqui. */
  if (secao === 'noticias') {
    peca.veredito = entre(texto(meta, 'veredito', caminho), VEREDITOS, 'veredito', caminho) as Veredito;
    const f = bloco(meta, 'fonte', ['nome', 'url', 'idioma'], caminho);
    if (!/^https?:\/\//.test(f['url']!)) falhar(caminho, `"fonte.url" precisa ser http(s): ${f['url']}`);
    peca.fonte = { nome: f['nome']!, url: f['url']!, idioma: f['idioma']!, publicado: f['publicado'] };
    if (!/^##\s*O que isso muda aqui/m.test(corpo)) {
      falhar(caminho, 'notícia sem a seção "## O que isso muda aqui" — é a camada que separa leitura de tradução');
    }
  } else {
    if (typeof meta['veredito'] === 'string') falhar(caminho, `"${secao}" não leva veredito — ele é categoria da notícia`);
    /* artigo e relatório podem partir de uma publicação — e aí creditam do mesmo jeito */
    if (meta['fonte'] !== undefined) {
      const f = bloco(meta, 'fonte', ['nome', 'url', 'idioma'], caminho);
      if (!/^https?:\/\//.test(f['url']!)) falhar(caminho, `"fonte.url" precisa ser http(s): ${f['url']}`);
      peca.fonte = { nome: f['nome']!, url: f['url']!, idioma: f['idioma']!, publicado: f['publicado'] };
    }
  }

  /* Imagem real só entra com crédito e licença. "Peguei da matéria" não é
     licença, e o compilador não tem como saber se é — então exige que
     alguém declare, e a declaração vai para a tela junto com a imagem. */
  if (meta['imagem'] !== undefined) {
    const im = bloco(meta, 'imagem', ['arquivo', 'credito', 'licenca', 'alt'], caminho);
    const arquivo = join(IMAGENS, im['arquivo']!);
    if (!existsSync(arquivo)) falhar(caminho, `"imagem.arquivo: ${im['arquivo']}" não existe em publico/imagens/`);
    if (!/\.(jpe?g|png)$/i.test(im['arquivo']!)) falhar(caminho, `"imagem.arquivo" tem de ser jpg ou png (é o que rede social e busca leem)`);
    const tamanho = statSync(arquivo).size;
    if (tamanho > 600_000) falhar(caminho, `imagem com ${(tamanho / 1024).toFixed(0)} KB — o teto é 600 KB; redimensione`);
    const medidas = medidasDaImagem(arquivo);
    if (!medidas) falhar(caminho, `não consegui ler largura e altura de "${im['arquivo']}"`);
    if (medidas!.largura < 600) falhar(caminho, `imagem com ${medidas!.largura} px de largura — o mínimo para compartilhamento é 600`);
    peca.imagem = {
      arquivo: im['arquivo']!,
      credito: im['credito']!,
      licenca: entre(im['licenca']!, LICENCAS_IMAGEM, 'imagem.licenca', caminho) as LicencaImagem,
      alt: im['alt']!,
      largura: medidas!.largura,
      altura: medidas!.altura,
    };
    peca.og = `/imagens/${im['arquivo']}`;
  }

  if (typeof meta['arte'] === 'string') {
    const arte = meta['arte'] as string;
    if (!existsSync(join(ARTE, arte))) falhar(caminho, `"arte: ${arte}" não existe em conteudo/arte/`);
    peca.arte = arte;
  }

  /* O Giro: cada número da prosa tem de existir no dossiê. */
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

/* ---------------------------------------------------------------- autores */

/**
 * Um arquivo por pessoa. O nome é a chave: a peça diz `autor: Pedro Oliveira`
 * e aqui tem de existir um `nome: Pedro Oliveira`. O corpo é a bio.
 */
function compilarAutor(caminho: string): Autor {
  const nome = basename(caminho);
  const mNome = /^([a-z0-9-]+)\.md$/.exec(nome);
  if (!mNome) falhar(caminho, 'o nome do arquivo do autor tem de ser slug-em-minusculas.md');
  const { meta, corpo } = lerFrontmatter(readFileSync(caminho, 'utf8'), caminho);

  const nomeCompleto = texto(meta, 'nome', caminho);
  const partes = nomeCompleto.split(/\s+/).filter(Boolean);
  if (partes.length < 2) falhar(caminho, `"nome: ${nomeCompleto}" — nome e sobrenome, é assinatura`);
  if (corpo.length < 40) falhar(caminho, 'a bio (o corpo do arquivo) tem menos de 40 caracteres — diga quem é a pessoa');

  const autor: Autor = {
    slug: mNome![1]!,
    nome: nomeCompleto,
    papel: texto(meta, 'papel', caminho),
    bio: corpo,
    iniciais: (partes[0]![0]! + partes[partes.length - 1]![0]!).toUpperCase(),
    ordem: typeof meta['ordem'] === 'string' ? Number(meta['ordem']) : 99,
  };
  if (!Number.isFinite(autor.ordem)) falhar(caminho, `"ordem: ${meta['ordem']}" não é número`);

  if (typeof meta['link'] === 'string') {
    if (!/^https?:\/\//.test(meta['link'] as string)) falhar(caminho, `"link" precisa ser http(s): ${meta['link']}`);
    autor.link = meta['link'] as string;
    autor.linkRotulo = typeof meta['link_rotulo'] === 'string' ? (meta['link_rotulo'] as string) : 'Currículo';
  }
  if (typeof meta['foto'] === 'string') {
    const arquivo = join(FOTOS, meta['foto'] as string);
    if (!existsSync(arquivo)) falhar(caminho, `"foto: ${meta['foto']}" não existe em publico/autores/`);
    if (!/\.(jpe?g|png)$/i.test(meta['foto'] as string)) falhar(caminho, '"foto" tem de ser jpg ou png');
    if (statSync(arquivo).size > 200_000) falhar(caminho, 'foto com mais de 200 KB — é um retrato, redimensione para 480 px');
    const medidas = medidasDaImagem(arquivo);
    if (!medidas) falhar(caminho, `não consegui ler largura e altura de "${meta['foto']}"`);
    if (Math.abs(medidas!.largura - medidas!.altura) > 2) falhar(caminho, `a foto tem de ser quadrada (${medidas!.largura}×${medidas!.altura})`);
    autor.foto = { arquivo: meta['foto'] as string, ...medidas! };
  }
  return autor;
}

/* --------------------------------------------------------------- a leitura */

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
const autores: Autor[] = listar(AUTORES_DIR).map(compilarAutor).sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
{
  const nomes = new Set<string>();
  for (const a of autores) {
    if (nomes.has(a.nome)) falhar(AUTORES_DIR, `dois arquivos com "nome: ${a.nome}"`);
    nomes.add(a.nome);
  }
  if (!autores.length) falhar(AUTORES_DIR, 'não há nenhum autor em conteudo/autores/ — toda peça precisa de um');
  /* toda peça aponta para gente que existe: é o que faz "toda peça tem autor" ser verificável */
  for (const p of pecas) {
    if (p.gerado) continue; // boletim de números não tem autor, por desenho
    if (!p.autor || !nomes.has(p.autor)) falhar(join(CONTEUDO, p.secao, `${p.data}-${p.slug}.md`), `autor "${p.autor}" não tem arquivo em conteudo/autores/ (nomes conhecidos: ${[...nomes].join(', ')})`);
  }
}
{
  const destaques = pecas.filter((p) => p.destaque);
  if (destaques.length > 1) falhar(CONTEUDO, `há ${destaques.length} peças com "destaque: true" — a capa tem um destaque só: ${destaques.map((p) => p.slug).join(', ')}`);

  /* ------------------------------------------------- a capa tem foto
   * REGRA DO DONO, 24/09/2026: a notícia principal NUNCA pode ser uma sem
   * imagem real. A capa é a primeira coisa que alguém vê do Instituto, e arte
   * gerada por algoritmo entrega o que o site é — um projeto com pouca
   * produção — antes de o texto ter chance.
   *
   * Vale para o destaque explícito aqui, e para o automático em
   * `conteudo/index.ts › destaque()`, que também passou a preferir quem tem
   * foto. As duas pontas, porque marcar `destaque: true` é opcional e sem a
   * segunda a regra cairia calada no dia em que ninguém marcasse nada.
   *
   * ⚠️ Isto NÃO afrouxa a regra da licença: imagem real continua exigindo
   * crédito e licença declarados (`press`, `cc-by`, `cedida`, `propria`). Se
   * não houver imagem licenciável para a peça, ela não pode ser o destaque —
   * o jeito de cumprir a regra é escolher outro destaque, nunca republicar o
   * que não se pode. */
  const semFoto = destaques.filter((p) => !p.imagem);
  if (semFoto.length > 0) {
    falhar(
      join(CONTEUDO, semFoto[0]!.secao, `${semFoto[0]!.data}-${semFoto[0]!.slug}.md`),
      'a notícia principal não pode ser uma sem imagem real. Consiga a imagem de imprensa da ' +
        'fonte (com crédito e licença) ou mova o "destaque: true" para outra peça — nunca ' +
        'republique imagem sem licença para cumprir esta regra.',
    );
  }

  const fixos = pecas.filter((p) => p.fixo);
  if (fixos.length > 1) falhar(CONTEUDO, `há ${fixos.length} artigos com "fixo: true" — o slot de artigo da capa é um só: ${fixos.map((p) => p.slug).join(', ')}`);
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

/* ------------------------------------------- as imagens de compartilhamento
 * Só o que falta ou envelheceu é renderizado; o caminho comum não abre o
 * navegador. Cada alvo é uma página HTML com o CSS do site e o SVG a 1200×630
 * (preserveAspectRatio="slice" corta a arte 3:2 na proporção do cartão).
 */
type Alvo = { saida: string; html: string; largura: number; altura: number };

const CSS_ARTE = [readFileSync(join(RAIZ, 'design', 'tokens.css'), 'utf8'), readFileSync(join(RAIZ, 'design', 'components.css'), 'utf8')].join('\n');
const mtime = (p: string) => (existsSync(p) ? statSync(p).mtimeMs : -1);
const envelheceu = (saida: string, ...fontes: string[]) => !existsSync(saida) || fontes.some((f) => mtime(f) > mtime(saida));

function paginaDeArte(svg: string, largura: number, altura: number): string {
  const svgMedido = svg.replace(/<svg\b/, `<svg width="${largura}" height="${altura}" style="display:block"`);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS_ARTE}
html,body{margin:0;padding:0;background:transparent}</style></head><body>${svgMedido}</body></html>`;
}

const alvos: Alvo[] = [];
mkdirSync(OG, { recursive: true });
mkdirSync(ICONES, { recursive: true });

for (const p of pecas) {
  if (p.imagem) continue;
  const saida = join(OG, `${p.secao}-${p.slug}.png`);
  if (p.arte) {
    if (envelheceu(saida, join(ARTE, p.arte))) alvos.push({ saida, html: paginaDeArte(artes[p.arte]!, 1200, 630), largura: 1200, altura: 630 });
  } else if (!existsSync(saida)) {
    alvos.push({ saida, html: paginaDeArte(gerarCapa(p.slug, true).svg, 1200, 630), largura: 1200, altura: 630 });
  }
}

/* a imagem padrão do site: a logo negativa sobre o azul das capas, com a linha de propósito */
{
  const saida = join(OG, 'padrao.png');
  const logo = join(PUBLICO, 'marca', 'logo-horizontal-negativo.svg');
  const fonte = join(PUBLICO, 'fontes', 'newsreader-latin.woff2');
  if (envelheceu(saida, logo)) {
    alvos.push({
      saida,
      largura: 1200,
      altura: 630,
      html: `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Newsreader;src:url("${pathToFileURL(fonte).href}") format("woff2");font-weight:200 800}
html,body{margin:0;padding:0}
body{width:1200px;height:630px;background:#0a2540;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:44px;font-family:Newsreader,Georgia,serif}
img{width:860px;display:block}
p{margin:0;color:#c7d3e6;font-size:34px;font-weight:400;letter-spacing:-0.01em}
</style></head><body><img src="${pathToFileURL(logo).href}" alt=""><p>O que o setor de automação publica lá fora, lido daqui.</p></body></html>`,
    });
  }
}

/* os ícones PNG: apple-touch-icon e manifesto, do ícone quadrado da marca */
{
  const icone = join(PUBLICO, 'marca', 'icone-quadrado.svg');
  for (const t of [180, 192, 512]) {
    const saida = join(ICONES, `icone-${t}.png`);
    if (envelheceu(saida, icone)) {
      alvos.push({ saida, largura: t, altura: t, html: `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}img{display:block;width:${t}px;height:${t}px}</style></head><body><img src="${pathToFileURL(icone).href}" alt=""></body></html>` });
    }
  }
}

async function renderizar(alvos: Alvo[]) {
  if (!alvos.length) return;
  const { chromium } = await import('playwright');
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({ deviceScaleFactor: 1 });
  const temp = join(tmpdir(), `ia-og-${process.pid}.html`);
  for (const a of alvos) {
    writeFileSync(temp, a.html, 'utf8');
    await pagina.setViewportSize({ width: a.largura, height: a.altura });
    await pagina.goto(pathToFileURL(temp).href, { waitUntil: 'load' });
    await pagina.evaluate(() => document.fonts.ready);
    await pagina.screenshot({ path: a.saida, clip: { x: 0, y: 0, width: a.largura, height: a.altura }, omitBackground: a.saida.includes('icones') });
  }
  await navegador.close();
}
await renderizar(alvos);

/* ----------------------------------------------------------------- a CSP */
const TEMA_SCRIPT_HASH = createHash('sha256').update(TEMA_SCRIPT).digest('base64');

/* --------------------------------------------------------------- a escrita */

const modulo = `/* eslint-disable */
/**
 * GERADO por scripts/compilar.ts — NÃO EDITE.
 *
 * O conteúdo mora em conteudo/**.md. Este arquivo é a versão compilada que
 * entra no bundle do Worker. Editar aqui é perder a edição no próximo build.
 *
 * ${pecas.length} peça(s) · ${autores.length} autor(es) · ${Object.keys(artes).length} arte(s) · ${pecas.filter((p) => p.imagem).length} imagem(ns) · gerado em ${new Date().toISOString()}
 */
import type { Autor, Peca } from './conteudo/tipos';

export const PECAS: readonly Peca[] = ${JSON.stringify(pecas, null, 2)};

export const AUTORES: readonly Autor[] = ${JSON.stringify(autores, null, 2)};

export const ARTES: Readonly<Record<string, string>> = ${JSON.stringify(artes, null, 2)};

/** SHA-256 (base64) do único script inline do site — a CSP só o libera por este hash. */
export const TEMA_SCRIPT_HASH = ${JSON.stringify(TEMA_SCRIPT_HASH)};
`;

mkdirSync(dirname(SAIDA), { recursive: true });
writeFileSync(SAIDA, modulo, 'utf8');

const porSecao = SECOES.map((s) => `${s} ${pecas.filter((p) => p.secao === s).length}`).join(' · ');
console.log(`✓ ${pecas.length} peça(s) compiladas (${porSecao}) · ${autores.length} autor(es) · ${Object.keys(artes).length} arte(s) · ${pecas.filter((p) => p.imagem).length} imagem(ns) · ${alvos.length} PNG(s) renderizado(s)`);

/* A regra branda, visível em toda compilação: imagem real SEMPRE que houver
   uma licenciável. Não aborta — nem toda fonte oferece material de imprensa —,
   mas o número na tela impede que "depois eu pego a foto" vire permanente. */
{
  const noticiasSemFoto = pecas.filter((p) => p.secao === 'noticias' && !p.imagem);
  if (noticiasSemFoto.length > 0) {
    console.log(`  ⚠ ${noticiasSemFoto.length} notícia(s) sem imagem real (arte gerada no lugar):`);
    for (const p of noticiasSemFoto) console.log(`      ${p.data} ${p.slug}`);
  }
}
console.log(`→ ${SAIDA.replace(RAIZ, '.')}`);
