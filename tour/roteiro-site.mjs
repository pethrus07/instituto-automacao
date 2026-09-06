/* ROTEIRO · o tour do Instituto Automação (≈ 1 min 30 s)
   ─────────────────────────────────────────────────────────────────
   Conteúdo, não motor. Cada cena é uma frase de narração e uma ação na
   tela — e a narração só afirma o que a tela mostra naquele instante.
   Nenhum número aparece na fala: os números da capa mudam todo dia e a
   voz não pode desmentir a tela de amanhã.

   Regras herdadas do MODELO-TUTORIAL (qa-parresia/tutoriais): segunda
   pessoa, presente; rótulo literal do que está na tela; uma ação por
   cena; a frase final diz o que a pessoa ganhou. Breve: a primeira
   versão tinha 2 min 18 s; esta corta metade das palavras e mantém as
   cenas — o que se vê é o mesmo, o que se diz é o essencial.

   Grava no site LOCAL (BASE), só leitura: nenhum formulário é enviado.
*/
export const VOZ = "pt-BR-ThalitaMultilingualNeural";
export const RITMO = "-8%";
export const PREFIXO = "instituto-automacao-tour";

const BASE = process.env.BASE || "http://127.0.0.1:8787";

export const GANCHOS = {
  /* Abre uma rota e espera a página assentar (fontes inclusive). */
  async ir(c, rota) {
    await c.page.goto(BASE + rota, { waitUntil: "load" });
    await c.page.evaluate(() => document.fonts.ready).catch(() => {});
    await c.esperar(350);
  },

  /* Leva o ponteiro até algo SEM clicar. `filter({visible:true})` em vez de
     ":visible" no seletor: o motor de texto do Playwright leria o sufixo
     como texto literal e falharia em silêncio. */
  async olharPara(c, seletor, { pausa = 320 } = {}) {
    const alvo = c.page.locator(seletor).filter({ visible: true }).first();
    if (!(await alvo.count().catch(() => 0))) { console.log(`      ⚠ não achei: ${seletor}`); return false; }
    await alvo.scrollIntoViewIfNeeded().catch(() => {});
    await c.esperar(100);
    const cx = await alvo.boundingBox().catch(() => null);
    if (!cx) return false;
    await c.page.evaluate(([x, y]) => window.__mover(x, y), [cx.x + cx.width / 2, cx.y + Math.min(cx.height / 2, 60)]);
    await c.esperar(pausa);
    return true;
  },

  /* Rola até um elemento ficar a um terço da tela — a leitura confortável. */
  async rolarAte(c, seletor, { fracao = 0.28 } = {}) {
    const alvo = c.page.locator(seletor).filter({ visible: true }).first();
    if (!(await alvo.count().catch(() => 0))) { console.log(`      ⚠ não achei: ${seletor}`); return false; }
    await alvo.evaluate((el, f) => {
      const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * f;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }, fracao);
    await c.esperar(650);
    return true;
  },

  /* Percorre alvos no compasso da voz: cada alvo espera a sua palavra. */
  async percorrer(c, pares) {
    for (const [palavra, seletor, opcoes] of pares) {
      if (palavra) await c.aos(palavra, opcoes);
      await c.olharPara(seletor, { pausa: 220 });
    }
  },
};

const capa = {
  id: "capa",
  titulo: "A capa",
  tela: "computador",
  cenas: [
    {
      id: "abertura",
      narracao: "Este é o Instituto Automação: o que o setor de automação publica lá fora, lido daqui.",
      async acao(c) {
        await c.ir("/");
        await c.olharPara(".marca__lockup");
        await c.aos("publica");
        await c.olharPara(".marca__linha");
      },
    },
    {
      id: "destaque",
      narracao: "A capa abre com uma peça em destaque: lida na fonte inteira, com autor, data, e a fonte original.",
      async acao(c) {
        await c.percorrer([
          ["destaque", ".destaque__titulo"],
          ["autor", ".destaque .assinatura__autor"],
          ["fonte", ".destaque .assinatura a[href^='http']", { ocorrencia: 2 }],
        ]);
      },
    },
    {
      id: "veredito",
      narracao: "E toda notícia recebe um veredito: chega aqui, a caminho, não chega, ou sem efeito.",
      async acao(c) {
        await c.aos("veredito");
        await c.olharPara(".destaque .veredito");
      },
    },
    {
      id: "tambem",
      narracao: "Abaixo, as outras peças da semana: foto de divulgação com o crédito escrito, ou arte desenhada por nós.",
      async acao(c) {
        await c.rolarAte(".grade");
        await c.percorrer([
          ["peças", ".grade .card:nth-child(1) .card__titulo"],
          ["crédito", ".grade .arte__credito"],
          ["arte", ".grade .arte--desenhada, .grade .arte--gerada"],
        ]);
      },
    },
    {
      id: "relogio",
      narracao: "Mais abaixo, o relógio: quanto tempo um assunto publicado lá fora leva para ser mencionado aqui.",
      async acao(c) {
        await c.rolarAte(".faixa-relogio");
        await c.aos("relógio");
        await c.olharPara(".faixa-relogio__titulo");
        await c.aos("mencionado");
        await c.olharPara(".faixa-relogio__numeros .numero:nth-child(1)");
      },
    },
    {
      id: "relatorios-agenda",
      narracao: "E os relatórios, com dado próprio, e a agenda de feiras e congressos.",
      async acao(c) {
        await c.rolarAte(".duas-colunas");
        await c.percorrer([
          ["relatórios", ".duas-colunas .linha__titulo"],
          ["agenda", ".duas-colunas .evento__nome"],
        ]);
      },
    },
  ],
};

