/**
 * O DOSSIÊ da semana — os números do Giro, antes de qualquer texto.
 *
 *   npm run dossie              a semana que fechou no domingo
 *   npm run dossie -- 2026-s36  uma semana específica
 *
 * SQL puro, zero IA. O que entrou na semana, de onde, o que ficou com uma
 * fonte só, o relógio, a agenda — e as peças que saíram em conteudo/. Eu
 * escrevo o Giro em cima disto, e a auditoria confere depois que cada número
 * da prosa existe aqui.
 *
 * O dossiê vai para colheita/ (fora do git): é material de trabalho, não
 * publicação. O que se publica é o Giro escrito.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { janelaDoSlug, semanaFechada } from '../src/giro/semana.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const alvo = process.argv[2];
const janela = alvo ? janelaDoSlug(alvo) : semanaFechada();
if (!janela) {
  console.error(`✗ "${alvo}" não é uma semana válida (ex.: 2026-s36)`);
  process.exit(1);
}

function sql<T = Record<string, unknown>>(comando: string): T[] {
  const saida = execFileSync(
    process.execPath,
    [WRANGLER, 'd1', 'execute', 'instituto', '--local', '--json', '--command', comando.replace(/\s+/g, ' ')],
    { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return JSON.parse(saida.slice(saida.indexOf('[')))[0]?.results ?? [];
}

const { inicio, fim, slug, rotulo } = janela;
const q = (s: string) => `'${s}'`;

/* ---------------------------------------------------------------- o banco */
const totais = sql<{ itens: number; fontes: number; assuntos: number }>(
  `SELECT COUNT(*) itens, COUNT(DISTINCT i.fonte_id) fontes, COUNT(DISTINCT i.assunto_id) assuntos
     FROM item i JOIN fonte f ON f.id = i.fonte_id
    WHERE f.ativo = 1 AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}`,
)[0]!;

const porFonte = sql<{ nome: string; pessoa: string | null; pais: string; n: number }>(
  `SELECT f.nome, f.pessoa, f.pais, COUNT(*) n
     FROM item i JOIN fonte f ON f.id = i.fonte_id
    WHERE f.ativo = 1 AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}
    GROUP BY f.id ORDER BY n DESC`,
);

const repercutidos = sql<{ rotulo: string; fontes: number; chegou: number }>(
  `SELECT a.rotulo, COUNT(DISTINCT i.fonte_id) fontes,
          CASE WHEN a.primeira_mencao_br IS NULL THEN 0 ELSE 1 END chegou
     FROM assunto a JOIN item i ON i.assunto_id = a.id JOIN fonte f ON f.id = i.fonte_id
    WHERE f.ativo = 1 AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}
    GROUP BY a.id HAVING fontes >= 2 ORDER BY fontes DESC LIMIT 10`,
);

const sozinhos = sql<{ n: number }>(
  `SELECT COUNT(*) n FROM (
     SELECT a.id FROM assunto a JOIN item i ON i.assunto_id = a.id JOIN fonte f ON f.id = i.fonte_id
      WHERE f.ativo = 1 AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}
      GROUP BY a.id HAVING COUNT(DISTINCT i.fonte_id) = 1)`,
)[0]!.n;

const relogio = sql<{ medidos: number; mediana: number | null; nao_chegaram: number }>(
  `SELECT (SELECT COUNT(*) FROM assunto WHERE atraso_apurado_em >= ${q(inicio)} AND atraso_apurado_em < ${q(fim)}) medidos,
          (SELECT atraso_br_dias FROM assunto WHERE atraso_apurado_em >= ${q(inicio)} AND atraso_apurado_em < ${q(fim)}
              AND atraso_br_dias IS NOT NULL ORDER BY atraso_br_dias
              LIMIT 1 OFFSET (SELECT COUNT(*)/2 FROM assunto WHERE atraso_apurado_em >= ${q(inicio)} AND atraso_apurado_em < ${q(fim)} AND atraso_br_dias IS NOT NULL)) mediana,
          (SELECT COUNT(*) FROM assunto WHERE publicado_original >= ${q(inicio)} AND publicado_original < ${q(fim)} AND primeira_mencao_br IS NULL) nao_chegaram`,
)[0]!;

