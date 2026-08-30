# Instituto Automação — documento de conceito

> Versão 1 · 28/08/2026 · Pedro Oliveira
> Documento de trabalho. O que está em **Decidido** já foi acordado; o que está em
> **Em aberto** precisa de resposta antes de virar código.

---

## 1. Em uma frase

Um veículo semi-institucional que traz o que o mundo publica de automação **para o
português, no mesmo dia** — e que, ao fazer isso todo dia por uma máquina, acumula uma
base de dados que ninguém no Brasil tem, da qual sai a obra própria que constrói
autoridade.

**Posicionamento:** *o que o setor publicou lá fora hoje, em português, hoje.*

Quase toda notícia real de automação nasce em inglês e alemão e chega ao Brasil com dias
ou semanas de atraso, quando chega. O Instituto não compete por pauta — encurta uma
distância que hoje ninguém encurta.

---

## 2. Por que existe (a ordem verdadeira)

O objetivo principal **não é audiência nem receita**. É capital intelectual: patente para
falar dos assuntos, virar autor, contribuir com a comunidade técnica e acadêmica, e se
aprofundar na área consumindo-a diariamente. Rede e dinheiro vêm depois, por consequência.

```
RADAR (máquina) → OBRA PRÓPRIA (humano) → CITAÇÃO E CONVITE → SALA E CRACHÁ
                                                                    │
                        └─── volta como fonte nova, caso e dado ────┘
```

Duas leituras que valem mais que o desenho:

- **A direção não é reversível.** Não se começa pela rede. Ninguém vira referência fazendo
  networking; vira produzindo, e a rede vem atrás. Puxar pela ponta da rede transforma o
  projeto em prospecção com nome de instituto — e aí perde os dois lados.
- **A máquina gira mesmo em semana ruim.** O radar acumula base e SEO sozinho. A parte
  manual é trimestral, não diária. É o desenho certo para quem tem outras frentes abertas.

**O elo frágil é o segundo.** Consumir não gera autoridade: curar 30 itens por dia dá
vocabulário, panorama e faro, mas na frente de um engenheiro ou de um professor a autoridade
vem de ter **produzido** — um dado, uma medição, um caso com número. Ninguém cita agregador;
todo mundo cita quem mediu. O radar é a parte divertida e automática, e por isso é a
armadilha: dá para passar um ano com um radar lindo e chegar sem nada citável.

> **Regra dura:** todo trimestre sai uma peça original com dado próprio. Panorama, Caso
> medido ou recorte do dataset. Sem exceção — é a única coisa que não pode ser automatizada,
> e é a única que constrói o que se quer aqui.

E uma segunda: **profundidade em uma pergunta só.** Cobertura ampla deixa informado; ser *a
pessoa que responde uma pergunta específica* faz convidado. (Ver Em aberto nº 2.)

---

## 3. Arranjo — quem é quem

| Item | De quem |
|---|---|
| Domínio | **sócio** (owner) |
| Infraestrutura | **sócio** |
| Patrocínio / receita de mídia | **Pedro** |
| Construção e operação do fluxo | **Pedro** |
| Núcleo Indústria (conteúdo) | sócio |
| Núcleo Observatório + Operação (conteúdo) | Pedro |

**Acordo comercial — selado em 27/08/2026.** Proposta do Pedro para assumir o início,
aceita de imediato: **[parcelas combinadas]** (a primeira já paga), com a contrapartida de
**manter a máquina rodando até 31/12/2026**.

Sem CNPJ por enquanto. Evolui para entidade própria quando fizer sentido.

Os pontos ainda **não** combinados estão em acordo interno — quatro para travar
agora (escopo de "manter", custo de API, propriedade do código, cópia do dataset) e quatro
para fechar até 31/12. Baratos hoje, caros em novembro.

---

## 4. Como se apresenta

**Impessoal no fluxo, assinado no que é obra.**

- Radar e agenda: **sem autor**. É agregação, e autor ali seria falso.
- Análise, Caso e Panorama: **assinados**. "Análise do Núcleo Observatório · Pedro Oliveira".

