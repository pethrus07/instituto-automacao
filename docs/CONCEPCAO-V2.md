# Instituto Automação — concepção v2

> **Planejamento fechado em 03/09/2026.** Substitui a concepção de 30/08, que
> era defensável no papel e falhou na medição: dois dias de operação real,
> ~500 itens coletados, **0 peças publicadas**.
>
> Todas as decisões abaixo foram tomadas pelo Pedro nesta data. O que ficou em
> aberto está no fim, nomeado.

---

## O princípio que atravessa tudo

**Hoje todas as decisões são do Pedro.** Não é detalhe de processo — é
restrição de projeto.

Um sistema com portão humano em cada peça **não pode ter volume**. Se o
gargalo é a atenção de uma pessoa, tudo que aumenta o número de coisas que
essa pessoa precisa olhar é dano, mesmo quando parece produtividade. O desenho
anterior otimizava dinheiro (teto de custo de API) e ignorava atenção — por
isso produziu 500 itens e nenhuma peça.

A v2 inverte: **o recurso escasso é o tempo do Pedro, e o desenho inteiro
existe para gastá-lo bem.**

## O recorte, que é o primeiro dominó

**Obra em PME, radar em industrial.**

O que se **escreve** sai de onde há o que ninguém tem: automação de processos
e agentes para pequena e média empresa — Commagente, retífica, Mary House,
Expert Work. Casos com custo real aberto.

O que se **colhe** é automação industrial internacional, que dá pauta,
sustenta o nome e alimenta o Giro.

## O que essas decisões já mataram

- **o backoffice de WhatsApp** — existia para o sócio publicar
- **a Leitura do Instituto** — o formato semanal dele
- **os quatro núcleos** — Indústria perdeu o dono, Operação e Edificações
  nunca tiveram
- **o pipeline de IA em produção**, o teto de custo, a chave de API de terceiro

---

# 1 · VISUAL

## O que o site passa a ser

Deixa de parecer **portal de notícia** e passa a parecer **instituto que
publica pouco e bem**.

A diferença é estrutural, não estética: jornal com pouca notícia parece
falido; revista com poucas matérias parece escolhida. Com 3 peças por semana o
site **precisa** ler como a segunda — senão a escassez vira sinal de abandono.

Referências que mandam: **Our World in Data** (o número como protagonista),
**The Markup** (método publicado como seção), **Rest of World** (uma manchete
manda), **Max Planck** e **Igarapé** (instituto que respira).

## As três seções

| Na navegação | O que é | Cadência |
|---|---|---|
| **Notícias** | o que o setor lançou lá fora, em português, com o que muda aqui | 3/semana |
| **Relatórios** | o que apuramos com dado próprio: Caso com custo aberto, Análise, Panorama | 1/mês |
| **Agenda** | o calendário do setor | conforme chega |

O **Giro** é semanal e não é uma quarta seção: é a peça que dá **largura** —
as principais notícias e acontecimentos da semana, inclusive o que não virou
peça. As peças dão profundidade; o Giro dá cobertura.

> É o Giro que justifica colher 130 itens por semana para escrever 3. Sem ele,
> os outros 127 seriam desperdício; com ele, têm destino.

## O que muda na tela

| Onde | Antes (volume) | Agora (peça) |
|---|---|---|
| **Capa** | listagem paginada, itens pequenos | **uma peça em destaque com imagem licenciada ou arte própria**, 3-4 abaixo, a agenda, o relógio. Sem paginação |
| **Seção** | radar com filtro e paginação | as peças daquela seção, inteiras, com espaço |
| **Peça** | item com selo de revisão pendente | **texto assinado**, largura de leitura, imagem ou arte no topo, autor e data |
| **Espaço** | apertado, havia muito para caber | **generoso** — é o que separa "curado" de "abandonado" |

**Some:** paginação, listagem infinita, selo "tradução automática · revisão
pendente" (não existe mais tradução automática), filtro por veredito na
listagem (filtrar 3 peças é enfeite).

**Imagem real (decisão de 04/09/2026).** O Pedro pediu as imagens reais das
notícias. A regra da imagem é a mesma do texto — *a licença governa, não o
formato* — então entra **material de imprensa do fabricante** (existe para ser
republicado, com crédito), CC BY, imagem cedida ou nossa; **não entra foto ou
ilustração do veículo** que noticiou, porque é obra dele. No arquivo, um bloco
`imagem:` com `arquivo · credito · licenca · alt`; o compilador aborta sem
qualquer um dos quatro; o crédito fica visível sobre a imagem e a licença no
HTML. A arte desenhada continua para o que não tem imagem licenciada — e a
tela mistura as duas sem perder unidade, porque a moldura e o crédito são os
mesmos.

