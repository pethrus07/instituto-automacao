# QA · Sprint 0

> 30/08/2026 · executado com `npm run qa` contra o Worker local
> **67 asserções · 0 falhas · 1 aviso** — e 24 conferências adicionais do parser (`npm test`)

Este relatório só afirma o que o script conseguiu **medir**. O que não foi medido está na
seção 6, e não conta como aprovado.

---

## 1. Resumo

| Eixo | Asserções | Veredito |
|---|---|---|
| **A · Funcional** — rotas, cabeçalhos, banco | 22 | passa |
| **B · Conformidade** — o site cumpre o que os documentos prometem | 17 | passa |
| **C · Qualidade** — semântica, contraste, peso, parser | 28 | passa, com 1 pendência conhecida |

**Três defeitos foram encontrados e corrigidos durante a sprint.** Nenhum deles apareceria
na tela como erro — os três falhariam em silêncio, que é a categoria que interessa.

---

## 2. Defeitos encontrados e corrigidos

### 2.1 Ordem de limpeza do feed — teria posto HTML dentro de todo resumo do site
Feed entrega HTML **escapado** (`&lt;p&gt;`). A limpeza tirava as tags **antes** de
decodificar, então o escape passava ileso pela limpeza e só virava tag no final.

Consequência se tivesse ido: `<p>` e `<b>` no resumo de todo item, sem nada na tela apontando
a causa. **Pego pelo teste do parser**, não por leitura de código.
Ordem correta: CDATA → decodifica → tira tag → decodifica de novo.

### 2.2 Rota de caminho fixo depois do curinga — `/saude` e `/agenda` davam 404
`/:nucleo` casava primeiro. Pego pelo teste de rota. É o tipo de defeito que reaparece toda
vez que uma rota nova é adicionada, então virou linha no README.

### 2.3 O próprio teste de `noopener` estava errado
Exigia `noopener` **depois** de `target="_blank"`; o `rel` vem antes. Acusava defeito onde não
havia. Corrigido para analisar a âncora inteira, sem depender da ordem dos atributos.

> Registro deliberado: **verificação errada é pior que verificação nenhuma**, porque manda
> consertar o que está certo e gasta confiança na suíte.

---

## 3. A · Funcional — o que foi exercitado de verdade

**Rotas** — 10 conferidas: capa, os quatro núcleos, agenda, saúde, item, item inexistente e
núcleo inventado. Todas no status esperado, incluindo os dois 404.

**Cache** — medido no cabeçalho da resposta, não no código:

| Rota | `Cache-Control` medido | Conforme `config.ts` |
|---|---|---|
| listagem | `public, max-age=0, s-maxage=300` | ✅ |
| item | `public, max-age=0, s-maxage=3600` | ✅ |
| CSS | `public, max-age=31536000, immutable` | ✅ |

**CSS com hash antigo continua servindo** — conferido de propósito: se um hash velho
devolvesse 404, um leitor com folha em cache veria a página crua.

**Coletor** — exercitado contra feed real antes de ser comitado: 20 itens na 1ª passada,
**0 novos e 20 repetidos na 2ª**. Erro por fonte gravado em `ultimo_erro`, com três causas
distintas nas fontes fictícias (`HTTP 404`, `feed sem entradas legíveis`, erro interno).

---

## 4. B · Conformidade — as regras do projeto, verificadas no banco

Aqui está a parte que mais importa, porque são as regras que o projeto **promete em
documento**. Cada uma virou uma consulta SQL que falha o QA se for violada:

| Regra prometida | Onde está escrita | Como é verificada |
|---|---|---|
| **Tradução integral só de fonte liberada** | CONCEITO §8, ARQUITETURA §8 | `item.modo='traducao'` cruzado com `fonte.licenca<>'liberada'` → tem de dar 0 |
| Nenhum item de fonte bloqueada | CONCEITO §8 | junção com `licenca='bloqueada'` → 0 |
| Fonte liberada tem evidência do que autoriza | FONTES.md | `licenca='liberada' AND licenca_evidencia IS NULL` → 0 |
| Todo item publicado tem slug | MODELO-DADOS | → 0 |
| Nenhuma URL canônica duplicada | ARQUITETURA §0 | `GROUP BY ... HAVING COUNT(*)>1` → 0 |
| Nenhum item publicado antes da fonte | — | `minutos_apos_fonte < 0` → 0 |
| Nenhum atraso negativo | ARQUITETURA §6 | `atraso_br_dias < 0` → 0 |
| As 9 tabelas do modelo existem | MODELO-DADOS | lista conferida contra `sqlite_master` |

