/**
 * Dados estruturados — o que faz o Google entender o site em vez de só lê-lo:
 * quem publica (Organization), o que é o site (WebSite), o que é cada peça
 * (NewsArticle/Article com autor, data, fonte citada e imagem), onde ela está
 * (BreadcrumbList), o que são as seções (CollectionPage), a agenda como
 * resultado rico (Event/ItemList), o glossário como conjunto de termos e o
 * dataset como Dataset — que é o que o Google Dataset Search indexa.
 *
 * Tudo aqui é derivado do que já está na página. Nada é afirmado no JSON-LD
 * que o leitor não veja no HTML: dado estruturado que diverge da página é
 * penalizado, e com razão.
 */
import type { Evento, TermoPublico } from '../db';
import type { Autor, Peca } from '../conteudo';
import { autorDe, caminho, caminhoAutor, ROTULO_SECAO, ROTULO_TEMA } from '../conteudo';
import { NOME_SITE, absoluta } from './seo';

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

const DESCRICAO_SITE =
  'O que o setor de automação publica lá fora, lido daqui: notícias escolhidas e escritas em português, relatórios com dado próprio, e a medição de quanto tempo cada assunto leva para chegar ao Brasil.';

/* ------------------------------------------------------------ quem publica */

export function organizacaoLd(base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${base}/#organizacao`,
    name: NOME_SITE,
    url: `${base}/`,
    description: DESCRICAO_SITE,
    logo: { '@type': 'ImageObject', url: absoluta(base, '/icones/icone-512.png'), width: 512, height: 512 },
    image: absoluta(base, '/og/padrao.png'),
    knowsAbout: ['automação industrial', 'robótica', 'automação de processos', 'indústria 4.0'],
    areaServed: { '@type': 'Country', name: 'Brasil' },
  };
}

export function siteLd(base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#site`,
    url: `${base}/`,
    name: NOME_SITE,
    description: DESCRICAO_SITE,
    inLanguage: 'pt-BR',
    publisher: { '@id': `${base}/#organizacao` },
  };
}

/* ------------------------------------------------------------------ a peça */

export function pecaLd(p: Peca, base: string) {
  const url = absoluta(base, caminho(p));
  const imagem = absoluta(base, p.og);
  return {
    '@context': 'https://schema.org',
    '@type': p.secao === 'noticias' ? 'NewsArticle' : 'Article',
    '@id': url,
    mainEntityOfPage: url,
    url,
    // o Google recomenda até 110 caracteres no headline; o título inteiro fica no h1
    headline: (p.tituloCurto ?? p.titulo).slice(0, 110),
    alternativeHeadline: p.tituloCurto ? p.titulo : undefined,
    description: p.lead,
    image: p.imagem
      ? { '@type': 'ImageObject', url: imagem, width: p.imagem.largura, height: p.imagem.altura, creditText: p.imagem.credito }
      : { '@type': 'ImageObject', url: imagem, width: 1200, height: 630 },
    datePublished: p.data,
    dateModified: p.data,
    /* schema.org aceita Organization como autor, e é o que um boletim gerado
       é: não há pessoa a creditar, e pôr uma seria falso. */
    author: p.autor ? pessoa(autorDe(p), p.autor, base) : { '@id': `${base}/#organizacao` },
    publisher: { '@id': `${base}/#organizacao` },
    articleSection: ROTULO_SECAO[p.secao],
    keywords: [ROTULO_TEMA[p.tema], 'automação'].join(', '),
    wordCount: p.palavras,
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    // peça paga se declara também para a máquina: `sponsor` é o campo que o
    // schema.org tem para isso, e deixar a máquina descobrir sozinha pelo
    // texto do rótulo seria confiar a identificação a um parser
    sponsor: p.patrocinada ? { '@type': 'Organization', name: p.patrocinada.anunciante } : undefined,
    // a fonte original, quando a peça parte de terceiro: é citação, não cópia
    isBasedOn: p.fonte ? p.fonte.url : undefined,
    citation: p.fonte
      ? { '@type': 'CreativeWork', name: p.fonte.nome, url: p.fonte.url, inLanguage: p.fonte.idioma, datePublished: p.fonte.publicado }
      : undefined,
  };
}

