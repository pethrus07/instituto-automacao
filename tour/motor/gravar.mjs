/* MOTOR · gravação
   ─────────────────────────────────────────────────────────────────
   Dirige o sistema de verdade no navegador e grava a tela.

   Duas coisas que fazem diferença no resultado e não são óbvias:

   1. O vídeo não mostra o cursor. Sem um ponteiro desenhado por nós, o
      vídeo fica com botões sendo apertados sozinhos e ninguém entende
      o que está acontecendo. Por isso `apontarEClicar`.

   2. Quem manda no tempo é a narração. Cada cena é esticada até a voz
      terminar de falar. Se a ação acabar antes, a tela fica parada
      mostrando o resultado — que é exatamente o que se quer ver.

   Genérico: não sabe nada do projeto. O que é específico entra pelos
   `ganchos` (entrar no sistema, cumprir uma lista…).
*/

/** Compara palavra falada com palavra do roteiro: sem acento, sem
 *  pontuação, sem caixa. "Configurações," e "configuracoes" são a mesma. */
const normalizar = (s) => (s || "").toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]/g, "");

export const TELAS = {
  computador: { viewport: { width: 1280, height: 720 }, movel: false },
  celular:    { viewport: { width: 390, height: 844 }, movel: true },
};

/* O ponteiro é injetado antes de qualquer script da página, para já
   existir na primeira tela. Fica fora do fluxo e não atrapalha cliques. */
const PONTEIRO = `
(() => {
  /* Cuidado com a ordem aqui: o init-script roda antes de existir
     <html>, então criar o elemento na hora ESTOURA e aborta o resto do
     bloco — as funções abaixo nunca seriam atribuídas. Já aconteceu: o
     ponteiro sumia do vídeo e o \`?.\` na chamada escondia a falha.
     Por isso as funções vêm primeiro e criam o elemento sob demanda. */
  const põe = () => {
    if (!document.documentElement) return null;
    const achado = document.getElementById("__ponteiro");
    if (achado) return achado;
    const d = document.createElement("div");
    d.id = "__ponteiro";
    d.style.cssText = [
      "position:fixed", "left:0", "top:0", "width:26px", "height:26px",
      "margin:-13px 0 0 -13px", "border-radius:50%", "z-index:2147483647",
      "pointer-events:none", "opacity:0",
      "background:radial-gradient(circle,rgba(255,255,255,.95) 0 34%,rgba(255,255,255,.25) 35% 100%)",
      "box-shadow:0 0 0 2px rgba(0,0,0,.35), 0 4px 14px rgba(0,0,0,.45)",
      "transition:transform .42s cubic-bezier(.22,.61,.36,1), opacity .2s",
    ].join(";");
    document.documentElement.appendChild(d);
    return d;
  };

  window.__mover = (x, y) => {
    const d = põe();
    if (!d) return false;
    d.style.opacity = "1";
    d.style.transform = "translate(" + x + "px," + y + "px)";
    return true;
  };
  window.__bater = () => {
    const d = põe();
    if (!d) return false;
    d.animate(
      [{ boxShadow: "0 0 0 0 rgba(255,255,255,.55)" },
       { boxShadow: "0 0 0 22px rgba(255,255,255,0)" }],
      { duration: 520, easing: "ease-out" });
  };
})();`;

/** Abre um contexto de gravação para uma "tela" (computador ou celular). */
export async function abrirGravacao(navegador, tela, pastaVideo) {
  const cfg = TELAS[tela];
  if (!cfg) throw new Error(`tela desconhecida: ${tela}`);
  const ctx = await navegador.newContext({
    ...cfg,
    isMobile: cfg.movel,
    hasTouch: cfg.movel,
    deviceScaleFactor: 1,          // 1 = grava no tamanho do viewport
    recordVideo: { dir: pastaVideo, size: cfg.viewport },
  });
  /* O relógio do vídeo nasce AQUI, com o contexto — não quando esta função
     devolve. Entre um ponto e outro ainda correm o addInitScript e o
     newPage, e esse intervalo já está dentro do arquivo gravado. Quem
     marcar o zero depois corta um pedaço a mais na montagem, e a trilha
     inteira sai adiantada em relação à imagem. */
  const videoZero = Date.now();
  await ctx.addInitScript(PONTEIRO);
  const page = await ctx.newPage();
  return { ctx, page, cfg, videoZero };
}

