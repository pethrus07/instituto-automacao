/**
 * A COLHEITA — tempo 1 dos três (ver docs/FUNCIONAMENTO.md).
 *
 *   npm run colher              só o que é novo desde a última vez
 *   npm run colher -- --tudo    ignora o livro de vistos
 *   npm run colher -- --dias 3  só o que a fonte publicou nos últimos N dias
 *
 * Máquina, local, sem IA, custo zero. Busca cada fonte, obedece o
 * `robots.txt`, deduplica por URL canônica, tira HTML do resumo e normaliza a
 * data. Não sobe nada para lugar nenhum e não chama modelo nenhum.
 *
 * ⚠️ O ARQUIVO DE SAÍDA É FEITO PARA SER LIDO POR GENTE, e isso não é
 * capricho: o tempo 2 é alguém sentar e ler a colheita inteira. Um despejo de
 * JSON com 500 objetos é tecnicamente correto e ninguém lê — e o que não é
 * lido não vira peça. Por isso: agrupado por fonte, ordenado por data, resumo
 * limpo, e o novo separado do repetido.
 *
 * O LIVRO DE VISTOS é o que faz a segunda colheita mostrar 40 linhas em vez de
 * 500. Guarda só a URL canônica e a data em que foi vista — metadado nosso,
 * não conteúdo de terceiro, e por isso vai para o git.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerFeed, type EntradaFeed } from '../src/coletor/feed.ts';
import { lerRobots } from '../src/coletor/robots.ts';
import { ehIndice, lerIndiceSitemaps, lerSitemapNoticias } from '../src/coletor/sitemap.ts';
import { canonicalizar } from '../src/coletor/url.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA = join(RAIZ, 'colheita');
const VISTOS = join(PASTA, 'vistos.json');

/** ASCII, sempre. Byte alto em cabeçalho HTTP vira 403 em alguns servidores. */
const UA =
  'InstitutoAutomacaoBot/0.2 (+https://institutoautomacao.com.br/transparencia; leitura editorial)';

const TEMPO_LIMITE_MS = 20_000;

/* ------------------------------------------------------------ argumentos */

