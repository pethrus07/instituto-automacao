# QA · v2 — a cirurgia, o conteúdo em arquivo, e as primeiras peças reais

> 03/09/2026 · `npm run qa` · **213 asserções · 0 falhas · 2 avisos** · +89 do `npm test`
>
> A concepção v2 ([docs/CONCEPCAO-V2.md](../docs/CONCEPCAO-V2.md)) construída de ponta a
> ponta numa sessão: matar o pipeline de IA, mover o conteúdo para arquivo, três seções,
> marca gráfica, arte por peça — e **as três primeiras peças reais do projeto**.

---

## 1. O que existe agora, e não existia de manhã

| | Antes (v1) | Agora (v2) |
|---|---|---|
| peças publicadas | **0** | **3**, reais, com autor, fonte, veredito e arte desenhada |
| IA em produção | pipeline com teto de custo, em simulação | **nenhuma** — o QA confere no bundle compilado |
| conteúdo | banco D1 | **markdown no git**, compilado para o bundle |
| `item` | 27 colunas | **10** |
| tabelas | 10 | 7 |
| seções | 4 núcleos | Notícias · Relatórios · Agenda (+ Giro) |
| marca | wordmark | **símbolo** — anel, raio, um ponto aceso |
| fontes ativas | 30 | 21 (corte pela cadência medida + 3 BR do relógio) |
| dependência de terceiro | chave de API na conta do sócio | só o acesso à Cloudflare, para o deploy |

## 2. Os treze critérios de "perfeito", medidos

| # | Critério | Como o QA mede | Estado |
|---|---|---|---|
| P1 | zero IA no bundle | `wrangler deploy --dry-run` e grep por `anthropic`, `IA_CONTA`, `claude-` no artefato | ✅ |
| P2 | toda peça tem autor, fonte, data, seção | frontmatter lido da FONTE (`conteudo/**.md`), e o compilador aborta antes | ✅ |
| P3 | toda notícia tem veredito na categoria fechada | idem | ✅ |
| P4 | nenhum item de fonte que o robots recusa | invariante SQL | ✅ |
| P5 | a capa nunca lê como vazia | `class="destaque"` com peça, `class="vazio"` sem; `/relatorios` (0 peças) mostra o vazio honesto | ✅ |
| P6 | sem paginação, selo pendente, filtro de veredito | grep negativo em toda página HTML | ✅ |
| P7 | todo caminho da v1 redireciona 301 | 10 rotas, uma a uma | ✅ |
| P8 | contraste AA nos dois temas | dos tokens, inclusive texto sobre a faixa escura | ✅ |
| P9 | sem cor crua fora de token — **inclusive nas artes SVG** | grep em `components.css` e em `conteudo/arte/*.svg` | ✅ |
| P10 | capa < 60 KB, CSS < 40 KB, < 300 ms | medido | ✅ |
| P11 | números do Giro batem com o dossiê | a auditoria (`auditarNumeros`) em 8 testes de unidade; o Giro ainda não saiu | ✅ (unidade) |
| P12 | a pauta acumula e só `lavrado` esvazia | nenhuma URL em `pendentes` e `lidos`; `colher` não escreve em `lidos.json` | ✅ |
| P13 | o cron não perde dia | `/saude` reporta horas desde a última coleta; **aviso** até o deploy | ⏳ 78 h — esperado sem cron |

## 3. O que saiu

**~1.150 linhas inteiras:** `src/pipeline/`, `src/ia/` (cliente, etapas, custo, preços), `giro/redigir.ts`, `giro/index.ts`, `giro/agregar.ts`. A dependência `@anthropic-ai/sdk` e o `nodejs_compat`. As tabelas `obra`, `giro`, `custo_dia`. Dezessete colunas de `item`. Os quatro núcleos e seus tokens. Paginação, três níveis do radar, selo "revisão pendente", filtro por veredito, backoffice de WhatsApp (nunca construído).

O que **ficou** foi o que a v1 acertou: coletor puro (feed, robots, sitemap, canonicalização — 69 testes), o coletor do Worker no cron, a semana ISO, a auditoria de números (adaptada: agora confere o que EU escrevo), o sistema de design, a agenda, o glossário, o inventário de fontes, 60% do QA.

