-- =========================================================================
-- Instituto Automação — as fontes do radar
--
-- Geradas por `npm run sondar` em 01/09/2026, que buscou cada candidato de
-- verdade e passou o XML pelo nosso próprio parser. Só entram aqui as que
-- responderam com item legível.
--
-- ⚠️ TODAS NASCEM COMO `resumo`. A sondagem mede se o feed responde; não
-- mede permissão. Subir uma fonte para `liberada` — o que autoriza tradução
-- integral — exige alguém ler os termos e gravar `licenca_evidencia`. O
-- inventário público em /blueprints mostra exatamente quais têm esse link.
--
-- O que a sondagem descobriu, e que muda o plano:
--   · Control Engineering, Automation World e WEG BLOQUEIAM robô (403).
--     Três das principais publicações do setor ficam fora do radar.
--   · Quase nenhuma sala de imprensa de fabricante tem feed nas URLs
--     óbvias — o "primeira mão" via press release vai exigir garimpo.
--   · Em compensação, fórum, artigo, rede social, vídeo e release de
--     produto TAMBÉM são RSS: o coletor já serve, sem uma linha nova.
--   · X/Twitter e LinkedIn não têm feed público. Medido, não suposto.
-- =========================================================================

-- As fontes de exemplo são DESATIVADAS, não apagadas: os itens-semente
-- apontam para elas por chave estrangeira, e apagar a fonte de um item já
-- coletado quebraria o histórico. É a mesma regra que vale em produção —
-- fonte que sai do radar vira `ativo = 0`, e o que ela já trouxe continua
-- existindo e continua contando para o Panorama.
UPDATE fonte SET ativo = 0 WHERE id LIKE 'f-%exemplo%';

INSERT OR REPLACE INTO fonte (id, nome, url_site, url_feed, tipo, idioma, pais, nucleo,
                              licenca, licenca_evidencia, confianca, marca_relogio, intervalo_min, ativo)
VALUES
  ('f-siemens-press', 'Siemens Press', 'https://press.siemens.com', 'https://press.siemens.com/global/en/rss.xml', 'press', 'en', 'DE', 'industria', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-the-robot-report', 'The Robot Report', 'https://www.therobotreport.com', 'https://www.therobotreport.com/feed/', 'imprensa', 'en', 'US', 'industria', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-ieee-spectrum-robotica', 'IEEE Spectrum · Robótica', 'https://spectrum.ieee.org', 'https://spectrum.ieee.org/feeds/topic/robotics.rss', 'imprensa', 'en', 'US', 'industria', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-ieee-spectrum-ia', 'IEEE Spectrum · IA', 'https://spectrum.ieee.org', 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss', 'imprensa', 'en', 'US', 'observatorio', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-heise-online', 'heise online', 'https://www.heise.de', 'https://www.heise.de/rss/heise-atom.xml', 'imprensa', 'de', 'DE', 'observatorio', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-the-verge', 'The Verge', 'https://www.theverge.com', 'https://www.theverge.com/rss/index.xml', 'imprensa', 'en', 'US', 'observatorio', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-ars-technica', 'Ars Technica', 'https://feeds.arstechnica.com', 'https://feeds.arstechnica.com/arstechnica/index', 'imprensa', 'en', 'US', 'observatorio', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-olhar-digital', 'Olhar Digital', 'https://olhardigital.com.br', 'https://olhardigital.com.br/feed/', 'imprensa', 'pt', 'BR', 'observatorio', 'resumo', NULL, 'media', 1, 60, 1),
  ('f-tecnoblog', 'Tecnoblog', 'https://tecnoblog.net', 'https://tecnoblog.net/feed/', 'imprensa', 'pt', 'BR', 'observatorio', 'resumo', NULL, 'media', 1, 60, 1),
  ('f-canaltech', 'Canaltech', 'https://canaltech.com.br', 'https://canaltech.com.br/rss/', 'imprensa', 'pt', 'BR', 'observatorio', 'resumo', NULL, 'media', 1, 60, 1),
  ('f-n8n-blog', 'n8n Blog', 'https://blog.n8n.io', 'https://blog.n8n.io/rss/', 'press', 'en', 'DE', 'operacao', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-home-assistant', 'Home Assistant', 'https://www.home-assistant.io', 'https://www.home-assistant.io/atom.xml', 'press', 'en', 'US', 'edificacoes', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-reddit-plc', 'Reddit · PLC', 'https://www.reddit.com', 'https://www.reddit.com/r/PLC/.rss', 'forum', 'en', 'US', 'industria', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-forum-home-assistant', 'Fórum Home Assistant', 'https://community.home-assistant.io', 'https://community.home-assistant.io/latest.rss', 'forum', 'en', 'US', 'edificacoes', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-arxiv-sistemas-e-controle', 'arXiv · Sistemas e Controle', 'https://rss.arxiv.org', 'https://rss.arxiv.org/rss/eess.SY', 'academico', 'en', 'US', 'industria', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-arxiv-robotica', 'arXiv · Robótica', 'https://rss.arxiv.org', 'https://rss.arxiv.org/rss/cs.RO', 'academico', 'en', 'US', 'industria', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-mastodon-fosstodon-tag-automation', 'Mastodon · fosstodon tag automation', 'https://fosstodon.org', 'https://fosstodon.org/tags/automation.rss', 'social', 'en', 'US', 'operacao', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-youtube-automation-direct', 'YouTube · Automation Direct', 'https://www.youtube.com', 'https://www.youtube.com/feeds/videos.xml?user=automationdirect', 'video', 'en', 'US', 'industria', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-github-n8n-releases', 'GitHub · n8n releases', 'https://github.com', 'https://github.com/n8n-io/n8n/releases.atom', 'release', 'en', 'DE', 'operacao', 'resumo', NULL, 'media', 0, 60, 1),
  ('f-github-home-assistant-releases', 'GitHub · Home Assistant releases', 'https://github.com', 'https://github.com/home-assistant/core/releases.atom', 'release', 'en', 'US', 'edificacoes', 'resumo', NULL, 'media', 0, 60, 1);
