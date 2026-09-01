# QA · Sprint 1 — o robots.txt manda, e o que fazer quando ele diz não

> 01/09/2026 · `npm run qa` · **182 asserções · 0 falhas · 1 aviso** · +69 do `npm test`
>
> Resposta à pergunta *"vamos pensar num método scrapper para pegar desses globais que
> proíbem"*. A resposta curta é: **não vamos furar bloqueio.** A longa está aqui.

---

## 1. A decisão, e por que ela não é moralismo

Existe técnica para contornar: trocar o `User-Agent`, sair por proxy residencial, subir
navegador sem cabeça para parecer gente. Funciona. E o argumento contra não é ético abstrato,
é **interno ao produto**:

> O diferencial do Instituto é publicar em `/blueprints` o link que autoriza cada fonte.
> **Uma fonte obtida furando bloqueio apareceria nessa tabela como o quê?**

Não há resposta. A página que sustenta a credibilidade do projeto seria a primeira a mentir.
Então a postura virou código, e o código virou asserção de QA.

Três caminhos legítimos, em ordem de esforço:

| # | Caminho | Estado |
|---|---|---|
| 1 | **Ler o `robots.txt` antes de coletar e obedecê-lo**, inclusive `Crawl-delay` | ✅ feito |
| 2 | **Sitemap de notícias** onde o robots permite e o feed não | ✅ feito |
| 3 | **Pedir acesso** à publicação | pendente — rascunho da mensagem |

---

## 2. Antes: três 403 tratados como uma coisa só

A sondagem de 31/08 devolveu 403 para Control Engineering, Automation World e WEG, e o
relatório dizia "bloqueiam robô". Ao **medir o `robots.txt` de cada uma**, eram três casos
diferentes:

| Fonte | `robots.txt` | O que quer dizer |
|---|---|---|
| Control Engineering | **200** · `User-agent: * / Allow: /`, mas bloqueia por nome Amazonbot, CCBot, **ClaudeBot**, Bytespider | rastreador comum pode; o 403 é WAF, não política. A intenção contra IA é clara |
| Automation World | **403** no próprio `robots.txt` | sem regra legível **não há consentimento a inferir** |
| WEG | **403** | idem |
| The Robot Report | **200** · libera tudo e pede **`Crawl-delay: 10`** | estava liberado, e a gente não respeitava o pedido |

Três verdades diferentes achatadas numa frase só. O inventário agora carrega o veredito **de
cada uma**, com o motivo em português e a data em que foi conferido.

---

## 3. O que a medição descobriu — e custou

Rodado o coletor com `robots.txt` ligado, **5 das 23 fontes saíram do radar** — e todas as
cinco tinham entrado na expansão de 31/08, a que descobriu que "fórum, vídeo e release também
são RSS":

| Fonte | Regra | Saída legítima |
|---|---|---|
| **Canaltech** | `Disallow: /rss/` | ✅ **sitemap de notícias** — implementado |
| Reddit · r/PLC | `Disallow: /r/PLC/.rss` | API OAuth (credencial) |
| YouTube · Automation Direct | `Disallow: /feeds/` | YouTube Data API (chave) |
| GitHub · n8n releases | `Disallow: /*.atom$` | REST API — o próprio `robots.txt` a oferece |
| GitHub · Home Assistant releases | `Disallow: /*.atom$` | idem |

**A expansão do radar era mais frágil do que parecia.** Feed existir não é o mesmo que feed
poder ser lido, e a sondagem media a primeira coisa achando que media a segunda.

### 3.1 O Canaltech não fechou a porta — indicou outra

O mesmo `robots.txt` que diz `Disallow: /rss/` anuncia
`Sitemap: https://canaltech.com.br/smap/sitemap-news.xml`, e o `/smap/` **não** está proibido.

O sitemap-news traz **título, data e URL** — que é **100% do que a medição de atraso precisa.**
O Instituto nunca precisou do texto de ninguém: precisa saber *quando* cada assunto foi
publicado, e o resumo que publicamos é escrito por nós. O Canaltech é fonte `marca_relogio`
(nunca é publicada, existe para marcar quando o assunto chegou ao Brasil), então o sitemap
serve **inteiro** para o papel dela.

Isto não é contorno. É usar a porta que a própria fonte apontou.

### 3.2 A dívida que ninguém queria: 50 itens coletados antes de perguntar

O coletor rodou desde 31/08 sem ler `robots.txt`. Quando o veredito chegou, **já havia 50 itens
de três fontes que dizem não** (Reddit 25, YouTube 15, GitHub 10). Nenhum publicado.

Ficar com eles tornaria **falsa** uma frase que o `/blueprints` publica: *"fonte que bloqueia
robô não entra"*. Base que contradiz a própria página de método vale menos que a base menor.
Apagados na migração `003`, e o invariante virou asserção:

```sql
SELECT COUNT(*) FROM item i JOIN fonte f ON f.id = i.fonte_id WHERE f.robots_permite = 0
```

→ tem de ser `0`, e o QA cai antes do deploy se não for. **As fontes continuam na tabela**, com
o veredito à vista: sumir com elas esconderia exatamente o que o inventário existe para mostrar.

---

## 4. Defeitos encontrados por medir

### 4.1 O nosso próprio `User-Agent` era inválido ⚠️

```
InstitutoAutomacaoBot/0.1 (+https://…/transparencia; radar de automação)
                                                                    ^
```

O `ç` de "automação". Cabeçalho HTTP não é UTF-8, e o workerd avisava **a cada requisição**:

