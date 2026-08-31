# QA · Sprint 2 — pipeline de IA

> 30/08/2026 · `npm run qa` · **73 asserções · 0 falhas · 1 aviso** · +24 do parser
>
> ⚠️ **Leia a seção 5 antes de qualquer coisa.** O pipeline nunca rodou contra a API real.
> Tudo aqui foi exercitado em **modo simulação**, e isso limita o que este relatório pode
> afirmar mais do que qualquer número acima sugere.

---

## 1. O que entrou

Triagem → classificação → tradução integral → "o que isso muda aqui" → publicação, com
contabilidade de custo e kill-switch.

| Peça | O que faz |
|---|---|
| `ia/precos.ts` | modelo por etapa e cálculo de custo, com desconto de token lido de cache |
| `ia/custo.ts` | acumula em `custo_dia` e **pausa o pipeline** ao bater o teto |
| `ia/cliente.ts` | camada fina sobre a SDK; modo simulação; classifica falha em "parar" ou "pular" |
| `ia/etapas.ts` | os prompts e os esquemas; carrega o glossário travado |
| `pipeline/index.ts` | orquestra, escreve no banco, decide publicar ou enfileirar |

### Decisões que o QA verificou

**Tool use estrito em vez de "responda em JSON".** Com `strict: true`,
`additionalProperties: false` e `required`, o que volta já validou contra o esquema. Pedir
JSON em prosa é a forma clássica de receber texto explicativo em volta e quebrar o parse
em produção — só que três semanas depois, num item qualquer.

**A licença é relida do banco na hora de traduzir**, não herdada do que a etapa anterior
achou. O QA prova a consequência: `corpo IS NOT NULL` só existe onde `licenca='liberada'`.

**A ordem é econômica.** Triagem barata (Haiku) primeiro; item reprovado nunca chega no
modelo caro. Quem descarta cobra pouco.

**O portão de custo vem antes da primeira chamada**, não depois. E o coletor **continua
rodando** mesmo com o pipeline pausado — feed não guarda histórico, e dia sem coletar não
volta. Essa separação é o ponto do desenho.

---

## 2. Defeitos encontrados

### 2.1 A SDK não resolvia no Worker — e o erro estava só no log
`@anthropic-ai/sdk` precisa de `compatibility_flags = ["nodejs_compat"]`. Sem ele o build
falha, o `wrangler dev` **continua servindo a versão anterior**, e a página parece
funcionar. Só apareceu ao ler o log do servidor — nenhuma requisição acusou.

### 2.2 `traduzido_em` estava no documento e não no schema
`MODELO-DADOS.md` descrevia a coluna; `schema.sql` não a criava. Pego ao escrever o UPDATE.
É o custo de manter documento e DDL separados — e o argumento para o QA comparar os dois
automaticamente numa próxima sprint.

### 2.3 O QA fixava um slug — **segunda vez que este tipo de defeito aparece**
A suíte codificava `/industria/controladores-diagnostico-preditivo-no-clp`. O pipeline
regenerou o slug a partir do título, e **quatro asserções falharam apontando para o lugar
errado** — pareciam defeito de produto.

Agora o item é **descoberto no banco**. Junto com o caso do `noopener` na sprint 0, vira
regra da casa:

> **Teste não codifica dado incidental.** Slug, id e ordem de atributo mudam; a asserção
> tem de descrever a propriedade, não a instância.

---

## 3. Conformidade — as invariantes novas

Todas viraram consulta SQL que quebra o QA:

| Invariante | Por que importa |
|---|---|
| **Texto integral só de fonte liberada** (`corpo`) | mais forte que a checagem de `modo`: `modo` é intenção, `corpo` é o texto. Prova que a obra derivada não autorizada não existe na base |
| **Publicação automática só de fonte liberada E confiável** | item no ar sem revisão vindo de fonte que não permite seria o pior defeito possível deste projeto |
| Todo item publicado tem o "o que isso muda aqui" | é a camada que separa autoridade de tradução automática em massa — sem ela o item não deveria ir ao ar |
| Todo item publicado tem o relógio calculado | o relógio é conteúdo, não metadado |
| Todo item arquivado registra o motivo | descarte sem motivo é descarte não auditável |
| A contabilidade de custo existe e é coerente | quem paga a conta é o sócio |

