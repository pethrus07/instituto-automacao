-- 007 · 23/09/2026 — o agrupamento por token raro, e o relógio que ele destrava
--
-- O agrupamento antigo casava TÍTULO INTEIRO (palavras significativas
-- ordenadas), então só juntava textos com o conjunto idêntico de palavras —
-- entre idiomas, nunca. Medido: 557 assuntos para 557 itens numa semana, e
-- ZERO atrasos apurados desde que o projeto existe.
--
-- O novo casa por token raro compartilhado (ver src/coletor/assunto.ts). Para
-- isso precisa de um índice invertido: qual assunto contém qual token.
--
-- ⚠️ Criar a tabela NÃO reagrupa o que já está na base. O histórico é
-- reprocessado por `npm run reagrupar`, que recalcula assunto, assunto_token e
-- item.assunto_id a partir dos itens guardados — os títulos, as datas e as
-- fontes estão todos lá, só a derivação estava errada.

-- DROP e recria: `assunto_token` é índice DERIVADO, reconstruído inteiro por
-- `npm run reagrupar`. Não há dado próprio aqui para preservar, e recriar
-- deixa a migração idempotente mesmo depois de mudar o formato.
DROP TABLE IF EXISTS assunto_token;

CREATE TABLE assunto_token (
  token      TEXT NOT NULL,
  assunto_id TEXT NOT NULL REFERENCES assunto(id),
  -- 1 = token que carrega IDENTIDADE (nome próprio ou código), e não só uma
  -- palavra incomum. Sem esta coluna, 37 threads de fórum caíam no mesmo
  -- assunto casadas por "after", "update" e um "9" de número de versão:
  -- frequência sozinha não separa `siemens`(24 itens) de `update`(~25).
  forte      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (token, assunto_id)
);

-- o caminho quente: "que assuntos recentes contêm estes tokens?"
CREATE INDEX IF NOT EXISTS idx_assunto_token_token ON assunto_token(token);

-- o caminho da limpeza: apagar os tokens de um assunto que deixou de existir
CREATE INDEX IF NOT EXISTS idx_assunto_token_assunto ON assunto_token(assunto_id);

-- o reagrupamento varre item por data; sem isto ele faz varredura completa
CREATE INDEX IF NOT EXISTS idx_item_publicado ON item(publicado_fonte);
