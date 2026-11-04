---
secao: noticias
formato: contexto
tema: industria
titulo: LiberAI lança o Liber-0, modelo de robô treinado com 2,2 milhões de horas de experiência humana para manipular objetos
titulo_curto: LiberAI lança o Liber-0 para robôs manipuladores
lead: A startup LiberAI apresentou o Liber-0, modelo que ensina robôs a manipular objetos a partir de vídeo humano e luvas com sensores. Em 60 tarefas sem treino específico, acertou 36%.
autor: Redação do Instituto
data: 2026-11-04
imagem:
  arquivo:   2026-11-04-liberai-liber-0.jpg
  credito:   LiberAI
  licenca:   fonte
  alt:       Grade de nove cenas de mesa com mãos de robô entre objetos como caixas, canetas e tesoura, com o texto sobre taxa de sucesso de 36% em 60 tarefas
veredito: sem_efeito
fonte:
  nome: Robotics & Automation News
  url: https://roboticsandautomationnews.com/2026/11/04/from-human-experience-to-robot-action-liberai-launches-liber-0-world-action-model/106378/
  idioma: en
  publicado: 2026-11-04
---

A **LiberAI**, startup de inteligência artificial física fundada em **dezembro de 2025**, lançou o **Liber-0**, um modelo de mundo e ação (em inglês, *World Action Model*) pré-treinado com mais de **2,2 milhões de horas** de experiência humana. A meta declarada da empresa é levar robôs de uso geral para dentro de casa, mas a técnica interessa a qualquer um que ensine robô a pegar, girar e encaixar coisas.

O problema de partida é conhecido: ensinar manipulação costuma exigir demonstrações feitas com o próprio robô, o que pede máquina, operador e repetição. Vídeo de gente fazendo tarefas existe em escala enorme. O Liber-0 tenta aproveitar isso, aprendendo a relação entre o que se vê, a ação que acontece e o que vem depois.

## Luvas que fecham a lacuna entre vídeo e movimento

Só o vídeo não diz como os dedos se moveram, com que força o objeto foi seguro ou como o punho girou. A LiberAI aponta três obstáculos: o ponto de vista diferente entre gravação humana e câmera do robô, a imprecisão dos movimentos da mão inferidos de vídeo comum e a diferença entre o corpo humano e o do robô.

Para ligar as pontas, a empresa usa luvas leves que registram a posição e a trajetória da mão, com uma câmera em primeira pessoa e duas câmeras nos punhos. Como a coleta não precisa de robô no local, ela escala melhor. O modelo também recebe a descrição do corpo que executa a ação, de altura e comprimento do braço a geometria da mão, humana ou robótica.

Os resultados vêm da própria empresa. Em oito tarefas, uma política treinada com **25%** das demonstrações de robô somadas às de luva fez **75,6** pontos de progresso, contra **72,8** da treinada com todas as demonstrações de robô. Quando o treino com robô cobria só pegar e colocar, a nota em outras manipulações era **2,2**; com luvas, subiu a **47,5** e, com dados mais amplos, a **54,6**, perto dos **56,3** da referência com teleoperação. A própria matéria lembra que os dados totais não caíram **75%**, pois muita demonstração humana foi acrescentada.

Nas **60** tarefas sem demonstração específica de robô, o Liber-0 teve sucesso de **36%**. Para atividades longas, o modelo trabalha com um agente de nível superior que divide o objetivo em metas intermediárias.

## O que isso muda aqui

*Sem efeito* — por ora, é pesquisa de uma startup com resultados medidos pela própria empresa, voltada ao robô doméstico, sem produto à venda, preço ou prazo no Brasil. Uma taxa de acerto de **36%** em tarefas inéditas está longe do que uma linha de produção aceita, e a matéria não traz medição de força de contato, que a LiberAI admite ser um ponto a desenvolver.

Para quem integra, ensina ou vende automação, o recado é de direção: o custo de programar manipulação com robô e operador pode cair se a demonstração humana com luva virar fonte de dados. Vale acompanhar quando surgirem testes com sensor de força e tarefas de encaixe e fixação, que são as de fábrica. Até lá, é leitura de mercado, não projeto.
