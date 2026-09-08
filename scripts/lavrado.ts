/**
 * A LAVRA está feita — tempo 2 encerrado (ver docs/ARQUITETURA.md).
 *
 *   npm run lavrado             marca a pauta inteira como lida
 *   npm run lavrado -- --ver    só mostra o que seria marcado, sem marcar
 *
 * É o único lugar do sistema que escreve em `lidos.json`, e essa exclusividade
 * é o que torna a colheita agendada segura: por mais vezes que o `colher` rode
 * sozinho, nada sai da pauta sem alguém rodar isto.
 *
 * **Marcar a pauta inteira é o comportamento certo, não uma simplificação.**
 * Numa lavra a gente lê a pauta toda e escolhe duas coisas — as outras não
 * ficaram por ler, ficaram *lidas e descartadas*, que é uma decisão editorial
 * tão real quanto publicar. Exigir marcar item a item transformaria a decisão
 * mais comum na mais trabalhosa.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA = join(RAIZ, 'colheita');
const PENDENTES = join(PASTA, 'pendentes.json');
const LIDOS = join(PASTA, 'lidos.json');
const PAUTA = join(PASTA, 'pauta.md');

const SO_VER = process.argv.includes('--ver');

function lerJson<T>(caminho: string, vazio: T): T {
  if (!existsSync(caminho)) return vazio;
  try {
    return JSON.parse(readFileSync(caminho, 'utf8')) as T;
  } catch {
    return vazio;
  }
}

type Pendente = { titulo: string; fonte: string; pessoa: string | null };
const pendentes = lerJson<Record<string, Pendente>>(PENDENTES, {});
const lidos = lerJson<Record<string, string>>(LIDOS, {});

const chaves = Object.keys(pendentes);
if (chaves.length === 0) {
  console.log('A pauta já está vazia.');
  process.exit(0);
}

/* Um resumo por fonte antes de marcar: é a última chance de perceber que a
   pauta tinha 200 itens de uma fonte que ninguém abriu. */
const porFonte = new Map<string, number>();
for (const p of Object.values(pendentes)) {
  const chave = p.pessoa ?? p.fonte;
  porFonte.set(chave, (porFonte.get(chave) ?? 0) + 1);
}
for (const [nome, n] of [...porFonte.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${nome}`);
}
console.log(`  ${'-'.repeat(4)}`);
console.log(`  ${String(chaves.length).padStart(4)}  total`);

if (SO_VER) {
  console.log('\n--ver: nada foi marcado.');
  process.exit(0);
}

const agora = new Date().toISOString();
for (const url of chaves) lidos[url] = agora;

writeFileSync(LIDOS, JSON.stringify(lidos, null, 0), 'utf8');
writeFileSync(PENDENTES, JSON.stringify({}, null, 0), 'utf8');
writeFileSync(
  PAUTA,
  `# Pauta aberta\n\n**Nada esperando leitura.**\n\n` +
    `Última lavra em ${agora.slice(0, 16).replace('T', ' ')} UTC — ` +
    `${chaves.length} ${chaves.length === 1 ? 'item lido' : 'itens lidos'}.\n\n` +
    `A próxima colheita repovoa este arquivo. \`npm run colher\`\n`,
  'utf8',
);

console.log(`\n${chaves.length} itens marcados como lidos · ${Object.keys(lidos).length} no total.`);
