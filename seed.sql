-- =========================================================================
-- Dado semente — v2.
--
-- Só o que precisa existir para o site renderizar sem ser conteúdo: o
-- glossário (página de referência) e os eventos reais da agenda —
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

-- Termos que as peças de 04/09/2026 usam ------------------------------------
INSERT OR REPLACE INTO glossario (termo_origem, idioma, termo_pt, nota, travado, manter_original, nucleo) VALUES
  ('ISA/IEC 62443', 'en', 'ISA/IEC 62443',
   'série de normas de cibersegurança para automação industrial e sistemas de controle; a primeira parte existe em português como ABNT NBR IEC TS 62443-1-1 (2023)', 1, 1, 'industria'),
  ('functional safety', 'en', 'segurança funcional',
   'a parte do sistema que leva a máquina a um estado seguro quando algo falha; é certificada por nível (SIL, PL), e "controlador de segurança funcional" é o hardware certificado para isso', 1, 0, 'industria'),
  ('motion control', 'en', 'controle de movimento',
   'controle coordenado de eixos (servomotores, posicionadores); tradicionalmente um controlador separado do CLP', 1, 0, 'industria'),
  ('end-of-arm tooling', 'en', 'ferramental de ponta de braço',
   'garra, ventosa ou ferramenta que fica na ponta do robô e toca a peça; sigla EOAT em inglês', 1, 0, 'industria'),
  ('pick', 'en', 'pick',
   'uma coleta de item em armazém ou linha; "picks por hora" é a métrica comercial, e "qualidade do pick" (sem dano, sem item duplo, sem item errado) é a que custa', 1, 1, 'industria'),
  ('physical AI', 'en', 'IA física',
   'IA que percebe e age no mundo físico, por robô; termo de marketing do setor em 2025-2026, usado aqui como está', 1, 0, 'industria'),
  ('microfactory', 'en', 'microfábrica',
   'fábrica pequena, barata e perto da demanda, em vez de uma planta grande e distante', 1, 0, 'industria'),
  ('RBAC', 'en', 'controle de acesso por papel',
   'role-based access control: permissão dada pela função da pessoa, não pela pessoa; a sigla fica na primeira ocorrência', 1, 0, 'processos'),
  ('TBAC', 'en', 'controle de acesso por tarefa',
   'task-based access control: a permissão é avaliada a cada ação, pelo que o agente está fazendo, e não por um papel fixo', 1, 0, 'processos'),
  ('SPAC', 'en', 'SPAC',
   'special-purpose acquisition company: empresa de capital aberto criada só para se fundir com outra e levá-la à bolsa sem IPO tradicional', 1, 1, 'industria'),
  ('UPC', 'en', 'Tribunal Unificado de Patentes',
   'Unified Patent Court: tribunal europeu cuja decisão vale nos países da União Europeia que aderiram ao acordo', 1, 0, 'industria');

-- Eventos ---------------------------------------------------------------
-- Os quatro fictícios da v1 saem (e saem de qualquer banco que rode este
-- arquivo). Entram eventos reais; `descricao` diz ONDE a data foi conferida,
-- porque a regra da agenda é data conferida na fonte, e quando a fonte oficial
-- não expõe a data sem JavaScript, isso fica escrito para o leitor.
DELETE FROM evento WHERE id IN ('ev-001','ev-002','ev-003','ev-004','ev-005','ev-006','ev-007');

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
   'https://www.corl.org/',NULL,'manual','publicado');

