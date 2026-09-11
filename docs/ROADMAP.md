# Instituto Automação — Roadmap · v2

> **Estado em 11/09/2026:** site v2 pronto e **em homologação** (conta do Pedro, `noindex`).
> Produção espera o acesso à Cloudflare do sócio. Compromisso contratado: máquina rodando até
> **31/12/2026** (acordo interno).
>
> Este arquivo substitui o roadmap da v1. Em 03/09 morreram a IA em produção, os quatro
> núcleos, o teto de custo e a chave de API; o que sobreviveu está na seção 7. O `roadmap.html`
> ao lado continua descrevendo a v1 e não foi refeito.
>
> **11/09 fechou as cinco decisões que travavam o prazo de 20/09** (seção 2b) e descobriu dois
> defeitos que ninguém tinha medido: o **relógio nunca mediu nada** e o **dossiê lia o banco
> errado** (seção 2c). Os dois estão tratados; o relógio saiu da capa até voltar a medir.

---

## 1 · Onde estamos

| Existe | Não existe ainda |
|---|---|
| 21 peças reais (20 notícias, 1 análise), 20 eventos conferidos, 33 termos, dataset CSV | **Produção** e domínio (A2) |
| Seções Notícias, **Artigos** (vazia, honesta), Relatórios, Giro, Agenda, Glossário, Blueprints | **Primeiro artigo** e as instruções para autores |
| **Autores** com página própria (1 autor), faixa "Quem escreve", convite "Escreva no Instituto" | **Primeiro Giro** (a s36 ficou sem edição) |
| Espaço de **parceiro** na capa + `/apoie` (lista vazia) | **Primeiro parceiro** |
| Cadastro com atuação e empresa (migração 006), tabela `contato` | **Primeiro artigo** para o slot fixo da capa (o slot já existe, vazio) |
| **`/privacidade`** e a finalidade declarada ao lado do formulário (11/09) | **Relógio medindo** — o agrupamento não forma par (seção 2c) |
| **Rótulo de publicidade no código** — `patrocinada: true` sai rotulada em toda superfície (11/09) | **Primeira venda** de artigo patrocinado |
| Marca prototipal e prancha em `/marca` | **Logo** definitiva |
| Tour narrado, **QA 1025 asserções**, revisão Playwright (0 axe, CLS 0, 0 link quebrado) | Formulário de **submissão de artigo** (texto, imagens, arquivos) |
| Coletor vivo no cron da homologação desde 06/09, série contínua | Redes sociais e comunidade |

---

## 2 · O que a reunião de 08/09 decidiu

Ata: `atas/atas-salvas/2026-09-08_0056_Reunião 08_09_2026 00_24.md` (89 min). Todos os
"Participante N" da transcrição são o sócio.

| Decisão ou pedido | Dono | Estado |
|---|---|---|
| **Artigos são o coração; notícia dá movimento.** Os dois concordaram | — | seção criada em 08/09 |
| Capa com **um artigo fixo** que notícia nova não empurra ("um artigo e duas notícias") | Pedro decide o formato; eu faço | a fazer |
| **Casar artigo com notícia** do mesmo assunto (artigo sobre CLP Siemens ao lado da notícia da Siemens) | editorial | vira regra nas instruções para autores |
| **Cadência:** Pedro publica aos domingos e aprova semanalmente; sócio quer ao menos a capa atualizada todo dia | Pedro | decidir |
| **Autores:** sócio recruta (especialista em CLP Siemens, profissional de TI, vendedor com método, ele mesmo) | sócio | em curso |
| sócio quer produzir **3 artigos para uma empresa** e perguntou "quanto fica" | os dois | precificar **e** rotular como conteúdo pago (seção 3) |
| **Submissão de artigo:** formulário no site com texto, imagens e arquivos; eu diagramo; o autor aprova. Sem editor de texto nem backoffice. Autor quer preview | eu | a construir |
| **Podcast mensal** com o convidado, entrevistando empreendedores da automação; cada episódio rende artigo e "aprendizado" | sócio | ideia |
| **Redes:** comunidade WhatsApp, X e TikTok (Pedro quer). sócio não toca rede social | dono em aberto | decidir |
| **Cadastro:** um só, com gatilhos por público; evitar a palavra "newsletter"; a lista é o ativo a monetizar em 6 meses | os dois | depende da LGPD (seção 3) |
| Números do relógio em **destaque azul**; explicar "atraso mediano" | eu | a fazer |
| Botão **"Enviar um evento" sair da capa**, ficar só na agenda | Pedro decide | decidir |
| **Notas internas de Blueprints** (cinzas) saem antes de publicar | eu | a fazer |
| Glossário: sócio não quer sair do texto para ler; a tradução já vai inline e o glossário é complemento | — | como está |
| **Logo:** o radar não diz "instituto" nem "educação"; sócio propõe bússola fundida com I e A; ele gera opções e manda | sócio → Pedro | em curso |
| sócio fechou um projeto e vai **separar um valor para manter a infra** | sócio | aguardar |
| "Somos o site mais rápido do Brasil" como propaganda | — | só com medição publicada e reproduzível |

