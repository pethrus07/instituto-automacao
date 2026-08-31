/**
 * As etapas do pipeline: os prompts e os esquemas.
 *
 * Ordem importa e é econômica: a triagem barata roda antes de tudo, e item
 * que não passa nela nunca chega no modelo caro.
 */
import type { Env, ChaveNucleo } from '../config';
import { ORDEM_NUCLEOS } from '../config';
import { MODELO_TRIAGEM, MODELO_OBRA, type Uso } from './precos';
import { pedirEstruturado, pedirTexto } from './cliente';

/* ------------------------------------------------------------- glossário */

export type TermoGlossario = {
  termo_origem: string;
  idioma: string;
  termo_pt: string;
  nota: string | null;
  manter_original: number;
};

/**
 * O glossário travado, formatado para entrar no prompt.
 *
 * Vai como bloco de sistema marcado para cache: é o mesmo texto em toda
 * chamada, então paga o preço cheio uma vez e ~10% nas seguintes. É também
 * o motivo de ele ser infraestrutura e não página bonita — LLM traduzindo
 * cru erra termo técnico, e engenheiro percebe na primeira linha.
 *
 * Sai em DUAS listas, porque são duas regras diferentes:
 *   1. termo com tradução consagrada → a tradução é obrigatória
 *   2. termo que NÃO se traduz → fica na língua de origem, com o significado
 *      aproximado entre parênteses na primeira ocorrência
 */
export async function carregarGlossario(env: Env, idioma: string): Promise<string> {
  const { results } = await env.DB.prepare(
    `SELECT termo_origem, idioma, termo_pt, nota, manter_original FROM glossario
      WHERE travado = 1 AND (idioma = ?1 OR idioma = 'en')
      ORDER BY manter_original, termo_origem`,
  )
    .bind(idioma)
    .all<TermoGlossario>();

  if (!results || results.length === 0) return '';

  const traduz = results.filter((t) => !t.manter_original);
  const mantem = results.filter((t) => t.manter_original);
  const partes: string[] = [];

  if (traduz.length) {
    partes.push(
      'GLOSSÁRIO OBRIGATÓRIO — estas traduções são travadas e não admitem variação:',
      ...traduz.map(
        (t) => `- "${t.termo_origem}" (${t.idioma}) → "${t.termo_pt}"${t.nota ? ` — ${t.nota}` : ''}`,
      ),
    );
  }

  if (mantem.length) {
    partes.push(
      '',
      'TERMOS QUE NÃO SE TRADUZEM — mantenha na língua de origem e, na PRIMEIRA',
      'ocorrência do texto, acrescente o significado aproximado entre parênteses:',
      ...mantem.map((t) => `- "${t.termo_origem}" → mantenha "${t.termo_origem}" (${t.nota ?? t.termo_pt})`),
    );
  }

  return partes.join('\n');
}

/* --------------------------------------------------------------- triagem */

export type Triagem = {
  publicar: boolean;
  motivo: string;
  nucleo: ChaveNucleo;
  tipo_de_item: 'lancamento' | 'caso' | 'regulacao' | 'mercado' | 'pesquisa';
  titulo_pt: string;
  resumo_pt: string;
  tema: string[];
  fornecedores: string[];
  uf: string | null;
};

const SISTEMA_TRIAGEM = `Você faz a triagem do radar do Instituto Automação, um veículo brasileiro que traduz notícia internacional de automação para o português no mesmo dia.

O que MERECE publicação: lançamento de produto ou linha, mudança de norma ou regulação, caso real de implantação com dado, movimento de mercado relevante (aquisição, fábrica, investimento), resultado de pesquisa aplicada.

O que NÃO merece: matéria promocional sem fato novo, conteúdo patrocinado, vaga de emprego, convite para webinar, retrospectiva, opinião sem dado, nota corporativa sem consequência técnica.

Na dúvida entre publicar e descartar, DESCARTE. Radar com ruído perde leitor mais rápido que radar com pouco item.

Escreva o título em português do Brasil: claro, específico, sem sensacionalismo e sem ponto final. O resumo tem 3 a 5 linhas, é redação sua a partir do que foi informado, e nunca copia frases do original.`;

const ESQUEMA_TRIAGEM = {
  type: 'object',
  additionalProperties: false,
  required: ['publicar', 'motivo', 'nucleo', 'tipo_de_item', 'titulo_pt', 'resumo_pt', 'tema', 'fornecedores', 'uf'],
  properties: {
    publicar: { type: 'boolean', description: 'true se merece entrar no radar' },
    motivo: { type: 'string', description: 'uma frase curta justificando' },
    nucleo: { type: 'string', enum: ORDEM_NUCLEOS },
    tipo_de_item: { type: 'string', enum: ['lancamento', 'caso', 'regulacao', 'mercado', 'pesquisa'] },
    titulo_pt: { type: 'string', description: 'título em pt-BR, sem ponto final' },
    resumo_pt: { type: 'string', description: '3 a 5 linhas, redação própria' },
    tema: { type: 'array', items: { type: 'string' }, description: 'de 1 a 4 temas em minúsculas' },
    fornecedores: { type: 'array', items: { type: 'string' }, description: 'empresas citadas; vazio se nenhuma' },
    uf: { type: ['string', 'null'], description: 'UF brasileira se o fato for local; senão null' },
  },
} as const;