## O que entra nesta primeira volta — os quatro

1. **Reconstruir capa e seções para pouco volume** — pré-requisito dos outros
   três; sem isso os demais não fazem diferença
2. **Logotipo e marca gráfica** — com pouco conteúdo, a marca carrega a
   identidade que a repetição de peças não vai construir. Nasce no vocabulário
   das capas geradas (varredura de radar, malha de pontos), e serve de favicon
   e assinatura na OG image
3. **Arte desenhada por peça** — o maior salto de beleza disponível. Com 3
   peças/semana deixa de ser inviável desenhar em vez de gerar por hash
4. **Veredito dentro da peça** — `chega · a caminho · não chega · sem efeito`.
   Categoria fechada, assinatura conceitual do Instituto, custa uma linha

---

# 2 · FUNCIONAMENTO

## A frase

**A máquina colhe. Você decide. Eu escrevo. O git publica.**

Nada é escrito por modelo em produção. Nada vai ao ar sem você ter lido. O
Worker fica burro de propósito: só serve o que já está pronto.

## Os quatro tempos, e onde você aparece

### Tempo 1 · COLHER — máquina, sozinha, custo zero

Busca as fontes, **obedece o `robots.txt`**, deduplica por URL canônica, limpa
HTML, normaliza data. Alimenta uma **pauta aberta** que acumula até alguém
sentar.

> ⚠️ **O ledger marca na lavra, não na colheita.** A primeira versão marcava o
> item como visto assim que colhia — com a rotina rodando sozinha, isso
> apagaria da pauta coisas que ninguém leu. A automação destruiria em silêncio
> exatamente o que ela existe para preservar.

### Tempo 2 · DECIDIR — **você, portão 1**

Você lê a pauta e marca o que vira peça. É o único lugar onde a sua decisão é
insubstituível: nenhuma máquina sabe o que interessa ao seu leitor.

O que **não** é escolhido não fica pendente — fica **lido e descartado**, que
é decisão editorial tão real quanto publicar. E é matéria-prima do Giro.

### Tempo 3 · LAVRAR — eu

Escrevo em português. Não traduzo palavra a palavra: escrevo, com o contexto
que a gente sabe e o modelo não saberia, e com o termo que um engenheiro
brasileiro reconheceria. Quando preciso do texto inteiro da fonte, busco
aquele artigo especificamente, respeitando o `robots.txt` daquele caminho.

### Tempo 4 · PUBLICAR — **você, portão 2**, e o git registra

Você lê a peça pronta e aprova. Commit, deploy. **Revisão por diff, histórico
por commit, correção rastreável por log.**

**Dois portões, e é deliberado:** aprovar sem ter escolhido vira carimbo;
escolher sem aprovar significa publicar, com o nome do Instituto em cima,
texto que ninguém leu.

## A voz — por formato, não uma só

*Síntese de "varia de acordo com o tipo de conteúdo, mas uma boa mistura".
Confira se é isto.*

| Formato | Voz | Como soa | Tamanho |
|---|---|---|---|
| **Notícia curta** (lançamento, release, versão) | **boletim técnico seco** | fato, consequência técnica, ponto. Zero adjetivo, zero narrador | ~90 palavras |
| **Notícia com consequência aqui** (regulação, mercado, quem representa) | **repórter com contexto** | o fato mais o que muda para quem opera no Brasil — quem perde, o que muda no orçamento | ~300 palavras |
| **Relatório** (Caso, Análise, Panorama) | **analista** | começa pela tese, usa o dado como evidência. É o que constrói autoridade | 800+ palavras |
| **Giro** | **repórter, tom de boletim** | largura com julgamento leve: o que aconteceu, o que importou, o que ficou de fora e por quê | ~600 palavras |

A regra que decide: **a voz sobe de registro quando há o que dizer além do
fato.** Notícia que só tem o fato recebe o boletim seco — esticar 90 palavras
em 300 é o começo de encheção de linguiça, e o leitor sente na primeira linha.

## O ciclo maior — o Giro

Semanal, segunda-feira. A rotina entrega o **dossiê** (números por SQL puro: o
que entrou, de onde, o que foi publicado, o que ficou de fora, o relógio); eu
escrevo em cima dele; você aprova.

