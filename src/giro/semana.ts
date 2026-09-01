/**
 * A semana do Giro — de segunda a domingo, em UTC.
 *
 * Parece detalhe e não é: a edição semanal precisa de uma fronteira que não
 * se mova. Se a janela fosse "os últimos 7 dias", cada execução do cron
 * produziria um recorte diferente e o giro da semana 36 deixaria de ser
 * reproduzível — e reprodutível é o mínimo para um veículo que publica os
 * próprios dados.
 *
 * Semana ISO (segunda a domingo) porque é a que o setor usa: feira,
 * balanço e press release andam por semana de calendário, não por janela
 * móvel.
 */

export type Janela = {
  /** segunda-feira, 00:00:00 UTC — inclusivo */
  inicio: string;
  /** segunda-feira SEGUINTE, 00:00:00 UTC — exclusivo */
  fim: string;
  /** `2026-s36` — o identificador da edição */
  slug: string;
  /** "25 a 31 de agosto de 2026" — como o leitor lê */
  rotulo: string;
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Meia-noite UTC da segunda-feira da semana em que a data cai. */
function segundaDe(d: Date): Date {
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // getUTCDay: 0 = domingo. Domingo pertence à semana que começou na segunda anterior.
  const desloca = (u.getUTCDay() + 6) % 7;
  u.setUTCDate(u.getUTCDate() - desloca);
  return u;
}

/**
 * Número da semana ISO 8601.
 *
 * A regra é a da quinta-feira: a semana pertence ao ano em que cai a sua
 * quinta. É por isso que 01/01 pode ser semana 52 do ano anterior — e por
 * isso que reimplementar "dia do ano dividido por 7" dá errado uma vez por
 * ano, sempre no fim de dezembro, sempre quando ninguém está olhando.
 */
function semanaISO(segunda: Date): { ano: number; semana: number } {
  const quinta = new Date(segunda);
  quinta.setUTCDate(quinta.getUTCDate() + 3);
  const ano = quinta.getUTCFullYear();
  const primeiraQuinta = new Date(Date.UTC(ano, 0, 4));
  const primeiraSegunda = segundaDe(primeiraQuinta);
  const semana = Math.round((segunda.getTime() - primeiraSegunda.getTime()) / (7 * 86400000)) + 1;
  return { ano, semana };
}

function rotularPeriodo(inicio: Date, fimInclusivo: Date): string {
  const d1 = inicio.getUTCDate();
  const d2 = fimInclusivo.getUTCDate();
  const m1 = MESES[inicio.getUTCMonth()]!;
  const m2 = MESES[fimInclusivo.getUTCMonth()]!;
  const a1 = inicio.getUTCFullYear();
  const a2 = fimInclusivo.getUTCFullYear();

  if (a1 !== a2) return `${d1} de ${m1} de ${a1} a ${d2} de ${m2} de ${a2}`;
  if (m1 !== m2) return `${d1} de ${m1} a ${d2} de ${m2} de ${a2}`;
  return `${d1} a ${d2} de ${m2} de ${a2}`;
}

/**
 * A janela da semana ANTERIOR à data dada.
 *
 * O giro sai na segunda de manhã e cobre a semana que fechou no domingo.
 * Cobrir a semana corrente seria publicar um balanço de dados que ainda vão
 * mudar — e depois ter de mexer no que já saiu.
 */
export function semanaFechada(agora: Date = new Date()): Janela {
  const estaSegunda = segundaDe(agora);
  const inicio = new Date(estaSegunda);
  inicio.setUTCDate(inicio.getUTCDate() - 7);
  return janelaDe(inicio);
}

/**
 * A janela da semana em que a data cai.
 *
 * Normaliza para a segunda-feira em vez de exigir que o chamador já passe
 * uma: passar um domingo e receber a semana SEGUINTE é o tipo de erro que
 * não levanta exceção, não aparece em revisão e só se descobre olhando um
 * giro com os dados errados.
 */
export function janelaDe(dia: Date): Janela {
  const segunda = segundaDe(dia);
  const fim = new Date(segunda);
  fim.setUTCDate(fim.getUTCDate() + 7);
  const ultimoDia = new Date(fim);
  ultimoDia.setUTCDate(ultimoDia.getUTCDate() - 1);

  const { ano, semana } = semanaISO(segunda);
  return {
    inicio: segunda.toISOString(),
    fim: fim.toISOString(),
    slug: `${ano}-s${String(semana).padStart(2, '0')}`,
    rotulo: rotularPeriodo(segunda, ultimoDia),
  };
}

/** A janela de um slug `2026-s36`, para reconstruir uma edição antiga. */
export function janelaDoSlug(slug: string): Janela | null {
  const m = /^(\d{4})-s(\d{2})$/.exec(slug);
  if (!m) return null;
  const ano = Number(m[1]);
  const semana = Number(m[2]);
  if (semana < 1 || semana > 53) return null;

  const primeiraSegunda = segundaDe(new Date(Date.UTC(ano, 0, 4)));
  const segunda = new Date(primeiraSegunda);
  segunda.setUTCDate(segunda.getUTCDate() + (semana - 1) * 7);
  return janelaDe(segunda);
}
