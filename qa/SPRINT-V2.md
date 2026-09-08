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

---

## 10. Sessão 4 (06/09) — a marca prototipal e a revisão com Playwright

> `npm run qa` · **561 asserções · 0 falhas** · `npm run revisao` · **42 medições · axe 0 violações**

- **Marca prototipal** em `publico/marca/` (11 SVGs: horizontal, vertical, símbolo, ícone; cor,
  negativo, mono) e prancha pública em `/marca`. O símbolo é o de `src/ui/marca.ts`; o nome é
  Newsreader convertida em caminhos (fontTools), sem kerning — é o que a separa da definitiva.
  Regras e construção em `design/marca/MARCA.md`. Trocar a marca = trocar dois lugares.
- **Revisão completa** em `qa/REVISAO-2026-09-06.md`: média 7,9; notas por aspecto com evidência;
  17 achados por prioridade. Dois P0 corrigidos na hora: o botão da nav com texto cinza sobre
  laranja (regra `.navbar a` mais específica que `.botao-acao`; 2,9:1, axe pegou em 42 de 42) e o
  toggle de tema cujo primeiro clique não fazia nada para quem tem o sistema em escuro (o script
  partia do sistema; o CSS, por decisão documentada, parte do claro).
- **O que a medição ensinou:** CLS de 0,20 no tablet vem da fonte web chegando e alargando a nav;
  texto a 11,1 px no celular vem do piso de `--step--2`; 157 alvos de 19 px são links de rodapé e
  lista; nenhuma página tem `og:image`; só `Cache-Control` nos cabeçalhos; sem folha de impressão.
  Nada disso apareceria nas 561 asserções — elas afirmam o que sabemos; o Playwright mede o que
  não sabíamos.

---

## 11. Sessão 5 (06/09, noite) — SEO e estrutura de primeira linha

> `npm run qa` · **908 asserções · 0 falhas** · `npm run revisao` · **CLS 0 em 39 medições · axe 0 · zero terceiro**
>
> O pedido: *"vamos melhorar SEO e estrutura, tem que ser top do top de linha."*

### Estrutura
- `src/index.tsx` (1.090 linhas) virou **9 arquivos em `src/paginas/`** + um índice de 80 linhas que monta
  as páginas, os cabeçalhos e o cron. Cada página é um `Hono` próprio; apagar uma é apagar um arquivo.
- `strict: false` no roteador: `/noticias/` não é mais 404.
- **Cabeçalhos de segurança** em toda resposta: CSP estrita (`script-src` só pelo hash do script do
  tema — `ui/tema.ts` → compilador → `TEMA_SCRIPT_HASH`; o QA recalcula do HTML e compara), `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`, COOP. Assets pela borda via
  `publico/_headers` (fontes imutáveis por um ano, CORS para fonte).
- **Fontes self-hosted** (5 woff2, subset latin, 343 KB no total) com preload das duas críticas e
  **fallbacks com métricas** (Georgia/Arial/Consolas ajustadas por `size-adjust` e overrides, calculadas
  com fontTools). Resultado medido: **CLS 0,20 → 0** no tablet, em todas as páginas; nenhum host de
  terceiro em nenhuma página.

### SEO
- `<title>` curto: `titulo_curto` (≤ 53 + " — Instituto Automação" = 75) em todas as 21 peças; o título
  inteiro fica no h1 e no `og:title`.
- Descrição cortada em fim de frase a ≤ 160 (`ui/seo.ts`); toda página entre 50 e 160.
- **`og:image` em toda página**, absoluta, com largura e altura: a foto de imprensa quando há; senão o
  PNG 1200×630 que o compilador rasteriza da arte SVG (ou da capa gerada) com o Playwright; a padrão do
  site é a logo sobre o azul das capas. Twitter card `summary_large_image`. `article:*` nas peças.
- **JSON-LD por tipo de página**: Organization + WebSite na capa; NewsArticle/Article (autor, data,
  imagem, `isBasedOn` e `citation` da fonte) + BreadcrumbList nas peças; CollectionPage nas seções;
  ItemList/Event na agenda; DefinedTermSet no glossário; **Dataset** no blueprints (Google Dataset
  Search). O QA parseia todos e confere os tipos.
- `theme-color` (claro e escuro), `apple-touch-icon`, `manifest.webmanifest`, ícones 180/192/512
  rasterizados do ícone da marca; `link rel=sitemap`; 404 com `noindex`; agenda filtrada com `noindex`
  e canônica na agenda inteira.
- **Hierarquia h1 → h2 → h3 sem salto** em toda página: o rótulo de seção virou `h2` de verdade
  (visual pela classe); evento da agenda é `h2` na agenda e `h3` na capa.

