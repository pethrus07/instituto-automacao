/**
 * Quanto cada fonte publica por semana — medido no feed, não no banco.
 *
 *   npm run cadencia
 *
 * O banco NÃO serve para esta conta: o coletor guarda no máximo 25 entradas
 * por busca (`ENTRADAS_POR_FONTE`), então fonte de volume alto aparece lá
 * truncada e fonte de volume baixo aparece com a janela inteira do feed. Um
 * número tirado dali diria mais sobre o nosso teto que sobre a fonte.
 *
 * Aqui a medida é o feed inteiro: quantas entradas ele traz e quantos dias
 * elas cobrem. `itens ÷ dias × 7` é a cadência semanal da fonte.
 *
 * Serve para uma decisão concreta: o Instituto não pode publicar tudo o que
 * coleta, e precisa saber de onde vem o volume antes de escolher o que
 * cortar. Sem isto, "o radar está poluído" é impressão; com isto, é número.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerFeed } from '../src/coletor/feed.ts';
import { lerRobots } from '../src/coletor/robots.ts';
import { lerSitemapNoticias } from '../src/coletor/sitemap.ts';

const UA =
  'InstitutoAutomacaoBot/0.1 (+https://institutoautomacao.com.br/transparencia; radar de automacao)';

type Fonte = {
  nome: string;
  url_feed: string;
  pais: string;
  eixo: 'voz' | 'redacao';
  colheita: 'feed' | 'sitemap';
  tipo: string;
};

/** As fontes vêm do banco local — a lista é dado, não configuração do script. */
function carregarFontes(): Fonte[] {
  /* Chama o wrangler pelo entrypoint em node_modules, com o mesmo node que
     está rodando: `npx` no Windows é um .cmd, e execFileSync sem shell não
     o encontra. Mesmo caminho que o qa/verificar.mjs usa. */
  const wrangler = join(dirname(fileURLToPath(import.meta.url)), '..', 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const saida = execFileSync(
    process.execPath,
    [
      wrangler, 'd1', 'execute', 'instituto', '--local', '--json', '--command',
      `SELECT nome, url_feed, pais, tipo, colheita,
              CASE WHEN pessoa IS NOT NULL THEN 'voz' ELSE 'redacao' END eixo
         FROM fonte WHERE ativo = 1 AND url_feed IS NOT NULL ORDER BY nome`,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return JSON.parse(saida.slice(saida.indexOf('[')))[0].results as Fonte[];
}

const fontes = carregarFontes();
console.log(`Medindo ${fontes.length} fontes ativas…`);

type Medida = Fonte & { itens: number; dias: number; semana: number; nota: string };
const medidas: Medida[] = [];

for (const f of fontes) {
  try {
    const rb = await lerRobots(f.url_feed, UA);
    if (rb.permite !== true) {
      medidas.push({ ...f, itens: 0, dias: 0, semana: 0, nota: 'robots recusa' });
      continue;
    }
    const r = await fetch(f.url_feed, {
      headers: { 'user-agent': UA, accept: 'application/rss+xml, application/atom+xml, application/xml' },
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) {
      medidas.push({ ...f, itens: 0, dias: 0, semana: 0, nota: `HTTP ${r.status}` });
      continue;
    }
    const xml = await r.text();
    const entradas = f.colheita === 'sitemap' ? lerSitemapNoticias(xml) : lerFeed(xml);
    const datas = entradas
      .map((e) => (e.publicado ? Date.parse(e.publicado) : NaN))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);

    if (datas.length < 2) {
      medidas.push({ ...f, itens: entradas.length, dias: 0, semana: 0, nota: 'sem data utilizável' });
      continue;
    }

    /* Janela do feed: da entrada mais antiga à mais nova. Fonte que publica
       em rajada (arXiv despeja o dia inteiro de uma vez) fica com janela
       curta e cadência alta — e é isso mesmo: ela publica muito. */
    const dias = (datas[datas.length - 1]! - datas[0]!) / 86400000;
    const semana = dias > 0.5 ? (datas.length * 7) / dias : datas.length * 7;
    medidas.push({
      ...f,
      itens: entradas.length,
      dias,
      semana,
      nota: dias > 0.5 ? '' : 'rajada — feed inteiro no mesmo dia',
    });
  } catch (e) {
    medidas.push({ ...f, itens: 0, dias: 0, semana: 0, nota: e instanceof Error ? e.message : 'erro' });
  }
}

medidas.sort((a, b) => b.semana - a.semana);

console.log(
  '\n' + 'FONTE'.padEnd(34) + 'EIXO'.padEnd(9) + 'PAIS'.padEnd(5) + 'ITENS'.padStart(6) +
    'JANELA'.padStart(9) + 'POR SEM'.padStart(9) + '  NOTA',
);
console.log('-'.repeat(96));
for (const m of medidas) {
  console.log(
    m.nome.slice(0, 33).padEnd(34) +
      m.eixo.padEnd(9) +
      m.pais.padEnd(5) +
      String(m.itens).padStart(6) +
      (m.dias ? m.dias.toFixed(1) + 'd' : '—').padStart(9) +
      (m.semana ? m.semana.toFixed(0) : '—').padStart(9) +
      (m.nota ? '  ' + m.nota : ''),
  );
}

const soma = (f: (m: Medida) => boolean) =>
  medidas.filter(f).reduce((t, m) => t + m.semana, 0);
const conta = (f: (m: Medida) => boolean) => medidas.filter(f).length;

console.log('-'.repeat(96));
console.log(`TOTAL: ${conta(() => true)} fontes · ${soma(() => true).toFixed(0)} itens por semana\n`);

console.log('POR EIXO E ORIGEM'.padEnd(34) + 'FONTES'.padStart(8) + 'POR SEM'.padStart(10));
for (const [rotulo, filtro] of [
  ['redação · fora do Brasil', (m: Medida) => m.eixo === 'redacao' && m.pais !== 'BR'],
  ['redação · Brasil', (m: Medida) => m.eixo === 'redacao' && m.pais === 'BR'],
  ['voz · fora do Brasil', (m: Medida) => m.eixo === 'voz' && m.pais !== 'BR'],
  ['voz · Brasil', (m: Medida) => m.eixo === 'voz' && m.pais === 'BR'],
] as [string, (m: Medida) => boolean][]) {
  console.log(rotulo.padEnd(34) + String(conta(filtro)).padStart(8) + soma(filtro).toFixed(0).padStart(10));
}

console.log('\nPOR TIPO DE FONTE'.padEnd(35) + 'FONTES'.padStart(8) + 'POR SEM'.padStart(10));
for (const tipo of [...new Set(medidas.map((m) => m.tipo))].sort()) {
  const f = (m: Medida) => m.tipo === tipo;
  console.log(tipo.padEnd(34) + String(conta(f)).padStart(8) + soma(f).toFixed(0).padStart(10));
}
