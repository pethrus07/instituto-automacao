---
secao: noticias
formato: curta
tema: industria
titulo: Google DeepMind ensina o humanoide Apollo a jogar a partir de um vídeo, e diz que a simulação cai de semanas para horas
titulo_curto: DeepMind ensina humanoide por vídeo
lead: Com o lançamento do Gemini 4 Argon, a DeepMind mostrou um modelo que aprende uma tarefa vendo um vídeo e passa o movimento ao humanoide Apollo, da Apptronik. O robô acertou sete lances seguidos; o modelo marcou 87% em raciocínio espacial.
autor: Redação do Instituto
data: 2026-10-25
imagem:
  arquivo:   2026-10-25-deepmind-apptronik-apollo.jpg
  credito:   Robotics & Automation News
  licenca:   fonte
  alt:       Humanoide Apollo, branco e preto, arremessa um saquinho em direção a uma prancha de cornhole no chão de um galpão com estantes ao fundo
veredito: sem_efeito
fonte:
  nome: Robotics & Automation News
  url: https://roboticsandautomationnews.com/2026/10/22/google-deepmind-uses-gemini-4-argon-to-teach-apptroniks-apollo-humanoid-new-skills-from-video/106227/
  idioma: en
  publicado: 2026-10-22
---

A **Google DeepMind** apresentou uma técnica nova de treinamento de robôs junto com o lançamento do **Gemini 4 Argon**, seu modelo de IA mais recente. A empresa diz que ele combina raciocínio visual e semântico, compreensão física e geração autônoma de código para aplicações em robótica.

Na demonstração interna, o Argon recebeu o vídeo bruto de uma pessoa jogando cornhole, aquele jogo de lançar saquinhos em uma prancha com furo. O modelo analisou o ambiente, mapeou as coordenadas no espaço e calculou os movimentos de todas as articulações necessários para repetir a tarefa. Em seguida, gerou sozinho o código de simulação, e o comportamento aprendido foi transferido ao humanoide **Apollo**, da Apptronik. Num teste real, segundo a DeepMind, o robô acertou **sete lances seguidos**.

## Do vídeo à simulação e ao robô

A empresa batizou o método de *"Video-to-Sim-to-Real"* e afirma que ele reduz a **algumas horas** um trabalho de simulação que exigiria **semanas** de modelagem manual. A ideia é que um modelo de uso geral diminua a engenharia manual necessária para ensinar uma habilidade física nova a um robô.

No benchmark de raciocínio incorporado da DeepMind, o ERQA, que mede a capacidade de raciocinar sobre problemas físicos e espaciais em ambientes 3D, o Argon marcou **87%**. O modelo também está sendo posicionado para engenharia, ciência, programação e negócios, e já chega aos produtos de IA do Google e à API do Gemini.

## O que isso muda aqui

*Sem efeito* — por enquanto. É uma demonstração interna, com uma tarefa de brincadeira, um único robô e números informados pela própria empresa: a matéria não traz taxa de acerto fora dos sete lances, custo, nem qualquer humanoide à venda no Brasil.

O que merece atenção de quem integra e programa robôs é o gargalo que a técnica ataca: montar a simulação à mão, que hoje toma semanas de trabalho especializado. Se a promessa se confirmar em tarefa industrial, o ganho está em gerar o ambiente de treino a partir de vídeo de operador, sem modelagem manual. Como o modelo já está disponível pela API, vale testar em braços comuns antes de esperar humanoide. A conferir: se alguém reproduz o resultado fora do laboratório do fabricante do modelo.
