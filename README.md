# Instituto Automação

> O que o setor publicou lá fora hoje, em português, hoje.

Veículo semi-institucional que traduz notícia internacional de automação para o português
no mesmo dia — e que, ao fazer isso todo dia por uma máquina, acumula a base longitudinal
que responde a pergunta que o Instituto persegue: **quanto tempo a automação leva para sair
da fronteira lá fora e chegar ao chão de fábrica daqui.**

Um único Worker na Cloudflare serve as páginas, roda o coletor e o Giro no cron e (a partir
do v0) recebe o webhook do WhatsApp que faz as vezes de backoffice.

## Rodar local

Não precisa de acesso à Cloudflare: o D1 roda em disco local.

```bash
npm install
npm run db:local      # aplica o schema
npm run db:semente    # dado fictício, só para ter o que renderizar
npm run db:fontes     # as fontes reais sondadas
npm run db:vozes      # as pessoas públicas
npm run dev           # http://localhost:8787
```

Se o banco já existir e o schema tiver mudado, use `npm run db:migrar` em vez de recriar:
`schema.sql` começa com `DROP TABLE`, e **item não coletado não volta** — feed guarda só as
últimas dezenas de entradas.

```bash
npm test              # 94 conferências de unidade: parser, robots, sitemap, semana, auditoria
npm run qa            # 199 asserções contra o site rodando (precisa do dev em outra aba)
npm run cadencia      # quanto cada fonte publica por semana, medido no feed
npm run sondar        # sonda candidatos a fonte
npm run sondar:vozes  # sonda candidatos a voz
```

`npm run qa` sai com código 1 se algo falhar. É o portão antes de qualquer deploy.
Conferir rápido: `curl localhost:8787/saude`

## Rotas

| Rota | O que é |
|---|---|
| `/` | capa institucional: núcleos, destaque, atraso medido |
| `/industria`, `/observatorio`, `/operacao`, `/edificacoes` | radar do núcleo, com filtro por veredito e paginação |
| `/<nucleo>/<slug>` | o item |
| `/giro` · `/giro/<ano>-s<NN>` | **o Giro da Semana** — balanço semanal com o placar do destaque |
| `/agenda` · `/agenda/<slug>` | eventos, com filtro por URL e `schema.org/Event` |
| `/panorama` · `/analise/<slug>` · `/caso/<slug>` | a obra assinada |
| `/blueprints` | dataset, método, licenças e **o veredito do robots de cada fonte** |
| `/glossario` | os termos travados na tradução |
| `/feed/<nucleo>.xml` · `/sitemap.xml` · `/robots.txt` | — |
| `/a/app-<hash>.css` | o sistema de design, com cache imutável |
| `/saude` | healthcheck |

## Estrutura

```
CONCEITO.md          por que existe, e as decisões editoriais
acordo interno            o que está combinado com o sócio — e o que ainda não

docs/ARQUITETURA.md  uma decisão por eixo, com as alternativas descartadas
docs/FLUXOS.md       o caminho de cada coisa, da origem à tela
docs/MODELO-DADOS.md as tabelas, e por que cada coluna existe
docs/FONTES.md       o que foi sondado, o que responde, o que o robots recusa
docs/CAPACIDADE.md   quanto entra por semana, quanto sai, e onde é o gargalo
docs/ORGANOGRAMA.md  quem faz o quê
docs/ROADMAP.md      sprints, marcos e próximos passos
docs/roadmap.html    painel visual do projeto

design/              o sistema de design (tokens, primitivas, specimen, referências)
qa/verificar.mjs     o QA por medição
qa/SPRINT-*.md       o que cada sprint entregou, e os defeitos que ela revelou

schema.sql           o D1 inteiro, para banco novo
migracoes/           ALTER TABLE para banco que já tem dado
seed.sql             dado fictício de desenvolvimento
fontes.sql           as fontes reais
vozes.sql            as pessoas públicas

src/index.tsx        as rotas e o handler do cron
src/config.ts        núcleos, cache, o cron do Giro
src/db.ts            as consultas das páginas
src/coletor/         feed · robots · sitemap · canonicalização
src/pipeline/        triagem → tradução → contexto
src/giro/            agregar → redigir → auditar → publicar
src/ia/              cliente, preços, teto de custo, as etapas
src/ui/              Documento, primitivas, capa gerada, JSON-LD
```

Comece por [`docs/roadmap.html`](docs/roadmap.html) — é a vista de como a máquina funciona
e do que falta.

## Estado — 01/09/2026

**O P0 está funcionalmente completo, e a sprint 1 entregou mais que o previsto.** Rodando
localmente: coleta real com `robots.txt` obedecido, pipeline com teto de custo, os quatro
núcleos, agenda, obra, blueprints, glossário e o Giro da Semana.

| | |
|---|---:|
| fontes cadastradas · ativas | 33 · 30 |
| fontes que o `robots.txt` recusa | 4 |
| vozes (pessoa pública com nome próprio) | 10 |
| itens na base | ~500 |
| entrada medida | ~2.950 itens/semana |
| QA | 199 asserções · 0 falhas |
| unidade | 94 conferências |

**O que ainda não é real, e é bom dizer:** a IA roda em **simulação**. Sem a chave da conta
do sócio (`ANTHROPIC_API_KEY` + `IA_CONTA`), o pipeline e o Giro devolvem texto
determinístico e custo zero — dá para exercitar a esteira inteira sem gastar da conta de
ninguém. E **nada foi deployado**: falta o acesso à Cloudflare.

Marco do P0: **14/09/2026**. Detalhe e próximos passos em [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Coisas que quebram se esquecidas

- **`ctx.waitUntil` em todo trabalho assíncrono do cron.** Promessa não esperada é cancelada
  quando a resposta sai — e o miniflare local deixa terminar, então o defeito só aparece em
  produção.
- **Rota de caminho fixo antes de `/:nucleo`.** O curinga casa primeiro e devolve 404.
- **`fonte.licenca` nega por padrão.** Só `liberada` permite tradução integral. Fonte nova
  nasce `resumo` até alguém ler os termos e gravar `licenca_evidencia`.
- **O `robots.txt` manda, e não há contorno.** Sem trocar o User-Agent, sem proxy, sem
  navegador disfarçado. Fonte com robots ilegível também fica de fora: sem regra legível não
  há autorização a supor.
- **Cabeçalho HTTP é ASCII.** O `ç` de "automação" no nosso User-Agent fazia o workerd avisar
  a cada requisição, e servidor que rejeita byte alto devolve 403 — um bloqueio que pareceria
  decisão da fonte e era nosso.
- **O cron do Giro mora em dois arquivos que não se leem** (`src/config.ts` e
  `wrangler.toml`). Mudar só um faz o Giro **parar de sair sem erro nenhum**. O QA confere.
- **Edição do Giro publicada não é reescrita**, e o agregado dela fica congelado em JSON.
  Balanço que se reescreve não é balanço.
- **Classificação e atraso entram desde o primeiro item**, mesmo sem tela que mostre.
  Notícia sai do ar e feed não guarda histórico: o que não for gravado agora está perdido.
- **Nunca republicar imagem de terceiro.** Capa é sempre OG própria gerada.
- **Edição por script sem asserção na âncora é edição não feita.** Vale para qualquer
  alteração em lote nestes arquivos.
