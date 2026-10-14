# Instituto Automação — Roadmap · v2

> **06/10/2026:** ideias do sócio para o site girar (convidados, vídeo vira artigo) registradas
> na seção 2j. Nada começou; esperam a resposta dele.
>
> **Estado em 27/09/2026:** site v2 pronto e **em homologação** (conta do Pedro, `noindex`).
> Produção espera o acesso à Cloudflare do sócio. Compromisso contratado: máquina rodando até
> **31/12/2026** (acordo interno).
>
> Este arquivo substitui o roadmap da v1. Em 03/09 morreram a IA em produção, os quatro
> núcleos, o teto de custo e a chave de API; o que sobreviveu está na seção 7. O `roadmap.html`
> ao lado continua descrevendo a v1 e não foi refeito.
>
> **11/09 fechou as cinco decisões que travavam o prazo de 20/09** (seção 2b) e descobriu dois
> defeitos que ninguém tinha medido: o **relógio nunca mediu nada** e o **dossiê lia o banco
> errado** (seção 2c).
>
> **23/09: o relógio mede.** O agrupamento foi reescrito e a base inteira, reprocessada — as
> duas primeiras medições da vida do projeto, mediana de 6 dias (seção 2d). E a medição expôs o
> gargalo verdadeiro, que não era o algoritmo: **só 2 de 101 itens brasileiros têm par
> estrangeiro**, porque a imprensa brasileira do setor escreve sobre o Brasil.
>
> **24/09: o Giro virou automático.** Deixou de ser texto escrito à mão e passou a ser
> **boletim gerado dos números medidos** — sem modelo de linguagem, por função pura sobre a
> apuração (seção 2e). O primeiro saiu, e a partir de agora sai sozinho toda segunda.
>
> **27/09: a aba Escrever e a pauta que pergunta** (seções 2g e 2h). O que a reunião de 24/09
> pediu do Instituto está feito: o plano editorial (95 pautas em séries de 3, 5 e 10, com trilhas de
> fundamentos, IA e educação), o padrão
> do artigo em blocos (com o quiz), o editor "como um Google Docs" com prévia e envio, e a
> pergunta semanal que a máquina faz ao Pedro. **Não feito:** as "100 notícias" de nascimento
> (são 27) e a produção (A2).
>
> ⚠️ Os **segredos da Cloudflare no GitHub** seguem faltando (conferido em 27/09): sem eles o
> Giro de segunda 28/09 e a pauta de sábado falham.

---

## 1 · Onde estamos

| Existe | Não existe ainda |
|---|---|
| 21 peças reais (20 notícias, 1 análise), 20 eventos conferidos, 33 termos, dataset CSV | **Produção** e domínio (A2) |
| Seções Notícias, **Artigos** (vazia, honesta), Relatórios, Giro, Agenda, Glossário, Blueprints | **Primeiro artigo** e as instruções para autores |
| **Autores** com página própria (1 autor), faixa "Quem escreve", convite "Escreva no Instituto" | **Primeiro Giro** (a s36 ficou sem edição) |
| Espaço de **parceiro** na capa + `/apoie` (lista vazia) | **Primeiro parceiro** |
| Cadastro com atuação e empresa (migração 006), tabela `contato` | **Primeiro artigo** para o slot fixo da capa (o slot já existe, vazio) |
| **`/privacidade`** e a finalidade declarada ao lado do formulário (11/09) | **Relógio medindo** — o agrupamento não forma par (seção 2c) |
| **Rótulo de publicidade no código** — `patrocinada: true` sai rotulada em toda superfície (11/09) | **Primeira venda** de artigo patrocinado |
| Marca prototipal e prancha em `/marca` | **Logo** definitiva |
| Tour narrado, **QA 1341 asserções**, revisão Playwright (0 axe, CLS 0, 0 link quebrado) | ~~Formulário de submissão de artigo~~ — **editor em /escrever, 27/09** |
| Coletor vivo no cron da homologação desde 06/09, série contínua | Redes sociais e comunidade |

---

## 2 · O que a reunião de 08/09 decidiu

Ata: `atas/atas-salvas/2026-09-08_0056_Reunião 08_09_2026 00_24.md` (89 min). Todos os
"Participante N" da transcrição são o sócio.

| Decisão ou pedido | Dono | Estado |
|---|---|---|
| **Artigos são o coração; notícia dá movimento.** Os dois concordaram | — | seção criada em 08/09 |
| Capa com **um artigo fixo** que notícia nova não empurra ("um artigo e duas notícias") | Pedro decide o formato; eu faço | a fazer |
| **Casar artigo com notícia** do mesmo assunto (artigo sobre CLP Siemens ao lado da notícia da Siemens) | editorial | vira regra nas instruções para autores |
| **Cadência:** Pedro publica aos domingos e aprova semanalmente; sócio quer ao menos a capa atualizada todo dia | Pedro | decidir |
| **Autores:** sócio recruta (especialista em CLP Siemens, profissional de TI, vendedor com método, ele mesmo) | sócio | em curso |
| sócio quer produzir **3 artigos para uma empresa** e perguntou "quanto fica" | os dois | precificar **e** rotular como conteúdo pago (seção 3) |
| **Submissão de artigo:** formulário no site com texto, imagens e arquivos; eu diagramo; o autor aprova. Sem editor de texto nem backoffice. Autor quer preview | eu | a construir |
| **Podcast mensal** com o convidado, entrevistando empreendedores da automação; cada episódio rende artigo e "aprendizado" | sócio | ideia |
| **Redes:** comunidade WhatsApp, X e TikTok (Pedro quer). sócio não toca rede social | dono em aberto | decidir |
| **Cadastro:** um só, com gatilhos por público; evitar a palavra "newsletter"; a lista é o ativo a monetizar em 6 meses | os dois | depende da LGPD (seção 3) |
| Números do relógio em **destaque azul**; explicar "atraso mediano" | eu | a fazer |
| Botão **"Enviar um evento" sair da capa**, ficar só na agenda | Pedro decide | decidir |
| **Notas internas de Blueprints** (cinzas) saem antes de publicar | eu | a fazer |
| Glossário: sócio não quer sair do texto para ler; a tradução já vai inline e o glossário é complemento | — | como está |
| **Logo:** o radar não diz "instituto" nem "educação"; sócio propõe bússola fundida com I e A; ele gera opções e manda | sócio → Pedro | em curso |
| sócio fechou um projeto e vai **separar um valor para manter a infra** | sócio | aguardar |
| "Somos o site mais rápido do Brasil" como propaganda | — | só com medição publicada e reproduzível |

