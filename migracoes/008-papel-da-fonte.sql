-- 008 · 24/09/2026 — o PAPEL da fonte: setor, contexto ou comunidade
--
-- MEDIDO, e foi o que motivou: desde 07/09, de 1.459 itens colhidos,
--
--     751 (52%)  Fórum Home Assistant        → comunidade
--     558 (38%)  The Verge, Ars Technica...  → tecnologia geral
--     150 (10%)  o setor de automação
--
-- Só um décimo do que o site colhe é sobre o assunto do site. E como o Giro
-- passou a ser gerado e publicado sozinho toda segunda, isso deixou de ser
-- curiosidade: o boletim da s37 saía dizendo que o que repercutiu no setor de
-- automação foi "Trump White House tossed a grenade into space relations" e
-- "ChatGPT Sketch turns your bad drawings into AI images".
--
-- Também explica o resto: por que o relógio quase não mede (as fontes
-- brasileiras industriais não têm assunto em comum com o que a Verge publica)
-- e por que "N assuntos não chegaram ao Brasil" não dizia nada — eram
-- notícias de consumo que obviamente não chegam à imprensa industrial daqui.
--
-- A decisão do Pedro (24/09) foi NÃO tirar as fontes: elas continuam sendo
-- colhidas, seguem servindo de pauta e seguem podendo ancorar o relógio (se a
-- Verge publica sobre robótica da NVIDIA e uma fonte BR repercute, a medida é
-- boa). O que muda é que elas saem dos NÚMEROS DA SEMANA e da lista de
-- repercussão — mesmo tratamento que o fórum já tinha.
--
-- `tipo` continua sendo o MEIO (imprensa, press, forum, release...). `papel`
-- é outra coisa: o quanto a fonte fala do assunto DESTE site. Uma fonte pode
-- ser imprensa e ser contexto.

ALTER TABLE fonte ADD COLUMN papel TEXT NOT NULL DEFAULT 'setor'
  CHECK (papel IN ('setor', 'contexto'));

-- Tecnologia geral e comentário de IA: ótimos de ler, mas não são o setor.
UPDATE fonte SET papel = 'contexto'
 WHERE nome IN ('The Verge', 'Ars Technica', 'Simon Willison', 'Gary Marcus', 'Ethan Mollick');

-- Fórum e rede social já eram tratados à parte pelo `tipo`; ficam como
-- `setor` no papel para não haver duas verdades sobre a mesma fonte — quem os
-- separa continua sendo `tipo IN ('forum','social')`.

CREATE INDEX IF NOT EXISTS idx_fonte_papel ON fonte(papel);
