/**
 * REVISÃO por medição — Playwright.
 *
 *   node qa/revisao.mjs            (com `npm run dev` rodando)
 *   node qa/revisao.mjs 8788       (outra porta)
 *
 * Diferente do `verificar.mjs`, que afirma e falha, este script MEDE e
 * registra: 13 páginas em 3 larguras, acessibilidade (axe-core), transbordo
 * horizontal, alvos de toque, texto miúdo, foco visível, desempenho (LCP,
 * CLS, tamanho, pedidos), metadados, links internos quebrados, e os fluxos
 * de uso (tema, pular para o conteúdo, capa → peça, filtro da agenda,
 * assinatura com e-mail inválido, 404). Tira screenshot de tudo.
 *
 * Saída: qa/revisao/medidas.json + qa/revisao/*.png (pasta fora do git).
 * A nota é dada por gente, lendo isto e olhando as telas — o script só
 * garante que a nota tenha evidência.
 */
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const AXE = require.resolve('axe-core/axe.min.js');
const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ALVO = process.argv[2] ?? '8787';
const BASE = /^https?:\/\//.test(ALVO) ? ALVO.replace(/\/$/, '') : `http://127.0.0.1:${ALVO}`;
const SAIDA = join(RAIZ, 'qa', 'revisao');
mkdirSync(SAIDA, { recursive: true });

const PAGINAS = [
  ['capa', '/'],
  ['noticias', '/noticias'],
  ['relatorios', '/relatorios'],
  ['giro', '/giro'],
  ['agenda', '/agenda'],
  ['glossario', '/glossario'],
  ['blueprints', '/blueprints'],
  ['marca', '/marca'],
  ['peca-foto', '/noticias/nvidia-compra-hugging-face'],
  ['peca-arte', '/noticias/bndes-financia-robo-inspetor-da-tractian'],
  ['analise', '/relatorios/oito-dias-de-medicao-imprensa-brasileira-e-automacao'],
  ['evento', '/agenda/robobusiness-2026'],
  ['artigos', '/artigos'],
  ['autores', '/autores'],
  ['autor', '/autores/pedro-oliveira'],
  ['apoie', '/apoie'],
  ['404', '/nao-existe'],
];
const LARGURAS = {
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 900 },
};

const medidas = { base: BASE, quando: new Date().toISOString(), paginas: {}, fluxos: {}, links: {}, resumo: {} };
const t0 = Date.now();
const log = (s) => console.log(s);

/* Observadores de LCP e CLS têm de existir ANTES da página carregar. */
const INIT = `
  window.__lcp = 0; window.__cls = 0;
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
`;

