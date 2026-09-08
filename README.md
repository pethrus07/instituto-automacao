# Instituto Automação

> O que o setor de automação publica lá fora, lido daqui.

Veículo semi-institucional. Lê o que o setor de automação publica no mundo, escolhe o que
importa para quem opera no Brasil, escreve em português com crédito e link para a fonte em
toda peça — e mede quanto tempo cada assunto leva para chegar aqui.

**A máquina colhe. Uma pessoa decide. Alguém escreve. O git publica.** Não há inteligência
artificial em produção: nenhuma peça é traduzida ou redigida por modelo, e o QA confere isso
no bundle compilado.

> **Para entender o código sozinho, comece por [docs/ARQUITETURA.md](docs/ARQUITETURA.md):**
> da estrutura de pastas ao que acontece em cada requisição, cada tick do cron e cada comando,
> com receitas e o vocabulário interno. Este README é só o como rodar.

## Rodar local

```bash
npm install
npm run db:local      # aplica o schema
npm run db:semente    # glossário e os eventos reais da agenda
npm run db:fontes     # as fontes reais
npm run db:vozes      # as pessoas públicas
npm run dev           # compila o conteúdo e sobe em http://localhost:8787
```

Banco que já tem dado: `npm run db:migrar` em vez de recriar — `schema.sql` começa com
`DROP TABLE`, e item colhido não volta.

```bash
npm test              # as suítes de unidade: parser de feed, robots, sitemap, semana ISO, auditoria
npm run qa            # ~1000 asserções contra o site rodando — sai com código 1 se falhar
npm run revisao       # Playwright: mede CLS, axe, alvos, links; screenshots em qa/revisao/
```

## O ciclo de trabalho

| Tempo | Quem | Comando |
|---|---|---|
| **1 · Colher** | máquina | `npm run colher` — obedece o `robots.txt`, deduplica, escreve `colheita/pauta.md` |
| **2 · Decidir** | Pedro | lê a pauta e marca o que vira peça; `npm run lavrado` esvazia |
| **3 · Escrever** | — | `npm run ler -- <url>` traz o artigo; `npm run nova -- noticias <slug> --url <url>` cria o arquivo |
| **4 · Publicar** | git | `npm run compilar` → `npm run qa` → commit → `npm run deploy` |
| **revisão** | — | `npm run revisao` — Playwright: 13 páginas × 3 larguras, axe, fluxos, screenshots em `qa/revisao/` |
| **tour** | — | `npm run tour` — regenera o tour narrado (`publico/tour/`): voz pt-BR + Playwright dirigindo o site + ffmpeg; legendas WebVTT e capítulos saem juntos |
| **semanal** | Pedro | `npm run dossie` traz os números; o Giro é escrito em cima e auditado pelo compilador |

Frontmatter opcional que a busca e a capa usam: `titulo_curto:` (≤ 53 caracteres; vira o `<title>`
e o headline do JSON-LD — o título inteiro fica no h1) e `destaque: true` (a peça que abre a
capa; o compilador aceita uma só). Peça sem foto ganha uma imagem de compartilhamento rasterizada
da arte em `publico/og/` pelo próprio `compilar`, com o Chromium do Playwright.

O conteúdo mora em `conteudo/**.md` com frontmatter. O compilador **aborta** sem autor, sem
fonte em notícia, sem veredito na categoria ou com arte que não existe.

Imagem real só entra pelo bloco `imagem:` — `arquivo` (em `publico/imagens/`), `credito`,
`licenca` (`press | cc-by | cedida | propria`) e `alt`. Sem qualquer um dos quatro, ou com mais
de 600 KB, o compilador aborta. O crédito aparece sobre a imagem; a licença vai no HTML; o QA
mede os dois na página. **Foto de veículo é obra dele e não entra** — só material de imprensa
do fabricante, CC BY, cedida ou nossa. Quem não tem imagem licenciada leva arte desenhada.

## Homologação — no ar, na conta do Pedro

**https://instituto-automacao-homolog.desbravando-utv.workers.dev** — o site inteiro na borda da Cloudflare, para ver, testar e mostrar. **Não é produção**:
tudo sai com `X-Robots-Tag: noindex` e `robots.txt` fechado, porque esse endereço não é o
definitivo e não pode virar duplicata do domínio. A produção vai para a conta do sócio quando o
acesso vier — mesmo código, outro `account_id`, sementes rodadas de novo.

```
npm run db:homolog        # D1 remoto: schema + fontes + vozes + seed (idempotente)
npm run deploy:homolog    # compila (rasteriza OG) e publica o env.homolog
npm run qa -- https://instituto-automacao-homolog.desbravando-utv.workers.dev       # o QA contra o site publicado (3 diferenças esperadas, ver SPRINT-V2 §13)
node qa/revisao.mjs https://instituto-automacao-homolog.desbravando-utv.workers.dev # a revisão com rede de verdade
```