const args = process.argv.slice(2);
const TUDO = args.includes('--tudo');
const DIAS = (() => {
  const i = args.indexOf('--dias');
  const n = i >= 0 ? Number(args[i + 1]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
})();

/* ----------------------------------------------------------------- fontes */

type Fonte = {
  id: string;
  nome: string;
  url_feed: string;
  url_site: string;
  idioma: string;
  pais: string;
  nucleo: string | null;
  tipo: string;
  colheita: 'feed' | 'sitemap';
  pessoa: string | null;
  pessoa_papel: string | null;
};

/**
 * As fontes vêm do D1 local. É o único uso de banco aqui, e é leitura: a
 * lista de fontes é dado curado, não configuração de script.
 */
function carregarFontes(): Fonte[] {
  const wrangler = join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const saida = execFileSync(
    process.execPath,
    [
      wrangler, 'd1', 'execute', 'instituto', '--local', '--json', '--command',
      `SELECT id, nome, url_feed, url_site, idioma, pais, nucleo, tipo, colheita,
              pessoa, pessoa_papel
         FROM fonte
        WHERE ativo = 1 AND url_feed IS NOT NULL AND licenca <> 'bloqueada'
        ORDER BY (pessoa IS NULL), nome`,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return JSON.parse(saida.slice(saida.indexOf('[')))[0].results as Fonte[];
}

/* --------------------------------------------------------- livro de vistos */

type Vistos = Record<string, string>; // url canônica → data ISO em que foi vista

function lerVistos(): Vistos {
  if (!existsSync(VISTOS)) return {};
  try {
    return JSON.parse(readFileSync(VISTOS, 'utf8')) as Vistos;
  } catch {
    // Livro corrompido não pode travar a colheita — no pior caso a gente relê
    // o que já tinha lido, que é chato e não é perda.
    console.warn('  aviso: vistos.json ilegível, começando do zero');
    return {};
  }
}

/* ------------------------------------------------------------------ coleta */

type Achado = EntradaFeed & { canonica: string; novo: boolean };
type Colhido = { fonte: Fonte; achados: Achado[]; erro: string | null; recusado: boolean };

async function colherFonte(f: Fonte, vistos: Vistos): Promise<Colhido> {
  const base: Colhido = { fonte: f, achados: [], erro: null, recusado: false };

  const rb = await lerRobots(f.url_feed, UA);
  if (rb.permite !== true) return { ...base, recusado: true, erro: rb.motivo };

  // O Crawl-delay é pedido da fonte, e vale mesmo numa varredura de leitura.
  if (rb.atraso) await new Promise((r) => setTimeout(r, Math.min(rb.atraso! * 1000, 15_000)));

  const eSitemap = f.colheita === 'sitemap';
  const r = await fetch(f.url_feed, {
    headers: {
      'user-agent': UA,
      accept: eSitemap
        ? 'application/xml, text/xml'
        : 'application/rss+xml, application/atom+xml, application/xml, text/xml',
    },
    signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
  });
  if (!r.ok) return { ...base, erro: `HTTP ${r.status}` };

  let xml = await r.text();
  if (eSitemap && ehIndice(xml)) {
    const filho = lerIndiceSitemaps(xml)[0];
    if (!filho) return { ...base, erro: 'índice de sitemaps sem filhos' };
    const r2 = await fetch(filho, {
      headers: { 'user-agent': UA, accept: 'application/xml, text/xml' },
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
    if (!r2.ok) return { ...base, erro: `HTTP ${r2.status} no sitemap filho` };
    xml = await r2.text();
  }

  const entradas = eSitemap ? lerSitemapNoticias(xml) : lerFeed(xml);
  const corte = DIAS ? Date.now() - DIAS * 86400000 : null;

  const achados: Achado[] = [];
  for (const e of entradas) {
    const canonica = canonicalizar(e.link, f.url_site);
    if (!canonica) continue;
    if (corte && e.publicado && Date.parse(e.publicado) < corte) continue;
    achados.push({ ...e, canonica, novo: !(canonica in vistos) });
  }

  // Mais recente primeiro. Item sem data vai para o fim: não dá para ordenar
  // o que não se sabe quando aconteceu, e fingir uma data estragaria a leitura.
  achados.sort((a, b) => (b.publicado ?? '').localeCompare(a.publicado ?? ''));
  return { ...base, achados };
}

/* ------------------------------------------------------------- a escrita */

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function quando(iso: string | null): string {
  if (!iso) return 'sem data';
  const d = new Date(iso);
  const horas = (Date.now() - d.getTime()) / 3600000;
  if (horas < 24) return `há ${Math.max(1, Math.round(horas))} h`;
  const dias = Math.round(horas / 24);
  if (dias <= 6) return `há ${dias} d`;
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
}

function escreverColheita(colhidos: Colhido[], soNovos: boolean): string {
  const l: string[] = [];
  const agora = new Date();
  const carimbo = agora.toISOString().slice(0, 16).replace('T', ' ');

  const comAchados = colhidos.filter((c) => c.achados.some((a) => a.novo || !soNovos));
  const novos = colhidos.reduce((t, c) => t + c.achados.filter((a) => a.novo).length, 0);
  const recusados = colhidos.filter((c) => c.recusado);
  const erros = colhidos.filter((c) => c.erro && !c.recusado);

  l.push(`# Colheita · ${carimbo} UTC`);
  l.push('');
  l.push(
    `**${novos} itens novos** de ${comAchados.length} fontes` +
      (DIAS ? ` · janela de ${DIAS} dia(s)` : '') +
      (soNovos ? '' : ' · mostrando também o que já foi visto'),
  );
  l.push('');
  l.push('> Leia de cima para baixo e marque o que vale virar peça. As vozes vêm');
  l.push('> primeiro de propósito: uma pessoa escrevendo com o nome dela costuma');
  l.push('> render mais pauta do que dez manchetes de redação.');
  l.push('');
  l.push('---');

  for (const c of colhidos) {
    const lista = soNovos ? c.achados.filter((a) => a.novo) : c.achados;
    if (lista.length === 0) continue;

    l.push('');
    const quem = c.fonte.pessoa
      ? `## ${c.fonte.pessoa} · voz`
      : `## ${c.fonte.nome}`;
    l.push(quem);
    const meta = [
      c.fonte.pessoa_papel,
      `${c.fonte.pais} · ${c.fonte.idioma}`,
      c.fonte.nucleo ?? 'sem núcleo',
      `${lista.length} ${lista.length === 1 ? 'item' : 'itens'}`,
    ].filter(Boolean);
    l.push(`*${meta.join(' — ')}*`);
    l.push('');

    for (const a of lista) {
      l.push(`### ${a.titulo}`);
      l.push(`\`${quando(a.publicado)}\` · <${a.canonica}>`);
      if (a.resumo) {
        l.push('');
        l.push(a.resumo);
      }
      l.push('');
    }
    l.push('---');
  }

  if (recusados.length || erros.length) {
    l.push('');
    l.push('## O que não entrou');
    l.push('');
    for (const c of recusados) l.push(`- **${c.fonte.nome}** — ${c.erro}`);
    for (const c of erros) l.push(`- ${c.fonte.nome} — ${c.erro}`);
    l.push('');
  }

  return l.join('\n');
}

/* -------------------------------------------------------------------- main */

const fontes = carregarFontes();
const vistos = TUDO ? {} : lerVistos();
console.log(`Colhendo ${fontes.length} fontes${DIAS ? ` · últimos ${DIAS} dia(s)` : ''}…\n`);

const colhidos: Colhido[] = [];
for (const f of fontes) {
  try {
    const c = await colherFonte(f, vistos);
    colhidos.push(c);
    const n = c.achados.filter((a) => a.novo).length;
    const marca = c.recusado ? 'robots' : c.erro ? c.erro : n > 0 ? `${n} novos` : '—';
    console.log(`  ${c.erro ? '✗' : '✓'} ${f.nome.slice(0, 40).padEnd(42)} ${marca}`);
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    colhidos.push({ fonte: f, achados: [], erro, recusado: false });
    console.log(`  ✗ ${f.nome.slice(0, 40).padEnd(42)} ${erro}`);
  }
}

mkdirSync(PASTA, { recursive: true });

const texto = escreverColheita(colhidos, !TUDO);
const arquivo = join(PASTA, `${new Date().toISOString().slice(0, 10)}.md`);
writeFileSync(arquivo, texto, 'utf8');

/* O livro de vistos só é atualizado DEPOIS de a colheita ser escrita. Se o
   processo morrer no meio, o pior caso é reler — nunca perder um item que
   ficou marcado como visto sem nunca ter aparecido para ninguém. */
const novosVistos: Vistos = TUDO ? lerVistos() : vistos;
const hoje = new Date().toISOString();
let marcados = 0;
for (const c of colhidos) {
  for (const a of c.achados) {
    if (!(a.canonica in novosVistos)) {
      novosVistos[a.canonica] = hoje;
      marcados++;
    }
  }
}
writeFileSync(VISTOS, JSON.stringify(novosVistos, null, 0), 'utf8');

const novos = colhidos.reduce((t, c) => t + c.achados.filter((a) => a.novo).length, 0);
console.log(`\n${novos} novos · ${marcados} entraram no livro de vistos`);
console.log(`\n→ ${arquivo.replace(RAIZ, '.')}`);
