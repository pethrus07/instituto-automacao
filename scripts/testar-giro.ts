/**
 * Teste do Giro da Semana — a janela e a auditoria. Sem Worker, sem rede.
 *
 *   npm test
 *
 * Os dois pedaços testados aqui são os que ninguém revisa lendo:
 *
 *   · a SEMANA, porque erro de fronteira de calendário aparece uma vez por
 *     ano, sempre no fim de dezembro, sempre quando ninguém está olhando;
 *   · a AUDITORIA, porque é ela que impede o giro de publicar um número que
 *     o modelo inventou — e uma auditoria frouxa é pior que auditoria
 *     nenhuma, porque parece auditoria.
 */
import { auditar } from '../src/giro/auditar.ts';
import { janelaDe, janelaDoSlug, semanaFechada } from '../src/giro/semana.ts';
import type { Semana } from '../src/giro/agregar.ts';
import type { Redacao } from '../src/giro/redigir.ts';

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

const j = janelaDe(new Date(Date.UTC(2026, 7, 24))); // segunda, 24/08/2026
conferir('começa na segunda 00:00 UTC', j.inicio, '2026-08-24T00:00:00.000Z');
conferir('termina na segunda seguinte, exclusivo', j.fim, '2026-08-31T00:00:00.000Z');
conferir('o rótulo cobre o mesmo mês', j.rotulo, '24 a 30 de agosto de 2026');

conferir(
  'período que atravessa o mês diz os dois meses',
  janelaDe(new Date(Date.UTC(2026, 7, 31))).rotulo,
  '31 de agosto a 6 de setembro de 2026',
);
conferir(
  'período que atravessa o ano diz os dois anos',
  janelaDe(new Date(Date.UTC(2026, 11, 28))).rotulo,
  '28 de dezembro de 2026 a 3 de janeiro de 2027',
);

/* A regra da quinta-feira: a semana pertence ao ano em que cai a sua quinta.
   É por isso que 01/01/2027 (sexta) ainda é a semana 53 de 2026. */
conferir(
  'a virada do ano segue a regra ISO da quinta-feira',
  janelaDe(new Date(Date.UTC(2026, 11, 28))).slug,
  '2026-s53',
);
conferir(
  'e 04/01/2027 (segunda) abre a semana 1 de 2027',
  janelaDe(new Date(Date.UTC(2027, 0, 4))).slug,
  '2027-s01',
);

/* Ida e volta: slug → janela → slug tem de ser identidade, senão uma edição
   antiga não é reconstituível. */
let idaEVolta = true;
for (const d of ['2026-01-05', '2026-03-30', '2026-08-24', '2026-12-28', '2027-01-04']) {
  const jj = janelaDe(new Date(d + 'T00:00:00Z'));
  const volta = janelaDoSlug(jj.slug);
  if (!volta || volta.inicio !== jj.inicio) idaEVolta = false;
}
conferir('slug → janela → slug é identidade', idaEVolta, true);
conferir('slug malformado devolve null', janelaDoSlug('2026-37'), null);
conferir('semana 99 não existe', janelaDoSlug('2026-s99'), null);

/* Domingo pertence à semana que começou na segunda anterior — e o giro de
   segunda cobre a semana ANTERIOR, nunca a corrente. */
conferir(
  'domingo cai na semana que começou na segunda anterior',
  janelaDe(new Date(Date.UTC(2026, 7, 30))).inicio,
  '2026-08-24T00:00:00.000Z',
);
conferir(
  'rodando na segunda, o giro cobre a semana que fechou',
  semanaFechada(new Date(Date.UTC(2026, 7, 31, 11, 0))).slug,
  janelaDe(new Date(Date.UTC(2026, 7, 24))).slug,
);

/* ==================================================== a auditoria ======= */
console.log('\nA auditoria');

const SEMANA: Semana = {
  janela: janelaDe(new Date(Date.UTC(2026, 7, 24))),
  totais: { itens: 40, publicados: 7, assuntos: 38, fontes: 12, vozes: 3 },
  destaque: null,
  placar: [],
  sozinhos: 5,
  porNucleo: [
    { nucleo: 'industria', itens: 20, publicados: 4, topo: [] },
    { nucleo: 'observatorio', itens: 20, publicados: 3, topo: [] },
    { nucleo: 'operacao', itens: 0, publicados: 0, topo: [] },
    { nucleo: 'edificacoes', itens: 0, publicados: 0, topo: [] },
  ],
  relogio: { medidos: 2, medianaDias: 9, naoChegaram: 31, exemplos: [] },
  vozes: [],
  agenda: [],
};