A primeira é a que justifica o projeto poder existir: **tradução integral de matéria alheia é
obra derivada.** Ela deixou de ser uma promessa em prosa e virou uma asserção que quebra o QA.

**O site também diz o que prometeu dizer** — conferido no HTML entregue:
núcleo em modo Radar se declara; núcleo quente não exibe o aviso; o relógio aparece; o
"o que isso muda aqui" tem marcação própria; item traduzido sem revisão mostra o selo; toda
fonte é creditada com link; e a página do item explica como ele foi produzido.

### Divergências entre o planejado e o construído

Não são defeitos — são decisões tomadas no caminho. Ficam como pergunta:

| # | Planejado | Construído | Por quê |
|---|---|---|---|
| 1 | Coletor era da sprint 1 | entregue na sprint 0 | o bloco 1 rendeu; a folga foi para a sprint 1 |
| 2 | `/agenda` só no v0 | página existe, dizendo o que vai ser | o link do menu não podia estrear com 404 no ativo mais importante do projeto |
| 3 | Glossário semente "no código" | está no `seed.sql`, como tabela | ficou melhor: já é dado consultável, e o pipeline lê de lá na sprint 2 |
| 4 | Publicação automática de fonte liberada + confiança alta | **não implementada** | é da sprint 2 (pipeline). Hoje o coletor só grava `coletado` |

---

## 5. C · Comparação com o melhor disponível

Onde o Instituto está em relação a quem faz bem cada coisa.

### 5.1 Peso e desempenho

| | Instituto (medido) | Referência do setor |
|---|---|---|
| HTML da capa | **5,7 KB** | portal de notícia típico: centenas de KB de HTML |
| HTML do radar | **7,9 KB** | idem |
| CSS | **28,2 KB** (um arquivo, `immutable`) | 100–400 KB em várias folhas é comum |
| JavaScript | **0 externo · 1 inline (~380 B)** | 0,5–3 MB é o normal em portal |
| Requisições da página | **2** (HTML + CSS) + fontes | dezenas a centenas |
| Resposta do radar | **29 ms** local | — |

**Veredito:** nesta dimensão estamos na faixa dos melhores — a companhia é Hacker News e
sites de texto puro, não portais de notícia. É consequência direta de decidir SSR com zero JS
no cliente, e não de otimização depois.

⚠️ O número real do usuário ainda vai mudar quando as fontes entrarem: hoje elas vêm do
Google e não estão contadas como custo próprio (ver 5.4).

### 5.2 Acessibilidade

| Critério | Instituto | Alvo |
|---|---|---|
| Contraste de texto | **todos os tokens medidos** (tabela abaixo) | WCAG 2.2 AA · 4,5:1 |
| Um `h1` por página | ✅ nas 3 páginas | — |
| Landmarks e skip link | ✅ | — |
| `lang="pt-BR"` | ✅ | — |
| Imagem sem `alt` | nenhuma | — |
| `prefers-reduced-motion` | respeitado no CSS | **não verificado em navegador** |
| Ordem de foco e leitor de tela | — | **não testado** (ver 6) |

Contraste medido sobre o papel, nos dois temas. A afirmação estava escrita em
`design/SISTEMA.md` desde ontem — agora está provada:

| Token | Claro | Escuro |
|---|---|---|
| `--ink` | 16,97:1 | 15,81:1 |
| `--ink-muted` | 6,99:1 | 7,26:1 |
| `--ink-faint` | 3,52:1 | 3,73:1 |
| `--industria-ink` (laranja) | **5,27:1** | 9,09:1 |
| `--observatorio-ink` (azul) | 8,38:1 | 9,03:1 |
| `--live` (relógio) | 4,87:1 | 10,82:1 |