## 4. As três peças — e a que caiu

| Peça | Voz | Veredito | Por quê |
|---|---|---|---|
| Skild AI apresenta o S1 | contexto | **não chega** | não há mercado nem representante fora dos EUA; o que vale é a tendência |
| Um engenheiro nuclear explica por que deixou passos manuais | contexto | **chega** | é prática, não produto — aplica-se sem representante nem homologação |
| A John Deere pôs uma IA para conversar com os dados da fazenda | contexto | **a caminho** | a Deere tem fábrica e rede aqui; a fonte não menciona Brasil nem data |

**A que caiu:** "The Missing Layer in Robot Safety Assurance" (The Robot Report) estava na
pauta como notícia forte de segurança. Lendo a fonte inteira, a última linha dizia
**"Sponsored content by VicOne"**. Conteúdo pago de fornecedor não vira notícia — e isso só
apareceu porque a v2 exige ler o artigo inteiro antes de escrever. No desenho anterior, o
resumo do feed teria passado.

## 5. Defeitos encontrados — quatro pelo QA, dois pelo olho

### Pelo QA
1. **Duas fontes com tema antigo.** `fontes.sql` e `vozes.sql` rodam DEPOIS da migração e
   reinseriam `observatorio`/`operacao`. Mapa de temas acrescentado aos dois arquivos —
   idempotente, e vale para quem cria do zero.
2. **"fabrica" acusado como português sem acento.** Era o verbo (*a Deere fabrica*), não o
   substantivo. Rephrase em vez de afrouxar a regra — o falso positivo é raro e a regra pegou
   defeito real na v1.
3. **Dois `h1` em `/noticias`.** O destaque era `h1` sempre; dentro de uma seção que já tem o
   seu, ele desce para `h2`. Prop `principal` só na capa.
4. **`--marca` no escuro a 3,9:1.** O azul da marca virou TEXTO na v2 (kicker, rótulo de
   seção, número, o nome). Clareado até 7:1.

### Pelo olho — o que o QA não vê
5. **O botão laranja da navegação com o texto vazando.** A regra genérica `.navbar a` zerava o
   padding vertical do botão. **Nenhuma asserção pegaria isso**: o HTML está certo, o CSS é
   válido, o contraste passa. Só o screenshot mostra. Lição registrada: *o QA mede o que dá
   para medir; a tela ainda precisa de olho.*
6. **O lockup da marca não quebrava em tela estreita.** `flex-wrap` e piso menor no `clamp`.

## 6. Um alerta sobre a medição de tela

O screenshot "mobile" em 430 px veio cortado à direita — e a primeira leitura foi "o CSS
estoura". Não era: **o Chrome headless não encolhe a janela abaixo de ~500 px**, então a página
foi renderizada a 500 e recortada a 430. Medição errada gera diagnóstico errado; a conferência
em 600 e 820 px é a que vale.

## 7. Em aberto

1. **Deploy** — depende do acesso à Cloudflare. Com ele, o cron do coletor liga e o P13 passa
   de aviso a asserção.
2. **O primeiro Giro** — `npm run dossie` está pronto; a edição sai na segunda com o Pedro.
3. **O primeiro Relatório** — com dado próprio, não se escreve nesta sessão.
4. **Documentação** — `CONCEITO.md`, `ARQUITETURA.md`, `FLUXOS.md`, `MODELO-DADOS.md`,
   `ROADMAP.md`, `CAPACIDADE.md`, `roadmap.html` descrevem a v1. O README já diz isso; a
   reescrita é a última etapa da execução, de propósito.
5. **Fontes self-hosted** — as três famílias ainda vêm do Google em dev.

---

## 8. Sessão 2 (04/09) — a povoada, e a imagem real

> 04/09/2026 · `npm run qa` · **368 asserções · 0 falhas · 1 aviso** · +89 do `npm test`
>
> O pedido: *"dê uma boa povoada no site e ponha as imagens reais das notícias."*

### O que entrou

