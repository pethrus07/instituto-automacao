# Instituto Automação

> O que o setor de automação publica lá fora, lido daqui.

Veículo semi-institucional. Lê o que o setor de automação publica no mundo, escolhe o que
importa para quem opera no Brasil, escreve em português com crédito e link para a fonte em
toda peça — e mede quanto tempo cada assunto leva para chegar aqui.

**A máquina colhe. Uma pessoa decide. Alguém escreve. O git publica.** Não há inteligência
artificial em produção: nenhuma peça é traduzida ou redigida por modelo, e o QA confere isso
no bundle compilado.

## Rodar local

```bash
npm install
npm run db:local      # aplica o schema
npm run db:semente    # glossário e eventos de exemplo
npm run db:fontes     # as fontes reais
npm run db:vozes      # as pessoas públicas
npm run dev           # compila o conteúdo e sobe em http://localhost:8787
```

Banco que já tem dado: `npm run db:migrar` em vez de recriar — `schema.sql` começa com
`DROP TABLE`, e item colhido não volta.

```bash
npm test              # 89 conferências de unidade: parser, robots, sitemap, semana ISO, auditoria
npm run qa            # 213 asserções contra o site rodando — sai com código 1 se falhar
```

## O ciclo de trabalho

| Tempo | Quem | Comando |
|---|---|---|
| **1 · Colher** | máquina | `npm run colher` — obedece o `robots.txt`, deduplica, escreve `colheita/pauta.md` |
| **2 · Decidir** | Pedro | lê a pauta e marca o que vira peça; `npm run lavrado` esvazia |
| **3 · Escrever** | — | `npm run ler -- <url>` traz o artigo; `npm run nova -- noticias <slug> --url <url>` cria o arquivo |
| **4 · Publicar** | git | `npm run compilar` → `npm run qa` → commit → `npm run deploy` |
| **semanal** | — | `npm run dossie` traz os números; o Giro é escrito em cima |

O conteúdo mora em `conteudo/**.md` com frontmatter. O compilador **aborta** sem autor, sem
fonte em notícia, sem veredito na categoria ou com arte que não existe.

Imagem real só entra pelo bloco `imagem:` — `arquivo` (em `publico/imagens/`), `credito`,
`licenca` (`press | cc-by | cedida | propria`) e `alt`. Sem qualquer um dos quatro, ou com mais
de 600 KB, o compilador aborta. O crédito aparece sobre a imagem; a licença vai no HTML; o QA
mede os dois na página. **Foto de veículo é obra dele e não entra** — só material de imprensa
do fabricante, CC BY, cedida ou nossa. Quem não tem imagem licenciada leva arte desenhada.

## Rotas

| Rota | O que é |
|---|---|
| `/` | capa: uma peça manda, as seguintes, o relógio, agenda, lista |
| `/noticias` · `/noticias/<slug>` | o que o setor publicou lá fora, lido e escrito em português |
| `/relatorios` · `/relatorios/<slug>` | o que apuramos com dado próprio |
| `/giro` · `/giro/<ano>-s<NN>` | o balanço da semana |
| `/agenda` · `/agenda/<slug>` | eventos, com filtro por URL e `schema.org/Event` |
| `/blueprints` | método, veredito, fontes e o robots de cada uma |
| `/glossario` | como escrevemos os termos |
| `/feed.xml` · `/feed/<secao>.xml` · `/sitemap.xml` · `/robots.txt` · `/favicon.svg` | — |
| `/saude` | healthcheck: banco, peças, última coleta |

Todo caminho da v1 (`/industria`, `/panorama`, `/analise/...`) redireciona com 301.

## Estrutura

```
conteudo/            AS PEÇAS. noticias/ relatorios/ giro/ arte/ — markdown + SVG
colheita/            a pauta e os ledgers (fora do git, exceto lidos.json)
src/index.tsx        as rotas e o cron
src/conteudo/        tipos e o índice do conteúdo compilado
src/coletor/         feed · robots · sitemap · canonicalização
src/giro/            semana ISO e a auditoria de números
src/ui/              Documento, primitivas, marca, capa gerada, JSON-LD
publico/             assets estáticos do Worker (fora do bundle): imagens/ com licença · dados/ (CSV)
design/              tokens, base, componentes — o sistema de design
scripts/             colher · lavrado · ler · nova · dossie · compilar · sondar · cadência
qa/verificar.mjs     o QA por medição; qa/SPRINT-*.md o que cada rodada revelou
schema.sql           o D1 (fonte, item, assunto, evento, glossário, correção, assinante)
migracoes/           ALTER TABLE para banco que já tem dado
```

## Documentação — o que vale e o que está velho

| Vale | |
|---|---|
| [docs/CONCEPCAO-V2.md](docs/CONCEPCAO-V2.md) | **a concepção vigente**: princípio, três eixos, todas as decisões |
| [docs/EXECUCAO-V2.md](docs/EXECUCAO-V2.md) | o plano de obra e os treze critérios de "perfeito" |
| [qa/SPRINT-V2.md](qa/SPRINT-V2.md) | o que esta construção entregou e os defeitos que revelou |
| acordo interno | o combinado com o sócio |

⚠️ **Descrevem a v1 e ainda não foram reescritos:** `CONCEITO.md`, `docs/ARQUITETURA.md`,
`docs/FLUXOS.md`, `docs/MODELO-DADOS.md`, `docs/ORGANOGRAMA.md`, `docs/ROADMAP.md`,
`docs/CAPACIDADE.md`, `docs/roadmap.html`. O que sobreviveu neles (robots, canonicalização,
sistema de design, método do QA) continua certo; o resto — pipeline de IA, quatro núcleos,
teto de custo — morreu em 03/09/2026. A reescrita é a última etapa da execução, de propósito:
documento antes do código descreve intenção, e esse era o defeito.

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
- **Imagem sem licença declarada não existe.** A regra do texto vale para a imagem: a licença
  governa, não o formato. "Peguei da matéria" não é licença.
- **Mudou `wrangler.toml`? Reinicie o `dev`.** `[assets]` não recarrega a quente.
- **`publicado` da fonte vem de `colheita/pendentes.json`, nunca de memória.** Seis de sete
  datas chutadas estavam erradas.
- **Saída do `wrangler d1` filtrada por `tail` esconde erro.** Um DELETE barrado por FK passou
  em silêncio; filtre por `error`.
- **Edição por script sem asserção na âncora é edição não feita.**
- **O QA mede o que dá para medir; a tela ainda precisa de olho.** O botão da navegação
  vazando texto passou por 213 asserções.
