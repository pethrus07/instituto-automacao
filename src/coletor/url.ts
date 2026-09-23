/**
 * Canonicalização de URL — a base do dedup.
 *
 * A mesma notícia chega com rastreio diferente em cada feed, cada
 * newsletter e cada rede. Sem normalizar, o radar publica a mesma coisa
 * quatro vezes e a base do Panorama conta quatro lançamentos onde houve um.
 */

/** Parâmetros que nunca identificam conteúdo — só de onde o clique veio. */
const LIXO = [
  /^utm_/i,
  /^ga_/i,
  /^mc_/i,
  /^pk_/i,
  /^hsa_/i,
  /^_hs/i,
  /^(fbclid|gclid|dclid|gbraid|wbraid|msclkid|twclid|igshid|ttclid|yclid)$/i,
  /^(ref|refsrc|referrer|source|src|cmpid|campaign_id|spm|scid)$/i,
  /^(at_medium|at_campaign|at_custom\d?)$/i,
  /^(guce_referrer|guccounter)$/i,
];

const ehLixo = (chave: string) => LIXO.some((r) => r.test(chave));

/**
 * Devolve a URL canônica, ou null se não for http(s) — feed com `javascript:`
 * ou caminho relativo quebrado não entra na base.
 */
export function canonicalizar(bruta: string, base?: string): string | null {
  let u: URL;
  try {
    u = base ? new URL(bruta, base) : new URL(bruta);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

  // Host é case-insensitive; caminho não é.
  u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
  u.protocol = 'https:';
  u.hash = '';
  u.port = '';

  for (const chave of [...u.searchParams.keys()]) {
    if (ehLixo(chave)) u.searchParams.delete(chave);
  }
  // Ordem de query não muda conteúdo, mas muda a string.
  u.searchParams.sort();

  // Barra final só importa na raiz.
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.slice(0, -1);
  }

  return u.toString();
}

/* A `chaveAssunto` morava aqui e foi removida em 23/09/2026. Ela montava a
   chave com o título inteiro ordenado, o que só agrupava textos com o conjunto
   idêntico de palavras — entre idiomas, nunca, e por isso o relógio marcou
   zero desde sempre. O agrupamento agora é por token raro, em ./assunto.ts. */

/** Slug de URL. Só é gravado quando o item é publicado — e nunca muda depois. */
export function slugificar(titulo: string, max = 70): string {
  const base = titulo
    .normalize('NFD')
    // NFD separa a letra do acento; \p{M} tira as marcas combinantes.
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base.length <= max) return base;
  const corte = base.slice(0, max);
  const ultimo = corte.lastIndexOf('-');
  return ultimo > max * 0.6 ? corte.slice(0, ultimo) : corte;
}
