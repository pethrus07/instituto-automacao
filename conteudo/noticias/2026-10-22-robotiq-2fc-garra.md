---
secao: noticias
formato: contexto
tema: industria
titulo: Robotiq lança a garra 2FC com tato e inteligência embarcada, e abre pré-venda com entregas só em 2027
titulo_curto: Robotiq lança a garra 2FC com sensor de tato
lead: A Robotiq abriu a pré-venda da 2FC, garra adaptativa com sensores de tato e processamento no punho do robô. Os primeiros envios estão marcados para o primeiro trimestre de 2027, em duas versões de curso.
autor: Redação do Instituto
data: 2026-10-22
imagem:
  arquivo:   2026-10-22-robotiq-2fc-garra.jpg
  credito:   Robotiq
  licenca:   press
  alt:       Garra robótica preta de dois dedos com a marca Robotiq, cabo saindo por cima e sensores de tato nas pontas dos dedos
destaque: true
veredito: a_caminho
fonte:
  nome: Robotics & Automation News
  url: https://roboticsandautomationnews.com/2026/10/22/robotiq-launches-the-2fc-physical-ai-gripper/106191/
  idioma: en
  publicado: 2026-10-22
---

A **Robotiq** lançou a **2FC**, uma garra adaptativa pronta para produção que une sensores de tato e inteligência embarcada. A proposta é que o robô aprenda com o contato físico e aja com segurança sobre o que aprendeu, do laboratório à linha. A pré-venda abriu nesta quinta-feira, com envios a partir do **primeiro trimestre de 2027**.

O argumento da empresa é que a indústria investe pesado em visão, demonstrações, simulação e dados, mas a manipulação depende, no fim, do toque. A maioria dos robôs não sente o que segura, e dados de contato como pressão, escorregamento, força e posição ficam sem registro. Sensor de tato não é novidade; o difícil, diz a Robotiq, é transformar o sinal bruto em dado de treinamento e em comportamento em tempo real.

A 2FC parte da garra adaptativa 2F, uma das plataformas mais usadas do mercado, com mais de **30.000** unidades instaladas no mundo. Sobre ela entram sensores de tato, um módulo de processamento no punho, o AI Hub, e o Contact Core, software da empresa para inteligência física.

## O que a garra mede e decide sozinha

A garra registra pressão, vibração, propriocepção, força, posição e corrente, tudo sincronizado em milissegundos numa mesma linha do tempo, por uma interface única. Um pacote para ROS 2 e um kit de desenvolvimento em C++ vão ficar disponíveis no GitHub da Robotiq. Os dados saem datados e rotulados automaticamente, prontos para treinar modelos.

Com o processamento dentro da garra, a 2FC já roda localmente e em tempo real algumas habilidades de pega: avaliação da qualidade da pega, detecção de início de escorregamento, estimativa da posição do objeto, centragem do objeto e verificação avançada de pega. Em vez de só despejar sinal bruto, ela emite eventos já rotulados.

A garra é classificada para **2 milhões** de ciclos, tem complacência e é subatuada, o que permite pegas paralelas e envolventes. Há duas versões de curso: **85 mm** (2FC-85) e **140 mm** (2FC-140). Quem já tem uma 2F pode atualizar com os sensores TSF e o AI Hub, sem trocar a garra. A Robotiq apresenta o produto em um seminário online em **28 de outubro de 2026**.

## O que isso muda aqui

*A caminho* — a 2FC ainda não tem entrega: os primeiros envios estão previstos para o primeiro trimestre de 2027, e a fonte não cita preço nem distribuição no Brasil. Quem integra célula robotizada pode, por ora, reservar na pré-venda e acompanhar o seminário de 28 de outubro.

O ponto prático é a atualização: como a base instalada de garras 2F é grande, boa parte das células que já operam aqui poderia ganhar tato e detecção de escorregamento sem trocar o equipamento. Para quem faz pesquisa e desenvolvimento em manipulação, o pacote ROS 2 e os dados rotulados encurtam o caminho até treinar um modelo. O que ainda não se sabe: o preço, o custo da atualização e como a garra se sai em peças reais de linha, fora do material de lançamento.
