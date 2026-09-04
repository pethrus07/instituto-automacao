---
titulo:    Mitsubishi Electric junta lógica, movimento e rede num só controlador, o MELSEC MX, ainda sem data para o Brasil
secao:     noticias
tema:      industria
formato:   contexto
veredito:  a_caminho
lead:      Apresentado em 31 de julho, o controlador multi-core chega a 256 eixos no modelo MX-R e cobre de oito a dezesseis no MX-F, sobre CC-Link IE TSN. A filial brasileira não confirmou quando aceita pedidos, e a linha iQ-R historicamente chegou ao país meses depois do lançamento global.
autor:     Pedro Oliveira
data:      2026-09-04
fonte:
  nome:      Automação Industrial
  url:       https://www.automacaoindustrial.info/mitsubishi-electric-lanca-controladores-melsec-mx/
  idioma:    pt
  publicado: 2026-08-06
arte:      2026-09-04-tres-em-um.svg
---

A Mitsubishi Electric apresentou em 31 de julho o MELSEC MX, um controlador que reúne num único hardware multi-core três funções que normalmente exigem módulos separados: controle sequencial, controle de movimento e controle de rede. Segundo a documentação técnica da fabricante, o desempenho em controle de movimento chega a ser dez vezes superior ao dos controladores anteriores da própria marca.

São dois modelos. O MX-R atende até 256 eixos e se integra à família MELSEC iQ-R, de sistemas maiores. O MX-F, compatível com a linha iQ-F, cobre de oito a dezesseis eixos, para máquinas que não precisam de alta densidade de eixos mas exigem sincronismo fino. A comunicação entre eixos usa CC-Link IE TSN, com sincronização de até 250 microssegundos no MX-F; um único cabo Ethernet conecta até trinta estações padrão e dezesseis de movimento, o que reduz cabeamento em relação às arquiteturas anteriores. A programação é no GX Works3, o mesmo software das famílias iQ-R e iQ-F.

A empresa não informou preço de lista nem data de chegada ao mercado brasileiro.

## O que muda para quem projeta a máquina

Integrar lógica, movimento e rede num controlador só reduz componentes no painel e simplifica o programa, porque sequência e movimento passam a compartilhar o mesmo ambiente. Quem ganha primeiro são máquinas de embalagem, manuseio de materiais e linhas de montagem com muitos eixos sincronizados, onde hoje é comum combinar um CLP e um controlador de movimento distintos.

A ressalva é a rede. Fábricas que já rodam CC-Link IE TSN, mais comum entre integradores que trabalham com equipamento japonês, se beneficiam direto. Plantas consolidadas em Profinet ou EtherNet/IP precisam contar o custo de uma rede paralela ou de gateways de conversão, e essa informação não consta no material da fabricante. Também não foi dito se o MX substitui gradualmente as famílias atuais ou entra como linha adicional, definição que pesa para quem planeja o ciclo de vida de um projeto em cinco a dez anos.

## A filial e o mapa

A Mitsubishi Electric do Brasil sinaliza reforço de portfólio para 2026, com foco em alimentos e bebidas, farmacêutico, automotivo, embalagens e logística, e uma estratégia de descentralização: mais canais e distribuidores fora do eixo Sul-Sudeste, conforme Centro-Oeste e Nordeste ganham peso com a agroindústria. É essa capilaridade, mais do que a especificação, que vai determinar a velocidade real de adoção.

## O que isso muda aqui

*A caminho*, no sentido literal: lançamento global em 31 de julho, sem data brasileira, e um histórico de meses de intervalo na linha iQ-R. É exatamente o tipo de intervalo que este site existe para medir; quando a filial anunciar a disponibilidade, a diferença entra no relógio. Enquanto isso, a decisão útil é a da rede: quem não roda CC-Link IE TSN deve fazer a conta da rede paralela antes de se encantar com os 256 eixos.
