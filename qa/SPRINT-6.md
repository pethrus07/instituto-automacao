# QA · Sprint 6 — o mapa das referências aplicado

> 30/08/2026 · `npm run qa` · **139 asserções · 0 falhas · 1 aviso** · +37 do `npm test`
>
> Capa, núcleo e item reconstruídos segundo o mapa de `design/referencias.html`, com o
> **veredito** entrando junto.

---

## 1. O que entrou

| Onde | De quem | O quê |
|---|---|---|
| Capa | Our World in Data | frase de propósito como `h1`, faixa de números **com pergunta no rótulo**, e a faixa só aparece quando há base |
| Capa e núcleo | Manufacturing Dive · Rest of World | **uma manchete manda**, com o peso virando tamanho |
| Item | Semafor · **Aos Fatos** | rótulo separando *o que a fonte diz* do que o Instituto lê, e o **veredito** como categoria fechada |
| Núcleo | — | filtro por veredito, cada recorte com URL e canonical próprios |

**O veredito**: `chega` · `a_caminho` · `nao_chega` · `sem_efeito`.

`nao_chega` é exatamente o que o atraso mede — então a pergunta-assinatura saiu do banco e
ganhou rosto em toda página, além de virar número clicável na capa.

`sem_efeito` é a opção honesta, e o prompt manda usá-la sem constrangimento. **Sem ela o
parágrafo vira enchimento**: o modelo sempre encontra alguma consequência quando é obrigado a
encontrar. É a mesma lição do *"não é bem assim"* do Aos Fatos.

**Sem imagem licenciada, a capa da manchete é o próprio bloco tipográfico** — e não é remendo:
é o mesmo desenho que vira a OG image gerada. Uma decisão serve aos dois lugares, e o layout
nunca fica com buraco.

---

## 2. Defeitos — e três deles fui eu que causei

### 2.1 A reconstrução da capa **apagou a rota da obra** ⚠️
Reescrevi a capa fatiando o arquivo entre dois comentários. **A rota de `/analise/<slug>`
estava exatamente no meio desse intervalo** e foi junto — quatro asserções da sprint 5 caíram
de uma vez.

Restaurada com três caminhos **explícitos** (`/analise/:slug`, `/caso/:slug`,
`/panorama/:slug`) em vez de um parâmetro com alternância na própria rota. Explícito não
depende de como o roteador interpreta a expressão, e não some quando alguém fatia o arquivo.

### 2.2 A capa perdeu o `h1`
Ao reescrever, troquei o título por um parágrafo. A página ficou sem `h1` — defeito de
estrutura que nenhum olho pega e que a asserção "exatamente um h1" pegou na hora.

Agora o `h1` da capa **é a promessa do site**, o que é o certo semanticamente.

### 2.3 Duas edições minhas falharam **em silêncio**
Apliquei mudanças por script sem `assert` na âncora. Quando o texto não bateu, o script
imprimiu sucesso e não mudou nada. O QA acusou; a leitura do código confirmou.

> Regra que passa a valer: **edição por script sem asserção na âncora é edição não feita.**
> É a mesma família dos três defeitos de régua das sprints anteriores — a ferramenta erra
> antes do código, e mente sobre isso.

### 2.4 O filtro de veredito misturava obra no recorte
Sob `?v=nao_chega` a seção *Obra* continuava aparecendo. Obra não tem veredito: a página
prometia um recorte e entregava lista misturada. Agora ela some sob filtro.

---

## 3. As invariantes novas

| Invariante | Por quê |
|---|---|
| O veredito é **categoria fechada** | rótulo aberto vira rótulo literário — é o que o Aos Fatos resolve e o Semafor não |
| Todo contexto publicado **tem veredito** | contexto sem veredito é juízo sem critério declarado |
| Cada `?v=` lista **exatamente** o que o banco diz | conferido valor a valor, não no agregado |
| Cada `?v=` tem **canonical próprio** | sem isso os recortes competem entre si na busca |
| O filtro **não mistura obra** | a página promete um recorte |
| A manchete aparece **uma vez só** | destaque repetido na lista abaixo é erro clássico de portal |
| O item **separa o que a fonte diz do que nós lemos** | a maior ambiguidade do produto |
| A página diz que o veredito é **redação do Instituto** | é juízo nosso, e a responsabilidade tem de estar declarada |
| A capa mostra números **ou** explica por que ainda não há | capa abrindo com zeros seria pior que capa sem faixa |

---

## 4. Comparação com o melhor disponível

| Dimensão | Instituto | Melhor disponível | Veredito |
|---|---|---|---|
| Separação fato × juízo | rótulo de camada + veredito fechado | Semafor (prosa) · Aos Fatos (selo) | **empatado com o Aos Fatos**, e o formato dele é melhor que o do Semafor |
| Número na capa | com pergunta no rótulo, e ausente quando não há base | Our World in Data | **empatado** |
| Hierarquia da manchete | uma manda, peso vira tamanho | Manufacturing Dive · Rest of World | **empatado** |
| Recorte por juízo editorial | filtro por veredito com URL própria | **não conheço equivalente** | **acima** |
| Imagem na manchete | **ainda não existe** | padrão em todos | **abaixo** |
| Direção de arte | nenhuma | Rest of World | **abaixo, e por opção** |

---

## 5. O que este QA **não** prova

1. **O veredito nunca foi gerado pela IA de verdade.** O prompt tem a regra dura ("só use
   `chega` se a presença brasileira estiver DITA no material"), e **nada verifica que ele
   obedece.** É o risco mais sério aberto no projeto: um veredito `chega` inventado é uma
   afirmação comercial falsa assinada pelo Instituto.
2. **Nenhuma imagem licenciada foi exibida.** A decisão de `licenca_imagem` está no documento;
   o campo, o download para o R2 e o crédito **não existem em código**.
3. **A OG image gerada não existe.** A capa tipográfica da manchete é o desenho dela — mas
   ninguém rasterizou nada ainda.
4. **Sem navegador**, de novo, e agora dói mais: a manchete é o primeiro elemento visual do
   site e **nunca foi vista renderizada em largura real**, nem no celular.
5. **O filtro de veredito filtra em memória**, sobre os 40 itens já carregados — não no SQL.
   Com volume, o recorte fica silenciosamente incompleto.

### Antes de qualquer divulgação

- [ ] Medir o veredito contra rótulo humano em ~30 itens reais (junto com a triagem)
- [ ] Levar o filtro de veredito para o SQL
- [ ] Ver a manchete em 360 px e em 1440 px
- [ ] `licenca_imagem`, download para o R2 e crédito

---

## 6. Situação

```
139 asserções · 0 falhas · 1 aviso (fontes do Google)
 37 conferências de unidade · 0 falhas
veredito: 1 nao_chega · 1 a_caminho · 1 sem_efeito (semente)
IA em simulação · custo R$ 0,0000
```
