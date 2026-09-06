---
titulo:    Oito dias de medição: a imprensa de tecnologia brasileira publicou 79 itens, e nenhum era sobre automação
titulo_curto: 79 itens em oito dias, nenhum sobre automação
secao:     relatorios
tema:      industria
formato:   analise
lead:      Entre 25 de agosto e 1º de setembro, os quatro veículos brasileiros que acompanhávamos publicaram 79 itens em seus feeds. Nenhum tratava de automação industrial ou de processos; 23 falavam de IA em geral e 19 eram oferta de produto. No mesmo período, 16 fontes estrangeiras publicaram 195. Este relatório explica o que medimos, o que o número não diz e o que mudamos por causa dele.
autor:     Pedro Oliveira
data:      2026-09-04
arte:      2026-09-04-medicao-imprensa.svg
---

Este site nasceu de uma hipótese: a notícia de automação chega ao Brasil com atraso, e o atraso dá para medir. A primeira versão do sistema foi construída para isso. Um coletor lia os feeds de veículos brasileiros e estrangeiros, agrupava os itens por assunto e, quando o mesmo assunto aparecia dos dois lados, anotava a diferença de dias. Chamávamos isso de relógio.

O relógio rodou por oito dias e não marcou nada. Este relatório é sobre o porquê.

## O que medimos

O coletor é um programa que lê feeds RSS de hora em hora. Não há IA em nenhuma etapa; o que ele guarda é o que o feed entrega: título, resumo, endereço e data de publicação. As fontes brasileiras eram quatro veículos de tecnologia com feed vivo, escolhidos na primeira versão do projeto: Tecnoblog, Canaltech, Olhar Digital e Manual do Usuário. Do lado de fora havia 16 fontes que publicaram na janela, entre imprensa técnica, salas de imprensa de fabricantes, blogs de especialistas e repositórios acadêmicos.

A janela analisada vai de 25 de agosto a 1º de setembro de 2026. Nela, as quatro fontes brasileiras publicaram 79 itens: 27 do Tecnoblog, 25 do Canaltech, 15 do Manual do Usuário e 12 do Olhar Digital. As 16 estrangeiras publicaram 195.

## O primeiro resultado: zero pares, e por que ele não vale sozinho

O agrupador de assuntos encontrou 491 assuntos distintos no total acumulado. Desses, 79 apareceram só em fonte brasileira, 412 só em fonte estrangeira, e zero apareceram nos dois lados.

Zero é um número forte demais para ser aceito sem desconfiança, e a desconfiança tem fundamento. O agrupador compara palavras do título. Um título em português e um em inglês sobre o mesmo fato não compartilham palavras, então o método é incapaz de formar um par entre idiomas mesmo quando o par existe. Parte do zero é artefato.

Por isso não paramos no número. Lemos os 79 títulos.

## O segundo resultado: os 79 títulos, lidos um a um

Dos 79 itens brasileiros, 23 mencionam IA no sentido amplo: ChatGPT fora do ar, Gemini lendo livros comprados, deepfake nas eleições, o Instagram contra influenciadores sintéticos, a Apple processando a OpenAI. Outros 19 são ofertas: celular com cupom, tablet em promoção, relógio com desconto, TV na Amazon. O restante é o cotidiano de um veículo de tecnologia de consumo: jogos, carros elétricos, astronomia, previsão do tempo.

Procuramos, por palavra, qualquer coisa que tocasse o nosso tema: robô, automação, indústria, fábrica, CLP, manufatura, máquina. Duas linhas responderam. Uma era sobre a fábrica de uma rival da BYD no Brasil que vai produzir carros para outras montadoras. A outra era sobre uma lava-e-seca da Xiaomi. Nenhuma sobre automação.

Isso não é crítica aos quatro veículos. É constatação de recorte: eles cobrem tecnologia de consumo, e cobrem bem. Automação industrial não é pauta deles, e nunca foi. O erro era nosso, por esperar que o relógio marcasse a partir de fontes que não olham para o relógio.

