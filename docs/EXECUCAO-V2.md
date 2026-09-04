# Execução v2 — o que matar, o que construir, e como saber que ficou perfeito

> 03/09/2026. O plano de obra da [concepção v2](CONCEPCAO-V2.md). Arquivo por
> arquivo, porque "tirar o pipeline" é frase de reunião e `rm src/pipeline`
> é trabalho — e só o segundo dá para conferir.

---

## 0 · O que é "perfeito", em termos que dão para medir

"Perfeito" não é adjetivo aqui — é uma lista de asserções que o `npm run qa`
tem de passar antes do primeiro deploy. Se não estiver nesta lista, não é
critério.

| # | Critério | Como se mede |
|---|---|---|
| P1 | **Zero IA em produção** | o bundle do Worker não contém `anthropic`, `ANTHROPIC_API_KEY`, `IA_CONTA` — grep no artefato compilado, não no fonte |
| P2 | **Toda peça publicada tem autor humano, fonte com link, data e seção** | frontmatter obrigatório; o compilador aborta sem ele |
| P3 | **Toda notícia tem veredito**; todo relatório tem tese no lead | asserção sobre o frontmatter |
| P4 | **Nenhum item na base vem de fonte que o `robots.txt` recusa** | invariante SQL que já existe, mantido |
| P5 | **A capa nunca lê como vazia** | com 1 peça a capa é inteira; com 0 diz o que está vindo. Asserção sobre o HTML nos dois estados |
| P6 | **Não há paginação, listagem infinita nem selo de revisão pendente** | grep negativo no HTML de todas as rotas |
| P7 | **Todo caminho da v1 redireciona** (`/industria/x` → `/noticias/x`, `/analise/x` → `/relatorios/x`) | tabela de redirects testada rota a rota, 301 |
| P8 | **Contraste WCAG AA nos dois temas**, calculado dos tokens | a asserção que já existe |
| P9 | **Sem cor bruta fora do `tokens.css`** | a asserção que já existe |
| P10 | **Home abaixo de 60 KB, CSS abaixo de 40 KB, resposta local < 300 ms** | as medidas que já existem, com o teto mais baixo — sem banco de conteúdo dá para exigir mais |
| P11 | **Os números do Giro batem com o dossiê** | a auditoria de números, adaptada: cada inteiro da prosa existe no agregado congelado |
| P12 | **A pauta acumula e só `lavrado` esvazia** | asserção sobre os dois ledgers: nenhuma URL em `lidos.json` sem ter passado por `pendentes.json` |
| P13 | **O cron do coletor não perde dia** | após o deploy: `MAX(coletado_em)` nunca mais de 24 h atrás — checado no `/saude` |

Treze. Quando as treze passarem, está perfeito **para o que a v2 promete**. O
que a v2 não promete (volume, velocidade) fica para depois, como você disse.

---

## 1 · MATAR

### 1.1 Vai embora inteiro

| Arquivo | Linhas | Por quê |
|---|---:|---|
| `src/pipeline/index.ts` | 264 | o pipeline de IA em produção — o coração da v1 |
| `src/ia/cliente.ts` | 171 | cliente da API, guarda `IA_CONTA`, simulação |
| `src/ia/etapas.ts` | 235 | triagem, tradução, contexto por modelo |
| `src/ia/custo.ts` | 88 | teto diário, kill-switch |
| `src/ia/precos.ts` | 58 | tabela de preços por modelo |
| `src/giro/redigir.ts` | 186 | o Giro escrito por modelo |
| `src/giro/index.ts` (o `montarGiro`) | ~150 das 228 | a orquestração redigir → auditar → gravar em D1 |
| **Total** | **~1.150** | |

A dependência `@anthropic-ai/sdk` sai do `package.json`, e com ela o
`compatibility_flags = ["nodejs_compat"]` que só existia por causa dela.

### 1.2 Vai embora do schema

