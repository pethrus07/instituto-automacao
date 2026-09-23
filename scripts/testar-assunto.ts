/**
 * Teste do agrupamento em assunto — o pedaço de que depende a tese do site.
 *
 *   npm test
 *
 * Os casos não são inventados: saíram do corpus real da homologação em
 * 23/09/2026, e o par principal é a PRIMEIRA medição que o relógio conseguiria
 * ter produzido em toda a vida do projeto:
 *
 *   US 14/09  Universal Robots launches its seventh generation robot platform at IMTS
 *   BR 20/09  Universal Robots lança sua plataforma de robôs de sétima geração na IMTS
 *   → atraso de 6 dias
 *
 * O agrupamento velho não pegava isto (exigia conjunto idêntico de palavras) e
 * por isso o relógio marcava zero desde sempre. Se algum dia este teste voltar
 * a falhar, o relógio voltou a marcar zero — e não é um número, é a ausência
 * de um.
 *
 * O caso NEGATIVO vale tanto quanto: "Teradyne Robotics sues JAKA over 3
 * Universal Robots patents" também fala de Universal Robots e NÃO é o mesmo
 * assunto. Falso positivo não deixa a medida faltando, deixa a medida errada —
 * e número errado ninguém percebe lendo.
 */
import { DF_ANCORA, ehCodigo, ehTitleCase, melhorCandidato, nomesDe, podeAncorarOriginal, raros, tokensDe, type Token } from '../src/coletor/assunto.ts';

/** atalho: monta Token a partir do nome, marcando forte */
const tk = (token: string, forte = false): Token => ({ token, forte });

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

/* ------------------------------------------------------------------ tokens */

const EN = 'Universal Robots launches its seventh generation robot platform at IMTS';
const PT = 'Universal Robots lança sua plataforma de robôs de sétima geração na IMTS';
const OUTRO = 'Teradyne Robotics sues JAKA over 3 Universal Robots patents';

conferir('acento não separa token', nomesDe(tokensDe('automação'))[0], 'automacao');
conferir('código passa mesmo curto', nomesDe(tokensDe('Siemens S7 e a norma 61131')).includes('61131'), true);
conferir('token curto sem dígito não entra', nomesDe(tokensDe('a nova era do CLP')).includes('era'), false);
conferir('palavra vazia sai em pt, en e de', tokensDe('the der para com').length, 0);
conferir('sem duplicata e em ordem estável', nomesDe(tokensDe('Robot robot ROBOT')), ['robot']);

/* Os dois títulos do par real compartilham o que sobrevive à tradução. */
const tEN = tokensDe(EN);
const tPT = tokensDe(PT);
const comuns = nomesDe(tEN).filter((t) => nomesDe(tPT).includes(t));
conferir('o par real compartilha universal, robots e imts', comuns, ['imts', 'robots', 'universal']);

/* ------------------------------------------------------------------- raros */

/* Frequências REAIS, contadas no corpus da homologação em 23/09/2026 (1.701
   itens). Não são plausíveis: são as que existem — e é por isso que o teste
   vale. Com FRACAO_COMUM = 0,5%, o teto de raridade é 8 itens. */
const CORPUS = 1701;
const df = new Map<string, number>([
  ['robots', 22],
  ['robot', 31],
  ['platform', 8],
  ['universal', 6],
  ['imts', 3],
  ['generation', 14],
  ['seventh', 2],
  ['teradyne', 5],
  ['jaka', 4],
  ['patents', 9],
  ['sues', 3],
  ['siemens', 24],
  ['industria', 41],
  ['update', 25],
]);

/* O que o aperto de 2% para 0,5% comprou: palavra comum do ramo deixou de
   passar por rara, e com ela morreu o encadeamento que fundia assuntos. */
