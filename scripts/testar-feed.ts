/**
 * Teste do parser de feed e da canonicalização — sem Worker, sem rede.
 *
 *   npm test
 *
 * Existe porque item não coletado NÃO VOLTA: o feed guarda só as últimas
 * dezenas de entradas. Um parser que engole item em silêncio é uma perda
 * permanente na base do Panorama, e nada na tela denuncia.
 */
import { lerFeed, paraISO } from '../src/coletor/feed.ts';
import { ehIndice, lerIndiceSitemaps, lerSitemapNoticias } from '../src/coletor/sitemap.ts';
import { canonicalizar, slugificar } from '../src/coletor/url.ts';
import { renderizarObra, minutosDeLeitura } from '../src/ui/markdown.ts';

let ok = 0;
let falhou = 0;

function conferir(nome: string, real: unknown, esperado: unknown) {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) {
    ok++;
    console.log(`  ok   ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHA ${nome}\n        esperado: ${b}\n        veio:     ${a}`);
  }
}

/* ------------------------------------------------------------------ RSS 2.0 */
const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Sala de imprensa</title>
  <item>
    <title><![CDATA[Neue Steuerung mit vorausschauender Diagnose]]></title>
    <link>https://press.exemplo.com/2026/08/clp?utm_source=rss&amp;utm_medium=feed</link>
    <pubDate>Sat, 30 Aug 2026 09:12:00 GMT</pubDate>
    <description>&lt;p&gt;Die neue Reihe l&#228;uft &amp;amp; misst direkt in der SPS.&lt;/p&gt;</description>
    <guid isPermaLink="false">press-2026-08-clp</guid>
  </item>
  <item>
    <title>Segundo item</title>
    <link>https://press.exemplo.com/2026/08/outro/</link>
    <pubDate>Fri, 29 Aug 2026 16:40:00 +0000</pubDate>
  </item>
</channel></rss>`;

console.log('RSS 2.0');
const rss = lerFeed(RSS);
conferir('lê os dois itens', rss.length, 2);
conferir('CDATA some do título', rss[0]!.titulo, 'Neue Steuerung mit vorausschauender Diagnose');
conferir('pubDate RFC822 vira ISO', rss[0]!.publicado, '2026-08-30T09:12:00.000Z');
conferir(
  'description perde HTML e resolve entidade dupla',
  rss[0]!.resumo,
  'Die neue Reihe läuft & misst direkt in der SPS.',
);
conferir('item sem description fica null', rss[1]!.resumo, null);

/* --------------------------------------------------------------- Atom 1.0 */
const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Imprensa técnica</title>
  <link rel="self" href="https://exemplo.org/feed"/>
  <entry>
    <title>Revised safety standard for collaborative cells</title>
    <link rel="self" href="https://exemplo.org/feed/1"/>
    <link rel="alternate" href="https://exemplo.org/2026/08/norma-cobots"/>
    <published>2026-08-29T16:40:00Z</published>
    <updated>2026-08-30T02:00:00Z</updated>
    <summary type="html">&lt;b&gt;Separation distance&lt;/b&gt; changes.</summary>
    <id>tag:exemplo.org,2026:1</id>
  </entry>
</feed>`;

console.log('\nAtom 1.0');
const atom = lerFeed(ATOM);
conferir('lê a entrada', atom.length, 1);
conferir('pega o link alternate, não o self', atom[0]!.link, 'https://exemplo.org/2026/08/norma-cobots');
conferir('published vence updated', atom[0]!.publicado, '2026-08-29T16:40:00.000Z');
conferir('summary vira texto', atom[0]!.resumo, 'Separation distance changes.');

/* ------------------------------------------------------------ RDF / RSS 1.0 */
const RDF = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns="http://purl.org/rss/1.0/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <item rdf:about="https://exemplo.com.br/n/1">
    <title>Fabricante anuncia linha no Brasil</title>
    <link>https://exemplo.com.br/n/1</link>
    <dc:date>2026-08-28T11:00:00-03:00</dc:date>
  </item>