/** Monta o objeto `c` que as cenas do roteiro recebem. */
export function criarCena(page, { ganchos = {}, seletores = {} } = {}) {
  const sel = { folha: "dialog[open] .folha", fechar: "[data-fecha]", ...seletores };

  let ponteiroConferido = false;
  /* Confere UMA vez que o ponteiro respondeu. Sem isto ele pode sumir em
     silêncio e a gente só descobre olhando o vídeo pronto — foi o que
     aconteceu na primeira gravação. */
  const conferirPonteiro = async () => {
    if (ponteiroConferido) return;
    const tipo = await page.evaluate(() => typeof window.__mover);
    if (tipo !== "function")
      throw new Error("o ponteiro não foi instalado na página (window.__mover ausente)");
    ponteiroConferido = true;
  };

  const c = {
    page,

    esperar: ms => page.waitForTimeout(ms),

    tem: async s => (await page.$(s)) !== null,

    /* Leva o ponteiro até o elemento, deixa a pessoa ver onde ele parou,
       dá o "toque" e só então clica. É o que torna o vídeo legível. */
    async apontarEClicar(seletor, { antes = 380, depois = 520 } = {}) {
      await conferirPonteiro();
      const alvo = page.locator(`${seletor}:visible`).first();
      await alvo.scrollIntoViewIfNeeded().catch(() => {});
      const cx = await alvo.boundingBox();
      if (cx) {
        await page.evaluate(([x, y]) => window.__mover(x, y),
          [cx.x + cx.width / 2, cx.y + cx.height / 2]);
        await page.waitForTimeout(antes);
        await page.evaluate(() => window.__bater());
      }
      await alvo.click();
      await page.waitForTimeout(depois);
    },

    /* Digita letra por letra: campo que preenche de uma vez parece falha
       de gravação, e ninguém percebe que aquilo é alguém digitando. */
    async digitar(seletor, texto, ritmo = 55) {
      await conferirPonteiro();
      const alvo = page.locator(`${seletor}:visible`).first();
      await alvo.scrollIntoViewIfNeeded().catch(() => {});
      const cx = await alvo.boundingBox();
      if (cx) {
        await page.evaluate(([x, y]) => window.__mover(x, y),
          [cx.x + cx.width / 2, cx.y + cx.height / 2]);
        await page.waitForTimeout(260);
      }
      await alvo.click();
      await alvo.pressSequentially(texto, { delay: ritmo });
      await page.waitForTimeout(260);
    },

    limpar: async seletor => {
      await page.locator(`${seletor}:visible`).first().fill("");
      await page.waitForTimeout(400);
    },

    rolarTela: async (px, ms = 700) => {
      await page.evaluate(y => window.scrollBy({ top: y, behavior: "smooth" }), px);
      await page.waitForTimeout(ms);
    },

    rolarFolha: async (px, ms = 700) => {
      await page.evaluate(([s, y]) => document.querySelector(s)?.scrollBy({ top: y, behavior: "smooth" }),
        [sel.folha, px]);
      await page.waitForTimeout(ms);
    },

    fecharFolha: async () => {
      if (await page.$(sel.fechar)) {
        await page.locator(`${sel.fechar}:visible`).first().click();
        await page.waitForTimeout(500);
      }
    },

    ...ganchos,   // o que é específico do projeto
  };

  // os ganchos recebem `c` de volta, para poderem usar os ajudantes acima
  for (const [nome, fn] of Object.entries(ganchos)) {
    if (typeof fn === "function") c[nome] = (...a) => fn(c, ...a);
  }
  return c;
}

/** Roda as cenas de um bloco, anotando onde cada uma começa e termina.
 *
 *  `tolerante` existe para gravação longa. Sem ele, uma cena que estoura
 *  derruba o bloco inteiro: perde-se tudo o que já havia sido gravado e
 *  descobre-se UM defeito por execução de vários minutos. Com ele, a cena
 *  falha alto, entra marcada em `falhou`, e a execução segue — uma rodada
 *  devolve a lista completa do que precisa de conserto, com os botões que
 *  estavam na tela na hora.
 *
 *  ⚠️ Cena marcada `falhou` é NARRAÇÃO FALANDO DE ALGO QUE A TELA NÃO
 *  MOSTROU. O vídeo que sai é diagnóstico, não é publicável.
 */