### Acessibilidade e leitura
- `--step--2` com piso em 12 px (texto miúdo no celular: **386 → 0**).
- Alvos de toque ≥ 24 px onde o ponteiro é grosso (rodapé, ações de bloco, eventos, listas):
  **157 → 27**, e na capa e na agenda sobra só o skip link (1×1, isento por definição).
- `--ink-faint` no escuro de 4,02:1 para ~5,7:1.
- `@media print`: sem navegação, rodapé, formulários e faixa; URL da fonte escrita depois do link.
- `destaque: true` no frontmatter (compilador aceita um só) — a capa deixou de depender do alfabeto.

### O que a rodada ensinou
1. **A CSP estrita quebra a própria ferramenta de medir**: o axe-core é injetado como script inline.
   `bypassCSP: true` no contexto do Playwright — o leitor fica protegido, o teste passa.
2. **O JSON-LD conta como `<script>`** para uma asserção ingênua. A checagem passou a contar só script
   executável (`type` diferente de `application/ld+json`).
3. **53 caracteres é o teto real do título curto**: 22 vão para o nome do site. Seis títulos que
   pareciam curtos estouravam 75.
4. **Métrica de fallback não é enfeite**: sem `size-adjust`, trocar Google Fonts por self-hosted
   não zera o CLS — só muda quem serve a fonte que faz a página pular.
5. **Heredoc longo no Git Bash quebra** com aspas simples no meio; script vai para arquivo e mensagem de
   commit vai por `-F`.

### Em aberto (atualizado)
1. **Deploy** — acesso à Cloudflare; a máquina do deploy precisa do Chromium do Playwright
   (o compilador rasteriza `publico/og/`).
2. **Primeiro Giro** — segunda-feira 07/09.
3. Docs v1 · lint · Search Console e envio do sitemap (dependem de estar no ar).

---

## 12. Sessão 6 (06/09, noite) — o tour narrado

> `npm run tour` · **15 cenas, todas executaram · 1 min 41 s · 8,1 MB · legendas WebVTT + capítulos** · QA 913 · 0 falhas

- O motor é o dos tutoriais do Mettria (`qa-parresia/tutoriais/motor`, método em
  `sinapse/03-PROJETOS/tutoriais-em-video.md`), copiado para `tour/motor/` sem mudar uma linha do que é
  genérico: narração com tempo por palavra (edge-tts, `WordBoundary`), ponteiro desenhado que anda no
  compasso da voz, desconto do atraso do screencast, montagem em ffmpeg por npm.
- O que é deste projeto está em `tour/roteiro-site.mjs`: 5 partes (capa · peça · agenda · blueprints e
  glossário · fecho), 15 cenas, voz Thalita a −8% (escolha do Pedro no Mettria). Grava o site local, só
  leitura, sem trava de escrita porque nada é enviado.
- **O site embute o tour** em `/blueprints#tour`: `<video>` com poster (a OG padrão), `<track>` de legendas
  em pt-BR gerado do mesmo roteiro, e link para os capítulos. O QA confere vídeo (aceita `Range`),
  legendas (≥ 12 deixas) e capítulos servidos, e a `<track>` na página.
- **Breve de verdade:** a primeira versão saiu com 2 min 18 s. Cortar metade das palavras e manter as
  cenas deu 1 min 41 s — o que se vê é o mesmo, o que se diz é o essencial. `crf 23` em vez de 20: tela de
  site é plana, e o arquivo caiu de 12,4 para 8,1 MB.
- **Regra do roteiro:** nenhum número na narração. Os números da capa mudam todo dia; a voz não pode
  desmentir a tela de amanhã.

### Em aberto
- Revisão da narração pelo Pedro (mudar frase antes de dublar é de graça; depois é regenerar — e
  regenerar custa 3 minutos).
- Versão para celular (tela `celular` já existe no motor) quando houver por quê.

---

## 13. Sessão 7 (06/09, noite) — a homologação na borda

> **https://instituto-automacao-homolog.desbravando-utv.workers.dev** · `npm run deploy:homolog` · QA contra o publicado: **910 ok · 3 diferenças esperadas** · revisão na borda: **axe 0 · CLS 0,01 · 71 links, 0 quebrados**

Decisão do Pedro: subir na conta dele (ryzecode08) para visualização e testes, produção continua
reservada à conta do sócio. O que a subida exigiu e o que ela mostrou:

- **`[env.homolog]` no `wrangler.toml`**: nome, `account_id` explícito (já houve confusão de conta
  por variável de ambiente em outro projeto), D1 próprio (`instituto-homolog`, semeado dos mesmos
  `.sql` em quatro comandos), cron, assets, e `HOMOLOG = "1"`.
