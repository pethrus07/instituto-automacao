# Como o Instituto funciona — v2, 01/09/2026

> Substitui o desenho anterior, em que um pipeline de IA rodava em produção e
> publicava sozinho. **Aquilo produzia volume. Isto produz peça.**

---

## A mudança, em uma frase

**A máquina colhe. A gente lavra. O git publica.**

Nada é escrito por modelo em produção. Nada vai ao ar sem passar por leitura
humana. O Worker fica burro de propósito: ele só serve o que já está pronto.

---

## Por que mudou

O desenho anterior era defensável no papel e falhou na medição. Em dois dias
de operação real:

| | |
|---|---:|
| itens coletados | ~500 |
| **peças publicadas** | **0** |
| assuntos com atraso apurado | 0 |
| fontes que autorizam tradução integral | 0 |

E a dependência que travava tudo — a chave de API na conta de outra pessoa —
não é uma pendência administrativa: é uma **fragilidade de arquitetura**. Um
veículo que para de existir quando uma fatura não é paga não é um veículo.

Havia também a contradição de fundo: a nota que orienta o projeto diz que
*ninguém cita agregador*, e o que estava sendo construído era um agregador com
boa engenharia. 90% do esforço foi para a metade que não constrói autoridade.

---

## Os três tempos

### 1 · COLHER — máquina, local, sem IA, custo zero

```bash
npm run colher            # varre todas as fontes ativas
npm run colher -- --tudo  # inclui o que já foi visto antes
```

Busca cada fonte, **obedece o `robots.txt`**, deduplica por URL canônica, tira
HTML e entidade do resumo, normaliza a data. Escreve um arquivo de colheita
**feito para ser lido por gente**: agrupado por fonte, ordenado por data,
com título, link e resumo limpo.

Não chama modelo nenhum. Não gasta nada. Não sobe nada para lugar nenhum.

O que ele guarda entre execuções é só o **livro de vistos** (`vistos.json`):
as URLs canônicas já colhidas. É o que faz a colheita seguinte mostrar
**apenas o que é novo** — que é a diferença entre ler 40 linhas e ler 500.

```bash
npm run ler <url>         # baixa UM artigo e extrai o texto legível
```

A leitura profunda é sob demanda, e só do que a gente escolheu. Confere o
`robots.txt` daquele caminho antes, tira navegação, rodapé e propaganda, e
entrega o texto limpo. É o insumo do tempo 2.

### 2 · LAVRAR — aqui, com você

Eu leio a colheita. Escolhemos o que importa. Eu escrevo em português — não
traduzo palavra a palavra: escrevo, com o contexto que a gente sabe e o modelo
não saberia, e com o termo técnico que um engenheiro brasileiro reconheceria.

**É aqui que a qualidade nasce, e é trabalho de leitura e escrita.** Não é
prompt. Não é temperatura. Não tem teto de custo porque não tem custo.

O resultado é um arquivo:

```
conteudo/
  radar/2026-09-01-novo-clp-siemens.md
  analise/2026-09-05-o-que-mudou-no-chao-de-fabrica.md
  giro/2026-s36.md
```

Markdown com frontmatter. Um arquivo por peça.

### 3 · PUBLICAR — o git é o CMS

```bash
npm run compilar   # conteudo/**.md → src/conteudo.gerado.ts
npm run qa         # o portão
npm run deploy
```

**Revisão por diff. Histórico por commit. Correção rastreável por log.** Não
existe conteúdo fora do git, e não existe publicação sem alguém ter lido.

---

## O que saiu da máquina

| Saiu | Por quê |
|---|---|
| pipeline de IA em produção | o que ele produzia era volume, e volume não era o problema |
| `custo_dia`, teto diário, kill-switch | não há custo a conter |
| `IA_CONTA`, `IA_SIMULAR`, chave da API | **a trava nº 1 do projeto desaparece.** O Instituto deixa de depender da conta de alguém |
| cron do pipeline a cada 15 min | o Worker não processa nada |
| Giro gerado por modelo | o Giro continua semanal, e passa a ser escrito |
| selo "tradução automática · revisão pendente" | **não existe mais tradução automática.** O selo era honesto; agora é desnecessário |

## O que ficou, e ficou melhor

| Ficou | Como muda |
|---|---|
| coletor (feed, sitemap, robots, canonicalização) | vira **ferramenta de pesquisa local**, mais rica: pode trazer o texto inteiro para eu ler |
| `robots.txt` obedecido, sem contorno | a regra continua igual, e agora vale para um scraper de leitura, não de republicação |
| inventário público de fontes | continua, e fica mais forte: cada peça tem autor humano |
| sistema de design | **é aqui que "beleza" vira trabalho**, e agora sobra tempo para isso |
| QA por medição | continua sendo o portão do deploy |
| agenda | dado factual e durável; não precisava de IA e não passa a precisar |

---

## O que isso muda no que se promete

**A licença fica mais simples e mais forte.** Não há republicação automática de
nada. Toda peça passou por leitura humana, tem autor e tem crédito. A faixa
`liberada`, que autorizava tradução integral por máquina, deixa de ser
necessária para o produto existir — vira uma permissão a mais, não um
pré-requisito.

**A cadência fica honesta.** Em vez de "180 a 440 peças por semana conforme o
teto de custo", passa a ser o que a gente consegue fazer bem. Menos, e
assinado.

**O gargalo muda de lugar, e é o lugar certo.** Antes era dinheiro de terceiro.
Agora é atenção — que é o recurso que o projeto de fato quer investir.

---

## O que ainda não está decidido

Registrado aqui para não virar suposição:

1. **O recorte.** O guarda-chuva de quatro núcleos foi decidido no dia 1 e é o
   que gera 2.950 entradas por semana. Com o produto passando a ser peça em vez
   de volume, o recorte provavelmente encolhe.
2. **A pergunta-assinatura.** "Quanto tempo a automação leva para chegar aqui"
   **não é medível** com fontes generalistas — medido: 491 assuntos, zero pares
   internacional↔brasileiro. Ou troca de pergunta, ou troca de fontes, ou
   espera.
3. **A cadência-alvo.** Quantas peças por semana é "bom o bastante" sem virar
   obrigação que some no mês 2.
