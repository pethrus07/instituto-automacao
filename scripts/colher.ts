/**
 * A COLHEITA — tempo 1 dos três (ver docs/FUNCIONAMENTO.md).
 *
 *   npm run colher              colhe e atualiza a pauta
 *   npm run colher -- --dias 7  só o que a fonte publicou nos últimos N dias
 *
 * Máquina, local, sem IA, custo zero. Busca cada fonte, obedece o
 * `robots.txt`, deduplica por URL canônica, tira HTML do resumo e normaliza a
 * data. Não sobe nada para lugar nenhum e não chama modelo nenhum.
 *
 * ⚠️ O LEDGER MARCA NA LAVRA, NÃO NA COLHEITA — e essa é a decisão que faz o
 * agendamento ser seguro.
 *
 * A primeira versão marcava o item como visto assim que o colhia. Parecia
 * óbvio e estava errado: com a colheita rodando por tarefa agendada, um item
 * colhido às 7h de terça entrava como "visto" e sumia da pauta antes de
 * qualquer pessoa ter olhado para ele. A automação destruiria em silêncio
 * exatamente o que ela existe para preservar.
 *
 * Então são dois arquivos, e a diferença entre eles é o ponto:
 *
 *   pendentes.json  o que foi colhido e AINDA NÃO foi lido. Só cresce.
 *   lidos.json      o que já passou pelos nossos olhos. Só `npm run lavrado`
 *                   escreve aqui.
 *
 * `pauta.md` é a vista renderizada de `pendentes.json`, refeita a cada
 * colheita. É o arquivo que se lê, e ele acumula até alguém sentar. Se a
 * pauta estiver com 800 itens, isso não é um bug — é a informação de que
 * ficamos duas semanas sem lavrar.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerFeed } from '../src/coletor/feed.ts';
import { lerRobots } from '../src/coletor/robots.ts';
import { ehIndice, lerIndiceSitemaps, lerSitemapNoticias } from '../src/coletor/sitemap.ts';
import { canonicalizar } from '../src/coletor/url.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA = join(RAIZ, 'colheita');
const PENDENTES = join(PASTA, 'pendentes.json');
const LIDOS = join(PASTA, 'lidos.json');
const PAUTA = join(PASTA, 'pauta.md');

/** ASCII, sempre. Byte alto em cabeçalho HTTP vira 403 em alguns servidores. */
const UA =
  'InstitutoAutomacaoBot/0.2 (+https://institutoautomacao.com.br/transparencia; leitura editorial)';

const TEMPO_LIMITE_MS = 20_000;

const args = process.argv.slice(2);
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

/** A lista de fontes é dado curado, não configuração de script. */
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

/* ---------------------------------------------------------------- ledgers */

export type Pendente = {
  titulo: string;
  resumo: string | null;
  publicado: string | null;
  fonte: string;
  pessoa: string | null;
  papel: string | null;
  pais: string;
  idioma: string;
  nucleo: string | null;
  colhido_em: string;
};

type Pendentes = Record<string, Pendente>; // url canônica → item

function lerJson<T>(caminho: string, vazio: T, rotulo: string): T {
  if (!existsSync(caminho)) return vazio;
  try {
    return JSON.parse(readFileSync(caminho, 'utf8')) as T;
  } catch {
    /* Ledger corrompido não pode travar a colheita. No pior caso a gente relê
       o que já tinha lido — chato, e não é perda. Perder um item que nunca
       apareceu para ninguém, sim, seria. */
    console.warn(`  aviso: ${rotulo} ilegível, começando do zero`);
    return vazio;
  }
}

/* ------------------------------------------------------------------ coleta */

type Colhido = { fonte: Fonte; novos: number; total: number; erro: string | null; recusado: boolean };

async function colherFonte(
  f: Fonte,
  pendentes: Pendentes,
  lidos: Record<string, string>,
): Promise<Colhido> {
  const base: Colhido = { fonte: f, novos: 0, total: 0, erro: null, recusado: false };

  const rb = await lerRobots(f.url_feed, UA);
  if (rb.permite !== true) return { ...base, recusado: true, erro: rb.motivo };

  // Crawl-delay é pedido da fonte, e vale mesmo numa varredura de leitura.
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
  const agora = new Date().toISOString();

  let novos = 0;
  for (const e of entradas) {
    const canonica = canonicalizar(e.link, f.url_site);
    if (!canonica) continue;
    if (corte && e.publicado && Date.parse(e.publicado) < corte) continue;
    if (canonica in lidos || canonica in pendentes) continue;

    pendentes[canonica] = {
      titulo: e.titulo,
      resumo: e.resumo,
      publicado: e.publicado,
      fonte: f.nome,
      pessoa: f.pessoa,
      papel: f.pessoa_papel,
      pais: f.pais,
      idioma: f.idioma,
      nucleo: f.nucleo,
      colhido_em: agora,
    };
    novos++;
  }

  return { ...base, novos, total: entradas.length };
}

/* -------------------------------------------------------------- a escrita */

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

/**
 * A pauta é feita para ser lida por gente, de cima para baixo — e isso não é
 * capricho. O tempo 2 é alguém sentar e ler. Um despejo de JSON é tecnicamente
 * correto e ninguém lê; o que não é lido não vira peça.
 */
