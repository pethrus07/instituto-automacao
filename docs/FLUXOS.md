# Instituto Automação — Fluxos

> O caminho de cada coisa, da origem à tela. Quatro fluxos: **o item**, **o atraso**,
> **o evento** e **a obra**.

---

## 1. O item — da fonte à página

O caminho principal. Note onde estão os dois portões: a **licença** decide o que pode ser
feito com o texto, e a **confiança** decide se precisa de gente antes de publicar.

```mermaid
flowchart TD
    A["Cron dispara<br/>15 min (liberada) · 60 min (resumo)"] --> B["Busca o feed da fonte"]
    B --> C{"Já existe?<br/>URL canônica + título"}
    C -->|sim| C1["Descarta<br/>(marca visto_em)"]
    C -->|não| D["Grava como <b>coletado</b>"]

    D --> E["Triagem · Haiku<br/>isto é notícia ou ruído?"]
    E -->|ruído| E1["Arquiva<br/>(fica na base, fora do site)"]
    E -->|notícia| F["Classifica · Haiku<br/>núcleo · tema · fornecedores · UF · tipo"]

    F --> G{"fonte.licenca"}
    G -->|liberada| H["<b>Tradução integral</b> · Sonnet<br/>+ glossário no prompt"]
    G -->|resumo| I["<b>Resumo próprio</b> 3-5 linhas · Haiku<br/>nunca tradução"]
    G -->|bloqueada| G1["Nem entra"]

    H --> J["Contexto BR · Sonnet<br/>'o que isso muda aqui'"]
    I --> J
    J --> K["Agrupa em <b>assunto</b><br/>(ver fluxo 2)"]

    K --> L{"fonte.confianca"}
    L -->|alta + liberada| M["<b>Publica</b> com selo<br/>'tradução automática · revisão pendente'"]
    L -->|resto| N["Fila → WhatsApp"]

    N --> O{"Toque no WhatsApp"}
    O -->|aprovar| P["<b>Publica</b>"]
    O -->|descartar| P1["Arquiva"]
    O -->|editar| P2["Texto novo volta pela fila"]

    M --> Q["Purga o cache da borda<br/>+ gera OG image no R2"]
    P --> Q
    Q --> R(("No ar"))
```

**Por que dois caminhos de publicação.** "Primeira mão" e "esperar aprovação humana" são
incompatíveis. A saída é honesta em vez de esperta: fonte liberada e confiável vai ao ar
sozinha **com o selo dizendo que ninguém revisou ainda**, e o selo some quando alguém
revisa. O leitor sabe o que está lendo.

**Onde o custo é contido.** A triagem barata roda antes de qualquer coisa cara. Item que
não passa na triagem nunca chega no Sonnet. E `custo_dia` corta o coletor no teto.

---

## 2. O atraso — a pergunta-assinatura virando dado

Este fluxo não produz página nenhuma no começo. Produz **a base do Panorama** e a resposta
da pergunta que o Instituto persegue.

```mermaid
flowchart LR
    subgraph FORA["Fonte internacional"]
      A1["Fabricante publica<br/>12/03, 09:00 UTC"]
    end
    subgraph BR["Fonte brasileira"]
      B1["Portal/associação publica<br/>28/05, 14:00 UTC"]
    end

    A1 --> C["<b>assunto</b><br/>agrupa por título normalizado<br/>+ fornecedores em comum<br/>+ janela de 30 dias"]
    B1 --> C
    C --> D["primeira_mencao_br − publicado_original"]
    D --> E[("atraso_br = <b>77 dias</b>")]
    E --> F["Panorama trimestral<br/>atraso por segmento, fornecedor e tema"]
    E --> G["Dataset no Zenodo<br/>DOI + CC-BY"]
```

⚠️ **Fonte brasileira entra no radar mesmo sem ser publicada.** Ela não é pauta — é o
instrumento de medição. Sem ela não existe atraso, e sem atraso não existe a pergunta.

⚠️ **Não dá para reconstruir depois.** Notícia sai do ar, feed guarda só as últimas
dezenas de itens. Cada dia sem coletar é um dia que nunca mais volta.

---

## 3. O evento — o ativo durável

```mermaid
flowchart TD
    A["Cron diário<br/>calendários + salas de imprensa"] --> B["Extrai: nome, datas,<br/>cidade, formato, organizador"]
    B --> C{"Já existe?<br/>nome + data de início"}
    C -->|sim| D["Atualiza o que mudou<br/>(data muda o tempo todo)"]
    C -->|não| E["Grava como <b>coletado</b>"]
    E --> F["Fila → WhatsApp"]
    G["Organizador envia<br/>pelo formulário público"] --> F
    F --> H{"Toque no WhatsApp"}
    H -->|aprovar| I["<b>Publica</b><br/>+ schema.org/Event"]
    H -->|descartar| J["Arquiva"]
    I --> K["Aparece em /agenda<br/>e no filtro do núcleo"]
    K --> L(("Resultado rico<br/>no Google"))
```

Evento passa **sempre** por aprovação — são poucos por semana, e data errada em agenda
destrói a confiança na agenda inteira.

---

## 4. A obra — como o conteúdo assinado entra

Dois caminhos, calibrados por quem escreve. É aqui que o "sem backoffice" prova que vale.

```mermaid
flowchart TD
    subgraph V["sócio · Leitura do Instituto"]
      V1["Vê o item no radar"] --> V2["Responde no WhatsApp<br/>3 a 5 linhas"]
      V2 --> V3["Vira comentário do Núcleo Indústria<br/>ancorado naquele item"]
    end

    subgraph P["Pedro · Análise, Caso, Panorama"]
      P1["Escreve fora do celular"] --> P2["Manda o texto<br/>(WhatsApp ou arquivo)"]
      P2 --> P3["Vira obra <b>assinada</b><br/>com autor, data e núcleo"]
    end

    V3 --> Z["Publicado"]
    P3 --> Z
    Z --> Y["Radar e agenda: <b>sem autor</b><br/>Obra: <b>assinada</b>"]
```

**Por que o formato do sócio é curto de propósito.** Parceiro ocupado com formato longo
some no mês 2. Três a cinco linhas por cima de um item que ele já ia ler de qualquer jeito
é atrito quase zero — e é o suficiente para o núcleo Indústria ter voz própria.

**Por que a obra é assinada e o radar não.** Autoridade não transfere de marca anônima para
pessoa, e é autoridade pessoal o objetivo principal do projeto. O IPEA não assina o
clipping; assina o relatório.

---

## 5. Estados

Um item e um evento vivem no mesmo vocabulário:

```
coletado → (triagem) → classificado → traduzido/resumido → publicado
                ↓                              ↓
            arquivado                      corrigido
```

- **arquivado** não é apagado: fica na base, conta para o Panorama, só não aparece no site.
- **corrigido** gera registro em `correcao`, com data e texto — exigência da política
  editorial, e é o que separa veículo de blog.
