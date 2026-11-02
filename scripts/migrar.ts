/**
 * Aplica as migrações de `migracoes/` que ainda não rodaram neste banco.
 *
 *   npm run db:migrar                         banco local: aplica as pendentes
 *   npm run db:migrar -- --simular            só lista as pendentes, não muda nada
 *   npm run db:migrar -- --base               marca todas como aplicadas, sem rodar
 *   npm run db:migrar -- --env homolog        D1 remoto da homologação
 *   npm run db:migrar -- --env producao       D1 remoto da produção
 *
 * Existe porque o `db:migrar` antigo encadeava os 10 arquivos à mão, em três
 * cópias (local, homolog, produção) que já tinham divergido: a de homolog
 * parava na 009 e começava na 006. Migração nova exigia editar as três.
 *
 * Como sabe o que já rodou: a tabela `_migracao (nome, aplicada_em)`, criada
 * aqui mesmo. Cada arquivo aplicado ganha uma linha; o próximo `db:migrar`
 * pula o que já está lá. A ordem é a do nome do arquivo (001, 002, ...).
 *
 * ⚠️ Banco que já existia antes deste script não tem a tabela, e as migrações
 * antigas não são todas idempotentes. Na primeira vez rode `--base` (marca as
 * que o banco já tem) e só depois `db:migrar` para as novas. O `db:zero` já
 * faz o `--base` sozinho, porque schema + sementes + 007/008/010 equivalem a
 * todas as migrações até a 010.
 *
 * ⚠️ Remoto (`--env`) mexe no banco publicado. Rode `--simular` antes, e na
 * produção só com a cópia do banco de domingo em mãos.
 */
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pasta = join(raiz, 'migracoes');
const wrangler = join(raiz, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const args = process.argv.slice(2);
const simular = args.includes('--simular');
const base = args.includes('--base');
const iEnv = args.indexOf('--env');
const env = iEnv >= 0 ? args[iEnv + 1] : '';
const iPersist = args.indexOf('--persist-to');
const persist = iPersist >= 0 ? args[iPersist + 1] : '';

const BANCOS: Record<string, string[]> = {
  '': ['instituto', '--local'],
  homolog: ['instituto-homolog', '--remote', '--env', 'homolog'],
  producao: ['instituto', '--remote', '--env', 'producao'],
};
if (!(env in BANCOS)) {
  console.error(`--env desconhecido: "${env}". Use homolog ou producao (sem --env = local).`);
  process.exit(1);
}
const alvo = [...BANCOS[env], ...(persist && !env ? ['--persist-to', persist] : [])];
const nomeAlvo = env ? `D1 remoto (${env})` : 'banco local';

function d1(extra: string[]): string {
  return execFileSync(process.execPath, [wrangler, 'd1', 'execute', ...alvo, '--yes', ...extra], {
    cwd: raiz,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function consultar(sql: string): Record<string, unknown>[] {
  const saida = d1(['--json', '--command', sql]);
  const inicio = saida.indexOf('[');
  const blocos = JSON.parse(saida.slice(inicio)) as { results?: Record<string, unknown>[] }[];
  return blocos.flatMap((b) => b.results ?? []);
}

const arquivos = readdirSync(pasta)
  .filter((f) => /^\d{3}-.+\.sql$/.test(f))
  .sort();

if (simular) {
  // Sem escrever nada: se a tabela não existe, tudo está pendente.
  const existe = consultar("SELECT name FROM sqlite_master WHERE type='table' AND name='_migracao'").length > 0;
  const feitas = new Set(existe ? consultar('SELECT nome FROM _migracao').map((r) => String(r.nome)) : []);
  const pendentes = arquivos.filter((f) => !feitas.has(f));
  console.log(`${nomeAlvo}: ${feitas.size} aplicadas, ${pendentes.length} pendentes`);
  if (!existe) console.log('  sem a tabela _migracao: banco anterior a este script, rode --base primeiro');
  for (const f of pendentes) console.log(`  pendente  ${f}`);
  process.exit(0);
}

d1(['--command', 'CREATE TABLE IF NOT EXISTS _migracao (nome TEXT PRIMARY KEY, aplicada_em TEXT NOT NULL)']);
const feitas = new Set(consultar('SELECT nome FROM _migracao').map((r) => String(r.nome)));
const pendentes = arquivos.filter((f) => !feitas.has(f));

if (pendentes.length === 0) {
  console.log(`${nomeAlvo}: nada pendente (${feitas.size} aplicadas)`);
  process.exit(0);
}

for (const f of pendentes) {
  if (!base) {
    try {
      d1(['--file', join('migracoes', f)]);
    } catch (e) {
      const err = e as { stderr?: string; stdout?: string };
      console.error(`FALHOU ${f}: nada depois dela foi aplicado.`);
      console.error(String(err.stderr || err.stdout || e));
      process.exit(1);
    }
  }
  const nome = f.replace(/'/g, "''");
  d1(['--command', `INSERT INTO _migracao (nome, aplicada_em) VALUES ('${nome}', datetime('now'))`]);
  console.log(`${base ? 'marcada ' : 'aplicada'}  ${f}`);
}
console.log(`${nomeAlvo}: ${pendentes.length} ${base ? 'marcadas como aplicadas' : 'aplicadas'}`);
