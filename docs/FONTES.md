# Fontes — o que foi sondado, o que responde, e o que a coleta real mostrou

## Sondagem de 01/09/2026 — medida, não suposta

`npm run sondar` busca cada candidato de verdade e passa o XML pelo nosso
próprio parser. **19 de 36 responderam com item legível.** O resultado está em
[`fontes.sql`](../fontes.sql), e o inventário público em `/blueprints`.

### O que bloqueia robô

| Fonte | Status |
|---|---|
| Control Engineering | **403** |
| Automation World | **403** |
| WEG | **403** |
| Reddit (em chamadas seguidas) | **429** — limite de taxa |

Três das principais publicações do setor ficam **fora do radar**. Isso muda o
plano da sprint 1: não adianta insistir, adianta procurar quem quer ser lido.

O 429 do Reddit virou correção no coletor: **no máximo uma fonte por host a
cada tick.** O cron volta em 15 min e pega as que ficaram, então nada se perde
e paramos de bater na porta de quem acabou de responder.

### O que não tem feed, medido

**X/Twitter** e **LinkedIn** não têm feed público, e a API do X é paga.
Sondados de propósito para o "não dá" ficar registrado em vez de suposto.

### O que ninguém tinha percebido: quase tudo é RSS

Fórum, artigo acadêmico, rede social, vídeo e release de produto **também
publicam RSS**. O coletor que já existia serve sem uma linha nova:

| Tipo | Fonte | O que traz |
|---|---|---|
| `forum` | Reddit r/PLC, fórum Home Assistant | o problema aparece ali antes de virar notícia |
| `academico` | arXiv eess.SY e cs.RO | a ponte com a universidade, 84 e 144 itens por feed |
| `social` | Mastodon por hashtag | RSS por conta e por tag, sem autenticação |
| `video` | YouTube por canal | feed nativo |
| `release` | GitHub releases | changelog é factual, datado, e ninguém traduz |

## A primeira coleta real — 367 itens, 0 erros

Três ticks, 19 fontes. E os dados reais entregaram três achados que fixture
nenhuma teria produzido:

**1. Post de microblog não tem `<title>`.** O parser descartava — "sem título
não há item", certo para notícia e errado para rede social, onde o post *é* o
conteúdo. Sem a correção, o Instituto simplesmente não enxergaria Mastodon.
Agora o título vem da primeira frase do texto.

**2. O agrupamento por título é fraco, e agora há prova.** 367 itens geraram
**361 assuntos** — só 2 com mais de um item. E há um caso que qualquer humano
agruparia na hora:

> *"Learn how to self-host n8n on a local Ubuntu 26.04 LTS using Docker Compose"*
> *"How to Self-Host n8n Locally on Ubuntu 26.04 LTS with Docker Compose"*

Mesma matéria, dois assuntos diferentes. **É o mesmo conteúdo em duas fontes —
exatamente o que o `assunto` existe para juntar.** O gatilho para embeddings
que estava no backlog deixou de ser hipótese.

**3. `idioma` da fonte não é o idioma do item.** Uma conta marcada como `en`
no Mastodon trouxe post em coreano. Para tradução isso importa: o idioma tem
de ser detectado por item, não herdado da fonte.

## O robots.txt manda — medido em 01/09/2026

Depois da primeira coleta, o coletor passou a **ler o `robots.txt` antes de buscar**. A postura
é a mesma do resto do projeto: **não contornamos bloqueio.** Sem trocar a identificação do
robô, sem proxy, sem navegador disfarçado. O argumento decisivo é interno ao produto —

> O diferencial do Instituto é publicar em `/blueprints` o link que autoriza cada fonte.
> Uma fonte obtida furando bloqueio apareceria nessa tabela como o quê?

### Os três 403 eram três casos diferentes

| Fonte | `robots.txt` | Leitura |
|---|---|---|
| Control Engineering | **200**, libera o curinga, bloqueia por nome Amazonbot/CCBot/ClaudeBot/Bytespider | o 403 é WAF, não política — vale pedir acesso |
| Automation World | **403** no próprio `robots.txt` | sem regra legível não há consentimento a inferir |
| WEG | **403** | idem |
| The Robot Report | **200**, libera, pede `Crawl-delay: 10` | estava liberado e nós é que não respeitávamos |