> A header value for "user-agent" contains non-ASCII characters […] in a browser this would
> likely result in a TypeError

Servidor que rejeita byte alto devolve 403 — **um bloqueio que teria parecido decisão da fonte
e era nosso.** O nome do bot já era ASCII; a descrição atrás dele não. Corrigido para
`radar de automacao`.

Vale como regra: **texto que sai em cabeçalho HTTP é ASCII.**

### 4.2 O `Crawl-delay` do The Robot Report estava sendo perdido

O arquivo real começa assim:

```
Crawl-delay: 10
# START YOAST BLOCK
User-agent: *
Disallow:
```

O `Crawl-delay` vem **antes do primeiro `User-agent`** — fora de qualquer grupo. Pelo padrão,
diretiva fora de grupo é indefinida e pode ser ignorada, que era o que o parser fazia, em
silêncio. Mas a intenção de quem escreveu está clara. Agora vale como **piso global** quando o
grupo aplicável não trouxer o seu, e o teste usa o arquivo real, não uma versão arrumada.

### 4.3 O QA contava metade dos testes e não sabia

`npm test` passou a rodar duas suítes, cada uma imprimindo o próprio placar. O QA lia o
resultado com `exec` — que casa **a primeira ocorrência** — e anunciava `51 conferências`
quando 69 tinham rodado.

Terceira vez que um teste meu mede errado. **Medição errada é pior que medição nenhuma, porque
parece medição.** Agora soma com `matchAll` e **exige ≥ 2 placares**: suíte que morrer antes de
imprimir derruba o QA em vez de sumir da conta.

### 4.4 `Disallow:` vazio encerrava a leitura cedo demais

A primeira versão tratava `Disallow:` (vazio = libera tudo) com `return true` imediato. Num
grupo que trouxesse `Disallow:` **e** um `Disallow: /admin` depois, o segundo nunca seria lido.
Não havia caso real ainda — havia um bug esperando um. Agora só é ignorado, e a leitura segue.

---

## 5. Como o veredito é obtido, e com que cuidado

| Situação | Veredito | Por quê |
|---|---|---|
| `robots.txt` 200 e permite | **permite** | — |
| `robots.txt` 200 e proíbe o caminho | **não permite** | — |
| `robots.txt` **404** | permite | ausência de regra é resposta legítima |
| `robots.txt` **403 / erro / timeout** | **não permite** | sem regra legível não há autorização a supor |
| ainda não conferido | **não conferido** | e a tabela diz isso, em vez de ficar em branco |

Outras decisões:

- **Grupo do nosso nome vence o curinga**, e a comparação é **por prefixo**, não por pedaço
  solto: `User-agent: ClaudeBot` não é regra sobre nós, e `User-agent: bot` também não.
- **Reconferido a cada 7 dias.** Fonte muda de ideia, e reconferir é barato perto do custo de
  coletar quem pediu para não ser coletado.
- **Fonte recusada não ocupa vaga no tick** — sai no `WHERE`, mas volta quando o veredito vence.
- **`Crawl-delay` é esperado de verdade** entre o `robots.txt` e o feed (mesmo host, requisições
  seguidas), com teto de 15 s por tick, **e** vira piso do intervalo entre coletas.
- **Índice de sitemaps desce um nível, e só um.** Descer é necessário; descer sem limite é como
  um coletor vira um rastreador do site inteiro — que é o que não queremos ser. O `robots` do
  filho é reconferido, porque as regras são por caminho, não por domínio.

---

## 6. O que o QA passou a medir

| Asserção | Por quê |
|---|---|
| nenhum item vem de fonte que o `robots.txt` recusa | é a promessa do `/blueprints`, virada invariante de banco |
| o inventário publica o veredito de **toda** fonte | `data-robots` conta a propriedade, não a instância |
| as recusadas continuam listadas, dizendo que foram recusadas | esconder seria esconder o ponto |
| o texto do inventário confere com a contagem do banco | número em prosa é afirmação, e afirmação se verifica |
| o método declara que **não** contornamos bloqueio | a postura tem de estar onde o leitor lê |
| toda fonte tem colheita conhecida (`feed`/`sitemap`) | a migração não pôde levar o `CHECK`; a asserção ocupa o lugar |
| nenhuma fonte é coletada mais rápido que o `Crawl-delay` dela | o pedido só vale se for medido |
| a suíte de unidade reporta **≥ 2 placares** | ver 4.3 |

**15 testes novos de unidade** só para o parser de `robots.txt`, com arquivos reais do Control
Engineering e do The Robot Report, e **9** para o de sitemap. O erro aqui é assimétrico: parser
generoso demais faz o Instituto coletar quem pediu para não ser coletado; rigoroso demais custa
uma fonte, e isso aparece no inventário.

---

## 7. O que fica em aberto

1. **Coletor por API com credencial** — GitHub REST, Reddit OAuth, YouTube Data. São JSON, não
   RSS: coletor novo, e o `robots.txt` do GitHub literalmente oferece a API no comentário do
   topo. Backlog.
2. **Pedido de acesso** a Control Engineering, Automation World e WEG. Não é código.
3. **Control Engineering** merece uma segunda medição: o `robots.txt` permite e o 403 veio do
   WAF. Vale perguntar antes de tratar como bloqueio deliberado.
4. **Sitemap onde o feed é ruim, não só onde é proibido** — algumas fontes têm sitemap-news mais
   completo que o RSS.
