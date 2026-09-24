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
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ALVO = process.argv[2] ?? '8787';
// `npm run qa -- https://…` aponta o QA para um site publicado; um número continua sendo a porta local
const BASE = /^https?:\/\//.test(ALVO) ? ALVO.replace(/\/$/, '') : `http://127.0.0.1:${ALVO}`;

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
  for (const secao of ['noticias', 'artigos', 'relatorios', 'giro']) {
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
  ['/', 200], ['/noticias', 200], ['/artigos', 200], ['/relatorios', 200], ['/giro', 200],
  ['/agenda', 200], ['/glossario', 200], ['/blueprints', 200], ['/marca', 200], ['/saude', 200], ['/manifest.webmanifest', 200],
  ['/autores', 200], ['/autores/pedro-oliveira', 200], ['/autores/nao-existe', 404], ['/apoie', 200], ['/privacidade', 200],
  ['/favicon.svg', 200], ['/feed.xml', 200], ['/feed/noticias.xml', 200], ['/feed/artigos.xml', 200], ['/sitemap.xml', 200], ['/robots.txt', 200],
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
/* `assunto_token` entrou em 23/09/2026 (migração 007): é o índice invertido
   que faz o agrupamento por termo raro achar o assunto de um título novo. É
   índice DERIVADO — `npm run reagrupar` o reconstrói inteiro a partir de
   `item`, e nada se perde se ele for apagado. */
const esperadas = ['assinante', 'assunto', 'assunto_token', 'contato', 'correcao', 'evento', 'fonte', 'glossario', 'item'];
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
  /* Boletim gerado (o Giro) não tem autor por desenho — ver `gerado` em
     src/conteudo/tipos.ts. Em troca é obrigado a declarar `numeros:`, que é o
     que a auditoria confere contra a prosa. */
  const geradoAqui = m.gerado === 'true';
  const ok2 = m.titulo && m.lead && (geradoAqui ? m.numeros : m.autor) && m.data && m.secao === p.secao && /^\d{4}-\d{2}-\d{2}$/.test(m.data);
  checar('B', `P2 · ${p.arquivo}: ${geradoAqui ? 'números' : 'autor'}, data, seção, título e lead`, Boolean(ok2), JSON.stringify(Object.keys(m)));
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
  checar('B', `/${p.secao}/${p.slug} mostra ${p.meta.gerado === 'true' ? 'a origem' : 'o autor'}`,
    p.meta.gerado === 'true' ? html.includes('Gerado dos dados do Instituto') : html.includes(p.meta.autor));
  checar('B', `/${p.secao}/${p.slug} tem arte (foto licenciada, desenhada ou gerada)`, /data-arte="(foto|desenhada|gerada)"/.test(html));
  checar('B', `/${p.secao}/${p.slug} declara como foi feito`, html.includes('Como este texto foi feito'));
  /* Peça de gente nega a máquina; boletim gerado nega o MODELO DE LINGUAGEM,
     que é a afirmação que cabe a ele. Nenhum dos dois pode ficar calado. */
  checar('B', `/${p.secao}/${p.slug} declara o que é, sobre máquina`,
    p.meta.gerado === 'true' ? html.includes('Sem modelo de linguagem') : html.includes('por máquina'));
  if (p.secao === 'noticias') {
    const ancorasFonte = [...html.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]).filter((t) => t.includes(p.meta.fonte.url));
    checar('B', `/${p.secao}/${p.slug} credita a fonte com link`, ancorasFonte.length >= 1);
    checar('B', `/${p.secao}/${p.slug} link da fonte tem noopener`, ancorasFonte.every((t) => /rel\s*=\s*"[^"]*noopener/.test(t)));
    checar('B', `/${p.secao}/${p.slug} mostra o veredito com critério`, html.includes(`veredito v-${p.meta.veredito}`) && html.includes('O que isso muda aqui'));
  }
  /* imagem real, quando existe, vence a arte desenhada — e é o que deve estar no HTML */
  if (p.meta.imagem) checar('B', `/${p.secao}/${p.slug} mostra a imagem real (vence a arte)`, html.includes('data-arte="foto"'));
  else if (p.meta.arte) checar('B', `/${p.secao}/${p.slug} usa a arte desenhada`, html.includes('data-arte="desenhada"'));
}

/* ------------------------------------------------------------ B. P5 · P6 */
titulo('B · Conformidade — P5: a capa nunca lê como vazia · P6: sem infraestrutura de volume');

const capa = respostas['/'].corpo;
const temDestaque = /class="destaque"/.test(capa);
const temVazio = /class="vazio"/.test(capa);
checar('B', 'P5 · a capa abre com uma peça OU diz o que está vindo', pecas.length > 0 ? temDestaque : temVazio, `destaque=${temDestaque} vazio=${temVazio}`);
checar('B', 'P5 · a capa não vaza "undefined" nem "null"', !/>\s*(undefined|null)\s*</.test(capa));
/* Decisão de 11/09/2026: o relógio saiu da capa enquanto medir zero. A asserção
   inverteu de propósito — antes cobrava a faixa, agora cobra a ausência dela. Se
   um dia a medição existir e a faixa voltar, esta linha volta com ela. */
checar('B', 'P5 · a faixa do relógio NÃO está na capa (sai enquanto mede zero)', !/faixa-relogio/.test(capa));
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
const recusadasPagina = (blue.match(/data-robots="não permite"/g) ?? []).length;
/* Compara a página com o D1 LOCAL. Contra um site publicado o banco é outro (o cron de lá já
   marcou o robots de fontes que aqui ainda são nulas) — aí é aviso, não falha. */