| Tabela / coluna | Por quê |
|---|---|
| `custo_dia` | não há custo |
| `obra` | vira arquivo no git |
| `giro` | vira arquivo no git |
| `item.corpo`, `contexto_br`, `contexto_veredito`, `modo`, `minutos_apos_fonte`, `revisado_humano`, `revisor`, `revisado_em`, `og_key`, `slug`, `publicado_em`, `traduzido_em`, `motivo_arquivo` | eram o **estado do pipeline** sobre o item. Sem pipeline, `item` volta a ser só o registro do que foi colhido |
| `item.status` | simplifica: só existe `coletado`. Publicação é arquivo |
| `fonte.licenca_evidencia`, `licenca_conferida` | a faixa `liberada` deixou de ser pré-requisito de produto. A coluna `licenca` fica (bloqueada continua bloqueando a coleta) |
| `glossario.travado`, `manter_original` | o glossário deixa de ser dicionário de prompt e vira **página de referência** — pode virar arquivo também |

`item` depois da cirurgia: `id, fonte_id, assunto_id, titulo, url, url_canonica,
idioma, resumo, publicado_fonte, coletado_em`. Dez colunas. Era vinte e sete.

### 1.3 Vai embora da configuração

| Onde | O quê |
|---|---|
| `wrangler.toml` | `IA_SIMULAR`, `IA_CONTA`, `TETO_DIARIO_BRL`, `USD_BRL`, o cron `0 11 * * 1` (o Giro é manual agora), `nodejs_compat` |
| `src/config.ts` | os campos de IA em `Env`, `CRON_GIRO`, e **`NUCLEOS` → `SECOES`** (`noticias`, `relatorios`, `agenda`) com `TEMAS` (`industria`, `processos`) virando etiqueta |
| `package.json` | scripts `db:migrar*` das migrações de IA; entram os novos (abaixo) |

### 1.4 Vai embora das páginas

| Rota / peça | Por quê |
|---|---|
| `/:nucleo` e `/:nucleo/:slug` | os quatro núcleos viram três seções |
| `/analise/:slug`, `/caso/:slug`, `/panorama/:slug`, `/panorama` | dobram em `/relatorios` |
| `Paginacao`, `FiltroVeredito` na listagem, `Selo pendente`, `ItemLinha`, `ItemSecundario` | infraestrutura de volume |
| o ramo do pipeline e o ramo do Giro em `scheduled()` | o Worker só coleta |
| a seção "Como usamos IA" do `/blueprints` | vira uma frase: **não usamos em produção** |
| `design/components.css`: paginação, filtro, selo, três camadas de item | ~200 linhas |

### 1.5 Vai embora da documentação — e é a maior dívida

**Todos** estes descrevem a v1 e hoje mentem: `CONCEITO.md`, `docs/ARQUITETURA.md`,
`docs/FLUXOS.md`, `docs/MODELO-DADOS.md`, `docs/ORGANOGRAMA.md`, `docs/ROADMAP.md`,
`docs/CAPACIDADE.md`, `docs/FONTES.md` (metade), `docs/roadmap.html`, `README.md`.

Não se apaga: **reescreve contra a v2**, mantendo o que sobreviveu (robots,
canonicalização, sistema de design, o método do QA). É uma sessão inteira, e é
a última da ordem — documento reescrito antes do código pronto descreve
intenção, não realidade, que é exatamente o defeito que estamos consertando.

Os `qa/SPRINT-*.md` ficam como estão: são história, e história não se edita.

---

## 2 · FICA COMO ESTÁ

O que a v1 acertou e a v2 herda sem mexer:

