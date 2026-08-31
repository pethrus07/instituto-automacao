# QA · Sprint 3 — agenda

> 30/08/2026 · `npm run qa` · **96 asserções · 0 falhas · 1 aviso** · +24 do parser
>
> A agenda é o ativo mais durável do projeto: notícia decai em 48 h, calendário não.

---

## 1. O que entrou

`/agenda` com filtros por URL, `/agenda/<slug>`, formulário público de envio,
`schema.org/Event` e `ItemList` em JSON-LD.

**Cada combinação de filtro é uma URL própria** — `?n=industria&f=presencial` — com canonical
próprio. Indexável, linkável e mandável no WhatsApp para o organizador da feira. São links,
não formulário: são poucas opções, e link já navega por teclado, abre em nova aba e entra no
histórico. Zero JavaScript, como o resto do site.

**Filtros conferidos contra o banco**, não contra si mesmos: 5 à frente no total, 2 de
Indústria, 1 online, 2 no exterior, 3 no Brasil, 0 em Operação+exterior — e o recorte vazio
explica e oferece saída em vez de mostrar página em branco.

---

## 2. Defeitos encontrados

### 2.1 Evento passado se apresentava como se fosse acontecer
`/agenda/<slug>` de um evento encerrado respondia **200 exibindo data futura implícita**.
Quem chegasse pela busca meses depois acharia que o evento ainda vai acontecer.

Consertado sem quebrar link: **o permalink continua no ar** — derrubar para 404 quebraria o
link de todo mundo que já compartilhou — mas a página passa a dizer, em destaque, que já
aconteceu, e aponta para a agenda. Virou asserção nas duas direções: o permalink responde 200
**e** contém o aviso.

### 2.2 Duas medições minhas estavam erradas (não o produto)
`grep -c` conta **linhas**, e o HTML sai em uma só — todo filtro "retornava 1". E o regex de
extração do JSON-LD era guloso, engolindo até o `</script>` do botão de tema, o que fazia o
JSON parecer inválido.

Nos dois casos o produto estava certo e a régua errada. É a terceira vez na série que a
ferramenta de verificação erra antes do código — daí a régua ter virado asserção com fonte
no banco, e não string solta.

---

## 3. Conformidade — o que a agenda promete

| Invariante | Por que importa |
|---|---|
| Lista exatamente os eventos que **ainda não terminaram** | conferido contra o banco, não contra a própria página |
| **Evento em curso continua listado** | feira de 4 dias no 3º dia ainda acontece; sumir no meio destrói a confiança na agenda inteira |
| Envio não conferido **não aparece** e sua página dá 404 | data errada em agenda é pior que agenda vazia |
| Permalink de evento passado sobrevive **e avisa** | link compartilhado não pode morrer, nem mentir |
| Cada filtro tem **canonical próprio** | sem isso os recortes competem entre si na busca |
| JSON-LD válido nas duas páginas | `ItemList` na listagem, `Event` na página |
| **Não declara oferta sem preço conhecido** | preço inventado em dado estruturado aparece na busca do Google |
| JSON-LD escapa `<` e `>` | nome de evento vem de formulário público: `</script>` dentro da string fecharia a tag e o resto do documento viraria script |

O formulário foi exercitado de verdade: **400** sem nome, **400** com data passada, **303** no
envio válido, **303** no honeypot — e o honeypot **não grava**, então o robô acha que
funcionou. UF chega normalizada (`pe` → `PE`), e tudo entra como `coletado`.

---

## 4. Comparação com o melhor disponível

| Dimensão | Instituto | Melhor disponível | Veredito |
|---|---|---|---|
| Dados estruturados | `Event` + `ItemList`, com modo de participação e local | é o que o Google documenta | **empatado** |
| Filtro sem JS, cada recorte com URL | sim | a maioria dos calendários usa JS e perde a indexação | **acima** |
| Evento em curso | permanece listado | erro comum em agenda de portal | **acima** |
| Permalink de evento passado | sobrevive e se declara | muitos dão 404 e quebram o link | **acima** |
| Envio pelo organizador | formulário público, gratuito, com conferência | padrão do setor | **empatado** |
| Fuso e data | data de calendário tratada como data, sem `Date` | erro clássico: meia-noite UTC vira o dia anterior no Brasil | **acima** |
| Proteção contra spam | **só honeypot** | rate-limit, captcha ou moderação com reputação | **abaixo** |
| Lembrete e exportação (`.ics`, "adicionar ao calendário") | **não existe** | padrão em agenda boa | **abaixo** |
| Busca e paginação | **não existe** (teto de 60) | necessário quando a agenda crescer | **abaixo** |

---

## 5. O que este QA **não** prova

1. **O formulário não tem proteção séria.** Honeypot para robô ingênuo e nada mais: sem
   rate-limit, sem captcha, sem limite por IP. Um envio automatizado enche a fila de
   conferência. Aceitável enquanto ninguém sabe que o site existe; **precisa mudar antes de
   divulgar a agenda.**
2. **Nenhum evento aqui é real.** São sete fictícios. Data de feira real muda, e é justamente
   a atualização de data que a sprint 1 vai exercitar.
3. **Nada foi validado no Rich Results Test do Google.** O JSON-LD parseia e tem os campos
   certos por inspeção; quem decide se vira resultado rico é o Google, e isso só se testa com
   URL pública.
4. **Sem navegador**, de novo: o formulário não foi preenchido por teclado, nem lido por
   leitor de tela, nem testado em 320 px. Um formulário é a peça mais dependente disso no
   site inteiro.
5. **Sem volume.** A agenda tem teto de 60 e nenhuma paginação. Com 200 eventos, a página
   fica longa e a consulta cresce — não medido.

### Antes de divulgar a agenda

- [ ] Rate-limit no envio (por IP, e por janela de tempo)
- [ ] Testar o formulário por teclado e com leitor de tela
- [ ] Validar uma URL pública no Rich Results Test
- [ ] Paginação, quando passar de ~60 eventos
- [ ] `.ics` por evento e assinatura do calendário inteiro

---

## 6. Situação

```
96 asserções · 0 falhas · 1 aviso (fontes do Google, pendência conhecida)
24 conferências do parser · 0 falhas
5 eventos listados de 7 no banco — 1 passado, 1 não conferido, ambos corretamente fora
IA em simulação · custo R$ 0,0000
```
