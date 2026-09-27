/**
 * O GUIA de uma pauta — o "pré-pronto" que o autor encontra no editor.
 *
 * 27/09/2026, pedido do Pedro: "nos temas da lista, deve ir bem pré-pronto
 * já, bem preenchido". É o "50% do caminho andado" do sócio: o autor abre a
 * pauta e já tem o resumo em tópicos, o que responder em cada seção, as
 * armadilhas que costumam aparecer, os termos para explicar e o quiz inteiro.
 * Ele escreve os parágrafos com a experiência dele e revisa o resto.
 *
 * ⚠️ É ROTEIRO EDITORIAL do Instituto, não texto do autor. As `dicas` de cada
 * seção nunca vão para o texto publicado — aparecem no editor, acima do
 * parágrafo. O resumo, os títulos das armadilhas e o quiz entram preenchidos
 * e o autor revisa e assina. Os parágrafos continuam vazios: é ali que está
 * o que só quem faz sabe.
 */
export type Guia = {
  /** 3 ou 4 tópicos do "Resumo rápido": frases curtas do que o artigo entrega */
  resumo: string[];
  /** um por item de `cobrir` da pauta, na MESMA ordem: 2 a 4 perguntas ou pontos que a seção deve responder */
  secoes: { dicas: string[] }[];
  /** 2 a 4 erros comuns — só o título; o autor escreve o que acontece e como evitar */
  armadilhas: string[];
  /** exatamente 3 perguntas, cada uma com a certa e 2 erradas plausíveis */
  quiz: { pergunta: string; certa: string; erradas: string[] }[];
  /** 2 a 4 termos para explicar sem o leitor sair do texto */
  termos: { termo: string; definicao: string }[];
};