O cron roda a cada 15 min na homologação — é onde o coletor é testado de verdade (`/saude` mostra a
última coleta e o ambiente).

## Rotas

| Rota | O que é |
|---|---|
| `/` | capa: parceiro, uma peça manda, as seguintes, a lista, artigos, o relógio, relatórios e agenda, quem escreve |
| `/noticias` · `/noticias/<slug>` | o que o setor publicou lá fora, lido e escrito em português |
| `/artigos` · `/artigos/<slug>` | o que ensina: guias e conceitos, assinados (seção criada em 07/09, ainda sem peça) |
| `/relatorios` · `/relatorios/<slug>` | o que apuramos com dado próprio |
| `/giro` · `/giro/<ano>-s<NN>` | o balanço da semana |
| `/agenda` · `/agenda/<slug>` | eventos, com filtro por URL e `schema.org/Event` |
| `/blueprints` | método, veredito, fontes e o robots de cada uma |
| `/glossario` | como escrevemos os termos |
| `/autores` · `/autores/<slug>` | quem escreve: página de cada autor (papel, bio, peças, link para o currículo) e o convite "Escreva no Instituto" (POST `/autores/escrever`) |
| `/apoie` | a única página comercial: o espaço de parceiro da capa, o que ele não compra, e o formulário (POST `/apoie/enviar`) |
| `/feed.xml` · `/feed/<secao>.xml` · `/sitemap.xml` · `/robots.txt` · `/favicon.svg` | — |
| `/saude` | healthcheck: banco, peças, última coleta |

Todo caminho da v1 (`/industria`, `/panorama`, `/analise/...`) redireciona com 301.

## Estrutura

```
conteudo/            AS PEÇAS. noticias/ artigos/ relatorios/ giro/ arte/ — markdown + SVG
conteudo/autores/    QUEM ESCREVE. um .md por pessoa (nome, papel, ordem, link?, foto?) + bio no corpo; toda peça aponta para um deles pelo nome
colheita/            a pauta e os ledgers (fora do git, exceto lidos.json)
src/index.tsx        monta as páginas, os cabeçalhos de segurança (CSP por hash), a 404 e o cron
src/paginas/         uma página por arquivo: capa · secoes (e a peça) · agenda · glossario · blueprints · marca · autores · apoie · formularios · redirects · estatico
src/parceiros.ts     quem apoia (lista no código, entra por commit); vazia → o espaço da capa diz de quem é
src/conteudo/        tipos e o índice do conteúdo compilado
src/coletor/         feed · robots · sitemap · canonicalização
src/giro/            semana ISO e a auditoria de números
src/ui/              Documento, primitivas, marca, capa gerada, JSON-LD
publico/             assets estáticos (fora do bundle): imagens/ com licença · autores/ (retratos, quadrados) · parceiros/ (logos) · dados/ (CSV) · fontes/ (woff2 self-hosted) · marca/ · icones/ · og/ (gerado) · _headers (cache e segurança dos assets) · manifest.webmanifest
design/              tokens, base, componentes — o sistema de design
scripts/             colher · lavrado · ler · nova · dossie · compilar · sondar · cadência
qa/verificar.mjs     o QA por medição (afirma e falha); qa/SPRINT-*.md o que cada rodada revelou
qa/revisao.mjs       a revisão com Playwright (mede e registra); qa/REVISAO-*.md as notas
tour/                o tour narrado: roteiro-site.mjs (conteúdo) + motor/ (narrar, gravar, montar — copiado dos tutoriais do Mettria) + gerar.mjs
design/marca/        MARCA.md — a marca prototipal; os arquivos ficam em publico/marca/ e a prancha em /marca
schema.sql           o D1 (fonte, item, assunto, evento, glossário, correção, assinante, contato)
migracoes/           ALTER TABLE para banco que já tem dado — 006 (07/09): assinante.atuacao/empresa + tabela contato
```

## Documentação — o que vale e o que está velho

| Vale | |
|---|---|
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | **como o sistema funciona**, para entender sozinho: pastas, requisição, cron, banco, conteúdo, QA, ambientes, receitas, vocabulário, status |
| [docs/CONCEPCAO-V2.md](docs/CONCEPCAO-V2.md) | **a concepção vigente**: princípio, três eixos, todas as decisões |
| [docs/EXECUCAO-V2.md](docs/EXECUCAO-V2.md) | o plano de obra e os treze critérios de "perfeito" |
| [qa/SPRINT-V2.md](qa/SPRINT-V2.md) | o que esta construção entregou e os defeitos que revelou |
| [docs/ROADMAP.md](docs/ROADMAP.md) | **o roadmap vigente** (reescrito em 08/09): onde estamos, o que a reunião com o sócio decidiu, o juridiquês por escrito, marcos e backlog por dono |
| acordo interno | o combinado com o sócio |