### E cinco fontes do radar novo caíram

Todas da expansão de 31/08 — a que descobriu que fórum, vídeo e release também são RSS.
**Feed existir não é o mesmo que feed poder ser lido**, e a sondagem media a primeira coisa
achando que media a segunda.

| Fonte | Regra | Saída legítima |
|---|---|---|
| **Canaltech** | `Disallow: /rss/` | ✅ **sitemap de notícias** |
| Reddit · r/PLC | `Disallow: /r/PLC/.rss` | API OAuth (credencial) |
| YouTube · Automation Direct | `Disallow: /feeds/` | YouTube Data API (chave) |
| GitHub · n8n e Home Assistant | `Disallow: /*.atom$` | REST API — oferecida no próprio robots |

### A porta que a fonte apontou

O mesmo `robots.txt` do Canaltech que fecha o `/rss/` **anuncia**
`Sitemap: .../smap/sitemap-news.xml`, e o `/smap/` não está proibido. O sitemap-news traz
**título, data e URL** — que é **100% do que a medição de atraso precisa.** O Instituto nunca
precisou do texto de ninguém: precisa saber *quando* o assunto foi publicado, e o resumo é
escrito por nós.

Por isso `fonte.colheita` agora vale `feed` ou `sitemap`, e o Canaltech — que é
`marca_relogio`, nunca publicada — passou para sitemap sem perder nada do seu papel.

### Os 50 itens coletados antes de perguntar

O coletor rodou dois dias sem ler `robots.txt` e guardou 50 itens de fontes que dizem não.
**Apagados** (migração `003`): mantê-los tornaria falsa a frase que o `/blueprints` publica. As
fontes continuam listadas, com o veredito à vista — sumir com elas esconderia o ponto.

---

## Como classificar

⚠️ **Toda fonte nasce `resumo`.** A sondagem mede se o feed responde; **não
mede permissão.** Subir para `liberada` — o que autoriza tradução integral —
exige alguém ler os termos e gravar `licenca_evidencia`. Nenhuma das 19 subiu
ainda, e o inventário em `/blueprints` mostra isso com todas as letras.

| `licenca` | Critério prático | O que o pipeline faz |
|---|---|---|
| `liberada` | a fonte diz que o material é para imprensa / republicação, ou tem licença aberta | **tradução integral** + crédito + link |
| `resumo` | veículo editorial comum, sem permissão explícita | resumo próprio 3–5 linhas + link. **Nunca** tradução |
| `bloqueada` | paywall, ou termos que proíbem uso automatizado | não entra |

Antes de ligar qualquer fonte: conferir `robots.txt` e os termos de uso.

---

# Anexo — a proposta original de classificação

> 30/08/2026 · **proposta, não inventário verificado**
> Os veículos abaixo são candidatos conhecidos do setor. A **URL de feed** e a **licença de
> cada um precisam ser confirmadas na fonte** antes de ligar o coletor — não presumir.
> O sócio deve revisar principalmente Indústria e as fontes brasileiras: é o domínio dele.

## Como classificar

| `licenca` | Critério prático | O que o pipeline faz |
|---|---|---|
| `liberada` | a própria fonte diz que o material é para imprensa / republicação, ou tem licença aberta (CC-BY, domínio público, open access) | **tradução integral** + crédito + link |
| `resumo` | veículo editorial comum, sem permissão explícita | resumo próprio 3–5 linhas + link. **Nunca** tradução |
| `bloqueada` | paywall, ou termos que proíbem uso automatizado | não entra |

**Toda fonte nova nasce como `resumo`.** Só sobe para `liberada` depois que alguém leu os
termos da sala de imprensa e anotou onde está dito. O campo `licenca_evidencia` guarda o link
dessa página — é o que salva a conversa se alguém reclamar.

Antes de ligar qualquer fonte: conferir `robots.txt` e os termos de uso.

---

## Núcleo Indústria

