-- =========================================================================
-- Dado semente — v2.
--
-- Só o que precisa existir para o site renderizar sem ser conteúdo: o
-- glossário (página de referência) e eventos de exemplo para a agenda ter
-- forma. NENHUM item, NENHUMA peça: peça mora em conteudo/**.md, e item vem
-- da coleta real (npm run db:fontes && npm run colher).
--
-- Eventos são FICTÍCIOS de propósito e dizem isso no nome. Os reais entram
-- com data conferida na fonte oficial: agenda com data errada não serve.
-- =========================================================================

-- Glossário — a régua pública de como o Instituto traduz -------------------
INSERT OR REPLACE INTO glossario (termo_origem, idioma, termo_pt, nota, travado, manter_original, nucleo) VALUES
  ('closed-loop control', 'en', 'controle em malha fechada',
   'Nunca "controle de circuito fechado" — tradução literal que denuncia máquina na primeira linha.', 1, 0, 'industria'),
  ('drive', 'en', 'inversor de frequência',
   'Quando o contexto for acionamento em geral, usar "acionamento". Nunca deixar "drive" solto.', 1, 0, 'industria'),
  ('PLC', 'en', 'CLP', 'Controlador lógico programável. Sigla em português.', 1, 0, 'industria'),
  ('SPS', 'de', 'CLP', 'Speicherprogrammierbare Steuerung. Mesma coisa que PLC.', 1, 0, 'industria'),
  ('safety', 'en', 'segurança de máquina',
   '"Segurança" sozinho vira ambíguo com segurança da informação.', 1, 0, 'industria'),
  ('HMI', 'en', 'IHM', 'Interface homem-máquina.', 1, 0, 'industria'),
  ('predictive maintenance', 'en', 'manutenção preditiva', NULL, 1, 0, 'industria'),
  ('throughput', 'en', 'vazão', 'Em contexto de linha de produção. Não "taxa de transferência".', 1, 0, 'industria'),
  ('foundation model', 'en', 'modelo de fundação', 'Consagrado assim na literatura em português. Não "modelo fundacional".', 1, 0, 'processos'),
  ('in-context learning', 'en', 'aprendizado em contexto', 'O modelo aprende pelo que vai no prompt, sem retreino.', 1, 0, 'processos'),
  ('workflow', 'en', 'fluxo de trabalho', 'Em ferramenta de automação (n8n, Make), pode manter "workflow" quando for o nome do objeto na tela.', 1, 0, 'processos');

INSERT OR REPLACE INTO glossario (termo_origem, idioma, termo_pt, nota, travado, manter_original, nucleo) VALUES
  ('brownfield', 'en', 'brownfield', 'planta já existente, com parque instalado a integrar', 1, 1, 'industria'),
  ('greenfield', 'en', 'greenfield', 'planta nova, projetada do zero', 1, 1, 'industria'),
  ('cobot', 'en', 'cobot', 'robô colaborativo, que opera sem cerca junto ao operador', 1, 1, 'industria'),
  ('lead time', 'en', 'lead time', 'tempo entre o pedido e a entrega', 1, 1, 'industria'),
  ('payback', 'en', 'payback', 'tempo até o investimento se pagar', 1, 1, 'industria'),
  ('OEE', 'en', 'OEE', 'eficiência global do equipamento', 1, 1, 'industria'),
  ('setup', 'en', 'setup', 'troca e preparação de ferramenta entre lotes', 1, 1, 'industria'),
  ('edge', 'en', 'edge', 'processamento no próprio equipamento, sem passar por servidor', 1, 1, 'industria'),
  ('retrofit', 'en', 'retrofit', 'modernização de máquina existente', 1, 1, 'industria'),
  ('omni-bodied', 'en', 'omni-bodied', 'modelo que roda em corpos de robô diferentes: braço, quadrúpede, humanoide', 1, 1, 'industria'),
  ('agente', 'en', 'agente', 'programa que decide e age em sequência para cumprir um objetivo; em português já se usa assim', 1, 1, 'processos');

-- Eventos de exemplo — FICTÍCIOS ------------------------------------------
INSERT OR REPLACE INTO evento (id, slug, nucleo, nome, descricao, inicio, fim, cidade, uf, pais,
                               formato, organizador, url, preco, origem, status) VALUES
  ('ev-001','encontro-de-automacao-de-processos-exemplo','processos',
   'Encontro de automação de processos e agentes de IA (exemplo)',
   'Evento fictício de desenvolvimento. Serve para exercitar a agenda, os filtros e os dados estruturados.',
   '2026-11-12','2026-11-12','São Paulo','SP','BR','presencial','Organização Exemplo',
   'https://exemplo.com.br/encontro','gratuito','manual','publicado'),

  ('ev-002','feira-internacional-de-maquinas-exemplo','industria',
   'Feira internacional de máquinas e automação industrial (exemplo)',
   'Evento fictício de desenvolvimento, com vários dias, para exercitar a exibição de período.',
   '2027-03-03','2027-03-06','Hannover',NULL,'DE','presencial','Feira Exemplo',
   'https://exemplo.de/feira','pago','manual','publicado'),

  ('ev-003','seminario-online-de-manutencao-preditiva-exemplo','industria',
   'Seminário online de manutenção preditiva (exemplo)',
   'Evento fictício de desenvolvimento, no formato online.',
   '2026-09-24',NULL,NULL,NULL,'BR','online','Associação Exemplo',
   'https://exemplo.org/seminario','gratuito','manual','publicado'),

  ('ev-004','congresso-brasileiro-de-automacao-exemplo','processos',
   'Congresso brasileiro de automação e trabalho (exemplo)',
   'Evento fictício de desenvolvimento, formato híbrido.',
   '2026-10-08','2026-10-10','Campinas','SP','BR','hibrido','Universidade Exemplo',
   'https://exemplo.edu.br/congresso','pago','manual','publicado'),

  -- passado de propósito: NÃO pode aparecer na agenda
  ('ev-006','evento-que-ja-passou-exemplo','industria',
   'Evento que já passou (exemplo)','Existe para provar que a agenda não mostra o que já aconteceu.',
   '2026-07-01','2026-07-02','Recife','PE','BR','presencial','Exemplo',NULL,NULL,'manual','publicado'),

  -- aguardando conferência: NÃO pode aparecer na agenda
  ('ev-007','evento-nao-conferido-exemplo','industria',
   'Evento enviado e não conferido (exemplo)','Existe para provar que envio não conferido não vai ao ar.',
   '2026-12-01',NULL,'Curitiba','PR','BR','presencial','Exemplo',NULL,NULL,'formulario','coletado');