| | manhã | agora |
|---|---|---|
| peças | 3 | **11** — 10 notícias (3 curtas, 7 com contexto) e **1 Análise com dado próprio** |
| imagens reais | 0 | **7**, todas material de imprensa, com crédito e licença no frontmatter |
| artes desenhadas | 3 | 5 |
| eventos na agenda | 4 fictícios | **4 reais** — RoboBusiness conferido no site oficial; IROS, CoRL e Humanoids Summit pelo calendário da IEEE Spectrum, e a descrição diz isso |
| dataset público | 0 | 1 CSV, **274 linhas** (a janela da Análise), servido em `/dados/` |
| fontes BR do relógio com itens | 0 | 3 — a primeira coleta trouxe 45 |

### A decisão da imagem

Regra do projeto desde 30/08: *a licença governa, não o formato.* Implementação: bloco
`imagem:` com `arquivo · credito · licenca · alt`; licença é categoria fechada
(`press | cc-by | cedida | propria`); o compilador aborta sem qualquer dos quatro, com arquivo
ausente ou acima de 600 KB; o crédito vai sobre a imagem em `figcaption`, a licença em
`data-licenca`, e o QA mede os dois na página. Servida como **asset estático** do Worker
(`[assets] directory = "./publico"`), fora do bundle. Nenhuma `<img>` de nenhuma página aponta
para fora — o QA confere.

O que a regra deixou de fora, de propósito: a foto do trator 8R na matéria da Deere (sem
crédito na página → não sabemos de quem é → fora; entrou a ilustração do FurrowVision, *Credit:
John Deere*); a ilustração da IEEE Spectrum no artigo do portão manual (editorial deles); os
cabeçalhos do blog do n8n (blog da empresa não é press kit → arte desenhada e gerada).

### O que caiu antes de virar peça

- **Siemens, "sets new standards in training".** A página de imprensa da Siemens não entrega o
  texto sem JavaScript — só título e quatro bullets. Ler a fonte inteira é regra; sem texto,
  sem peça.
- **Giro da s35.** O dossiê saiu (52 itens), mas 43 eram de fontes desativadas na v2 e 3 de
  fontes "(exemplo)". Seria um Giro da v1. O primeiro Giro fica para segunda, sobre a s36 —
  e o dossiê agora só conta fonte ativa.

### O que o povoamento revelou

1. **Fontes "(exemplo)" no inventário público** de `/blueprints`, inativas, e itens delas no
   dossiê. Apagadas — com as FKs soltas antes (`assunto.fonte_original`, `assunto.fonte_br`,
   `evento.fonte_id`). A primeira tentativa de DELETE falhou na FK e o `tail -2` escondeu o
   erro.
2. **`ev-005` fictício sobrevivia no banco** sem estar em nenhum `.sql`. Apagado; a lista de
   DELETE do seed inclui.
3. **As 3 fontes BR do relógio tinham zero itens** — o coletor só roda no cron, e o cron só
   existe em deploy. Uma rodada via `/__scheduled`: 62 itens novos.
4. **Datas de publicação chutadas.** As 7 peças novas saíram com `publicado` estimado e foram
   conferidas na pauta depois: **6 de 7 estavam erradas.** Regra: `publicado` vem de
   `pendentes.json`.
5. **Texto vs. dado.** A Análise dizia 192 itens de 18 fontes; o CSV exportado depois da coleta
   tinha 195 de 16. O texto foi corrigido para bater com o arquivo publicado — o arquivo é a
   verdade, o texto segue.

### Pelo olho

Capa, Notícias, peça com foto, Análise, Agenda e a capa a 700 px — conferidos em screenshot.
Crédito legível sobre a foto em todos os tamanhos de card; a mistura de foto, arte desenhada e
arte gerada mantém unidade porque a moldura é a mesma.

### Em aberto (atualizado)

1. **Deploy** — acesso à Cloudflare; liga o cron e o P13.
2. **Primeiro Giro** — segunda-feira 07/09, sobre a s36, com o Pedro.
3. **Agenda sem evento brasileiro** — nenhum dos 45 itens BR colhidos anunciava evento com
   data; procurar direto nas associações (ABINEE, ABIMAQ, CIMM).
4. **Docs v1** — a lista da seção 7; última etapa.
5. **Fontes self-hosted.**

