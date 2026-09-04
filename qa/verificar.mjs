/**
 * QA do Instituto Automação · v2 — mede, não afirma.
 *
 *   npm run qa            (com `npm run dev` rodando em outra aba)
 *   npm run qa -- 8788    (outra porta)
 *
 * Três eixos:
 *   A. FUNCIONAL    — as rotas, o banco e o bundle fazem o que deveriam
 *   B. CONFORMIDADE — o que está no ar bate com o que docs/EXECUCAO-V2.md promete
 *   C. QUALIDADE    — contraste, semântica, peso: medidos, não jurados
 *
 * Os treze critérios de "perfeito" (P1–P13) estão marcados onde são medidos.
 * Regra da casa: toda afirmação escrita em documento vira asserção aqui.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = process.argv[2] ?? '8787';
const BASE = `http://127.0.0.1:${PORTA}`;

let ok = 0;
const falhas = [];
const avisos = [];
const medidas = {};

const cor = { v: '\x1b[32m', r: '\x1b[31m', a: '\x1b[33m', c: '\x1b[36m', z: '\x1b[0m' };

function checar(eixo, nome, condicao, detalhe = '') {
  if (condicao) {
    ok++;
    console.log(`  ${cor.v}ok${cor.z}    ${nome}`);
  } else {
    falhas.push({ eixo, nome, detalhe });
    console.log(`  ${cor.r}FALHA${cor.z} ${nome}${detalhe ? `\n        ${detalhe}` : ''}`);
  }
}
function avisar(nome, detalhe) {
  avisos.push({ nome, detalhe });
  console.log(`  ${cor.a}aviso${cor.z} ${nome}${detalhe ? ` — ${detalhe}` : ''}`);
}
const titulo = (t) => console.log(`\n${cor.c}${t}${cor.z}`);

/* ======================================================================== */
/* Ferramentas                                                               */
/* ======================================================================== */

async function pegar(caminho) {
  const t0 = performance.now();
  const r = await fetch(BASE + caminho, { redirect: 'manual' });
  const corpo = await r.text();
  return {
    status: r.status,
    cab: Object.fromEntries(r.headers),
    corpo,
    bytes: new TextEncoder().encode(corpo).length,
    ms: Math.round(performance.now() - t0),
  };
}