O IPEA não assina o clipping; assina o relatório. O site segue sem colunista, sem foto e sem
ego — mas com nome atrelado ao que é produção intelectual. Sem isso, o objetivo principal
do projeto não acontece: autoridade não transfere de uma marca anônima para uma pessoa.

**Transparência por gatilho, não por data.** Enquanto for só radar e agenda, rodapé enxuto.
No dia do **primeiro** CTA para empresa dos sócios, formulário comercial ou patrocínio, a
página de transparência entra **junto**, não depois. Descobrir depois custa a autoridade
inteira.

---

## 5. Estrutura

```
Instituto Automação
│
├── NÚCLEOS  (editorial — feed, newsletter e agenda próprios)
│   ├── /industria      sócio · quente   — Leitura do Instituto, semanal
│   ├── /observatorio   Pedro  · quente   — Análise assinada, quinzenal
│   ├── /operacao       radar + Casos     — obra própria, com custo aberto
│   └── /edificacoes    radar puro
│
└── CAMADA INSTITUCIONAL  (o que justifica "Instituto")
    ├── /agenda         calendário unificado, schema.org/Event
    ├── /panorama       relatório trimestral, assinado, extraído do dataset
    ├── /glossario      infraestrutura de tradução, não só conteúdo
    ├── /fornecedores   diretório
    └── /transparencia  entra no gatilho
```

O leitor escolhe o núcleo na entrada e nunca mais vê o que não interessa. O Google indexa
quatro sites temáticos sob um domínio de autoridade. A marca é ampla; a experiência é
vertical — que é exatamente como um instituto de verdade se organiza (câmaras setoriais).

**Arranque a frio.** Três núcleos nascendo magros ao mesmo tempo parecem abandono. A saída
honesta: a Agenda nasce completa nos quatro; o editorial nasce quente em Indústria e
Observatório; Operação e Edificações entram declaradamente em **modo Radar** — só agregação,
sem análise. Selo "Radar" na seção resolve a expectativa sem mentir. Núcleo vira "ativo"
quando ganha análise própria e cadência.

---

## 6. Formatos e cadência

| Núcleo | Quem | Formato | Cadência |
|---|---|---|---|
| Indústria | sócio | **Leitura do Instituto** — 3 a 5 linhas por cima de um item do radar + 1 pauta própria/mês | semanal, baixo atrito |
| Observatório | Pedro | Análise assinada, ângulo brasileiro | quinzenal |
| Operação | Pedro | **Casos**: problema → o que foi automatizado → **custo** → o que deu errado | conforme o trabalho real |
| Edificações | pipeline | radar puro | diário, automático |
| Institucional | Pedro | **Panorama** extraído da base | trimestral |

O formato do sócio é curto de propósito: parceiro ocupado com formato longo some no mês 2.

**Casos** é o formato mais escasso e mais convertedor do setor — caso real com custo aberto.
E é subproduto do trabalho que já é feito (retífica, Commagente, Mary House), não trabalho
novo.

---

## 7. Motor

Cloudflare **Worker + D1 + R2 + Cron Trigger** + Claude API.

⚠️ O coletor precisa de `ctx.waitUntil`. Promessa não esperada é cancelada quando a resposta
sai — o miniflare local deixa terminar, então o defeito **só existe em produção**.

Ciclo de cada item: `coletado → aprovado → publicado`.

- Fonte **liberada** e confiável vai ao ar sozinha, com selo honesto:
  *"tradução automática · revisão humana pendente"*.
- Todo o resto espera aprovação — **por WhatsApp, num toque**, via Commagente. Dois sócios
  ocupados não aprovam conteúdo por painel; aprovam pelo celular, de onde estiverem.
- Cada item carrega o relógio na cara: *"publicado 14 min após a fonte"*. É o que faz o
  leitor entender a proposta sem explicação.
- O **glossário é injetado no prompt de tradução** como dicionário obrigatório.