---

## 9. Sessão 3 (04/09, noite) — "nada de exemplo, só o real e oficial"

> 04/09/2026 · `npm run qa` · **536 asserções · 0 falhas · 1 aviso** · +89 do `npm test`
>
> O pedido: *"continue povoando mais, nn quero nada de exemplo quero os reais oficiais."*

### O que entrou

| | antes | agora |
|---|---|---|
| peças | 11 | **21** — 20 notícias (13 de fora, **7 lidas em fonte brasileira**) e 1 Análise |
| imagens reais | 7 | **11**, todas com crédito escrito na página da fonte |
| artes desenhadas | 5 | 8 |
| eventos publicados | 4 | **20** — 11 no Brasil; 9 com data conferida no site oficial, 7 pela agenda do CIMM (fonte acompanhada, `fonte_id` e link do evento), 4 anteriores |
| glossário | 22 | 33 termos |
| fixtures "(exemplo)" | 2 no banco | **0** — no banco, no seed, no HTML |

### As fontes brasileiras entraram nas Notícias

Sete peças saíram de fontes do relógio (Automação Industrial ×6, CIMM ×1): Tractian/BNDES,
Vale×ABB, ISA/OTCC, MELSEC MX, ABB Sorocaba, Siemens Automation, Gefran×NOVUS. A tagline diz
"o que o setor publica lá fora"; seis das sete têm dimensão internacional direta (fabricante ou
comprador estrangeiro), e a do BNDES é o maior financiamento público a robótica do ano. **É uma
decisão editorial para o Pedro confirmar**: Notícias inclui a fonte brasileira especializada, ou
fica só com o exterior e a BR vai para outro lugar?

### O que ficou de fora, e por quê

- **Siemens** (press release sem texto sem JavaScript), **HVAC/Engerey** no CIMM ("com
  Engenharia de Comunicação", imagem de banco de imagem: assessoria, não notícia),
  **ArcelorMittal** (siderurgia, não automação), **grippers/OnRobot** no TRR (artigo assinado
  pelo diretor comercial do fabricante).
- Fotos: a da Tractian tem "Divulgação" no nome do arquivo, mas nenhum crédito na página →
  fora; a da JAKA/UR, da NSF (crédito composto de quatro instituições) e do MELSEC → fora.
  Regra aplicada igual para todas: **crédito escrito na página ou nada**.

### O que a rodada revelou

1. **`urllib.robotparser` lia o robots.txt do CIMM com o User-Agent do Python, levava 403 e
   respondia "não pode" para todo caminho.** Três artigos foram descartados como "robots não
   permite" sem ser verdade. Corrigido buscando o robots com o nosso UA e passando o texto a
   `parse()`. O `ler.ts` do projeto já fazia certo; o script avulso não.
2. O CIMM declara `Content-Signal: search=yes,ai-train=no`. Respeitado (não treinamos nada);
   fica a pendência de o coletor registrar o sinal por fonte, ao lado do robots.
3. **Eventos em site com JavaScript não expõem data** (Mercopar, IROS, CoRL, Humanoids Summit).
   Ficaram com a fonte da data escrita na descrição — CIMM ou IEEE Spectrum — em vez de
   inventar uma conferência que não houve.
4. **O destaque da capa é a primeira peça por data e, no empate, por ordem alfabética do slug.**
   Com 20 peças no mesmo dia, "Austrália" ganha por começar com A. Precisa de `destaque:` no
   frontmatter, decidido por gente.

### Pelo olho

Capa, Notícias, Agenda com 20 linhas, Glossário e as quatro peças novas com arte ou foto —
conferidos em screenshot a 1440 px. Nenhum defeito visual.

### Em aberto (atualizado)

1. **Deploy** — acesso à Cloudflare; liga o cron e o P13.
2. **Primeiro Giro** — segunda-feira 07/09, sobre a s36.
3. **Decisão editorial**: fonte brasileira especializada dentro de Notícias (ver acima).
4. **`destaque:` no frontmatter** para a capa não depender do alfabeto.
5. **Coletor registrar `Content-Signal`** por fonte.
6. Docs v1 · fontes self-hosted.