const peca = {
  id: "peca",
  titulo: "Uma peça",
  tela: "computador",
  cenas: [
    {
      id: "peca-abre",
      narracao: "Na peça: título, resumo, autor, tempo de leitura, e a fonte original com link.",
      async acao(c) {
        await c.ir("/noticias/nvidia-compra-hugging-face");
        await c.percorrer([
          ["título", ".peca__titulo"],
          ["resumo", ".peca__lead"],
          ["autor", ".peca .assinatura__autor"],
          ["fonte", ".peca__cabeca .assinatura a[href^='http']"],
        ]);
      },
    },
    {
      id: "peca-imagem",
      narracao: "A imagem só entra com licença, e o crédito fica no canto.",
      async acao(c) {
        await c.rolarAte(".peca__arte");
        await c.aos("canto");
        await c.olharPara(".peca__arte .arte__credito");
      },
    },
    {
      id: "peca-muda",
      narracao: "No fim de toda notícia, o que isso muda aqui. Na lateral, o critério do veredito e a fonte, para você conferir.",
      async acao(c) {
        await c.rolarAte("h2:has-text('O que isso muda aqui')");
        await c.olharPara("h2:has-text('O que isso muda aqui')");
        await c.aos("lateral");
        await c.olharPara(".peca__lateral .veredito-caixa");
        await c.aos("fonte");
        await c.olharPara(".peca__lateral .fonte-caixa");
      },
    },
  ],
};

const agenda = {
  id: "agenda",
  titulo: "A agenda",
  tela: "computador",
  cenas: [
    {
      id: "agenda-abre",
      narracao: "A agenda tem filtros por tema, formato e lugar.",
      async acao(c) {
        await c.ir("/agenda");
        await c.percorrer([
          ["tema", ".filtro:nth-of-type(1)"],
          ["formato", ".filtro:nth-of-type(2)"],
          ["lugar", ".filtro:nth-of-type(3)"],
        ]);
      },
    },
    {
      id: "agenda-brasil",
      narracao: "Clicando em Brasil, ficam só os eventos daqui, todos com a data conferida na fonte.",
      async acao(c) {
        await c.aos("Brasil");
        await c.apontarEClicar(".filtro a:has-text('Brasil')");
        await c.aos("conferida");
        await c.olharPara(".evento:nth-child(1) .evento__nome");
      },
    },
  ],
};

const blueprints = {
  id: "blueprints",
  titulo: "Blueprints e glossário",
  tela: "computador",
  cenas: [
    {
      id: "blueprints-abre",
      narracao: "Em Blueprints, o método fica aberto: como colhemos, como medimos o atraso, e cada fonte com o robots ponto txt ao lado.",
      async acao(c) {
        await c.ir("/blueprints");
        /* o player do próprio tour fica no topo desta página: rola até "Como
           funciona" encostar no alto, senão o vídeo mostra um vídeo dentro dele */
        await c.rolarAte("h2:has-text('Como funciona')", { fracao: 0.06 });
        await c.olharPara("h2:has-text('Como funciona')");
        await c.aos("medimos");
        await c.rolarAte("h2:has-text('Como medimos o atraso')");
        await c.aos("fonte");
        await c.rolarAte("h2:has-text('As fontes')");
        await c.olharPara("table th:nth-child(5)");
      },
    },
    {
      id: "blueprints-dataset",
      narracao: "As correções ficam registradas, e o dataset está aí para baixar e refazer.",
      async acao(c) {
        await c.rolarAte("h2:has-text('Correções')");
        await c.aos("dataset");
        await c.rolarAte("h2:has-text('O dataset')");
        await c.olharPara("a[href$='.csv']");
      },
    },
    {
      id: "glossario",
      narracao: "E o glossário fixa como cada termo se escreve em português.",
      async acao(c) {
        await c.ir("/glossario");
        await c.aos("português");
        await c.rolarAte("h2:has-text('Não se traduzem')");
      },
    },
  ],
};

const fecho = {
  id: "fecho",
  titulo: "Fecho",
  tela: "computador",
  cenas: [
    {
      id: "fecho",
      narracao: "Nada aqui é gerado por máquina. Toda peça tem autor. Boa leitura.",
      async acao(c) {
        await c.ir("/");
        await c.aos("autor");
        await c.rolarAte(".rodape__pe");
        await c.olharPara(".rodape__pe span");
      },
    },
  ],
};

export const PARTES = [capa, peca, agenda, blueprints, fecho];
