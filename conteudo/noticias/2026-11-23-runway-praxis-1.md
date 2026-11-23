---
secao: noticias
formato: curta
tema: industria
titulo: Runway abre o Praxis-1, modelo de ação para robôs treinado em vídeo, com licença Apache 2.0 e pesos públicos
titulo_curto: Runway abre o Praxis-1 para robótica
lead: A Runway liberou o Praxis-1, modelo de 27 bilhões de parâmetros que aprende tarefas físicas a partir de vídeo. Os pesos estão no GitHub e no Hugging Face, e a licença permite uso comercial.
autor: Redação do Instituto
data: 2026-11-23
imagem:
  arquivo:   2026-11-23-runway-praxis-1.jpg
  credito:   Runway
  licenca:   fonte
  alt:       Quatro cenas de braços robóticos brancos e pretos arrumando meias e panos em caixas de madeira sobre uma bancada
veredito: chega
fonte:
  nome: Robotics & Automation News
  url: https://roboticsandautomationnews.com/2026/11/22/runway-releases-praxis-1-open-weight-world-action-model-for-robotics/107430/
  idioma: en
  publicado: 2026-11-22
---

A **Runway**, empresa conhecida por modelos de geração de vídeo, liberou o **Praxis-1**, um modelo de ação de mundo de pesos abertos para que robôs aprendam tarefas físicas com o conhecimento tirado de treino em vídeo em larga escala. Apresentado em setembro, ele agora é público sob a licença **Apache 2.0**, que permite adaptar a tecnologia para uso comercial e de pesquisa.

O modelo tem **27** bilhões de parâmetros e junta previsão de vídeo com geração de ação do robô, de modo que a máquina antecipa como objetos e ambiente vão mudar enquanto trabalha. Em vez de depender sobretudo de dados coletados em robôs específicos, ele aprende com vídeo geral como os objetos se comportam e depois é adaptado a cada sistema.

## Os números do teste de referência

Segundo a Runway, o Praxis-1 chegou a **46,2** por cento de sucesso no RoboLab-120, da Nvidia, que mede manipulação em **120** tarefas simuladas de bancada e **1.200** tentativas. O FLUX 3 Action ficou com **42,9** por cento, o Cosmos 3 Nano com **36,8** e o π0.5 com **28**. Isso o põe à frente dos outros modelos abertos avaliados, mas vários modelos fechados e agentes de uso geral tiveram nota maior. No SimplerEnv, depois de ajuste fino para o robô RT-1 do Google, a empresa relata **80** por cento de sucesso, contra **52,4** da política original.

A Runway diz que o mesmo modelo se adapta a braços industriais, robôs de dois braços para armazém e humanoides, com parceiros como Noble Machines, Standard Bots e Ultra. Pesos, software de inferência e ferramentas de ajuste estão no GitHub e no Hugging Face, com suporte ao LeRobot. A própria empresa admite que o modelo ainda erra com objetos parecidos, instruções ambíguas e tarefas longas, com várias ações em sequência.

## O que isso muda aqui

*Chega* — como os pesos são públicos e a licença é comercial, qualquer integrador, universidade ou fabricante no Brasil pode baixar e testar já, sem pedir acesso nem pagar licença. O que não está na fonte é o custo de rodar um modelo desse tamanho e quanto do resultado de simulação se repete num braço de verdade na fábrica.

Para quem integra robótica, o recado é o caminho: treinar com vídeo promete reduzir a dependência de dados caros coletados em cada robô, mas os números são da própria empresa e de simulação. Vale tratar como material de laboratório e piloto, não como produto pronto para a linha, e acompanhar se os parceiros citados mostram resultado em operação.
