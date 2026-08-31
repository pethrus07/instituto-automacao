/**
 * RSS por núcleo, sitemap e robots.
 *
 * O RSS não é nostalgia: gente de automação ainda usa leitor de feed, e
 * feed é distribuição que não custa nada. Além disso, o `<head>` do site já
 * anunciava quatro feeds desde a primeira sprint — promessa no ar sem
 * lastro, apontada pelo próprio QA. Aqui ela é cumprida.
 */
import type { Env, ChaveNucleo } from './config';
import { NUCLEOS, ORDEM_NUCLEOS } from './config';
import { listarRadar, listarObras, listarAgenda, type Obra, type ItemRadar } from './db';
import { caminhoObra } from './ui/pecas';

/** XML não perdoa `&` solto — nem em título de notícia alemã. */
function x(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** RFC 822, que é o que o RSS 2.0 espera — não ISO. */
function rfc822(iso: string | null): string {
  const d = iso ? new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z') : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function feedDoNucleo(env: Env, nucleo: ChaveNucleo): Promise<string> {
  const n = NUCLEOS[nucleo];
  const base = env.SITE_URL;

  const itens = await listarRadar(env.DB, nucleo, 30);
  const obras = await listarObras(env.DB, { nucleo }, 10);

  type Entrada = { titulo: string; url: string; data: string | null; descricao: string; autor?: string };

  const deItem = (i: ItemRadar): Entrada => ({
    titulo: i.titulo,
    url: `${base}/${i.nucleo}/${i.slug}`,
    data: i.publicado_em,
    // O feed leva o contexto brasileiro junto: é a camada que justifica o
    // site, e quem lê por leitor de feed nunca abriria a página sem ela.
    descricao: [i.contexto_br, i.resumo].filter(Boolean).join('\n\n') || i.titulo,
  });

  const deObra = (o: Obra): Entrada => ({
    titulo: `${o.formato === 'analise' ? 'Análise' : o.formato === 'caso' ? 'Caso' : o.formato === 'panorama' ? 'Panorama' : 'Leitura'}: ${o.titulo}`,
    url: base + caminhoObra(o),
    data: o.publicado_em,
    descricao: o.lead ?? o.corpo.slice(0, 400),
    autor: o.assinada ? o.autor : undefined,
  });

  const entradas = [...obras.map(deObra), ...itens.map(deItem)]
    .sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))
    .slice(0, 40);

  const corpo = entradas
    .map(
      (e) => `    <item>
      <title>${x(e.titulo)}</title>
      <link>${x(e.url)}</link>
      <guid isPermaLink="true">${x(e.url)}</guid>
      <pubDate>${rfc822(e.data)}</pubDate>
      <description>${x(e.descricao)}</description>${e.autor ? `\n      <dc:creator>${x(e.autor)}</dc:creator>` : ''}
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${x(n.nome)} — Instituto Automação</title>
    <link>${x(base)}/${nucleo}</link>
    <atom:link href="${x(base)}/feed/${nucleo}.xml" rel="self" type="application/rss+xml" />
    <description>${x(n.resumo)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${rfc822(entradas[0]?.data ?? null)}</lastBuildDate>
${corpo}
  </channel>
</rss>`;
}

export async function sitemap(env: Env): Promise<string> {
  const base = env.SITE_URL;
  const urls: { loc: string; mod?: string | null }[] = [
    { loc: `${base}/` },
    { loc: `${base}/agenda` },
    ...ORDEM_NUCLEOS.map((n) => ({ loc: `${base}/${n}` })),
  ];

  for (const n of ORDEM_NUCLEOS) {
    for (const i of await listarRadar(env.DB, n, 200)) {
      urls.push({ loc: `${base}/${i.nucleo}/${i.slug}`, mod: i.publicado_em });
    }
  }
  for (const o of await listarObras(env.DB, {}, 200)) {
    urls.push({ loc: base + caminhoObra(o), mod: o.publicado_em });
  }
  // Só eventos à frente: sitemap com evento passado gasta rastreio à toa.
  for (const e of await listarAgenda(env.DB, {}, 200)) {
    urls.push({ loc: `${base}/agenda/${e.slug}` });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${x(u.loc)}</loc>${u.mod ? `<lastmod>${x(u.mod.slice(0, 10))}</lastmod>` : ''}</url>`,
  )
  .join('\n')}
</urlset>`;
}

export function robots(env: Env): string {
  return `User-agent: *
Allow: /

# O envio de evento é POST e não tem o que indexar.
Disallow: /agenda/enviar

Sitemap: ${env.SITE_URL}/sitemap.xml
`;
}
