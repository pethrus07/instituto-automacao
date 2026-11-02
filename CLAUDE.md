# CLAUDE.md — Instituto Automação

Site de notícias do setor de automação (institutoautomacao.com.br), sociedade do Pedro com o
sócio. Um Worker só da Cloudflare (Hono + D1): o coletor colhe fontes a cada 15 min, o conteúdo
mora em `conteudo/**.md`, o compilador gera o bundle, o git publica.

**A fonte da verdade é `docs/ROADMAP.md`** (fila curta Agora / Depois / Talvez), não memória nem
este arquivo. O diário de decisões até 01/11/2026 está em `docs/HISTORICO.md` (§2k e §2l são as
mais citadas). Pendência nova vai para o ROADMAP; decisão datada, para o HISTORICO.

## Onde está a arquitetura

- `docs/ARQUITETURA.md` — o funcionamento inteiro: pastas, requisição, cron, banco, conteúdo,
  QA, ambientes, receitas, vocabulário. §18 = armadilhas conhecidas; §20 = redação automática.
- `docs/REDACAO.md` — manual da rotina que escreve e publica notícia sozinha (desde 14/10/2026).
- `README.md` (inglês) e `README.pt-BR.md` — visão geral, como rodar e testar, estrutura, limites.
- `docs/CONCEPCAO-V2.md`, `docs/EXECUCAO-V2.md`, `docs/FONTES.md`, `design/SISTEMA.md`,
  `design/marca/MARCA.md`, `acordo interno`. `docs/arquivo-v1/` é histórico.
- Produção é a conta pessoal do Pedro desde 28/09 (HISTORICO §2i); ARQUITETURA §13 já diz isso.

## Rodar e testar (comandos conferidos)

```bash
npm install
npm run db:local      # schema (começa com DROP TABLE — só em banco vazio)
npm run db:semente    # glossário e agenda
npm run db:fontes
npm run db:vozes
npm run dev           # compila e sobe em http://localhost:8787
```

- Banco do zero completo (schema + sementes + migrações 007/008): `npm run db:zero` — é o que o CI usa.
- Banco que já tem dado: `npm run db:migrar`, nunca `db:local` (item colhido não volta).
- `npm test` — as 7 suítes de unidade (obra, pautas, feed, robots, giro, assunto, redação); não toca em produção.
- `npm run tipos` — `tsc --noEmit` nas duas configurações.
- `npm run qa` — QA por medição contra o site rodando (`npm run dev` em outra aba); sai 1 se
  falhar. `npm run qa -- 8788` = outra porta; `npm run qa -- https://…` = site publicado.
- `npm run revisao` — Playwright (CLS, axe, alvos, links), screenshots em `qa/revisao/`.
- `npm run compilar` antes de tudo que lê conteúdo; `dev` e `deploy` já compilam.

Ferramentas do ciclo editorial: `npm run colher`, `npm run lavrado`, `npm run ler -- <url>`,
`npm run nova -- noticias <slug> --url <url>`, `npm run redacao -- candidatas|fonte|conferir|destaque|descartar`
(detalhes em `docs/REDACAO.md`). `npm run dossie`, `npm run giro`, `npm run pauta` e
`npm run submissoes` precisam de `--producao` ou `--homolog`: sem flag leem o banco local, que
fica para trás e devolve semana zerada sem parecer defeito.

## Deploy e o que roda sozinho

- `npm run deploy` = compila + `wrangler deploy --env producao`. `npm run deploy:homolog` = homologação.
- **Push no `main` publica em produção.** `.github/workflows/publicar.yml` dispara em push que
  mexe em `conteudo/`, `publico/`, `src/`, `design/`, `scripts/compilar.ts`, `wrangler.toml`,
  `package.json` ou `package-lock.json`: compila, testa, `db:zero`, QA, deploy.
- Agendados (GitHub Actions, horário de São Paulo): `giro-semanal.yml` segunda 09:00 ·
  `pauta-semanal.yml` sábado 09:00 · `copia-do-banco.yml` domingo 03:00 · `vigia.yml` de hora em
  hora. Giro e Publicar dividem a fila `concurrency: producao`.
- O site anda sozinho desde 11/10 com o segredo `CLOUDFLARE_API_TOKEN` no GitHub (HISTORICO §2k).
- O cron do Worker roda a cada 15 min em homolog e produção (`wrangler.toml`).