</rdf:RDF>`;

console.log('\nRDF / RSS 1.0');
const rdf = lerFeed(RDF);
conferir('lê o item com namespace', rdf.length, 1);
conferir('dc:date vira ISO UTC', rdf[0]!.publicado, '2026-08-28T14:00:00.000Z');

/* ------------------------------------------------------------------- bordas */
console.log('\nBordas');
conferir('feed vazio não quebra', lerFeed('<rss><channel></channel></rss>').length, 0);
conferir('lixo não quebra', lerFeed('não é xml').length, 0);
conferir('item sem link é descartado', lerFeed('<rss><item><title>Só título</title></item></rss>').length, 0);
conferir('data ilegível vira null', paraISO('ontem à tarde'), null);
conferir('data no futuro é recusada', paraISO('Mon, 01 Jan 2035 00:00:00 GMT'), null);

/* ------------------------------------------------------------- canonical */
console.log('\nCanonicalização');
conferir(
  'tira utm e ordena a query',
  canonicalizar('https://WWW.Exemplo.com/a/b/?utm_source=x&b=2&a=1#topo'),
  'https://exemplo.com/a/b?a=1&b=2',
);
conferir(
  'as duas formas da mesma URL colidem',
  canonicalizar('http://exemplo.com/n/1/?fbclid=abc') === canonicalizar('https://www.exemplo.com/n/1'),
  true,
);
conferir('resolve link relativo', canonicalizar('/n/2', 'https://exemplo.com/feed'), 'https://exemplo.com/n/2');
conferir('recusa protocolo estranho', canonicalizar('javascript:alert(1)'), null);
conferir('barra final só some fora da raiz', canonicalizar('https://exemplo.com/'), 'https://exemplo.com/');

/* ------------------------------------------------------------------- slug */
console.log('\nSlug');
/* O agrupamento de assunto saiu daqui em 23/09/2026 e tem suíte própria:
   scripts/testar-assunto.ts. */
conferir('slug sem acento e sem cauda quebrada', slugificar('Automação é assunto sério'), 'automacao-e-assunto-serio');

/* ===================================================================== */
/* Markdown da obra — e o que ele NÃO pode deixar passar                  */
/* ===================================================================== */
console.log('\nMarkdown da obra');

conferir(
  'parágrafo vira <p>',
  renderizarObra('Uma frase.'),
  '<p>Uma frase.</p>',
);
conferir(
  'título começa no h2 (o h1 é o título da obra)',
  renderizarObra('## Seção'),
  '<h2>Seção</h2>',
);
conferir(
  'lista com marcador',
  renderizarObra('- um\n- dois'),
  '<ul>\n<li>um</li>\n<li>dois</li>\n</ul>',
);
conferir('citação', renderizarObra('> dito'), '<blockquote><p>dito</p></blockquote>');
conferir('negrito e itálico', renderizarObra('**forte** e _leve_'), '<p><strong>forte</strong> e <em>leve</em></p>');
conferir(
  'link externo ganha rel e target',
  renderizarObra('[fonte](https://exemplo.com)'),
  '<p><a href="https://exemplo.com" rel="nofollow noopener" target="_blank">fonte</a></p>',
);
conferir(
  'link interno fica sem target',
  renderizarObra('[agenda](/agenda)'),
  '<p><a href="/agenda">agenda</a></p>',
);

/* --- segurança: o corpo chega pelo WhatsApp, não é código de confiança --- */
console.log('\nMarkdown — o que não pode passar');

conferir(
  'tag HTML crua é escapada',
  renderizarObra('<script>alert(1)</script>'),
  '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
);
conferir(
  'atributo com aspas não escapa do contexto',
  renderizarObra('texto " onmouseover="x'),
  '<p>texto &quot; onmouseover=&quot;x</p>',
);
conferir(
  'javascript: não vira link',
  renderizarObra('[clique](javascript:alert(1))'),
  '<p>[clique](javascript:alert(1))</p>',
);
conferir(
  'data: não vira link',
  renderizarObra('[x](data:text/html,<script>alert(1)</script>)'),
  '<p>[x](data:text/html,&lt;script&gt;alert(1)&lt;/script&gt;)</p>',
);
conferir(
  'img com onerror não sobrevive',
  renderizarObra('<img src=x onerror=alert(1)>'),
  '<p>&lt;img src=x onerror=alert(1)&gt;</p>',
);
conferir('minutos de leitura', minutosDeLeitura('palavra '.repeat(400)), 2);

/* ===================================================================== */
/* Microblog — item sem <title>                                           */
/* ===================================================================== */
console.log('\nMicroblog (Mastodon)');

const MASTODON = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>#Automation</title>
  <item>
    <guid isPermaLink="true">https://floss.social/@x/1</guid>
    <link>https://floss.social/@x/1</link>
    <pubDate>Tue, 01 Sep 2026 11:46:01 +0000</pubDate>
    <description>&lt;p&gt;Learn how to self-host n8n on your own server. Full guide inside.&lt;/p&gt;</description>
  </item>
</channel></rss>`;

