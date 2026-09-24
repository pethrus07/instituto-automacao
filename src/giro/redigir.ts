/**
 * O GIRO, REDIGIDO DOS DADOS — sem modelo, sem rede, sem juízo.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ISTO NÃO É "IA EM PRODUÇÃO"
 *
 * O Giro sempre foi um balanço de números: quanto o setor publicou, o que
 * repercutiu em mais de uma fonte, quanto tempo um assunto levou para chegar
 * aqui. Nada disso é opinião — é contagem, e a contagem já existe feita pelo
 * coletor e pelo relógio.
 *
 * Então o boletim é montado por FUNÇÃO PURA sobre os números medidos: mesmos
 * dados, mesmo texto, sempre. Não há modelo de linguagem, não há chamada de
 * rede, não há chave de API e não há teto de custo — os três morreram em
 * 03/09/2026 e continuam mortos. Um leitor pode refazer este texto na mão a
 * partir do dataset publicado e chegar na mesma coisa; é esse o teste.
 *
 * ---------------------------------------------------------------------------
 * O QUE ISTO OBRIGA O SITE A DIZER
 *
 * Um boletim gerado não pode se passar por texto de gente. Por isso a peça
 * sai marcada `gerado: true`, a página mostra o aviso, e as promessas do
 * rodapé foram ESTREITADAS em vez de apagadas: notícia, artigo e relatório
 * continuam escritos por uma pessoa com nome; o Giro é um boletim de números,
 * e diz que é.
 *
 * ---------------------------------------------------------------------------
 * A REGRA DE ESCRITA
 *
 * Nenhuma frase afirma o que não foi medido, e semana fraca se diz fraca. O
 * texto muda de forma conforme o dado — zero, um, muitos —, porque boletim
 * que repete a mesma moldura com o número trocado é planilha com serifa.
 */

import { numerosDe } from './auditar.ts';

export type RepercutidoLido = { rotulo: string; fontes: number; chegou: number };
export type FonteLida = { nome: string; pessoa: string | null; pais: string; tipo: string; n: number };
export type EventoLido = { nome: string; slug: string; inicio: string; cidade: string | null; pais: string };
export type PecaLida = { titulo: string; secao: string; slug: string };

export type Semana = {
  janela: { inicio: string; fim: string; slug: string; rotulo: string };
  itens: number;
  comunidade: number;
  fontes: number;
  assuntos: number;
  sozinhos: number;
  repercutidos: RepercutidoLido[];
  porFonte: FonteLida[];
  relogio: { medidos: number; mediana: number | null; nao_chegaram: number };
  agenda: EventoLido[];
  pecas: PecaLida[];
};