O que o sócio disse do visual antes da sprint de 08/09 ("cru, poucos detalhes", "escuro ficou
melhor", "banner dá vida", "linhas organizam") foi respondido no mesmo dia: `qa/SPRINT-V2.md`
§14.

---

## 2b · O que o Pedro decidiu em 11/09

As cinco que travavam o prazo de 20/09, mais a do Giro. Todas implementadas no mesmo dia.

| Decisão | O que vale agora | Onde está |
|---|---|---|
| **Giro da s36** | **Pulada**, não atrasada. A série começa na s37, e o Giro nº 1 diz por quê: a coleta contínua começou em 06/09 | a escrever em 14/09 |
| **Relógio** | **Sai da capa** enquanto medir zero; segue rodando e os números ficam em `/blueprints`, com o motivo do zero escrito ao lado. A faixa volta quando houver par medido | `capa.tsx`, `blueprints.tsx` |
| **Artigo fixo na capa** | **Slot próprio**, em segundo lugar (era o quarto bloco, depois do cadastro). `fixo: true` no frontmatter escolhe qual; notícia nova não empurra | `conteudo/tipos.ts`, `capa.tsx` |
| **"Enviar um evento"** | **Sai** — não estava só na capa, estava na **navbar de toda página**, como único botão de ação do site. O convite agora vive no cabeçalho da agenda, onde o formulário está | `Documento.tsx`, `agenda.tsx` |
| **Notícia vs peça** | "Peça" vira **termo interno**: 27 ocorrências no texto visível viraram "notícia", "artigo" ou "texto". O tipo `Peca`, a pasta e o frontmatter **não** mudaram — renomear o código seria diff enorme sem ganho para o leitor | todas as páginas |
| **Cadência** | **Semanal**, publicando aos domingos, e a capa mexe sozinha entre um domingo e outro: a agenda avança por data (`COALESCE(fim, inicio) >= date('now')`) e o Giro entra toda segunda. Não há promessa de capa diária | decisão, sem código |

---

## 2c · Dois defeitos que ninguém tinha medido (11/09)

Os dois apareceram ao rodar o primeiro `npm run dossie` de verdade.

### O relógio nunca mediu nada — 0 de 684

Não é imprecisão, é conjunto vazio, e nos **dois** bancos:

| | assuntos | com atraso apurado | com menção BR |
|---|---|---|---|
| local | 552 | **0** | 124 |
| homologação | 684 | **0** | 61 |

**A causa:** `chaveAssunto()` (`src/coletor/url.ts`) monta a chave com o **título inteiro** —
tira as palavras vazias, ordena o resto e junta. Dois textos só caem no mesmo assunto se
tiverem o **conjunto idêntico** de palavras significativas, o que entre idiomas diferentes
praticamente não acontece: **2 assuntos de 684 têm mais de um item**. Como `atraso_br_dias` só
é calculado quando uma fonte brasileira cai num assunto que **já existe** com original
estrangeiro (`coletor/index.ts`), a fonte brasileira cria assunto próprio e o par jamais se
forma.

O site nunca mentiu sobre isso — a capa tinha desvio honesto e Blueprints declarava o
agrupamento fraco —, mas **em lugar nenhum estava escrito que a consequência era zero
medição**. Agora está, em `/blueprints`.

**O conserto**, quando for a vez: casar por **token raro compartilhado** (nome próprio, código
— "Siemens", "NVIDIA", "61131"), que sobrevive à tradução e é exatamente o caso que o relógio
quer pegar. Sem IA, cabe no cron. O risco a controlar é o falso positivo: duas notícias
diferentes da Siemens no mesmo assunto corrompem a medida para o outro lado, então vai com
limiar e amostra conferida à mão. **Embeddings continuam mortos** — seriam IA em produção.

### O dossiê lia o banco errado

`scripts/dossie.ts` tinha `instituto --local` cravado, mas o coletor contínuo roda no **cron da
borda**, que escreve no D1 da homologação. Em 11/09 o local estava parado desde 04/09: o
dossiê da s37 saiu com **0 itens** enquanto o homolog tinha **406**.

Era um defeito de manhã de segunda-feira. Um dossiê zerado não parece defeito, parece semana
fraca — e o Giro escrito em cima dele **passaria na auditoria**, porque ela confere a prosa
contra o dossiê, não o dossiê contra o mundo.

Três travas novas no script: o banco é escolhido (`--homolog`, `--producao`) e **impresso**; a
semana aberta exige `--parcial` e o arquivo sai marcado como parcial; e dossiê **sem item
nenhum aborta**. A procedência (banco e hora) agora fica escrita dentro do dossiê.

### Por que a s36 não era publicável

| dia | local | homologação |
|---|---|---|
| 31/08 | 74 | 10 |
| 01/09 | **163** | 8 |
| 02/09 | 13 | 21 |
| 03/09 | 5 | 16 |
| 04/09 | 3 | 25 |
| 05/09 | — | 10 |
| 06/09 | — | 41 |

Os 163 do dia 01/09 no local são artefato: a primeira colheita despeja no dia em que rodou.
Os 10 do dia 31/08 no homolog são o oposto: o coletor só começou lá em 06/09 e feed RSS só
carrega os últimos itens. **Nenhum dos dois mede a s36** — os dois medem quando o coletor
rodou. A s37 (07 a 13/09) é a primeira semana com série contínua: 59, 96, 136, 95 nos quatro
primeiros dias.

---

## 2d · 23/09 — o relógio mede, e o gargalo mudou de lugar

### O conserto

`chaveAssunto()` montava a chave com o título inteiro ordenado: só agrupava textos com o
**conjunto idêntico** de palavras significativas, o que entre idiomas não acontece nunca.
Substituída por agrupamento por **termo raro compartilhado** (`src/coletor/assunto.ts`):

- **raro é medido na base**, não numa lista — "robô" está em toda parte e não distingue nada;
  "Tractian" distingue muito. O teto é 0,5% do corpus, então se reajusta sozinho conforme a
  base cresce;
- **dois termos raros em comum**, e ao menos um deles **nome próprio ou código** — o que
  sobrevive à tradução;
- **sem IA**: contagem de palavra e interseção de conjunto, roda no cron, mesmo corpus dá
  sempre o mesmo agrupamento.

Duas armadilhas medidas e corrigidas no caminho, as duas em ensaio antes de gravar:

| Sintoma | Causa | Conserto |
|---|---|---|
| 37 threads de fórum num assunto só | `2026.9.1` virava os tokens `2026`, `9`, `1` | dígito puro só conta com 4+ casas e fora da faixa de ano |
| `industria`, `brasil`, `update` passando por raros | teto de 2% = 34 itens, frouxo demais; e daí vinha **encadeamento** (A casa com B, B com C, o grupo vira blob) | teto para 0,5% = 8 itens |

O blob chegou a fundir o lançamento da Universal Robots na IMTS com a briga de patentes
Teradyne × JAKA, e o relógio media **17 dias** onde o par verdadeiro dá **6**.

### O reprocessamento

`npm run reagrupar` refaz `assunto` a partir de `item` — os títulos, datas e fontes sempre
estiveram lá, só a derivação estava errada. Roda em ensaio por padrão; só grava com
`--aplicar`.

| | antes | depois |
|---|---|---|
| assuntos para 1.701 itens | 1.691 (≈1:1) | **1.581** |
| assuntos com mais de um item | 2 | **88** |
| **atrasos apurados** | **0** | **2** |
| atraso mediano | — | **6 dias** |

Os dois pares, e os dois conferidos à mão:

| | |
|---|---|
| **6 dias** | 🇺🇸 14/09 *Universal Robots launches its seventh generation robot platform at IMTS* → 🇧🇷 20/09 *Universal Robots lança sua plataforma de robôs de sétima geração na IMTS* |
| **2 dias** | 🇺🇸 11/08 *Rainer Brehm Appointed President of Automation at Siemens* → 🇧🇷 13/08 *Rainer Brehm assume nova unidade Automation da Siemens* |

### O gargalo verdadeiro: não é o algoritmo, são as fontes

Medido por fora do agrupamento, para não confundir o defeito com o mundo: dos **101 itens
brasileiros** da base, **2** têm par estrangeiro plausível numa janela de 30 dias. O
algoritmo encontra exatamente esses dois — nem mais, nem menos.

A razão está na pauta das fontes brasileiras: fábrica nova, financiamento do BNDES, programa
de associação, feira daqui. Elas escrevem **sobre o Brasil**, não sobre o que saiu lá fora.

Consequência para dezembro: no ritmo atual o Panorama nº 1 terá **uma dezena de pares**, não
uma distribuição. **Mais vozes brasileiras deixou de ser backlog e virou pré-requisito do
Panorama** — é o item que destrava a tese, e está na seção 5.

### A fonte dominante, domada

O Fórum Home Assistant era **297 dos 557 itens** da s38 (53%) num site de automação
industrial. Duas mudanças, as duas reversíveis:

- fórum e rede social **não ancoram o relógio**: thread de comunidade não é a fronteira
  publicando, e deixá-la marcar `publicado_original` faria o relógio medir o dia em que
  alguém comentou;
- o dossiê **conta imprensa e comunidade separado** — a s38 tem 260 itens de imprensa e 297
  de comunidade, e o Giro passa a falar dos 260.

Fica em aberto para o Pedro: o fórum continua na lista de fontes ou sai?

---

## 2e · 24/09 — o Giro automático, sem IA

O Pedro reverteu a própria decisão de que o Giro é escrito à mão. A automação foi feita, e
**sem reverter o §9**: não entrou IA em produção.

### Por que dava para automatizar sem modelo

O Giro sempre foi um **balanço de números** — quanto o setor publicou, o que repercutiu, quanto
tempo o assunto levou para chegar. Nada disso é opinião, e a contagem já existia feita pelo
coletor e pelo relógio. Então o boletim é montado por **função pura** sobre os dados medidos
(`src/giro/redigir.ts`): mesmos dados, mesmo texto, sempre. Sem modelo, sem rede, sem chave de
API, sem teto de custo — os três morreram em 03/09 e continuam mortos.

O teste que define a coisa: um leitor pode refazer o boletim na mão a partir do dataset
publicado e chegar no mesmo texto.

### O que isso obrigou o site a mudar

Um boletim gerado não pode se passar por texto de gente. Então:

- a peça sai com `gerado: true`, e o compilador **recusa** o campo fora do Giro, **recusa**
  autor declarado numa peça gerada, e **exige** `numeros:`;
- a página leva o aviso no alto: *"Boletim gerado dos dados — não há modelo de linguagem"*;
- a assinatura mostra a **origem** (com link para o método) no lugar de um nome;
- as promessas do site foram **estreitadas, não apagadas**:

| Onde | Antes | Agora |
|---|---|---|
| linha de data | "Nada aqui é gerado por máquina. Todo texto tem autor." | "Sem IA. Notícia, artigo e relatório têm autor." |
| rodapé | idem | "Notícia, artigo e relatório: escritos por gente, com nome. O Giro é boletim de números, gerado da apuração." |
| Blueprints | "Nenhum texto foi traduzido ou redigido por modelo" | o mesmo, mais um parágrafo declarando o Giro como a exceção e reafirmando que segue sem modelo de linguagem |

### A auditoria ganhou duas camadas

A trava de números já existia; o boletim gerado obrigou a afiná-la.

- **Estrita, na geração:** audita só o que o Instituto **afirma**. Títulos de terceiro e nomes
  de evento são removidos do texto antes de conferir — *"Apple releases iOS 27"* não é uma
  afirmação nossa sobre a semana, e deixar o 27 valer numa frase nossa afrouxaria a trava.
- **No compilador:** confere a prosa contra `numeros:`, que inclui os inteiros dos trechos
  reproduzidos. Pega edição à mão que invente número.

O auditor também passou a ignorar **data por extenso** ("27 de setembro", "14 a 20 de
setembro"), pela mesma razão que já ignorava anos: calendário não é medição. A lista de meses é
explícita — um `\p{L}+` no lugar dela apagaria "20 de fontes", e auditoria que apaga demais é a
que sempre passa.

### O que passou a rodar sozinho

| Fluxo | Quando | O que faz |
|---|---|---|
| `.github/workflows/giro-semanal.yml` | segunda, 09:00 BRT | gera → compila (a auditoria aborta) → testes → sobe o site e roda o QA inteiro → publica → commita. **Falha em qualquer passo = nada vai ao ar** |
| `.github/workflows/vigia.yml` | de hora em hora | pergunta ao `/saude`; falha (e manda e-mail) se a borda não responde ou se a coleta passou de 24 h. O risco nunca foi a máquina cair — é ela parar **calada** |

Falta um segredo no repositório para o fluxo semanal: `CLOUDFLARE_API_TOKEN` e
`CLOUDFLARE_ACCOUNT_ID`.

### O primeiro boletim

`conteudo/giro/2026-09-21-giro-2026s38.md`, sobre 14 a 20/09: 261 itens de 13 fontes, 6
assuntos repercutidos, 1 atraso apurado (mediana de 6 dias), 217 assuntos sem menção brasileira.

⚠️ **Fica uma decisão para o Pedro:** a lista de repercussão da s38 é *GM/CarPlay, Apple iOS,
Valve/Half-Life, Volvo XC60, OpenAI* e **uma** de automação industrial (Universal Robots). The
Verge e Ars Technica publicam tecnologia de consumo em volume, e é isso que domina o critério
de "repercutiu". Mesma família do Fórum Home Assistant: a lista de fontes decide o boletim.

---

## 2f · 24/09 (tarde) — 10% do corpus era o assunto do site

Ao gerar o Giro atrasado da s37, a lista de "o que repercutiu" saiu assim: *"Trump White House
tossed a grenade into international space relations"* e *"ChatGPT Sketch turns your bad drawings
into AI images"*. Nenhuma das duas é automação. Medi a composição do que o coletor traz, desde
07/09:

| | itens | |
|---|---|---|
| Fórum Home Assistant | 751 | 52% |
| Tecnologia geral (The Verge, Ars Technica, Willison, Marcus, Mollick) | 558 | 38% |
| **Automação** | **150** | **10%** |

**Um décimo do que o site colhe é sobre o assunto do site.** Isso explicava de uma vez a
repercussão fora do tema, o relógio que quase não mede (as fontes brasileiras industriais não
têm assunto em comum com o que a Verge publica) e o número de "assuntos que não chegaram ao
Brasil", que contava notícia de consumo que obviamente não chega à imprensa industrial daqui.

### A decisão, e o mecanismo

O Pedro escolheu **marcar como contexto, não tirar**. Migração 008: coluna `papel` em `fonte`
(`setor` | `contexto`), e as fontes de tecnologia geral viraram contexto. Três baldes:

- **setor** — é o que o Giro conta;
- **contexto** — colhido, vira pauta, fica **fora** dos números da semana e da repercussão;
- **comunidade** — fórum e rede social, como já era.

⚠️ **O relógio NÃO usa esse filtro, de propósito.** Se uma fonte de contexto publica sobre
robótica e uma fonte brasileira repercute, o atraso medido é verdadeiro. O filtro é sobre o que
o boletim **conta**, não sobre o que a base **mede**.

### O efeito, medido

| | antes | depois |
|---|---|---|
| s37 · itens da semana | 280 | **59** |
| s37 · repercutiu | Trump, ChatGPT | **nada** — e o boletim diz isso |
| s38 · itens da semana | 261 | **60** |
| s38 · repercutiu | Apple, Valve, Volvo, GM, OpenAI, Universal Robots | **só a Universal Robots na IMTS** — que é exatamente o par que o relógio mediu |

A s38 foi **regerada e republicada**: uma série de medição não pode ter duas réguas, e o
boletim tinha um dia de vida num ambiente `noindex`.

### Fica em aberto

Duas fontes de classificação duvidosa que não mexi: **IEEE Spectrum · IA** (engenharia, mas
publicou sobre refrigeração de data center) e **Home Assistant** (automação, mas residencial).
E **4 fontes bloqueadas pelo robots.txt** desde sempre — GitHub releases, Reddit · PLC e
YouTube — que são justamente on-topic. O Reddit · PLC é a perda mais sentida.

---

## 2g · A reunião de 24/09 e o que ficou feito em 27/09

Ata: `atas/atas-salvas/2026-09-24_1142_alinhamento 24_09.md` (53 min; a primeira metade é
IoT, que tem conversa própria). Os "Participante N" são o sócio. O que ele trouxe do Instituto,
o que o Pedro respondeu — e o estado, medido, em 27/09:

| O que foi dito | Quem | Estado em 27/09 |
|---|---|---|
| "Todo o fluxo não humano está **100% automatizado já**. Da coleta, a leitura, ele só faz a pergunta para mim — esse e esse está liberado de subir — e eu aprovo" | Pedro | **Era meia verdade.** A coleta, sim; a PERGUNTA não existia (a pauta era `npm run colher`, manual, no banco local). **Feito:** `npm run pauta` + `.github/workflows/pauta-semanal.yml` abrem toda sábado uma issue com os assuntos candidatos e os artigos recebidos; responder é marcar (seção 2h) |
| "O processo de aceitação estava pedindo muito mais informação do lado de cá do que precisava" · "qual é a notícia principal é decisão de cá; você tem de escolher da lista" | Pedro | **Feito:** a pergunta pede duas coisas — quais viram notícia e qual abre a capa (`principal: N`). Veredito, texto e imagem vêm prontos para ler antes de ir ao ar |
| "Hoje vai sair os resumos todos, o retroativo, e a partir da próxima semana já vai automático" | Pedro | **Os Giros retroativos saíram em 24/09** (s37 e s38). O automático **falha na segunda 28/09** se os segredos `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` não estiverem no GitHub — conferido em 27/09: **não estão** |
| "Pelo menos ele nasce com as **100 notícias**" | sócio, e o Pedro confirmou | **Não feito.** São 27. Notícia é texto assinado pelo Pedro, e a regra é que ele leia antes; as 7 de 24/09 ainda esperam essa leitura. A pauta semanal é o caminho para crescer sem furar a regra |
| **Guia de temas:** "um cronograma dos 300 que a gente quer até o fim do ano", desmembrado em **séries** (isolado, de 3, de 5, de 10) por área — predial do 1 ao 5, telecom do 1 ao 5, "a diferença do cabo cat6" na série de informática — com "um descritivo básico, 50% do caminho andado" | sócio | **Feito como proposta:** `src/pautas.ts` — 95 pautas, 15 séries (3, 5 e 10), 13 trilhas (com Fundamentos, IA e Educação, pedidos pelo Pedro no mesmo dia), cada uma com objetivo, esqueleto e blocos sugeridos. Público em `/escrever`. **O corte é do Pedro e do sócio** |
| **O padrão do artigo** — o HTML "Padrão Artigo Instituto" (configuração, fórmula, dica, código, tabela comparativa, atalhos, antes e depois, top 5 armadilhas, how-to) | sócio | **Feito:** os vinte recursos viraram o dialeto de blocos (ARQUITETURA §19.1), vestidos no sistema visual do site; guia público em `/escrever/blocos` |
| **Quiz** de 3 a 5 perguntas no fim, "podia até ser uma marca do site" | sócio | **Feito:** bloco `quiz`, zero script. Toda pauta o sugere, o editor já o traz montado, e o compilador lista artigo sem quiz a cada build |
| "Vai ter uma **abazinha chamada Escrever**… como se fosse um **Google Docs**, com todas as formas do teu padrão" — para convidado e para estranho | Pedro | **Feito, e simplificado no mesmo dia** ("deve ser rápido e fácil"): uma página, fotos por colar/arrastar, `/` para os blocos, esqueleto leve, uma confirmação só (ARQUITETURA §19.3) |
| O autor tem de poder escrever **em 20 a 30 minutos**, "mesmo que seja com três imagens: como configurar um inversor" | sócio | **Feito:** a pauta vira esqueleto no editor; imagem entra reduzida sozinha; há a pauta "Como configurar um inversor em 20 minutos, com fotos do painel" |
| "Tem que ter um **antes e depois** para ele de como vai ficar o artigo dele" | sócio | **Feito:** a prévia ao lado (desktop) ou na aba "Ver como fica" é o mesmo renderizador da página |
| "Não sei se vale melhorar o texto dele com **IA** na hora" | sócio | **Não.** Zero IA em produção continua valendo; o site promete em toda página que quem assina escreve |
| Artigo **isolado sem compromisso**: "ele passa um currículo e uma foto para a gente fazer uma página dele" | sócio | **Feito:** o editor pede nome, bio, link e foto; `npm run submissoes --abrir` cria a página de autor junto com o artigo |
| **Engajamento** de quem lê (quiz, "curso depois") e de quem escreve (currículo, página) | sócio | quiz e página de autor feitos; curso é ideia |
| "Vamos colocar o instituto no ar pra rodar — tiver dois, três colunistas, tudo bem, mas tá rodando" | sócio | **Produção continua travada no A2** (acesso à Cloudflare dele) |

⚠️ **Decisão revertida, e registrada:** em 08/09 ficou "formulário de submissão, sem editor de
texto nem backoffice". Em 24/09 o Pedro prometeu o editor. O que se manteve da decisão de 08/09:
**não há backoffice** — o envio cai numa caixa de entrada, e publicar continua sendo commit.

---

## 2h · Como fica o aceite, de ponta a ponta

```
sábado 09:00   a issue "Pauta da semana" chega por e-mail
               → o Pedro marca as notícias, comenta "principal: N", marca os artigos liberados
sessão         npm run pauta -- --aprovadas <nº>        o que foi marcado
               notícias: lidas na fonte (npm run ler), escritas, compiladas, lidas pelo Pedro
               artigos:  npm run submissoes -- --homolog --abrir IA-…   → o .md no git
               npm run compilar · npm run qa · commit · deploy
               npm run submissoes -- --homolog --estado IA-… publicada   e responder o autor
segunda 09:00  o Giro sai sozinho
```

O que continua sendo do Pedro, e só dele: **o que vira notícia, qual abre a capa, e ler antes de
ir ao ar**. O resto é máquina ou é quem escreve.

---

## 2i · 28/09 — a produção vai para a conta do Pedro, no domínio do sócio

> ✅ **NO AR desde 28/09/2026, 11:45** — https://institutoautomacao.com.br (e `www` → 301).
> QA na produção: 1327 ok · 1 falha (o teto de 300 ms, pensado para servidor local; pela
> internet 414 ms). Revisão visual: 66 páginas, 0 axe, CLS 0,0005, 0 link quebrado. A coleta
> rodou no domínio na primeira hora. A foto de destaque ganhou `fetchpriority="high"` (a capa no
> celular mediu 3,4 s na primeira visita, com o cache frio; depois 0,65 a 1,8 s).

**Atualização do mesmo dia:** o domínio foi adicionado na conta **oliveiramichaelpedro**
(`642a4a39…e0dd`), não na ryzecode08 da homologação — então a produção nasceu lá: D1
`instituto` em `enam` com a base inteira importada (2.043 itens, 1.880 assuntos, 33 fontes, 20
eventos, 2 atrasos apurados), Worker publicado com as rotas `institutoautomacao.com.br` e `www`,
cron a cada 15 min. O sócio trocou os nameservers às 11:16 (glen/lisa.ns.cloudflare.com); o
Registro.br gravou na hora, e a publicação na zona .br leva de minutos a horas. Um token não cobre
duas contas de pessoas diferentes: **os fluxos automáticos publicam só a produção**, e a
homologação (ryzecode08) vira cópia de teste parada. Na ryzecode08 ficou um D1 `instituto` vazio,
criado por engano em WEUR, para apagar.

**Decisão do Pedro:** a produção roda na Cloudflare dele; o domínio
**institutoautomacao.com.br** é do sócio. Isso substitui o antigo A2 ("acesso à Cloudflare do
sócio").

O que se sabe do domínio (conferido em 28/09 no RDAP do Registro.br e no DNS):

| | |
|---|---|
| registro | ativo desde 20/11/2025 · **vence em 20/11/2026** |
| DNS hoje | Hostinger (`ns1/ns2.dns-parking.com`), alterado em 24/09/2026 |
| o que aponta | raiz e `www` para o **Hotmart** (`connect.pages.hotmart.com`) — e o HTTPS não abre: a página não está no ar |
| e-mail | nenhum (sem MX) |

**Pronto no código (28/09):** ambiente `[env.producao]` com as rotas de domínio próprio (raiz e
`www`), `www` → raiz com 301, limite de 5 envios/min por IP nos cinco formulários
(`paginas/limite.ts`), aviso por e-mail de artigo recebido (`src/aviso.ts`, liga quando a zona
tiver Email Routing), cópia semanal do banco (`copia-do-banco.yml`), Giro/pauta/vigia apontando
para a produção, `submissoes` olhando a produção por padrão, `CLOUDFLARE_ACCOUNT_ID` no GitHub.

**A virada, em ordem:**

| # | Quem | O quê |
|---|---|---|
| 1 | Pedro | ✅ `npx wrangler login` (conta oliveiramichaelpedro) |
| 2 | Pedro | ✅ domínio na conta oliveiramichaelpedro · glen/lisa.ns.cloudflare.com |
| 3 | sócio | ✅ nameservers trocados às 11:16 · ⏳ confirmar a renovação automática e o Hotmart |
| 4 | eu | ✅ feito em 28/09 |
| 5 | eu | Email Routing: `contato@` → e-mail do Pedro; binding `AVISO` para o aviso de artigo |
| 6 | Pedro | criar o token de API **na conta oliveiramichaelpedro** e pôr `CLOUDFLARE_API_TOKEN` nos segredos do GitHub (o `CLOUDFLARE_ACCOUNT_ID` já está, apontando para ela) |
| 7 | Pedro | Search Console (propriedade de domínio, registro TXT) e enviar o sitemap |
| 8 | eu | ✅ `vigia.yml` no domínio · ⏳ desligar o cron da homologação (exige login na ryzecode08) |

## 2j · 05/10 — o sócio quer "ligar o foguete"

Reunião de 3h com o sócio (ata `2026-10-05_2303_alinhamento` no Atas). Ele quer "a cara do
site mudando todo dia" sem perder a credibilidade. Resumo enviado a ele em 06/10 (cartão 2).
**Nada começou:** as decisões abaixo voltam com a resposta dele.

**Combinado na conversa:**
- **Artigos de empresas convidadas.** Ele patrocina; o texto sai do site da empresa e ela revisa
  antes de publicar (ou assina).
- **Vídeos e playlists de terceiros viram artigo.** Os primeiros saem na parceria, como teste.
  **Quem fez o conteúdo original assina**, com crédito da fonte (evita viés e cara de conteúdo
  patrocinado). Crédito no rodapé não substitui a permissão de quem fez.
- A aba **Escrever** já monta artigo em poucos cliques: é o caminho para esses textos.
- **Para os vídeos:** identidade fixa (abertura, moldura e voz), como uma vinheta. Outra voz é
  possível; clonar a voz dele ainda não está pronto; avatar com rosto não é recomendado para
  conteúdo técnico.

**Em aberto (decidir com ele):**
- Quantos textos por semana o site precisa para girar.
- Um nome melhor que "artigo" para os textos curtos.
- Um **estudo aprofundado** Pedro + sócio sobre IA na construção de software (peça de autoridade).
- A frase do site que diz que notícia, artigo e relatório são escritos por gente: ele pediu mudança.
- O preço do artigo feito a partir de vídeo, fora do plano de conteúdo da Fábrica de Conteúdo.

---

## 2k · 11/10 — o site anda sozinho

O Pedro pediu "deixar se atualizando sozinho". O diagnóstico, medido em 11/10:

| O que | Estado |
|---|---|
| Coleta a cada 15 min (produção) | ✅ rodando — 725 itens nos últimos 7 dias |
| Vigia horário do `/saude` | ✅ rodando |
| **Giro de segunda** | ✗ falhou em 28/09 e 05/10 — **falta `CLOUDFLARE_API_TOKEN` no GitHub** |
| **Pauta de sábado** | ✗ falhou em 10/10 — mesma causa |
| **Cópia do banco de domingo** | ✗ falhou em 11/10 — mesma causa |
| Agenda | ✅ avança sozinha pela data — 14 eventos pela frente |

**Feito em 11/10:**
- **Giros da s39 e s40 publicados à mão** (gerados da produção). O da s39 foi barrado pela
  auditoria por um "5" que vinha do **endereço** de uma notícia nossa listada no boletim — o
  auditor deixou de ler número em destino de link (o texto do link continua auditado).
- **"Lá fora, hoje"** na capa, logo abaixo da principal: as manchetes do setor colhidas nas
  últimas 24 h (72 h se o dia foi fraco), fonte estrangeira, só setor, só imprensa, uma por
  assunto, com link para a fonte e o rótulo "colhido pela máquina e ainda não lido". E o
  **relógio vivo**: quantos assuntos do setor publicados lá fora nos últimos 7 dias ainda não
  tiveram menção no Brasil (em 11/10: 28 de 29). Muda sozinho, sem ninguém publicar — é dado
  listado, não texto redigido.
- **Cache de borda de verdade.** As páginas declaravam `s-maxage`, mas resposta de Worker não é
  guardada sozinha: toda visita ia ao D1 (enam). Agora a página pronta fica na borda pelo prazo
  declarado, com a chave levando a VERSAO do build (cada publicação começa limpa). Duas armadilhas
  pegas pelo QA: a borda trocava o nosso `max-age=0` pelo Browser Cache TTL da zona (4 h no
  navegador do leitor) — o cabeçalho declarado volta na resposta guardada; e o CSS geral passou
  do teto de 48 KB — a faixa reaproveita `Numero`, `secao__nota` e `u-fluxo`.

**Pergunta para o Pedro (divergência, não defeito):** o Giro conta "assuntos que não chegaram ao
Brasil" sobre **todas** as fontes (211 na s40), inclusive a tecnologia geral que a decisão de
24/09 tirou do balanço; a capa conta só o **setor** (29 nos últimos 7 dias). Alinhar o Giro ao
setor muda a série a partir da próxima semana — decidir.

**O que ainda impede o site de andar 100% sozinho:** só o token. Com ele, o Giro sai toda
segunda, a pauta pergunta todo sábado e o banco é copiado todo domingo, sem ninguém.

> ✅ **Resolvido no mesmo dia.** O Pedro criou o token (de conta, `flat-scene-f0c8`, na
> oliveiramichaelpedro); testado na API e no wrangler, gravado em `CLOUDFLARE_API_TOKEN` no GitHub
> e anotado no cofre (DÜ SOL). Os três fluxos rodaram de verdade: **pauta** (issue #1),
> **cópia do banco** (artefato de 1,5 MB, 90 dias) e **Giro** — gerou, compilou, montou o banco
> de teste, QA 1388 ok, publicou na produção pelo token e chegou ao commit. Para chegar lá, três
> defeitos do fluxo que o token escondia: a máquina do GitHub subia o site **sem banco**
> (`npm run db:zero`: schema + sementes + migrações 007/008, que o `schema.sql` não traz); e o
> `wrangler dev` **reinicia no Linux** quando outro processo mexe nos arquivos dele (o dry-run e
> as consultas diretas do QA) — o QA agora espera o reinício e repete o pedido que caiu por
> conexão. O registro do servidor local aparece no fluxo quando algo falha.

## 2l · 14/10 — a notícia sai sozinha (e o "sem IA" sai do site)

**Decisão do Pedro, 14/10:** *"as notícias devem ir sozinhas para lá, passando pelo seu crivo de
qualidade, inclusive a thumb e a notícia principal. É essencial que o Instituto ande sozinho.
Pode desconsiderar o papo de sem IA, tire isso do site e das regras."* Reverte a decisão de 03/09
(zero IA em produção) **para a notícia**. O Worker continua sem modelo nenhum: quem escreve é uma
rotina agendada do Claude Code, na nuvem, pela assinatura do Pedro, e o que ela produz entra
pelo mesmo caminho de sempre — arquivo no git, compilador, testes, QA, deploy.

| Peça | O que é |
|---|---|
| `/pauta.json` | a pauta do dia, pública — a mesma fórmula da pauta de sábado; a rotina não precisa de credencial |
| `npm run redacao` | `candidatas` · `fonte` (lê a matéria, confere robots, baixa a og:image em jpg ≥ 700 px) · `conferir` · `destaque` · `descartar` |
| a revisão (`conferir`) | número fora da fonte, 10 palavras copiadas, inglês fora de citação, tamanho, thumb, "O que isso muda aqui" ≥ 400 caracteres, fala de assistente — reprova. Teste próprio: `scripts/testar-redacao.ts` |
| `.github/workflows/publicar.yml` | todo push no main que mexe no site: compila, testa, QA inteiro, deploy |
| autora | **Redação do Instituto** — nome de pessoa só em texto que a pessoa leu (decisão do Pedro) |
| thumb | licença nova `fonte` (reprodução da og:image da matéria, crédito ao dono) |
| manual | `docs/REDACAO.md` — é o que a rotina lê |

**O que saiu do site:** a linha "Sem IA" do alto, o rodapé "escritos por gente", o "Não há
inteligência artificial em produção" de Blueprints (o "Como funciona" virou Colher · Escolher ·
Escrever e conferir · Publicar), o "nada foi redigido por máquina" do pé de cada texto, o "não é
modelo de linguagem" dos cinco Giros e do aviso do Giro, e das regras de Escrever e Apoie.

**Primeira edição (14/10):** Promise Robotics × D.R. Horton (manchete) e Siemens × Skeleton.
Descartada a da Timken (publieditorial). Na primeira passada a revisão tinha três furos — media
só o 1º parágrafo do "muda aqui", confundia "todo" com `TODO`, e conferia notícia antiga
modificada — os três viraram caso de teste.

**Falta para rodar sem ninguém:** conectar o GitHub à conta do Claude
(https://claude.ai/connect-github) para a rotina na nuvem clonar e dar push. Até lá, a edição é
feita numa sessão local pelo mesmo manual.

---

## 3 · O juridiquês, por escrito

Na reunião, o Pedro afirmou travas legais que **não existem** e prometeu levar a conferência
por escrito. Está aqui. Não é parecer de advogado; os fatos abaixo são pacíficos.

| Afirmação | O que vale | Base |
|---|---|---|
| "Só jornalista pode assinar notícia" | **Não.** O STF derrubou o diploma obrigatório em 2009. Qualquer pessoa escreve e assina notícia; a assinatura atribui responsabilidade, não exige credencial | STF, RE 511.961 (17/06/2009); DL 972/1969, art. 4º, V, não recepcionado; ADPF 130 |
| "Por isso chamamos de peça" | Pode chamar de notícia. "Peça" fica por escolha editorial, não por obrigação | idem |
| "Só formado escreve artigo; meu primeiro será o TCC" | **Não há lei.** Artigo é gênero de texto; só periódico científico impõe titulação, e cada um decide a sua. A seção Artigos pode ter esse nome | nenhuma norma restringe o gênero |
| "Reescrever notícia de outro precisa de liberação" | Fatos e informações **não têm** direito autoral; a forma do texto tem. Texto próprio sobre o fato, com crédito e link, é lícito sem pedir. É o método do site | Lei 9.610/1998, art. 8º, I e VII; art. 46, III |
| "Traduzir pode" | **Tradução integral é obra derivada** e exige autorização. Reescrita e resumo próprios, não. O site reescreve; deve continuar assim | Lei 9.610, art. 29, IV |
| "O robots.txt é a permissão que o site dá" | **Não é.** É convenção técnica para robôs de coleta, sem efeito sobre direito autoral. Respeitar evita briga por termos de uso; não licencia nada | RFC 9309 |
| "Plágio é copiar sem citar" (sócio) | Quase. Citar não autoriza reproduzir o texto inteiro; trecho curto com fonte, sim | Lei 9.610, art. 24; art. 46, III e VIII |
| Cláusula da imprensa | A lei permite a periódico reproduzir notícia de outro periódico com menção de autor e publicação; para site é disputada. O caminho seguro segue sendo texto próprio | Lei 9.610, art. 46, I, a |
| Imagens | Foto de veículo é obra protegida mesmo com crédito; material de imprensa vem com licença de republicação. Regra do site desde 04/09 | Lei 9.610, art. 7º, VII |
| Artigos pagos; "notícia boa" para a IP virar parceira | Conteúdo pago ou de interesse comercial **tem de ser identificado como publicidade**. Notícia favorável para conquistar cliente, sem rótulo, é publicidade velada e contradiz a regra publicada em `/apoie` | CDC, art. 36; CONAR, art. 28 |
| "Banco de 2 mil pessoas" para anunciante | **LGPD:** a finalidade se declara na coleta. Mandar oferta de terceiro só se constar; repassar ou vender a base, não | Lei 13.709/2018, arts. 6º, 7º, 9º, 18 |
| "Site mais rápido do Brasil" | Só com medição publicada e reproduzível; sem prova é publicidade enganosa | CDC, art. 37 |
| Nome "Instituto Automação" | A palavra é livre. Conferir a marca no **INPI** antes de fechar a logo; ao formalizar, associação sem fins lucrativos | Lei 9.279/1996; CC, art. 53 |
| Responsabilidade | Quem assina responde civil e penalmente por calúnia, difamação e injúria; publicação periódica está sujeita a direito de resposta. O registro de correções ajuda | CC, arts. 186 e 927; CP, arts. 138–140; Lei 13.188/2015 |

**Resumo:** nenhuma trava citada existe. As obrigações reais são três: **identificar
publicidade**, **declarar a finalidade do cadastro**, e **não reproduzir texto nem imagem
alheia inteira**. As três já estão ou cabem no método atual.

---

## 4 · Marcos

| Quando | Marco | Depende de |
|---|---|---|
| ~~**14/09**~~ · ~~**21/09**~~ | **Feito em 24/09, e automatizado.** O Giro da s38 saiu gerado dos dados; a partir da s39 sai sozinho toda segunda às 09:00 (`.github/workflows/giro-semanal.yml`) | — |
| **28/09** (segunda) | **Primeira execução automática** do fluxo semanal. Exige os segredos `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no repositório | Pedro (5 min) |
| **até 30/09** | **Mais fontes brasileiras** — virou pré-requisito do Panorama, não backlog (seção 2d) | Pedro, com o sócio |
| ~~até **20/09**~~ | **FEITO em 11/09**, nove dias antes: privacidade + finalidade no cadastro · notas internas fora de Blueprints · "Como funciona" alongado · artigo fixo na capa · botão de evento fora · relógio fora da capa · vocabulário · rótulo de publicidade | — |
| **setembro** | **Logo:** opções do sócio → escolha do Pedro → prancha e ícones refeitos (`/marca`, favicon, OG) | sócio, depois eu |
| ~~**setembro**~~ | **FEITO 27/09:** instruções para autores = `/escrever` (o que se pede) + `/escrever/blocos` (o padrão, bloco a bloco) + a pauta com esqueleto | — |
| **set–out** | **Primeiro artigo** — de um autor do sócio ou do Pedro | sócio, Pedro |
| ~~**outubro**~~ | **FEITO 27/09:** editor com envio → `npm run submissoes --abrir` → o `.md` no git (seção 2g) | — |
| **outubro** | **Produção na conta do sócio:** acesso + domínio (A2), `wrangler deploy` sem `--env`, `db:remoto` + sementes + `db:migrar:remoto`, tirar o `noindex`, Search Console, sitemap | **sócio** (A2) |
| **outubro** | **Primeiro parceiro**, por commit em `src/parceiros.ts`, rotulado | sócio |
| **novembro** | Definir quem toca redes e comunidade; começar por uma | Pedro |
| **1ª quinzena de dez** | **Panorama nº 1** com ~3 meses de base + **dataset no Zenodo com DOI** (CC-BY) | coleta contínua desde set |
| **31/12/2026** | **Renegociação** com o sócio, chegando com base, Panorama e artigos publicados | acordo interno |

---

## 5 · Backlog por dono

### Pedro — decisões

Seis fechadas em 11/09 (seção 2b). O que sobrou:

- [x] ~~Voltar a chamar notícia de **notícia**~~ — feito; "peça" é termo interno do código.
- [x] ~~**Relógio:** manter ou tirar~~ — **sai da capa** enquanto medir zero.
- [x] ~~Artigo fixo na capa: slot próprio ou destaque alternado~~ — **slot próprio**, 2º bloco.
- [x] ~~Botão "Enviar um evento" fora da capa?~~ — **fora**, e da navbar inteira.
- [x] ~~Cadência: semanal, ou capa diária?~~ — **semanal**, capa mexendo sozinha.
- [x] ~~A s36 sai atrasada ou fica pulada?~~ — **pulada**.
- [ ] **Cortar e completar o plano editorial** (`src/pautas.ts`, 95 pautas) — com o sócio: o que
      sai, o que falta, quem pega qual série. Pauta reservada = `reservada: Nome` na entrada.
- [ ] **Pôr os segredos da Cloudflare no GitHub** — agora trava DOIS fluxos (Giro e pauta).
- [ ] As "100 notícias" de nascimento: decidir se é meta (e então a pauta semanal é o caminho) ou
      se 27 bastam para abrir a produção.
- [ ] `link:` do currículo e texto da bio em `conteudo/autores/pedro-oliveira.md`.
- [ ] Qual notícia leva `destaque: true` (hoje NVIDIA × Hugging Face).
- [ ] Fonte brasileira dentro de Notícias, com a tagline dizendo "lá fora".
- [ ] Quem toca redes e comunidade.
- [ ] **Preço** dos 3 artigos que o sócio quer vender. O rótulo já não é decisão: é o código.
- [ ] **O relógio volta para a capa?** A decisão de 11/09 foi "volta quando houver par medido", e
      agora há 2. Recomendo **esperar**: mediana de n=2 na página inicial é promessa de novo, e a
      faixa volta mais forte com uma dezena de pares.
- [ ] **Peça paga pode ser `destaque: true`?** O compilador hoje permite — ou seja, dá para
      vender a capa. Não travei sozinho porque pode ser decisão comercial legítima; se não
      for, é uma linha no compilador.
- [x] ~~**A lista de fontes decide o boletim**~~ — resolvido em 24/09 com a coluna `papel`
      (seção 2f): tecnologia geral virou **contexto**, fora dos números da semana.
- [ ] **Duas classificações duvidosas:** IEEE Spectrum · IA é setor ou contexto? E o Home
      Assistant (press), que é automação mas residencial?
- [ ] **Imagem de imprensa para 5 notícias de 24/09** — Intrinsic, Qualcomm, BNDES, Neodent e
      HT Micron. Os newsrooms de Qualcomm e Intrinsic são renderizados por JavaScript e não
      expõem o link no HTML; exigem navegador (o Playwright do projeto serve) ou o contato de
      imprensa. O compilador lista as pendentes a cada build.
- [ ] **4 fontes on-topic bloqueadas pelo robots.txt** desde sempre (GitHub releases, Reddit ·
      PLC, YouTube). O Reddit · PLC é a perda mais sentida — vale procurar outro caminho.

### Eu — código

- [x] ~~Página de privacidade; finalidade escrita ao lado do cadastro.~~ **11/09** — `/privacidade`
      com as 4 coletas, base legal, prazo, direitos do art. 18 e a Cloudflare como operadora;
      a finalidade sai de `FINALIDADES` em `config.ts`, um texto só para a página e o formulário.
- [x] ~~Tirar as notas internas de Blueprints; alongar o "Como funciona".~~ **11/09** — saíram as
      três que falavam com a gente; "Como funciona" virou quatro tempos numerados, cada um
      dizendo também o que **não** acontece nele.
- [x] ~~Regra de publicidade no código.~~ **11/09** — `patrocinada: true` + `patrocinador:`;
      o compilador recusa flag sem anunciante, anunciante sem flag, e peça paga em **notícia ou
      Giro**. Rótulo na peça, capa, listagem, RSS (inclusive no título) e JSON-LD (`sponsor`).
- [x] ~~Artigo fixo na capa.~~ **11/09** — `fixo: true`, slot próprio em 2º lugar.
- [x] ~~Relógio: números em destaque, explicar "atraso mediano".~~ Superado: o relógio saiu da
      capa (seção 2b) e Blueprints passou a explicar **por que ele mede zero**.
- [x] ~~**Consertar o agrupamento do relógio**~~ — **23/09**: agrupamento por termo raro, base
      reprocessada, 2 atrasos apurados, mediana de 6 dias (seção 2d). Testes com o par real do
      corpus em `scripts/testar-assunto.ts`; se aquele teste cair, o relógio voltou a zero.
- [ ] **Mais fontes brasileiras que marcam o relógio** — hoje 3, e elas escrevem sobre o Brasil.
      É o que separa um Panorama com distribuição de um Panorama com uma dezena de pares.
      **Deixou de ser backlog: é pré-requisito de dezembro.**
- [x] ~~**Automatizar o Giro**~~ — **24/09**: boletim gerado dos números, sem modelo de linguagem,
      com aviso na página, auditoria em duas camadas e fluxo semanal no GitHub Actions que aborta
      antes de publicar errado. O vigia horário do `/saude` entrou junto.
- [x] ~~Formulário de submissão de artigo~~ — **27/09**: editor em `/escrever/editor`, tabela `submissao` (009), `npm run submissoes`.
- [x] ~~A pergunta semanal ao editor~~ — **27/09**: `npm run pauta` + `pauta-semanal.yml` (issue todo sábado).
- [ ] Migração 009 na produção quando ela existir (`npm run db:migrar:remoto`).
- [ ] Reescrever ou arquivar os docs da v1 (`CONCEITO`, `ARQUITETURA`, `FLUXOS`, `MODELO-DADOS`, `CAPACIDADE`, `ORGANOGRAMA`, `roadmap.html`).
- [ ] Lint e formatação.
- [ ] PageSpeed Insights quando a cota liberar; cartão OG no WhatsApp e LinkedIn a partir da homologação.
- [ ] Diarizador do gravador de atas: limiar baixo fatiou um falante em 78; ajustar antes da próxima reunião.

### sócio

- [ ] **A2:** acesso à Cloudflare + domínio e DNS.
- [ ] **A3:** os pontos do acordo interno por escrito (sem o custo de API, que deixou de existir).
- [ ] Opções de **logo** (bússola + I/A) para o Pedro escolher.
- [ ] Autores: trazer o primeiro texto, com nome e sobrenome.
- [ ] Primeiro parceiro, com contrato e rótulo.
- [ ] Podcast com o convidado, se for adiante: quem, quando, e o que vira artigo.
- [ ] O valor de infra que ele disse que vai separar.

### Os dois — conversa

- [x] ~~**Publicidade identificada**~~ — **decidido pelo código em 11/09**, antes da primeira venda,
      que era o ponto. Artigo e relatório podem ser pagos e saem rotulados; **notícia e Giro não
      são patrocináveis** (a notícia carrega o veredito, o Giro carrega a medição). A "notícia
      boa" para o cliente virar parceiro não compila. Falta combinar o **preço**, não a regra.
- [ ] **Política editorial em uma página:** artigo não é opinião (método replicável, dados), parceiro não escreve nem escolhe pauta, toda peça tem autor, correções registradas.
- [ ] O papel do sócio mudou com a v2 (infra + comercial + autores); a Leitura semanal dele não existe mais.

---

## 6 · Depois

| Fase | Foco | Métrica | Quando |
|---|---|---|---|
| 1 | autoridade → leads | conversas qualificadas e autores publicando | até dez/2026 |
| 2 | ativo de mídia | cadastros com finalidade declarada; primeiro parceiro pagando | 2027, 1º semestre |
| 3 | comunidade | gente na sala: podcast, WhatsApp, evento | 2027 |

**Marcos que não escorregam:** uma peça original com dado próprio por trimestre; Panorama nº 1
em dezembro; dataset com DOI junto dele.

---

## 7 · O que continua valendo da v1

| Decisão | Data |
|---|---|
| Fonte internacional, público brasileiro; **só português, para sempre** | 30/08 |
| **Pergunta-assinatura:** o atraso entre a fronteira e o chão de fábrica daqui | 30/08 |
| Tema azul + laranja; **página branca, estrutura por fio e ar** | 30/08 · 03/09 |
| **Nunca republicar imagem de terceiro** sem licença; a licença governa, não o formato | 30/08 · 04/09 |
| **O `robots.txt` manda, e não há contorno** | 01/09 |
| Sitemap de notícias como caminho legítimo para quem fecha o RSS | 01/09 |
| Voz é um eixo da fonte, não um tipo | 01/09 |
| Giro semanal com destaque por fórmula publicada; **a auditoria de números aborta** | 01/09 |
| Repositório privado agora, público depois | 30/08 |
| ~~Zero IA em produção~~ (revertido para a notícia em 14/10, §2l); toda peça tem autor; o git é o CMS | 03/09 · 14/10 |
| **Escuro não segue o sistema**; só no botão | 05/09 |
| Evento só com data conferida no site oficial | 04/09 |
| **Peça paga sai rotulada em toda superfície; notícia e Giro não se vendem** | 11/09 |
| **A finalidade do cadastro se declara na coleta, não só na política** | 11/09 |
| **Capa não promete medição que não existe** — o relógio volta quando medir | 11/09 |
| **Publicação semanal aos domingos; a capa se move sozinha entre elas** | 11/09 |
| "Peça" é termo do código; o leitor lê notícia, artigo, texto | 11/09 |
| **Agrupamento por termo raro, medido na base — e sem IA** | 23/09 |
| **O Giro é boletim gerado dos dados — e diz que é. Notícia, artigo e relatório, por gente** | 24/09 |
| **Automatizar não exigiu IA: o que é contagem se gera por função pura** | 24/09 |
| **Fluxo automático que falha não publica: erro em qualquer passo aborta tudo** | 24/09 |
| **O balanço da semana é do SETOR; contexto e comunidade contam à parte** | 24/09 |
| **A notícia principal NUNCA é uma sem imagem real** — e a regra não afrouxa a da licença | 24/09 |
| **Imagem real sempre que houver licenciável**; o compilador lista as que faltam a cada build | 24/09 |
| **O filtro vale para o que o boletim CONTA, não para o que a base MEDE** | 24/09 |
| **Fórum e rede social não ancoram o relógio; o dossiê conta comunidade à parte** | 23/09 |
| **`assunto` é derivado: dá para reprocessar a base inteira quando o método melhorar** | 23/09 |
| **O artigo segue o padrão do sócio, em blocos; o quiz no fim é a marca do site** | 24/09 · 27/09 |
| **Editor sim, backoffice não: o envio cai numa caixa de entrada e publicar continua sendo commit** | 24/09 · 27/09 |
| **O plano editorial é trilha → série (3, 5, 10) → pauta com esqueleto; e há o avulso** | 24/09 · 27/09 |
| **A máquina pergunta, a pessoa escolhe: a pauta semanal ordena por fórmula publicada** | 27/09 |
| **Sem IA no editor — nem para "melhorar" o texto de quem assina** (o editor de /escrever segue assim) | 24/09 |
| **A notícia sai sozinha, escrita pela rotina do Claude e assinada pela Redação do Instituto; o que não passa na revisão não sai** | 14/10 |

## 8 · Backlog sem data

| Item | Nota |
|---|---|
| ~~Embeddings para agrupar assunto~~ | **morto: seria IA em produção.** O conserto do agrupamento é por token raro, sem modelo — ver seção 2c |
| Mais vozes brasileiras de automação industrial | o buraco mais visível da lista de fontes |
| Coletor por API com credencial (GitHub, Reddit, YouTube) | saída legítima para as fontes que o robots recusa |
| Pedido de acesso a Control Engineering, Automation World, WEG | é mensagem, não código |
| Envio da newsletter | quando a lista justificar, e com a finalidade declarada |
| Busca (FTS5) | quando houver o que procurar |
| Diretório de quem opera, integra e ensina | só com base legal e rótulo comercial; a ideia do sócio de "sua empresa aqui" mora aqui |
| Página de perguntas abertas para orientadores | junto do dataset com DOI |
| Espanhol nas fontes | depois de EN e DE estáveis |
| Repositório público | quando o acordo do código estiver escrito |

## 9 · Mortos — não voltar sem fato novo

> ⚠️ **A automação do Giro em 24/09 NÃO ressuscitou nada desta lista.** O boletim é função pura
> sobre números medidos: sem modelo, sem chamada de rede, sem chave, sem teto de custo. Se algum
> dia entrar modelo de linguagem no caminho, é outra decisão — e muda o que o site promete em
> seis lugares.

IA no Worker (a notícia automática é escrita fora dele, §2l) · quatro núcleos · teto de custo e chave de API (o antigo A1) · tradução
integral de terceiro · backoffice fora do git · o "Tema" no rodapé · a coluna lateral da peça.
