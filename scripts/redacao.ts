/**
 * A REDAÇÃO — o que faz o Instituto publicar notícia sozinho, todo dia.
 *
 *   npm run redacao -- candidatas [--quantos 8]     a pauta do dia, já sem o que saiu
 *   npm run redacao -- fonte <url> <slug>            lê a matéria e baixa a thumb
 *   npm run redacao -- conferir [arquivo.md ...]     a revisão; sem argumento, as notícias novas
 *   npm run redacao -- destaque <arquivo.md>         põe a notícia na manchete da capa
 *   npm run redacao -- descartar <url> "<motivo>"    tira da pauta para não voltar
 *
 * 14/10/2026, decisão do Pedro: "as notícias devem ir sozinhas para lá,
 * passando pelo seu crivo de qualidade, inclusive a thumb e a notícia
 * principal". Quem escreve é a rotina diária descrita em docs/REDACAO.md; este
 * script é o que ela usa para escolher, ler e — principalmente — ser
 * reprovada. A rotina pode escrever bem ou mal; o que vai ao ar é só o que
 * passa no `conferir`, no compilador, nos testes e no QA, nessa ordem.
 *
 * Não precisa de credencial nenhuma: a pauta vem de /pauta.json, que é
 * público, e o que se lê da fonte é a página que qualquer leitor abre.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { lerRobots } from '../src/coletor/robots.ts';
import { numerosDe } from '../src/giro/auditar.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOTICIAS = join(RAIZ, 'conteudo', 'noticias');
const IMAGENS = join(RAIZ, 'publico', 'imagens');
const LEITURAS = join(RAIZ, 'colheita', 'redacao');
const DESCARTADAS = join(RAIZ, 'conteudo', 'descartadas.txt');
const SITE = process.env.SITE ?? 'https://institutoautomacao.com.br';
const UA = 'InstitutoAutomacaoBot/0.3 (+https://institutoautomacao.com.br/blueprints; leitura editorial)';
export const AUTOR = 'Redação do Instituto';

const [comando, ...resto] = process.argv.slice(2);
const valor = (n: string) => {
  const i = resto.indexOf(`--${n}`);
  return i >= 0 ? resto[i + 1] : undefined;
};
const semBarra = (u: string) => u.replace(/[?#].*$/, '').replace(/\/$/, '');

/* ===================================================== o que já saiu ====== */

function urlsPublicadas(): Set<string> {
  const s = new Set<string>();
  for (const nome of existsSync(NOTICIAS) ? readdirSync(NOTICIAS) : []) {
    const m = /^\s+url:\s*(\S+)/m.exec(readFileSync(join(NOTICIAS, nome), 'utf8'));
    if (m) s.add(semBarra(m[1]!));
  }
  if (existsSync(DESCARTADAS)) {
    for (const l of readFileSync(DESCARTADAS, 'utf8').split('\n')) {
      const u = l.split(/\s+/)[0];
      if (u && /^https?:/.test(u)) s.add(semBarra(u));
    }
  }
  return s;
}

/* ===================================================== candidatas ========= */

type Candidato = {
  assunto_id: string | null; titulo: string; url: string; fonte: string; pais: string; idioma: string;
  publicado: string; fontes: number; br: number; atraso: number | null; urls: string;
};

/* A MESMA fórmula da pauta de sábado (scripts/pauta.ts), publicada lá e em
   /blueprints: 3 por fonte que falou do assunto, +2 se lá fora falou e o
   Brasil não, +1 se é imprensa brasileira; desempate pelo mais recente. */
const pontos = (c: Candidato) => 3 * c.fontes + (c.pais !== 'BR' && c.br === 0 ? 2 : 0) + (c.pais === 'BR' ? 1 : 0);

async function candidatas(quantos: number): Promise<(Candidato & { pontos: number })[]> {
  const r = await fetch(`${SITE}/pauta.json?dias=${valor('dias') ?? 7}`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`/pauta.json respondeu ${r.status}`);
  const { itens } = (await r.json()) as { itens: Candidato[] };
  const saiu = urlsPublicadas();
  return itens
    .filter((c) => !c.urls.split(' ').some((u) => saiu.has(semBarra(u))))
    .map((c) => ({ ...c, pontos: pontos(c) }))
    .sort((a, b) => b.pontos - a.pontos || b.publicado.localeCompare(a.publicado))
    .slice(0, quantos);
}

