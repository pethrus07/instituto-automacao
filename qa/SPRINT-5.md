# QA · Sprint 5 — obra assinada, feeds e indexação

> 30/08/2026 · `npm run qa` · **119 asserções · 0 falhas · 1 aviso** · +37 do `npm test`
>
> Esta sprint materializa a decisão central do projeto: **impessoal no fluxo, assinado na
> obra.** Até aqui era prosa em documento; agora é código, tela e asserção.

---

## 1. O que entrou

| Peça | O que faz |
|---|---|
| `/analise/<slug>`, `/caso/<slug>`, `/panorama/<slug>` | a obra tem página própria, com URL **sem núcleo** — obra é para durar, e núcleo pode mudar de nome antes do texto envelhecer |
| Leitura do Instituto | **não tem página**: vive dentro do item que comenta, ancorada em `#leitura` |
| `ui/markdown.ts` | markdown mínimo, escrito para texto que chega pelo celular |
| `/panorama` | índice do que é institucional |
| `/feed/<nucleo>.xml` | **fecha o defeito da sprint 0** |
| `/sitemap.xml`, `/robots.txt` | indexação |

---

## 2. O defeito que esta sprint fecha

Na sprint 0 o QA apontou: **o `<head>` anunciava quatro feeds RSS cujas rotas não existiam.**
Promessa no ar sem lastro. Agora existem, e o QA verifica os quatro, um a um — inclusive
que XML mal escapado não passa: **um `&` solto quebra o feed inteiro em qualquer leitor**, e
título de notícia alemã tem `&` com frequência.

---

## 3. A decisão central, virada asserção

| Invariante | Por quê |
|---|---|
| **Análise, Caso e Panorama são sempre assinados** | autoridade não transfere de marca anônima para pessoa, e é autoridade pessoal o objetivo do Instituto |
| **O radar continua sem assinatura** | é agregação; autor ali seria falso |
| A Leitura sai como **voz do núcleo**, não assinada | o formato é curto e o parceiro não quer ser colunista |
| Toda Leitura está **ancorada num item** | Leitura solta não é leitura de nada |
| A página da obra **declara** que é texto assinado | o leitor precisa saber de quem é a responsabilidade |

As duas primeiras linhas são o mesmo teste visto dos dois lados: uma verifica que a obra
**tem** autor, a outra que o radar **não tem**. Se qualquer uma cair, a decisão editorial
foi violada sem ninguém perceber.

---

## 4. Segurança do markdown — 13 conferências novas

O corpo da obra vai chegar **pelo WhatsApp**, digitado no celular. Não é código de confiança.

A ordem é a defesa: **o texto é escapado ANTES de qualquer conversão.** Depois disso não
existe mais `<` nem `>` vindos do autor, e a única marcação que sobra é a que nós geramos.
Escapar depois seria o mesmo que não escapar.

Verificado com entrada hostil:

| Entrada | Resultado |
|---|---|
| `<script>alert(1)</script>` | escapado, vira texto |
| `texto " onmouseover="x` | aspas escapadas, não escapa do atributo |
| `[clique](javascript:alert(1))` | **não vira link** — fica texto literal |
| `[x](data:text/html,<script>…)` | **não vira link** |
| `<img src=x onerror=alert(1)>` | escapado |

Só `http`, `https` e caminho interno viram `<a>`. E link externo sai sempre com
`rel="nofollow noopener" target="_blank"`.

---

## 5. Comparação com o melhor disponível

| Dimensão | Instituto | Melhor disponível | Veredito |
|---|---|---|---|
| Separação fluxo × obra | tipos distintos, tabelas distintas, URLs distintas | a maioria dos veículos mistura tudo em "post" | **acima** |
| Assinatura e responsabilidade | explícita, e declarada na página | padrão nos bons veículos | **empatado** |
| RSS | por núcleo, **com o contexto brasileiro no corpo do item** | feed comum leva só o resumo | **acima** — quem lê por leitor de feed nunca abriria a página sem essa camada |
| Sitemap | inclui obra, item e evento à frente; **exclui evento passado** | correto | **empatado** |
| Markdown | mínimo e auditado contra XSS | bibliotecas maduras (com sanitizador) | **abaixo em recursos, acima em superfície de ataque** |
| Correções públicas | tabela existe, **página não** | 404 Media, The Markup | **abaixo** — sprint 7 |
| OG image por obra | **não existe** | padrão | **abaixo** — sprint 6 |

---

## 6. O que este QA **não** prova

1. **Nenhuma obra real foi escrita.** As duas são ficção de desenvolvimento. O que o QA prova
   é o *mecanismo* da assinatura, não a qualidade do texto.
2. **O markdown não passou por fuzzing.** Treze entradas hostis escolhidas por mim é melhor
   que zero e muito menos que um sanitizador maduro. Se o corpo passar a vir de fonte menos
   controlada que os dois sócios, isto precisa ser revisto.
3. **Os feeds não foram abertos num leitor real** (Feedly, NetNewsWire, Thunderbird). São XML
   bem formado com os campos certos; validar de verdade exige URL pública.
4. **O sitemap não foi submetido ao Search Console** — de novo, exige URL pública.
5. **Sem navegador**, ainda: a obra é a página com mais texto do site, e a medida de leitura,
   o ritmo vertical e a tipografia em coluna longa **não foram vistos renderizados**.
6. **Sem volume:** o sitemap tem teto de 200 por consulta e nenhuma paginação. Passa disso e
   fica silenciosamente incompleto — **não há alerta para esse caso.**

---

## 7. Situação

```
119 asserções · 0 falhas · 1 aviso (fontes do Google)
 37 conferências de unidade · 0 falhas  (feed, URL, markdown, XSS)
  2 obras · 15 URLs no sitemap · 4 feeds no ar
IA em simulação · custo R$ 0,0000
```

**Defeito da sprint 0 encerrado.** Aberto para a sprint 6: OG image, glossário público e a
página de correções.
