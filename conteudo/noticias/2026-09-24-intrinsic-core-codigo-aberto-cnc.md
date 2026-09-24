---
secao: noticias
formato: contexto
tema: industria
titulo: A Intrinsic, do Google, abriu o núcleo da própria plataforma — e junto um projeto de referência para alimentar máquina CNC
titulo_curto: Intrinsic abre o núcleo da plataforma
lead: O Intrinsic Core saiu sob Apache 2.0, compatível com ROS, e o CTO diz que é a mesma pilha de que a empresa depende. Na mesma leva veio o Open Machine Tending Solution, desenho de referência aberto para carga e descarga de máquina-ferramenta.
autor: Pedro Oliveira
data: 2026-09-24
veredito: chega
fonte:
  nome: The Robot Report
  url: https://www.therobotreport.com/intrinsic-open-sources-key-parts-platform-easier-development/
  idioma: en
  publicado: 2026-09-22
---

A **Intrinsic**, grupo de robótica com IA que passou a integrar o Google neste ano, publicou o **Intrinsic Core**: um conjunto de capacidades compatíveis com ROS, sob licença **Apache 2.0**, disponível no GitHub. O anúncio saiu na ROSCon 2026, em Toronto.

O argumento da empresa é de tempo perdido: equipes de robótica gastam centenas de horas programando do zero capacidade e infraestrutura que já existem. O que a Intrinsic diz ter feito foi pegar o que desenvolveu em implantações reais de manufatura e transformar num ambiente de software pré-configurado que roda em hardware local — blocos de comportamento que se combinam.

Brian Gerkey, CTO da Intrinsic e cofundador da Open Robotics, tentou se antecipar à desconfiança de sempre com código aberto de empresa grande: *"Isto não é a gente passar por aqui, largar um código e dizer 'divirtam-se'. O que estamos compartilhando esta semana é o núcleo da nossa própria pilha de software, uma coisa da qual nós também dependemos."*

## O item que interessa a quem tem torno

Junto do Core, a empresa soltou o **Open Machine Tending Solution** — um desenho de referência aberto para *machine tending*, que é carregar e descarregar máquina-ferramenta com robô.

Não é a parte glamourosa do anúncio, e é a que tem endereço aqui. Alimentar CNC é a aplicação de robótica industrial mais comum em usinagem, a que mais aparece em orçamento de integrador brasileiro, e historicamente a que mais se refaz do zero a cada cliente — porque cada torno, cada garra e cada dispositivo é um pouco diferente.

## O que isso muda aqui

*Chega* — e por download, que é o único jeito de uma tecnologia chegar ao Brasil sem depender de representante, câmbio ou prazo de importação. Apache 2.0 no GitHub é tão acessível em Caxias do Sul quanto em Munique.

O que vale medir é o **tempo de integração**, não a licença. Se o desenho de referência de *machine tending* economizar algumas semanas de programação por célula, ele muda a conta de um projeto de automação de pequeno porte — que é exatamente onde a automação brasileira trava, porque o custo de engenharia não dilui em lote pequeno.

Duas ressalvas honestas. Primeira: desenho de referência não é produto; alguém ainda integra, valida e assume a segurança da célula. Segunda: a matéria não informa quais controladores e marcas de robô estão cobertos, e num galpão brasileiro o parque é misto por definição — é essa lista que decide se a economia é real ou se some na adaptação.