| Arquivo | Por quê fica |
|---|---|
| `src/coletor/feed.ts`, `robots.ts`, `sitemap.ts`, `url.ts` | o coletor puro. 51 + 18 conferências de unidade, robots.txt reais nos testes |
| `src/coletor/index.ts` | o coletor do Worker — **é ele que roda no cron**. Perde só a lógica de `modo` |
| `src/giro/agregar.ts`, `semana.ts` | SQL puro e calendário ISO. Viram o **dossiê** |
| `src/giro/auditar.ts` | a auditoria de números **fica** — adaptada para conferir o markdown do Giro contra o dossiê. Ela existia porque um modelo escrevia; agora existe porque *eu* escrevo, e eu também erro número |
| `src/ui/Documento.tsx`, `markdown.ts`, `jsonld.ts`, `estilo.ts` | o invólucro, o renderizador de obra, o `schema.org` |
| `design/tokens.css`, `base.css` | a fonte da verdade do visual |
| `scripts/colher.ts`, `lavrado.ts` | os tempos 1 e 2 |
| `scripts/testar-*.ts`, `sondar-*.ts`, `medir-cadencia.ts` | medição |
| `fontes.sql`, `vozes.sql` | com o corte aplicado |
| `qa/verificar.mjs` seções A, B-regras, B-agenda, B-blueprints, C-todas | ~60% do QA sobrevive |

---

## 3 · CONSTRUIR

Na ordem em que um depende do outro.

### 3.1 O conteúdo como arquivo

```
conteudo/
  noticias/2026-09-04-siemens-tia-portal-19.md
  relatorios/2026-09-30-quanto-custa-automatizar-uma-retifica.md
  giro/2026-s36.md
  arte/2026-09-04-siemens-tia-portal-19.svg
```

Frontmatter obrigatório — e o compilador **aborta** sem ele:

```yaml
titulo:    Siemens embarca diagnóstico preditivo no CLP
secao:     noticias            # noticias | relatorios | giro
tema:      industria           # industria | processos
formato:   curta               # curta | contexto | caso | analise | panorama
veredito:  a_caminho           # obrigatório em noticias
lead:      uma frase
autor:     Pedro Oliveira
data:      2026-09-04
fonte:
  nome:    Siemens Press
  url:     https://press.siemens.com/…
  idioma:  en
arte:      2026-09-04-siemens-tia-portal-19.svg
```

- `scripts/compilar.ts` → `src/conteudo.gerado.ts`. Roda antes de `dev` e
  `deploy`. Valida o frontmatter, gera o slug do nome do arquivo, ordena por
  data, e **para com erro legível** no primeiro arquivo inválido.
- `src/conteudo/index.ts` — `listar(secao)`, `obter(secao, slug)`,
  `destaque()`, `recentes(n)`. Zero banco.

### 3.2 As rotas novas

| Rota | O quê |
|---|---|
| `/` | capa para pouco volume: 1 destaque com arte, 3-4 recentes, agenda, relógio |
| `/noticias` · `/noticias/:slug` | a seção e a peça |
| `/relatorios` · `/relatorios/:slug` | idem |
| `/giro` · `/giro/:slug` | lista e edição, **lidas de arquivo** |
| `/agenda` · `/agenda/:slug` | como está |
| `/blueprints` · `/glossario` · `/saude` · feeds · sitemap | como estão, ajustados |
| **redirects 301** | `/industria|observatorio|operacao|edificacoes(/:slug)` → `/noticias(/:slug)`; `/analise|caso|panorama/:slug` → `/relatorios/:slug`; `/panorama` → `/relatorios` |

### 3.3 As ferramentas da lavra

| Comando | O quê |
|---|---|
| `npm run colher` | já existe. Ganha `--remoto` para ler do D1 de produção depois do deploy |
| `npm run lavrado` | já existe |
| **`npm run ler <url>`** | baixa UM artigo, confere o `robots.txt` daquele caminho, extrai o texto legível (sem navegação, rodapé, propaganda). É o insumo do tempo 3 |
| **`npm run dossie [semana]`** | o `agregar.ts` rodando por fora do Worker: os números da semana em markdown para eu escrever o Giro em cima |
| **`npm run nova <secao> <slug>`** | cria o arquivo da peça com o frontmatter preenchido a partir da pauta |
| `npm run compilar` | ver 3.1 |

### 3.4 O visual — depois das primeiras peças reais

Nesta ordem, e só depois que houver 3 peças de verdade no repositório:

1. **Capa e seções para pouco volume** — a peça em destaque com arte, espaço
   generoso, sem lista
2. **Logotipo** — nasce no vocabulário das capas geradas (varredura, malha),
   vira favicon e assinatura da OG image
