/**
 * Quem apoia o Instituto — e aparece na capa por isso.
 *
 * Pedido do sócio (feedback de 07/09/2026): um espaço de parceiro entre o
 * cabeçalho e a primeira notícia, visto por todo leitor porque carrega com
 * a página. É a única superfície comercial do site, e tem regra:
 *
 *   · parceiro aparece com nome, logo e uma frase — não escreve notícia,
 *     não escolhe pauta, não recebe veredito melhor;
 *   · a lista mora AQUI, no código, e entra por commit — quem vira parceiro
 *     é decisão de gente, com contrato, não de painel;
 *   · com a lista vazia, o espaço não some: diz de quem é e como chegar lá
 *     (/apoie). Espaço em branco parece abandono; espaço com dono parece
 *     oferta.
 *
 * O logo vai em publico/parceiros/ (SVG ou PNG), servido como asset.
 */
export type Parceiro = {
  nome: string;
  /** para onde o clique leva */
  url: string;
  /** uma frase, dita pelo parceiro: o que ele faz — sem superlativo */
  frase: string;
  /** caminho público do logo, ex.: /parceiros/acme.svg; sem ele, o nome em texto */
  logo?: string;
  /** desde quando, AAAA-MM — aparece na página /apoie */
  desde: string;
};

export const PARCEIROS: readonly Parceiro[] = [];

/** O parceiro da capa: o primeiro da lista. Um espaço, um parceiro. */
export function parceiroDaCapa(): Parceiro | null {
  return PARCEIROS[0] ?? null;
}