/* O que se mede dentro da página, de uma vez. */
const MEDIR = `(() => {
  const vw = window.innerWidth;
  const sel = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const visivel = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };

  /* Transbordo que IMPORTA: o que vaza da tela sem que ninguém tenha pedido.
     O que está dentro de um rolador horizontal declarado (a faixa de autores,
     a tabela de fontes em .scroll-x) transborda de propósito — é o desenho,
     não o defeito. Sem esta exceção a lista enchia de falso positivo e, como
     ela para em 6, um transbordo de verdade ficava escondido atrás do ruído. */
  const emRolador = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll') return true;
    }
    return false;
  };
  const transbordo = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > vw + 1 && getComputedStyle(el).position !== 'fixed' && !emRolador(el)) {
      transbordo.push(sel(el) + ' (' + Math.round(r.right - vw) + 'px)');
      if (transbordo.length >= 6) break;
    }
  }

  const miudo = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!el.childNodes.length) continue;
    const temTexto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!temTexto || !visivel(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 12) miudo.push(sel(el) + ' ' + fs.toFixed(1) + 'px');
  }

  const alvos = [];
  for (const el of document.querySelectorAll('a, button, input, select, textarea, [role=button]')) {
    if (!visivel(el)) continue;
    if (el.closest('p, li.linha, .peca__corpo, .prancha__legenda, figcaption')) continue; // link em texto corrido é exceção da 2.5.8
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) alvos.push(sel(el) + ' ' + Math.round(r.width) + '×' + Math.round(r.height));
  }

  const hs = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1]));
  let saltos = 0; for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) saltos++;

  const imgs = [...document.images];
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const rec = performance.getEntriesByType('resource');
  const externos = [...new Set(rec.map((r) => { try { return new URL(r.name).host; } catch { return ''; } }).filter((h) => h && !h.startsWith('127.0.0.1') && !h.startsWith('localhost')))];
  const bytes = rec.reduce((t, r) => t + (r.transferSize || r.encodedBodySize || 0), 0) + (nav.transferSize || 0);
  const fontes = rec.filter((r) => r.initiatorType === 'css' && /\\.(woff2?|ttf|otf)(\\?|$)/.test(r.name)).length;

  const meta = (n) => document.querySelector('meta[name="' + n + '"], meta[property="' + n + '"]')?.content ?? null;
  const corpo = document.querySelector('.peca__corpo p, .prose p, main p');
  const cs = corpo ? getComputedStyle(corpo) : null;

  return {
    titulo: document.title, tituloLen: document.title.length,
    lang: document.documentElement.lang || null,
    descricao: meta('description'), descricaoLen: (meta('description') || '').length,
    canonical: document.querySelector('link[rel=canonical]')?.href ?? null,
    og: { title: !!meta('og:title'), image: !!meta('og:image'), type: meta('og:type') },
    viewportMeta: !!document.querySelector('meta[name=viewport]'), themeColor: !!meta('theme-color'),
    h1: document.querySelectorAll('h1').length, cabecalhos: hs.length, saltosDeNivel: saltos,
    landmarks: { main: !!document.querySelector('main'), nav: document.querySelectorAll('nav').length, header: !!document.querySelector('header'), footer: !!document.querySelector('footer') },
    pularConteudo: !!document.querySelector('a[href="#conteudo"]') && !!document.getElementById('conteudo'),
    imagens: imgs.length, imagensSemAlt: imgs.filter((i) => !i.hasAttribute('alt')).length, imagensQuebradas: imgs.filter((i) => i.complete && i.naturalWidth === 0).length, imagensLazy: imgs.filter((i) => i.loading === 'lazy').length,
    scrollHorizontal: document.documentElement.scrollWidth > vw + 1, transbordo, textoMiudo: miudo.slice(0, 8), textoMiudoN: miudo.length, alvosPequenos: alvos.slice(0, 8), alvosPequenosN: alvos.length,
    nodes: document.getElementsByTagName('*').length, htmlKB: Math.round(document.documentElement.outerHTML.length / 1024),
    perf: { dcl: Math.round(nav.domContentLoadedEventEnd || 0), load: Math.round(nav.loadEventEnd || 0), lcp: Math.round(window.__lcp || 0), cls: Number((window.__cls || 0).toFixed(4)), pedidos: rec.length + 1, kb: Math.round(bytes / 1024), fontes, externos },
    leitura: cs ? { fontePx: parseFloat(cs.fontSize), larguraPx: Math.round(corpo.getBoundingClientRect().width), lineHeight: cs.lineHeight, caracteresPorLinha: Math.round(corpo.getBoundingClientRect().width / (parseFloat(cs.fontSize) * 0.5)) } : null,
    linksInternos: [...new Set([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && (h.startsWith('/')) && !h.startsWith('//')))],
    /* O tema que a página REALMENTE pintou, mais a cor de fundo do body. A
       rodada do escuro afirma ter medido o escuro; isto é a prova, e é o que
       teria pegado as três capturas idênticas de antes de 11/09/2026. */
    temaEscuro: document.documentElement.dataset.theme === 'dark',
    fundoBody: getComputedStyle(document.body).backgroundColor,
  };
})()`;

