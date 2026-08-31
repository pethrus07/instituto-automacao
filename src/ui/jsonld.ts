/**
 * Dados estruturados — o que faz o Google mostrar a agenda como resultado
 * rico, com data e local na própria busca.
 *
 * É o retorno concreto de manter calendário: notícia decai em 48 h, mas
 * "feiras de automação 2027" é busca que se repete o ano inteiro.
 */
import type { Evento } from '../db';

/**
 * Serializa para dentro de <script type="application/ld+json">.
 *
 * ⚠️ `</script>` dentro de uma string do JSON fecha a tag e o resto do
 * documento vira script. Nome de evento é texto de terceiro (organizador
 * envia pelo formulário), então escapar aqui não é zelo: é a diferença
 * entre dado estruturado e XSS.
 */
export function ldJson(objeto: unknown): string {
  return JSON.stringify(objeto)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

const MODO: Record<string, string> = {
  presencial: 'https://schema.org/OfflineEventAttendanceMode',
  online: 'https://schema.org/OnlineEventAttendanceMode',
  hibrido: 'https://schema.org/MixedEventAttendanceMode',
};

export function eventoLd(e: Evento, urlBase: string) {
  const lugar =
    e.formato === 'online'
      ? { '@type': 'VirtualLocation', url: e.url ?? urlBase }
      : {
          '@type': 'Place',
          name: [e.cidade, e.uf].filter(Boolean).join(' · ') || e.pais,
          address: {
            '@type': 'PostalAddress',
            addressLocality: e.cidade ?? undefined,
            addressRegion: e.uf ?? undefined,
            addressCountry: e.pais,
          },
        };

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.nome,
    startDate: e.inicio,
    endDate: e.fim ?? undefined,
    eventAttendanceMode: MODO[e.formato],
    eventStatus: 'https://schema.org/EventScheduled',
    description: e.descricao ?? undefined,
    url: `${urlBase}/agenda/${e.slug}`,
    location: lugar,
    organizer: e.organizador
      ? { '@type': 'Organization', name: e.organizador }
      : undefined,
    // Só declara oferta quando o dado existe. Inventar preço em dado
    // estruturado é pior que omitir: o Google mostra na busca.
    offers:
      e.preco === 'gratuito'
        ? { '@type': 'Offer', price: '0', priceCurrency: 'BRL', availability: 'https://schema.org/InStock', url: e.url ?? undefined }
        : undefined,
  };
}

/** A listagem inteira, para o Google entender a página como um índice. */
export function agendaLd(eventos: Evento[], urlBase: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Agenda de automação — Instituto Automação',
    numberOfItems: eventos.length,
    itemListElement: eventos.slice(0, 30).map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: eventoLd(e, urlBase),
    })),
  };
}
