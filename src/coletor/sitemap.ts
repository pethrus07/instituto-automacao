/**
 * Sitemap de notícias — o caminho autorizado para quem fecha o RSS.
 *
 * Nasceu de uma medição desconfortável: o robots.txt do Canaltech diz
 * `Disallow: /rss/`. O feed está fechado para robô — mas o MESMO robots.txt
 * anuncia `Sitemap: https://canaltech.com.br/smap/sitemap-news.xml`, e o
 * `/smap/` não está proibido. Ou seja: a fonte não fechou a porta, ela
 * indicou outra.
 *
 * O sitemap de notícias (schema `sitemap-news` do Google) traz **título,
 * data e URL** — que é 100% do que a medição de atraso precisa. O Instituto
 * nunca precisou do texto de ninguém: precisa saber QUANDO cada assunto foi
 * publicado, e o resumo que publicamos é escrito por nós.
 *
 * Então isto não é um contorno de bloqueio. É usar a porta que a própria
 * fonte apontou, e continua valendo tudo o mais: o robots.txt é lido antes,
 * o Crawl-delay é obedecido, e o veredito vai para /blueprints.
 */
import { type EntradaFeed, limpar, paraISO, tag } from './feed.ts';

/**
 * Lê um `<urlset>` de sitemap-news.
 *
 * Devolve o mesmo formato do parser de feed de propósito — para o coletor o
 * que muda é de onde veio, não o que fazer com o que veio.
 *
 * `resumo` sai sempre `null`, e isso é honesto: sitemap não tem resumo, e
 * inventar um a partir do título seria fabricar conteúdo. Item sem resumo
 * vira pauta pelo título e pelo link, como qualquer outro.
 */
export function lerSitemapNoticias(xml: string): EntradaFeed[] {
  const saida: EntradaFeed[] = [];

  for (const bloco of xml.match(/<url\b[\s\S]*?<\/url>/gi) ?? []) {
    const link = limpar(tag(bloco, 'loc'), 2000);
    if (!link) continue;

    // Sem `<news:news>` não é notícia: é página de seção, de tag, de busca.
    // O sitemap geral do site vem cheio delas, e nenhuma tem data de
    // publicação — entrariam com a data de hoje e estragariam a medição.
    const noticia = bloco.match(/<news:news\b[\s\S]*?<\/news:news>/i)?.[0];
    if (!noticia) continue;

    const titulo = limpar(tag(noticia, 'news:title'), 300);
    if (!titulo) continue;

    saida.push({
      titulo,
      link,
      publicado: paraISO(tag(noticia, 'news:publication_date')),
      resumo: null,
      guid: null,
    });
  }

  return saida;
}

/**
 * Índice de sitemaps (`<sitemapindex>`), quando a fonte não expõe o de
 * notícias direto. Devolve as URLs filhas mais recentes primeiro.
 *
 * Separado do leitor acima porque são coisas diferentes: aqui não há item
 * nenhum, só o endereço de onde os itens estão. Confundir os dois é como o
 * coletor acabaria gravando URLs de sitemap como se fossem notícias.
 */
export function lerIndiceSitemaps(xml: string): string[] {
  const itens: { url: string; data: string }[] = [];

  for (const bloco of xml.match(/<sitemap\b[\s\S]*?<\/sitemap>/gi) ?? []) {
    const url = limpar(tag(bloco, 'loc'), 2000);
    if (!url) continue;
    itens.push({ url, data: paraISO(tag(bloco, 'lastmod')) ?? '' });
  }

  return itens.sort((a, b) => b.data.localeCompare(a.data)).map((i) => i.url);
}

/** É índice de sitemaps, e não lista de URLs? */
export function ehIndice(xml: string): boolean {
  return /<sitemapindex\b/i.test(xml);
}