Os documentos da v1 (`CONCEITO`, `ARQUITETURA-v1`, `FLUXOS`, `MODELO-DADOS`, `ORGANOGRAMA`,
`CAPACIDADE`, `roadmap.html`) estão em [docs/arquivo-v1/](docs/arquivo-v1/), com um README
dizendo o que cada um era. O que sobreviveu deles está no `ARQUITETURA.md` vigente. Também
valem `docs/FONTES.md` (a sondagem e a coleta real medidas), `design/SISTEMA.md` e
`design/marca/MARCA.md`.

## Coisas que quebram se esquecidas

- **`ctx.waitUntil` em todo trabalho assíncrono do cron.** Promessa não esperada é cancelada
  quando a resposta sai — e o miniflare local deixa terminar.
- **Rota de caminho fixo antes de qualquer curinga.**
- **O `robots.txt` manda, e não há contorno.** Robots ilegível também fica de fora.
- **Cabeçalho HTTP é ASCII.** O `ç` no User-Agent virava 403 em servidor estrito.
- **O ledger da pauta marca na lavra, não na colheita.** Senão a rotina apaga o que ninguém leu.
- **`npm run compilar` antes de tudo.** `dev` e `deploy` fazem sozinhos; editar um `.md` com
  o dev rodando exige rodar de novo.
- **Nada em `conteudo/arte/` com cor crua.** As artes vestem os tokens, e o QA confere.
- **Autor novo = arquivo novo em `conteudo/autores/`** antes da primeira peça dele. O compilador aborta se o `autor:` da peça não bate com um `nome:` de lá. Peça sem autor de verdade não sai — é a promessa do rodapé.
- **Banco que já existe precisa da migração 006** (`npm run db:migrar` local, `db:migrar:homolog` na homologação, `db:migrar:remoto` na produção). Sem ela, a lista falha ao gravar `atuacao` e os formulários de autor/parceiro não têm tabela.
- **Parceiro entra em `src/parceiros.ts`, por commit.** Logo em `publico/parceiros/`. Com a lista vazia a capa mostra o espaço reservado — isso é intencional, não é bug.
- **Mudou `src/ui/tema.ts`? Rode `npm run compilar`.** A CSP só libera o script inline pelo hash
  SHA-256 que o compilador grava no módulo gerado; o QA recalcula do HTML servido e compara.
- **Ferramenta que injeta script na página precisa de `bypassCSP`.** A revisão Playwright injeta o
  axe-core; sem isso a CSP a bloqueia — e o leitor é quem tem de ser protegido, não o teste.
- **Fontes são self-hosted com métricas de fallback** (`size-adjust`, `ascent-override`… em
  `design/base.css`, calculadas por fontTools). Trocar fonte = recalcular; é o que mantém o CLS em zero.
- **`publico/og/` é gerado e está fora do git.** `dev` e `deploy` rodam o compilador, que rasteriza o
  que falta; a máquina do deploy precisa do Chromium do Playwright.
- **O tour é regenerável, não editável.** Mudou uma tela, `npm run tour` com o dev de pé. Precisa de
  internet na hora (edge-tts) e do Chromium do Playwright; o ffmpeg vem por npm. Roteiro sem número
  na fala: os números da capa mudam todo dia e a voz não pode desmentir a tela de amanhã.
- **Imagem sem licença declarada não existe.** A regra do texto vale para a imagem: a licença
  governa, não o formato. "Peguei da matéria" não é licença.
- **Mudou `wrangler.toml`? Reinicie o `dev`.** `[assets]` não recarrega a quente.
- **`publicado` da fonte vem de `colheita/pendentes.json`, nunca de memória.** Seis de sete
  datas chutadas estavam erradas.
- **Saída do `wrangler d1` filtrada por `tail` esconde erro.** Um DELETE barrado por FK passou
  em silêncio; filtre por `error`.
- **`urllib.robotparser` lê o robots.txt com o User-Agent do Python.** Site que devolve 403 a
  esse UA faz o parser responder "não pode" para TUDO. Buscar o robots com o nosso UA e passar o
  texto a `parse()` — três artigos do CIMM quase ficaram de fora por um 403 que não era nosso.
- **Foto sem crédito na página da fonte fica de fora**, mesmo quando o nome do arquivo diz
  "Divulgação". A regra é o que está escrito para o leitor, não o que dá para deduzir.
- **Edição por script sem asserção na âncora é edição não feita.**
- **O QA mede o que dá para medir; a tela ainda precisa de olho.** O botão da navegação
  vazando texto passou por 213 asserções.
