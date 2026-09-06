# A marca — versão prototipal

> Existe para o site ter uma identidade enquanto a definitiva não existe. Nasceu do vocabulário
> que o site já tinha (a varredura de radar das capas geradas), então não briga com nada que
> está no ar. Quando a marca verdadeira chegar, **trocam-se dois lugares** e o resto segue:
> `publico/marca/*.svg` (os arquivos) e `simbolo()` em `src/ui/marca.ts` (o desenho em página).

A prancha pública, com todos os arquivos, está em **/marca**.

## A ideia em uma linha

Um anel, um raio que varre e **um ponto aceso**: o setor lá fora, a leitura daqui, o que chega.
É o produto inteiro num desenho — acompanhamos o que o setor publica e marcamos o que importa
para quem opera no Brasil.

## Construção (64 × 64)

| Elemento | Medida | Cor |
|---|---|---|
| Anel | centro (32, 32), raio 27, traço 3,2 | azul |
| Raio | do centro à borda, a **−38°** (para cima e para a direita) | azul, traço 3,2, ponta redonda |
| Varredura | setor de 0° até o raio | azul a 14% de opacidade |
| Ponto | a **62% do raio**, raio 4,6 | **laranja** — a única coisa laranja |
| Centro | raio 2,6 | azul |

A geometria é a de `src/ui/marca.ts`; o script que gera os arquivos reproduz os mesmos números.
Se um mudar, o outro muda junto ou a marca do site e a do PDF divergem.

## O nome

Newsreader, a fonte de obra do site. **"Instituto"** em regular (400), **"Automação"** em negrito
(700), espaçamento −0,022 em (o mesmo do cabeçalho). Nos arquivos o texto está convertido em
caminhos: o SVG vive sozinho em e-mail, crachá, PDF e rede social sem depender de fonte instalada.

- **Horizontal** — a forma principal. O símbolo mede 0,86 do corpo do texto e centra na altura
  das capitulares (é a proporção do cabeçalho do site: 44 px de símbolo para 51 px de texto).
- **Vertical** — símbolo grande sobre o nome, para espaço quadrado: avatar, capa, crachá.
- **Símbolo sozinho** — abaixo de 140 px de largura, ou onde o nome já está escrito.

## Cores

As do site, com o mesmo trabalho.

| Papel | Claro | Escuro |
|---|---|---|
| Azul — a instituição (anel, raio, centro, nome) | `#0d47a1` (`--marca`) | `#6f9df3` |
| Laranja — o que importa (o ponto, e só ele) | `#c2410c` (`--acao`) | `#f97316` |
| Fundo escuro permitido | `#0a2540` (`--capa-fundo`) | `#071a2c` |

Nada de gradiente, nada de sombra: tem de sobreviver a 16 px no favicon e a 2 cm num crachá.

## Regras

1. **O ponto fica onde está** (−38°, 62% do raio). Mover o ponto é outra marca.
2. **Não gira.** O raio aponta para cima e para a direita — a direção de quem lê o que vem de fora.
3. **Duas cores, sempre as mesmas**, ou uma só no monocromático (`currentColor`).
4. **Fundo: papel ou o azul das capas.** Sobre foto ou fundo colorido, usa-se o ícone quadrado.
5. **Respiro de meio anel:** nada encosta a menos de metade da altura do símbolo.
6. **Mínimos:** símbolo 16 px; horizontal 140 px de largura.
7. **Nunca sem o ponto.** Sem ele é um relógio parado; com ele, um radar que achou algo.

## Arquivos (`publico/marca/`)

| Arquivo | Uso |
|---|---|
| `logo-horizontal.svg` · `-negativo` · `-mono` | cabeçalho de documento, assinatura, apresentação |
| `logo-vertical.svg` · `-negativo` · `-mono` | avatar, capa, crachá |
| `simbolo.svg` · `-negativo` · `-mono` | espaço pequeno, marca d'água |
| `icone-quadrado.svg` · `-escuro` | favicon, avatar de rede com fundo, app |

Todos com `<title>`, sem `<script>`, com `viewBox` e dimensões declaradas; o QA confere os onze.

## Como foi gerada, e como regenerar

`scripts/` não tem o gerador de propósito: ele depende de baixar a Newsreader e do `fontTools`
(Python), coisas que o projeto não precisa carregar. O script vive fora do repositório; a saída
está versionada. Para regenerar: mesma geometria de `marca.ts`, Newsreader 400 e 700 do Google
Fonts, `fontTools.pens.svgPathPen` para converter glifos em caminhos, avanço por `hmtx` e
espaçamento uniforme de −0,022 em. Não há kerning de pares — é o que separa "prototipal" de
"definitiva", junto com o fato de o nome ser uma fonte de catálogo e não um desenho.

## O que a definitiva deve resolver

- Um nome desenhado, ou ao menos com kerning ajustado par a par.
- Testar o símbolo em bordado e em gravação a laser (um traço, uma cor).
- Decidir se o ponto laranja sobrevive em impressão monocromática ou vira um vazado.
- Um favicon próprio em 16 px, não a redução do símbolo.