conferir('"robots" é palavra do ramo, não identificador', nomesDe(raros([tk('robots')], df, CORPUS)), []);
conferir('"siemens" também não passa sozinho por raro', nomesDe(raros([tk('siemens')], df, CORPUS)), []);
conferir('"industria" e "update" ficam de fora', nomesDe(raros([tk('industria'), tk('update')], df, CORPUS)), []);

conferir('nome de feira é raro', nomesDe(raros([tk('imts')], df, CORPUS)), ['imts']);
conferir('token ausente do corpus é raríssimo', nomesDe(raros([tk('sinamics')], df, CORPUS)), ['sinamics']);

/* ------------------------------------------------------------- candidatos */

const rarosEN = raros(tEN, df, CORPUS);
const rarosPT = raros(tPT, df, CORPUS);
const nomesPT = nomesDe(rarosPT);
const compartilhadosRaros = rarosEN.filter((t) => nomesPT.includes(t.token));

conferir(
  'do par real sobram os tokens que identificam (universal, imts)',
  nomesDe(compartilhadosRaros).sort(),
  ['imts', 'universal'],
);
conferir('e "robots", que é do ramo, ficou de fora', nomesDe(compartilhadosRaros).includes('robots'), false);
conferir('e ao menos um deles é FORTE (nome próprio)', compartilhadosRaros.some((t) => t.forte), true);

conferir(
  'o par real AGRUPA',
  melhorCandidato([{ assuntoId: 'a-en', tokensEmComum: compartilhadosRaros }], df)?.assuntoId,
  'a-en',
);

/* O negativo: a briga de patentes compartilha só "universal" com o lançamento
   ("robots" é comum e cai fora), e um token raro só não basta. */
const nomesOutro = nomesDe(raros(tokensDe(OUTRO), df, CORPUS));
const comunsComOutro = rarosEN.filter((t) => nomesOutro.includes(t.token));
conferir('com a notícia de patentes sobra só "universal"', nomesDe(comunsComOutro), ['universal']);
conferir(
  'e por isso ela NÃO agrupa com o lançamento',
  melhorCandidato([{ assuntoId: 'a-patentes', tokensEmComum: comunsComOutro }], df),
  null,
);

/* A âncora: token raríssimo sozinho basta, porque não existe por acaso. */
conferir(
  'um CÓDIGO raríssimo ancora sozinho',
  melhorCandidato([{ assuntoId: 'a-rs485', tokensEmComum: [tk('rs485', true)] }], df)?.assuntoId,
  'a-rs485',
);
conferir(
  'mas um NOME raríssimo sozinho não ancora — nome não é código',
  melhorCandidato([{ assuntoId: 'a-jaka', tokensEmComum: [tk('jaka', true)] }], df),
  null,
);
conferir('e o limiar da âncora é o que se espera', DF_ANCORA <= 2, true);

/* Entre dois candidatos que compartilham o MESMO tanto de tokens, vence o
   mais raro. Não é "raridade vence quantidade": a nota é soma, então três
   tokens raros pesam mais que dois — e isso é certo, mais evidência
   compartilhada É mais evidência. O que a nota garante é que, empatada a
   quantidade, quem tem o token mais específico leva. */
conferir(
  'empatada a quantidade, vence o par mais raro',
  melhorCandidato(
    [
      { assuntoId: 'a-generico', tokensEmComum: [tk('patents', true), tk('sues')] },
      { assuntoId: 'a-preciso', tokensEmComum: [tk('imts', true), tk('seventh')] },
    ],
    df,
  )?.assuntoId,
  'a-preciso',
);

/* --------------------------------------------------------------- a âncora */

conferir('fórum não ancora o relógio', podeAncorarOriginal('forum'), false);
conferir('rede social não ancora o relógio', podeAncorarOriginal('social'), false);
conferir('imprensa ancora', podeAncorarOriginal('imprensa'), true);
conferir('sala de imprensa ancora', podeAncorarOriginal('press'), true);

console.log(`\n${ok} ok · ${falhou} falha(s)`);
if (falhou > 0) process.exit(1);