**Por que o glossário é infraestrutura, não conteúdo:** vocabulário de automação em
português é traiçoeiro (*drive*, inversor, CLP/PLC, ladder, malha fechada, *safety*, IHM).
LLM traduzindo cru erra termo, e engenheiro percebe na primeira linha — autoridade morre
ali. Termo cadastrado, tradução travada, uso consistente no site inteiro. O glossário cresce
sozinho conforme as traduções são corrigidas, e vira uma das páginas mais linkadas do setor.

**Controle de custo (obrigatório, não opcional):** contador de gasto por dia no D1 e teto que
**pausa o coletor** ao bater o limite. Triagem, classificação e resumo curto em modelo barato;
modelo grande só para tradução integral e análise.

---

## 8. As quatro regras que protegem o projeto

**1. A licença da fonte decide tudo — e é regra no código, não julgamento caso a caso.**
Tradução integral de matéria alheia é obra derivada; não é citação nem uso livre.

| `fonte.licenca` | O que é | O que o pipeline pode fazer |
|---|---|---|
| `liberada` | press release de fabricante, newsroom oficial, CC-BY, órgão público, paper open access | **tradução integral** + crédito + link |
| `resumo` | imprensa técnica, portal, blog | resumo próprio em PT-BR (3–5 linhas) + link. **Nunca** tradução |
| `bloqueada` | paywall, veículo que proíbe | não entra no radar |

O código nega por padrão: se a licença não for `liberada`, só resumo. Fonte nova nasce como
`resumo` até alguém classificar. A faixa `liberada` é enorme e é onde está o "primeira mão" —
press release de fabricante **existe para ser republicado**.

**2. Valor agregado obrigatório.** Tradução automática em massa sem valor agregado é política
de spam declarada do Google (*scaled content abuse*). Duas frases de **"o que isso muda
aqui"** em cada item — quem representa no Brasil, se afeta norma local, se o integrador daqui
já tem acesso. É o que o leitor não obtém sozinho no Google Tradutor, e é a diferença entre
autoridade e penalização.

**3. Conteúdo isento; conversão no contato.** Comprador quer prova comercial, acadêmico quer
isenção — e o acadêmico verifica. Se o site cheirar a vitrine, ele não cita; se cheirar a
paper, o comprador não liga. O Panorama é o objeto raro que serve aos dois.

**4. Classificação rica desde o item nº 1.** `fornecedores_citados`, `uf`, `segmento`,
`tema`, `tipo_de_item` — armazenados mesmo que a tela não mostre nada disso hoje. Barato
agora, **impossível depois**: notícia sai do ar e feed não guarda histórico.

---

## 9. Modelo de dados

```
fonte      (id, nome, veiculo, url_feed, idioma, pais, nucleo,
            licenca [liberada | resumo | bloqueada], confianca, peso, ativo)

item       (id, fonte_id, nucleo, titulo, titulo_original, url, url_original,
            publicado_em, coletado_em, traduzido_em, tempo_ate_publicar,
            idioma_origem, modo [traducao | resumo],
            resumo_ia, contexto_br, porque_importa,
            tipo_de_item [lancamento | caso | regulacao | mercado],
            tema, fornecedores_citados, uf,
            status [coletado | aprovado | publicado],
            revisado_humano, revisor, revisado_em)

evento     (id, nucleo, nome, inicio, fim, cidade, uf, pais, formato,
            organizador, url, preco, fonte, destaque, status)

glossario  (termo_origem, idioma, termo_pt, nota, travado)

edicao     (id, nucleo, enviada_em, itens)            -- newsletter
fornecedor (id, nucleo, nome, uf, atuacao, url, plano)
correcao   (id, item_id, texto, data)                 -- exigência da política editorial
custo_dia  (data, tokens_in, tokens_out, brl, itens)  -- kill-switch
```

---

## 10. O que o projeto gera ao longo do tempo

| Ativo | Como nasce | Para que serve |
|---|---|---|
| Base longitudinal | subproduto do radar | matéria-prima do Panorama |
| **Panorama** | análise da própria base | autoridade; único objeto que serve acadêmico **e** comprador |
| **Dataset com DOI** | Zenodo, CC-BY — é subir um CSV | torna o Instituto **citável formalmente** em TCC, dissertação e artigo |
| Página de perguntas abertas | uma página | entrega tema + dado a orientador; caminho natural para coautoria |
| Credencial de imprensa | consequência de ser veículo | press pass dá acesso a coletiva, executivo e demo em feira |
| Newsletter | segmentada por núcleo | o único ativo realmente próprio — site é aluguel, lista é propriedade |
| Agenda indexada | schema.org/Event | tráfego recorrente e inbound de organizador |