export async function rodarBloco(c, cenas, audios, { pausaEntreCenas = 550, tolerante = false, t0: t0Externo } = {}) {
  /* `t0` PRECISA ser o instante em que o VÍDEO começou, não o instante em que
     este laço começou. O Playwright inicia a gravação quando a página é
     criada — antes de instalar a trava e montar a cena. Marcando o tempo aqui
     dentro, todas as marcas nascem deslocadas desse intervalo; o corte então
     descarta um pedaço a mais do que devia e a trilha inteira fica ADIANTADA
     em relação à imagem. Foi o que a Dani viu: "o guia aponta para um lugar e
     a voz já está lá na frente" — e valia para o vídeo todo, não só para os
     trechos em que o ponteiro passeia. */
  const t0 = t0Externo ?? Date.now();
  const marcas = [];
  for (const cena of cenas) {
    const inicio = (Date.now() - t0) / 1000;
    const inicioMs = Date.now();
    const palavras = audios[cena.id]?.palavras || [];

    /* `c.aos("Financeiro")` espera até o instante em que a voz diz aquela
       palavra, contado do começo da cena — que é exatamente onde o áudio
       dela é encaixado na montagem. É o que mantém ponteiro e voz juntos.
       `antes` faz o ponteiro sair um pouco ANTES da palavra, para chegar
       junto com ela em vez de depois: quem assiste lê o movimento como
       causa da fala, não como reação atrasada. */
    c.aos = async (alvo, { antes = 0.35, ocorrencia = 1 } = {}) => {
      const chave = normalizar(alvo);
      // `ocorrencia` importa: numa frase como "…Eventos, Relatórios… Clique
      // em Eventos, e ele abre…" a palavra aparece mais de uma vez, e agir na
      // primeira faria o ponteiro clicar antes da hora.
      const iguais = palavras.filter(p => normalizar(p.texto) === chave);
      const lista = iguais.length ? iguais
        : palavras.filter(p => normalizar(p.texto).startsWith(chave));
      const achou = lista[ocorrencia - 1];
      if (!achou) {
        console.log(`      ⚠ "${alvo}"${ocorrencia > 1 ? ` (${ocorrencia}ª vez)` : ""}` +
          " não aparece na narração desta cena — sem sincronia");
        return false;
      }
      const restante = Math.max(0, achou.t - antes) * 1000 - (Date.now() - inicioMs);
      if (restante > 0) await c.esperar(restante);
      if (process.env.SYNC_LOG) {
        const real = (Date.now() - inicioMs) / 1000;
        console.log(`        [sync] ${cena.id} · "${alvo}" falado em ${achou.t.toFixed(2)}s` +
          ` · ponteiro liberado em ${real.toFixed(2)}s` +
          ` · adiantado ${(achou.t - real).toFixed(2)}s`);
      }
      return true;
    };

    let falhou = null;
    try {
      await cena.acao(c);
    } catch (e) {
      if (!tolerante) throw e;
      falhou = (e.message || String(e)).split("\n")[0].slice(0, 120);
      const visiveis = await c.page.evaluate(() => [...document.querySelectorAll("button")]
        .filter(b => b.getBoundingClientRect().width > 0)
        .map(b => (b.innerText || "").replace(/\s+/g, " ").trim())
        .filter(Boolean).slice(0, 18)).catch(() => []);
      console.log(`      x cena "${cena.id}" falhou: ${falhou}`);
      console.log(`        botões visíveis: ${JSON.stringify(visiveis)}`);
    }
    // estica até a narração acabar: quem manda no tempo é a voz
    const falta = (audios[cena.id]?.segundos ?? 0) - ((Date.now() - t0) / 1000 - inicio);
    if (falta > 0) await c.esperar(falta * 1000);
    await c.esperar(pausaEntreCenas);
    marcas.push({ id: cena.id, inicio, fim: (Date.now() - t0) / 1000, falhou });
  }
  return marcas;
}
