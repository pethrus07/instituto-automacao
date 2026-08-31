-- =========================================================================
-- Instituto Automação — schema do D1
-- Espelha docs/MODELO-DADOS.md. Tudo em UTC (ISO 8601).
--
-- Entra INTEIRO no dia 1, mesmo com tela para quase nada: classificação rica
-- e medição de atraso não são reconstituíveis depois. Notícia sai do ar e
-- feed guarda só as últimas dezenas de itens.
-- =========================================================================

DROP TABLE IF EXISTS correcao;
DROP TABLE IF EXISTS obra;
DROP TABLE IF EXISTS item;
DROP TABLE IF EXISTS assunto;
DROP TABLE IF EXISTS evento;
DROP TABLE IF EXISTS glossario;
DROP TABLE IF EXISTS custo_dia;
DROP TABLE IF EXISTS assinante;
DROP TABLE IF EXISTS fonte;

-- -------------------------------------------------------------------------
-- fonte — a tabela que decide o que o pipeline PODE fazer com cada texto
-- -------------------------------------------------------------------------
CREATE TABLE fonte (
  id                TEXT PRIMARY KEY,
  nome              TEXT NOT NULL,
  veiculo           TEXT,
  url_site          TEXT NOT NULL,
  url_feed          TEXT,
  tipo              TEXT NOT NULL CHECK (tipo IN ('press','imprensa','associacao','academico','calendario')),
  idioma            TEXT NOT NULL,
  pais              TEXT NOT NULL,
  nucleo            TEXT,
  -- nega por padrão: fonte nova nasce 'resumo' e só sobe depois que alguém
  -- leu os termos e gravou a evidência
  licenca           TEXT NOT NULL DEFAULT 'resumo' CHECK (licenca IN ('liberada','resumo','bloqueada')),
  licenca_evidencia TEXT,
  licenca_conferida TEXT,
  confianca         TEXT NOT NULL DEFAULT 'media' CHECK (confianca IN ('alta','media','baixa')),
  -- 1 = fonte BR que quase nunca é publicada: existe para medir o atraso
  marca_relogio     INTEGER NOT NULL DEFAULT 0,
  peso              INTEGER NOT NULL DEFAULT 5,
  intervalo_min     INTEGER NOT NULL DEFAULT 60,
  ativo             INTEGER NOT NULL DEFAULT 1,
  ultima_coleta     TEXT,
  ultimo_erro       TEXT,
  criado_em         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_fonte_vencida ON fonte(ativo, ultima_coleta);

-- -------------------------------------------------------------------------
-- assunto — o coração da pergunta-assinatura
-- Agrupa itens de fontes e idiomas diferentes que falam da mesma coisa.
-- -------------------------------------------------------------------------
CREATE TABLE assunto (
  id                 TEXT PRIMARY KEY,
  rotulo             TEXT NOT NULL,
  chave              TEXT NOT NULL,
  fornecedores       TEXT,
  nucleo             TEXT,
  tema               TEXT,

  publicado_original TEXT,
  fonte_original     TEXT REFERENCES fonte(id),
  primeira_mencao_br TEXT,
  fonte_br           TEXT REFERENCES fonte(id),
  -- NULL não é falha: assunto que segue NULL depois de meses é o que
  -- nunca chegou ao Brasil — e esse costuma ser o achado
  atraso_br_dias     INTEGER,
  atraso_apurado_em  TEXT,

  qtd_itens          INTEGER NOT NULL DEFAULT 1,
  criado_em          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_assunto_chave  ON assunto(chave);
CREATE INDEX idx_assunto_atraso ON assunto(atraso_br_dias);

-- -------------------------------------------------------------------------
-- item — o radar
-- -------------------------------------------------------------------------
CREATE TABLE item (
  id                 TEXT PRIMARY KEY,
  fonte_id           TEXT NOT NULL REFERENCES fonte(id),
  assunto_id         TEXT REFERENCES assunto(id),
  nucleo             TEXT NOT NULL,
  slug               TEXT UNIQUE,

  titulo             TEXT NOT NULL,
  titulo_original    TEXT,
  url                TEXT NOT NULL,
  url_canonica       TEXT NOT NULL,
  idioma_origem      TEXT NOT NULL,

  modo               TEXT NOT NULL CHECK (modo IN ('traducao','resumo')),
  corpo              TEXT,
  resumo             TEXT,
  -- a camada que separa autoridade de tradução automática em massa
  contexto_br        TEXT,
  -- O veredito do contexto: categoria fechada, pública e auditável (a lição
  -- do Aos Fatos). 'nao_chega' é exatamente o que o atraso mede; 'sem_efeito'
  -- é a opção honesta — sem ela o parágrafo vira enchimento, porque o modelo
  -- SEMPRE acha alguma consequência quando é obrigado a achar.
  contexto_veredito  TEXT CHECK (contexto_veredito IN
                     ('chega','a_caminho','nao_chega','sem_efeito')),

  tipo_de_item       TEXT,
  tema               TEXT,
  fornecedores       TEXT,
  uf                 TEXT,

  publicado_fonte    TEXT NOT NULL,
  coletado_em        TEXT NOT NULL DEFAULT (datetime('now')),
  publicado_em       TEXT,
  traduzido_em       TEXT,
  -- o relógio: é conteúdo, não metadado
  minutos_apos_fonte INTEGER,

  status             TEXT NOT NULL DEFAULT 'coletado'
                     CHECK (status IN ('coletado','classificado','publicado','arquivado')),
  motivo_arquivo     TEXT,
  -- 0 acende o selo "tradução automática · revisão pendente"
  revisado_humano    INTEGER NOT NULL DEFAULT 0,
  revisor            TEXT,
  revisado_em        TEXT,

  og_key             TEXT,
  criado_em          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_item_canonica  ON item(url_canonica);
CREATE INDEX        idx_item_publicado ON item(nucleo, status, publicado_em DESC);
CREATE INDEX        idx_item_assunto   ON item(assunto_id);
CREATE INDEX        idx_item_veredito  ON item(status, contexto_veredito);

-- -------------------------------------------------------------------------
-- evento — o ativo mais durável. Sempre passa por aprovação humana.
-- -------------------------------------------------------------------------
CREATE TABLE evento (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE,
  nucleo        TEXT NOT NULL,
  nome          TEXT NOT NULL,
  descricao     TEXT,
  inicio        TEXT NOT NULL,
  fim           TEXT,
  cidade        TEXT,
  uf            TEXT,
  pais          TEXT NOT NULL DEFAULT 'BR',
  formato       TEXT NOT NULL CHECK (formato IN ('presencial','online','hibrido')),
  organizador   TEXT,
  url           TEXT,
  preco         TEXT,
  origem        TEXT NOT NULL CHECK (origem IN ('coletor','formulario','manual')),
  fonte_id      TEXT REFERENCES fonte(id),
  destaque      INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'coletado'
                CHECK (status IN ('coletado','publicado','arquivado')),
  criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT
);

CREATE INDEX idx_evento_agenda ON evento(status, inicio);

-- -------------------------------------------------------------------------
-- obra — o conteúdo assinado. Separado de item de propósito.
-- -------------------------------------------------------------------------
CREATE TABLE obra (
  id           TEXT PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  nucleo       TEXT NOT NULL,
  formato      TEXT NOT NULL CHECK (formato IN ('leitura','analise','caso','panorama')),
  titulo       TEXT NOT NULL,
  lead         TEXT,
  corpo        TEXT NOT NULL,
  autor        TEXT NOT NULL,
  -- 0 só na Leitura do Instituto, que sai como voz do núcleo
  assinada     INTEGER NOT NULL DEFAULT 1,
  item_id      TEXT REFERENCES item(id),
  publicado_em TEXT,
  status       TEXT NOT NULL DEFAULT 'rascunho'
               CHECK (status IN ('rascunho','publicado','arquivado')),
  criado_em    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_obra_nucleo ON obra(nucleo, status, publicado_em DESC);

-- -------------------------------------------------------------------------
-- glossario — infraestrutura de tradução que também é página pública
-- -------------------------------------------------------------------------
CREATE TABLE glossario (
  termo_origem TEXT NOT NULL,
  idioma       TEXT NOT NULL,
  termo_pt     TEXT NOT NULL,
  nota         TEXT,
  travado      INTEGER NOT NULL DEFAULT 1,
  -- 1 = o termo NAO se traduz: fica na lingua de origem, com o significado
  -- aproximado entre parenteses na primeira ocorrencia. Inventar equivalente
  -- em portugues que ninguem usa no setor e pior que manter o estrangeirismo.
  manter_original INTEGER NOT NULL DEFAULT 0,
  nucleo       TEXT,
  criado_em    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (termo_origem, idioma)
);

-- -------------------------------------------------------------------------
-- Apoio
-- -------------------------------------------------------------------------

-- registro público de correção — separa veículo de blog
CREATE TABLE correcao (
  id      TEXT PRIMARY KEY,
  item_id TEXT REFERENCES item(id),
  obra_id TEXT REFERENCES obra(id),
  texto   TEXT NOT NULL,
  data    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- kill-switch: sem isto, um feed que enlouquece vira uma conta que não é sua
CREATE TABLE custo_dia (
  data       TEXT PRIMARY KEY,
  tokens_in  INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  brl        REAL    NOT NULL DEFAULT 0,
  itens      INTEGER NOT NULL DEFAULT 0,
  pausado_em TEXT
);

-- site é aluguel, lista é propriedade. No v0 só captura; envio vem depois.
CREATE TABLE assinante (
  email      TEXT PRIMARY KEY,
  nucleos    TEXT,
  origem     TEXT,
  confirmado INTEGER NOT NULL DEFAULT 0,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now'))
);
