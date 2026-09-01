-- =========================================================================
-- 004 · o Giro da Semana, e as vozes
--
-- Duas coisas que andam juntas:
--
-- 1. `fonte.pessoa` — um EIXO NOVO, nao um tipo novo. `fonte.tipo` diz o
--    MEIO (imprensa, forum, social, video); `pessoa` diz de QUEM e a
--    assinatura. Sao ortogonais: um blog pessoal e meio "imprensa" com
--    pessoa; a IEEE Spectrum e meio "imprensa" sem pessoa. Tratar voz como
--    mais um valor de `tipo` continuaria misturando meio e papel, que e
--    exatamente o defeito de modelagem que essa coluna corrige.
--
--    Para o Giro a diferenca e substantiva: "a IEEE Spectrum noticiou" e
--    "Rodney Brooks escreveu" nao tem o mesmo peso, e um giro que nao sabe
--    a diferenca vira agregador.
--
-- 2. A tabela `giro`. Nao e `obra` de proposito: obra e texto assinado, com
--    responsabilidade de quem assina. O giro e montado a partir da base e
--    auditado por maquina. Misturar os dois borraria a linha que o projeto
--    inteiro existe para manter.
--
--   npm run db:migrar
-- =========================================================================

ALTER TABLE fonte ADD COLUMN pessoa       TEXT;
ALTER TABLE fonte ADD COLUMN pessoa_papel TEXT;

CREATE TABLE IF NOT EXISTS giro (
  id             TEXT PRIMARY KEY,
  -- `2026-s36`: semana ISO. A fronteira e fixa de proposito — janela movel
  -- de 7 dias daria um recorte diferente a cada execucao, e a edicao
  -- deixaria de ser reproduzivel.
  slug           TEXT UNIQUE NOT NULL,
  inicio         TEXT NOT NULL,
  fim            TEXT NOT NULL,
  rotulo         TEXT NOT NULL,

  titulo         TEXT NOT NULL,
  lead           TEXT,
  destaque_texto TEXT,
  por_nucleo     TEXT,

  -- O agregado inteiro, CONGELADO. A pagina le o placar daqui e nao refaz a
  -- conta: o giro da semana 36 tem de continuar dizendo o que dizia na
  -- semana 36, mesmo depois de a base mudar. Sem isso, "publicamos os
  -- nossos dados" viraria "publicamos os dados de hoje".
  agregado       TEXT NOT NULL,
  -- O que a auditoria conferiu, e o que reprovou. Fica gravado inclusive
  -- quando passa: auditoria que so aparece no erro nao da para verificar.
  auditoria      TEXT,
  simulado       INTEGER NOT NULL DEFAULT 0,

  status         TEXT NOT NULL DEFAULT 'rascunho'
                 CHECK (status IN ('rascunho','publicado','arquivado')),
  -- Por que nao saiu. Auditoria que reprova em silencio e auditoria que
  -- ninguem confere.
  motivo_rascunho TEXT,
  publicado_em   TEXT,
  criado_em      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_giro_periodo ON giro(status, inicio DESC);