if (/127\.0\.0\.1|localhost/.test(BASE)) checar('B', 'as fontes recusadas continuam listadas, dizendo que foram recusadas', recusadasPagina === recusadasDb, `${recusadasPagina} na página, ${recusadasDb} no banco local`);
else avisar('fontes recusadas: comparação só vale contra o dev local', `a página publicada lista ${recusadasPagina}; o D1 local tem ${recusadasDb} — bancos diferentes`);
checar('B', 'o método declara que NÃO contornamos bloqueio', blue.includes('sem proxy') && blue.includes('navegador disfarçado'));
checar('B', 'o método declara que não há IA em produção', blue.includes('Não há inteligência artificial em produção'));
checar('B', 'o método publica as quatro categorias do veredito', ['v-chega', 'v-a_caminho', 'v-nao_chega', 'v-sem_efeito'].every((v) => blue.includes(v)));
checar('B', 'linka o dataset publicado e diz quando a base completa sai', /href="\/dados\/[^"]+\.csv"/.test(blue) && blue.includes('A base completa sai em dezembro'));
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
/* Este bloco ESCREVE no banco (assinante de QA). Só roda contra o dev local,
   onde o QA também consegue ler o D1 para conferir e apagar o rastro; contra um
   site publicado ele deixaria um "qa@exemplo.com" no banco de verdade. */
