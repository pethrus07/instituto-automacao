# Instituto Automação

English · [Português](README.pt-BR.md)

An industrial automation news site in Brazilian Portuguese: https://institutoautomacao.com.br.
It reads what the industry publishes worldwide, picks what matters to people running plants
in Brazil, and writes it in Portuguese, with credit and a link to the source in every piece.

## Status

In production since 2026-09-28. Updated 2026-11-01. Built as a partnership with a partner in
the industrial automation sector, who owns the domain.

## The problem

Automation news comes out first in English, German and Japanese. People running factories in
Brazil hear about it late, or not at all. The site shortens that path and measures how long a
topic takes to reach Brazil (the "clock").

## How it works

- **Collect.** A Cloudflare Worker fetches the feeds of more than 20 industry sources every
  15 minutes. It obeys each site's `robots.txt`, groups items by topic and stores them in D1.
- **Write.** Twice a day a scheduled task runs Claude Code (Anthropic's model) in its own
  clone. It reads the public queue (`/pauta.json`), writes up to 2 news pieces following
  [docs/REDACAO.md](docs/REDACAO.md), passes the automatic review (`npm run redacao -- conferir`)
  and pushes. The Worker has no model and no API key.
- **Publish.** Every push to `main` that touches the site runs on GitHub Actions: build, unit
  tests, a test database, the full QA, and only then the deploy. Any error stops everything.
- **Weekly.** The Giro (a bulletin generated from the numbers, no model) comes out on Monday,
  the editor's queue on Saturday, the database backup on Sunday. A watchdog checks the site
  every hour.

## Stack

TypeScript, [Hono](https://hono.dev) with server-side JSX, Cloudflare Workers and D1 (SQLite),
Markdown content in git, Playwright and axe-core for QA, GitHub Actions to publish.
Scripts run on Node 24 with `--experimental-strip-types`.

## Run locally

```bash
npm install
npm run db:zero       # fresh local database: schema, seeds and migrations
npm run dev           # builds the content and serves http://localhost:8787
```

A local database that already has data: use `npm run db:migrar` instead of recreating it
(`schema.sql` starts with `DROP TABLE`).

## Tests

```bash
npm test              # the 7 unit suites; they never touch production
npm run tipos         # tsc --noEmit
npm run qa            # measurement QA against the running local site (exits 1 on failure)
npm run revisao       # Playwright: CLS, axe, tap targets, links, screenshots
```

On 2026-11-01, `npm test` passed 147 of 147 checks across the 7 suites.

## Folders

```
conteudo/      news, articles, reports, Giro, authors and artwork (Markdown + SVG)
src/           the Worker: pages, collector, Giro, queue, UI, security headers
publico/       static files (licensed images, fonts, brand)
design/        design system tokens and components
scripts/       compiler, local collector, newsroom, tests, editor tools
qa/            measurement QA and Playwright review
migracoes/     database changes for databases that already hold data
tour/          narrated site tour (generated)
docs/          architecture, newsroom manual, roadmap, history
```

## Architecture

Diagrams (use cases, process, C4) are in [docs/arquitetura/](docs/arquitetura/).
The full description, with known pitfalls, is in [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
What comes next: [docs/ROADMAP.md](docs/ROADMAP.md).

## Decisions and known limits

- `robots.txt` rules. A source that blocks robots stays out, no workaround.
- Images only with a declared license (press kit, CC BY, granted, our own, or the article's
  share image with credit). Without it the compiler aborts.
- Own text about the facts, never a full translation of someone else's article.
- Paid content is labeled. News and the Giro cannot be sponsored; the compiler refuses.
- The newsroom depends on a laptop being on. If it is off at the scheduled time, the edition is
  late or skipped; the watchdog alerts after two days without news.
- Internal documentation is in Portuguese.

## License

All rights reserved. Published as portfolio; not licensed for reuse. See [LICENSE](LICENSE).
