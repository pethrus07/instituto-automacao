-- =========================================================================
-- 006 · quem lê, e quem quer escrever ou apoiar (07/09/2026)
--
-- Feedback do sócio sobre a homologação: o cadastro subiu na capa e passou
-- a perguntar O QUE A PESSOA FAZ — quem opera, quem integra, quem ensina.
-- Não é para vender nada: é para saber para quem se escreve. E dois
-- formulários novos, "Escreva no Instituto" e "Apoie", precisam de um lugar
-- para cair que não seja o e-mail de alguém.
--
-- Só acrescenta. Nada do que existe muda de forma.
--
--   npm run db:migrar            (local)
--   npm run db:migrar:homolog    (homologação, conta do Pedro)
-- =========================================================================

ALTER TABLE assinante ADD COLUMN atuacao TEXT;   -- opera | integra | ensina | estuda | outra
ALTER TABLE assinante ADD COLUMN empresa TEXT;   -- livre, opcional

-- Quem se apresentou pelos formulários de autor e de parceiro. É caixa de
-- entrada, não cadastro: lido por gente, respondido por gente.
CREATE TABLE IF NOT EXISTS contato (
  id        TEXT PRIMARY KEY,
  tipo      TEXT NOT NULL CHECK (tipo IN ('autor', 'parceiro')),
  nome      TEXT NOT NULL,
  email     TEXT NOT NULL,
  empresa   TEXT,
  mensagem  TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