function contraste(hex1, hex2) {
  const lum = (hex) => {
    const n = hex.replace('#', '');
    const c = n.length === 3 ? n.split('').map((x) => x + x) : n.match(/.{2}/g);
    const [r, g, b] = c.map((h) => {
      const v = parseInt(h, 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(hex1);
  const b = lum(hex2);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function tokensDo(css, seletor) {
  const i = css.indexOf(seletor);
  if (i < 0) return {};
  const abre = css.indexOf('{', i);
  let nivel = 0;
  let fim = abre;
  for (let j = abre; j < css.length; j++) {
    if (css[j] === '{') nivel++;
    if (css[j] === '}') {
      nivel--;
      if (nivel === 0) {
        fim = j;
        break;
      }
    }
  }
  const mapa = {};
  for (const m of css.slice(abre, fim).matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) mapa[m[1]] = m[2];
  return mapa;
}

const WRANGLER = join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

function sql(comando) {
  const saida = execFileSync(
    process.execPath,
    [WRANGLER, 'd1', 'execute', 'instituto', '--local', '--json', '--command', comando],
    { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  const i = saida.indexOf('[');
  if (i < 0) throw new Error(`resposta sem JSON: ${saida.slice(0, 200)}`);
  return JSON.parse(saida.slice(i))[0]?.results ?? [];
}

/** As peças, lidas da FONTE (conteudo/**.md), não do site — o site é o que se testa. */
function lerPecas() {
  const pecas = [];
  for (const secao of ['noticias', 'relatorios', 'giro']) {
    const pasta = join(RAIZ, 'conteudo', secao);
    if (!existsSync(pasta)) continue;
    for (const nome of readdirSync(pasta).filter((n) => n.endsWith('.md')).sort()) {
      const texto = readFileSync(join(pasta, nome), 'utf8');
      const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(texto)?.[1] ?? '';
      const meta = {};
      let pai = null;
      for (const linha of fm.split(/\r?\n/)) {
        if (!linha.trim() || linha.trim().startsWith('#')) continue;
        const recuada = /^\s/.test(linha);
        const [k, ...v] = linha.trim().split(':');
        const valor = v.join(':').trim().replace(/^["']|["']$/g, '');
        if (recuada && pai) meta[pai][k.trim()] = valor;
        else if (valor === '') { pai = k.trim(); meta[pai] = {}; }
        else { pai = null; meta[k.trim()] = valor; }
      }
      const m = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/.exec(nome);
      pecas.push({ arquivo: `conteudo/${secao}/${nome}`, secao, slug: m?.[2], dataNome: m?.[1], meta, corpo: texto.split(/\r?\n---\r?\n/)[1] ?? '' });
    }
  }
  return pecas;
}

/* ======================================================================== */
console.log(`\nQA · Instituto Automação v2 — ${BASE}`);

const pecas = lerPecas();
const noticias = pecas.filter((p) => p.secao === 'noticias');
medidas.pecas = pecas.length;
medidas.noticias = noticias.length;

/* ------------------------------------------------------------ A. ROTAS */
titulo('A · Funcional — rotas');

const rotas = [
  ['/', 200], ['/noticias', 200], ['/relatorios', 200], ['/giro', 200],
  ['/agenda', 200], ['/glossario', 200], ['/blueprints', 200], ['/saude', 200],
  ['/favicon.svg', 200], ['/feed.xml', 200], ['/feed/noticias.xml', 200], ['/sitemap.xml', 200], ['/robots.txt', 200],
  ...pecas.map((p) => [`/${p.secao}/${p.slug}`, 200]),
  ['/noticias/nao-existe', 404], ['/relatorios/nao-existe', 404], ['/qualquer-coisa', 404], ['/feed/inventado.xml', 404],
];
const respostas = {};
for (const [caminho, esperado] of rotas) {
  const r = await pegar(caminho);
  respostas[caminho] = r;
  checar('A', `${caminho} → ${esperado}`, r.status === esperado, `veio ${r.status}`);
}

const saude = JSON.parse(respostas['/saude'].corpo);
checar('A', 'healthcheck reporta banco ok', saude.ok === true, JSON.stringify(saude));
checar('A', 'healthcheck conta as peças compiladas', saude.pecas === pecas.length, `saúde diz ${saude.pecas}, há ${pecas.length} arquivos`);

const css = await pegar(saude.rota_css);
checar('A', 'CSS servido pela rota com hash', css.status === 200 && css.bytes > 8000);
checar('A', 'CSS antigo em cache não devolve 404', (await pegar('/a/app-hashvelho.css')).status === 200);
checar('A', 'favicon é SVG', (respostas['/favicon.svg'].cab['content-type'] ?? '').includes('svg'));

medidas.htmlCapa = respostas['/'].bytes;
medidas.css = css.bytes;
medidas.msCapa = respostas['/'].ms;

titulo('A · Funcional — cabeçalhos de cache');
checar('A', 'listagem tem s-maxage de 5 min', respostas['/noticias'].cab['cache-control'] === 'public, max-age=0, s-maxage=300', respostas['/noticias'].cab['cache-control']);
checar('A', 'CSS é immutable', (css.cab['cache-control'] ?? '').includes('immutable'));

/* ------------------------------------------------- A. P1 · sem IA no bundle */
titulo('A · Funcional — P1: zero IA no bundle compilado');
try {
  execFileSync(process.execPath, [WRANGLER, 'deploy', '--dry-run', '--outdir', 'dist'], {
    cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  const arquivos = readdirSync(join(RAIZ, 'dist')).filter((n) => n.endsWith('.js'));
  const bundle = arquivos.map((n) => readFileSync(join(RAIZ, 'dist', n), 'utf8')).join('\n');
  medidas.bundleKB = (Buffer.byteLength(bundle) / 1024).toFixed(0);
  for (const marca of ['anthropic', 'ANTHROPIC_API_KEY', 'IA_CONTA', 'IA_SIMULAR', 'claude-']) {
    checar('A', `P1 · bundle não contém "${marca}"`, !bundle.includes(marca), 'IA em produção é a decisão que a v2 desfez');
  }
  checar('A', 'o bundle leva as peças compiladas', pecas.every((p) => bundle.includes(p.slug)), 'peça em conteudo/ que não chegou ao bundle não existe para o leitor');
} catch (e) {
  checar('A', 'P1 · dry-run do wrangler', false, String(e.stderr ?? e).slice(-400));
}

/* ------------------------------------------------------------- B. BANCO */
titulo('B · Conformidade — o banco depois da cirurgia');

const tabelas = sql(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf%' AND name NOT LIKE 'd1_%'`).map((r) => r.name).sort();
const esperadas = ['assinante', 'assunto', 'correcao', 'evento', 'fonte', 'glossario', 'item'];
checar('B', `as ${esperadas.length} tabelas da v2, e só elas`, JSON.stringify(tabelas) === JSON.stringify(esperadas), tabelas.join(', '));
for (const morta of ['obra', 'giro', 'custo_dia']) checar('B', `a tabela ${morta} não existe mais`, !tabelas.includes(morta));

const colunasItem = sql(`PRAGMA table_info(item)`).map((c) => c.name).sort();
checar('B', 'item tem exatamente 10 colunas', colunasItem.length === 10, colunasItem.join(', '));
for (const morta of ['modo', 'status', 'corpo', 'contexto_br', 'contexto_veredito', 'slug', 'revisado_humano', 'og_key']) {
  checar('B', `item.${morta} saiu`, !colunasItem.includes(morta));
}

/* P4 · a promessa publicada: fonte que bloqueia robô não entra */
const proibidos = sql(`SELECT COUNT(*) n FROM item i JOIN fonte f ON f.id = i.fonte_id WHERE f.robots_permite = 0`)[0].n;
checar('B', 'P4 · NENHUM item vem de fonte que o robots.txt recusa', proibidos === 0, `${proibidos} itens`);
checar('B', 'nenhuma URL canônica duplicada', sql(`SELECT COUNT(*) n FROM (SELECT url_canonica FROM item GROUP BY url_canonica HAVING COUNT(*)>1)`)[0].n === 0);
checar('B', 'nenhum atraso negativo', sql(`SELECT COUNT(*) n FROM assunto WHERE atraso_br_dias < 0`)[0].n === 0);
checar('B', 'toda fonte tem colheita conhecida', sql(`SELECT COUNT(*) n FROM fonte WHERE colheita NOT IN ('feed','sitemap')`)[0].n === 0);
checar('B', 'nenhuma fonte é coletada mais rápido que o Crawl-delay dela', sql(`SELECT COUNT(*) n FROM fonte WHERE robots_atraso IS NOT NULL AND intervalo_min * 60 < robots_atraso`)[0].n === 0);
checar('B', 'só há dois temas no banco', sql(`SELECT COUNT(*) n FROM fonte WHERE nucleo IS NOT NULL AND nucleo NOT IN ('industria','processos')`)[0].n === 0, 'os quatro núcleos viraram dois temas na migração 005');
const bloqueada = sql(`SELECT COUNT(*) n FROM item i JOIN fonte f ON f.id=i.fonte_id WHERE f.licenca='bloqueada'`)[0].n;
checar('B', 'nenhum item veio de fonte bloqueada', bloqueada === 0);

const fontesAtivas = sql(`SELECT COUNT(*) n FROM fonte WHERE ativo=1`)[0].n;
const relogioBR = sql(`SELECT COUNT(*) n FROM fonte WHERE ativo=1 AND marca_relogio=1 AND pais='BR'`)[0].n;
medidas.fontesAtivas = fontesAtivas;
medidas.relogioBR = relogioBR;
checar('B', 'há fontes brasileiras marcando o relógio', relogioBR >= 1, 'sem elas a pergunta-assinatura não tem par para medir');
checar('B', 'toda voz declara o papel de quem assina', sql(`SELECT COUNT(*) n FROM fonte WHERE pessoa IS NOT NULL AND pessoa_papel IS NULL`)[0].n === 0);

/* ---------------------------------------------------------- B. CONTEÚDO */
titulo('B · Conformidade — P2, P3: as peças');

checar('B', 'há ao menos uma peça publicada', pecas.length >= 1, 'site perfeito e vazio é a v1 com outra cara');
for (const p of pecas) {
  const m = p.meta;
  const ok2 = m.titulo && m.lead && m.autor && m.data && m.secao === p.secao && /^\d{4}-\d{2}-\d{2}$/.test(m.data);
  checar('B', `P2 · ${p.arquivo}: autor, data, seção, título e lead`, Boolean(ok2), JSON.stringify(Object.keys(m)));
  checar('B', `${p.arquivo}: o nome do arquivo casa com a data`, m.data === p.dataNome);
  if (p.secao === 'noticias') {
    checar('B', `P3 · ${p.slug}: veredito na categoria fechada`, ['chega', 'a_caminho', 'nao_chega', 'sem_efeito'].includes(m.veredito), m.veredito);
    checar('B', `P2 · ${p.slug}: fonte com nome, url http(s) e idioma`, Boolean(m.fonte?.nome && /^https?:\/\//.test(m.fonte?.url ?? '') && m.fonte?.idioma), JSON.stringify(m.fonte));
    checar('B', `${p.slug}: tem a seção "O que isso muda aqui"`, /##\s*O que isso muda aqui/i.test(p.corpo), 'é a camada que separa leitura de tradução');
  } else {
    checar('B', `${p.slug}: ${p.secao} não leva veredito`, m.veredito === undefined);
  }
  if (m.arte) checar('B', `${p.slug}: a arte declarada existe`, existsSync(join(RAIZ, 'conteudo', 'arte', m.arte)), m.arte);
  checar('B', `${p.slug}: corpo com mais de 120 palavras`, p.corpo.trim().split(/\s+/).length > 120);
}

/* a página de cada peça */
for (const p of pecas) {
  const html = respostas[`/${p.secao}/${p.slug}`].corpo;
  checar('B', `/${p.secao}/${p.slug} mostra o autor`, html.includes(p.meta.autor));
  checar('B', `/${p.secao}/${p.slug} tem arte (desenhada ou gerada)`, /data-arte="(desenhada|gerada)"/.test(html));
  checar('B', `/${p.secao}/${p.slug} declara como foi feita`, html.includes('Como esta peça foi feita'));
  checar('B', `/${p.secao}/${p.slug} nega máquina na redação`, html.includes('por máquina'));
  if (p.secao === 'noticias') {
    const ancorasFonte = [...html.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]).filter((t) => t.includes(p.meta.fonte.url));
    checar('B', `/${p.secao}/${p.slug} credita a fonte com link`, ancorasFonte.length >= 1);
    checar('B', `/${p.secao}/${p.slug} link da fonte tem noopener`, ancorasFonte.every((t) => /rel\s*=\s*"[^"]*noopener/.test(t)));
    checar('B', `/${p.secao}/${p.slug} mostra o veredito com critério`, html.includes(`veredito v-${p.meta.veredito}`) && html.includes('O que isso muda aqui'));
  }
  if (p.meta.arte) checar('B', `/${p.secao}/${p.slug} usa a arte desenhada`, html.includes('data-arte="desenhada"'));
}

/* ------------------------------------------------------------ B. P5 · P6 */
titulo('B · Conformidade — P5: a capa nunca lê como vazia · P6: sem infraestrutura de volume');

const capa = respostas['/'].corpo;
const temDestaque = /class="destaque"/.test(capa);
const temVazio = /class="vazio"/.test(capa);
checar('B', 'P5 · a capa abre com uma peça OU diz o que está vindo', pecas.length > 0 ? temDestaque : temVazio, `destaque=${temDestaque} vazio=${temVazio}`);
checar('B', 'P5 · a capa não vaza "undefined" nem "null"', !/>\s*(undefined|null)\s*</.test(capa));
checar('B', 'P5 · a faixa do relógio está na capa, com números', /faixa-relogio/.test(capa) && /numero__valor/.test(capa));
checar('B', 'P5 · relatórios sem peça mostra o estado vazio honesto', /class="vazio"/.test(respostas['/relatorios'].corpo) || /class="destaque"/.test(respostas['/relatorios'].corpo));
for (const secao of ['noticias', 'relatorios', 'giro']) {
  const html = respostas[`/${secao}`].corpo;
  checar('B', `P5 · /${secao} nunca é lista vazia muda`, /class="(vazio|destaque|card|linha)"/.test(html));
}

const todasAsPaginas = Object.entries(respostas).filter(([, r]) => (r.cab['content-type'] ?? '').includes('text/html'));
for (const morto of ['paginacao', 'selo--pendente', 'linha-item', 'grade-sec', 'nucleo-card', '?v=nao_chega', 'Revisão pendente', 'tradução automática']) {
  const onde = todasAsPaginas.filter(([, r]) => r.corpo.includes(morto)).map(([c]) => c);
  checar('B', `P6 · nenhuma página tem "${morto}"`, onde.length === 0, onde.join(', '));
}

/* ------------------------------------------------------------- B. P7 */
titulo('B · Conformidade — P7: todo caminho da v1 redireciona');

const redirects = [
  ['/industria', '/noticias'], ['/observatorio', '/noticias'], ['/operacao', '/noticias'], ['/edificacoes', '/noticias'],
  ['/industria/algum-item-antigo', '/noticias'], ['/panorama', '/relatorios'], ['/panorama/x', '/relatorios'],
  ['/analise/x', '/relatorios'], ['/caso/x', '/relatorios'], ['/feed/industria.xml', '/feed.xml'],
];
for (const [de, para] of redirects) {
  const r = await pegar(de);
  const destino = (r.cab['location'] ?? '').replace(/^https?:\/\/[^/]+/, '');
  checar('B', `P7 · ${de} → 301 ${para}`, r.status === 301 && destino === para, `veio ${r.status} ${destino}`);
}

/* ------------------------------------------------------------- B. AGENDA */
titulo('B · Conformidade — a agenda');

const agenda = respostas['/agenda'];
const evPub = sql(`SELECT slug, nucleo, inicio, COALESCE(fim,inicio) termina FROM evento WHERE status='publicado' AND slug IS NOT NULL ORDER BY inicio`);
const hoje = new Date().toISOString().slice(0, 10);
const futuros = evPub.filter((e) => e.termina >= hoje);
const passados = evPub.filter((e) => e.termina < hoje);
const naListagem = (agenda.corpo.match(/class="evento"/g) ?? []).length;
medidas.agendaListados = naListagem;
checar('B', 'a agenda lista exatamente os eventos que ainda não terminaram', naListagem === futuros.length, `listados ${naListagem}, esperados ${futuros.length}`);

const naoPublicados = sql(`SELECT slug FROM evento WHERE status<>'publicado' AND slug IS NOT NULL`);
checar('B', 'envio não conferido não aparece na agenda', naoPublicados.every((e) => !agenda.corpo.includes(`/agenda/${e.slug}`)));
if (naoPublicados.length) checar('B', 'página de evento não conferido devolve 404', (await pegar(`/agenda/${naoPublicados[0].slug}`)).status === 404);
if (passados.length) {
  const r = await pegar(`/agenda/${passados[0].slug}`);
  checar('B', 'permalink de evento passado continua no ar e avisa', r.status === 200 && r.corpo.includes('já aconteceu'));
}
for (const qs of ['?o=br', '?f=online', '?t=industria']) {
  const r = await pegar('/agenda' + qs);
  checar('B', `filtro ${qs} responde 200 com canonical próprio`, r.status === 200 && r.corpo.includes(`/agenda${qs.replace(/&/g, '&amp;')}"`));
}
checar('B', 'filtro sem resultado explica e oferece saída', (await pegar('/agenda?t=processos&o=fora')).corpo.includes('Nenhum evento com esses filtros'));

function lerLd(html) {
  const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return 'invalido'; }
}
const ldAgenda = lerLd(agenda.corpo);
checar('C', 'a agenda traz JSON-LD ItemList válido', ldAgenda && ldAgenda !== 'invalido' && ldAgenda['@type'] === 'ItemList' && ldAgenda.numberOfItems === futuros.length);
if (futuros.length) {
  const ld = lerLd((await pegar(`/agenda/${futuros[0].slug}`)).corpo);
  checar('C', 'a página do evento traz JSON-LD Event com data', ld?.['@type'] === 'Event' && Boolean(ld?.startDate));
  checar('C', 'não declara oferta sem preço conhecido', ld?.offers === undefined || ld?.offers?.price === '0');
}

/* -------------------------------------------------- B. GLOSSÁRIO E BLUEPRINTS */
titulo('B · Conformidade — glossário e blueprints');

const gDb = sql(`SELECT SUM(CASE WHEN manter_original=0 THEN 1 ELSE 0 END) traduz, SUM(CASE WHEN manter_original=1 THEN 1 ELSE 0 END) mantem, SUM(CASE WHEN manter_original=1 AND (nota IS NULL OR nota='') THEN 1 ELSE 0 END) semGlosa FROM glossario WHERE travado=1`)[0];
const glossario = respostas['/glossario'].corpo;
checar('B', 'o glossário publica as duas colunas com a contagem do banco', glossario.includes(`Traduções travadas · ${gDb.traduz}`) && glossario.includes(`Não se traduzem · ${gDb.mantem}`));
checar('B', 'todo termo que não se traduz tem o significado aproximado', gDb.semGlosa === 0);

const blue = respostas['/blueprints'].corpo;
const fontesDb = sql(`SELECT COUNT(*) n FROM fonte`)[0].n;
const vereditos = (blue.corpo ?? blue).match(/data-robots="/g)?.length ?? 0;
checar('B', 'o inventário publica o veredito do robots de TODA fonte', vereditos === fontesDb, `publicou ${vereditos} para ${fontesDb} fontes`);
const recusadasDb = sql(`SELECT COUNT(*) n FROM fonte WHERE robots_permite = 0`)[0].n;
checar('B', 'as fontes recusadas continuam listadas, dizendo que foram recusadas', (blue.match(/data-robots="não permite"/g) ?? []).length === recusadasDb);
checar('B', 'o método declara que NÃO contornamos bloqueio', blue.includes('sem proxy') && blue.includes('navegador disfarçado'));
checar('B', 'o método declara que não há IA em produção', blue.includes('Não há inteligência artificial em produção'));
checar('B', 'o método publica as quatro categorias do veredito', ['v-chega', 'v-a_caminho', 'v-nao_chega', 'v-sem_efeito'].every((v) => blue.includes(v)));
checar('B', 'e diz que o dataset ainda não foi publicado', blue.includes('Ainda não publicado'));
checar('B', 'o inventário conta itens por fonte', /<th>Itens<\/th>/.test(blue));

/* --------------------------------------------------------- B. P12 · PAUTA */
titulo('B · Conformidade — P12: a pauta acumula e só a lavra esvazia');

const pendentesPath = join(RAIZ, 'colheita', 'pendentes.json');
const lidosPath = join(RAIZ, 'colheita', 'lidos.json');
const pendentes = existsSync(pendentesPath) ? JSON.parse(readFileSync(pendentesPath, 'utf8')) : {};
const lidos = existsSync(lidosPath) ? JSON.parse(readFileSync(lidosPath, 'utf8')) : {};
const emAmbos = Object.keys(pendentes).filter((u) => u in lidos);
medidas.pauta = Object.keys(pendentes).length;
medidas.lidos = Object.keys(lidos).length;
checar('B', 'P12 · nenhuma URL está pendente e lida ao mesmo tempo', emAmbos.length === 0, `${emAmbos.length} em ambos`);
checar('B', 'P12 · vistos.json (o ledger antigo, que apagava sem ler) não existe mais', !existsSync(join(RAIZ, 'colheita', 'vistos.json')));
const colher = readFileSync(join(RAIZ, 'scripts', 'colher.ts'), 'utf8');
checar('B', 'P12 · o colher nunca escreve em lidos.json', !/writeFileSync\(\s*LIDOS/.test(colher), 'só o lavrado pode marcar como lido');

/* ------------------------------------------------------------- B. LISTA */
titulo('B · Conformidade — a lista');
const antes = sql(`SELECT COUNT(*) n FROM assinante`)[0].n;
const postar = (caminho, corpo) => fetch(BASE + caminho, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: corpo, redirect: 'manual' });
const rInvalido = await postar('/assinar', 'email=nao-e-email');
checar('B', 'e-mail inválido não entra na lista', sql(`SELECT COUNT(*) n FROM assinante`)[0].n === antes && rInvalido.status === 303);
const rRobo = await postar('/assinar', 'email=robo.qa@exemplo.com&sitio=preenchido');
checar('B', 'honeypot não grava e responde igual', sql(`SELECT COUNT(*) n FROM assinante`)[0].n === antes && rRobo.status === 303);
const alvoQa = `qa.${Date.now()}@exemplo.com`;
const r1 = await postar('/assinar', `email=${encodeURIComponent(alvoQa.toUpperCase())}`);
checar('B', 'e-mail válido entra, normalizado', Boolean(sql(`SELECT email FROM assinante WHERE email='${alvoQa}'`)[0]));
const r2 = await postar('/assinar', `email=${encodeURIComponent(alvoQa)}`);
checar('B', 'reenviar o mesmo e-mail responde IGUAL', r1.status === r2.status && r1.headers.get('location') === r2.headers.get('location'));
sql(`DELETE FROM assinante WHERE email='${alvoQa}'`);

/* ------------------------------------------------------ B. TEXTO E TEMA */
titulo('B · Conformidade — o texto e o tema');
const SEM_ACENTO = ['automacao', 'portugues', 'traducao', 'ninguem', 'publicacoes', 'analise', 'revisao', 'informacao', 'proprio', 'credito', 'noticia', 'noticias', 'secao', 'conteudo', 'unico', 'relatorio', 'relatorios', 'maquina', 'fabrica'];
for (const caminho of ['/', '/noticias', '/blueprints', ...pecas.slice(0, 1).map((p) => `/${p.secao}/${p.slug}`)]) {
  const texto = respostas[caminho].corpo.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').toLowerCase();
  const achados = SEM_ACENTO.filter((w) => new RegExp(`(^|[^a-zà-ú])${w}([^a-zà-ú]|$)`).test(texto));
  checar('B', `${caminho} não tem português sem acento`, achados.length === 0, achados.join(', '));
}
const tokensCss = readFileSync(join(RAIZ, 'design', 'tokens.css'), 'utf8');
checar('B', 'o tema NÃO segue a preferência do sistema', !/@media[^{]*prefers-color-scheme/.test(tokensCss));
checar('B', 'o escuro só existe sob [data-theme="dark"]', tokensCss.includes(':root[data-theme="dark"]'));
checar('B', 'não há mais tokens de núcleo', !/--industria-ink|--observatorio-ink|--operacao-ink|--edificacoes-ink/.test(tokensCss));

/* -------------------------------------------------------- B. DISTRIBUIÇÃO */
titulo('B · Conformidade — feeds e sitemap');
for (const f of ['/feed.xml', '/feed/noticias.xml']) {
  const r = respostas[f];
  checar('C', `${f} é XML bem formado`, (r.cab['content-type'] ?? '').includes('rss+xml') && r.corpo.startsWith('<?xml') && !/&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(r.corpo.replace(/<\?xml[^>]*>/, '')));
}
checar('B', 'o feed traz as peças', pecas.every((p) => respostas['/feed.xml'].corpo.includes(`/${p.secao}/${p.slug}`)));
const mapa = respostas['/sitemap.xml'];
medidas.sitemapUrls = (mapa.corpo.match(/<loc>/g) ?? []).length;
checar('B', 'o sitemap lista todas as peças', pecas.every((p) => mapa.corpo.includes(`/${p.secao}/${p.slug}<`)));
checar('B', 'o sitemap não lista evento que já passou', !passados.some((e) => mapa.corpo.includes(`/agenda/${e.slug}<`)));
checar('B', 'robots.txt aponta o sitemap', respostas['/robots.txt'].corpo.includes('Sitemap:'));

/* --------------------------------------------------------- C. QUALIDADE */
titulo('C · Qualidade — semântica e acessibilidade');
const paginasC = [['/', capa], ['/noticias', respostas['/noticias'].corpo], ['/relatorios', respostas['/relatorios'].corpo], ...pecas.slice(0, 2).map((p) => [`/${p.secao}/${p.slug}`, respostas[`/${p.secao}/${p.slug}`].corpo])];
for (const [caminho, html] of paginasC) {
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  checar('C', `${caminho} tem exatamente um h1`, h1 === 1, `tem ${h1}`);
}
checar('C', 'lang declarado como pt-BR', /<html lang="pt-BR">/.test(capa));
checar('C', 'title, description, canonical e og presentes', /<title>[^<]{10,}<\/title>/.test(capa) && /<meta name="description"/.test(capa) && /<link rel="canonical"/.test(capa) && /og:title/.test(capa));
checar('C', 'peça tem og:type article', pecas.length === 0 || respostas[`/${pecas[0].secao}/${pecas[0].slug}`].corpo.includes('og:type" content="article"'));
checar('C', 'landmarks header/main/footer + skip link', /<header/.test(capa) && /<main/.test(capa) && /<footer/.test(capa) && /Pular para o conteúdo/.test(capa));
checar('C', 'a marca gráfica está no cabeçalho com aria-label', /marca-simbolo[^>]*aria-label="Instituto Automação"|aria-label="Instituto Automação"[^>]*marca-simbolo/.test(capa));
checar('C', 'nenhuma imagem sem alt', !/<img(?![^>]*\balt=)/.test(capa));
checar('C', 'no máximo 1 script na página (só o tema)', (capa.match(/<script/g) ?? []).length <= 1);
checar('C', 'nenhum recurso JS externo', !/<script[^>]+src=/.test(capa));
checar('C', 'toda arte SVG declara role=img e aria-label', !/<svg(?![^>]*aria-label)[^>]*class="capa-gerada|<svg(?![^>]*aria-label)[^>]*preserveAspectRatio="xMidYMid slice"/.test(capa));

titulo('C · Qualidade — P8: contraste WCAG, calculado dos tokens');
const claro = tokensDo(tokensCss, ':root {');
const escuro = tokensDo(tokensCss, ':root[data-theme="dark"]');
for (const [tema, t] of [['claro', claro], ['escuro', escuro]]) {
  const fundo = t['--paper'];
  for (const [token, minimo] of [['--ink', 4.5], ['--ink-muted', 4.5], ['--ink-faint', 3.0], ['--marca', 4.5], ['--acento-ink', 4.5], ['--v-chega-ink', 4.5], ['--v-caminho-ink', 4.5], ['--v-nao-chega-ink', 4.5], ['--v-sem-efeito-ink', 4.5]]) {
    if (!t[token] || !fundo) { avisar(`${tema}: ${token} não encontrado`); continue; }
    const r = contraste(t[token], fundo);
    medidas[`contraste_${tema}_${token}`] = r.toFixed(2);
    checar('C', `P8 · ${tema}: ${token} ≥ ${minimo}:1 sobre o papel`, r >= minimo, `medido ${r.toFixed(2)}:1`);
  }
  /* a faixa do relógio e as artes: texto sobre o azul profundo */
  for (const [token, minimo] of [['--capa-texto', 4.5], ['--capa-texto-suave', 4.5], ['--capa-texto-fraco', 3.0]]) {
    if (!t[token] || !t['--capa-fundo']) { avisar(`${tema}: ${token} não encontrado`); continue; }
    const r = contraste(t[token], t['--capa-fundo']);
    checar('C', `P8 · ${tema}: ${token} ≥ ${minimo}:1 sobre a faixa escura`, r >= minimo, `medido ${r.toFixed(2)}:1`);
  }
  if (t['--acao'] && t['--acao-texto']) checar('C', `P8 · ${tema}: texto sobre o botão de ação ≥ 4.5:1`, contraste(t['--acao-texto'], t['--acao']) >= 4.5, contraste(t['--acao-texto'], t['--acao']).toFixed(2));
}

titulo('C · Qualidade — P9: integridade do sistema de design');
const cssTodo = css.corpo;
const definidos = new Set([...cssTodo.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const usados = new Set([...cssTodo.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
const orfaos = [...usados].filter((t) => !definidos.has(t));
checar('C', 'nenhum var(--token) sem definição', orfaos.length === 0, orfaos.join(', '));
const cruaForaDeToken = [...cssTodo.matchAll(/(?:^|;|\{)\s*([a-z-]+)\s*:\s*#[0-9a-f]{3,8}/gim)].map((m) => m[1]).filter((p) => !p.startsWith('--'));
checar('C', 'P9 · nenhuma cor crua fora da definição de token', cruaForaDeToken.length === 0, cruaForaDeToken.join(', '));
const artesCruas = [];
for (const nome of existsSync(join(RAIZ, 'conteudo', 'arte')) ? readdirSync(join(RAIZ, 'conteudo', 'arte')) : []) {
  const svg = readFileSync(join(RAIZ, 'conteudo', 'arte', nome), 'utf8');
  if (/(fill|stroke)\s*=\s*"#/.test(svg)) artesCruas.push(nome);
}
checar('C', 'P9 · nenhuma arte com cor crua (todas vestem os tokens)', artesCruas.length === 0, artesCruas.join(', '));

titulo('C · Qualidade — P10: peso e tempo');
checar('C', 'P10 · HTML da capa abaixo de 60 KB', medidas.htmlCapa < 60000, `${(medidas.htmlCapa / 1024).toFixed(1)} KB`);
checar('C', 'P10 · CSS abaixo de 40 KB', medidas.css < 40000, `${(medidas.css / 1024).toFixed(1)} KB`);
checar('C', 'P10 · capa responde em menos de 300 ms local', medidas.msCapa < 300, `${medidas.msCapa} ms`);
if (/fonts\.googleapis\.com/.test(capa)) avisar('fontes vindas do Google', 'pendência conhecida: self-hosting antes do deploy');

titulo('C · Qualidade — as suítes de unidade');
try {
  const saida = execFileSync('npm', ['test'], { cwd: RAIZ, encoding: 'utf8', shell: true });
  const placares = [...saida.matchAll(/(\d+) ok · (\d+) falha/g)];
  const passaram = placares.reduce((t, m) => t + Number(m[1]), 0);
  const quebraram = placares.reduce((t, m) => t + Number(m[2]), 0);
  checar('C', `suítes de unidade: ${passaram} conferências em ${placares.length} suíte(s)`, placares.length >= 3 && quebraram === 0, saida.slice(-400));
  medidas.testesUnidade = passaram;
} catch (e) {
  checar('C', 'suítes de unidade', false, String(e.stdout ?? e).slice(-500));
}

/* P13 só vale depois do deploy: aqui é aviso, não falha. */
if (saude.coleta?.horas != null && saude.coleta.horas > 24) avisar('P13 · última coleta há mais de 24 h', `${saude.coleta.horas} h — sem cron local isso é esperado; em produção seria falha`);

/* ========================================================================= */
console.log(`\n${'─'.repeat(60)}`);
console.log(`${cor.v}${ok} ok${cor.z} · ${falhas.length ? cor.r : ''}${falhas.length} falha(s)${cor.z} · ${avisos.length} aviso(s)`);
console.log('\nMedidas:');
for (const [k, v] of Object.entries(medidas)) console.log(`  ${k.padEnd(34)} ${v}`);
if (falhas.length) {
  console.log(`\n${cor.r}FALHAS${cor.z}`);
  for (const f of falhas) console.log(`  [${f.eixo}] ${f.nome}${f.detalhe ? ` — ${f.detalhe}` : ''}`);
}
process.exit(falhas.length ? 1 : 0);
