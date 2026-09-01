-- =========================================================================
-- 001 · o veredito do robots.txt vira coluna
--
-- Existe porque schema.sql comeca com DROP TABLE: recriar o banco apagaria
-- os itens ja coletados, e item nao coletado NAO VOLTA — o feed guarda so as
-- ultimas dezenas de entradas. Migracao preserva o que ja foi medido.
--
--   npm run db:migrar          (local)
--   npm run db:migrar:remoto   (producao)
--
-- Rodar duas vezes da erro de coluna duplicada. Isso e proposital: e barulho
-- na hora certa, e nao um banco em estado que ninguem sabe qual e.
-- =========================================================================

ALTER TABLE fonte ADD COLUMN robots_permite   INTEGER;
ALTER TABLE fonte ADD COLUMN robots_atraso    REAL;
ALTER TABLE fonte ADD COLUMN robots_motivo    TEXT;
ALTER TABLE fonte ADD COLUMN robots_conferido TEXT;
