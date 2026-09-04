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

-- ⚠️ O Canaltech aparece abaixo com a URL do RSS e e corrigido no fim do
-- arquivo. Ficou assim de proposito: a linha registra o que a sondagem de
-- 01/09 achou, e a correcao registra o que o robots.txt disse depois. Juntas
-- contam a historia; so a versao final esconderia o motivo.
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

-- =========================================================================
-- O que o robots.txt disse, medido em 01/09/2026 pelo proprio coletor
--
-- Cinco fontes saem do radar por decisao delas, e ficam listadas em
-- /blueprints dizendo isso. Nao ha contorno: nao trocamos a identificacao do
-- robo, nao usamos proxy nem navegador disfarcado.
--
--   Canaltech          Disallow: /rss/          → tem sitemap de noticias
--   Reddit r/PLC       Disallow: /r/PLC/.rss    → so pela API com credencial
--   YouTube            Disallow: /feeds/        → so pela YouTube Data API
--   GitHub (2 fontes)  Disallow: /*.atom$       → so pela REST API
--
-- As tres ultimas viram pendencia de coletor novo (JSON, com credencial), e
-- estao no backlog. O Canaltech tem saida hoje: o MESMO robots.txt que fecha
-- o /rss/ anuncia o sitemap-news, e o /smap/ nao esta proibido. Titulo, data
-- e URL — que e 100% do que a medicao de atraso precisa.
-- =========================================================================

UPDATE fonte
   SET colheita = 'sitemap',
       url_feed = 'https://canaltech.com.br/smap/sitemap-news.xml'
 WHERE id = 'f-canaltech';

-- =========================================================================
-- v2 · 03/09/2026 — a LISTA LARGA (docs/CONCEPCAO-V2.md)
--
-- O produto passou de volume para peca, e a lista de fontes foi refeita pela
-- medicao do npm run cadencia: heise, Canaltech, arXiv e Tecnoblog eram 80%
-- da pauta e quase nada do tema. Saem. Ars Technica, The Verge e o Forum
-- Home Assistant ficam como LARGURA para o Giro. Nada e apagado — fonte
-- desativada continua no inventario, e os itens que ela trouxe continuam
-- contando para o relogio.
-- =========================================================================
UPDATE fonte SET ativo = 0 WHERE id IN (
  'f-heise-online', 'f-canaltech', 'f-tecnoblog', 'f-olhar-digital',
  'f-arxiv-sistemas-e-controle', 'f-arxiv-robotica',
  'f-mastodon-fosstodon-tag-automation'
);

-- As tres fontes BRASILEIRAS especializadas que sobreviveram a sondagem de
-- 03/09 (18 candidatos; 3 vivos). Marcam o relogio, nao sao publicadas.
INSERT OR REPLACE INTO fonte (id, nome, url_site, url_feed, tipo, idioma, pais, nucleo,
                              licenca, licenca_evidencia, confianca, marca_relogio, intervalo_min, ativo, peso)
VALUES
  ('f-cimm', 'CIMM', 'https://www.cimm.com.br', 'https://www.cimm.com.br/portal/noticia/rss', 'imprensa', 'pt', 'BR', 'industria', 'resumo', NULL, 'media', 1, 120, 1, 6),
  ('f-abinee', 'ABINEE', 'https://www.abinee.org.br', 'https://www.abinee.org.br/feed/', 'associacao', 'pt', 'BR', 'industria', 'resumo', NULL, 'alta', 1, 180, 1, 7),
  ('f-automacao-industrial', 'Automação Industrial', 'https://www.automacaoindustrial.info', 'https://www.automacaoindustrial.info/feed/', 'imprensa', 'pt', 'BR', 'industria', 'resumo', NULL, 'media', 1, 180, 1, 7);

-- v2: os quatro nucleos viraram dois temas. Vale para quem cria do zero e
-- para quem roda por cima de um banco antigo — e idempotente.
UPDATE fonte SET nucleo = 'industria' WHERE nucleo IN ('industria','edificacoes');
UPDATE fonte SET nucleo = 'processos' WHERE nucleo IN ('observatorio','operacao');

-- v2 (04/09/2026): as fontes de exemplo da v1 saem de vez. Elas apareciam no
-- inventário público de /blueprints como fontes inativas chamadas "(exemplo)",
-- e seus itens-semente contavam no dossiê do Giro. Itens primeiro (FK).
DELETE FROM item  WHERE fonte_id LIKE 'f-%exemplo%';
UPDATE assunto SET fonte_original = NULL WHERE fonte_original LIKE 'f-%exemplo%';
UPDATE assunto SET fonte_br = NULL WHERE fonte_br LIKE 'f-%exemplo%';
UPDATE evento  SET fonte_id = NULL WHERE fonte_id LIKE 'f-%exemplo%';
DELETE FROM fonte WHERE id LIKE 'f-%exemplo%';
DELETE FROM assunto WHERE id NOT IN (SELECT DISTINCT assunto_id FROM item WHERE assunto_id IS NOT NULL);