- **`noindex` por variável**: `robots.txt` fecha tudo e o middleware põe `X-Robots-Tag: noindex,
  nofollow` em toda resposta quando `HOMOLOG` é "1". `/saude` diz o ambiente.
- **O subdomínio não era o que eu assumi.** A conta publica em `desbravando-utv.workers.dev`, não
  `ryzecode`; a `SITE_URL` foi corrigida e republicada — canônica e `og:image` dependem dela.
- **Na borda, tudo que o local não prova:** `_headers` aplicado (fontes `immutable` por um ano,
  vídeo com `Accept-Ranges`, `nosniff` em asset), CSP e demais cabeçalhos, barra final 200, 404,
  TTFB ~200 ms, capa fria 1,3 s e quente 0,22 s no celular (o 3,4 s da primeira medição era o
  Worker acordando).
- **As 3 diferenças do QA contra o publicado, todas esperadas:** o teste de assinatura escreve no
  banco e lê o D1 local para conferir (agora **só roda no dev local**, e apaga o rastro
  `qa.*@exemplo.com` que deixava — o remoto também foi limpo); `robots.txt` não aponta o sitemap
  (fechado de propósito); capa em 371 ms contra teto de 300 ms "local" (é rede).
- **`ERR_ABORTED` no tour não é falha:** `<video preload="metadata">` lê o cabeçalho e o navegador
  aborta o resto do arquivo. A revisão passou a ignorar abort de mídia.
- **PageSpeed Insights** ficou para depois: a cota anônima da API estava esgotada.
- **O cron bateu no primeiro quarto de hora depois do deploy (20:15):** 45 itens de 3 fontes, robots conferido em 4, zero erros — o `ctx.waitUntil` do coletor funciona em produção, que era o defeito que só apareceria lá. Curiosidade da borda: o `workers.dev` devolve 403 ao `User-Agent` padrão do `urllib` do Python (proteção de bot); `curl` e navegador passam.

### Em aberto
1. Produção na conta do sócio (A2) — `wrangler deploy` sem `--env`, com `database_id` e
   `account_id` dele, `db:remoto` + sementes, Search Console, sitemap.
2. Abrir a homologação no celular e colar o link no WhatsApp para ver o cartão (og:image).
3. Primeiro Giro — segunda 07/09.

---

## 14. Sessão 8 (07–08/09) — o primeiro feedback do sócio, e o "cru"

> QA: **1004 ok · 0 falhas** (era 913) · revisão: **54 páginas medidas · axe 0 · CLS 0 · LCP máx. 260 ms · 75 links, 0 quebrados · zero terceiro** · migração **006**

O sócio viu a homologação e mandou 11 pontos num Google Doc, mais um juízo geral: "um pouco
cru, com poucos detalhes". Tudo foi lido como pedido de quem é do ramo — e o que contrariava a
tese do site (tirar o relógio) ficou registrado como decisão do Pedro, não foi apagado.

### O que cada ponto virou

| # | Pedido | O que virou |
|---|---|---|
| 1 | logo de acordo com o instituto | nada de código: a marca continua prototipal, por decisão |
| 2 | banner de parceiro entre cabeçalho e 1ª notícia | faixa **Parceiro do Instituto** (`src/parceiros.ts`, lista vazia → o espaço diz de quem é) + página **/apoie** com as regras (parceiro não escreve, não escolhe pauta nem veredito) e formulário → `contato` |
| 3 | as 3 notícias abaixo estão boas | mantidas; ganharam ordinal 01/02/03 |
| 4 | "difícil quantificar o relógio; usar a área para outra coisa" | **mantido**. A faixa agora diz "a medida vale para as N fontes que acompanhamos, não para toda a imprensa"; e sem par medido mostra itens lidos e assuntos agrupados — **nunca um `0` fingindo medida** (o local mostrava "0 assuntos", e era isso que enfraquecia o bloco) |
| 5 | "o que são os relatórios e como é montada a agenda?" | `Secao` ganhou `nota`: uma linha sob o rótulo dizendo o que o bloco é. Se quem é do ramo pergunta, a página responde no lugar — não em Blueprints |
| 6 | tema no cabeçalho | botão **Tema** (ícone lua/sol + palavra) na navegação; saiu do rodapé. Era decisão pendente do Pedro; o sócio empurrou |
| 7 | cadastro muito embaixo; pedir o que a pessoa faz | a lista subiu para logo depois das 3 notícias; campos opcionais **atuação** (fechado: opera · integra · ensina · estuda · outra) e **empresa**. Sem promessa de diretório: o que não existe não se anuncia |
| 8 | "precisa dessa lateral direita?" | não. A peça virou **coluna única centrada (52 rem)** com a arte sangrando até a página (`100cqi`, o `<main>` é contêiner) e a **ficha** embaixo do texto: veredito com critério, fonte, quem escreveu |
| 9 | carrossel de autores → currículo | `conteudo/autores/*.md` (nome, papel, ordem, link?, foto?; bio no corpo). O compilador **recusa peça cujo autor não tem arquivo**. Páginas **/autores** (lista + "Escreva no Instituto") e **/autores/<slug>** (papel, bio, todas as peças, link para fora), faixa **Quem escreve** na capa (rolagem com encaixe, sem JS, termina no convite), assinatura com `rel=author`, `ProfilePage` + `Person` no JSON-LD, `og:type profile` |
| 10 | mais artigos didáticos que notícias | seção **Artigos** (formatos `guia` e `conceito`, sem veredito, fonte opcional) na nav, na capa, no feed e no sitemap. Vazia e honesta: "o primeiro artigo está sendo escrito", com o convite a escrever |
| 11 | eventos são interessantes | mantidos; a data virou folha de calendário |

