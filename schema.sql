-- =========================================================================
-- Instituto Automação — schema do D1 · v2 (03/09/2026)
--
-- O D1 guarda DUAS coisas, e só duas:
--   1. o que a máquina colhe — `fonte`, `item`, `assunto`: a base do relógio
--   2. o que vem de fora — `evento` (formulário público) e `assinante`
--
-- Conteúdo NÃO mora aqui. Peça é arquivo markdown em conteudo/**, compilado
-- para o bundle. Saíram desta versão: `obra`, `giro`, `custo_dia`, e as 17
-- colunas de `item` que eram estado do pipeline de IA.
--
-- Tudo em UTC (ISO 8601). Para banco que já tem dado, use migracoes/005-v2.sql
-- em vez deste arquivo — ele começa com DROP TABLE, e item colhido não volta.
-- =========================================================================

DROP TABLE IF EXISTS submissao_arquivo;
DROP TABLE IF EXISTS submissao;
DROP TABLE IF EXISTS contato;
DROP TABLE IF EXISTS correcao;
DROP TABLE IF EXISTS item;
DROP TABLE IF EXISTS assunto;
DROP TABLE IF EXISTS evento;
DROP TABLE IF EXISTS glossario;
DROP TABLE IF EXISTS assinante;
DROP TABLE IF EXISTS fonte;

-- -------------------------------------------------------------------------
-- fonte — de onde a máquina colhe, e o que cada fonte permite
-- -------------------------------------------------------------------------
CREATE TABLE fonte (
  id                TEXT PRIMARY KEY,
  nome              TEXT NOT NULL,
  veiculo           TEXT,
  url_site          TEXT NOT NULL,
  url_feed          TEXT,
  -- o MEIO: imprensa, sala de imprensa, associacao, forum, social...
  tipo              TEXT NOT NULL CHECK (tipo IN
                    ('press','imprensa','associacao','academico','calendario',
                     'social','forum','video','release')),
  idioma            TEXT NOT NULL,
  pais              TEXT NOT NULL,
  -- o TEMA (chama-se `nucleo` por heranca da v1): 'industria' | 'processos'
  nucleo            TEXT,
  -- 'bloqueada' e a unica que muda a coleta: fonte bloqueada nao e colhida.
  -- 'liberada' deixou de ser pre-requisito de produto — nao ha republicacao
  -- automatica de nada. Fica como registro do que a fonte autoriza.
  licenca           TEXT NOT NULL DEFAULT 'resumo' CHECK (licenca IN ('liberada','resumo','bloqueada')),
  licenca_evidencia TEXT,
  licenca_conferida TEXT,
  confianca         TEXT NOT NULL DEFAULT 'media' CHECK (confianca IN ('alta','media','baixa')),
  -- VOZ: pessoa publica que publica com nome proprio. E um EIXO, nao um tipo:
  -- `tipo` diz o MEIO, `pessoa` diz de QUEM e a assinatura.
  pessoa            TEXT,
  pessoa_papel      TEXT,
  -- 1 = fonte BR que existe para marcar quando o assunto chegou aqui
  marca_relogio     INTEGER NOT NULL DEFAULT 0,
  peso              INTEGER NOT NULL DEFAULT 5,
  -- 'sitemap' e o caminho para fonte que fecha o RSS no robots.txt e anuncia
  -- o sitemap-news no mesmo arquivo
  colheita          TEXT NOT NULL DEFAULT 'feed' CHECK (colheita IN ('feed','sitemap')),
  intervalo_min     INTEGER NOT NULL DEFAULT 60,
  ativo             INTEGER NOT NULL DEFAULT 1,
  -- O veredito do robots.txt, conferido pelo coletor e PUBLICADO em
  -- /blueprints. NULL = nao conferido; 0 = a fonte diz nao, ou o proprio
  -- robots.txt esta ilegivel — sem regra legivel nao ha consentimento a inferir.
  robots_permite    INTEGER,
  robots_atraso     REAL,
  robots_motivo     TEXT,
  robots_conferido  TEXT,
  ultima_coleta     TEXT,
  ultimo_erro       TEXT,
  criado_em         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_fonte_vencida ON fonte(ativo, ultima_coleta);

-- -------------------------------------------------------------------------
-- assunto — o coracao da pergunta-assinatura
-- Agrupa itens de fontes e idiomas diferentes que falam da mesma coisa, e e
-- onde o atraso entre "la fora" e "aqui" e medido.
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
  -- NULL nao e falha: assunto que segue NULL depois de meses e o que nunca
  -- chegou ao Brasil — e esse costuma ser o achado
  atraso_br_dias     INTEGER,
  atraso_apurado_em  TEXT,

  qtd_itens          INTEGER NOT NULL DEFAULT 1,
  criado_em          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_assunto_chave  ON assunto(chave);
CREATE INDEX idx_assunto_atraso ON assunto(atraso_br_dias);

-- -------------------------------------------------------------------------
-- item — o registro do que foi colhido. So isso.
--
-- Dez colunas. Eram vinte e sete: as outras dezessete (corpo, contexto_br,
-- veredito, modo, status, slug, revisado_*, og_key...) eram o estado do
-- pipeline de IA SOBRE o item. Sem pipeline, item volta a ser dado bruto.
-- Peca publicada e outra coisa, mora em outro lugar, e aponta para a URL da
-- fonte — nao para uma linha daqui.
-- -------------------------------------------------------------------------
CREATE TABLE item (
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

CREATE UNIQUE INDEX idx_item_canonica ON item(url_canonica);
CREATE INDEX        idx_item_assunto  ON item(assunto_id);
CREATE INDEX        idx_item_colheita ON item(coletado_em DESC);

-- -------------------------------------------------------------------------
-- evento — o ativo mais duravel. Chega pelo formulario publico, e por isso
-- mora no banco: nao da para passar por commit o que o organizador envia.
-- Sempre passa por conferencia humana antes de aparecer.
-- -------------------------------------------------------------------------
CREATE TABLE evento (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE,
  -- o TEMA (chama-se `nucleo` por heranca): 'industria' | 'processos'
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
-- glossario — a pagina de referencia dos termos.
-- Na v1 entrava no prompt de traducao. Sem prompt, continua sendo o que
-- sempre foi para o leitor: a regua publica de como o Instituto traduz.
-- -------------------------------------------------------------------------
CREATE TABLE glossario (
  termo_origem TEXT NOT NULL,
  idioma       TEXT NOT NULL,
  termo_pt     TEXT NOT NULL,
  nota         TEXT,
  travado      INTEGER NOT NULL DEFAULT 1,
  -- 1 = o termo NAO se traduz: fica na lingua de origem, com o significado
  -- aproximado na primeira ocorrencia
  manter_original INTEGER NOT NULL DEFAULT 0,
  nucleo       TEXT,
  criado_em    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (termo_origem, idioma)
);

-- -------------------------------------------------------------------------
-- correcao — registro publico. Aponta para a PECA pelo caminho publico
-- (/noticias/slug), porque peca nao esta no banco.
-- -------------------------------------------------------------------------
CREATE TABLE correcao (
  id      TEXT PRIMARY KEY,
  peca    TEXT,
  texto   TEXT NOT NULL,
  data    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- site e aluguel, lista e propriedade. Captura agora; envio quando a lista
-- justificar.
CREATE TABLE assinante (
  email      TEXT PRIMARY KEY,
  nucleos    TEXT,
  origem     TEXT,
  confirmado INTEGER NOT NULL DEFAULT 0,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now')),
  -- 006 (07/09/2026): o que a pessoa faz — para saber para quem se escreve
  atuacao    TEXT,     -- opera | integra | ensina | estuda | outra
  empresa    TEXT
);

-- Quem se apresentou pelos formulários "Escreva no Instituto" e "Apoie".
-- É caixa de entrada, não cadastro: lido por gente, respondido por gente.
CREATE TABLE contato (
  id        TEXT PRIMARY KEY,
  tipo      TEXT NOT NULL CHECK (tipo IN ('autor', 'parceiro')),
  nome      TEXT NOT NULL,
  email     TEXT NOT NULL,
  empresa   TEXT,
  mensagem  TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- -------------------------------------------------------------------------
-- submissao — o artigo que chega pelo editor de /escrever (migração 009)
-- É caixa de entrada, não banco de conteúdo: o git continua sendo o CMS.
-- -------------------------------------------------------------------------
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
