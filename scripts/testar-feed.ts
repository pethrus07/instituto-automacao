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
import { canonicalizar, chaveAssunto, slugificar } from '../src/coletor/url.ts';

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

/* -------------------------------------------------------- chave de assunto */
console.log('\nChave de assunto');
conferir(
  'títulos diferentes sobre a mesma coisa colidem',
  chaveAssunto('Nova geração de controladores com diagnóstico preditivo') ===
    chaveAssunto('Controladores: o diagnóstico preditivo da nova geração'),
  true,
);
conferir(
  'assuntos diferentes não colidem',
  chaveAssunto('Norma de células colaborativas') === chaveAssunto('Inversores medem consumo'),
  false,
);
conferir('slug sem acento e sem cauda quebrada', slugificar('Automação é assunto sério'), 'automacao-e-assunto-serio');

/* --------------------------------------------------------------- resultado */
console.log(`\n${ok} ok · ${falhou} falha(s)`);
if (falhou > 0) process.exit(1);
