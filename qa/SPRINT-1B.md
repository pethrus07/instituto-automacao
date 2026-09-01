# QA · Sprint 1b — o Giro da Semana, e as vozes

> 01/09/2026 · `npm run qa` · **199 asserções · 0 falhas · 1 aviso** · +94 do `npm test`
>
> A rotina semanal que dá um giro nos temas, nos sites e nas pessoas públicas — e vai
> atrás da notícia da semana.

---

## 1. O problema, dito com todas as letras

Qualquer modelo escreve um "resumo semanal". Isso não é diferencial: é o que todo agregador
com API já faz, e o leitor sente em duas linhas. Se o Giro fosse só isso, seria mais um.

O que separa o Giro de um resumo automático são **três coisas, e as três estão na página**:

1. **O destaque sai de uma fórmula publicada, com o placar à vista.** O leitor pode discordar
   da escolha vendo a conta.
2. **A prosa é auditada contra os números, e a edição não sai se inventar um.**
3. **Quando nenhum assunto alcança o piso, o Giro diz que não houve destaque — e diz por quê.**

---

## 2. A arquitetura: agregar → redigir → **auditar** → publicar (ou parar)

```
        SQL puro              IA, tool use            máquina           D1
  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   ┌──────────┐
  │  agregar.ts  │ ───▶ │  redigir.ts  │ ───▶ │  auditar.ts  │──▶│publicado │
  │ contagens    │      │ só vê o      │      │ nº da prosa  │   └──────────┘
  │ mediana      │      │ agregado     │      │ existe no    │        │ não
  │ placar       │      │ nunca o banco│      │ agregado?    │        ▼
  └──────────────┘      └──────────────┘      └──────────────┘   ┌──────────┐
                                                                 │ rascunho │
                                                                 │ + motivo │
                                                                 └──────────┘
```

**Quem redige nunca vê o banco. Quem audita nunca vê o modelo.** É assim que "a IA escreveu"
deixa de ser desculpa e vira etapa verificável.

A auditoria **aborta**: a edição fica em `rascunho` com o motivo gravado, e o motivo aparece
em `/blueprints`. Auditoria que reprova em silêncio é auditoria que ninguém confere.

### A fórmula do destaque

| Parcela | Pontos | Por quê |
|---|---|---|
| repercussão | 10 × fontes independentes | a semana só tem notícia se mais de um cobriu |
| alcance | soma do peso editorial das fontes | nem toda fonte pesa igual |
| **ineditismo** | **25** se nenhuma fonte brasileira mencionou | **é a pergunta-assinatura do Instituto** |
| veredito | não chega 15 · chega 10 · a caminho 5 · sem efeito 0 | consequência declarada vale mais |

**Piso: 2 fontes independentes.** Sem ele, o ineditismo (que é o critério mais pesado)
elegeria sempre o assunto mais obscuro — quem ninguém cobriu tem, por definição, zero menção
brasileira. Os pesos são decisão editorial, não otimização: quem ordena por repercussão está
fazendo agregador.

---

## 3. As vozes — um eixo novo, não um tipo novo

`fonte.tipo` sempre misturou meio e papel (`press`, `imprensa`, `forum`, `social`, `video`).
Acrescentar `pessoa` àquela lista continuaria misturando. **`fonte.pessoa` é ortogonal a
`tipo`**: um blog pessoal é meio *imprensa* **com** pessoa; a IEEE Spectrum é meio *imprensa*
**sem** pessoa.

A diferença é substantiva para o Giro: *"a IEEE Spectrum noticiou"* e *"Rodney Brooks
escreveu"* não pesam igual, e um giro que não sabe disso é um agregador.

**Sondadas de verdade** (`npm run sondar:vozes` busca o feed, passa pelo nosso parser e lê o
`robots.txt` antes): **11 de 12 responderam**, 10 entraram.

| Entraram | |
|---|---|
| Rodney Brooks · Chris Anderson | Indústria |
| Ethan Mollick · Gary Marcus · Benedict Evans · Andrej Karpathy · Sebastian Raschka | Observatório |
| Simon Willison · Tim Bray | Operação |
| **Rodrigo Ghedin** | Observatório — voz **brasileira**, marca o relógio |

**Descartadas, e o motivo importa:**

- **Paulo Silveira (Alura)** — o feed respondeu, mas é o blog **institucional da empresa**, não
  a escrita dele. Cadastrar como voz atribuiria a uma pessoa o que a redação escreveu. É
  exatamente o erro que o Instituto existe para não cometer.
- **Jeff Lean** — `robots.txt` inacessível.

Duas entram **dormentes** de propósito (Karpathy, ~200 dias sem post; Anderson, ~220). Custam
um fetch a cada 12 h e valem pelo dia em que voltarem.

---

## 4. Defeitos — e dois foram descobertos rodando de verdade

### 4.1 A auditoria tinha um buraco do tamanho de uma preposição ⚠️

A primeira versão ignorava "número colado a nome técnico" para não derrubar edição que citasse
`Indústria 4.0` ou `IEC 61131-3`. A regra olhava **a palavra anterior**:

```js
.replace(/\b[A-Za-zÀ-ÿ]{2,}[\s-]?\d+(?:[.,]\d+)*\b/g, ' ')
```

`em 12`, `de 40`, `a 7` — **qualquer número precedido de preposição sumia antes de ser
conferido.** Ou seja: apagava justamente o formato em que um número inventado aparece numa
frase em português. A auditoria passaria com louvor sem auditar nada.