## Convenções e armadilhas do repo (ARQUITETURA §18, §20 e README)

- **`ctx.waitUntil` em todo trabalho assíncrono do cron.** Promessa solta é cancelada em
  produção e sobrevive no miniflare local — nenhum teste local pega. Nunca `.catch(() => {})`:
  ou `await`, ou `ctx.waitUntil`, e logar o erro. Depois de publicar, rodar o QA contra produção.
- **Não trocar o `database_id = "PREENCHER-APOS-CRIAR"`** do bloco de cima do `wrangler.toml`:
  é a chave do D1 local; trocar = banco local vazio e QA quebra com "no such table".
- `schema.sql` não traz as migrações 007/008 — banco novo é `npm run db:zero`.
- Mexeu no agrupamento (`src/coletor/assunto.ts`) → `npm run reagrupar`.
- Autor novo = arquivo em `conteudo/autores/` ANTES da peça, senão o build aborta.
- `destaque: true` exige `imagem:` real; o compilador aborta. Licença nunca se afrouxa.
- Frontmatter não aceita comentário na mesma linha. TeX em string JS precisa de `String.raw`.
- CSS geral tem teto de 48 KB no QA: reaproveitar classes. Grade de leitura sempre `minmax(0, 1fr)`.
- Nada de cor crua fora de `tokens.css`, nem em `conteudo/arte/`.
- Cabeçalho HTTP é ASCII. Rota de caminho fixo antes de curinga. O `robots.txt` manda.
- `gerado: true` só no Giro. Notícia automática assina **Redação do Instituto**; nome de pessoa
  só em texto que a pessoa leu.
- Mensagens de commit seguem o padrão do histórico: `noticias: …`, `correcao: …`, `giro: …`,
  `docs: …`, `fix(qa): …`.
- **IA no conteúdo:** desde 14/10 a notícia é escrita por rotina do Claude Code (HISTORICO §2l).
  O Worker continua sem modelo e sem chave de API. A regra antiga "zero IA em produção" foi
  revertida para a notícia — vale o HISTORICO §2l, não memória antiga.

## Cloudflare

- Duas contas: produção na conta pessoal (`oliveiramichaelpedro`), homologação na conta da
  Desbravando (`ryzecode08`). Os `account_id` estão fixados por ambiente no `wrangler.toml`.
- wrangler não é global: usar `npx wrangler` (ou os scripts do `package.json`).
- **Nunca rodar `wrangler login`** (desde 14/10/2026): ele sobrescreve o perfil da outra conta.
  Acesso local por token: `& "C:\Users\olive\Projetos\manutencao-xps\cf.ps1" usar pessoal npx wrangler …`
  (produção) ou `usar ryze` (homolog), rodando da pasta do projeto.

## Regras do Pedro

- **Deploy, push no `main` e qualquer publicação só com OK explícito do Pedro.** Push no `main`
  já é deploy de produção. **Exceção com OK permanente (Pedro, 14/10/2026):** a redação
  automática (`scripts/redacao-local.ps1`, seguindo `docs/REDACAO.md`) commita e dá push de
  notícia — `conteudo/noticias/`, `publico/imagens/`, `conteudo/descartadas.txt` — sem perguntar.
  Só isso: código, docs e workflows continuam pedindo OK.
- Commits em português, **sem** trailer `Co-Authored-By` e sem "Generated with Claude Code".
- Hook global de pre-commit com gitleaks em `C:\Users\olive\.git-hooks\pre-commit`
  (`core.hooksPath` global), que encadeia o hook local do repo. **Nunca usar `--no-verify`.**
- Patch com regex ou contrabarra vai por arquivo (Write/Edit), nunca `node -e` inline no Git
  Bash — as contrabarras são comidas e o código pode sair válido e errado.
- Nunca copiar token, senha ou segredo para arquivo versionado, log ou resposta. Credencial sai
  da fonte inteira, nunca redigitada. `.env` e `.dev.vars` são gitignorados.
- Diferença entre o que está no ar e o que o design/doc diz vira pergunta, não conserto.
- Para o sócio/cliente fala-se de resultado, não de ferramental (MCP, API, rotinas).
- Reportar em três estados: relatado · verificado · não feito.