export function escreverPauta(pendentes: Pendentes, recusadas: Colhido[], erros: Colhido[]): string {
  const itens = Object.entries(pendentes);
  const l: string[] = [];

  const maisAntigo = itens.reduce<string | null>(
    (m, [, p]) => (m === null || p.colhido_em < m ? p.colhido_em : m),
    null,
  );
  const espera = maisAntigo
    ? Math.round((Date.now() - Date.parse(maisAntigo)) / 86400000)
    : 0;

  l.push('# Pauta aberta');
  l.push('');
  l.push(
    `**${itens.length} ${itens.length === 1 ? 'item esperando' : 'itens esperando'} leitura**` +
      (espera > 0 ? ` · o mais antigo há ${espera} ${espera === 1 ? 'dia' : 'dias'}` : '') +
      ` · atualizado em ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
  );
  l.push('');
  l.push('> Esta pauta **acumula até alguém sentar**. Ela não se esvazia sozinha:');
  l.push('> `npm run lavrado` é que marca tudo como lido, e só depois de a gente');
  l.push('> ter passado o olho. Pauta grande não é defeito — é a informação de');
  l.push('> quanto tempo faz que não lavramos.');
  l.push('>');
  l.push('> As vozes vêm primeiro de propósito: uma pessoa escrevendo com o nome');
  l.push('> dela costuma render mais pauta do que dez manchetes de redação.');

  /* Agrupa por fonte, vozes na frente, e dentro de cada uma o mais recente
     no topo. Item sem data vai para o fim: fingir uma data para poder ordenar
     estragaria a leitura. */
  const porFonte = new Map<string, [string, Pendente][]>();
  for (const par of itens) {
    const chave = par[1].pessoa ?? par[1].fonte;
    if (!porFonte.has(chave)) porFonte.set(chave, []);
    porFonte.get(chave)!.push(par);
  }

  const grupos = [...porFonte.entries()].sort((a, b) => {
    const vozA = a[1][0]![1].pessoa ? 0 : 1;
    const vozB = b[1][0]![1].pessoa ? 0 : 1;
    if (vozA !== vozB) return vozA - vozB;
    return a[1].length - b[1].length; // fonte enxuta antes da barulhenta
  });

  for (const [chave, lista] of grupos) {
    lista.sort((a, b) => (b[1].publicado ?? '').localeCompare(a[1].publicado ?? ''));
    const p = lista[0]![1];

    l.push('');
    l.push('---');
    l.push('');
    l.push(p.pessoa ? `## ${p.pessoa} · voz` : `## ${chave}`);
    const meta = [
      p.papel,
      `${p.pais} · ${p.idioma}`,
      p.nucleo ?? 'sem núcleo',
      `${lista.length} ${lista.length === 1 ? 'item' : 'itens'}`,
    ].filter(Boolean);
    l.push(`*${meta.join(' — ')}*`);
    l.push('');

    for (const [url, it] of lista) {
      l.push(`### ${it.titulo}`);
      l.push(`\`${quando(it.publicado)}\` · <${url}>`);
      if (it.resumo) {
        l.push('');
        l.push(it.resumo);
      }
      l.push('');
    }
  }

  if (recusadas.length || erros.length) {
    l.push('');
    l.push('---');
    l.push('');
    l.push('## O que não entrou nesta colheita');
    l.push('');
    for (const c of recusadas) l.push(`- **${c.fonte.nome}** — ${c.erro}`);
    for (const c of erros) l.push(`- ${c.fonte.nome} — ${c.erro}`);
    l.push('');
  }

  return l.join('\n');
}

/* -------------------------------------------------------------------- main */

const fontes = carregarFontes();
const pendentes = lerJson<Pendentes>(PENDENTES, {}, 'pendentes.json');
const lidos = lerJson<Record<string, string>>(LIDOS, {}, 'lidos.json');
const antes = Object.keys(pendentes).length;

console.log(
  `Colhendo ${fontes.length} fontes${DIAS ? ` · últimos ${DIAS} dia(s)` : ''}` +
    ` · ${antes} já na pauta\n`,
);

const colhidos: Colhido[] = [];
for (const f of fontes) {
  try {
    const c = await colherFonte(f, pendentes, lidos);
    colhidos.push(c);
    const marca = c.recusado ? 'robots' : c.erro ?? (c.novos > 0 ? `+${c.novos}` : '—');
    console.log(`  ${c.erro ? '✗' : '✓'} ${f.nome.slice(0, 40).padEnd(42)} ${marca}`);
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    colhidos.push({ fonte: f, novos: 0, total: 0, erro, recusado: false });
    console.log(`  ✗ ${f.nome.slice(0, 40).padEnd(42)} ${erro}`);
  }
}

mkdirSync(PASTA, { recursive: true });
writeFileSync(PENDENTES, JSON.stringify(pendentes, null, 0), 'utf8');
writeFileSync(
  PAUTA,
  escreverPauta(
    pendentes,
    colhidos.filter((c) => c.recusado),
    colhidos.filter((c) => c.erro && !c.recusado),
  ),
  'utf8',
);

const depois = Object.keys(pendentes).length;
console.log(`\n${depois - antes} novos · ${depois} na pauta · ${Object.keys(lidos).length} já lidos`);
console.log(`\n→ ${PAUTA.replace(RAIZ, '.')}`);
