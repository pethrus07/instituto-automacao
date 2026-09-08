# Instituto Automação — Roadmap · v2

> **Estado em 08/09/2026:** site v2 pronto e **em homologação** (conta do Pedro, `noindex`).
> Produção espera o acesso à Cloudflare do sócio. Compromisso contratado: máquina rodando até
> **31/12/2026** (acordo interno).
>
> Este arquivo substitui o roadmap da v1. Em 03/09 morreram a IA em produção, os quatro
> núcleos, o teto de custo e a chave de API; o que sobreviveu está na seção 7. O `roadmap.html`
> ao lado continua descrevendo a v1 e não foi refeito.

---

## 1 · Onde estamos

| Existe | Não existe ainda |
|---|---|
| 21 peças reais (20 notícias, 1 análise), 20 eventos conferidos, 33 termos, dataset CSV | **Produção** e domínio (A2) |
| Seções Notícias, **Artigos** (vazia, honesta), Relatórios, Giro, Agenda, Glossário, Blueprints | **Primeiro artigo** e as instruções para autores |
| **Autores** com página própria (1 autor), faixa "Quem escreve", convite "Escreva no Instituto" | **Primeiro Giro** (a s36 ficou sem edição) |
| Espaço de **parceiro** na capa + `/apoie` (lista vazia) | **Primeiro parceiro** |
| Cadastro com atuação e empresa (migração 006), tabela `contato` | **Página de privacidade** e a finalidade escrita no cadastro |
| Marca prototipal e prancha em `/marca` | **Logo** definitiva |
| Tour narrado, QA 1004 asserções, revisão Playwright 8,8 | Formulário de **submissão de artigo** (texto, imagens, arquivos) |
| Relógio medindo sobre 21 fontes, cron vivo na homologação | Redes sociais e comunidade |

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
| **14/09** (segunda) | **Primeiro Giro** (s37), com `npm run dossie`. Decidir se a s36 sai atrasada ou fica registrada como pulada | Pedro |
| até **20/09** | Página de privacidade + finalidade no cadastro · notas internas fora de Blueprints · relógio com números em destaque e "atraso mediano" explicado · artigo fixo na capa · botão de evento | Pedro decide, eu faço |
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

- [ ] Voltar a chamar notícia de **notícia**; "peça" fica termo interno de Blueprints.
- [ ] **Relógio:** manter (é a tese) ou tirar (o sócio duvida da medida).
- [ ] `link:` do currículo e texto da bio em `conteudo/autores/pedro-oliveira.md`.
- [ ] Qual peça leva `destaque: true` (hoje NVIDIA × Hugging Face).
- [ ] Fonte brasileira dentro de Notícias, com a tagline dizendo "lá fora".
- [ ] Artigo fixo na capa: slot próprio ou destaque alternado.
- [ ] Botão "Enviar um evento" fora da capa?
- [ ] Cadência: semanal, ou capa diária?
- [ ] Quem toca redes e comunidade.
- [ ] Preço dos 3 artigos que o sócio quer vender, e a regra do rótulo.

### Eu — código

- [ ] Página de privacidade; finalidade escrita ao lado do cadastro.
- [ ] Tirar as notas internas de Blueprints; alongar o "Como funciona".
- [ ] Relógio: números em destaque, explicar "atraso mediano", nota de amostra (feita).
- [ ] Artigo fixo na capa (quando decidido).
- [ ] Formulário de submissão de artigo com upload → `contato` ou tabela própria → eu diagramo.
- [ ] Regra de publicidade no código: peça com `patrocinada: true` sai rotulada, sempre.
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

- [ ] **Publicidade identificada:** artigo pago e "notícia boa" para cliente saem rotulados ou não saem. Isso precisa ser dito antes da primeira venda.
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

## 8 · Backlog sem data

| Item | Nota |
|---|---|
| Embeddings para agrupar assunto | o relógio mede 552 assuntos para 554 itens: o agrupamento por título quase não agrupa |
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