3. **Arte por peça** — o método: SVG em `conteudo/arte/`, dimensão fixa,
   paleta dos tokens. Desenhada nas de destaque; o gerador atual (`capa.ts`)
   fica como **fallback** para peça sem arte, até não precisar mais
4. **Veredito dentro da peça** — o componente `Veredito` já existe; muda de
   lugar

### 3.5 O QA novo

| Seção | O quê |
|---|---|
| **B · conteúdo** | P2, P3, P5, P6 — frontmatter, capa nos dois estados, ausência de infraestrutura de volume |
| **B · redirects** | P7 — cada caminho da v1, 301 para o certo |
| **B · pauta** | P12 — os dois ledgers |
| **A · produção sem IA** | P1 — grep no bundle |
| **B · Giro** | P11 — a auditoria de números sobre o markdown |
| seções que morrem | "paginação e volume", "o veredito e a manchete" (vira parte de conteúdo), o Giro gerado |

---

## 4 · O QUE PRECISAMOS DE FORA

Nada disto é código, e dois travam o fim.

| # | O quê | Trava |
|---|---|---|
| **1** | **Acesso à Cloudflare do sócio** + domínio | o deploy, e por decisão sua **a coleta automática** (cron do Worker). Sem isso, tudo fica pronto e parado |
| **2** | **A conversa com o sócio** — o papel dele virou infra + comercial, a Leitura semanal dele não existe mais, e há [valor] combinados | não trava código; trava novembro |
| **3** | **Suas duas âncoras** — quarta (lavra) e segunda (Giro) | o conteúdo. Sem elas o site fica perfeito e vazio, que é a v1 de novo com outra cara |

---

## 5 · A ORDEM, E O TAMANHO

| # | Etapa | Sessões | Depende de |
|---|---|:---:|---|
| 1 | **A cirurgia** (§1.1–1.4) — matar, e o QA continuar verde no que sobrou | 1 longa | — |
| 2 | **Conteúdo em arquivo** (§3.1) + **rotas e redirects** (§3.2) | 1 | 1 |
| 3 | **Fontes**: aplicar o corte, entrar as 3 BR, refazer a pauta | ½ | — |
| 4 | **`ler`, `nova`, `dossie`** (§3.3) | ½ | 2 |
| 5 | **A primeira lavra** — você escolhe 3, eu escrevo, você aprova. **As primeiras peças reais** | 1, com você | 2, 3, 4 |
| 6 | **Capa e seções para pouco volume** | 1–2 | 5 |
| 7 | **Logotipo** | 1, iterativa com você | 6 |
| 8 | **Arte por peça** — o método, e as 3 primeiras | 1 | 6 |
| 9 | **O primeiro Giro** — dossiê, texto, auditoria | 1, com você | 4, 5 |
| 10 | **QA novo** (§3.5) — as treze asserções verdes | 1 | 1–9 |
| 11 | **Documentação reescrita** (§1.5) | 1 | 10 |
| 12 | **Deploy + cron** | ½ | acesso à Cloudflare |
| | **Total** | **10 a 12 sessões** | |

Em duas sessões por semana, **cinco a seis semanas**. Com sessões longas,
menos. O que historicamente mais estica é o **visual** (etapas 6–8): na v1
foram seis rodadas até você gostar do cabeçalho, e a lição ficou registrada —
pedir o print no primeiro "não gosto", não no terceiro.

### Por que essa ordem e não outra

- **A cirurgia vem primeiro** porque tudo que se construir em cima da v1 sem
  tirá-la vai carregar o peso dela. Matar antes de construir.
- **A primeira lavra vem antes do visual** porque tipografia só se julga com
  conteúdo real na tela — o projeto já pagou essa lição uma vez.
- **A documentação vem por último** porque documento escrito antes do código
  descreve intenção, e o defeito que estamos consertando é exatamente
  documento que não batia com o que existia.
- **O deploy fica solto** porque não depende de nós.

---

## 6 · O que eu faço quando você disser "vai"

Etapa 1, a cirurgia — e paro com o QA verde no que sobrou, para você olhar
antes da etapa 2.
