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

-- Eventos ---------------------------------------------------------------
-- Os quatro fictícios da v1 saem (e saem de qualquer banco que rode este
-- arquivo). Entram eventos reais; `descricao` diz ONDE a data foi conferida,
-- porque a regra da agenda é data conferida na fonte, e quando a fonte oficial
-- não expõe a data sem JavaScript, isso fica escrito para o leitor.
DELETE FROM evento WHERE id IN ('ev-001','ev-002','ev-003','ev-004','ev-005');

INSERT OR REPLACE INTO evento (id, slug, nucleo, nome, descricao, inicio, fim, cidade, uf, pais,
                               formato, organizador, url, preco, origem, status) VALUES
  ('ev-robobusiness-2026','robobusiness-2026','industria',
   'RoboBusiness 2026',
   'Conferência e feira de negócios em robótica comercial. Entre os temas anunciados para esta edição: IA física, tecnologias habilitadoras e reindustrialização com automação e robótica de campo. Datas conferidas no site oficial em 04/09/2026.',
   '2026-10-20','2026-10-21','Santa Clara','CA','US','presencial','WTWH Media',
   'https://www.robobusiness.com/','pago','manual','publicado'),

  ('ev-humanoids-summit-seoul-2026','humanoids-summit-seoul-2026','industria',
   'Humanoids Summit Seoul 2026',
   'Encontro dedicado a robôs humanoides, edição asiática. Datas conforme o calendário de eventos da IEEE Spectrum (Video Friday de 28/08/2026); o site oficial não expõe a data sem JavaScript e ela não foi conferida lá.',
   '2026-09-22','2026-09-23','Seul',NULL,'KR','presencial',NULL,
   'https://humanoidssummit.com/',NULL,'manual','publicado'),

  ('ev-iros-2026','iros-2026','industria',
   'IROS 2026 · IEEE/RSJ International Conference on Intelligent Robots and Systems',
   'Uma das duas maiores conferências acadêmicas de robótica do mundo. Datas conforme o calendário de eventos da IEEE Spectrum (Video Friday de 28/08/2026); o site oficial não expõe a data sem JavaScript e ela não foi conferida lá.',
   '2026-09-27','2026-10-01','Pittsburgh','PA','US','presencial','IEEE RAS e RSJ',
   'https://iros2026.org/',NULL,'manual','publicado'),

  ('ev-corl-2026','corl-2026','industria',
   'CoRL 2026 · Conference on Robot Learning',
   'Conferência acadêmica sobre aprendizado de máquina aplicado a robôs; é onde modelos de fundação para robótica, como o S1 da Skild AI, costumam ser apresentados e discutidos. Datas conforme o calendário de eventos da IEEE Spectrum (Video Friday de 28/08/2026); não conferidas no site oficial.',
   '2026-11-09','2026-11-12','Austin','TX','US','presencial',NULL,
   'https://www.corl.org/',NULL,'manual','publicado'),

  -- passado de propósito: NÃO pode aparecer na agenda
  ('ev-006','evento-que-ja-passou-exemplo','industria',
   'Evento que já passou (exemplo)','Existe para provar que a agenda não mostra o que já aconteceu.',
   '2026-07-01','2026-07-02','Recife','PE','BR','presencial','Exemplo',NULL,NULL,'manual','publicado'),

  -- aguardando conferência: NÃO pode aparecer na agenda
  ('ev-007','evento-nao-conferido-exemplo','industria',
   'Evento enviado e não conferido (exemplo)','Existe para provar que envio não conferido não vai ao ar.',
   '2026-12-01',NULL,'Curitiba','PR','BR','presencial','Exemplo',NULL,NULL,'formulario','coletado');