-- Conferidos no SITE OFICIAL em 04/09/2026 (data legível na página, sem JavaScript) ----
INSERT OR REPLACE INTO evento (id, slug, nucleo, nome, descricao, inicio, fim, cidade, uf, pais,
                               formato, organizador, url, preco, origem, status) VALUES
  ('ev-sps-2026','sps-2026','industria',
   'SPS · Smart Production Solutions 2026',
   'A feira de automação industrial de Nuremberg: mais de mil expositores de controle, acionamento, sensores, software e redes industriais. Datas conferidas no site oficial em 04/09/2026.',
   '2026-11-24','2026-11-26','Nuremberg',NULL,'DE','presencial','Mesago Messe Frankfurt',
   'https://sps.mesago.com/nuernberg/en.html','pago','manual','publicado'),

  ('ev-automation-fair-2026','automation-fair-2026','industria',
   'Automation Fair 2026',
   'O evento anual da Rockwell Automation para clientes e integradores, com sessões técnicas, treinamento e exposição. Datas conferidas no site oficial em 04/09/2026.',
   '2026-11-16','2026-11-19','Boston','MA','US','presencial','Rockwell Automation',
   'https://www.rockwellautomation.com/en-us/company/events/automation-fair.html','pago','manual','publicado'),

  ('ev-hannover-messe-2027','hannover-messe-2027','industria',
   'HANNOVER MESSE 2027',
   'A maior feira industrial do mundo: automação, energia, robótica, software industrial e engenharia. Datas conferidas no site oficial em 04/09/2026.',
   '2027-04-05','2027-04-08','Hannover',NULL,'DE','presencial','Deutsche Messe',
   'https://www.hannovermesse.de/en/','pago','manual','publicado'),

  ('ev-expomafe-2027','expomafe-2027','industria',
   'EXPOMAFE 2027 · Feira Internacional de Máquinas, Ferramentas e Automação Industrial',
   'Máquinas-ferramenta, ferramentaria e automação industrial, no São Paulo Expo. Datas conferidas no site oficial em 04/09/2026.',
   '2027-05-04','2027-05-08','São Paulo','SP','BR','presencial','Informa Markets',
   'https://www.expomafe.com.br/','pago','manual','publicado'),

  ('ev-automate-2027','automate-2027','industria',
   'Automate 2027',
   'A maior feira de robótica, IA e automação da América do Norte, organizada pela A3 (Association for Advancing Automation). Datas conferidas no site oficial em 04/09/2026.',
   '2027-05-10','2027-05-13','Las Vegas','NV','US','presencial','A3 · Association for Advancing Automation',
   'https://www.automateshow.com/','pago','manual','publicado'),

  ('ev-icra-2027','icra-2027','industria',
   'ICRA 2027 · IEEE International Conference on Robotics and Automation',
   'A principal conferência acadêmica de robótica e automação, no Coex, em Seul. Datas conferidas no site oficial em 04/09/2026.',
   '2027-05-24','2027-05-28','Seul',NULL,'KR','presencial','IEEE Robotics and Automation Society',
   'https://2027.ieee-icra.org/','pago','manual','publicado'),

  ('ev-intermach-2027','intermach-2027','industria',
   'Intermach 2027 · Feira e Congresso de Tecnologia, Máquinas, Automação e Serviços para a Indústria Mecânica',
   'A feira da indústria mecânica de Joinville, na Expoville. Datas conferidas no site oficial em 04/09/2026.',
   '2027-07-13','2027-07-16','Joinville','SC','BR','presencial',NULL,
   'https://www.intermach.com.br/',NULL,'manual','publicado'),

  ('ev-fenasucro-2027','fenasucro-agrocana-2027','industria',
   'Fenasucro & Agrocana 2027',
   'A feira da indústria de bioenergia, no maior polo sucroenergético do país; automação de usina, instrumentação e máquinas agrícolas. Datas conferidas no site oficial em 04/09/2026.',
   '2027-08-10','2027-08-13','Sertãozinho','SP','BR','presencial',NULL,
   'https://www.fenasucro.com.br/',NULL,'manual','publicado'),

  ('ev-fiee-2027','fiee-2027','industria',
   'FIEE 2027 · Feira Internacional da Indústria Elétrica, Energia e Automação',
   'Automação, energia, geração e distribuição, IoT e infraestrutura de redes, no São Paulo Expo. Datas conferidas no site oficial em 04/09/2026.',
   '2027-09-14','2027-09-17','São Paulo','SP','BR','presencial',NULL,
   'https://www.fiee.com.br/',NULL,'manual','publicado');

