-- =========================================================================
-- 002 · de onde a fonte e colhida: feed ou sitemap de noticias
--
-- Nasceu de uma medicao: o robots.txt do Canaltech diz `Disallow: /rss/` e,
-- no mesmo arquivo, anuncia `Sitemap: .../smap/sitemap-news.xml`. A fonte
-- nao fechou a porta — indicou outra. Titulo, data e URL sao 100% do que a
-- medicao de atraso precisa, entao o sitemap serve inteiro para o relogio.
--
--   npm run db:migrar
-- =========================================================================

-- Sem o CHECK que schema.sql tem: ALTER TABLE ADD COLUMN no SQLite nao
-- reavalia as linhas existentes, entao a restricao valeria pela metade e
-- daria a impressao errada de garantia. Quem cria o banco do zero pelo
-- schema.sql tem o CHECK; aqui a garantia e o codigo que so escreve os
-- dois valores, e o QA que confere.
ALTER TABLE fonte ADD COLUMN colheita TEXT NOT NULL DEFAULT 'feed';

-- Canaltech marca o relogio brasileiro e nao e publicada. O feed dela esta
-- fechado para robo; o sitemap de noticias, nao.
UPDATE fonte
   SET colheita = 'sitemap',
       url_feed = 'https://canaltech.com.br/smap/sitemap-news.xml',
       -- o veredito antigo era sobre /rss/; este caminho e outro
       robots_permite   = NULL,
       robots_motivo    = NULL,
       robots_conferido = NULL,
       ultima_coleta    = NULL
 WHERE id = 'f-canaltech';