### O "cru": detalhe de jornal, sem caixa cinza

A decisão da página branca (v4, em `tokens.css`) ficou. O que entrou foi o que uma publicação
impressa tem por hábito: o **fio laranja de topo**, a **linha de data** ("Terça-feira, 8 de
setembro de 2026" · a promessa · RSS), a **régua dupla** sob o nome e nas cabeças de seção, a
**ordinal** nos cartões, o fio entre arte e texto do destaque, a **capitular** e o fio curto nos
intertítulos da peça, os **anéis de radar** na faixa escura (a marca em escala de faixa), a
lavagem azul com **marca-d'água** na lista, o **colofão** no rodapé. CSS foi de 39 para 45 KB sem
comprimir (teto do QA subiu para 48; na borda vai em brotli).

### O que a medição pegou depois de pronto

- **axe: 3 sérias na capa**, todas a mesma: `--ink-faint` (#71717a) sobre a lavagem azul da lista
  (#e8f0fb) dá 4,2:1. Dentro da lista o miúdo passou para `--ink-muted`. O token continua
  certo sobre o papel; foi o fundo que mudou.
- **transbordo 2 no tablet:** a marca-d'água saía 14 px pela direita da caixa. `overflow: hidden`
  esconde, mas o retângulo conta. Ficou dentro na horizontal; só vaza para baixo.
- **O `wrangler dev` caiu** no meio da primeira revisão (erro vazio do ProxyController do
  miniflare, depois de 1,5 h de pé). Subiu de novo e a segunda revisão passou inteira. Não foi
  o site — mas revisão longa pede dev recém-subido.
- **Sem regressão:** CLS 0, LCP máx. 260 ms, nenhum texto abaixo de 12 px, alvos pequenos só o
  skip link (por desenho) e os já conhecidos de Blueprints.

### Banco

Migração `006-leitor-e-contato.sql`: `assinante.atuacao`, `assinante.empresa`, tabela `contato`
(`tipo` autor|parceiro). `schema.sql` acompanha para instalação limpa. Scripts: `db:migrar`
(local), `db:migrar:homolog`, `db:migrar:remoto`. O QA confere 8 tabelas e testa os dois
formulários novos só no dev local, apagando o rastro.

### Na borda

Homologação republicada (`6b8d2e5`), migração 006 aplicada no D1 de lá, cron vivo (`/saude`:
coleta há 0 h). QA contra o publicado: **988 ok · 2 diferenças esperadas** (robots fechado de
propósito; teto de 300 ms é local) · 1 aviso (assinatura só se testa no dev). Uma terceira
"falha" era o QA comparando a página publicada com o D1 **local**: a borda lista 5 fontes
recusadas pelo robots porque o cron de lá já as marcou; aqui são 0. Virou aviso quando o alvo é
remoto — o banco é outro.

### Em aberto
1. **Decisões do Pedro:** manter o relógio (o sócio duvida da medida); `link:` do currículo em
   `conteudo/autores/pedro-oliveira.md` (LinkedIn? Lattes?) e o texto da bio; fonte BR em
   Notícias; `destaque: true`.
2. **O primeiro artigo.** A seção existe e convida; quem escreve é gente.
3. **Primeiro parceiro** entra por commit em `src/parceiros.ts` — e aí define, com a gente, o
   que o espaço mostra.
4. Produção na conta do sócio (A2), com `db:migrar:remoto` depois do `db:remoto`.
