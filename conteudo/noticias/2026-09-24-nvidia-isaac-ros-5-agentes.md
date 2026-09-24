---
secao: noticias
formato: curta
tema: industria
titulo: NVIDIA põe agentes de IA para fazer a parte chata do desenvolvimento em robótica
titulo_curto: NVIDIA põe agentes no Isaac ROS 5.0
lead: O Isaac ROS 5.0 traz fluxos com agentes que preparam ambiente, script e ajuste fino — e suporte ao ROS 2 Lyrical. A NVIDIA também doou ao ROS 2 uma interface padrão de manuseio de dados, aberta a toda a comunidade.
autor: Pedro Oliveira
data: 2026-09-24
veredito: chega
fonte:
  nome: The Robot Report
  url: https://www.therobotreport.com/isaac-ros-5-0-brings-ai-agents-robotics-development-says-nvidia/
  idioma: en
  publicado: 2026-09-22
---

A NVIDIA lançou o **Isaac ROS 5.0**, sua coleção de pacotes acelerados por GPU construídos sobre o ROS. O anúncio saiu na ROSCon, em Toronto, e o alvo declarado é o atrito do desenvolvimento, não o desempenho do robô.

Katie Washabaugh, gerente de marketing de produto para simulação em robótica, descreve o problema em termos que qualquer integrador reconhece: *"Há muito atrito no desenvolvimento de robótica. Há muito atrito em juntar o encanamento."* A resposta da empresa é pôr agentes para fazer a preparação — deixar o ambiente pronto, escrever os scripts de configuração, tocar o trabalho repetitivo como o ajuste fino.

A versão também passa a suportar **ROS 2 Lyrical** e Ubuntu 24.04, e vem com *Isaac Skills* para configuração e manipulação, além de documentação escrita para ser lida por agente.

## A parte que não é da NVIDIA

O item mais durável do anúncio é uma doação: a NVIDIA contribuiu ao ROS 2 Lyrical uma **interface padrão de manuseio de dados**, que faz software de robótica trabalhar de forma eficiente entre hardwares de computação diferentes, inclusive GPU. Ela fica disponível para a comunidade inteira do ROS — estimada pela empresa em cerca de 1,3 milhão de usuários —, com CUDA servindo de exemplo funcional.

Entre os usuários citados do Isaac ROS 5.0 estão Intrinsic, Mentee Robotics, EKUMEN e Flexiv. A Magna aparece combinando Isaac ROS com Isaac Sim para teste com hardware no laço.

## O que isso muda aqui

*Chega* — é software livre sobre ROS, e roda aqui no dia do lançamento.

A ressalva é de hardware, e é a de sempre: aceleração por GPU pressupõe GPU. Num projeto brasileiro típico, o custo do módulo de computação embarcado costuma ser decidido no fim, por preço, e é aí que a vantagem evapora — quem fecha célula com controlador industrial sem GPU não colhe nada disto.

Sobre os agentes, vale separar o que foi anunciado do que se costuma entender. O que a NVIDIA diz que eles fazem é preparação de ambiente e trabalho repetitivo, não projeto de célula nem lógica de segurança. Para quem programa robô no Brasil, o ganho realista é encurtar o começo de projeto — e o começo de projeto é justamente onde o integrador pequeno perde margem.
