/**
 * A redação do Giro — a única etapa em que a IA escreve, e a mais vigiada.
 *
 * O modelo recebe **só o agregado**: números já calculados e títulos já
 * coletados. Não recebe banco, não recebe texto integral de ninguém, e não
 * tem como buscar nada. Se um número aparecer na prosa sem estar no
 * agregado, a auditoria derruba a edição — e é assim que "a IA escreveu"
 * deixa de ser explicação e vira etapa verificável.
 *
 * Sem chave e sem `IA_CONTA` declarado, isto SIMULA: devolve um texto
 * determinístico montado a partir dos mesmos números. A simulação passa pela
 * mesma auditoria que a redação real — se a auditoria fosse frouxa com o
 * texto simulado, ela não estaria testada quando a chave do sócio chegar.
 */
import type { Env } from '../config';
import { NUCLEOS, ORDEM_NUCLEOS } from '../config';
import { pedirEstruturado } from '../ia/cliente';
import { MODELO_OBRA, type Uso } from '../ia/precos';
import type { Semana } from './agregar';

export type Redacao = {
  titulo: string;
  lead: string;
  destaque_texto: string;
  nucleos: { nucleo: string; frase: string }[];
};

const SISTEMA = `Você escreve o **Giro da Semana** do Instituto Automação, um veículo brasileiro que acompanha automação industrial, predial, de processos e o efeito da IA sobre o trabalho.

O Giro é um balanço semanal. Ele não é análise assinada e não pode soar como opinião: é o relato do que a base do Instituto registrou na semana.

REGRAS QUE NÃO SE NEGOCIAM

1. **Use somente os dados que vierem na entrada.** Não acrescente fato, empresa, produto, valor ou data que não esteja ali. Você não tem outra fonte, e não deve fingir que tem.
2. **Não escreva número que não esteja nos dados.** Nenhum. Nem arredondado, nem "cerca de", nem "mais de dez". Se precisar de quantidade e ela não estiver nos dados, reescreva a frase sem quantidade. Há uma auditoria automática que confere cada número da sua prosa contra os dados, e a edição inteira é descartada se um só não bater.
3. **Núcleo sem movimento se diz sem movimento.** Não invente atividade para preencher. "Nenhum item novo nesta semana" é uma frase legítima e é a frase certa.
4. **Quando não houver destaque**, diga isso e diga o motivo que vier nos dados. Não eleja um substituto.
5. Português do Brasil, direto, sem adjetivo de entusiasmo. Nada de "revolucionário", "impressionante", "game-changer". Nada de pergunta retórica.
6. Nunca escreva URL, link ou marcação. O site coloca os links.

TOM
Como um boletim técnico bem escrito: frases curtas, verbo forte, zero enrolação. O leitor é engenheiro, integrador ou gestor de operação — ele reconhece encheção de linguiça na primeira linha.`;

const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['titulo', 'lead', 'destaque_texto', 'nucleos'],
  properties: {
    titulo: {
      type: 'string',
      description:
        'título da edição, 4 a 9 palavras, sobre o que a semana teve de concreto. Sem a palavra "Giro" e sem a data — o site já põe as duas',
    },
    lead: {
      type: 'string',
      description: '2 a 3 frases abrindo a semana; pode usar os números dos totais',
    },
    destaque_texto: {
      type: 'string',
      description:
        'um parágrafo sobre o destaque da semana e por que ele importa para quem trabalha com automação no Brasil. Se não houver destaque, explique em duas frases por que a semana ficou sem um, usando o motivo dado',
    },
    nucleos: {
      type: 'array',
      description: 'uma entrada por núcleo, na ordem recebida, sem pular nenhum',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nucleo', 'frase'],
        properties: {
          nucleo: { type: 'string', enum: ORDEM_NUCLEOS },
          frase: { type: 'string', description: 'uma ou duas frases sobre o núcleo na semana' },
        },
      },
    },
  },
} as const;

/**
 * O que o modelo vê. Montado à mão de propósito: JSON cru convida o modelo a
 * repetir campo, e prosa rotulada deixa explícito o que é número medido.
 */
