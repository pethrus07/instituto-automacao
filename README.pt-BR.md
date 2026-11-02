# Instituto Automação

[English](README.md) · Português

Site de notícias de automação industrial em português: https://institutoautomacao.com.br.
Lê o que o setor publica no mundo, escolhe o que importa para quem opera no Brasil e escreve
em português, com crédito e link para a fonte em todo texto.

## Status

Em produção desde 28/09/2026. Atualizado em 01/11/2026. Projeto em sociedade com um parceiro
do setor de automação industrial, que é dono do domínio.

## O problema

A notícia de automação sai primeiro em inglês, alemão e japonês. Quem opera fábrica no Brasil
fica sabendo tarde ou não fica. O site encurta esse caminho e mede quanto tempo um assunto leva
para chegar aqui (o "relógio").

## Como funciona

- **Colher.** Um Cloudflare Worker colhe a cada 15 minutos os feeds de mais de 20 fontes do setor. Ele
  obedece o `robots.txt` de cada uma, agrupa itens por assunto e grava no D1.
- **Escrever.** Duas vezes ao dia uma tarefa agendada roda o Claude Code (modelo da Anthropic)
  num clone só dela. Ele lê a pauta pública (`/pauta.json`), escreve até 2 notícias seguindo
  [docs/REDACAO.md](docs/REDACAO.md), passa pela revisão automática (`npm run redacao -- conferir`)
  e faz push. O Worker não tem modelo nem chave de API.
- **Publicar.** Todo push no `main` que mexe no site roda no GitHub Actions: compila, testa,
  sobe um banco de teste, roda o QA inteiro e só então faz o deploy. Qualquer erro aborta.
- **Toda semana.** O Giro (boletim gerado dos números, sem modelo) sai na segunda, a pauta
  para o editor no sábado, a cópia do banco no domingo. Um vigia confere o site de hora em hora.

## Stack

TypeScript, [Hono](https://hono.dev) com JSX no servidor, Cloudflare Workers e D1 (SQLite),
conteúdo em Markdown no git, Playwright e axe-core para o QA, GitHub Actions para publicar.
O Node roda os scripts com `--experimental-strip-types` (Node 24).

## Rodar localmente

```bash
npm install
npm run db:zero       # banco local do zero: schema, sementes e migrações
npm run dev           # compila o conteúdo e sobe em http://localhost:8787
```

Banco local que já tem dado: `npm run db:migrar` em vez de recriar (`schema.sql` começa com
`DROP TABLE`).

## Testes

```bash
npm test              # as 7 suítes de unidade; não tocam em produção
npm run tipos         # tsc --noEmit
npm run qa            # QA por medição contra o site local rodando (sai 1 se falhar)
npm run revisao       # Playwright: CLS, axe, alvos de toque, links, screenshots
```

Em 01/11/2026: `npm test` passou 147 de 147 verificações, nas 7 suítes.

## Estrutura

```
conteudo/      notícias, artigos, relatórios, Giro, autores e artes (Markdown + SVG)
src/           o Worker: páginas, coletor, Giro, pauta, interface, segurança
publico/       arquivos estáticos (imagens com licença, fontes, marca)
design/        tokens e componentes do sistema de design
scripts/       compilador, coletor local, redação, testes, ferramentas do editor
qa/            QA por medição e revisão com Playwright
migracoes/     alterações de banco para quem já tem dado
tour/          tour narrado do site (gerado)
docs/          arquitetura, manual da redação, roadmap, histórico
```

## Arquitetura

Diagramas (casos de uso, processo, C4) em [docs/arquitetura/](docs/arquitetura/).
O funcionamento inteiro, com as armadilhas conhecidas, está em
[docs/ARQUITETURA.md](docs/ARQUITETURA.md). O que vem a seguir: [docs/ROADMAP.md](docs/ROADMAP.md).

## Decisões e limites conhecidos

- O `robots.txt` manda. Fonte que bloqueia robô fica de fora, sem contorno.
- Imagem só com licença declarada (imprensa, CC BY, cedida, própria ou a imagem de
  compartilhamento da matéria, com crédito). Sem isso o compilador aborta.
- Texto próprio sobre o fato, nunca tradução integral de terceiro.
- Conteúdo pago sai rotulado. Notícia e Giro não são vendáveis; o compilador recusa.
- A redação depende de um notebook ligado. Se ele estiver desligado no horário, a edição
  atrasa ou não sai; o vigia avisa depois de dois dias sem notícia.
- A documentação interna está em português.

## Licença

Todos os direitos reservados. Publicado como portfólio; sem licença de reuso. Veja [LICENSE](LICENSE).
