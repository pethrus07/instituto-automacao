-- 009 · 27/09/2026 — o artigo que chega pelo editor de /escrever
--
-- Reunião de 24/09: "vai ter uma abazinha chamada Escrever… como se fosse um
-- Google Docs, com todas as formas baseadas no teu padrão" — para o convidado
-- do sócio e para o estranho que quer escrever. O texto é escrito no
-- navegador, em blocos, e chega aqui como o MESMO markdown que o site publica.
--
-- ⚠️ ISTO NÃO É UM BANCO DE CONTEÚDO. O git continua sendo o CMS: nada daqui
-- vai para o ar sozinho. `npm run submissoes` baixa o envio, escreve o
-- arquivo em conteudo/artigos/ e as imagens em publico/imagens/, e só então
-- alguém lê, compila e publica. A tabela é a caixa de entrada, não a estante.
--
-- As imagens moram em BLOB no próprio D1 (≤ 600 KB cada, o teto que o
-- compilador já exige) para não abrir um bucket só por isso. Se o volume
-- crescer, a troca é por R2 e muda só esta tabela.

CREATE TABLE IF NOT EXISTS submissao (
  id          TEXT PRIMARY KEY,
  -- o que o autor recebe na tela e cita no e-mail: IA-7K2Q9M
  protocolo   TEXT NOT NULL UNIQUE,
  -- a pauta de src/pautas.ts, ou NULL para tema livre
  pauta       TEXT,
  titulo      TEXT NOT NULL,
  autor_nome  TEXT NOT NULL,
  -- o e-mail NUNCA é publicado: é para o editor responder (ver /privacidade)
  autor_email TEXT NOT NULL,
  -- papel, bio, link e se há foto — o que vira conteudo/autores/<slug>.md
  autor_json  TEXT NOT NULL,
  -- título, linha fina, formato, nível
  meta_json   TEXT NOT NULL,
  markdown    TEXT NOT NULL,
  estado      TEXT NOT NULL DEFAULT 'recebida'
              CHECK (estado IN ('recebida', 'em_edicao', 'publicada', 'recusada')),
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS submissao_estado ON submissao (estado, criado_em);

CREATE TABLE IF NOT EXISTS submissao_arquivo (
  submissao_id TEXT NOT NULL REFERENCES submissao (id) ON DELETE CASCADE,
  -- o nome que o markdown cita (img-<id>.jpg) ou "foto.jpg" para o retrato
  nome         TEXT NOT NULL,
  tipo         TEXT NOT NULL CHECK (tipo IN ('image/jpeg', 'image/png')),
  bytes        INTEGER NOT NULL,
  dados        BLOB NOT NULL,
  PRIMARY KEY (submissao_id, nome)
);