A correção reconhece versão e norma **pelo formato do número** — ponto ou hífen entre
dígitos — e nunca pela palavra anterior. Sobra o inteiro solto, que é o que se quer medir. O
teste que prova o buraco ficou no arquivo, com o nome dizendo o que ele guarda.

### 4.2 Uma voz prolífica engoliu a seção inteira

Primeira execução real: **as 12 linhas de "o que as vozes disseram" eram do mesmo blog.** Simon
Willison publica várias vezes por dia; os outros nove, uma vez por semana.

Teto de **2 entradas por pessoa**. A seção existe para mostrar *quem* falou na semana, não
quanto cada um escreve.

### 4.3 O placar era ruído com aparência de ranking

Também na primeira execução: quatro das cinco linhas empatadas em 43 pontos, todas do mesmo
blog — porque assunto de uma fonte só pontua igual a qualquer outro assunto de uma fonte só.

Agora o placar mostra **só quem alcançou o piso**, e no lugar das linhas empatadas entrou um
número honesto: **"outros 49 assuntos apareceram em uma fonte só"**. Um número vale mais que
cinco linhas empatadas — e ele mede exatamente a fraqueza conhecida do agrupamento por título.

### 4.4 `janelaDe(domingo)` devolvia a semana seguinte

A função esperava receber uma segunda-feira e só somava 7 dias. Passar um domingo devolvia a
semana **errada**, sem exceção, sem aviso, sem nada em revisão — só um giro com os dados de
outra semana. Agora normaliza para a segunda da semana em que a data cai.

### 4.5 `evento.nome`, não `evento.titulo`

A tabela de eventos veio antes da de itens e usa outro nome para a mesma ideia. Resolvido com
alias na consulta: o schema já está em produção, e renomear coluna por estética é dívida
disfarçada de limpeza.

---

## 5. O par de strings que faria o Giro parar em silêncio

O cron do Giro (`0 11 * * 1`) mora em **dois lugares que não se leem**: `src/config.ts` e
`wrangler.toml`. Se alguém mudar o horário só no TOML, o disparo cai no ramo do coletor e o
**Giro simplesmente para de sair** — sem erro em log nenhum.

Virou asserção: o QA lê os dois arquivos e confere que a string é a mesma. Silêncio é o pior
modo de falhar, e este era o lugar exato onde ele moraria.

---

## 6. O que o QA passou a medir

| Asserção | Por quê |
|---|---|
| toda edição publicada tem auditoria registrada | edição no ar sem registro do que foi conferido é promessa sem lastro |
| nenhuma edição retida foi ao ar | o abort tem de abortar |
| os números da tela vêm do **agregado congelado** | se a página recalculasse, uma coleta nova mudaria uma edição publicada |
| o placar da tela tem as linhas do agregado | idem |
| nenhum assunto abaixo do piso entrou no placar | ver §2 |
| o destaque é o primeiro do placar | consistência entre a conta e o texto |
| a página publica a fórmula | destaque sem a conta à vista é palpite com cara de método |
| nenhuma voz aparece mais de duas vezes | §4.2 |
| toda voz declara o papel de quem assina | nome solto não diz ao leitor por que aquela pessoa importa |
| o cron é o mesmo no código e no TOML | §5 |
| a edição está no sitemap | — |

E **25 testes de unidade** novos: a semana ISO (virada de ano pela regra da quinta-feira, ida e
volta slug↔janela, domingo na semana certa) e a auditoria (número inventado, número depois de
preposição, norma técnica que **não** pode reprovar, núcleo faltando, núcleo repetido, núcleo
vazio ganhando movimento, URL, markdown, destaque afirmado sem destaque).

**O texto simulado passa pela mesma auditoria que o texto real.** Se a auditoria fosse frouxa
com a simulação, ela não estaria testada quando a chave do sócio chegar — que é exatamente
quando ela precisa funcionar.

---

## 7. O estado hoje, medido

Primeira edição gerada (`2026-s35`, 24–30/08), com a base real:

- 52 itens · 12 fontes · **39 assuntos que não chegaram ao Brasil**
- **1** assunto alcançou o piso · **49** ficaram com uma fonte só
- 7 entradas de 4 vozes distintas
- atraso mediano: **—** (nenhum apurado na semana)

Os dois números que mais dizem: **49 sozinhos** e **atraso mediano vazio**. O primeiro é a
medida do agrupamento fraco; o segundo é consequência de quase não haver fonte brasileira
publicando sobre o que sai lá fora. Nenhum dos dois é bug — os dois são o achado, e agora
saem impressos toda semana.

---

## 8. Em aberto

1. **O texto é simulado** até a chave da conta do sócio chegar (`IA_CONTA` + `ANTHROPIC_API_KEY`).
   A esteira inteira já roda, e a auditoria já está testada contra ela.
2. **Embeddings para agrupar assunto** — o "49 sozinhos" agora tem endereço público toda semana.
   Deixou de ser dívida técnica e virou número na cara do leitor.
3. **Mais vozes brasileiras.** Uma só (Ghedin), e nenhuma de automação industrial. É o buraco
   mais visível da lista.
4. **Newsletter do Giro** — a lista de e-mail já existe e não tem envio. O Giro é o conteúdo
   óbvio para ela.