**O Panorama sai de graça.** Depois de 6 meses coletando, existe uma base longitudinal de
automação em português que ninguém tem. Dela sai o relatório sem entrevista, sem survey, sem
pesquisa de campo: volume de lançamentos por segmento e trimestre; fornecedores mais citados
e a curva de quem sobe e quem some; temas em alta e temas que esfriaram; mapa de eventos por
UF e onde o país é deserto. Custo marginal quase zero, e não-copiável — depende de ter
começado a coletar seis meses antes.

**A ponte acadêmica é mais barata do que parece.** Universidade não precisa das notícias —
precisa de **dado brasileiro citável**, que é o que falta em automação aqui. Três movimentos:
publicar o dataset no Zenodo com DOI e CC-BY; publicar a página de "perguntas abertas que
nossos dados permitem responder" (orientador vive procurando tema viável com dado pronto);
e, quando o aluno citar e o professor aparecer, o próximo artigo sai em **coautoria**. É
assim que "virar autor" acontece de verdade — começa com um CSV e um DOI. Vale mapear CBA,
SBAI e congressos afins: trabalho curto com dado próprio é porta mais aberta do que parece.

---

## 11. Fases

| Fase | Foco | Métrica |
|---|---|---|
| 0 · mês 0–1 | vitrine técnica: o pipeline no ar | funciona e é público |
| 1 · mês 1–6 | autoridade → leads | conversas qualificadas |
| 2 · mês 6–12 | ativo de mídia | assinantes |
| 3 · ano 2 | comunidade e eventos | gente na sala |

Conflito latente entre 1 e 2: no dia em que um concorrente das empresas dos sócios quiser
patrocinar, alguém escolhe. Deixar a regra escrita na política editorial **antes** de o
dinheiro aparecer evita decidir no calor.

**v0 — o que vai ao ar:** Agenda completa nos quatro núcleos + radar rodando + uma Leitura e
uma Análise publicadas. Promete pouco, entrega inteiro, e começa a acumular a base no dia 1.

---

## 12. Decidido

- [x] Guarda-chuva de quatro núcleos, com camada institucional transversal
- [x] Fonte internacional, público brasileiro; tradução em primeira mão
- [x] Impessoal no fluxo, assinado na obra
- [x] Transparência por gatilho
- [x] Indústria (sócio) e Observatório (Pedro) quentes; Operação e Edificações em Radar
- [x] Operação recebe o formato **Casos**
- [x] Licença da fonte como regra no código, negando por padrão
- [x] Glossário como dicionário injetado na tradução
- [x] Aprovação por WhatsApp via Commagente
- [x] Regra dura: uma peça original com dado próprio por trimestre
- [x] Acordo comercial 27/08: [valor combinado], máquina rodando até 31/12/2026

## 13. Em aberto

1. **Público internacional ou só fonte internacional?** A suposição atual é fonte lá fora,
   leitor brasileiro. Se um dia houver versão em inglês ou espanhol, `idioma` no conteúdo e
   prefixo `/pt/` na rota entram **agora** — barato hoje, brutal depois.
2. **A pergunta-assinatura.** Aquela perseguida por anos, que faz de alguém *a pessoa que
   responde*. Candidatas: *quanto custa de fato automatizar no Brasil* · *o tamanho do atraso
   entre a fronteira lá fora e o chão de fábrica daqui*. Sem escolher, a autoridade fica larga
   e rasa.
3. **Lista de fontes e classificação de licença** — primeiro trabalho braçal. Proposta inicial
   em [docs/FONTES.md](docs/FONTES.md).
4. **Os seis pontos de acordo interno** com o sócio.
5. Identidade visual, provedor de newsletter, TLD exato do domínio.
