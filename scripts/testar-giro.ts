/**
 * Teste da semana ISO e da auditoria de números. Sem Worker, sem rede.
 *
 *   npm test
 *
 * Os dois pedaços que ninguém revisa lendo:
 *   · a SEMANA, porque erro de fronteira de calendário aparece uma vez por
 *     ano, sempre no fim de dezembro, sempre quando ninguém está olhando;
 *   · a AUDITORIA, porque é ela que impede o Giro de publicar um número que
 *     não existe no dossiê — e uma auditoria frouxa é pior que nenhuma,
 *     porque parece auditoria.
 */
import { auditarNumeros, numerosDe } from '../src/giro/auditar.ts';
import { redigirGiro } from '../src/giro/redigir.ts';
import { janelaDe, janelaDoSlug, semanaFechada } from '../src/giro/semana.ts';

let ok = 0;
let falhou = 0;

function conferir(nome: string, real: unknown, esperado: unknown) {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) {
    ok++;
    console.log(`  ok   ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHA ${nome}\n        esperado: ${b}\n        veio:     ${a}`);
  }
}

/* ==================================================== a semana ISO ====== */
console.log('A semana');

const j = janelaDe(new Date(Date.UTC(2026, 7, 24)));
conferir('começa na segunda 00:00 UTC', j.inicio, '2026-08-24T00:00:00.000Z');
conferir('termina na segunda seguinte, exclusivo', j.fim, '2026-08-31T00:00:00.000Z');
conferir('o rótulo cobre o mesmo mês', j.rotulo, '24 a 30 de agosto de 2026');
conferir('período que atravessa o mês diz os dois meses', janelaDe(new Date(Date.UTC(2026, 7, 31))).rotulo, '31 de agosto a 6 de setembro de 2026');
conferir('período que atravessa o ano diz os dois anos', janelaDe(new Date(Date.UTC(2026, 11, 28))).rotulo, '28 de dezembro de 2026 a 3 de janeiro de 2027');
conferir('a virada do ano segue a regra ISO da quinta-feira', janelaDe(new Date(Date.UTC(2026, 11, 28))).slug, '2026-s53');
conferir('e 04/01/2027 (segunda) abre a semana 1 de 2027', janelaDe(new Date(Date.UTC(2027, 0, 4))).slug, '2027-s01');

let idaEVolta = true;
for (const d of ['2026-01-05', '2026-03-30', '2026-08-24', '2026-12-28', '2027-01-04']) {
  const jj = janelaDe(new Date(d + 'T00:00:00Z'));
  const volta = janelaDoSlug(jj.slug);
  if (!volta || volta.inicio !== jj.inicio) idaEVolta = false;
}
conferir('slug → janela → slug é identidade', idaEVolta, true);
conferir('slug malformado devolve null', janelaDoSlug('2026-37'), null);
conferir('semana 99 não existe', janelaDoSlug('2026-s99'), null);
conferir('domingo cai na semana que começou na segunda anterior', janelaDe(new Date(Date.UTC(2026, 7, 30))).inicio, '2026-08-24T00:00:00.000Z');
conferir('rodando na segunda, o giro cobre a semana que fechou', semanaFechada(new Date(Date.UTC(2026, 7, 31, 11, 0))).slug, janelaDe(new Date(Date.UTC(2026, 7, 24))).slug);

/* ==================================================== a auditoria ======= */
console.log('\nA auditoria de números');

const PERMITIDOS = [40, 12, 38, 9, 3, 1];
const BOM = 'A base registrou 40 itens de 12 fontes, em 38 assuntos. O atraso mediano ficou em 9 dias; 3 peças saíram, e 1 relatório.';

conferir('texto com números do dossiê passa', auditarNumeros(BOM, PERMITIDOS).passou, true);
conferir('número inventado reprova', auditarNumeros(BOM.replace('40 itens', '400 itens'), PERMITIDOS).inventados, [400]);
/* O buraco que a primeira versão tinha: apagava `em 12`, `de 40`, `a 7`. */
conferir('número inventado depois de preposição TAMBÉM reprova', auditarNumeros('A base cresceu em 77 itens.', PERMITIDOS).inventados, [77]);
conferir('norma técnica não é quantidade (IEC 61131-3)', numerosDe('Conforme a IEC 61131-3 e a Indústria 4.0.'), []);
conferir('ano não é afirmação sobre os dados', numerosDe('Em 2026 saíram 3 peças.'), [3]);
conferir('versão com ponto não é quantidade', numerosDe('O TIA Portal 19.1 saiu com 3 novidades.'), [3]);
conferir('faixa com hífen não é quantidade', numerosDe('Entre 10-15 dias.'), []);
conferir('a auditoria lista o que usou', auditarNumeros(BOM, PERMITIDOS).usados.length, 6);

/* --------------------------------------------------------------- resultado */