## O terceiro resultado: o que existe de especializado em português

Se a imprensa de consumo não cobre, quem cobre? Em 3 de setembro sondamos 18 candidatos a fonte brasileira especializada em automação, indústria e robótica. Três estavam vivos e publicando: o CIMM, portal de metal-mecânica; a ABINEE, associação da indústria eletroeletrônica; e o Automação Industrial, o único dos três cujo assunto é exatamente o nosso.

Os outros quinze contam uma história por si. Mecatrônica Atual, ISA Distrito 4 e Intralogística são domínios mortos. O feed da Manufatura em Foco está parado há 1.361 dias. O feed da ABIMAQ aponta para um domínio de homologação exposto na internet. O resto não tem feed, ou tem feed vazio.

Na primeira coleta das três fontes vivas, feita hoje, os feeds trouxeram 25 itens do CIMM (de 20 de agosto a 3 de setembro), 10 da ABINEE (de 20 de agosto a 2 de setembro) e 10 do Automação Industrial (de 6 a 28 de agosto). Isso dá, por semana, algo como doze itens de metal-mecânica, cinco de política industrial e três de automação propriamente dita. É a cobertura especializada brasileira que um feed alcança: cerca de vinte itens por semana, dos quais uma fração pequena fala de produto, tecnologia ou implantação.

## O outro lado da balança

Nos mesmos oito dias, as 16 fontes estrangeiras publicaram 195 itens. Desses, 23 vieram das cinco fontes especializadas que seguimos com mais atenção: The Robot Report, IEEE Spectrum (robótica), a sala de imprensa da Siemens, o blog do n8n e o Home Assistant. Três itens especializados por dia, em inglês, contra três por semana em português.

A proporção é o achado. Não é que o Brasil demore a publicar sobre automação; é que, em volume, quase não publica. Um relógio mede a distância entre dois eventos. Quando o segundo evento não acontece, o relógio não atrasa; ele não marca.

## O que isso significa

Para quem acompanha o setor daqui, a consequência prática é que a informação em português sobre o que sai lá fora não existe em quantidade, e o que existe está concentrado em três fontes de cadência baixa. Quem depende de ler em português está lendo o que o feed do CIMM e da ABINEE escolheram, e nada do que saiu no The Robot Report esta semana.

Para este site, a consequência foi uma mudança de desenho. A hipótese do atraso foi trocada pela constatação da ausência, e a função do site deixou de ser medir a diferença para ser cobrir a lacuna: ler o que sai lá fora, dizer em português o que é, e dizer o que muda aqui. O relógio continua ligado, mas agora sobre as três fontes especializadas, com uma expectativa honesta: de um a três pares medidos por mês, não dezenas por semana.

## Limites desta medição

São oito dias, quatro fontes brasileiras e a leitura de títulos, não de textos. Um veículo pode publicar fora do feed, e isso não entra. Título é um indicador do assunto, não o assunto. As fontes estrangeiras incluem repositórios acadêmicos e um fórum, que inflam o volume sem serem imprensa. E a amostra brasileira não tem veículos de economia e negócios, que cobrem indústria por outro ângulo; é a lacuna mais evidente desta medição, e a próxima a fechar.

Nada disso muda a conclusão central, porque ela não depende de precisão: entre 79 títulos, o número de itens sobre automação foi zero, e zero é robusto a erro de amostragem.

## O que vem depois

Repetiremos a medição em dezembro, com as fontes especializadas no lugar das de consumo, e publicaremos a comparação. Os 274 itens desta janela, com fonte, data, título e endereço, estão disponíveis em [um arquivo CSV](/dados/2026-09-04-itens-colhidos-25ago-01set.csv) para quem quiser conferir a contagem ou refazê-la com outro critério. Se a sua leitura dos títulos discordar da nossa, a página de [blueprints](/blueprints) explica como registrar uma correção.
