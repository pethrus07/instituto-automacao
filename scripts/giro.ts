/**
 * ESCREVER O GIRO DA SEMANA — o boletim, gerado dos dados.
 *
 *   npm run giro -- --homolog              ensaio: mostra o texto, não grava
 *   npm run giro -- --homolog --gravar     grava conteudo/giro/AAAA-MM-DD-giro-sNN.md
 *   npm run giro -- 2026-s38 --homolog     uma semana específica
 *
 * Gera o arquivo; NÃO publica. Publicar continua sendo `npm run compilar` e
 * deploy — o git segue sendo o CMS, e o boletim entra nele como qualquer
 * texto, com data, autor declarado e histórico.
 *
 * As mesmas três travas do dossiê valem aqui, e pelo mesmo motivo: o banco é
 * escolhido e impresso, semana aberta exige --parcial, e semana sem item
 * nenhum aborta em vez de virar um boletim que diz "zero" por engano.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BANCOS, RAIZ, colherSemana, resolverJanela, type QualBanco } from './dados-da-semana.ts';
import { redigirGiro } from '../src/giro/redigir.ts';
import { auditarNumeros } from '../src/giro/auditar.ts';

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const alvo = args.find((a) => !a.startsWith('--'));

const qual: QualBanco = flag('producao') ? 'producao' : flag('homolog') ? 'homolog' : 'local';
const GRAVAR = flag('gravar');

const janela = resolverJanela(alvo);
if (!janela) {
  console.error(`✗ "${alvo}" não é uma semana válida (ex.: 2026-s38)`);
  process.exit(1);
}

const aberta = new Date(janela.fim).getTime() > Date.now();
if (aberta && !flag('parcial')) {
  console.error(`✗ ${janela.slug} (${janela.rotulo}) ainda não fechou.`);
  console.error('  O Giro cobre a semana FECHADA; boletim de dados que ainda vão mudar vira correção depois.');
  process.exit(1);
}

console.log(`· ${janela.slug} · ${janela.rotulo}`);
console.log(`· banco: ${BANCOS[qual].rotulo}${aberta ? ' · SEMANA ABERTA (parcial)' : ''}`);

const dados = colherSemana(janela, qual);

if (dados.itens === 0) {
  console.error(`\n✗ nenhum item de imprensa em ${janela.slug} no ${BANCOS[qual].rotulo}.`);
  console.error('  Semana zerada com fontes ativas é banco desatualizado, não semana fraca —');
  console.error('  e um boletim escrito em cima dela PASSA na auditoria, porque ela confere a');
  console.error('  prosa contra a apuração, não a apuração contra o mundo.');
  if (qual === 'local') console.error('  O cron contínuo escreve na borda: npm run giro -- --homolog');
  process.exit(1);
}

const g = redigirGiro(dados);

/* A auditoria roda AQUI também, e não só no compilador: melhor descobrir na
   geração do que num build que aborta meia hora depois. */
const auditoria = auditarNumeros(`${g.titulo}\n${g.lead}\n${g.corpo}`, g.numeros);
if (!auditoria.passou) {
  console.error(`\n✗ o boletim usou números que a apuração não tem: ${auditoria.inventados.join(', ')}`);
  console.error('  É defeito do gerador (src/giro/redigir.ts), não do dado. Não grave.');
  process.exit(1);
}

const dataArquivo = new Date(janela.fim).toISOString().slice(0, 10);
const nome = `${dataArquivo}-giro-${janela.slug.replace('-', '')}.md`;

const frontmatter = [
  '---',
  'secao: giro',
  'formato: giro',
  'tema: industria',
  `titulo: "${g.titulo}"`,
  `titulo_curto: "${g.tituloCurto}"`,
  `lead: "${g.lead.replace(/"/g, "'")}"`,
  `data: ${dataArquivo}`,
  'gerado: true',
  `numeros: ${g.numeros.join(', ')}`,
  '---',
  '',
].join('\n');

const texto = frontmatter + g.corpo + '\n';

console.log('');
console.log('─'.repeat(72));
console.log(texto);
console.log('─'.repeat(72));
console.log(`· ${auditoria.usados.length} inteiros na prosa, todos apurados`);

if (!GRAVAR) {
  console.log('\n· ensaio: nada foi gravado. Para valer:');
  console.log(`    npm run giro -- ${janela.slug} --${qual} --gravar`);
  process.exit(0);
}

const pasta = join(RAIZ, 'conteudo', 'giro');
mkdirSync(pasta, { recursive: true });
const arquivo = join(pasta, nome);
if (existsSync(arquivo) && !flag('refazer')) {
  console.error(`\n✗ ${nome} já existe. Para sobrescrever: --refazer`);
  console.error('  Boletim publicado que muda de conteúdo sem aviso é correção silenciosa.');
  process.exit(1);
}
writeFileSync(arquivo, texto, 'utf8');
console.log(`\n✓ ${arquivo.replace(RAIZ, '.')}`);
console.log('  Agora: npm run compilar && npm run deploy:homolog');
