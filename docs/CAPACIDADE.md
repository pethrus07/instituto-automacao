# Capacidade — quanto entra, quanto sai, e onde é o gargalo

> Medido em **01/09/2026** com `npm run cadencia` (busca cada feed e conta a
> janela real) e `npm run qa`. Refazer sempre que a lista de fontes mudar.

---

## 1. As fontes hoje

| | |
|---|---:|
| cadastradas | **33** |
| ativas | **30** |
| desativadas (exemplos da semente) | 3 |
| **recusadas pelo `robots.txt`** | **4** |
| que respondem e entram no radar | **26** |
| vozes (pessoa pública com nome próprio) | 10 |
| brasileiras que marcam o relógio (não publicadas) | 5 |
| colhidas por sitemap em vez de feed | 1 |

## 2. Quanto cada origem publica por semana

Medido no feed inteiro, não no banco: o coletor guarda no máximo 25 entradas
por busca, então um número tirado do banco diria mais sobre o nosso teto do
que sobre a fonte.

| Origem | Fontes | Itens/semana | Como é colhido |
|---|---:|---:|---|
| **acadêmico** (arXiv cs.RO, eess.SY) | 2 | **1.596** | RSS nativo, rajada diária |
| **imprensa** (IEEE, heise, Verge, Ars, Robot Report, BR…) | 19 | 886 | RSS/Atom |
| **fórum** (Home Assistant, Reddit) | 2 | 305 | RSS do fórum |
| **social** (Mastodon por hashtag) | 1 | 157 | RSS por tag |
| **press** (Siemens, n8n, Home Assistant) | 3 | 9 | RSS da sala de imprensa |
| **release / vídeo** (GitHub, YouTube) | 3 | 0 | 🚫 `robots.txt` recusa |
| **TOTAL** | 30 | **~2.950** | |

E pelo eixo que o Giro usa:

| | Fontes | Itens/semana |
|---|---:|---:|
| redação · fora do Brasil | 17 | 2.472 |
| redação · Brasil | 3 | 443 |
| voz · fora do Brasil | 9 | 23 |
| voz · Brasil | 1 | 15 |

**As 10 vozes somam 38 itens por semana — 1,3% do volume.** Não estão ali por
volume: estão porque *"a IEEE Spectrum noticiou"* e *"Rodney Brooks escreveu"*
não pesam igual. Custam quase nada e são a parte mais densa do Giro.

---

## 3. Dois problemas que a medição revelou

### 3.1 O arXiv sozinho é 54% do volume — e estoura o teto de custo

`ENTRADAS_POR_FONTE = 25`. O feed do arXiv cs.RO trouxe **144 itens hoje**, o
eess.SY trouxe 84. Guardamos 25 de cada.

**119 + 59 = 178 itens por dia entram no radar e são descartados em silêncio.**
Não há erro, não há log, não há nada na tela. O coletor volta em 1 h, pega os
mesmos 25 primeiros, o dedup ignora, e o resto nunca existe.

Pior que a perda: **triar tudo o que o arXiv publica estouraria o teto diário
antes de o Instituto publicar uma linha.**

| Cenário | Itens/dia | Só a triagem | Teto R$ 3,00 |
|---|---:|---:|---|
| tudo, com arXiv | 422 | R$ 4,39 | 🚫 **estoura** |
| sem arXiv | 194 | R$ 2,02 | cabe, com 33% de folga |
| sem arXiv, fórum e social | 128 | R$ 1,33 | cabe folgado |

**Isto é decisão editorial, não técnica**, e está em aberto: cortar o arXiv,
filtrar por palavra-chave antes da triagem, ou tratá-lo como fluxo separado
(um "radar acadêmico" que não disputa espaço com a notícia).

### 3.2 O teto de custo é o gargalo real, não a coleta

Nenhum limite técnico morde antes do dinheiro:

- **coletor**: 8 fontes por tick × 96 ticks/dia — sobra folga para 30 fontes
- **pipeline**: 6 itens por tick × 96 = 576/dia = 4.032/semana
- **custo**: R$ 3,00/dia = **R$ 21/semana**

Custo por item, estimado a partir dos tamanhos **medidos** de prompt
(886 + 986 chars de triagem; 1.499 + 274 de contexto; título 62 e resumo 445
em média), a ~3,6 chars por token e USD 1 = R$ 5,40:

| Etapa | Modelo | Custo | Em quem incide |
|---|---|---:|---|
| triagem | `claude-haiku-4-5` | **R$ 0,0104** | todo item coletado |
| contexto | `claude-sonnet-5` | **R$ 0,0133** | só o que passa na triagem |
| tradução integral | `claude-sonnet-5` | — | só fonte `liberada` — **nenhuma hoje** |

Daí a capacidade, em função da taxa de aprovação da triagem:

| Passa na triagem | Triados/dia | **Publicados/semana** |
|---:|---:|---:|
| 10% | 256 | **~180** |
| 20% | 229 | **~320** |
| 30% | 208 | **~440** |

⚠️ A taxa de aprovação **ainda não foi medida** — o pipeline roda em simulação
(`IA_SIMULAR=1`) e a simulação aprova tudo. O número real só aparece com a
chave da conta do sócio. Até lá, a faixa acima é o intervalo plausível, não
uma previsão.

---

## 4. O que sai por semana, por peça

| Peça | Cadência | Como é feito |
|---|---|---|
| **Radar** (item) | ~180 a 440/semana, limitado pelo custo | coleta → triagem (haiku) → contexto + veredito (sonnet) → publica |
| **Giro da Semana** | **1**, segunda 08:00 BRT | agrega (SQL) → redige (sonnet) → **audita** → publica ou retém |
| **Agenda** | conforme chega | coletor de calendário + formulário público |
| **Obra** (Análise, Caso, Panorama) | 0 automática | texto assinado — é trabalho humano, e é de propósito |

O Radar é volume; a Obra é autoridade; o **Giro é a peça que amarra os dois** —
sai toda semana sem depender de alguém ter tempo na segunda de manhã, e ainda
assim não é agregador, porque o destaque vem de conta publicada e a prosa passa
por auditoria.

---

## 5. O que precisa de decisão

1. **O arXiv fica, sai, ou vira fluxo separado?** É 54% do volume e sozinho
   estoura o teto.
2. **O teto de R$ 3,00/dia é o certo?** Ele define quantas peças saem por
   semana mais do que qualquer outra coisa. Quem paga é o sócio (ACORDO §2).
3. **`ENTRADAS_POR_FONTE = 25` precisa ser por fonte**, não global — ou o
   descarte silencioso continua em qualquer fonte de volume alto.