O **placar do destaque** — a fórmula publicada, com o piso de 2 fontes
independentes — continua valendo. Era a melhor parte do desenho antigo e nunca
dependeu de IA: é conta.

## A pergunta-assinatura — mantida, com fontes novas

**"Quanto tempo a automação leva para sair da fronteira lá fora e chegar ao
chão de fábrica daqui."**

O desenho antigo não conseguia responder: 491 assuntos, **zero pares**
internacional↔brasileiro, porque as fontes BR eram tecnologia de consumo e
nunca cobririam "novo CLP da Siemens".

Sondagem de 03/09 — 18 candidatos, **3 vivos e especializados**:

| Fonte BR | Itens/sem | O que é |
|---|---:|---|
| **CIMM** | 12 | metal-mecânica: investimento, máquina, indústria |
| **ABINEE** | 5 | associação da eletroeletrônica: política industrial |
| **Automação Industrial** | 3 | o alvo exato do tema, e o único |

*(Mecatrônica Atual, ISA Distrito 4 e Intralogística: **domínios mortos**.
Manufatura em Foco: feed parado há **1.361 dias**. ABIMAQ: o feed aponta para
um domínio de staging exposto.)*

**Expectativa honesta:** CIMM é metal-mecânica e ABINEE é política industrial,
então a interseção com lançamento de produto é parcial. Estimativa de **1 a 3
pares medidos por mês** — o Panorama de dezembro teria 10 a 20 atrasos
apurados. É pouco para estatística, e é uma série que não existe em lugar
nenhum.

## As fontes — lista larga, ~130 itens/semana

| Papel | Fontes |
|---|---|
| **Radar internacional** | The Robot Report (21/sem) · IEEE Spectrum Robótica e IA (7) · n8n Blog (6) · Siemens Press (2) · Home Assistant (1) |
| **Relógio brasileiro** *(colhidas, nunca publicadas)* | CIMM (12) · ABINEE (5) · Automação Industrial (3) |
| **Vozes** | Simon Willison (14) · Rodney Brooks · Ethan Mollick · Chris Anderson · Gary Marcus |
| **Largura para o Giro** | Ars Technica (40) · The Verge (70) · Fórum Home Assistant (30) |
| **Cortadas** | heise (150) · Canaltech (106) · arXiv ×2 (95) · Tecnoblog (50) · Olhar Digital · Mastodon · Ghedin · Tim Bray · Benedict Evans · Raschka · Karpathy |
| **Fora por decisão delas** | Reddit · YouTube · GitHub ×2 — `robots.txt` recusa |

## Onde mora o conteúdo — arquivo no git

Uma peça = um markdown no repositório. O Worker fica **sem banco para
conteúdo**: mais rápido, mais simples, e a revisão vira diff.

O D1 guarda só o que **vem de fora** e não pode passar por commit: envio de
evento pelo formulário e captura de e-mail.

**Custo assumido:** publicar exige deploy, e hoje não há deploy. Até lá as
peças prontas acumulam no repositório, versionadas.

## A rotina — cron do Worker, e o que isso implica hoje

Decidido: a colheita roda no cron do Worker, na nuvem, sem perder dia.

⚠️ **Isso depende do acesso à Cloudflare, que volta a ser caminho crítico.**
Até o deploy existir, **não há coleta automática** — eu rodo a colheita no
começo de cada sessão. Com a lista larga, The Verge e Ars rotacionam o feed em
1-2 dias: um intervalo de 3 dias sem sessão perde item deles para sempre.

Não é impeditivo. É o preço, e ele existe.

## O que saiu da máquina

| Saiu | Por quê |
|---|---|
| pipeline de IA em produção | produzia volume, e volume não era o problema |
| teto de custo, `custo_dia`, kill-switch | não há custo a conter |
| chave de API na conta de terceiro | veículo que para de existir quando uma fatura não é paga não é veículo |
| backoffice de WhatsApp | existia para o sócio publicar |
| os quatro núcleos | viram três seções |

## O sócio na v2

**Infra e comercial, fora do editorial.** Mantém domínio e hospedagem, que
custam pouco e ele já tem, e entra na frente comercial — patrocínio, relação
com o setor, prospecção. O editorial fica inteiro com o Pedro, que é o que
"hoje eu tomo todas as decisões" já diz na prática.

Há [valor] combinados e um compromisso de "manter a máquina rodando até
31/12". A v2 **cumpre isso mais barato** (não há mais API a pagar), e o que
mudou precisa ser dito a ele — inclusive porque a Leitura semanal que era
dele deixou de existir.

