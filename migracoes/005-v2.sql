-- =========================================================================
-- 005 · a cirurgia da v2 — o banco deixa de guardar conteudo e estado de IA
--
-- O que sai:
--   custo_dia   nao ha custo a conter
--   obra        virou arquivo em conteudo/relatorios
--   giro        virou arquivo em conteudo/giro
--   item.*      17 colunas que eram estado do pipeline sobre o item
--
-- O que fica: fonte, assunto, evento, glossario, assinante — e os itens ja
-- colhidos, que sao a base do relogio e nao voltam se apagados.
--
-- `item` e RECRIADA em vez de alterada: SQLite nao remove coluna UNIQUE
-- (slug) nem coluna indexada com ALTER TABLE DROP COLUMN. `correcao` cai e
-- volta porque tinha chave estrangeira para item e obra — estava vazia.
--
--   npm run db:migrar
-- =========================================================================

DROP TABLE IF EXISTS correcao;
DROP TABLE IF EXISTS custo_dia;
DROP TABLE IF EXISTS obra;
DROP TABLE IF EXISTS giro;

-- item: recriar com as 10 colunas e copiar o que interessa ------------------
CREATE TABLE item_v2 (
  id              TEXT PRIMARY KEY,
  fonte_id        TEXT NOT NULL REFERENCES fonte(id),
  assunto_id      TEXT REFERENCES assunto(id),
  titulo          TEXT NOT NULL,
  url             TEXT NOT NULL,
  url_canonica    TEXT NOT NULL,
  idioma          TEXT NOT NULL,
  resumo          TEXT,
  publicado_fonte TEXT NOT NULL,
  coletado_em     TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO item_v2 (id, fonte_id, assunto_id, titulo, url, url_canonica, idioma, resumo,
                     publicado_fonte, coletado_em)
SELECT id, fonte_id, assunto_id,
       COALESCE(titulo_original, titulo), url, url_canonica, idioma_origem, resumo,
       publicado_fonte, coletado_em
  FROM item;

DROP TABLE item;
ALTER TABLE item_v2 RENAME TO item;

CREATE UNIQUE INDEX idx_item_canonica ON item(url_canonica);
CREATE INDEX        idx_item_assunto  ON item(assunto_id);
CREATE INDEX        idx_item_colheita ON item(coletado_em DESC);

-- correcao volta apontando para a peca pelo caminho publico -----------------
CREATE TABLE correcao (
  id      TEXT PRIMARY KEY,
  peca    TEXT,
  texto   TEXT NOT NULL,
  data    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- os quatro nucleos viram dois temas ----------------------------------------
UPDATE fonte   SET nucleo = 'industria' WHERE nucleo IN ('industria','edificacoes');
UPDATE fonte   SET nucleo = 'processos' WHERE nucleo IN ('observatorio','operacao');
UPDATE assunto SET nucleo = 'industria' WHERE nucleo IN ('industria','edificacoes');
UPDATE assunto SET nucleo = 'processos' WHERE nucleo IN ('observatorio','operacao');
UPDATE evento  SET nucleo = 'industria' WHERE nucleo IN ('industria','edificacoes');
UPDATE evento  SET nucleo = 'processos' WHERE nucleo IN ('observatorio','operacao');