async function medirPagina(context, nome, rota, largura) {
  const page = await context.newPage();
  const erros = []; const falhas = []; const avisos = [];
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text().slice(0, 160)); if (m.type() === 'warning') avisos.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => erros.push('pageerror: ' + String(e.message).slice(0, 160)));
  page.on('requestfailed', (r) => {
    // <video preload="metadata"> lê o cabeçalho e ABORTA o resto do arquivo: é o navegador
    // economizando banda, não um pedido que falhou. Sem este filtro, todo tour vira "falha".
    if (r.resourceType() === 'media' && /ERR_ABORTED/.test(r.failure()?.errorText ?? '')) return;
    falhas.push(r.url() + ' → ' + (r.failure()?.errorText ?? 'falhou'));
  });
  page.on('response', (r) => { if (r.status() >= 400 && !rota.startsWith('/nao-existe')) falhas.push(r.url() + ' → ' + r.status()); });

  const resposta = await page.goto(BASE + rota, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const m = await page.evaluate(MEDIR);
  m.status = resposta?.status();

  await page.addScriptTag({ path: AXE });
  const axe = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
    return r.violations.map((v) => ({ id: v.id, impacto: v.impact, n: v.nodes.length, alvo: v.nodes[0]?.target?.[0] ?? '', ajuda: v.help }));
  });
  m.axe = axe;
  m.axePorImpacto = axe.reduce((t, v) => ((t[v.impacto] = (t[v.impacto] || 0) + v.n), t), {});
  m.consoleErros = erros; m.consoleAvisos = avisos.length; m.pedidosFalhos = falhas;

  await page.screenshot({ path: join(SAIDA, `${nome}-${largura}.png`), fullPage: true });
  await page.close();
  return m;
}

/* ------------------------------------------------------------------ páginas × larguras */
/* bypassCSP: a CSP do site só libera o script do tema, e a revisão injeta o
   axe-core na página. A ferramenta de medir precisa passar; o leitor, não. */
const browser = await chromium.launch();
for (const [largura, vp] of Object.entries(LARGURAS)) {
  const context = await browser.newContext({ bypassCSP: true, viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, colorScheme: 'light', locale: 'pt-BR' });
  await context.addInitScript(INIT);
  for (const [nome, rota] of PAGINAS) {
    const m = await medirPagina(context, nome, rota, largura);
    (medidas.paginas[nome] ??= { rota })[largura] = m;
    log(`  ${largura.padEnd(8)} ${nome.padEnd(11)} ${String(m.status).padEnd(4)} lcp ${String(m.perf.lcp).padStart(4)}ms · ${String(m.perf.kb).padStart(4)} KB · ${m.perf.pedidos} req · axe ${JSON.stringify(m.axePorImpacto)} · transbordo ${m.transbordo.length} · alvos<24 ${m.alvosPequenosN} · miúdo ${m.textoMiudoN}`);
  }
  await context.close();
}

/* ------------------------------------------------------------------ escuro: capa e peça
 *
 * ⚠️ `colorScheme: 'dark'` NÃO escurece este site, e por decisão dele: não há
 * `prefers-color-scheme` em tokens.css — "o claro é o site; o escuro é uma
 * cortesia para quem pede no botão". Emular a preferência do sistema é emular
 * exatamente a coisa que o site ignora.
 *
 * Até 11/09/2026 era o que esta rodada fazia, e as três capturas "escuro"
 * saíam BYTE A BYTE idênticas às claras — o tema escuro nunca tinha sido
 * revisado de verdade, e ninguém viu porque ninguém comparou os arquivos.
 *
 * O jeito certo é entrar pela porta que o site abriu: gravar a escolha em
 * localStorage ANTES de navegar, que é de onde o script do tema lê no boot.
 * Sem `addInitScript`, a página pinta clara e só depois viraria — e o
 * screenshot pega o meio do caminho.
 */
{
  const context = await browser.newContext({ bypassCSP: true, viewport: LARGURAS.desktop, colorScheme: 'dark', locale: 'pt-BR' });
  await context.addInitScript(INIT);
  await context.addInitScript(`try { localStorage.setItem('tema', 'dark'); } catch (e) {}`);
  for (const [nome, rota] of [['capa', '/'], ['peca-foto', '/noticias/nvidia-compra-hugging-face'], ['agenda', '/agenda']]) {
    const m = await medirPagina(context, nome + '-escuro', rota, 'desktop');
    medidas.paginas[nome + '-escuro'] = { rota, desktop: m };
    log(`  escuro   ${nome.padEnd(11)} axe ${JSON.stringify(m.axePorImpacto)}${m.temaEscuro ? '' : '  ⚠️ NÃO ESCURECEU'}`);
  }
  await context.close();
}

