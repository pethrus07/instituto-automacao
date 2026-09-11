/**
 * O DOSSIÊ da semana — os números do Giro, antes de qualquer texto.
 *
 *   npm run dossie                          a semana que fechou no domingo
 *   npm run dossie -- 2026-s36              uma semana específica
 *   npm run dossie -- --homolog             lê o D1 da homologação (onde o cron vive)
 *   npm run dossie -- 2026-s37 --parcial    uma semana que ainda não fechou
 *
 * SQL puro, zero IA. O que entrou na semana, de onde, o que ficou com uma
 * fonte só, o relógio, a agenda — e as peças que saíram em conteudo/. Eu
 * escrevo o Giro em cima disto, e a auditoria confere depois que cada número
 * da prosa existe aqui.
 *
 * O dossiê vai para colheita/ (fora do git): é material de trabalho, não
 * publicação. O que se publica é o Giro escrito.
 *
 * ---------------------------------------------------------------------------
 * QUAL BANCO RESPONDE — 11/09/2026, e custou um Giro.
 *
 * Este script lia `instituto --local` cravado. Só que o coletor contínuo roda
 * no CRON DA BORDA, que escreve no D1 da homologação; o banco local só tem o
 * que uma colheita manual deixou lá. Em 11/09 o local estava parado desde
 * 04/09 e o dossiê da s37 saiu com ZERO itens — enquanto o homolog tinha 406.
 * Um dossiê zerado não parece defeito: parece uma semana fraca, e o Giro
 * escrito em cima dele passaria na auditoria, porque a auditoria confere a
 * prosa contra o dossiê e não o dossiê contra o mundo.
 *
 * Daí as três travas abaixo: o banco é escolhido e IMPRESSO, a semana aberta
 * exige --parcial, e dossiê sem item nenhum aborta em vez de ser publicado.
 * ---------------------------------------------------------------------------
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { janelaDoSlug, semanaFechada } from '../src/giro/semana.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const args = process.argv.slice(2);
const flag = (nome: string) => args.includes(`--${nome}`);
const alvo = args.find((a) => !a.startsWith('--'));

/**
 * Os três bancos possíveis, com os argumentos exatos do wrangler.
 *
 * `producao` ainda não existe (o database_id é placeholder até o acesso do
 * sócio chegar); fica aqui para que o dia da virada seja trocar uma flag e
 * não editar este arquivo com pressa.
 */
const BANCOS = {
  local: { nome: 'instituto', args: ['--local'], rotulo: 'D1 local (colheita manual)' },
  homolog: { nome: 'instituto-homolog', args: ['--remote', '--env', 'homolog'], rotulo: 'D1 da homologação (cron da borda)' },
  producao: { nome: 'instituto', args: ['--remote'], rotulo: 'D1 de produção' },
} as const;

const qualBanco = flag('producao') ? 'producao' : flag('homolog') ? 'homolog' : 'local';
const BANCO = BANCOS[qualBanco];

const janela = alvo ? janelaDoSlug(alvo) : semanaFechada();
if (!janela) {
  console.error(`✗ "${alvo}" não é uma semana válida (ex.: 2026-s36)`);
  process.exit(1);
}

/* Semana que ainda não fechou: dá para olhar, não dá para publicar. */
const aberta = new Date(janela.fim).getTime() > Date.now();
if (aberta && !flag('parcial')) {
  const fecha = new Date(janela.fim).toISOString().slice(0, 10);
  console.error(`✗ ${janela.slug} (${janela.rotulo}) ainda não fechou — a janela vai até ${fecha}.`);
  console.error('  O Giro cobre a semana FECHADA; um balanço de dados que ainda vão mudar');
  console.error('  vira correção depois de publicado.');
  console.error(`  Para espiar mesmo assim: npm run dossie -- ${janela.slug} --parcial`);
  process.exit(1);
}

function sql<T = Record<string, unknown>>(comando: string): T[] {
  const saida = execFileSync(
    process.execPath,
    [WRANGLER, 'd1', 'execute', BANCO.nome, ...BANCO.args, '--json', '--command', comando.replace(/\s+/g, ' ')],
    { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return JSON.parse(saida.slice(saida.indexOf('[')))[0]?.results ?? [];
}

const { inicio, fim, slug, rotulo } = janela;
const q = (s: string) => `'${s}'`;

/* ---------------------------------------------------------------- o banco */
console.log(`· ${slug} · ${rotulo}`);
console.log(`· banco: ${BANCO.rotulo}${aberta ? ' · SEMANA ABERTA (parcial)' : ''}`);

const totais = sql<{ itens: number; fontes: number; assuntos: number }>(
  `SELECT COUNT(*) itens, COUNT(DISTINCT i.fonte_id) fontes, COUNT(DISTINCT i.assunto_id) assuntos
     FROM item i JOIN fonte f ON f.id = i.fonte_id
    WHERE f.ativo = 1 AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}`,
)[0]!;

/* Zero item com 21 fontes ativas é banco errado, não semana fraca. */
if (totais.itens === 0) {
  const ultimo = sql<{ u: string | null }>('SELECT MAX(publicado_fonte) u FROM item')[0]?.u ?? 'nunca';
  console.error(`\n✗ nenhum item em ${slug} no ${BANCO.rotulo}.`);
  console.error(`  O item mais recente desse banco é de ${ultimo}.`);
  console.error('  Com 21 fontes ativas, semana zerada é banco desatualizado — e um Giro');
  console.error('  escrito em cima dele PASSA na auditoria, porque ela confere a prosa');
  console.error('  contra o dossiê, não o dossiê contra o mundo.');
  if (qualBanco === 'local') console.error('  O cron contínuo escreve na borda: npm run dossie -- --homolog');
  process.exit(1);
}

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
/* A procedência fica no arquivo: daqui a um mês ninguém lembra de qual banco
   saiu, e dossiê sem procedência é número sem origem. */
l.push(`Apurado em ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ${BANCO.rotulo}.`);
if (aberta) {
  l.push('');
  l.push('> **PARCIAL — esta semana ainda não fechou.** Serve para olhar, não para');
  l.push('> publicar: os números abaixo ainda vão subir. Rode de novo depois do');
  l.push('> domingo e escreva o Giro em cima do dossiê fechado.');
}
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