/* ----------------------------------------------------------------- quem escreve */

/** A pessoa como o Google a vê: com a página dela aqui e o currículo lá fora. */
function pessoa(a: Autor | null, nome: string, base: string) {
  if (!a) return { '@type': 'Person', name: nome };
  return {
    '@type': 'Person',
    '@id': `${absoluta(base, caminhoAutor(a))}#pessoa`,
    name: a.nome,
    jobTitle: a.papel,
    url: absoluta(base, caminhoAutor(a)),
    sameAs: a.link ? [a.link] : undefined,
    image: a.foto ? absoluta(base, `/autores/${a.foto.arquivo}`) : undefined,
  };
}

/** A página do autor: ProfilePage com a Person dentro — é o que a busca mostra como "quem é". */
export function perfilLd(a: Autor, pecas: readonly Peca[], base: string) {
  const url = absoluta(base, caminhoAutor(a));
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': url,
    url,
    name: `${a.nome} — ${NOME_SITE}`,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': `${base}/#site` },
    mainEntity: {
      ...pessoa(a, a.nome, base),
      description: a.bio.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 300),
      worksFor: { '@id': `${base}/#organizacao` },
    },
    hasPart: pecas.slice(0, 50).map((p) => ({ '@type': p.secao === 'noticias' ? 'NewsArticle' : 'Article', '@id': absoluta(base, caminho(p)), headline: p.tituloCurto ?? p.titulo, datePublished: p.data })),
  };
}

/* ------------------------------------------------------------- onde estou */

export function trilhaLd(itens: { nome: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.nome, item: it.url })),
  };
}

/* ------------------------------------------------------------- as seções */

export function colecaoLd(nome: string, descricao: string, url: string, pecas: readonly Peca[], base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': url,
    url,
    name: `${nome} — ${NOME_SITE}`,
    description: descricao,
    inLanguage: 'pt-BR',
    isPartOf: { '@id': `${base}/#site` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: pecas.length,
      itemListElement: pecas.slice(0, 50).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluta(base, caminho(p)),
        name: p.tituloCurto ?? p.titulo,
      })),
    },
  };
}

/* ------------------------------------------------------------- a agenda */

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
    organizer: e.organizador ? { '@type': 'Organization', name: e.organizador } : undefined,
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
    name: `Agenda de automação — ${NOME_SITE}`,
    numberOfItems: eventos.length,
    itemListElement: eventos.slice(0, 30).map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: eventoLd(e, urlBase),
    })),
  };
}

/* ---------------------------------------------------------- o glossário */

export function glossarioLd(termos: TermoPublico[], base: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${base}/glossario`,
    name: `Glossário de automação — ${NOME_SITE}`,
    inLanguage: 'pt-BR',
    hasDefinedTerm: termos.map((t) => ({
      '@type': 'DefinedTerm',
      name: t.termo_origem,
      alternateName: t.manter_original ? undefined : t.termo_pt,
      description: t.nota ?? (t.manter_original ? `mantém ${t.termo_origem}` : t.termo_pt),
      inDefinedTermSet: `${base}/glossario`,
    })),
  };
}

/* ------------------------------------------------------------ o dataset */

export function datasetLd(base: string, d: { nome: string; descricao: string; arquivo: string; publicado: string; periodo: string; linhas: number }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': absoluta(base, d.arquivo),
    name: d.nome,
    description: d.descricao,
    url: `${base}/blueprints#dataset`,
    creator: { '@id': `${base}/#organizacao` },
    publisher: { '@id': `${base}/#organizacao` },
    datePublished: d.publicado,
    temporalCoverage: d.periodo,
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    keywords: ['automação industrial', 'imprensa', 'feeds RSS', 'Brasil'],
    variableMeasured: ['pais', 'fonte', 'publicado', 'titulo', 'url'],
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'text/csv',
        contentUrl: absoluta(base, d.arquivo),
        contentSize: `${d.linhas} linhas`,
      },
    ],
  };
}