### Candidatos a `liberada` — salas de imprensa de fabricante
São feitas para ser republicadas. É aqui que mora o "primeira mão".

| Fabricante | Observação |
|---|---|
| Siemens | sala de imprensa própria, volume alto, forte em automação industrial |
| ABB | robótica + eletrificação |
| Rockwell Automation | referência no mercado americano; peso no Brasil |
| Schneider Electric | forte em energia e automação predial também |
| Beckhoff | automação baseada em PC, PLC |
| Omron | automação fabril e visão |
| Mitsubishi Electric | CLP e drives |
| FANUC | CNC e robótica |
| KUKA | robótica industrial |
| Universal Robots | cobots |
| WEG | **fabricante brasileiro** — relações com investidores + sala de imprensa |

### Candidatos a `resumo` — imprensa técnica internacional
| Veículo | País |
|---|---|
| Control Engineering | EUA |
| Automation World | EUA |
| The Robot Report | EUA |
| IEEE Spectrum (robótica / automação) | EUA |
| Imprensa técnica alemã de automação | Alemanha — **a mapear**, é onde nasce muita notícia |

### Brasileiras — **a mapear com o sócio**
Associações e veículos setoriais (ABIMAQ, ABINEE e afins) e portais brasileiros de automação
industrial. Não listados aqui porque não devem ser presumidos: entram depois que o sócio
confirmar quais valem.

---

## Núcleo Observatório (IA e trabalho)

### Candidatos a `liberada`
| Fonte | Observação |
|---|---|
| Salas de imprensa de laboratórios de IA | anúncios de modelo e produto |
| arXiv (categorias de robótica, sistemas e controle) | open access — pode traduzir resumo integral |
| Publicações de órgãos públicos e multilaterais | domínio público em geral |

### Candidatos a `resumo`
Imprensa de tecnologia internacional e análises de mercado sobre IA e trabalho.
**Cuidado especial aqui:** é o tema mais saturado da internet. Filtro deve ser agressivo —
só entra o que tem dado, número ou decisão concreta. Opinião sobre IA não é notícia.

---

## Núcleo Operação (RPA, no-code, agentes)

### Candidatos a `liberada`
Blogs e changelogs oficiais das plataformas: n8n, Make, Zapier, UiPath, Automation Anywhere.
Changelog de produto costuma ser liberado e é excelente matéria-prima — é factual, datado e
ninguém traduz.

### Candidatos a `resumo`
Imprensa de software corporativo e casos publicados por consultorias.

> Lembrete: este núcleo entra em **modo Radar**. O conteúdo próprio dele são os **Casos**,
> escritos a partir do trabalho real, não do radar.

---

## Núcleo Edificações

### Candidatos a `liberada`
Associações e consórcios de padrão (KNX, Matter/CSA e equivalentes) — publicam material
técnico e notas para imprensa. Fabricantes de automação predial.

### Brasileiras
Associação brasileira de automação residencial e integradores — **a mapear**.

---

## Agenda de eventos — fontes

Não são feeds de notícia; são calendários a raspar ou acompanhar. É o ativo mais durável do
projeto, então vale montar com cuidado.

**Internacionais (referência de pauta e de tendência):** Hannover Messe, SPS Nürnberg,
Automatica, Automation Fair.

**Brasil:** FEIMEC, Expomafe, Feira Mecânica, Intermach, FIEE e afins — **confirmar as
edições e datas de 2027 com o sócio**, que conhece o circuito.

**Acadêmicos:** CBA (Congresso Brasileiro de Automática), SBAI (Simpósio Brasileiro de
Automação Inteligente) e congressos regionais. Estes servem a dois propósitos: entram na
agenda **e** são a porta da ponte acadêmica.

---

## Primeiro trabalho braçal

1. Para cada candidato acima: achar o feed (RSS/Atom, ou página a raspar), ler os termos,
   preencher `licenca` + `licenca_evidencia`.
2. Começar **pequeno e liberado**: 8 a 10 salas de imprensa de fabricante já enchem o radar
   de Indústria com material 100% traduzível. O resto entra depois.
3. Só então ligar as fontes `resumo`.