const BOA: Redacao = {
  titulo: 'A semana em duas frentes',
  lead:
    'A base do Instituto registrou 40 itens de 12 fontes nesta semana, distribuídos em 38 assuntos. ' +
    'O atraso mediano apurado ficou em 9 dias.',
  destaque_texto:
    'Nenhum assunto foi coberto por duas fontes independentes nesta semana, e o Instituto não ' +
    'elege destaque abaixo desse piso. O agrupamento por título ainda separa a mesma notícia ' +
    'quando as manchetes diferem muito.',
  nucleos: [
    { nucleo: 'industria', frase: 'Foram 20 itens, com 4 publicados.' },
    { nucleo: 'observatorio', frase: 'Foram 20 itens, com 3 publicados.' },
    { nucleo: 'operacao', frase: 'Nenhum item novo nesta semana.' },
    { nucleo: 'edificacoes', frase: 'Nenhum item novo nesta semana.' },
  ],
};

const boa = auditar(SEMANA, BOA);
conferir('texto correto passa', boa.passou, true);
conferir('e a auditoria diz quantas conferências fez', boa.conferidas > 10, true);

const troca = (r: Partial<Redacao>): Redacao => ({ ...BOA, ...r });
const falhaDe = (r: Redacao) => auditar(SEMANA, r).falhas.length > 0;

conferir(
  'número inventado no lead reprova',
  falhaDe(troca({ lead: BOA.lead.replace('40 itens', '400 itens') })),
  true,
);
/* O buraco que a primeira versão tinha: a regra "palavra + número é nome
   técnico" apagava `em 12`, `de 40`, `a 7` — o formato exato em que um
   número inventado aparece numa frase em português. */
conferir(
  'número inventado logo depois de preposição TAMBÉM reprova',
  falhaDe(troca({ lead: 'A base cresceu em 77 itens nesta semana, segundo o levantamento.' })),
  true,
);
conferir(
  'norma técnica não é confundida com quantidade',
  falhaDe(
    troca({
      nucleos: BOA.nucleos.map((n) =>
        n.nucleo === 'industria'
          ? { ...n, frase: 'Foram 20 itens sobre Indústria 4.0 e a IEC 61131-3.' }
          : n,
      ),
    }),
  ),
  false,
);
conferir(
  'núcleo faltando reprova',
  falhaDe(troca({ nucleos: BOA.nucleos.slice(0, 3) })),
  true,
);
conferir(
  'núcleo repetido reprova',
  falhaDe(troca({ nucleos: [...BOA.nucleos, BOA.nucleos[0]!] })),
  true,
);
conferir(
  'núcleo sem item não pode ganhar movimento inventado',
  falhaDe(
    troca({
      nucleos: BOA.nucleos.map((n) =>
        n.nucleo === 'operacao' ? { ...n, frase: 'Semana movimentada no núcleo.' } : n,
      ),
    }),
  ),
  true,
);
conferir(
  'URL na prosa reprova',
  falhaDe(troca({ lead: BOA.lead + ' Veja em https://exemplo.com/x.' })),
  true,
);
conferir(
  'markdown na prosa reprova',
  falhaDe(troca({ lead: BOA.lead + ' **muito importante**' })),
  true,
);
conferir('lead vazio reprova', falhaDe(troca({ lead: '' })), true);
conferir(
  'sem destaque no agregado, afirmar um reprova',
  falhaDe(
    troca({
      destaque_texto:
        'O destaque da semana foi o lançamento do novo controlador, que mudou o patamar do setor.',
    }),
  ),
  true,
);

/* A simulação tem de passar pela MESMA auditoria. Se a auditoria fosse
   frouxa com o texto simulado, ela não estaria testada quando a chave real
   chegar — e é justamente aí que ela precisa funcionar. */
const COM_DESTAQUE: Semana = {
  ...SEMANA,
  destaque: {
    assunto_id: 'a-1',
    rotulo: 'Novo controlador com diagnóstico preditivo',
    nucleo: 'industria',
    fontes: 3,
    peso: 18,
    chegou_br: false,
    atraso_br_dias: null,
    veredito: 'nao_chega',
    publicado_original: '2026-08-25T10:00:00.000Z',
    pontos: 73,
    parcelas: { repercussao: 30, alcance: 18, ineditismo: 25, veredito: 15 },
    item_slug: null,
    item_nucleo: null,
    item_titulo: null,
    item_resumo: null,
  },
};
const simulado = auditar(COM_DESTAQUE, {
  ...BOA,
  destaque_texto:
    'O assunto que mais repercutiu foi "Novo controlador com diagnóstico preditivo", coberto por ' +
    '3 fontes independentes. [texto simulado — sem chamada à API]',
});
conferir('o texto simulado passa na mesma auditoria', simulado.passou, true);

/* --------------------------------------------------------------- resultado */
console.log(`
${ok} ok · ${falhou} falha(s)`);
if (falhou > 0) process.exit(1);