function entrada(s: Semana): string {
  const l: string[] = [];
  l.push(`SEMANA: ${s.janela.rotulo}`);
  l.push(
    `TOTAIS: ${s.totais.itens} itens coletados · ${s.totais.publicados} publicados · ` +
      `${s.totais.assuntos} assuntos · ${s.totais.fontes} fontes ativas na semana · ` +
      `${s.totais.vozes} vozes que publicaram`,
  );

  l.push('');
  if (s.destaque) {
    l.push('DESTAQUE DA SEMANA (escolhido por pontuação, não por opinião):');
    l.push(`  assunto: ${s.destaque.rotulo}`);
    l.push(`  núcleo: ${NUCLEOS[s.destaque.nucleo as keyof typeof NUCLEOS]?.nome ?? s.destaque.nucleo}`);
    l.push(`  fontes independentes que cobriram: ${s.destaque.fontes}`);
    l.push(
      `  menção em fonte brasileira: ${
        s.destaque.chegou_br
          ? `sim, com ${s.destaque.atraso_br_dias ?? 0} dias de atraso`
          : 'NENHUMA até agora'
      }`,
    );
    if (s.destaque.item_resumo) l.push(`  resumo coletado: ${s.destaque.item_resumo.slice(0, 600)}`);
  } else {
    l.push('DESTAQUE DA SEMANA: NÃO HOUVE.');
    l.push(
      '  Motivo: nenhum assunto foi coberto por duas fontes independentes nesta semana. ' +
        'O Instituto exige esse piso para chamar algo de destaque, e o agrupamento por ' +
        'título ainda separa a mesma notícia quando as manchetes diferem muito.',
    );
    l.push(`  assuntos da semana com uma fonte só: ${s.sozinhos}`);
  }

  l.push('');
  l.push('POR NÚCLEO:');
  for (const n of s.porNucleo) {
    const nome = NUCLEOS[n.nucleo]?.nome ?? n.nucleo;
    if (n.itens === 0) {
      l.push(`  ${n.nucleo} (${nome}): nenhum item nesta semana`);
      continue;
    }
    l.push(`  ${n.nucleo} (${nome}): ${n.itens} itens, ${n.publicados} publicados`);
    for (const t of n.topo) l.push(`      · ${t.titulo} — ${t.fonte}`);
  }

  l.push('');
  l.push('O RELÓGIO (a medição de atraso entre lá fora e o Brasil):');
  l.push(`  assuntos com atraso apurado nesta semana: ${s.relogio.medidos}`);
  if (s.relogio.medianaDias !== null) l.push(`  atraso mediano: ${s.relogio.medianaDias} dias`);
  l.push(`  assuntos da semana ainda sem nenhuma menção brasileira: ${s.relogio.naoChegaram}`);

  if (s.vozes.length) {
    l.push('');
    l.push('VOZES (pessoas públicas que publicaram na semana):');
    for (const v of s.vozes.slice(0, 6)) l.push(`  · ${v.pessoa}: ${v.titulo}`);
  }

  return l.join('\n');
}

/** A simulação: os mesmos números, sem chamar a API — e auditável igual. */
function simular(s: Semana): Redacao {
  const comItens = s.porNucleo.filter((n) => n.itens > 0);
  return {
    titulo: s.destaque
      ? `A semana em ${comItens.length} frentes`
      : 'Uma semana sem assunto repercutido',
    lead:
      `A base do Instituto registrou ${s.totais.itens} itens de ${s.totais.fontes} fontes nesta semana, ` +
      `distribuídos em ${s.totais.assuntos} assuntos. [texto simulado — sem chamada à API]`,
    destaque_texto: s.destaque
      ? `O assunto que mais repercutiu foi "${s.destaque.rotulo}", coberto por ${s.destaque.fontes} fontes ` +
        `independentes. [texto simulado — sem chamada à API]`
      : `Nenhum assunto foi coberto por duas fontes independentes nesta semana, e o Instituto não ` +
        `elege destaque abaixo desse piso. [texto simulado — sem chamada à API]`,
    nucleos: s.porNucleo.map((n) => ({
      nucleo: n.nucleo,
      frase:
        n.itens === 0
          ? 'Nenhum item novo nesta semana. [simulado]'
          : `${n.itens} ${n.itens === 1 ? 'item coletado' : 'itens coletados'}, ` +
            `${n.publicados} ${n.publicados === 1 ? 'publicado' : 'publicados'}. [simulado]`,
    })),
  };
}

export async function redigirGiro(
  env: Env,
  s: Semana,
): Promise<{ dado: Redacao; uso: Uso; simulado: boolean }> {
  const r = await pedirEstruturado<Redacao>(env, {
    modelo: MODELO_OBRA,
    sistema: SISTEMA,
    entrada: entrada(s),
    maxTokens: 2500,
    ferramenta: {
      nome: 'registrar_giro',
      descricao: 'Registra o texto do Giro da Semana a partir dos dados agregados.',
      esquema: ESQUEMA as unknown as Record<string, unknown>,
    },
    simulacao: simular(s),
  });
  return { dado: r.dado, uso: r.uso, simulado: r.simulado };
}