/* ------------------------------------------------------------------ links internos: nenhum 404 */
{
  const todos = new Set();
  for (const p of Object.values(medidas.paginas)) for (const m of Object.values(p)) if (m?.linksInternos) m.linksInternos.forEach((h) => todos.add(h.split('#')[0]));
  todos.delete('');
  const quebrados = [];
  for (const h of todos) {
    const r = await fetch(BASE + h, { method: 'GET', redirect: 'manual' });
    if (r.status >= 400) quebrados.push(`${h} → ${r.status}`);
  }
  medidas.links = { total: todos.size, quebrados };
  log(`  links internos: ${todos.size} · quebrados: ${quebrados.length}`);
}

/* ------------------------------------------------------------------ fluxos de uso */
const fluxos = medidas.fluxos;
{
  const context = await browser.newContext({ bypassCSP: true, viewport: LARGURAS.desktop, colorScheme: 'light', locale: 'pt-BR' });
  const page = await context.newPage();

  // 1. tema: alterna e persiste
  await page.goto(BASE + '/');
  const antes = await page.evaluate(() => document.documentElement.dataset.theme ?? null);
  await page.click('#tema');
  const depois = await page.evaluate(() => document.documentElement.dataset.theme ?? null);
  await page.reload();
  const persistiu = await page.evaluate(() => document.documentElement.dataset.theme ?? null);
  fluxos.tema = { antes, depois, persistiu, ok: depois !== antes && persistiu === depois };
  await page.evaluate(() => localStorage.removeItem('tema'));

  // 2. teclado: primeiro Tab é "pular para o conteúdo"; foco visível nas 20 primeiras paradas
  await page.goto(BASE + '/');
  await page.keyboard.press('Tab');
  const primeiro = await page.evaluate(() => ({ tag: document.activeElement?.tagName, href: document.activeElement?.getAttribute('href'), texto: document.activeElement?.textContent?.trim() }));
  await page.keyboard.press('Enter');
  const pulou = await page.evaluate(() => location.hash === '#conteudo' || document.activeElement?.id === 'conteudo');
  const semIndicador = []; let paradas = 0;
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const visivel = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
      return { sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/)[0] : ''), visivel };
    });
    if (!f) break; paradas++;
    if (!f.visivel) semIndicador.push(f.sel);
  }
  fluxos.teclado = { primeiroTab: primeiro, pulouParaConteudo: pulou, paradas, semIndicadorVisivel: semIndicador };

  // 3. capa → peça em destaque → tem "O que isso muda aqui"
  await page.goto(BASE + '/');
  const destaque = page.locator('.destaque a').first();
  const hrefDestaque = await destaque.getAttribute('href');
  await destaque.click();
  await page.waitForLoadState('load');
  fluxos.capaParaPeca = { href: hrefDestaque, chegou: page.url().endsWith(hrefDestaque ?? '§'), temVeredito: await page.locator('text=O que isso muda aqui').count() > 0, temFonte: await page.locator('.fonte-caixa a[href^="http"]').count() > 0 };

  // 4. agenda: filtro Brasil
  await page.goto(BASE + '/agenda');
  const total = await page.locator('.evento').count();
  await page.locator('.filtro a', { hasText: 'Brasil' }).first().click();
  await page.waitForLoadState('load');
  const br = await page.locator('.evento').count();
  const ativo = await page.locator('.filtro a[aria-current], .filtro .pilula--ativa, .filtro a.ativo').count();
  fluxos.agendaFiltro = { url: page.url().replace(BASE, ''), total, filtrados: br, reduziu: br < total, estadoAtivoVisivel: ativo > 0 };

  // 5. assinar com e-mail inválido → não aceita
  await page.goto(BASE + '/');
  const form = page.locator('form[action="/assinar"]');
  const campo = form.locator('input[type=email], input[name=email]').first();
  const tipoEmail = await campo.getAttribute('type');
  await campo.fill('nao-e-email');
  const bloqueouNoNavegador = await page.evaluate(() => { const f = document.querySelector('form[action="/assinar"]'); return f ? !f.checkValidity() : null; });
  fluxos.assinarInvalido = { tipoEmail, bloqueouNoNavegador };

  // 6. formulário de evento: campos obrigatórios e rótulos
  await page.goto(BASE + '/agenda');
  fluxos.formularioEvento = await page.evaluate(() => {
    const f = document.querySelector('form[action="/agenda/enviar"]'); if (!f) return null;
    const campos = [...f.querySelectorAll('input, select, textarea')].filter((c) => c.type !== 'hidden' && c.type !== 'submit');
    const semRotulo = campos.filter((c) => !(c.id && f.querySelector(`label[for="${c.id}"]`)) && !c.closest('label') && !c.getAttribute('aria-label'));
    return { campos: campos.length, obrigatorios: campos.filter((c) => c.required).length, semRotulo: semRotulo.map((c) => c.name || c.type), honeypot: !!f.querySelector('input[name=sitio], .u-visually-hidden input') };
  });

  // 7. 404 tem caminho de volta
  const r404 = await page.goto(BASE + '/nao-existe');
  fluxos.pagina404 = { status: r404?.status(), linkCapa: await page.locator('main a[href="/"], a[href="/"]').count() > 0, temBusca: await page.locator('input[type=search]').count() > 0 };

  // 8. impressão: a peça sem navegação, com URL da fonte legível?
  await page.goto(BASE + '/noticias/nvidia-compra-hugging-face');
  await page.emulateMedia({ media: 'print' });
  fluxos.impressao = await page.evaluate(() => ({ navVisivel: getComputedStyle(document.querySelector('.navbar')).display !== 'none', rodapeVisivel: getComputedStyle(document.querySelector('footer')).display !== 'none', temRegraPrint: [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.media && /print/.test(r.media.mediaText)); } catch { return false; } }) }));
  await page.screenshot({ path: join(SAIDA, 'peca-impressao.png'), fullPage: true });
  await page.emulateMedia({ media: 'screen' });

  // 9. movimento reduzido: há transições/animações e há a regra?
  fluxos.movimento = await page.evaluate(() => ({ regraReducedMotion: [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => r.media && /prefers-reduced-motion/.test(r.media.mediaText)); } catch { return false; } }) }));

  await context.close();
}
await browser.close();