export type GiroRedigido = {
  titulo: string;
  tituloCurto: string;
  lead: string;
  corpo: string;
  numeros: number[];
  /**
   * Os trechos que o boletim REPRODUZ de terceiro — títulos de assunto e nomes
   * de evento, copiados da base como estão.
   *
   * Existem separados porque a auditoria de números audita o que o Instituto
   * AFIRMA, e "Apple releases iOS 27" não é uma afirmação nossa sobre a
   * semana: é uma string que veio do banco. Sem esta lista, o 27 do iOS teria
   * de entrar no rol de números apurados — e aí passaria a ser aceito também
   * numa frase nossa, que é exatamente o afrouxamento que a auditoria existe
   * para não ter.
   */
  reproduzidos: string[];
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** "2026-09-15" → "15 de setembro" */
function diaEMes(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} de ${MESES[(m ?? 1) - 1]}`;
}

const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos);

/** "a, b e c" — a vírgula de série em português não leva "e" antes do último. */
function lista(partes: string[]): string {
  if (partes.length === 0) return '';
  if (partes.length === 1) return partes[0]!;
  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

const ROTULO_SECAO: Record<string, string> = {
  noticias: 'notícia',
  artigos: 'artigo',
  relatorios: 'relatório',
};

export function redigirGiro(s: Semana): GiroRedigido {
  const l: string[] = [];
  const { rotulo, slug } = s.janela;
  const semanaNum = slug.slice(-2).replace(/^0/, '');

  /* ------------------------------------------------------------- o lead */

  const partesLead: string[] = [
    `${s.itens} ${plural(s.itens, 'item', 'itens')} de ${s.fontes} ${plural(s.fontes, 'fonte', 'fontes')}`,
  ];
  if (s.repercutidos.length > 0) {
    partesLead.push(
      `${s.repercutidos.length} ${plural(s.repercutidos.length, 'assunto repercutiu', 'assuntos repercutiram')} em mais de uma fonte`,
    );
  }
  if (s.relogio.medidos > 0 && s.relogio.mediana !== null) {
    partesLead.push(
      `o relógio apurou ${s.relogio.medidos} ${plural(s.relogio.medidos, 'atraso', 'atrasos')} (mediana de ${s.relogio.mediana} ${plural(s.relogio.mediana, 'dia', 'dias')})`,
    );
  }
  const lead =
    s.repercutidos.length === 0 && s.relogio.medidos === 0
      ? `${partesLead[0]}, e nenhum assunto coberto por duas fontes independentes. Semana de movimento sem repercussão — e isso também é medida.`
      : `${lista(partesLead)}.`;

  /* ------------------------------------------------------------- o corpo */

  l.push('## O que o setor publicou');
  l.push('');
  l.push(
    `De ${rotulo}, as fontes de imprensa que o Instituto acompanha publicaram **${s.itens} ` +
      `${plural(s.itens, 'item', 'itens')}**, vindos de ${s.fontes} ${plural(s.fontes, 'fonte', 'fontes')}. ` +
      `Esses itens se agruparam em ${s.assuntos} ${plural(s.assuntos, 'assunto', 'assuntos')} distintos, dos quais ` +
      `${s.sozinhos} ${plural(s.sozinhos, 'apareceu', 'apareceram')} em uma fonte só.`,
  );
  if (s.comunidade > 0) {
    l.push('');
    l.push(
      `Fóruns e redes sociais somaram outros ${s.comunidade} ${plural(s.comunidade, 'item', 'itens')} no mesmo ` +
        `período. Eles não entram nos números acima: thread de comunidade é atividade, não publicação, e misturar ` +
        `as duas coisas inflaria a semana sem dizer nada sobre o setor.`,
    );
  }

  l.push('');
  l.push('## O que repercutiu');
  l.push('');
  if (s.repercutidos.length === 0) {
    l.push(
      'Nenhum assunto foi coberto por duas fontes independentes nesta semana. Não é falha da coleta: é uma ' +
        'semana em que cada fonte falou de uma coisa, e registrar isso vale tanto quanto registrar o contrário.',
    );
  } else {
    l.push(
      `${s.repercutidos.length} ${plural(s.repercutidos.length, 'assunto foi coberto', 'assuntos foram cobertos')} ` +
        `por duas ou mais fontes independentes — o critério que o Instituto usa para dizer que algo repercutiu:`,
    );
    l.push('');
    for (const r of s.repercutidos) {
      const marca = r.chegou ? ' — **já mencionado por fonte brasileira**' : '';
      l.push(`- ${r.rotulo} · ${r.fontes} fontes${marca}`);
    }
  }

  l.push('');
  l.push('## O relógio');
  l.push('');
  if (s.relogio.medidos > 0 && s.relogio.mediana !== null) {
    l.push(
      `Nesta semana ${s.relogio.medidos} ${plural(s.relogio.medidos, 'assunto teve', 'assuntos tiveram')} o atraso ` +
        `apurado: a distância entre a primeira publicação lá fora e a primeira menção em fonte brasileira. A ` +
        `mediana ficou em **${s.relogio.mediana} ${plural(s.relogio.mediana, 'dia', 'dias')}**.`,
    );
  } else {
    l.push(
      'Nenhum atraso novo foi apurado nesta semana. O relógio só marca quando uma fonte brasileira escreve ' +
        'sobre um assunto que já entrou na base vindo de fora — e, na maior parte do tempo, a imprensa ' +
        'brasileira do setor escreve sobre o Brasil. A amostra cresce devagar, e o site prefere dizer isso a ' +
        'publicar uma média que pareça maior do que é.',
    );
  }
  if (s.relogio.nao_chegaram > 0) {
    l.push('');
    l.push(
      `${s.relogio.nao_chegaram} ${plural(s.relogio.nao_chegaram, 'assunto publicado', 'assuntos publicados')} lá ` +
        `fora nesta semana ainda ${plural(s.relogio.nao_chegaram, 'não teve', 'não tiveram')} nenhuma menção ` +
        `brasileira. Isso não é pendência da medição: **é o achado**. O que nunca chega faz parte da resposta.`,
    );
  }

  l.push('');
  l.push('## O que o Instituto publicou');
  l.push('');
  if (s.pecas.length === 0) {
    l.push('Nenhum texto saiu nesta semana.');
  } else {
    l.push(`${s.pecas.length} ${plural(s.pecas.length, 'texto saiu', 'textos saíram')} nesta semana:`);
    l.push('');
    for (const p of s.pecas) {
      l.push(`- [${p.titulo}](/${p.secao}/${p.slug}) · ${ROTULO_SECAO[p.secao] ?? p.secao}`);
    }
  }

  if (s.agenda.length > 0) {
    l.push('');
    l.push('## Nos próximos trinta dias');
    l.push('');
    for (const e of s.agenda) {
      const onde = e.cidade ? `${e.cidade} · ${e.pais}` : e.pais;
      l.push(`- **${diaEMes(e.inicio)}** — [${e.nome}](/agenda/${e.slug}), ${onde}`);
    }
  }

  l.push('');
  l.push('## Como este boletim é feito');
  l.push('');
  l.push(
    'Este Giro é **gerado a partir dos dados**, não redigido por uma pessoa — e não é escrito por modelo de ' +
      'linguagem: é uma função sobre os números que o coletor mediu, então os mesmos dados produzem sempre o ' +
      'mesmo texto. Cada número acima existe na base antes de existir na frase, e o compilador recusa publicar ' +
      'o boletim se aparecer na prosa um número que a apuração não tenha.',
  );
  l.push('');
  l.push(
    'Notícia, artigo e relatório continuam sendo escritos por gente, com nome e responsabilidade. O método de ' +
      'coleta, o critério de repercussão e a definição do atraso estão em [Blueprints](/blueprints), com a ' +
      'lista de fontes e o que cada uma autoriza.',
  );

  /* -------------------------------------------------------- os inteiros */

  const reproduzidos = [...s.repercutidos.map((r) => r.rotulo), ...s.agenda.map((e) => e.nome), ...s.pecas.map((p) => p.titulo)];

  const numeros = new Set<number>([
    s.itens, s.comunidade, s.fontes, s.assuntos, s.sozinhos,
    s.relogio.medidos, s.relogio.nao_chegaram,
    s.repercutidos.length, s.agenda.length, s.pecas.length,
    ...(s.relogio.mediana !== null ? [s.relogio.mediana] : []),
    ...s.repercutidos.map((r) => r.fontes),
  ]);

  /* O frontmatter `numeros:` é o que o COMPILADOR confere, e ele só vê o
     arquivo — não sabe quais trechos são reproduzidos de terceiro. Então a
     lista gravada inclui os inteiros dos títulos alheios; a conferência
     ESTRITA, que remove esses trechos antes de auditar, roda na geração
     (scripts/giro.ts). Duas camadas: a de lá pega defeito do gerador, a de cá
     pega edição à mão que invente número. */
  for (const t of reproduzidos) for (const n of numerosDe(t)) numeros.add(n);

  const titulo = `Giro da Semana · ${rotulo}`;
  return {
    titulo,
    tituloCurto: `Giro da Semana ${semanaNum} · o setor em números`.slice(0, 53),
    lead,
    corpo: l.join('\n'),
    numeros: [...numeros].sort((a, b) => a - b),
    reproduzidos,
  };
}
