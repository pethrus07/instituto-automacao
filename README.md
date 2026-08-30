# Instituto Automação

> O que o setor publicou lá fora hoje, em português, hoje.

Veículo semi-institucional que traduz notícia internacional de automação para o português
no mesmo dia — e que, ao fazer isso todo dia por uma máquina, acumula a base longitudinal
que responde a pergunta que o Instituto persegue: **quanto tempo a automação leva para sair
da fronteira lá fora e chegar ao chão de fábrica daqui.**

Um único Worker na Cloudflare serve as páginas, roda o coletor no cron e (a partir do v0)
recebe o webhook do WhatsApp que faz as vezes de backoffice.

## Rodar local

Não precisa de acesso à Cloudflare: o D1 roda em disco local.

```bash
npm install
npm run db:local      # aplica o schema
npm run db:semente    # dado fictício, só para ter o que renderizar
npm run dev           # http://localhost:8787
```

Conferir: `curl localhost:8787/saude`

| Rota | O que é |
|---|---|
| `/` | capa com os núcleos e o atraso medido |
| `/industria`, `/observatorio`, `/operacao`, `/edificacoes` | radar do núcleo |
| `/<nucleo>/<slug>` | item |
| `/agenda` | entra no v0 |
| `/a/app-<hash>.css` | o sistema de design, com cache imutável |
| `/saude` | healthcheck |

## Estrutura

```
CONCEITO.md        por que existe, e as decisões editoriais
acordo interno          o que está combinado com o sócio — e o que ainda não
design/            o sistema de design (tokens, primitivas, specimen)
docs/              arquitetura, fluxos, organograma, modelo de dados, roadmap
docs/roadmap.html  painel visual do projeto
schema.sql         o D1 inteiro
seed.sql           dado fictício de desenvolvimento
src/index.tsx      as rotas
src/ui/            Documento e primitivas em JSX
```

Comece por [`docs/roadmap.html`](docs/roadmap.html) — é a vista de como a máquina funciona
e do que falta.

## Estado

**Bloco 1 do P0 feito:** Worker, schema completo, rotas de leitura sobre o D1, sistema de
design servido pelo próprio Worker. O coletor entra no bloco 2.

Marco do P0: **14/09/2026**. Detalhe em [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Coisas que quebram se esquecidas

- **`ctx.waitUntil` em todo trabalho assíncrono do cron.** Promessa não esperada é cancelada
  quando a resposta sai — e o miniflare local deixa terminar, então o defeito só aparece em
  produção.
- **Rota de caminho fixo antes de `/:nucleo`.** O curinga casa primeiro e devolve 404.
- **`fonte.licenca` nega por padrão.** Só `liberada` permite tradução integral. Fonte nova
  nasce `resumo` até alguém ler os termos e gravar `licenca_evidencia`.
- **Classificação e atraso entram desde o primeiro item**, mesmo sem tela que mostre.
  Notícia sai do ar e feed não guarda histórico: o que não for gravado agora está perdido.
- **Nunca republicar imagem de terceiro.** Capa é sempre OG própria gerada.
