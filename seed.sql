-- =========================================================================
-- Dado semente — só para o bloco 1 ter o que renderizar.
-- Fontes e textos são FICTÍCIOS de propósito: nada aqui é notícia real,
-- e nada aqui vai para produção.
-- =========================================================================

DELETE FROM item;
DELETE FROM assunto;
DELETE FROM fonte;

-- Uma fonte de cada faixa de licença, para exercitar os dois caminhos ------
INSERT INTO fonte (id, nome, veiculo, url_site, url_feed, tipo, idioma, pais, nucleo,
                   licenca, licenca_evidencia, confianca, marca_relogio, intervalo_min)
VALUES
  ('f-press-exemplo', 'Sala de imprensa (exemplo)', 'Fabricante Exemplo',
   'https://press.exemplo.com', 'https://press.exemplo.com/rss', 'press', 'de', 'DE', 'industria',
   'liberada', 'https://press.exemplo.com/termos-imprensa', 'alta', 0, 15),

  ('f-imprensa-exemplo', 'Imprensa técnica (exemplo)', 'Editora Exemplo',
   'https://exemplo.org', 'https://exemplo.org/feed', 'imprensa', 'en', 'US', 'industria',
   'resumo', NULL, 'media', 0, 60),

  -- não publica: existe para marcar quando o assunto chegou ao Brasil
  ('f-br-exemplo', 'Portal brasileiro (exemplo)', 'Portal Exemplo',
   'https://exemplo.com.br', 'https://exemplo.com.br/feed', 'imprensa', 'pt', 'BR', 'industria',
   'resumo', NULL, 'media', 1, 60);

-- Um assunto SEM menção brasileira ainda — o caso mais interessante do dataset --
INSERT INTO assunto (id, rotulo, chave, fornecedores, nucleo,
                     publicado_original, fonte_original,
                     primeira_mencao_br, fonte_br, atraso_br_dias, atraso_apurado_em, qtd_itens)
VALUES
  ('a-clp-preditivo', 'controladores diagnostico preditivo', 'clp-diagnostico-preditivo',
   '["Fabricante Exemplo"]', 'industria',
   '2026-08-30T09:12:00Z', 'f-press-exemplo',
   NULL, NULL, NULL, NULL, 2);

-- Itens --------------------------------------------------------------------
INSERT INTO item (id, fonte_id, assunto_id, nucleo, slug, titulo, titulo_original,
                  url, url_canonica, idioma_origem, modo, corpo, resumo, contexto_br,
                  tipo_de_item, tema, fornecedores, publicado_fonte, publicado_em,
                  minutos_apos_fonte, status, revisado_humano)
VALUES
  ('i-001', 'f-press-exemplo', 'a-clp-preditivo', 'industria',
   'controladores-diagnostico-preditivo-no-clp',
   'Nova geração de controladores integra diagnóstico preditivo direto no CLP',
   'Neue Steuerungsgeneration bringt vorausschauende Diagnose direkt in die SPS',
   'https://press.exemplo.com/2026/08/clp-preditivo',
   'https://press.exemplo.com/2026/08/clp-preditivo',
   'de', 'traducao',
   'O fabricante anunciou uma linha de controladores em que o modelo de detecção de anomalia roda no próprio equipamento, sem passar por servidor externo. Segundo a nota, o tempo de reação a falha cai de minutos para segundos, e o protocolo segue retrocompatível com a geração anterior.',
   NULL,
   'A linha ainda não tem representação declarada no Brasil, e integrador daqui só deve ver preço no segundo semestre. Para quem opera parque antigo, o ponto prático é outro: o protocolo é retrocompatível.',
   'lancamento', '["clp","manutencao-preditiva"]', '["Fabricante Exemplo"]',
   '2026-08-30T09:12:00Z', '2026-08-30T09:26:00Z', 14, 'publicado', 0),

  ('i-002', 'f-imprensa-exemplo', 'a-clp-preditivo', 'industria',
   'revisao-da-norma-de-celulas-colaborativas',
   'Consórcio publica revisão da norma de segurança para células robotizadas colaborativas',
   'Consortium publishes revised safety standard for collaborative robot cells',
   'https://exemplo.org/2026/08/norma-cobots',
   'https://exemplo.org/2026/08/norma-cobots',
   'en', 'resumo',
   NULL,
   'A revisão muda o cálculo de distância de separação e passa a exigir registro documental do ensaio de força e pressão. O texto entra em vigor após período de transição de 18 meses.',
   'Integrador brasileiro que já entrega célula colaborativa vai precisar rever o dossiê de segurança — o ensaio documental deixa de ser opcional.',
   'regulacao', '["seguranca","robotica"]', '[]',
   '2026-08-29T16:40:00Z', '2026-08-30T14:05:00Z', 1285, 'publicado', 1),

  ('i-003', 'f-press-exemplo', NULL, 'industria',
   'inversores-com-medicao-de-consumo-embarcada',
   'Linha de inversores passa a medir consumo sem medidor externo',
   'Frequenzumrichter messen Verbrauch ohne externen Zähler',
   'https://press.exemplo.com/2026/08/inversores-medicao',
   'https://press.exemplo.com/2026/08/inversores-medicao',
   'de', 'traducao',
   'A medição de energia passa a ser feita pelo próprio inversor de frequência, dispensando medidor dedicado no painel. O fabricante afirma que a precisão atende à classe exigida para faturamento interno.',
   NULL,
   'Interessa a quem faz rateio de energia por linha de produção: hoje isso exige medidor por painel, e o custo do medidor costuma ser maior que o do próprio ganho.',
   'lancamento', '["inversor","energia"]', '["Fabricante Exemplo"]',
   '2026-08-28T11:00:00Z', '2026-08-28T11:31:00Z', 31, 'publicado', 0);

-- Glossário semente — os termos que o LLM erra primeiro ---------------------
-- Coluna 1: os que TÊM tradução consagrada e ela é obrigatória.
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
  ('throughput', 'en', 'vazão', 'Em contexto de linha de produção. Não "taxa de transferência".', 1, 0, 'industria');

-- Coluna 2: os que NÃO se traduzem. Ficam na língua de origem, com o
-- significado aproximado entre parênteses na primeira ocorrência.
-- Inventar equivalente em português que ninguém usa no chão de fábrica é
-- pior que manter o estrangeirismo — e denuncia tradução automática.
INSERT OR REPLACE INTO glossario (termo_origem, idioma, termo_pt, nota, travado, manter_original, nucleo) VALUES
  ('brownfield', 'en', 'brownfield', 'planta já existente, com parque instalado a integrar', 1, 1, 'industria'),
  ('greenfield', 'en', 'greenfield', 'planta nova, projetada do zero', 1, 1, 'industria'),
  ('cobot', 'en', 'cobot', 'robô colaborativo, que opera sem cerca junto ao operador', 1, 1, 'industria'),
  ('lead time', 'en', 'lead time', 'tempo entre o pedido e a entrega', 1, 1, 'industria'),
  ('payback', 'en', 'payback', 'tempo até o investimento se pagar', 1, 1, 'industria'),
  ('OEE', 'en', 'OEE', 'eficiência global do equipamento', 1, 1, 'industria'),
  ('setup', 'en', 'setup', 'troca e preparação de ferramenta entre lotes', 1, 1, 'industria'),
  ('edge', 'en', 'edge', 'processamento no próprio equipamento, sem passar por servidor', 1, 1, 'industria'),
  ('retrofit', 'en', 'retrofit', 'modernização de máquina existente', 1, 1, 'industria');