/* ===================================================================== */
/* O BOLETIM GERADO — 24/09/2026                                          */
/*                                                                        */
/* O Giro passou a ser montado dos dados. Uma função que escreve o que vai */
/* ao ar precisa de teste do mesmo tamanho: o que se confere aqui é que    */
/* ela NÃO AFIRMA o que não foi medido, que muda de forma conforme o dado  */
/* (zero/um/muitos), e que o texto é reproduzível.                        */
/* ===================================================================== */

const SEMANA_BASE = {
  janela: { inicio: '2026-09-14T00:00:00.000Z', fim: '2026-09-21T00:00:00.000Z', slug: '2026-s38', rotulo: '14 a 20 de setembro de 2026' },
  itens: 60, comunidade: 297, contexto: 201, fontes: 8, assuntos: 58, sozinhos: 57,
  repercutidos: [{ rotulo: 'Universal Robots launches at IMTS', fontes: 2, chegou: 1 }],
  porFonte: [{ nome: 'The Verge', pessoa: null, pais: 'US', tipo: 'imprensa', n: 101 }],
  relogio: { medidos: 1, mediana: 6, nao_chegaram: 217 },
  agenda: [{ nome: 'IROS 2026', slug: 'iros-2026', inicio: '2026-09-27', cidade: 'Pittsburgh', pais: 'US' }],
  pecas: [],
};

const cheio = redigirGiro(SEMANA_BASE);

conferir('o boletim é reproduzível: mesmos dados, mesmo texto', redigirGiro(SEMANA_BASE).corpo === cheio.corpo, true);
conferir('o relógio medido aparece com a mediana', /mediana ficou em \*\*6 dias\*\*/.test(cheio.corpo), true);
conferir('o que não chegou é tratado como achado', /\*\*é o achado\*\*/.test(cheio.corpo), true);
conferir('comunidade e contexto contados à parte, e dito por quê', /não entram nos números acima/.test(cheio.corpo), true);
conferir('o contexto aparece nomeado como tecnologia geral', /veículos de tecnologia geral/.test(cheio.corpo), true);
conferir('o boletim declara que não é modelo de linguagem', /não é escrito por modelo de\s*linguagem/.test(cheio.corpo), true);

/* Semana vazia: o texto TEM de mudar, e dizer que foi vazia. */
const magra = redigirGiro({ ...SEMANA_BASE, repercutidos: [], relogio: { medidos: 0, mediana: null, nao_chegaram: 0 }, agenda: [] });
conferir('semana sem repercussão diz que não houve', /Nenhum assunto foi coberto por duas fontes/.test(magra.corpo), true);
conferir('semana sem atraso apurado não inventa mediana', /mediana ficou em/.test(magra.corpo), false);
conferir('e explica por que o relógio não marcou', /escreve sobre o Brasil/.test(magra.corpo), true);
conferir('sem agenda, a seção nem aparece', /Nos próximos trinta dias/.test(magra.corpo), false);
conferir('o lead da semana magra não promete repercussão', /também é medida/.test(magra.lead), true);

/* A trava que importa: todo inteiro da prosa tem de estar na apuração. */
function auditarComoOGerador(g: ReturnType<typeof redigirGiro>) {
  let t = `${g.titulo}\n${g.lead}\n${g.corpo}`;
  for (const r of g.reproduzidos) t = t.split(r).join(' ');
  return auditarNumeros(t, g.numeros);
}
conferir('boletim cheio passa na auditoria de números', auditarComoOGerador(cheio).passou, true);
conferir('boletim de semana magra também passa', auditarComoOGerador(magra).passou, true);

/* Número de título alheio não vira número NOSSO: fica em `reproduzidos`, e a
   auditoria estrita o remove antes de conferir. */
const comIOS = redigirGiro({ ...SEMANA_BASE, repercutidos: [{ rotulo: 'Apple releases iOS 27', fontes: 2, chegou: 0 }] });
conferir('título de terceiro entra em reproduzidos', comIOS.reproduzidos.includes('Apple releases iOS 27'), true);
conferir('e o boletim continua passando na auditoria', auditarComoOGerador(comIOS).passou, true);

/* Data por extenso é calendário, não medição — senão o dia do evento teria de
   constar da apuração para o build não abortar. */
conferir('data por extenso não conta como número afirmado', numerosDe('a feira é 27 de setembro'), []);
conferir('faixa de datas também não', numerosDe('de 14 a 20 de setembro'), []);
conferir('mas "20 de fontes" continua sendo número', numerosDe('20 de fontes'), [20]);

/* O fechamento fica no FIM do arquivo, e não no meio: com ele antes dos
   testes do boletim, uma falha ali imprimia depois do resumo e não mexia no
   código de saída — teste que não derruba o `npm test` é teste decorativo. */
console.log(`\n${ok} ok · ${falhou} falha(s)`);
if (falhou > 0) process.exit(1);
