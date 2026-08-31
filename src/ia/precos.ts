/**
 * Modelos por etapa e o preço de cada um.
 *
 * A escolha está em docs/ARQUITETURA.md §5 e não é sobre economizar por
 * economizar: triagem é decisão binária em volume alto, e tradução é obra
 * publicada com o nome do Instituto — errar termo ali custa autoridade.
 *
 * ⚠️ Os ids são completos como estão. Nunca acrescentar sufixo de data.
 */

/** Triagem, classificação e resumo curto. Volume alto, tarefa fácil. */
export const MODELO_TRIAGEM = 'claude-haiku-4-5';

/** Tradução integral e "o que isso muda aqui". É o que vai ao ar assinado. */
export const MODELO_OBRA = 'claude-sonnet-5';

/** USD por milhão de tokens. Conferir contra a página de preços a cada trimestre. */
const TABELA: Record<string, { entrada: number; saida: number }> = {
  'claude-haiku-4-5': { entrada: 1.0, saida: 5.0 },
  'claude-sonnet-5': { entrada: 2.0, saida: 10.0 },
};

export type Uso = {
  modelo: string;
  tokens_in: number;
  tokens_out: number;
  usd: number;
};

/**
 * Custo de uma chamada.
 *
 * Token lido de cache custa ~10% e token escrito em cache custa ~25% a mais.
 * Como o prefixo estável (sistema + glossário) é cacheado, ignorar isso
 * superestimaria a conta — e teto que superestima pausa o coletor à toa.
 */
export function calcularUsd(
  modelo: string,
  u: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null },
): number {
  const p = TABELA[modelo];
  if (!p) return 0;
  const leituraCache = u.cache_read_input_tokens ?? 0;
  const escritaCache = u.cache_creation_input_tokens ?? 0;
  const entrada =
    (u.input_tokens * p.entrada + leituraCache * p.entrada * 0.1 + escritaCache * p.entrada * 1.25) / 1_000_000;
  const saida = (u.output_tokens * p.saida) / 1_000_000;
  return entrada + saida;
}

/**
 * Conversão para real. É estimativa declarada, não cotação — serve para o
 * teto diário fazer sentido para quem paga a conta (o sócio), não para
 * contabilidade.
 */
export function usdParaBrl(usd: number, cotacao: number): number {
  return usd * cotacao;
}