O que o sócio disse do visual antes da sprint de 08/09 ("cru, poucos detalhes", "escuro ficou
melhor", "banner dá vida", "linhas organizam") foi respondido no mesmo dia: `qa/SPRINT-V2.md`
§14.

---

## 2b · O que o Pedro decidiu em 11/09

As cinco que travavam o prazo de 20/09, mais a do Giro. Todas implementadas no mesmo dia.

| Decisão | O que vale agora | Onde está |
|---|---|---|
| **Giro da s36** | **Pulada**, não atrasada. A série começa na s37, e o Giro nº 1 diz por quê: a coleta contínua começou em 06/09 | a escrever em 14/09 |
| **Relógio** | **Sai da capa** enquanto medir zero; segue rodando e os números ficam em `/blueprints`, com o motivo do zero escrito ao lado. A faixa volta quando houver par medido | `capa.tsx`, `blueprints.tsx` |
| **Artigo fixo na capa** | **Slot próprio**, em segundo lugar (era o quarto bloco, depois do cadastro). `fixo: true` no frontmatter escolhe qual; notícia nova não empurra | `conteudo/tipos.ts`, `capa.tsx` |
| **"Enviar um evento"** | **Sai** — não estava só na capa, estava na **navbar de toda página**, como único botão de ação do site. O convite agora vive no cabeçalho da agenda, onde o formulário está | `Documento.tsx`, `agenda.tsx` |
| **Notícia vs peça** | "Peça" vira **termo interno**: 27 ocorrências no texto visível viraram "notícia", "artigo" ou "texto". O tipo `Peca`, a pasta e o frontmatter **não** mudaram — renomear o código seria diff enorme sem ganho para o leitor | todas as páginas |
| **Cadência** | **Semanal**, publicando aos domingos, e a capa mexe sozinha entre um domingo e outro: a agenda avança por data (`COALESCE(fim, inicio) >= date('now')`) e o Giro entra toda segunda. Não há promessa de capa diária | decisão, sem código |

---

## 2c · Dois defeitos que ninguém tinha medido (11/09)

Os dois apareceram ao rodar o primeiro `npm run dossie` de verdade.

### O relógio nunca mediu nada — 0 de 684

Não é imprecisão, é conjunto vazio, e nos **dois** bancos:

| | assuntos | com atraso apurado | com menção BR |
|---|---|---|---|
| local | 552 | **0** | 124 |
| homologação | 684 | **0** | 61 |

**A causa:** `chaveAssunto()` (`src/coletor/url.ts`) monta a chave com o **título inteiro** —
tira as palavras vazias, ordena o resto e junta. Dois textos só caem no mesmo assunto se
tiverem o **conjunto idêntico** de palavras significativas, o que entre idiomas diferentes
praticamente não acontece: **2 assuntos de 684 têm mais de um item**. Como `atraso_br_dias` só
é calculado quando uma fonte brasileira cai num assunto que **já existe** com original
estrangeiro (`coletor/index.ts`), a fonte brasileira cria assunto próprio e o par jamais se
forma.

O site nunca mentiu sobre isso — a capa tinha desvio honesto e Blueprints declarava o
agrupamento fraco —, mas **em lugar nenhum estava escrito que a consequência era zero
medição**. Agora está, em `/blueprints`.

**O conserto**, quando for a vez: casar por **token raro compartilhado** (nome próprio, código
— "Siemens", "NVIDIA", "61131"), que sobrevive à tradução e é exatamente o caso que o relógio
quer pegar. Sem IA, cabe no cron. O risco a controlar é o falso positivo: duas notícias
diferentes da Siemens no mesmo assunto corrompem a medida para o outro lado, então vai com
limiar e amostra conferida à mão. **Embeddings continuam mortos** — seriam IA em produção.

### O dossiê lia o banco errado

`scripts/dossie.ts` tinha `instituto --local` cravado, mas o coletor contínuo roda no **cron da
borda**, que escreve no D1 da homologação. Em 11/09 o local estava parado desde 04/09: o
dossiê da s37 saiu com **0 itens** enquanto o homolog tinha **406**.

Era um defeito de manhã de segunda-feira. Um dossiê zerado não parece defeito, parece semana
fraca — e o Giro escrito em cima dele **passaria na auditoria**, porque ela confere a prosa
contra o dossiê, não o dossiê contra o mundo.

Três travas novas no script: o banco é escolhido (`--homolog`, `--producao`) e **impresso**; a
semana aberta exige `--parcial` e o arquivo sai marcado como parcial; e dossiê **sem item
nenhum aborta**. A procedência (banco e hora) agora fica escrita dentro do dossiê.

### Por que a s36 não era publicável

| dia | local | homologação |
|---|---|---|
| 31/08 | 74 | 10 |
| 01/09 | **163** | 8 |
| 02/09 | 13 | 21 |
| 03/09 | 5 | 16 |
| 04/09 | 3 | 25 |
| 05/09 | — | 10 |
| 06/09 | — | 41 |

Os 163 do dia 01/09 no local são artefato: a primeira colheita despeja no dia em que rodou.
Os 10 do dia 31/08 no homolog são o oposto: o coletor só começou lá em 06/09 e feed RSS só
carrega os últimos itens. **Nenhum dos dois mede a s36** — os dois medem quando o coletor
rodou. A s37 (07 a 13/09) é a primeira semana com série contínua: 59, 96, 136, 95 nos quatro
primeiros dias.

---

## 3 · O juridiquês, por escrito

Na reunião, o Pedro afirmou travas legais que **não existem** e prometeu levar a conferência
por escrito. Está aqui. Não é parecer de advogado; os fatos abaixo são pacíficos.

| Afirmação | O que vale | Base |
|---|---|---|
| "Só jornalista pode assinar notícia" | **Não.** O STF derrubou o diploma obrigatório em 2009. Qualquer pessoa escreve e assina notícia; a assinatura atribui responsabilidade, não exige credencial | STF, RE 511.961 (17/06/2009); DL 972/1969, art. 4º, V, não recepcionado; ADPF 130 |
| "Por isso chamamos de peça" | Pode chamar de notícia. "Peça" fica por escolha editorial, não por obrigação | idem |
| "Só formado escreve artigo; meu primeiro será o TCC" | **Não há lei.** Artigo é gênero de texto; só periódico científico impõe titulação, e cada um decide a sua. A seção Artigos pode ter esse nome | nenhuma norma restringe o gênero |
| "Reescrever notícia de outro precisa de liberação" | Fatos e informações **não têm** direito autoral; a forma do texto tem. Texto próprio sobre o fato, com crédito e link, é lícito sem pedir. É o método do site | Lei 9.610/1998, art. 8º, I e VII; art. 46, III |
| "Traduzir pode" | **Tradução integral é obra derivada** e exige autorização. Reescrita e resumo próprios, não. O site reescreve; deve continuar assim | Lei 9.610, art. 29, IV |
| "O robots.txt é a permissão que o site dá" | **Não é.** É convenção técnica para robôs de coleta, sem efeito sobre direito autoral. Respeitar evita briga por termos de uso; não licencia nada | RFC 9309 |
| "Plágio é copiar sem citar" (sócio) | Quase. Citar não autoriza reproduzir o texto inteiro; trecho curto com fonte, sim | Lei 9.610, art. 24; art. 46, III e VIII |
| Cláusula da imprensa | A lei permite a periódico reproduzir notícia de outro periódico com menção de autor e publicação; para site é disputada. O caminho seguro segue sendo texto próprio | Lei 9.610, art. 46, I, a |
| Imagens | Foto de veículo é obra protegida mesmo com crédito; material de imprensa vem com licença de republicação. Regra do site desde 04/09 | Lei 9.610, art. 7º, VII |
| Artigos pagos; "notícia boa" para a IP virar parceira | Conteúdo pago ou de interesse comercial **tem de ser identificado como publicidade**. Notícia favorável para conquistar cliente, sem rótulo, é publicidade velada e contradiz a regra publicada em `/apoie` | CDC, art. 36; CONAR, art. 28 |
| "Banco de 2 mil pessoas" para anunciante | **LGPD:** a finalidade se declara na coleta. Mandar oferta de terceiro só se constar; repassar ou vender a base, não | Lei 13.709/2018, arts. 6º, 7º, 9º, 18 |
| "Site mais rápido do Brasil" | Só com medição publicada e reproduzível; sem prova é publicidade enganosa | CDC, art. 37 |
| Nome "Instituto Automação" | A palavra é livre. Conferir a marca no **INPI** antes de fechar a logo; ao formalizar, associação sem fins lucrativos | Lei 9.279/1996; CC, art. 53 |
| Responsabilidade | Quem assina responde civil e penalmente por calúnia, difamação e injúria; publicação periódica está sujeita a direito de resposta. O registro de correções ajuda | CC, arts. 186 e 927; CP, arts. 138–140; Lei 13.188/2015 |

**Resumo:** nenhuma trava citada existe. As obrigações reais são três: **identificar
publicidade**, **declarar a finalidade do cadastro**, e **não reproduzir texto nem imagem
alheia inteira**. As três já estão ou cabem no método atual.

---

## 4 · Marcos

| Quando | Marco | Depende de |
|---|---|---|
| **14/09** (segunda) | **Primeiro Giro** (s37), com `npm run dossie -- --homolog`. A s36 ficou **pulada** (decisão de 11/09) e o Giro nº 1 diz por quê | Pedro escreve |
| ~~até **20/09**~~ | **FEITO em 11/09**, nove dias antes: privacidade + finalidade no cadastro · notas internas fora de Blueprints · "Como funciona" alongado · artigo fixo na capa · botão de evento fora · relógio fora da capa · vocabulário · rótulo de publicidade | — |
| **setembro** | **Logo:** opções do sócio → escolha do Pedro → prancha e ícones refeitos (`/marca`, favicon, OG) | sócio, depois eu |
| **setembro** | **Instruções para autores** publicadas em `/autores#escrever` (o que se pede já está; falta formato, tamanho, fonte, imagem, revisão) | os dois |
| **set–out** | **Primeiro artigo** — de um autor do sócio ou do Pedro | sócio, Pedro |
| **outubro** | **Formulário de submissão de artigo** (texto, imagens, arquivos) → eu diagramo → autor aprova | eu |
| **outubro** | **Produção na conta do sócio:** acesso + domínio (A2), `wrangler deploy` sem `--env`, `db:remoto` + sementes + `db:migrar:remoto`, tirar o `noindex`, Search Console, sitemap | **sócio** (A2) |
| **outubro** | **Primeiro parceiro**, por commit em `src/parceiros.ts`, rotulado | sócio |
| **novembro** | Definir quem toca redes e comunidade; começar por uma | Pedro |
| **1ª quinzena de dez** | **Panorama nº 1** com ~3 meses de base + **dataset no Zenodo com DOI** (CC-BY) | coleta contínua desde set |
| **31/12/2026** | **Renegociação** com o sócio, chegando com base, Panorama e artigos publicados | acordo interno |

---

## 5 · Backlog por dono

### Pedro — decisões

Seis fechadas em 11/09 (seção 2b). O que sobrou:

- [x] ~~Voltar a chamar notícia de **notícia**~~ — feito; "peça" é termo interno do código.
- [x] ~~**Relógio:** manter ou tirar~~ — **sai da capa** enquanto medir zero.
- [x] ~~Artigo fixo na capa: slot próprio ou destaque alternado~~ — **slot próprio**, 2º bloco.
- [x] ~~Botão "Enviar um evento" fora da capa?~~ — **fora**, e da navbar inteira.
- [x] ~~Cadência: semanal, ou capa diária?~~ — **semanal**, capa mexendo sozinha.
- [x] ~~A s36 sai atrasada ou fica pulada?~~ — **pulada**.
- [ ] `link:` do currículo e texto da bio em `conteudo/autores/pedro-oliveira.md`.
- [ ] Qual notícia leva `destaque: true` (hoje NVIDIA × Hugging Face).
- [ ] Fonte brasileira dentro de Notícias, com a tagline dizendo "lá fora".
- [ ] Quem toca redes e comunidade.
- [ ] **Preço** dos 3 artigos que o sócio quer vender. O rótulo já não é decisão: é o código.
- [ ] **Peça paga pode ser `destaque: true`?** O compilador hoje permite — ou seja, dá para
      vender a capa. Não travei sozinho porque pode ser decisão comercial legítima; se não
      for, é uma linha no compilador.
- [ ] **Fórum Home Assistant = 208 de 406 itens da s37 (51%).** Um fórum de automação
      residencial domina a semana de um site de automação industrial. Baixar o peso, tirar da
      fonte, ou aceitar e dizer no Giro?

### Eu — código

- [x] ~~Página de privacidade; finalidade escrita ao lado do cadastro.~~ **11/09** — `/privacidade`
      com as 4 coletas, base legal, prazo, direitos do art. 18 e a Cloudflare como operadora;
      a finalidade sai de `FINALIDADES` em `config.ts`, um texto só para a página e o formulário.
- [x] ~~Tirar as notas internas de Blueprints; alongar o "Como funciona".~~ **11/09** — saíram as
      três que falavam com a gente; "Como funciona" virou quatro tempos numerados, cada um
      dizendo também o que **não** acontece nele.
- [x] ~~Regra de publicidade no código.~~ **11/09** — `patrocinada: true` + `patrocinador:`;
      o compilador recusa flag sem anunciante, anunciante sem flag, e peça paga em **notícia ou
      Giro**. Rótulo na peça, capa, listagem, RSS (inclusive no título) e JSON-LD (`sponsor`).
- [x] ~~Artigo fixo na capa.~~ **11/09** — `fixo: true`, slot próprio em 2º lugar.
- [x] ~~Relógio: números em destaque, explicar "atraso mediano".~~ Superado: o relógio saiu da
      capa (seção 2b) e Blueprints passou a explicar **por que ele mede zero**.
- [ ] **Consertar o agrupamento do relógio** (seção 2c) — é o que faz a tese existir. Casar por
      token raro compartilhado, sem IA. É o maior item aberto do projeto.
- [ ] Formulário de submissão de artigo com upload → `contato` ou tabela própria → eu diagramo.
- [ ] Reescrever ou arquivar os docs da v1 (`CONCEITO`, `ARQUITETURA`, `FLUXOS`, `MODELO-DADOS`, `CAPACIDADE`, `ORGANOGRAMA`, `roadmap.html`).
- [ ] Lint e formatação.
- [ ] PageSpeed Insights quando a cota liberar; cartão OG no WhatsApp e LinkedIn a partir da homologação.
- [ ] Diarizador do gravador de atas: limiar baixo fatiou um falante em 78; ajustar antes da próxima reunião.

### sócio

- [ ] **A2:** acesso à Cloudflare + domínio e DNS.
- [ ] **A3:** os pontos do acordo interno por escrito (sem o custo de API, que deixou de existir).
- [ ] Opções de **logo** (bússola + I/A) para o Pedro escolher.
- [ ] Autores: trazer o primeiro texto, com nome e sobrenome.
- [ ] Primeiro parceiro, com contrato e rótulo.
- [ ] Podcast com o convidado, se for adiante: quem, quando, e o que vira artigo.
- [ ] O valor de infra que ele disse que vai separar.

### Os dois — conversa

- [x] ~~**Publicidade identificada**~~ — **decidido pelo código em 11/09**, antes da primeira venda,
      que era o ponto. Artigo e relatório podem ser pagos e saem rotulados; **notícia e Giro não
      são patrocináveis** (a notícia carrega o veredito, o Giro carrega a medição). A "notícia
      boa" para o cliente virar parceiro não compila. Falta combinar o **preço**, não a regra.
- [ ] **Política editorial em uma página:** artigo não é opinião (método replicável, dados), parceiro não escreve nem escolhe pauta, toda peça tem autor, correções registradas.
- [ ] O papel do sócio mudou com a v2 (infra + comercial + autores); a Leitura semanal dele não existe mais.

---

## 6 · Depois

| Fase | Foco | Métrica | Quando |
|---|---|---|---|
| 1 | autoridade → leads | conversas qualificadas e autores publicando | até dez/2026 |
| 2 | ativo de mídia | cadastros com finalidade declarada; primeiro parceiro pagando | 2027, 1º semestre |
| 3 | comunidade | gente na sala: podcast, WhatsApp, evento | 2027 |

**Marcos que não escorregam:** uma peça original com dado próprio por trimestre; Panorama nº 1
em dezembro; dataset com DOI junto dele.

---

## 7 · O que continua valendo da v1

| Decisão | Data |
|---|---|
| Fonte internacional, público brasileiro; **só português, para sempre** | 30/08 |
| **Pergunta-assinatura:** o atraso entre a fronteira e o chão de fábrica daqui | 30/08 |
| Tema azul + laranja; **página branca, estrutura por fio e ar** | 30/08 · 03/09 |
| **Nunca republicar imagem de terceiro** sem licença; a licença governa, não o formato | 30/08 · 04/09 |
| **O `robots.txt` manda, e não há contorno** | 01/09 |
| Sitemap de notícias como caminho legítimo para quem fecha o RSS | 01/09 |
| Voz é um eixo da fonte, não um tipo | 01/09 |
| Giro semanal com destaque por fórmula publicada; **a auditoria de números aborta** | 01/09 |
| Repositório privado agora, público depois | 30/08 |
| **Zero IA em produção; toda peça tem autor; o git é o CMS** | 03/09 |
| **Escuro não segue o sistema**; só no botão | 05/09 |
| Evento só com data conferida no site oficial | 04/09 |
| **Peça paga sai rotulada em toda superfície; notícia e Giro não se vendem** | 11/09 |
| **A finalidade do cadastro se declara na coleta, não só na política** | 11/09 |
| **Capa não promete medição que não existe** — o relógio volta quando medir | 11/09 |
| **Publicação semanal aos domingos; a capa se move sozinha entre elas** | 11/09 |
| "Peça" é termo do código; o leitor lê notícia, artigo, texto | 11/09 |

## 8 · Backlog sem data

| Item | Nota |
|---|---|
| ~~Embeddings para agrupar assunto~~ | **morto: seria IA em produção.** O conserto do agrupamento é por token raro, sem modelo — ver seção 2c |
| Mais vozes brasileiras de automação industrial | o buraco mais visível da lista de fontes |
| Coletor por API com credencial (GitHub, Reddit, YouTube) | saída legítima para as fontes que o robots recusa |
| Pedido de acesso a Control Engineering, Automation World, WEG | é mensagem, não código |
| Envio da newsletter | quando a lista justificar, e com a finalidade declarada |
| Busca (FTS5) | quando houver o que procurar |
| Diretório de quem opera, integra e ensina | só com base legal e rótulo comercial; a ideia do sócio de "sua empresa aqui" mora aqui |
| Página de perguntas abertas para orientadores | junto do dataset com DOI |
| Espanhol nas fontes | depois de EN e DE estáveis |
| Repositório público | quando o acordo do código estiver escrito |

## 9 · Mortos — não voltar sem fato novo

IA em produção · quatro núcleos · teto de custo e chave de API (o antigo A1) · tradução
integral de terceiro · backoffice fora do git · o "Tema" no rodapé · a coluna lateral da peça.