-- Da agenda de eventos do CIMM (fonte que acompanhamos), consultada em 04/09/2026 --------
-- `origem = coletor` e `fonte_id = f-cimm` dizem de onde a data veio; `url` é o site
-- do próprio evento quando a página do CIMM o indica.
INSERT OR REPLACE INTO evento (id, slug, nucleo, nome, descricao, inicio, fim, cidade, uf, pais,
                               formato, organizador, url, preco, origem, fonte_id, status) VALUES
  ('ev-forum-manufatura-2026','forum-de-manufatura-2026','industria',
   '10º Fórum de Manufatura',
   'Congresso sobre manufatura e produtividade industrial. Data conforme a agenda de eventos do CIMM, consultada em 04/09/2026; confira no site do evento.',
   '2026-09-14','2026-09-15','São Paulo','SP','BR','presencial','Dialogia',
   'https://forumdemanufatura.com.br/',NULL,'coletor','f-cimm','publicado'),

  ('ev-interform-2026','interform-2026','industria',
   'Interform 2026 · Feira e Congresso de Tecnologias em Corte, Conformação, Usinagem, Soldagem e Automação',
   'Feira e congresso da indústria metal-mecânica em Joinville. Data conforme a agenda de eventos do CIMM, consultada em 04/09/2026.',
   '2026-09-15','2026-09-18','Joinville','SC','BR','presencial','Messe Brasil',
   'https://www.cimm.com.br/portal/eventos/2644-interform-feira-e-congresso-de-tecnologias-em-corte-conformacao-usinagem-soldagem-e-automacao-messe-brasil',NULL,'coletor','f-cimm','publicado'),

  ('ev-forum-ia-lean-2026','forum-ia-e-lean-2026','processos',
   'Fórum IA & Lean',
   'Congresso sobre inteligência artificial aplicada à gestão e à produção enxuta. Data conforme a agenda de eventos do CIMM, consultada em 04/09/2026; confira no site do evento.',
   '2026-09-22','2026-09-23','Curitiba','PR','BR','presencial',NULL,
   'https://discutalean.org/','pago','coletor','f-cimm','publicado'),

  ('ev-coloquio-usinagem-2026','xxviii-coloquio-de-usinagem','industria',
   'XXVIII Colóquio de Usinagem',
   'Encontro técnico e acadêmico sobre processos de usinagem. Data conforme a agenda de eventos do CIMM, consultada em 04/09/2026; inscrições no site do evento.',
   '2026-09-23','2026-09-25','Goiânia','GO','BR','presencial',NULL,
   'https://www.even3.com.br/xxviii-coloquio-de-usinagem-705546/',NULL,'coletor','f-cimm','publicado'),

  ('ev-mercopar-2026','mercopar-2026','industria',
   'Mercopar 2026 · Feira de Inovação Industrial',
   'A feira de inovação industrial da Serra Gaúcha: máquinas, automação, fornecedores e rodadas de negócio. Data conforme a agenda de eventos do CIMM, consultada em 04/09/2026; o site oficial não expõe a data sem JavaScript.',
   '2026-10-20','2026-10-23','Caxias do Sul','RS','BR','presencial',NULL,
   'https://mercopar.com.br/',NULL,'coletor','f-cimm','publicado'),

  ('ev-encontro-ppcp-2026','encontro-brasileiro-de-ppcp-2026','processos',
   'VII Encontro Brasileiro de PPCP & Gestão Industrial + I Encontro Brasileiro de S&OP, S&OE & IBP',
   'Planejamento, programação e controle da produção; gestão industrial e S&OP. Data conforme a agenda de eventos do CIMM, consultada em 04/09/2026; confira no site do evento.',
   '2026-11-16','2026-11-17','Joinville','SC','BR','presencial','Ápice Educação Executiva',
   'https://encontroppcp.apiceeducacaoexecutiva.com.br/','pago','coletor','f-cimm','publicado'),

  ('ev-expoindustrial-sul-2026','expoindustrial-sul-2026','industria',
   'Expoindustrial Sul 2026 · Feira de Soluções para a Indústria',
   'Feira de soluções industriais em Joinville: inovação, indústria 4.0, automação e fornecedores. Data conforme a agenda de eventos do CIMM, consultada em 04/09/2026; confira no site do evento.',
   '2026-11-16','2026-11-19','Joinville','SC','BR','presencial',NULL,
   'https://expoindustrialsul.com.br/',NULL,'coletor','f-cimm','publicado');
