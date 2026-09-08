/**
 * RSS, sitemap e robots — a distribuição.
 *
 * O RSS não é nostalgia: gente de automação ainda usa leitor de feed, e
 * feed é distribuição que não custa nada. Na v2 tudo sai do conteúdo
 * compilado — zero banco, zero espera.
 */
import type { Env } from './config';
import { autores, caminho, caminhoAutor, pecasDoAutor, porSecao, ROTULO_SECAO, todas, type Peca, type Secao } from './conteudo';
import { listarAgenda } from './db';

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
function rfc822(data: string | null): string {
  const d = data ? new Date(data.length === 10 ? data + 'T12:00:00Z' : data) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

function itemRss(base: string, p: Peca): string {
  const url = base + caminho(p);
  return `    <item>
      <title>${x(p.titulo)}</title>
      <link>${x(url)}</link>
      <guid isPermaLink="true">${x(url)}</guid>
      <pubDate>${rfc822(p.data)}</pubDate>
      <description>${x(p.lead)}</description>
      <dc:creator>${x(p.autor)}</dc:creator>
      <category>${x(ROTULO_SECAO[p.secao])}</category>
    </item>`;
}

/** Um feed por seção, e um com tudo. */
export function feed(env: Env, secao?: Secao): string {
  const base = env.SITE_URL;
  const pecas = (secao ? porSecao(secao) : todas()).slice(0, 40);
  const nome = secao ? `${ROTULO_SECAO[secao]} — ${env.SITE_NOME}` : env.SITE_NOME;
  const rota = secao ? `/feed/${secao}.xml` : '/feed.xml';
  const descricao = secao
    ? `${ROTULO_SECAO[secao]} do Instituto Automação.`
    : 'O que o setor de automação publica lá fora, lido daqui.';

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${x(nome)}</title>
    <link>${x(base)}${secao ? `/${secao}` : '/'}</link>
    <atom:link href="${x(base)}${rota}" rel="self" type="application/rss+xml" />
    <description>${x(descricao)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${rfc822(pecas[0]?.data ?? null)}</lastBuildDate>
${pecas.map((p) => itemRss(base, p)).join('\n')}
  </channel>
</rss>`;
}

export async function sitemap(env: Env): Promise<string> {
  const base = env.SITE_URL;
  const urls: { loc: string; mod?: string | null }[] = [
    { loc: `${base}/` },
    { loc: `${base}/noticias` },
    { loc: `${base}/artigos` },
    { loc: `${base}/relatorios` },
    { loc: `${base}/giro` },
    { loc: `${base}/agenda` },
    { loc: `${base}/autores` },
    { loc: `${base}/glossario` },
    { loc: `${base}/blueprints` },
    { loc: `${base}/apoie` },
    { loc: `${base}/marca` },
  ];

  for (const p of todas()) urls.push({ loc: base + caminho(p), mod: p.data });
  // só quem já assinou algo tem página que vale indexar
  for (const a of autores()) if (pecasDoAutor(a).length) urls.push({ loc: base + caminhoAutor(a), mod: pecasDoAutor(a)[0]?.data });
  // Só eventos à frente: sitemap com evento passado gasta rastreio à toa.
  for (const e of await listarAgenda(env.DB, {}, 200)) urls.push({ loc: `${base}/agenda/${e.slug}` });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${x(u.loc)}</loc>${u.mod ? `<lastmod>${x(u.mod.slice(0, 10))}</lastmod>` : ''}</url>`).join('\n')}
</urlset>`;
}

export function robots(env: Env): string {
  // Homologação não entra em índice nenhum: o endereço não é o definitivo.
  if (env.HOMOLOG === '1') return `User-agent: *\nDisallow: /\n`;
  return `User-agent: *
Allow: /

# Só POST — não há o que indexar.
Disallow: /agenda/enviar
Disallow: /assinar
Disallow: /autores/escrever
Disallow: /apoie/enviar

Sitemap: ${env.SITE_URL}/sitemap.xml
`;
}
