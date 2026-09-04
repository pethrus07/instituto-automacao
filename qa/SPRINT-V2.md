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