export async function triar(
  env: Env,
  item: { titulo: string; resumo: string | null; idioma_origem: string; fonte: string },
): Promise<{ dado: Triagem; uso: Uso }> {
  const r = await pedirEstruturado<Triagem>(env, {
    modelo: MODELO_TRIAGEM,
    sistema: SISTEMA_TRIAGEM,
    entrada: `Fonte: ${item.fonte}\nIdioma: ${item.idioma_origem}\nTítulo: ${item.titulo}\n\n${item.resumo ?? '(sem resumo no feed)'}`,
    ferramenta: {
      nome: 'registrar_triagem',
      descricao: 'Registra a decisão de triagem e a classificação do item.',
      esquema: ESQUEMA_TRIAGEM as unknown as Record<string, unknown>,
    },
    simulacao: {
      publicar: true,
      motivo: '[simulado] lançamento com consequência técnica',
      nucleo: 'industria',
      tipo_de_item: 'lancamento',
      titulo_pt: `[simulado] ${item.titulo}`,
      resumo_pt:
        '[simulado] Resumo de desenvolvimento, gerado sem chamar a API. Serve para exercitar o pipeline inteiro sem gastar da conta de quem paga.',
      tema: ['simulado'],
      fornecedores: [],
      uf: null,
    },
  });
  return { dado: r.dado, uso: r.uso };
}

/* -------------------------------------------------------------- tradução */

const SISTEMA_TRADUCAO = `Você traduz para o português do Brasil o texto integral de um material liberado para imprensa por um fabricante de automação.

O critério é um só: a tradução mais fiel e mais próxima da realidade do setor no Brasil. Não a mais elegante, não a mais literal — a que um engenheiro brasileiro reconheceria como a forma correta de dizer aquilo.

REGRA DO TERMO SEM TRADUÇÃO — é a mais importante:
Quando um termo técnico NÃO tem equivalente consagrado em português no setor de automação, MANTENHA O TERMO NA LÍNGUA DE ORIGEM e, na primeira ocorrência, acrescente o significado aproximado entre parênteses. Exemplo da forma esperada: brownfield (planta já existente, com parque instalado a integrar).
Nas ocorrências seguintes, use só o termo original, sem repetir a explicação.
NUNCA invente um equivalente em português que ninguém usa no chão de fábrica. Termo traduzido ao pé da letra que o setor não reconhece é pior que o estrangeirismo: denuncia tradução automática na primeira linha e queima a credibilidade do texto inteiro.
Na dúvida entre traduzir e manter, MANTENHA e explique.

Demais regras:
- Traduza o conteúdo inteiro, sem resumir, sem cortar e sem acrescentar.
- Não invente número, data, nome de produto nem afirmação que não esteja no original.
- Nome próprio de produto, linha, norma e protocolo NÃO se traduz nunca.
- Respeite o glossário: a primeira lista é obrigatória, a segunda diz o que manter na língua de origem.
- Português técnico brasileiro, na voz de quem escreve para engenheiro e integrador. Sem adjetivo publicitário: "revolucionário", "líder de mercado", "solução completa" saem.
- Devolva SOMENTE o texto traduzido, em parágrafos separados por linha em branco. Sem título, sem comentário, sem marcação.`;

export async function traduzir(
  env: Env,
  item: { titulo: string; resumo: string | null; idioma_origem: string },
  glossario: string,
): Promise<{ dado: string; uso: Uso }> {
  const r = await pedirTexto(env, {
    modelo: MODELO_OBRA,
    sistema: SISTEMA_TRADUCAO,
    sistemaCacheavel: glossario || undefined,
    entrada: `Idioma de origem: ${item.idioma_origem}\n\n${item.titulo}\n\n${item.resumo ?? ''}`,
    maxTokens: 4000,
    simulacao:
      '[simulado] Tradução de desenvolvimento. O pipeline foi exercitado sem chamar a API — ver IA_SIMULAR em README.md.',
  });
  return { dado: r.dado, uso: r.uso };
}

/* ------------------------------------------------------------ contexto BR */

const SISTEMA_CONTEXTO = `Você escreve o parágrafo "o que isso muda aqui" do Instituto Automação — duas ou três frases, no máximo, sobre o que aquela notícia internacional significa para quem trabalha com automação no Brasil.

Foque no que é prático e verificável: se há representação ou distribuidor no país, se afeta norma brasileira, se muda custo ou prazo para o integrador daqui, se depende de importação, se o parque instalado no Brasil é compatível.

Regras duras:
- NUNCA invente presença comercial, preço, prazo ou parceria. Se você não sabe, diga o que a ausência de informação implica na prática.
- Nada de encher linguiça: se não houver consequência local relevante, escreva exatamente por que o efeito aqui é pequeno.
- Sem adjetivo publicitário e sem futurologia.

Este parágrafo é a razão de o site existir: é o que o leitor não obtém sozinho jogando a matéria no tradutor.`;

export async function contextualizar(
  env: Env,
  item: { titulo_pt: string; resumo_pt: string; fornecedores: string[] },
): Promise<{ dado: string; uso: Uso }> {
  const r = await pedirTexto(env, {
    modelo: MODELO_OBRA,
    sistema: SISTEMA_CONTEXTO,
    entrada: `${item.titulo_pt}\n\n${item.resumo_pt}\n\nEmpresas citadas: ${item.fornecedores.join(', ') || 'nenhuma'}`,
    maxTokens: 500,
    simulacao:
      '[simulado] Contexto brasileiro de desenvolvimento, gerado sem chamar a API.',
  });
  return { dado: r.dado, uso: r.uso };
}