const agenda = sql<{ nome: string; slug: string; inicio: string; cidade: string | null; pais: string }>(
  `SELECT nome, slug, inicio, cidade, pais FROM evento
    WHERE status = 'publicado' AND inicio >= ${q(fim)} AND inicio < datetime(${q(fim)}, '+30 days')
    ORDER BY inicio LIMIT 8`,
);

/* -------------------------------------------------------------- as peças */
type Meta = { titulo: string; secao: string; data: string; slug: string };
const pecas: Meta[] = [];
for (const secao of ['noticias', 'relatorios']) {
  const pasta = join(RAIZ, 'conteudo', secao);
  if (!existsSync(pasta)) continue;
  for (const n of readdirSync(pasta).filter((x) => x.endsWith('.md'))) {
    const m = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/.exec(n);
    if (!m) continue;
    const data = m[1]!;
    if (data < inicio.slice(0, 10) || data >= fim.slice(0, 10)) continue;
    const texto = readFileSync(join(pasta, n), 'utf8');
    const titulo = /^titulo:\s*"?(.+?)"?\s*$/m.exec(texto)?.[1] ?? m[2]!;
    pecas.push({ titulo, secao, data, slug: m[2]! });
  }
}

/* -------------------------------------------------------------- a escrita */
const l: string[] = [];
l.push(`# Dossiê · ${slug} · ${rotulo}`);
l.push('');
l.push('> Os números da semana, por SQL. Escreva o Giro em cima disto — e só use');
l.push('> número que esteja aqui: a auditoria confere cada inteiro da prosa contra');
l.push('> este arquivo, e reprova o que não existir.');
l.push('');
l.push('## Totais');
l.push(`- itens colhidos: **${totais.itens}**`);
l.push(`- fontes que publicaram: **${totais.fontes}**`);
l.push(`- assuntos distintos: **${totais.assuntos}**`);
l.push(`- assuntos com uma fonte só: **${sozinhos}**`);
l.push('');
l.push('## O que repercutiu (2+ fontes independentes)');
if (repercutidos.length === 0) l.push('_Nenhum assunto foi coberto por duas fontes independentes nesta semana._');
for (const r of repercutidos) l.push(`- ${r.rotulo} — ${r.fontes} fontes${r.chegou ? ' · **já mencionado no Brasil**' : ''}`);
l.push('');
l.push('## O relógio');
l.push(`- atrasos apurados na semana: **${relogio.medidos}**`);
l.push(`- atraso mediano: **${relogio.mediana ?? '—'}**${relogio.mediana !== null ? ' dias' : ''}`);
l.push(`- assuntos da semana ainda sem menção brasileira: **${relogio.nao_chegaram}**`);
l.push('');
l.push('## Por fonte');
for (const f of porFonte) l.push(`- ${f.pessoa ?? f.nome} (${f.pais}): ${f.n}`);
l.push('');
l.push('## O que publicamos na semana');
if (pecas.length === 0) l.push('_Nenhuma peça com data nesta semana._');
for (const p of pecas.sort((a, b) => a.data.localeCompare(b.data))) l.push(`- ${p.data} · ${p.secao} · ${p.titulo} (/${p.secao}/${p.slug})`);
l.push('');
l.push('## Nos próximos 30 dias');
if (agenda.length === 0) l.push('_Nenhum evento publicado nesse intervalo._');
for (const e of agenda) l.push(`- ${e.inicio.slice(0, 10)} · ${e.nome}${e.cidade ? `, ${e.cidade}` : ''} · ${e.pais} (/agenda/${e.slug})`);
l.push('');
l.push('## Números permitidos na prosa');
const permitidos = new Set<number>([
  totais.itens, totais.fontes, totais.assuntos, sozinhos,
  relogio.medidos, relogio.nao_chegaram, pecas.length, agenda.length,
  ...(relogio.mediana !== null ? [relogio.mediana] : []),
  ...repercutidos.map((r) => r.fontes),
  ...porFonte.map((f) => f.n),
]);
l.push([...permitidos].sort((a, b) => a - b).join(', '));
l.push('');

const pasta = join(RAIZ, 'colheita');
mkdirSync(pasta, { recursive: true });
const arquivo = join(pasta, `dossie-${slug}.md`);
writeFileSync(arquivo, l.join('\n'), 'utf8');
console.log(l.slice(0, 14).join('\n'));
console.log(`\n→ ${arquivo.replace(RAIZ, '.')}`);
