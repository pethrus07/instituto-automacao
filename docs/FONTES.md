# Fontes — proposta inicial para classificação

> 28/08/2026 · **proposta, não inventário verificado**
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