const mast = lerFeed(MASTODON);
conferir('post sem <title> NAO e descartado', mast.length, 1);
conferir(
  'e o titulo vem da primeira frase do texto',
  mast[0]!.titulo,
  'Learn how to self-host n8n on your own server.',
);
conferir('o link continua sendo o do post', mast[0]!.link, 'https://floss.social/@x/1');
conferir(
  'item sem titulo E sem texto continua descartado',
  lerFeed('<rss><item><link>https://x.com/1</link></item></rss>').length,
  0,
);

/* -------------------------------------------------- sitemap de notícias */
/* Recorte do sitemap-news real do Canaltech — a fonte que fecha o RSS no
   robots.txt e anuncia este endereço no mesmo arquivo. */
const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
    <loc>https://canaltech.com.br/seguranca/45-milhoes-de-brasileiros</loc>
    <news:news>
      <news:publication><news:name>Canaltech</news:name><news:language>pt</news:language></news:publication>
      <news:publication_date>2026-09-01T10:03:00-03:00</news:publication_date>
      <news:title><![CDATA[45 milh&#245;es de brasileiros j&#225; sofreram golpes - Canaltech]]></news:title>
    </news:news>
  </url>
  <url>
    <loc>https://canaltech.com.br/tag/automacao</loc>
  </url>
</urlset>`;

console.log('Sitemap de notícias');
const sm = lerSitemapNoticias(SITEMAP);
conferir('lê a notícia', sm.length, 1);
conferir('URL vem do <loc>', sm[0]!.link, 'https://canaltech.com.br/seguranca/45-milhoes-de-brasileiros');
conferir(
  'título sai de news:title, sem CDATA e com entidade resolvida',
  sm[0]!.titulo,
  '45 milhões de brasileiros já sofreram golpes - Canaltech',
);
conferir('a data com fuso -03:00 vira UTC', sm[0]!.publicado, '2026-09-01T13:03:00.000Z');
conferir('sitemap não inventa resumo', sm[0]!.resumo, null);
conferir(
  'URL sem <news:news> (pagina de tag) NAO entra',
  sm.map((e) => e.link).includes('https://canaltech.com.br/tag/automacao'),
  false,
);

const INDICE = `<?xml version="1.0"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://x.com/velho.xml</loc><lastmod>2026-07-01T00:00:00Z</lastmod></sitemap>
  <sitemap><loc>https://x.com/novo.xml</loc><lastmod>2026-08-30T00:00:00Z</lastmod></sitemap>
</sitemapindex>`;
conferir('índice é reconhecido como índice', ehIndice(INDICE), true);
conferir('urlset NAO e confundido com indice', ehIndice(SITEMAP), false);
conferir(
  'o indice devolve o filho mais recente primeiro',
  lerIndiceSitemaps(INDICE)[0],
  'https://x.com/novo.xml',
);
conferir(
  'indice nao vira noticia',
  lerSitemapNoticias(INDICE).length,
  0,
);

/* --------------------------------------------------------------- resultado */
console.log(`
${ok} ok · ${falhou} falha(s)`);
if (falhou > 0) process.exit(1);