**Exercitado de ponta a ponta:** 3 itens em `coletado` → **2 publicados** (fonte `liberada`
+ confiança `alta`) e **1 na fila** (`classificado`, fonte `resumo`). O item da fonte
`resumo` saiu com `corpo` nulo e `contexto_br` preenchido, exatamente como o desenho manda.

---

## 4. Comparação com o melhor disponível

| Dimensão | Instituto | Melhor disponível | Veredito |
|---|---|---|---|
| Saída estruturada | tool use estrito, validado pelo servidor | idem — é o estado da arte | **empatado** |
| Cache de prompt | glossário e sistema em bloco `ephemeral` | idem | **empatado**, mas ainda **não medido** (ver 5) |
| Contabilidade de custo | por chamada, acumulada no dia, com teto que pausa | maioria dos projetos não tem nenhuma | **acima** |
| Modo simulação | pipeline inteiro exercitável sem gastar | raro | **acima** |
| Glossário travado no prompt | sim, e cresce com a correção | tradutores comerciais têm glossário; agregadores não têm nenhum | **acima** para o nicho |
| Avaliação de qualidade da tradução | **nenhuma** | conjunto de referência + juiz automático + revisão humana amostral | **abaixo — é a maior lacuna** |
| Detecção de alucinação no contexto BR | só a instrução no prompt | verificação contra fonte, citação obrigatória | **abaixo** |

As duas últimas linhas são o débito real desta sprint, e não dá para pagá-lo sem chave.

---

## 5. O que este QA **não** prova

**Nada sobre a qualidade do que a IA produz.** Em simulação, as respostas são canônicas e
fixas. Portanto seguem **inteiramente não verificados**:

1. **A tradução.** Se respeita o glossário travado, se erra termo técnico, se corta
   conteúdo, se acrescenta o que não estava no original.
2. **A triagem.** Se descarta o que deveria descartar. O prompt manda descartar na dúvida —
   ninguém mediu se ele descarta demais (radar vazio) ou de menos (radar com ruído).
3. **O "o que isso muda aqui".** É o parágrafo que justifica o site existir, e é também o
   de maior risco de alucinação: presença comercial, preço e prazo inventados. **O prompt
   proíbe; nada verifica.**
4. **O custo real.** Os números de `custo_dia` são a fórmula aplicada a `usage` — em
   simulação, `usage` é zero. A conversão para real usa cotação fixa declarada (R$ 5,40),
   que é estimativa, não cotação.
5. **O cache de prompt.** O bloco `ephemeral` está no lugar certo por inspeção. Só
   `cache_read_input_tokens > 0` numa chamada real prova que funciona — e se não funcionar,
   o glossário é pago inteiro em toda chamada.
6. **O comportamento sob erro da API.** `classificarFalha` distingue parar de pular por
   tipo de exceção; nenhum 429 ou 500 real foi provocado.

### O que destrava isso

Uma chave da conta do sócio e ~R$ 1 de gasto controlado (o teto já existe). Com isso, a
sprint seguinte precisa de:

- [ ] **Conjunto de referência de tradução**: 10 itens reais com tradução conferida por
      humano, e uma medida de aderência ao glossário
- [ ] **Medir a triagem**: 30 itens rotulados à mão (publicar / descartar) e comparar
- [ ] **Caçar alucinação no contexto BR**: toda afirmação de presença comercial, preço ou
      prazo tem de ser rastreável ao original — senão o parágrafo sai
- [ ] Conferir `cache_read_input_tokens > 0`
- [ ] Provocar 429 e 500 e verificar que o lote para em vez de queimar orçamento

E permanece tudo o que a sprint 0 já listava: nenhum navegador, nenhum leitor de tela,
nenhuma execução em produção.

---

## 6. Situação

```
73 asserções · 0 falhas · 1 aviso (fontes do Google, pendência conhecida)
24 conferências do parser · 0 falhas
custo acumulado: R$ 0,0000  — simulação
```

O aparato está pronto; **a prova de qualidade não começou.**