---

# 3 · CUSTO DE TEMPO

A conta que o desenho anterior não fez, e por isso morreu.

## Por unidade

| O quê | Você |
|---|---:|
| escolher um item na pauta | ~1 min |
| aprovar uma notícia curta (boletim seco) | ~2 min |
| aprovar uma notícia com contexto | ~4 min |
| aprovar o Giro | ~10 min |
| varrer a pauta (130 itens × ~8 s) | ~18 min |

## Por semana, na configuração escolhida

| | |
|---|---:|
| varredura da pauta | 18 min |
| escolher 3 peças | 3 min |
| aprovar 3 peças (2 secas + 1 com contexto) | 8 min |
| aprovar o Giro | 10 min |
| **total seu, em duas sessões** | **~39 min** |

Mais o **Relatório mensal**, que é seu por natureza: ~1 a 2 h por mês.

Compare com o desenho anterior: **~70 min por semana de fila de aprovação, que
produziram 0 peças.** A v2 custa metade e entrega.

## A variável que controla tudo

Escanear um item custa ~8 segundos.

| Itens na pauta | Só para varrer |
|---:|---:|
| 40 | 5 min |
| **130 (a lista escolhida)** | **18 min** |
| 250 | 33 min |
| 551 (a lista antiga) | 73 min |

**Publicar 3 ou 6 peças muda pouco no seu tempo. Ler 40 ou 550 itens muda
tudo.** O custo escala com o que se **coleta**, não com o que se publica —
e é por isso que a lista de fontes é uma decisão de custo, não de conteúdo.

## Meu tempo

| O quê | Quanto |
|---|---|
| notícia curta | ~3 min de escrita, mais a leitura da fonte |
| notícia com contexto | ~10 min, mais apuração |
| o Giro | ~30 a 45 min |
| **por semana** | ~2 sessões |

## As duas âncoras

| Quando | O quê | Você |
|---|---|---:|
| **quarta** | lavra: lê a pauta, escolhe 3, aprova | ~29 min |
| **segunda** | o Giro: lê o dossiê, aprova o texto | ~10 min |

Duas âncoras são mais fáceis de manter que três e mais rítmicas que uma.

## A newsletter — depois

A captura de e-mail continua, o envio não. Enviar para 4 pessoas gasta a mesma
energia que enviar para 400, e criar hábito de envio antes de ter para quem
enviar é como cadência morre. O Giro é o conteúdo óbvio para ela quando a
lista justificar.

---

# 4 · ORDEM DE EXECUÇÃO

*Proposta minha, para você aprovar. A ordem tem uma razão: **o visual vem
depois das primeiras peças reais**, porque tipografia só se julga com conteúdo
de verdade na tela — lição que este projeto já aprendeu uma vez.*

| # | Etapa | Entrega |
|---|---|---|
| **1** | **A cirurgia** | tirar pipeline, teto de custo, `IA_CONTA`, cron do pipeline; 4 núcleos → 3 seções, com redirect dos caminhos antigos |
| **2** | **Conteúdo em arquivo** | `conteudo/**.md` → compilador → bundle. O Worker perde o banco de conteúdo |
| **3** | **A lista de fontes** | cortar as 11, entrar as 3 BR do relógio, refazer a pauta |
| **4** | **A primeira lavra** | você escolhe 3, eu escrevo, você aprova — **as primeiras peças reais do projeto** |
| **5** | **O visual, com conteúdo real na tela** | capa e seções para pouco volume; depois logotipo, depois arte por peça |
| **6** | **O primeiro Giro** | dossiê + texto + o placar do destaque |
| **7** | **Deploy** | depende do acesso à Cloudflare — e é o que liga a rotina |

---

# O que continua em aberto

1. **A voz** — a matriz acima é a minha leitura de "boa mistura". Confirme ou
   corrija.
2. **O acesso à Cloudflare** — agora é caminho crítico de novo, por decisão da
   rotina. Sem ele não há publicação nem coleta automática.
3. **A conversa com o sócio** sobre o que mudou: a Leitura semanal dele
   deixou de existir, e o papel dele virou infra + comercial.
4. **O tema dentro das Notícias.** Com o recorte híbrido, um item é de
   *indústria* ou de *processos/PME*. Continua sendo etiqueta no dado, mesmo
   sem virar seção — detalhe de implementação, não de concepção.
