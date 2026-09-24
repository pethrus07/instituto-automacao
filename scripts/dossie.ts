/**
 * O DOSSIÊ da semana — os mesmos números do Giro, em forma de conferência.
 *
 *   npm run dossie                          a semana que fechou no domingo
 *   npm run dossie -- 2026-s38              uma semana específica
 *   npm run dossie -- --homolog             lê o D1 da homologação (onde o cron vive)
 *   npm run dossie -- 2026-s39 --parcial    uma semana que ainda não fechou
 *
 * SQL puro, zero IA. O que entrou na semana, de onde, o que ficou com uma
 * fonte só, o relógio, a agenda — e o que o Instituto publicou.
 *
 * ---------------------------------------------------------------------------
 * PARA QUE ISTO SERVE, DEPOIS QUE O GIRO VIROU AUTOMÁTICO (24/09/2026)
 *
 * O boletim publicado é gerado sozinho (`npm run giro`). O dossiê continua
 * existindo para OLHAR a semana antes e depois: conferir se um número está
 * estranho, ver a distribuição por fonte que o boletim não mostra, decidir o
 * que virar notícia. É material de trabalho, e por isso vai para colheita/,
 * fora do git.
 *
 * ⚠️ Os dois leem a MESMA função (`colherSemana`, em dados-da-semana.ts). Não
 * é economia de linha: duas cópias da consulta divergem na primeira vez que
 * alguém mexe numa delas, e aí a conferência interna deixa de conferir o que
 * foi publicado. Neste projeto isso já aconteceu duas vezes.
 *
 * ---------------------------------------------------------------------------
 * AS TRÊS TRAVAS — 11/09/2026, e custaram um Giro
 *
 * Este script lia `instituto --local` cravado. Só que o coletor contínuo roda
 * no CRON DA BORDA, que escreve no D1 da homologação; o banco local só tem o
 * que uma colheita manual deixou lá. Em 11/09 o local estava parado desde
 * 04/09 e o dossiê da s37 saiu com ZERO itens — enquanto o homolog tinha 406.
 * Um dossiê zerado não parece defeito: parece uma semana fraca.
 *
 * Daí: o banco é escolhido e IMPRESSO, a semana aberta exige --parcial, e
 * dossiê sem item nenhum aborta.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BANCOS, RAIZ, colherSemana, numerosPermitidos, resolverJanela, type QualBanco } from './dados-da-semana.ts';

const args = process.argv.slice(2);
const flag = (nome: string) => args.includes(`--${nome}`);
const alvo = args.find((a) => !a.startsWith('--'));

const qual: QualBanco = flag('producao') ? 'producao' : flag('homolog') ? 'homolog' : 'local';

const janela = resolverJanela(alvo);
if (!janela) {
  console.error(`✗ "${alvo}" não é uma semana válida (ex.: 2026-s38)`);
  process.exit(1);
}

const aberta = new Date(janela.fim).getTime() > Date.now();
if (aberta && !flag('parcial')) {
  const fecha = new Date(janela.fim).toISOString().slice(0, 10);
  console.error(`✗ ${janela.slug} (${janela.rotulo}) ainda não fechou — a janela vai até ${fecha}.`);
  console.error('  O Giro cobre a semana FECHADA; um balanço de dados que ainda vão mudar');
  console.error('  vira correção depois de publicado.');
  console.error(`  Para espiar mesmo assim: npm run dossie -- ${janela.slug} --parcial`);
  process.exit(1);
}

console.log(`· ${janela.slug} · ${janela.rotulo}`);
console.log(`· banco: ${BANCOS[qual].rotulo}${aberta ? ' · SEMANA ABERTA (parcial)' : ''}`);

const d = colherSemana(janela, qual);

/* Zero item com fontes ativas é banco errado, não semana fraca. */
if (d.itens === 0) {
  console.error(`\n✗ nenhum item de imprensa em ${janela.slug} no ${BANCOS[qual].rotulo}.`);
  console.error('  Semana zerada com fontes ativas é banco desatualizado — e um Giro escrito');
  console.error('  em cima dela PASSA na auditoria, porque ela confere a prosa contra a');
  console.error('  apuração, não a apuração contra o mundo.');
  if (qual === 'local') console.error('  O cron contínuo escreve na borda: npm run dossie -- --homolog');
  process.exit(1);
}