/* ===================================================== ler a fonte ======== */

function decodificar(s: string): string {
  const ent: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', hellip: '…' };
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (t, n) => ent[n.toLowerCase()] ?? t);
}

function meta(h: string, nome: string): string | undefined {
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${nome}["'][^>]*content=["']([^"']+)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${nome}["']`, 'i');
  const v = re1.exec(h)?.[1] ?? re2.exec(h)?.[1];
  return v ? decodificar(v) : undefined;
}

function textoDe(h: string): string {
  let corpo = h
    .replace(/<(script|style|nav|header|footer|aside|form|svg|noscript|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  const bloco = /<article\b[\s\S]*?<\/article>/i.exec(corpo)?.[0] ?? /<main\b[\s\S]*?<\/main>/i.exec(corpo)?.[0];
  if (bloco) corpo = bloco;
  return decodificar(
    corpo
      .replace(/<\/(p|h[1-6]|li|blockquote|div|section|figcaption)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<(h[1-6])\b[^>]*>/gi, '\n\n## ')
      .replace(/<li\b[^>]*>/gi, '\n- ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function lerFonte(url: string, slug: string) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('slug em minúsculas, com hífen');
  const rb = await lerRobots(url, UA);
  if (rb.permite !== true) throw new Error(`o robots.txt não permite ler este caminho (${rb.motivo}) — descarte a pauta`);

  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new Error(`a fonte respondeu HTTP ${r.status}`);
  const html = await r.text();
  const texto = textoDe(html);
  const palavras = texto.split(/\s+/).length;
  if (palavras < 150) throw new Error(`a página trouxe só ${palavras} palavras — paywall, vídeo ou página que não é matéria; descarte`);

  const titulo = meta(html, 'og:title') ?? decodificar(/<title>([^<]+)<\/title>/i.exec(html)?.[1] ?? '').trim();
  const publicado = meta(html, 'article:published_time') ?? meta(html, 'og:published_time') ?? null;
  const site = meta(html, 'og:site_name') ?? null;

  /* A thumb: a og:image da matéria, que é a imagem que o próprio veículo
     escolheu para representar a notícia. Vai para jpg, no máximo 1600 px de
     largura, e precisa de 700 px no mínimo (a The Robot Report publica 770) — imagem pequena esticada na
     manchete da capa é pior que nenhuma. */
  const og = meta(html, 'og:image:secure_url') ?? meta(html, 'og:image') ?? meta(html, 'twitter:image');
  let imagem: { arquivo: string; largura: number; altura: number; kb: number } | null = null;
  let semImagem: string | null = null;
  if (!og) semImagem = 'a matéria não tem og:image';
  else {
    const ri = await fetch(new URL(og, url).href, { headers: { 'user-agent': UA, referer: url }, signal: AbortSignal.timeout(30_000) });
    if (!ri.ok) semImagem = `a og:image respondeu HTTP ${ri.status}`;
    else {
      const bruto = Buffer.from(await ri.arrayBuffer());
      const m = await sharp(bruto).metadata();
      if (!m.width || m.width < 700) semImagem = `a og:image tem ${m.width ?? "?"} px de largura — o mínimo é 700`;
      else {
        const hoje = dataDeHoje();
        const arquivo = `${hoje}-${slug}.jpg`;
        mkdirSync(IMAGENS, { recursive: true });
        let qualidade = 84;
        let saida: Buffer;
        do {
          saida = await sharp(bruto).rotate().resize({ width: 1600, withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: qualidade, mozjpeg: true }).toBuffer();
          qualidade -= 8;
        } while (saida.length > 580_000 && qualidade > 40);
        writeFileSync(join(IMAGENS, arquivo), saida);
        const mm = await sharp(saida).metadata();
        imagem = { arquivo, largura: mm.width!, altura: mm.height!, kb: Math.round(saida.length / 1024) };
      }
    }
  }

  mkdirSync(LEITURAS, { recursive: true });
  const leitura = join(LEITURAS, `${slug}.md`);
  writeFileSync(leitura, `# ${titulo}\n\n<${url}>\n\nveículo: ${site ?? '?'} · publicado: ${publicado ?? '?'} · ${palavras} palavras\n\n---\n\n${texto}\n`, 'utf8');

  return { titulo, url, site, publicado, palavras, leitura: leitura.replace(RAIZ, '.'), imagem, semImagem };
}

function dataDeHoje(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

/* ===================================================== a revisão ========== */

type Achado = { arquivo: string; erros: string[]; avisos: string[] };

function lerNoticia(caminho: string) {
  const t = readFileSync(caminho, 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(t);
  if (!m) throw new Error('sem frontmatter');
  const fm = m[1]!;
  const campo = (n: string) => new RegExp(`^${n}:\\s*(.*)$`, 'm').exec(fm)?.[1]?.trim();
  const sub = (bloco: string, n: string) => {
    const b = new RegExp(`^${bloco}:\\n((?:[ \\t]+.*\\n?)+)`, 'm').exec(fm)?.[1] ?? '';
    return new RegExp(`^\\s+${n}:\\s*(.*)$`, 'm').exec(b)?.[1]?.trim();
  };
  return { fm, corpo: m[2]!.trim(), campo, sub };
}

/** As notícias que ainda não estão no git: o que a rotina escreveu agora. */
function noticiasNovas(): string[] {
  const saida = execFileSync('git', ['status', '--porcelain', '--', 'conteudo/noticias'], { cwd: RAIZ, encoding: 'utf8' });
  return saida
    .split('\n')
    /* Só arquivo NOVO. Notícia antiga modificada (a que perdeu a manchete no
       `destaque`) não é da redação de hoje e não tem leitura para conferir. */
    .filter((l) => /^(\?\?|A |AM)/.test(l))
    .map((l) => join(RAIZ, l.slice(3).trim()))
    .filter((f) => f.endsWith('.md'));
}

const PALAVRAS_EN = /\b(the|and|with|which|that|from|this|their|have|has|been|will|would|for)\b/gi;

export function revisar(caminho: string, textoDaFonte: string | null): Achado {
  const erros: string[] = [];
  const avisos: string[] = [];
  const n = lerNoticia(caminho);
  const titulo = n.campo('titulo') ?? '';
  const tituloCurto = n.campo('titulo_curto') ?? '';
  const lead = n.campo('lead') ?? '';

  /* --- quem e quando */
  if (n.campo('autor') !== AUTOR) erros.push(`autor tem de ser "${AUTOR}" — nome de pessoa só em texto que a pessoa leu`);
  if (n.campo('secao') !== 'noticias') erros.push('secao tem de ser noticias');
  const publicadoFonte = n.sub('fonte', 'publicado');
  if (publicadoFonte && Date.now() - Date.parse(publicadoFonte) > 10 * 86_400_000) erros.push(`a fonte é de ${publicadoFonte} — mais de 10 dias não é notícia`);

  /* --- tamanho: a notícia que cabe numa tela não diz o que muda; a de 1.500 palavras não é lida */
  if (titulo.length < 30 || titulo.length > 120) erros.push(`título com ${titulo.length} caracteres (30 a 120)`);
  if (!tituloCurto || tituloCurto.length > 53) erros.push(`titulo_curto ausente ou com mais de 53 caracteres (${tituloCurto.length})`);
  if (lead.length < 80 || lead.length > 320) erros.push(`lead com ${lead.length} caracteres (80 a 320)`);
  const palavras = n.corpo.split(/\s+/).filter(Boolean).length;
  if (palavras < 250 || palavras > 1000) erros.push(`corpo com ${palavras} palavras (250 a 1.000)`);

  /* --- a parte que é nossa */
  const muda = /^## O que isso muda aqui\s*\n([\s\S]*?)(?=\n## |(?![\s\S]))/m.exec(n.corpo)?.[1] ?? '';
  if (!muda) erros.push('falta a seção "## O que isso muda aqui" — é a razão de o site existir');
  else if (muda.trim().length < 400) erros.push(`"O que isso muda aqui" com ${muda.trim().length} caracteres — no mínimo 400, com um argumento de verdade`);
  if (!n.campo('veredito')) erros.push('falta o veredito');

  /* --- a thumb */
  const arquivo = n.sub('imagem', 'arquivo');
  if (!arquivo) erros.push('sem imagem — notícia automática sai com a thumb da fonte, ou não sai');
  else {
    const f = join(IMAGENS, arquivo);
    if (!existsSync(f)) erros.push(`a imagem ${arquivo} não está em publico/imagens/`);
    else if (statSync(f).size > 600_000) erros.push(`imagem com ${Math.round(statSync(f).size / 1024)} KB (teto 600)`);
    if (!n.sub('imagem', 'credito')) erros.push('imagem sem crédito');
    const alt = n.sub('imagem', 'alt') ?? '';
    if (alt.length < 30) erros.push('alt da imagem curto demais — descreva o que se vê');
    if (!['fonte', 'press'].includes(n.sub('imagem', 'licenca') ?? '')) erros.push('licença da thumb automática: fonte (ou press, se for material de imprensa)');
  }

  /* --- sobra de rascunho e de máquina */
  const tudo = `${titulo}\n${lead}\n${n.corpo}`;
  /* TODO e XXX em maiúscula só: "todo" é palavra do português. */
  if (/\b(TODO|PREENCHER|XXX)\b/.test(tudo) || /lorem ipsum|\[(inserir|fonte|link)\]/i.test(tudo)) erros.push('sobrou marcador de rascunho');
  if (/como (um )?modelo de linguagem|como uma IA|não tenho acesso|minha data de corte|\bclaro!|espero que (isso|isto) ajude/i.test(tudo)) erros.push('sobrou fala de assistente no texto');
  const semCitacao = n.corpo.replace(/\*[^*\n]+\*/g, ' ').replace(/"[^"\n]+"|“[^”\n]+”/g, ' ');
  const en = (semCitacao.match(PALAVRAS_EN) ?? []).length;
  if (en / Math.max(palavras, 1) > 0.015) erros.push(`${en} palavras em inglês fora de citação — a tradução ficou pela metade`);

  /* --- contra a fonte */
  if (!textoDaFonte) erros.push('não há leitura da fonte para conferir (rode o comando `fonte` antes)');
  else {
    /* Todo inteiro da notícia tem de estar na matéria original. É a mesma
       trava do Giro, contra a fonte em vez do dossiê: data por extenso, ano,
       versão e norma não contam (ver src/giro/auditar.ts). */
    const daFonte = new Set([...textoDaFonte.matchAll(/\d+/g)].map((m) => Number(m[0])));
    const inventados = [...new Set(numerosDe(tudo))].filter((x) => !daFonte.has(x));
    if (inventados.length) erros.push(`número que não está na fonte: ${inventados.join(', ')} — confira (conversão de unidade também reprova: use o número da fonte)`);

    /* Texto novo, não cópia: 10 palavras seguidas iguais às da fonte é trecho
       colado (em notícia de fonte brasileira, ou em inglês que não foi traduzido). */
    const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
    const f = norm(textoDaFonte);
    const sequencias = new Set<string>();
    for (let i = 0; i + 10 <= f.length; i++) sequencias.add(f.slice(i, i + 10).join(' '));
    const c = norm(semCitacao);
    for (let i = 0; i + 10 <= c.length; i++) {
      if (sequencias.has(c.slice(i, i + 10).join(' '))) {
        erros.push(`trecho copiado da fonte: "${c.slice(i, i + 10).join(' ')}…"`);
        break;
      }
    }
  }

  if (!/\*\*[^*]+\*\*/.test(n.corpo)) avisos.push('nenhum destaque em negrito — o leitor da capa lê na diagonal');
  return { arquivo: caminho.replace(RAIZ, '.'), erros, avisos };
}

function leituraDe(caminho: string): string | null {
  const nome = /\d{4}-\d{2}-\d{2}-(.+)\.md$/.exec(caminho)?.[1];
  const f = nome ? join(LEITURAS, `${nome}.md`) : '';
  return f && existsSync(f) ? readFileSync(f, 'utf8') : null;
}

/* ===================================================== a manchete ========= */

function porNaManchete(caminho: string) {
  for (const nome of readdirSync(NOTICIAS)) {
    const f = join(NOTICIAS, nome);
    const t = readFileSync(f, 'utf8');
    if (/^destaque:\s*true\s*$/m.test(t)) writeFileSync(f, t.replace(/^destaque:\s*true\s*\r?\n/m, ''), 'utf8');
  }
  const t = readFileSync(caminho, 'utf8');
  if (!/^imagem:/m.test(t)) throw new Error('a manchete precisa de imagem real');
  writeFileSync(caminho, t.replace(/^(veredito:.*\r?\n)/m, 'destaque: true\n$1'), 'utf8');
}

/* ===================================================== o comando ========== */

const executar = /(^|[\\/])redacao\.ts$/.test(process.argv[1] ?? '');

if (executar) {
  try {
    if (comando === 'candidatas') {
      const lista = await candidatas(Number(valor('quantos') ?? 8));
      if (resto.includes('--json')) console.log(JSON.stringify(lista, null, 2));
      else {
        if (!lista.length) console.log('Nenhuma pauta nova do setor — ou a coleta parou (confira /saude).');
        lista.forEach((c, i) =>
          console.log(`${i + 1}. [${c.pontos} pts] ${c.titulo}\n   ${c.fonte} (${c.idioma}) · ${c.fontes} fonte(s) · ${c.br ? 'já saiu no Brasil' : 'ainda não chegou ao Brasil'} · ${c.publicado.slice(0, 10)}\n   ${c.url}`),
        );
      }
    } else if (comando === 'fonte') {
      const [url, slug] = resto;
      if (!url || !slug) throw new Error('uso: npm run redacao -- fonte <url> <slug>');
      console.log(JSON.stringify(await lerFonte(url, slug), null, 2));
    } else if (comando === 'conferir') {
      const arquivos = resto.filter((a) => a.endsWith('.md')).map((a) => join(RAIZ, a.replace(/^\.\//, '')));
      const alvo = arquivos.length ? arquivos : noticiasNovas();
      if (!alvo.length) console.log('Nenhuma notícia nova para conferir.');
      let reprovadas = 0;
      for (const f of alvo) {
        const a = revisar(f, leituraDe(f));
        if (a.erros.length) reprovadas++;
        console.log(`${a.erros.length ? '✗' : '✓'} ${a.arquivo}`);
        for (const e of a.erros) console.log(`    ✗ ${e}`);
        for (const e of a.avisos) console.log(`    · ${e}`);
      }
      if (reprovadas) {
        console.log(`\n${reprovadas} reprovada(s). Corrija ou apague — reprovada não vai ao ar.`);
        process.exit(1);
      }
    } else if (comando === 'destaque') {
      if (!resto[0]) throw new Error('uso: npm run redacao -- destaque conteudo/noticias/<arquivo>.md');
      porNaManchete(join(RAIZ, resto[0].replace(/^\.\//, '')));
      console.log(`✓ manchete: ${resto[0]}`);
    } else if (comando === 'descartar') {
      const [url, ...motivo] = resto;
      if (!url) throw new Error('uso: npm run redacao -- descartar <url> "<motivo>"');
      const linha = `${url} ${dataDeHoje()} ${motivo.join(' ') || 'sem motivo'}\n`;
      writeFileSync(DESCARTADAS, (existsSync(DESCARTADAS) ? readFileSync(DESCARTADAS, 'utf8') : '# Pautas descartadas pela redação: a URL não volta para a pauta.\n') + linha, 'utf8');
      console.log(`✓ descartada: ${url}`);
    } else {
      console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n'));
      process.exit(comando ? 1 : 0);
    }
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }
}
