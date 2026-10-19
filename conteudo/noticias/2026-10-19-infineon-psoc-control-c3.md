---
secao: noticias
formato: curta
tema: industria
titulo: Infineon lança microcontrolador que comanda quatro motores sem escovas e já traz proteção contra computador quântico
titulo_curto: Infineon lança MCU para quatro motores
lead: A Infineon ampliou a família PSOC Control C3 com a série PSC3M/P6, que controla até quatro motores sem escovas num só chip e protege o firmware com criptografia pós-quântica. Já está à venda.
autor: Redação do Instituto
data: 2026-10-19
imagem:
  arquivo:   2026-10-19-infineon-psoc-control-c3.jpg
  credito:   Infineon
  licenca:   press
  alt:       Imagem de divulgação do microcontrolador da Infineon da série PSOC Control C3, usado em acionamentos de motores e fontes de energia
veredito: chega
fonte:
  nome: eeNews Europe
  url: https://www.eenewseurope.com/en/infineon-expands-psoc-control-c3-family-with-secure-mcus-for-motor-and-power-control/
  idioma: en
  publicado: 2026-10-19
---

A **Infineon** ampliou a família de microcontroladores PSOC Control C3 com a série **PSC3M/P6**, que junta, num único componente, o controle de vários motores, a conversão de energia e uma camada de segurança pensada para o futuro. O chip comanda até quatro motores de corrente contínua sem escovas, e a empresa o aponta para acionamentos industriais, robótica, sistemas de energia renovável e fontes de alimentação.

O núcleo é um Arm Cortex-M33 que trabalha a até **180 MHz**. Ele aceita controle de motor com e sem sensor e mira aplicações que pedem malhas de controle rápidas, como motores de rotação muito alta e correção de fator de potência. Também serve para conversores que usam semicondutores de banda larga. Amplificadores operacionais dentro do próprio chip ajudam no tratamento do sinal.

## Segurança que olha para o computador quântico

A parte menos comum é a proteção do firmware. A série segue a suíte de algoritmos CNSA 2.0, com **SHA-512** e assinaturas Leighton-Micali para validar a partida segura e as atualizações. Há ainda suporte ao nível 3 da certificação PSA e à arquitetura DICE.

A Infineon diz que isso ajuda o fabricante de equipamento a cumprir exigências como a Lei de Resiliência Cibernética europeia, a CRA. Há duas variantes, a PSC3M6 para motores e a PSC3P6 para conversão de energia, em encapsulamentos de até **100** pinos. As ferramentas ModusToolbox, com bibliotecas de controle e um assistente de IA para migrar projetos antigos, já estão disponíveis.

## O que isso muda aqui

*Chega* — a série está à venda agora, segundo a Infineon, e o projetista brasileiro de inversor, servoacionamento, robô ou fonte pode avaliar o componente sem esperar prazo. A reportagem não cita distribuidor nem preço no Brasil, então o primeiro passo é consultar o representante local.

O recado para quem fabrica ou integra equipamento aqui é duplo. Primeiro, reduzir a quantidade de componentes: um chip só para quatro motores simplifica placa e custo. Segundo, a segurança do firmware, que já pesa para quem exporta à Europa e tende a entrar nos editais de quem compra máquina. Quem projeta hoje com vida útil de uma década ou mais deve perguntar ao fornecedor como a atualização de firmware será assinada e verificada. O que ainda não se sabe é o desempenho real em campo, já que a matéria traz só os dados do fabricante.