const LOCAL = /127\.0\.0\.1|localhost/.test(BASE);
if (LOCAL) {
  const rInvalido = await postar('/assinar', 'email=nao-e-email');
  checar('B', 'e-mail inválido não entra na lista', sql(`SELECT COUNT(*) n FROM assinante`)[0].n === antes && rInvalido.status === 303);
  const rRobo = await postar('/assinar', 'email=robo.qa@exemplo.com&sitio=preenchido');
  checar('B', 'honeypot não grava e responde igual', sql(`SELECT COUNT(*) n FROM assinante`)[0].n === antes && rRobo.status === 303);
  const alvoQa = `qa.${Date.now()}@exemplo.com`;
  const r1 = await postar('/assinar', `email=${encodeURIComponent(alvoQa.toUpperCase())}`);
  checar('B', 'e-mail válido entra, normalizado', Boolean(sql(`SELECT email FROM assinante WHERE email='${alvoQa}'`)[0]));
  const r2 = await postar('/assinar', `email=${encodeURIComponent(alvoQa)}`);
  checar('B', 'reenviar o mesmo e-mail responde IGUAL', r1.status === r2.status && r1.headers.get('location') === r2.headers.get('location'));
  checar('B', 'a resposta volta para o bloco da lista (#assinar), não para o topo', /#assinar$/.test(r1.headers.get('location') ?? ''), r1.headers.get('location'));
  sql(`DELETE FROM assinante WHERE email='${alvoQa}'`);
  /* 07/09: o que a pessoa faz. Fechado (config.ts → ATUACOES): valor fora da lista vira nulo, não vira texto livre. */
  const alvoAtua = `qa.atua.${Date.now()}@exemplo.com`;
  await postar('/assinar', `email=${encodeURIComponent(alvoAtua)}&atuacao=opera&empresa=${encodeURIComponent('QA Ltda')}`);
  const linhaAtua = sql(`SELECT atuacao, empresa FROM assinante WHERE email='${alvoAtua}'`)[0];
  checar('B', 'a lista guarda atuação e empresa quando a pessoa diz', linhaAtua?.atuacao === 'opera' && linhaAtua?.empresa === 'QA Ltda', JSON.stringify(linhaAtua));
  const alvoFora = `qa.fora.${Date.now()}@exemplo.com`;
  await postar('/assinar', `email=${encodeURIComponent(alvoFora)}&atuacao=hacker`);
  checar('B', 'atuação fora da lista fechada vira nulo', sql(`SELECT atuacao FROM assinante WHERE email='${alvoFora}'`)[0]?.atuacao === null);
  sql(`DELETE FROM assinante WHERE email LIKE '%@exemplo.com'`);
} else {
  avisar('assinatura não testada', 'o alvo é remoto — teste de escrita só roda no dev local, para não deixar assinante de QA no banco publicado');
}

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
checar('C', 'no máximo 1 script executável na página (só o tema; JSON-LD não executa)', (capa.match(/<script(?![^>]*application\/ld\+json)/g) ?? []).length <= 1, `${(capa.match(/<script(?![^>]*application\/ld\+json)/g) ?? []).length} script(s) executáveis`);
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
// 48 KB sem comprimir (na borda vai em brotli, ~9 KB). Subiu de 40 em 07/09/2026 com autores, parceiro, ficha e a lista nova.
checar('C', 'P10 · CSS abaixo de 48 KB', medidas.css < 48000, `${(medidas.css / 1024).toFixed(1)} KB`);
checar('C', 'P10 · capa responde em menos de 300 ms local', medidas.msCapa < 300, `${medidas.msCapa} ms`);
if (/fonts\.googleapis\.com/.test(capa)) avisar('fontes vindas do Google', 'pendência conhecida: self-hosting antes do deploy');

titulo('C · Qualidade — imagem real: a licença governa, o crédito aparece');
/* A regra do texto vale para a imagem: só entra o que tem licença declarada,
   e quem deu a licença aparece na tela. O compilador exige; aqui se mede o
   que chegou ao HTML. */
const LICENCAS = ['press', 'cc-by', 'cedida', 'propria'];
const comImagem = pecas.filter((p) => p.meta.imagem && typeof p.meta.imagem === 'object');
medidas.imagensReais = comImagem.length;
for (const p of comImagem) {
  const im = p.meta.imagem;
  const arquivo = join(RAIZ, 'publico', 'imagens', im.arquivo ?? '');
  const existe = existsSync(arquivo);
  checar('C', `imagem existe e pesa até 600 KB · ${p.slug}`, existe && statSync(arquivo).size <= 600_000, existe ? `${(statSync(arquivo).size / 1024).toFixed(0)} KB` : 'arquivo ausente');
  checar('B', `imagem com crédito, licença conhecida e alt · ${p.slug}`, Boolean(im.credito) && LICENCAS.includes(im.licenca) && Boolean(im.alt), JSON.stringify(im));
  const r = await pegar(`/imagens/${im.arquivo}`);
  checar('A', `imagem servida como asset estático · ${im.arquivo}`, r.status === 200 && /^image\//.test(r.cab['content-type'] ?? ''), `${r.status} ${r.cab['content-type'] ?? ''}`);
  const pagina = await pegar(`/${p.secao}/${p.slug}`);
  checar('C', `crédito visível e licença no HTML da peça · ${p.slug}`, pagina.corpo.includes(`Imagem: ${im.credito}`) && pagina.corpo.includes(`data-licenca="${im.licenca}"`));
  const src = `/imagens/${im.arquivo}`.replace(/[.]/g, '\\.');
  checar('C', `<img> da peça tem alt · ${p.slug}`, new RegExp(`<img[^>]+src="${src}"[^>]*\\balt="[^"]+"`).test(pagina.corpo));
}
checar('C', 'nenhum hotlink: toda <img> das páginas é servida deste domínio', todasAsPaginas.every(([, r]) => !/<img[^>]+src="https?:\/\//i.test(r.corpo)));
checar('C', 'toda <img> de toda página tem alt', todasAsPaginas.every(([, r]) => !/<img(?![^>]*\balt=)/.test(r.corpo)));

titulo('B · Conformidade — a marca prototipal está inteira e servida');
const pastaMarca = join(RAIZ, 'publico', 'marca');
const arquivosMarca = existsSync(pastaMarca) ? readdirSync(pastaMarca).filter((n) => n.endsWith('.svg')) : [];
medidas.arquivosMarca = arquivosMarca.length;
checar('B', 'a prancha lista os 11 arquivos da marca', arquivosMarca.length === 11 && arquivosMarca.every((n) => respostas['/marca'].corpo.includes(`/marca/${n}`)), arquivosMarca.join(', '));
for (const nome of arquivosMarca) {
  const r = await pegar(`/marca/${nome}`);
  checar('A', `arquivo da marca servido · ${nome}`, r.status === 200 && /svg/.test(r.cab['content-type'] ?? '') && /^<svg/.test(r.corpo.trim()), `${r.status} ${r.cab['content-type'] ?? ''}`);
  checar('C', `arquivo da marca sem <script> e com <title> · ${nome}`, !/<script/i.test(r.corpo) && /<title>/.test(r.corpo));
}
checar('B', 'a prancha diz que a marca é prototipal', /prototipal/i.test(respostas['/marca'].corpo));

titulo('B · Conformidade — o tour narrado está no ar, com legendas');
{
  const blue = respostas['/blueprints'].corpo;
  checar('B', 'blueprints embute o tour com legendas (video + track pt-BR + poster)', /<video[^>]+poster="\/og\/padrao\.png"/.test(blue) && /<track[^>]+kind="captions"[^>]+srclang="pt-BR"/.test(blue));
  for (const [caminho, tipo] of [['/tour/instituto-automacao-tour.mp4', 'video/mp4'], ['/tour/instituto-automacao-tour.vtt', 'text/vtt'], ['/tour/instituto-automacao-tour-capitulos.txt', 'text/plain']]) {
    const r = await fetch(BASE + caminho, { method: 'GET', headers: { Range: 'bytes=0-15' } });
    checar('A', `tour servido · ${caminho}`, (r.status === 200 || r.status === 206) && (r.headers.get('content-type') ?? '').includes(tipo), `${r.status} ${r.headers.get('content-type') ?? ''}`);
  }
  const vtt = await pegar('/tour/instituto-automacao-tour.vtt');
  const deixas = (vtt.corpo.match(/-->/g) ?? []).length;
  checar('B', 'legendas com uma deixa por cena (≥ 12)', vtt.corpo.startsWith('WEBVTT') && deixas >= 12, `${deixas} deixas`);
  medidas.deixasDoTour = deixas;
}

titulo('C · Qualidade — dataset público');
const pastaDados = join(RAIZ, 'publico', 'dados');
const datasets = existsSync(pastaDados) ? readdirSync(pastaDados).filter((n) => n.endsWith('.csv')) : [];
medidas.datasets = datasets.length;
for (const nome of datasets) {
  const r = await pegar(`/dados/${nome}`);
  const linhas = r.corpo.trim().split(/\r?\n/);
  checar('A', `dataset servido com cabeçalho e linhas · ${nome}`, r.status === 200 && linhas.length > 1 && /^pais,fonte,publicado,titulo,url$/.test(linhas[0]), `${r.status} · ${linhas.length} linha(s)`);
}
const relatorios = pecas.filter((p) => p.secao === 'relatorios');
checar('B', 'todo relatório que cita dataset aponta para um arquivo que existe', relatorios.every((p) => [...p.corpo.matchAll(/\]\(\/dados\/([^)]+)\)/g)].every((m) => datasets.includes(m[1]))));

titulo('B · Conformidade — SEO e cabeçalhos: o que a máquina lê');
/* Tudo que o buscador, a rede social e o navegador leem sem mostrar: título,
   descrição, imagem de compartilhamento, dados estruturados, cabeçalhos de
   segurança, fontes servidas daqui. Cada afirmação do relatório de revisão
   virou uma asserção. */
const { createHash } = await import('node:crypto');
const htmlOk = todasAsPaginas.filter(([, r]) => r.status === 200);
for (const [rota, r] of todasAsPaginas) {
  const cab = r.cab;
  checar('B', `cabeçalhos de segurança · ${rota}`,
    cab['x-content-type-options'] === 'nosniff' && /strict-origin/.test(cab['referrer-policy'] ?? '') && !!cab['permissions-policy'] && /frame-ancestors 'none'/.test(cab['content-security-policy'] ?? '') && cab['x-frame-options'] === 'DENY',
    JSON.stringify({ xcto: cab['x-content-type-options'], rp: cab['referrer-policy'], csp: (cab['content-security-policy'] ?? '').slice(0, 50) }));
}
{
  const html = respostas['/'].corpo;
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const hashes = inline.map((t) => createHash('sha256').update(t).digest('base64'));
  const csp = respostas['/'].cab['content-security-policy'] ?? '';
  checar('B', 'CSP: um script inline só, e o hash dele está na política', inline.length === 1 && hashes.every((h) => csp.includes(`'sha256-${h}'`)), `${inline.length} script(s) inline · ${hashes.join(',')}`);
  checar('B', 'CSP: nenhum host de terceiro permitido', !/https?:\/\//.test(csp), csp);
  checar('B', "CSP: script-src sem 'unsafe-inline'", !/script-src[^;]*unsafe-inline/.test(csp));
}
const meta = (h, n) => (h.match(new RegExp(`<meta[^>]+(?:name|property)="${n}"[^>]+content="([^"]*)"`)) ?? h.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${n}"`)))?.[1];
for (const [rota, r] of todasAsPaginas) {
  const h = r.corpo;
  const title = h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  checar('B', `título da aba entre 10 e 75 caracteres · ${rota}`, title.length >= 10 && title.length <= 75, `${title.length}: ${title}`);
  checar('B', `theme-color e twitter:card · ${rota}`, /name="theme-color"/.test(h) && meta(h, 'twitter:card') === 'summary_large_image');
  checar('C', `nenhum recurso de terceiro no HTML · ${rota}`, !/googleapis|gstatic|cdn\.|unpkg|jsdelivr/.test(h));
  checar('C', `fontes em preload · ${rota}`, /rel="preload"[^>]+newsreader-latin\.woff2/.test(h) && /rel="preload"[^>]+plex-sans-latin\.woff2/.test(h));
}
for (const [rota, r] of htmlOk) {
  const h = r.corpo;
  const desc = meta(h, 'description') ?? '';
  const og = meta(h, 'og:image') ?? '';
  checar('B', `descrição entre 50 e 160 caracteres · ${rota}`, desc.length >= 50 && desc.length <= 160, `${desc.length}: ${desc.slice(0, 60)}…`);
  checar('B', `og:image absoluta, com largura e altura · ${rota}`, /^https?:\/\//.test(og) && !!meta(h, 'og:image:width') && !!meta(h, 'og:image:height'), og);
  checar('B', `canônica e og:url presentes · ${rota}`, /rel="canonical"/.test(h) && !!meta(h, 'og:url'));
}
{
  const ogs = new Set(htmlOk.map(([, r]) => meta(r.corpo, 'og:image')).filter(Boolean).map((u) => u.replace(/^https?:\/\/[^/]+/, '')));
  medidas.imagensOg = ogs.size;
  for (const caminho of ogs) {
    const r = await pegar(caminho);
    checar('A', `og:image servida como imagem · ${caminho}`, r.status === 200 && /^image\//.test(r.cab['content-type'] ?? ''), `${r.status} ${r.cab['content-type'] ?? ''}`);
  }
}
const tiposLd = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { try { return [JSON.parse(m[1])['@type']].flat(); } catch { return ['INVÁLIDO']; } });
checar('B', 'JSON-LD válido em toda página', htmlOk.every(([, r]) => !tiposLd(r.corpo).includes('INVÁLIDO')));
checar('B', 'capa declara Organization e WebSite', ['Organization', 'WebSite'].every((t) => tiposLd(respostas['/'].corpo).includes(t)), tiposLd(respostas['/'].corpo).join(','));
checar('B', '/noticias declara CollectionPage e BreadcrumbList', ['CollectionPage', 'BreadcrumbList'].every((t) => tiposLd(respostas['/noticias'].corpo).includes(t)), tiposLd(respostas['/noticias'].corpo).join(','));
checar('B', '/blueprints declara Dataset', tiposLd(respostas['/blueprints'].corpo).includes('Dataset'));
checar('B', '/glossario declara DefinedTermSet', tiposLd(respostas['/glossario'].corpo).includes('DefinedTermSet'));
checar('B', '/agenda declara ItemList e BreadcrumbList', ['ItemList', 'BreadcrumbList'].every((t) => tiposLd(respostas['/agenda'].corpo).includes(t)));
for (const p of pecas) {
  const t = tiposLd(respostas[`/${p.secao}/${p.slug}`].corpo);
  const esperado = p.secao === 'noticias' ? 'NewsArticle' : 'Article';
  checar('B', `peça declara ${esperado} e BreadcrumbList · ${p.slug}`, t.includes(esperado) && t.includes('BreadcrumbList'), t.join(','));
}
for (const [rota, r] of todasAsPaginas) {
  const niveis = [...r.corpo.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  let salto = false;
  for (let i = 1; i < niveis.length; i++) if (niveis[i] > niveis[i - 1] + 1) salto = true;
  checar('C', `títulos sem salto de nível · ${rota}`, !salto && niveis[0] === 1, niveis.join('>'));
}
for (const [caminho, tipo] of [['/fontes/newsreader-latin.woff2', 'font/woff2'], ['/fontes/plex-sans-latin.woff2', 'font/woff2'], ['/manifest.webmanifest', 'manifest'], ['/icones/icone-180.png', 'image/png'], ['/icones/icone-512.png', 'image/png'], ['/og/padrao.png', 'image/png']]) {
  const r = await pegar(caminho);
  checar('A', `servido · ${caminho}`, r.status === 200 && (r.cab['content-type'] ?? '').includes(tipo), `${r.status} ${r.cab['content-type'] ?? ''}`);
}
{
  const r = await pegar('/noticias/');
  checar('A', 'barra final não vira 404 (/noticias/)', r.status === 200, String(r.status));
  const c404 = respostas['/qualquer-coisa'];
  checar('B', 'a 404 pede noindex e devolve à capa', /name="robots" content="noindex/.test(c404.corpo) && /href="\/"/.test(c404.corpo));
  const fonte = await pegar('/fontes/plex-mono-latin-400.woff2');
  if (!/immutable/.test(fonte.cab['cache-control'] ?? '')) avisar('_headers dos assets não visto em dev', `cache-control: ${fonte.cab['cache-control'] ?? '(vazio)'} — em produção a borda aplica publico/_headers`);
  else checar('A', 'fontes com cache imutável (publico/_headers)', true);
}

/* ------------------------------------------- B. FEEDBACK DE 07/09/2026 (SÓCIO) */
titulo('B · Conformidade — autores, artigos, parceiro, ficha, tema na navegação');
{
  const capaHtml = respostas['/'].corpo;
  const pecaHtml = respostas[`/${noticias[0].secao}/${noticias[0].slug}`].corpo;
  const autoresHtml = respostas['/autores'].corpo;
  const autorHtml = respostas['/autores/pedro-oliveira'].corpo;
  const apoieHtml = respostas['/apoie'].corpo;
  const artigosHtml = respostas['/artigos'].corpo;

  /* autores: todo autor de peça tem arquivo, e o arquivo tem nome e papel */
  const arquivosAutor = readdirSync(join(RAIZ, 'conteudo', 'autores')).filter((n) => n.endsWith('.md'));
  const nomesAutor = arquivosAutor.map((n) => /^nome:\s*(.+)$/m.exec(readFileSync(join(RAIZ, 'conteudo', 'autores', n), 'utf8'))?.[1]?.trim());
  checar('B', 'há pelo menos um autor em conteudo/autores/', arquivosAutor.length >= 1, arquivosAutor.join(', '));
  const semArquivo = [...new Set(pecas.filter((p) => p.meta.gerado !== 'true').map((p) => p.meta.autor))].filter((a) => !nomesAutor.includes(a));
  checar('B', 'toda peça aponta para um autor que existe em conteudo/autores/', semArquivo.length === 0, semArquivo.join(', '));
  for (const n of arquivosAutor) {
    const t = readFileSync(join(RAIZ, 'conteudo', 'autores', n), 'utf8');
    checar('B', `autores/${n}: nome, papel e bio`, /^nome:\s*\S/m.test(t) && /^papel:\s*\S/m.test(t) && (t.split(/\r?\n---\r?\n/)[1] ?? '').trim().length >= 40);
  }

  /* a página do autor: é o currículo dele aqui */
  const pecasDoPedro = pecas.filter((p) => p.meta.autor === 'Pedro Oliveira').length;
  checar('B', '/autores/pedro-oliveira lista TODAS as peças dele', (autorHtml.match(/class="linha"/g) ?? []).length === pecasDoPedro, `${(autorHtml.match(/class="linha"/g) ?? []).length} na página, ${pecasDoPedro} nos arquivos`);
  checar('B', '/autores/pedro-oliveira tem h1 com o nome e o papel como kicker', /<h1[^>]*>Pedro Oliveira<\/h1>/.test(autorHtml) && /class="kicker">Editor</.test(autorHtml));
  checar('B', '/autores/pedro-oliveira declara ProfilePage com Person', tiposLd(autorHtml).includes('ProfilePage') && /"@type":"Person"/.test(autorHtml));
  checar('B', '/autores/pedro-oliveira é og:type profile', /property="og:type" content="profile"/.test(autorHtml));
  checar('B', '/autores lista os autores e convida a escrever (#escrever com formulário)', /class="autor-card"/.test(autoresHtml) && /id="escrever"/.test(autoresHtml) && /action="\/autores\/escrever"/.test(autoresHtml));
  checar('B', 'a assinatura da peça leva à página do autor (rel=author)', /<a href="\/autores\/pedro-oliveira" rel="author" class="assinatura__autor">/.test(pecaHtml));
  checar('B', 'o JSON-LD da peça aponta o autor para a página dele', /"author":\{"@type":"Person","@id":"[^"]+\/autores\/pedro-oliveira#pessoa"/.test(pecaHtml));

  /* a ficha: a lateral saiu, e o que ela dizia está embaixo do texto */
  checar('B', 'a peça NÃO tem mais coluna lateral', !/peca__lateral/.test(pecaHtml));
  checar('B', 'a peça tem a ficha com veredito, fonte e quem escreveu', /class="peca__ficha"/.test(pecaHtml) && /class="veredito-caixa"/.test(pecaHtml) && /class="fonte-caixa"/.test(pecaHtml) && /class="autor-caixa"/.test(pecaHtml));
  checar('B', 'a ficha vem DEPOIS do corpo da peça', pecaHtml.indexOf('class="peca__ficha"') > pecaHtml.indexOf('class="obra"'));

  /* artigos: a seção existe, honesta quando vazia */
  const artigos = pecas.filter((p) => p.secao === 'artigos');
  checar('B', '/artigos existe e está na navegação', /<a href="\/artigos"[^>]*>Artigos<\/a>/.test(capaHtml) && respostas['/artigos'].status === 200);
  if (artigos.length === 0) {
    checar('B', '/artigos vazio diz que o primeiro está sendo escrito e convida a escrever', /O primeiro artigo está sendo escrito/.test(artigosHtml) && /href="\/autores#escrever"/.test(artigosHtml));
    checar('B', 'a capa tem o bloco Artigos com o convite mesmo sem artigo', /<h2 class="secao__titulo">Artigos<\/h2>/.test(capaHtml) && /href="\/autores#escrever"/.test(capaHtml));
  }
  checar('B', 'formato de artigo é guia ou conceito', artigos.every((p) => ['guia', 'conceito'].includes(p.meta.formato)));
  checar('B', 'artigo não leva veredito', artigos.every((p) => !p.meta.veredito));

  /* o parceiro: o espaço existe, com ou sem parceiro, e a página /apoie explica */
  checar('B', 'a capa tem o espaço do parceiro antes do destaque', /class="parceiro"/.test(capaHtml) && capaHtml.indexOf('class="parceiro"') < capaHtml.indexOf('class="destaque"'));
  checar('B', 'o espaço do parceiro está rotulado e leva a /apoie', /Parceiro do Instituto/.test(capaHtml) && /class="parceiro__acao" href="\/apoie"/.test(capaHtml));
  checar('B', '/apoie diz o que o parceiro NÃO compra (pauta, notícia, veredito)', /Não escreve notícia/.test(apoieHtml) && /Não escolhe pauta nem veredito/.test(apoieHtml));
  checar('B', '/apoie tem formulário para /apoie/enviar', /action="\/apoie\/enviar"/.test(apoieHtml));
  checar('B', 'link de parceiro, quando houver, é rel=sponsored', !/class="parceiro__corpo" href=/.test(capaHtml) || /class="parceiro__corpo" href="[^"]+" rel="sponsored/.test(capaHtml));

  /* a capa: a lista subiu, as notas explicam, o tema mora na nav, a linha de data */
  checar('B', 'a lista (#assinar) está na capa, depois das notícias e do artigo', capaHtml.indexOf('id="assinar"') > 0 && capaHtml.indexOf('id="assinar"') > capaHtml.indexOf('class="destaque"'));
  checar('B', 'a lista pergunta o que a pessoa faz (fechado) e a empresa (opcional)', /name="atuacao"/.test(capaHtml) && /name="empresa"/.test(capaHtml) && (capaHtml.match(/<option value="(opera|integra|ensina|estuda|outra)"/g) ?? []).length === 5);
  checar('B', 'Relatórios e Agenda têm nota dizendo o que são', (capaHtml.match(/class="secao__nota"/g) ?? []).length >= 3 && /conferida no site oficial/.test(capaHtml) && /dado próprio/.test(capaHtml));
  checar('B', 'o botão de tema está na navegação, não no rodapé', /<nav class="navbar"[\s\S]*id="tema"[\s\S]*<\/nav>/.test(capaHtml) && !/<footer[\s\S]*id="tema"/.test(capaHtml));
  checar('B', 'o botão de tema tem texto além do ícone', /class="navbar__tema-texto">Tema</.test(capaHtml));
  checar('B', 'a linha de data está no alto de toda página', ['/', '/agenda', '/autores', '/apoie'].every((r) => /class="dateline__data">[A-Z][a-zç-]+(-feira)?, \d{1,2} de [a-zç]+ de \d{4}</.test(respostas[r].corpo)));
  checar('B', 'o rodapé tem a coluna do Instituto (quem escreve, escreva, apoie) e o colofão', /Quem escreve<\/a>/.test(capaHtml) && /Escreva no Instituto<\/a>/.test(capaHtml) && /href="\/apoie">Apoie<\/a>/.test(capaHtml) && /class="rodape__colofao"/.test(capaHtml));
  checar('B', 'a faixa "Quem escreve" está na capa e termina no convite', /class="autores-faixa"/.test(capaHtml) && /autor-card--convite/.test(capaHtml));

  /* o relógio: nunca um "0" fingindo medida; e diz sobre quais fontes mede */
  checar('B', 'o relógio não mostra "0" como valor de medida', !/numero__valor">0</.test(capaHtml));
  const soTextoBlue = blue.replace(/<[^>]+>/g, ' ');
  /* O relógio, depois do conserto de 23/09/2026. A asserção mudou junto com o
     método: antes cobrava a confissão do zero, agora cobra que a página
     DESCREVA o agrupamento que o código realmente faz — e que diga o tamanho
     da amostra em vez de escondê-lo. Página que descreve um método que o
     código não usa é a pior espécie de documentação: a que passa em revisão. */
  checar('B', 'Blueprints descreve o agrupamento por termo raro, e não o método velho',
    /termos <strong>raros<\/strong>/.test(blue) && /dois<\/strong>\s*termos raros em comum/.test(blue) && !/mesmo conjunto<\/strong> de/.test(blue));
  checar('B', 'Blueprints nega que o agrupamento seja IA', /não é\s*inteligência artificial/.test(soTextoBlue) || /Nada disso é\s*inteligência artificial/.test(soTextoBlue));
  checar('B', 'Blueprints diz quantas fontes brasileiras marcam o relógio e o tamanho da amostra',
    /fontes brasileiras que marcam o\s+relógio/.test(blue) && /(par apurado|pares apurados)/.test(blue));
  checar('B', 'Blueprints trata o que nunca chegou como achado, não como falha',
    /são o achado<\/strong>/.test(blue));

  /* --------------------------------------------- a capa tem foto de verdade
     REGRA DO DONO, 24/09/2026: a notícia principal nunca pode ser uma sem
     imagem real. Está travada no compilador (destaque: true exige imagem) e em
     conteudo/index.ts (o destaque automático prefere quem tem foto) — aqui se
     confere o resultado no HTML servido, que é o único lugar onde as duas
     pontas se encontram. */
  const destaqueDaCapa = /<article class="destaque"[\s\S]*?<\/article>/.exec(capaHtml)?.[0] ?? '';
  checar('B', 'a notícia principal da capa tem imagem REAL, não arte gerada',
    /data-arte="foto"/.test(destaqueDaCapa), destaqueDaCapa ? (/data-arte="(\w+)"/.exec(destaqueDaCapa)?.[1] ?? 'sem arte') : 'sem destaque na capa');
  checar('B', 'e a imagem da capa mostra crédito e licença', /class="arte__credito"/.test(destaqueDaCapa));

  /* ------------------------------------------------------- boletim gerado
     O Giro passou a ser gerado dos dados em 24/09/2026. Isso é o tipo de
     mudança que faz um site começar a mentir por omissão, então as travas são
     do mesmo tamanho: a peça tem de se declarar, as promessas do site têm de
     ter sido ESTREITADAS (e não apagadas), e nenhuma outra seção pode ser
     gerada. */
  const gerados = pecas.filter((p) => p.meta.gerado === 'true');
  checar('B', 'só o Giro pode ser boletim gerado', gerados.every((p) => p.secao === 'giro'), gerados.map((p) => `${p.secao}/${p.slug}`).join(', '));
  checar('B', 'boletim gerado não declara autor (dizer que uma pessoa escreveu seria o engano)',
    gerados.every((p) => p.meta.autor === undefined));
  checar('B', 'boletim gerado declara os números que a prosa pode usar', gerados.every((p) => (p.meta.numeros ?? '').trim().length > 0));
  for (const p of gerados) {
    const html = respostas[`/${p.secao}/${p.slug}`]?.corpo ?? '';
    checar('B', `/${p.secao}/${p.slug} avisa no alto que é gerado, e nega o modelo de linguagem`,
      /Boletim gerado dos dados/.test(html) && /Não há modelo de linguagem/.test(html));
    checar('B', `/${p.secao}/${p.slug} assina a origem, não uma pessoa`,
      /Gerado dos dados do Instituto/.test(html) && !/rel="author"/.test(html));
  }
  checar('B', 'o rodapé estreitou a promessa em vez de apagá-la (notícia/artigo/relatório por gente, Giro gerado)',
    /Notícia, artigo e relatório: escritos por gente/.test(capaHtml) && /Giro é boletim de números, gerado da apuração/.test(capaHtml));
  /* O balanço da semana é do SETOR. Sem esta separação o boletim da s37 dizia
     que o que repercutiu na automação foi "Trump tossed a grenade into space
     relations" — 10% do corpus era automação, e o resto entrava na conta. */
  for (const p of gerados) {
    const html = respostas[`/${p.secao}/${p.slug}`]?.corpo ?? '';
    checar('B', `/${p.secao}/${p.slug} conta o SETOR e põe contexto e comunidade à parte`,
      /não entram nos números acima/.test(html) || !/acompanha o que corre em volta/.test(html));
  }
  checar('B', 'Blueprints declara o Giro como a exceção, e diz que segue sem modelo de linguagem',
    /O Giro da Semana é a exceção/.test(blue) && /sem modelo de\s+linguagem no caminho|não havendo modelo de\s+linguagem/.test(blue));

  /* ------------------------------------------------------- 11/09/2026
     O que as decisões desta data prometeram, virado asserção. */

  /* O artigo fixo: segundo bloco da capa, e notícia nova não o empurra. */
  checar('B', 'o bloco Artigos vem ANTES de "Também nesta semana" na capa',
    capaHtml.indexOf('>Artigos<') > 0 && capaHtml.indexOf('>Artigos<') < (capaHtml.indexOf('Também nesta semana') === -1 ? Infinity : capaHtml.indexOf('Também nesta semana')));
  const fixos = pecas.filter((p) => p.meta.fixo === 'true');
  checar('B', 'no máximo um artigo com "fixo: true", e só em artigos', fixos.length <= 1 && fixos.every((p) => p.secao === 'artigos'), fixos.map((p) => p.slug).join(', '));

  /* "Enviar um evento" saiu da capa e ficou só na agenda. */
  checar('B', 'a capa não pede evento; a agenda continua pedindo',
    !/href="\/agenda#enviar"/.test(capaHtml) && /id="enviar"/.test(respostas['/agenda'].corpo));

  /* Vocabulário: "peça" é termo interno do código; o leitor lê notícia, artigo
     ou texto.

     ⚠️ Confere o texto RENDERIZADO de TODAS as páginas, e não o fonte.

     A versão de 11/09 olhava só a capa e uma notícia — e, pior, não olhava
     coisa nenhuma: na edição o \b da regex virou um caractere BACKSPACE
     literal (0x08), então ela pedia "peças" seguido de backspace e nunca
     casava. A asserção passava sempre, que é o mesmo que não existir — a
     advertência está escrita no próprio src/giro/auditar.ts. Passaram por
     baixo dela três ocorrências bem visíveis: a nota do alto de toda página,
     a contagem de textos do autor e a própria finalidade do cadastro.

     Lição que virou regra: conferir o RENDERIZADO, não o fonte. Buscar "peça"
     no código deixa escapar o que é montado por ternário ou vem de constante,
     que foi exatamente o caso das três.

     Duas exceções, e as duas são de sentido, não de preguiça — num site de
     automação industrial "peça" É vocabulário do ramo:

       · o CORPO do texto (div.obra) fica de fora: ali quem fala é o autor, e
         "recebem peças novas", "suporte técnico e peças" ou "três peças" são
         português correto. A decisão foi tirar "peça" como NOME DE UNIDADE
         EDITORIAL da voz do site — não banir a palavra do vocabulário;
       · o glossário fica de fora: lá "a peça" é a peça de trabalho que o robô
         toca, e trocar quebraria o verbete. */
  const soTexto = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ');
  const semObra = (h) => h.replace(/<div class="obra"[^>]*>[\s\S]*?<\/div>/g, ' ');
  const comPeca = todasAsPaginas
    .filter(([rota]) => rota !== '/glossario')
    .filter(([, r]) => /\bpeças?\b/i.test(soTexto(semObra(r.corpo))))
    .map(([rota]) => rota);
  checar('B', '"peça" não é a palavra do SITE em página nenhuma (corpo do texto e glossário à parte: lá é peça de máquina)', comPeca.length === 0, comPeca.join(', '));

  /* Tipografia: moeda não se separa do valor na quebra de linha.
     A manchete da peça principal quebrava em "por US$ / 12,9 bilhões". O
     compilador gruda com espaço inquebrável (scripts/compilar.ts › naoQuebrar);
     isto confere que nenhuma página serviu o par com espaço comum. */
  const moedaSolta = todasAsPaginas
    .filter(([, r]) => /(R\$|US\$|€|£) \d/.test(soTexto(r.corpo)))
    .map(([rota]) => rota);
  checar('B', 'moeda e valor não se separam na quebra de linha (espaço inquebrável)', moedaSolta.length === 0, moedaSolta.join(', '));

  /* LGPD: a finalidade tem de estar NA COLETA, não só na política. */
  const priv = respostas['/privacidade'].corpo;
  checar('B', 'a finalidade do cadastro está ao lado do formulário, na capa',
    /Para que serve o seu e-mail/.test(capaHtml) && /mandar o Giro da Semana/.test(capaHtml) && /href="\/privacidade"/.test(capaHtml));
  checar('B', '/privacidade diz a finalidade, a base legal e como sair',
    /mandar o Giro da Semana/.test(priv) && /art\. 7º, I/i.test(priv) && /art\. 18/i.test(priv) && /id="direitos"/.test(priv));
  checar('B', '/privacidade afirma o que o QA também confere: sem cookie e sem terceiro',
    /Não usamos cookie/.test(priv) && /rastreador/.test(priv));
  checar('B', 'a promessa de /privacidade é verdadeira: nada de terceiro na CSP da página',
    !/https?:\/\/(?!localhost|127\.0\.0\.1)/.test((/<meta http-equiv="Content-Security-Policy"[^>]*>/.exec(capaHtml) ?? [''])[0]));
  checar('B', 'o rodapé de toda página leva a /privacidade',
    ['/', '/blueprints', '/apoie'].every((r) => /href="\/privacidade"/.test(respostas[r].corpo)));

  /* Publicidade: a regra existe ANTES da primeira venda. Com zero peça paga
     hoje, o que se confere é a regra — e no dia em que houver uma, as duas
     linhas seguintes passam a conferir o rótulo em cada superfície. */
  const pagas = pecas.filter((p) => p.meta.patrocinada === 'true');
  checar('B', 'nenhuma notícia e nenhum Giro é patrocinado (veredito e medição não estão à venda)',
    pagas.every((p) => p.secao === 'artigos' || p.secao === 'relatorios'), pagas.map((p) => `${p.secao}/${p.slug}`).join(', '));
  checar('B', 'toda peça paga declara quem pagou', pagas.every((p) => (p.meta.patrocinador ?? '').trim().length > 1));
  for (const p of pagas) {
    const html = respostas[`/${p.secao}/${p.slug}`]?.corpo ?? '';
    checar('B', `/${p.secao}/${p.slug} sai rotulada como publicidade na peça, na listagem e no RSS`,
      /class="publi-caixa"/.test(html) && /class="selo-publi"/.test(html) &&
      respostas[`/${p.secao}`].corpo.includes('selo-publi') &&
      respostas['/feed.xml'].corpo.includes(`[Publicidade] ${p.meta.titulo}`));
  }

  /* distribuição */
  const sm = respostas['/sitemap.xml'].corpo;
  checar('B', 'sitemap tem /artigos, /autores, /apoie, /privacidade e a página do autor', ['/artigos', '/autores', '/apoie', '/privacidade', '/autores/pedro-oliveira'].every((r) => sm.includes(`${r}</loc>`)));
  const rb = respostas['/robots.txt'].corpo;
  if (!/Disallow: \/$/m.test(rb)) checar('B', 'robots fecha só os POSTs novos', /Disallow: \/assinar/.test(rb) && /Disallow: \/autores\/escrever/.test(rb) && /Disallow: \/apoie\/enviar/.test(rb));

  /* o contato: só no dev local, e apaga o rastro */
  if (LOCAL) {
    const antesContato = sql(`SELECT COUNT(*) n FROM contato`)[0].n;
    const rRobo = await postar('/autores/escrever', 'nome=Robo&email=robo.qa@exemplo.com&sitio=x');
    checar('B', 'contato: honeypot não grava e responde 303', rRobo.status === 303 && sql(`SELECT COUNT(*) n FROM contato`)[0].n === antesContato);
    const rInvalido = await postar('/autores/escrever', 'nome=QA&email=nao-e-email');
    checar('B', 'contato: e-mail inválido é 400 e não grava', rInvalido.status === 400 && sql(`SELECT COUNT(*) n FROM contato`)[0].n === antesContato);
    const rSemEmpresa = await postar('/apoie/enviar', 'nome=QA&email=qa.parceiro@exemplo.com');
    checar('B', 'apoie: sem empresa é 400', rSemEmpresa.status === 400);
    const alvo = `qa.contato.${Date.now()}@exemplo.com`;
    const rOk = await postar('/autores/escrever', `nome=QA%20Teste&email=${encodeURIComponent(alvo)}&mensagem=${encodeURIComponent('teste do QA')}`);
    const linha = sql(`SELECT tipo, nome, mensagem FROM contato WHERE email='${alvo}'`)[0];
    checar('B', 'contato: envio válido grava como tipo autor e volta para #escrever', rOk.status === 303 && /#escrever$/.test(rOk.headers.get('location') ?? '') && linha?.tipo === 'autor' && linha?.nome === 'QA Teste', JSON.stringify(linha));
    const rPar = await postar('/apoie/enviar', `nome=QA&email=${encodeURIComponent(alvo)}&empresa=QA%20Ltda`);
    checar('B', 'apoie: envio válido grava como tipo parceiro', rPar.status === 303 && sql(`SELECT COUNT(*) n FROM contato WHERE email='${alvo}' AND tipo='parceiro'`)[0].n === 1);
    sql(`DELETE FROM contato WHERE email LIKE '%@exemplo.com'`);
  }
}

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
