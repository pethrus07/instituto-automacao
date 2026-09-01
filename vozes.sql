-- =========================================================================
-- Instituto Automação — as VOZES do radar
--
-- Pessoa pública que publica com nome próprio. Não é veículo: veículo tem
-- redação, pauta e periodicidade; voz tem opinião e responsabilidade
-- pessoal. A diferença importa para o Giro da Semana, onde "a IEEE Spectrum
-- noticiou" e "Rodney Brooks escreveu" não pesam igual.
--
-- Sondadas por `npm run sondar:vozes` em 01/09/2026: o script busca o feed
-- de verdade, passa pelo NOSSO parser e lê o robots.txt antes. 11 de 12
-- responderam.
--
-- ⚠️ Todas nascem `resumo`, como qualquer fonte. Voz é gente, e citar gente
-- exige o mesmo cuidado: título, link e redação nossa. Nunca tradução
-- integral sem licença — e blog pessoal quase nunca dá licença.
--
-- O que foi DESCARTADO na sondagem, e por quê:
--   · Paulo Silveira (Alura) — o feed respondeu, mas é o blog institucional
--     da empresa, não a escrita dele. Cadastrar como voz atribuiria a uma
--     pessoa o que a redação escreveu. É o tipo de erro que o Instituto
--     existe para não cometer.
--   · Jeff Lean — robots.txt inacessível. Sem regra legível não coletamos.
--
-- Duas vozes entram DORMENTES de propósito (Karpathy, ~200 dias sem post;
-- Chris Anderson, ~220). Custam um fetch a cada 3 h e valem pelo dia em que
-- voltarem: quando Karpathy publica, é assunto da semana em qualquer lugar.
-- =========================================================================

INSERT OR REPLACE INTO fonte (id, nome, url_site, url_feed, tipo, idioma, pais, nucleo,
                              licenca, licenca_evidencia, confianca, marca_relogio,
                              intervalo_min, ativo, peso, pessoa, pessoa_papel)
VALUES
  ('f-voz-rodney-brooks', 'Rodney Brooks', 'https://rodneybrooks.com', 'https://rodneybrooks.com/feed/', 'imprensa', 'en', 'US', 'industria', 'resumo', NULL, 'alta', 0, 180, 1, 9, 'Rodney Brooks', 'fundador do iRobot e da Rethink Robotics; ex-diretor do laboratório de IA do MIT'),
  ('f-voz-ethan-mollick', 'Ethan Mollick', 'https://www.oneusefulthing.org', 'https://www.oneusefulthing.org/feed', 'imprensa', 'en', 'US', 'observatorio', 'resumo', NULL, 'alta', 0, 180, 1, 8, 'Ethan Mollick', 'professor na Wharton; escreve sobre IA aplicada ao trabalho'),
  ('f-voz-simon-willison', 'Simon Willison', 'https://simonwillison.net', 'https://simonwillison.net/atom/everything/', 'imprensa', 'en', 'US', 'operacao', 'resumo', NULL, 'alta', 0, 180, 1, 8, 'Simon Willison', 'criador do Django e do Datasette; documenta o uso prático de modelos'),
  ('f-voz-gary-marcus', 'Gary Marcus', 'https://garymarcus.substack.com', 'https://garymarcus.substack.com/feed', 'imprensa', 'en', 'US', 'observatorio', 'resumo', NULL, 'media', 0, 180, 1, 7, 'Gary Marcus', 'cientista cognitivo; a voz mais consistente do ceticismo sobre IA'),
  ('f-voz-benedict-evans', 'Benedict Evans', 'https://www.ben-evans.com', 'https://www.ben-evans.com/benedictevans?format=rss', 'imprensa', 'en', 'GB', 'observatorio', 'resumo', NULL, 'alta', 0, 360, 1, 7, 'Benedict Evans', 'analista de tecnologia e mercado'),
  ('f-voz-andrej-karpathy', 'Andrej Karpathy', 'https://karpathy.github.io', 'https://karpathy.github.io/feed.xml', 'imprensa', 'en', 'US', 'observatorio', 'resumo', NULL, 'alta', 0, 720, 1, 8, 'Andrej Karpathy', 'ex-diretor de IA da Tesla; escreve raro e denso'),
  ('f-voz-sebastian-raschka', 'Sebastian Raschka', 'https://magazine.sebastianraschka.com', 'https://magazine.sebastianraschka.com/feed', 'imprensa', 'en', 'US', 'observatorio', 'resumo', NULL, 'alta', 0, 360, 1, 7, 'Sebastian Raschka', 'pesquisador; explica arquitetura de modelo com implementação junto'),
  ('f-voz-tim-bray', 'Tim Bray', 'https://www.tbray.org/ongoing/', 'https://www.tbray.org/ongoing/ongoing.atom', 'imprensa', 'en', 'CA', 'operacao', 'resumo', NULL, 'media', 0, 360, 1, 6, 'Tim Bray', 'coautor do XML; escreve sobre infraestrutura e o ofício'),
  ('f-voz-chris-anderson', 'Chris Anderson', 'https://diyrobocars.com', 'https://diyrobocars.com/feed/', 'imprensa', 'en', 'US', 'industria', 'resumo', NULL, 'media', 0, 720, 1, 6, 'Chris Anderson', 'ex-editor da Wired; DIY Robocars e veículo autônomo amador'),
  -- Voz brasileira: marca o relógio. Não é publicada — existe para medir
  -- quando o assunto chegou aqui, como as outras fontes BR.
  ('f-voz-rodrigo-ghedin', 'Rodrigo Ghedin', 'https://manualdousuario.net', 'https://manualdousuario.net/feed/', 'imprensa', 'pt', 'BR', 'observatorio', 'resumo', NULL, 'alta', 1, 180, 1, 7, 'Rodrigo Ghedin', 'jornalista; edita o Manual do Usuário');
