# Sistema de design — notas de produção

> A documentação viva é a própria [specimen.html](specimen.html). Aqui fica só o que
> não cabe numa página de amostra: decisões de origem e o que falta fazer.

## Arquivos

| Arquivo | Papel |
|---|---|
| `tokens.css` | **a fonte da verdade**. Cor, tipo, espaço, superfície. Nenhum valor bruto vive fora daqui |
| `base.css` | reset curto + comportamento padrão dos elementos + os dois modos de leitura (`.obra` e `.fluxo`) |
| `components.css` | primitivas: kicker, relógio, selos, item, evento, termo, filtro, aviso |
| `specimen.html` | a amostra que documenta o sistema e serve de teste visual |

Em produção os três CSS são concatenados e servidos pelo próprio Worker num só arquivo
com hash no nome e `Cache-Control: immutable`.

## As três famílias

| Papel | Família | Por quê |
|---|---|---|
| **Obra** | Newsreader | serifada variável desenhada para leitura de notícia em tela; tem itálico de verdade |
| **Fluxo** | IBM Plex Sans | sem-serifa de origem técnica — combina com o assunto sem parecer startup genérica |
| **Dado** | IBM Plex Mono | número tabular e alinhamento previsível no relógio e nos carimbos |

Todas com licença aberta (SIL OFL), então podem ser self-hosted sem custo nem amarra.

**A regra que importa:** serifada é obra, sem-serifa é fluxo. A escolha tipográfica *é* a
regra editorial do projeto — impessoal no fluxo, assinado na obra. Não misturar por gosto.

### ⚠️ Pendência: self-hosting

O `specimen.html` puxa as fontes do Google Fonts **só para desenvolvimento**. Antes do
primeiro deploy:

1. Baixar os arquivos variáveis `.ttf` das três famílias
2. Fazer subset para latin + latin-ext (`pyftsubset`, do `fonttools`) e converter para
   `.woff2` — corta bem mais da metade do peso
3. Servir do próprio Worker (bundle ou R2) com `Cache-Control: immutable`
4. `@font-face` com `font-display: swap` e `size-adjust` calibrado contra a fallback, para
   a página não pular quando a fonte chega
5. `<link rel="preload">` só na de **fluxo** — é a que pinta o primeiro texto

Motivo de não deixar no Google: um terceiro no caminho crítico da página, latência extra e
um pedido a mais que o leitor não pediu.

## A cor — v2, 30/08/2026

A v1 tinha papel quente e dois acentos (âmbar e azul). Trocada por decisão do dono:
**base branca, cinzas neutros, tinta quase preta.** Os quatro núcleos ficaram **neutros** —
distinguem-se pelo nome, não pela cor. Sobrou **um acento**, e ele é o link.

A única cor com significado é a do **veredito**. Sendo quase a única da página, ela trabalha
muito mais: num site preto e branco, um selo colorido é impossível de ignorar.

Se um núcleo precisar de cor própria um dia, é uma linha em `.n-*` — e volta a ser decisão,
não default.

## Acessibilidade — o que já está garantido

- Contraste: todos os `*-ink`, o acento e os quatro vereditos passam de 4.5:1 sobre
  `--paper` nos dois modos — **medido pelo `npm run qa`**, não afirmado
- Os quatro vereditos se distinguem por **matiz**, não por saturação — funcionam para quem
  não separa verde de vermelho
- `:focus-visible` com anel de 2px em todo elemento interativo
- `prefers-reduced-motion` respeitado
- Alvo de clique cobre o card inteiro sem quebrar navegação por teclado
- Nenhuma informação depende só de cor: o selo sempre tem texto

## O que ainda não existe

- [ ] Cabeçalho, navegação entre núcleos e rodapé
- [ ] Paginação e estado vazio ("nenhum item ainda neste núcleo")
- [ ] Página de erro
- [ ] Template de OG image (gerada no Worker, guardada no R2)
- [ ] Estilo de impressão para o Panorama
- [ ] Formulário de newsletter