O laranja no tema claro é o mais apertado do conjunto — **5,27:1**, com folga de 0,77 sobre o
mínimo. É exatamente o que a decisão dos dois pesos previa: se ele clarear, reprova. Fica como
número a vigiar a cada mudança de tema.

### 5.3 Curadoria e agregação

| | Instituto | Melhor disponível |
|---|---|---|
| Agrupamento de assunto | normalização de título + fornecedores + janela | Techmeme e Google News: clustering com sinal muito mais rico |
| Curadoria | portão de licença + fila humana (sprint 4) | Techmeme: humano em cima de algoritmo |
| Tradução | **integral, no dia, com glossário travado** | ninguém faz isso em PT-BR para automação |
| Contexto local | **"o que isso muda aqui" em todo item** | agregador não faz — só lista |
| Medição de atraso | **`assunto.atraso_br_dias`** | não conheço equivalente |

**Veredito:** perdemos em clustering — e é uma perda real, que aparece quando o volume subir.
Ganhamos nas três últimas linhas, que são justamente o motivo de o projeto existir. O
agrupamento simples é decisão consciente com gatilho de revisão (embeddings quando errar
demais), não descuido.

### 5.4 SEO e distribuição

| Item | Estado |
|---|---|
| `<title>`, description, canonical, OG, `lang` | ✅ |
| JSON-LD (`NewsArticle`, `Event`) | ❌ — sprint 3 e 6 |
| `sitemap.xml` e `robots.txt` | ❌ — sprint 6 |
| RSS por núcleo | ❌ — declarado no `<head>`, **rota ainda não existe** |
| OG image própria | ❌ — sprint 6 |
| Fontes self-hosted | ❌ — **única pendência que o QA acusou como aviso** |

⚠️ **Achado do QA:** o `<head>` já anuncia quatro feeds RSS que ainda não existem. Não quebra
nada hoje, mas é uma promessa no ar sem lastro. Ou a rota entra, ou o anúncio sai — decisão
para a sprint 6, registrada aqui para não passar batido.

### 5.5 Postura editorial

| | Instituto | Referência |
|---|---|---|
| Crédito e link à fonte | ✅ em todo item | padrão do bom agregador |
| Declarar uso de IA | ✅ selo de revisão pendente + "como este item foi produzido" | acima da média do mercado |
| Política editorial pública | ❌ sprint 7 | 404 Media, The Markup |
| Registro público de correções | tabela existe, **página não** — sprint 7 | idem |
| Transparência sobre mantenedor | por gatilho (CONCEITO §4) | — |

---

## 6. O que este QA **não** prova

A parte mais importante do relatório, porque tudo aqui está fora do "0 falhas":

1. **Nenhum navegador foi aberto.** Layout, quebra de linha, tipografia renderizada, reflow em
   320 px, `prefers-reduced-motion` de verdade e o botão de tema **não foram verificados**.
   Só o HTML e o CSS como texto.
2. **Nada de acessibilidade assistiva.** Ordem de foco, leitor de tela e navegação só por
   teclado não foram testados. Contraste calculado ≠ interface acessível.
3. **O coletor não foi exercitado contra fonte hostil** — feed gigante, XML malformado de
   verdade, redirecionamento em cadeia, `Content-Type` mentiroso, timeout no meio do corpo.
4. **Nada rodou em produção.** Tudo é local, com `wrangler dev`. `ctx.waitUntil` está no lugar
   certo por inspeção, mas **o comportamento que ele protege só se manifesta em produção**.
5. **O dado é semente.** Três itens fictícios. Nenhum volume, nenhuma concorrência de escrita.

### Para a sprint 1, o QA precisa ganhar

- [ ] **Playwright** — layout, foco, teclado, 320 px, os dois temas, e `axe-core` para
      acessibilidade real
- [ ] Fixtures de **feed hostil** no `npm test`
- [ ] Verificação em produção assim que houver deploy (o item 4 não fecha antes disso)
- [ ] Teste de volume: 500 itens no radar, medindo tempo de consulta e peso da página

---

## 7. Como rodar

```bash
npm run dev          # numa aba
npm run qa           # noutra   (npm run qa -- 8788 para outra porta)
npm test             # parser e canonicalização, sem rede
```

O QA sai com código 1 se qualquer asserção falhar — serve de portão antes de deploy.
