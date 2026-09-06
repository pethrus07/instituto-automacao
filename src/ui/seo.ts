/**
 * O que vai no <head> e não é design: título da aba, descrição, URLs
 * absolutas. Regras pequenas, mas cada uma tem um motivo medido.
 */

export const NOME_SITE = 'Instituto Automação';

/**
 * O título da aba e do resultado de busca. O Google corta perto de 60
 * caracteres; um título de peça tem 100. Quando a peça declara `titulo_curto`,
 * ele vai aqui; o título inteiro continua no <h1> e no og:title.
 */
export function tituloDaAba(titulo: string, curto?: string): string {
  const base = (curto ?? titulo).trim();
  return base === NOME_SITE ? base : `${base} — ${NOME_SITE}`;
}

/**
 * A descrição em até ~160 caracteres, cortada em fim de frase quando dá, em
 * fim de palavra quando não dá. O lead de uma Análise tem 380; a busca mostra
 * 160 e reticências no meio de uma palavra é o que sobra sem isto.
 */
export function descricaoCurta(texto: string | undefined, maximo = 158): string | undefined {
  if (!texto) return undefined;
  const limpo = texto.replace(/\s+/g, ' ').trim();
  if (limpo.length <= maximo) return limpo;
  const janela = limpo.slice(0, maximo);
  const fimDeFrase = Math.max(janela.lastIndexOf('. '), janela.lastIndexOf('! '), janela.lastIndexOf('? '));
  if (fimDeFrase > maximo * 0.55) return janela.slice(0, fimDeFrase + 1);
  const fimDePalavra = janela.lastIndexOf(' ');
  return `${janela.slice(0, fimDePalavra > 0 ? fimDePalavra : maximo).replace(/[,;:—-]$/, '')}…`;
}

/** Junta base e caminho sem duplicar barra. */
export function absoluta(base: string, caminho: string): string {
  if (/^https?:\/\//.test(caminho)) return caminho;
  return `${base.replace(/\/$/, '')}/${caminho.replace(/^\//, '')}`;
}

/** A origem de uma URL absoluta, ou '' quando não há URL (a página 404). */
export function origemDe(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}