/* ------------------------------------------------------------------ resumo */
const todasMedidas = Object.values(medidas.paginas).flatMap((p) => Object.values(p).filter((m) => m && m.perf));
const soma = (f) => todasMedidas.reduce((t, m) => t + f(m), 0);
medidas.resumo = {
  paginasMedidas: todasMedidas.length,
  comScrollHorizontal: todasMedidas.filter((m) => m.scrollHorizontal).map((m) => m.titulo),
  axeTotal: todasMedidas.reduce((t, m) => { for (const [k, v] of Object.entries(m.axePorImpacto)) t[k] = (t[k] || 0) + v; return t; }, {}),
  axeIds: [...new Set(todasMedidas.flatMap((m) => m.axe.map((v) => v.id)))],
  consoleErros: soma((m) => m.consoleErros.length), pedidosFalhos: soma((m) => m.pedidosFalhos.length),
  lcpMax: Math.max(...todasMedidas.map((m) => m.perf.lcp)), clsMax: Math.max(...todasMedidas.map((m) => m.perf.cls)), kbMax: Math.max(...todasMedidas.map((m) => m.perf.kb)),
  externos: [...new Set(todasMedidas.flatMap((m) => m.perf.externos))],
  alvosPequenosMobile: Object.values(medidas.paginas).reduce((t, p) => t + (p.mobile?.alvosPequenosN ?? 0), 0),
  textoMiudoMobile: Object.values(medidas.paginas).reduce((t, p) => t + (p.mobile?.textoMiudoN ?? 0), 0),
  segundos: Math.round((Date.now() - t0) / 1000),
};
writeFileSync(join(SAIDA, 'medidas.json'), JSON.stringify(medidas, null, 2));
log('\nRESUMO ' + JSON.stringify(medidas.resumo, null, 1));
log('FLUXOS ' + JSON.stringify(medidas.fluxos, null, 1));
log(`\n→ ${join('qa', 'revisao', 'medidas.json')} e ${Object.keys(medidas.paginas).length * 3} screenshots em qa/revisao/`);