/* -------------------------------------------------------------- a escrita */

const l: string[] = [];
l.push(`# Dossiê · ${janela.slug} · ${janela.rotulo}`);
l.push('');
l.push('> Os números da semana, por SQL — os MESMOS que o boletim publicado usa.');
l.push('> Serve para olhar: conferir um número estranho, ver a distribuição por');
l.push('> fonte, decidir o que vira notícia.');
l.push('');
/* A procedência fica no arquivo: daqui a um mês ninguém lembra de qual banco
   saiu, e dossiê sem procedência é número sem origem. */
l.push(`Apurado em ${d.apuradoEm} UTC · ${d.banco}.`);
if (aberta) {
  l.push('');
  l.push('> **PARCIAL — esta semana ainda não fechou.** Serve para olhar, não para');
  l.push('> publicar: os números abaixo ainda vão subir.');
}
l.push('');
l.push('## Totais');
l.push(`- itens do SETOR (é o que o boletim conta): **${d.itens}**`);
l.push(`- tecnologia geral, à parte: **${d.contexto}**`);
l.push(`- fórum e rede social, à parte: **${d.comunidade}**`);
l.push(`- fontes que publicaram: **${d.fontes}**`);
l.push(`- assuntos distintos: **${d.assuntos}**`);
l.push(`- assuntos com uma fonte só: **${d.sozinhos}**`);
l.push('');
l.push('## O que repercutiu (2+ fontes independentes)');
if (d.repercutidos.length === 0) l.push('_Nenhum assunto foi coberto por duas fontes independentes nesta semana._');
for (const r of d.repercutidos) l.push(`- ${r.rotulo} — ${r.fontes} fontes${r.chegou ? ' · **já mencionado no Brasil**' : ''}`);
l.push('');
l.push('## O relógio');
l.push(`- atrasos apurados na semana: **${d.relogio.medidos}**`);
l.push(`- atraso mediano: **${d.relogio.mediana ?? '—'}**${d.relogio.mediana !== null ? ' dias' : ''}`);
l.push(`- assuntos da semana ainda sem menção brasileira: **${d.relogio.nao_chegaram}**`);
l.push('');
l.push('## Por fonte');
for (const f of d.porFonte) {
  const papel = f.tipo === 'forum' || f.tipo === 'social' ? ' · comunidade' : f.papel === 'contexto' ? ' · contexto' : '';
  l.push(`- ${f.pessoa ?? f.nome} (${f.pais})${papel}: ${f.n}`);
}
l.push('');
l.push('## O que publicamos na semana');
if (d.pecas.length === 0) l.push('_Nenhum texto com data nesta semana._');
for (const p of d.pecas) l.push(`- ${p.data} · ${p.secao} · ${p.titulo} (/${p.secao}/${p.slug})`);
l.push('');
l.push('## Nos próximos 30 dias');
if (d.agenda.length === 0) l.push('_Nenhum evento publicado nesse intervalo._');
for (const e of d.agenda) l.push(`- ${e.inicio.slice(0, 10)} · ${e.nome}${e.cidade ? `, ${e.cidade}` : ''} · ${e.pais} (/agenda/${e.slug})`);
l.push('');
l.push('## Números apurados');
l.push(numerosPermitidos(d).join(', '));
l.push('');

const pasta = join(RAIZ, 'colheita');
mkdirSync(pasta, { recursive: true });
const arquivo = join(pasta, `dossie-${janela.slug}.md`);
writeFileSync(arquivo, l.join('\n'), 'utf8');
console.log(l.slice(0, 14).join('\n'));
console.log(`\n→ ${arquivo.replace(RAIZ, '.')}`);
