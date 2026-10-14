-- =========================================================================
-- 010 · Mais fontes do SETOR (14/10/2026)
--
-- Com a notícia saindo sozinha (ROADMAP §2l), o gargalo virou a pauta: as
-- fontes do setor que publicam notícia de fato davam ~40 itens por semana, e a
-- primeira execução agendada da redação descartou as 8 candidatas por escopo.
-- `npm run sondar:setor` testou 25 candidatas com o leitor e o robots.txt do
-- próprio coletor; entram as 8 que responderam, deixam o robô ler e
-- publicaram na semana. Ficaram de fora por decisão delas (robots.txt 403 ou
-- inacessível): Automation.com, The Manufacturer, IndustryWeek, Assembly,
-- Packaging World, New Equipment Digest, ABB, Mundo Logística.
--
-- Todas nascem `resumo` e `setor`. As brasileiras marcam o relógio.
-- =========================================================================
INSERT OR IGNORE INTO fonte (id, nome, url_site, url_feed, tipo, idioma, pais, nucleo, licenca, confianca, marca_relogio, intervalo_min, ativo, papel)
VALUES
  ('f-robotics-automation-news', 'Robotics & Automation News', 'https://roboticsandautomationnews.com', 'https://roboticsandautomationnews.com/feed/', 'imprensa', 'en', 'GB', 'industria', 'resumo', 'media', 0, 60, 1, 'setor'),
  ('f-design-world', 'Design World', 'https://www.designworldonline.com', 'https://www.designworldonline.com/feed/', 'imprensa', 'en', 'US', 'industria', 'resumo', 'media', 0, 60, 1, 'setor'),
  ('f-mobile-robot-guide', 'Mobile Robot Guide', 'https://www.mobilerobotguide.com', 'https://www.mobilerobotguide.com/feed/', 'imprensa', 'en', 'US', 'industria', 'resumo', 'media', 0, 60, 1, 'setor'),
  ('f-eenews-europe', 'eeNews Europe', 'https://www.eenewseurope.com', 'https://www.eenewseurope.com/en/feed/', 'imprensa', 'en', 'FR', 'industria', 'resumo', 'media', 0, 60, 1, 'setor'),
  ('f-engineering-com', 'Engineering.com', 'https://www.engineering.com', 'https://www.engineering.com/feed/', 'imprensa', 'en', 'CA', 'industria', 'resumo', 'media', 0, 60, 1, 'setor'),
  ('f-inovacao-tecnologica', 'Inovação Tecnológica', 'https://www.inovacaotecnologica.com.br', 'https://www.inovacaotecnologica.com.br/boletim/rss.xml', 'imprensa', 'pt', 'BR', 'industria', 'resumo', 'media', 1, 60, 1, 'setor'),
  ('f-logweb', 'Logweb', 'https://www.logweb.com.br', 'https://www.logweb.com.br/feed/', 'imprensa', 'pt', 'BR', 'industria', 'resumo', 'media', 1, 60, 1, 'setor'),
  ('f-embrapii', 'EMBRAPII', 'https://embrapii.org.br', 'https://embrapii.org.br/feed/', 'associacao', 'pt', 'BR', 'industria', 'resumo', 'media', 1, 60, 1, 'setor');
