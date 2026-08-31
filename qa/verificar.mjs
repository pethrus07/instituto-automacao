/**
 * QA do Instituto Automação — mede, não afirma.
 *
 *   npm run qa            (com `npm run dev` rodando em outra aba)
 *   npm run qa -- 8788    (outra porta)
 *
 * Três eixos, e o terceiro é o que costuma faltar:
 *   A. FUNCIONAL   — as rotas e o banco fazem o que deveriam
 *   B. CONFORMIDADE— o que está no ar bate com o que os documentos prometem
 *   C. QUALIDADE   — contraste, semântica, peso, cabeçalhos: medidos, não jurados
 *
 * Regra da casa: toda afirmação escrita em documento vira asserção aqui.
 * Documento que afirma o que ninguém verificou é dívida, não registro.
 */
import { readFileSync } from 'node:fs';
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
/* Ferramentas de medição                                                    */
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

/** Contraste WCAG 2.x a partir de dois hex. */
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

/** Lê os tokens de um bloco do tokens.css. */
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
  const bloco = css.slice(abre, fim);
  const mapa = {};
  for (const m of bloco.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) mapa[m[1]] = m[2];
  return mapa;
}

/**
 * Consulta o D1 local.
 *
 * Chama o wrangler pelo próprio node, sem shell: no Windows, `shell: true`
 * faz o interpretador reprocessar os argumentos e o SQL com espaço chega
 * picado do outro lado.
 */
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

/* ======================================================================== */
console.log(`\nQA · Instituto Automação — ${BASE}`);

/* ---------------------------------------------------------- A. FUNCIONAL */
titulo('A · Funcional — rotas');

// O caminho do item é DESCOBERTO no banco, nunca fixado no teste: o slug é
// gerado na publicação e muda com o título. Teste que codifica dado
// incidental quebra sozinho e mente sobre a causa.
const publicado = sql(
  `SELECT nucleo, slug FROM item WHERE status='publicado' AND slug IS NOT NULL LIMIT 1`,
)[0];
const rotaItem = publicado ? `/${publicado.nucleo}/${publicado.slug}` : null;
if (!rotaItem) avisar('nenhum item publicado na base', 'as conferências da página de item foram puladas');

const rotas = [
  ['/', 200],
  ['/industria', 200],
  ['/observatorio', 200],
  ['/operacao', 200],
  ['/edificacoes', 200],
  ['/agenda', 200],
  ['/saude', 200],
  ...(rotaItem ? [[rotaItem, 200]] : []),
  ['/industria/nao-existe', 404],
  ['/nucleo-inventado', 404],
];

const respostas = {};
for (const [caminho, esperado] of rotas) {
  const r = await pegar(caminho);
  respostas[caminho] = r;
  checar('A', `${caminho} → ${esperado}`, r.status === esperado, `veio ${r.status}`);
}

const saude = JSON.parse(respostas['/saude'].corpo);
checar('A', 'healthcheck reporta banco ok', saude.ok === true, JSON.stringify(saude));

const css = await pegar(saude.rota_css);
checar('A', 'CSS servido pela rota com hash', css.status === 200 && css.bytes > 10000);
checar(
  'A',
  'CSS antigo em cache não devolve 404',
  (await pegar('/a/app-hashvelho.css')).status === 200,
  'hash diferente precisa continuar servindo — senão folha velha quebra a página',
);

medidas.htmlCapa = respostas['/'].bytes;
medidas.htmlRadar = respostas['/industria'].bytes;
medidas.css = css.bytes;
medidas.msRadar = respostas['/industria'].ms;

/* ------------------------------------------------------------ cabeçalhos */
titulo('A · Funcional — cabeçalhos de cache');
checar(
  'A',
  'listagem tem s-maxage de 5 min',
  respostas['/industria'].cab['cache-control'] === 'public, max-age=0, s-maxage=300',
  respostas['/industria'].cab['cache-control'],
);
if (rotaItem)
  checar(
    'A',
    'item tem s-maxage de 1 h',
    respostas[rotaItem].cab['cache-control'] === 'public, max-age=0, s-maxage=3600',
    respostas[rotaItem].cab['cache-control'],
  );
checar('A', 'CSS é immutable', (css.cab['cache-control'] ?? '').includes('immutable'));

/* ------------------------------------------------------------ B. BANCO */
titulo('B · Conformidade — as regras do projeto no banco');

const violacao = sql(
  `SELECT COUNT(*) n FROM item i JOIN fonte f ON f.id=i.fonte_id
    WHERE i.modo='traducao' AND f.licenca<>'liberada'`,
)[0];
checar(
  'B',
  'REGRA CENTRAL: tradução integral só de fonte liberada',
  violacao.n === 0,
  `${violacao.n} item(ns) traduzidos de fonte não liberada — isso é obra derivada sem autorização`,
);

const bloqueada = sql(`SELECT COUNT(*) n FROM item i JOIN fonte f ON f.id=i.fonte_id WHERE f.licenca='bloqueada'`)[0];
checar('B', 'nenhum item veio de fonte bloqueada', bloqueada.n === 0);

const semEvidencia = sql(`SELECT COUNT(*) n FROM fonte WHERE licenca='liberada' AND licenca_evidencia IS NULL`)[0];
checar(
  'B',
  'toda fonte liberada tem evidência da licença',
  semEvidencia.n === 0,
  `${semEvidencia.n} fonte(s) marcadas liberada sem o link que autoriza`,
);

const semSlug = sql(`SELECT COUNT(*) n FROM item WHERE status='publicado' AND (slug IS NULL OR slug='')`)[0];
checar('B', 'todo item publicado tem slug', semSlug.n === 0);

const dupUrl = sql(`SELECT COUNT(*) n FROM (SELECT url_canonica FROM item GROUP BY url_canonica HAVING COUNT(*)>1)`)[0];
checar('B', 'nenhuma URL canônica duplicada', dupUrl.n === 0);

const relogioNeg = sql(`SELECT COUNT(*) n FROM item WHERE minutos_apos_fonte < 0`)[0];
checar('B', 'nenhum item publicado antes da fonte', relogioNeg.n === 0);

const atrasoNeg = sql(`SELECT COUNT(*) n FROM assunto WHERE atraso_br_dias < 0`)[0];
checar('B', 'nenhum atraso negativo', atrasoNeg.n === 0);

// Mais forte que a checagem de `modo`: prova que o TEXTO integral de fonte
// não liberada não existe na base. `modo` é intenção; `corpo` é o texto.
const corpoIndevido = sql(
  `SELECT COUNT(*) n FROM item i JOIN fonte f ON f.id=i.fonte_id
    WHERE i.corpo IS NOT NULL AND f.licenca<>'liberada'`,
)[0];
checar(
  'B',
  'REGRA CENTRAL: texto integral só existe de fonte liberada',
  corpoIndevido.n === 0,
  `${corpoIndevido.n} item(ns) com corpo de fonte não liberada`,
);

const semContexto = sql(`SELECT COUNT(*) n FROM item WHERE status='publicado' AND (contexto_br IS NULL OR contexto_br='')`)[0];
checar(
  'B',
  'todo item publicado tem o "o que isso muda aqui"',
  semContexto.n === 0,
  'é a camada que separa autoridade de tradução automática em massa',
);

const semRelogio = sql(`SELECT COUNT(*) n FROM item WHERE status='publicado' AND minutos_apos_fonte IS NULL`)[0];
checar('B', 'todo item publicado tem o relógio calculado', semRelogio.n === 0);

const arquivadoSemMotivo = sql(`SELECT COUNT(*) n FROM item WHERE status='arquivado' AND (motivo_arquivo IS NULL OR motivo_arquivo='')`)[0];
checar('B', 'todo item arquivado registra o motivo', arquivadoSemMotivo.n === 0);

const publicadoSemAlta = sql(
  `SELECT COUNT(*) n FROM item i JOIN fonte f ON f.id=i.fonte_id
    WHERE i.status='publicado' AND i.revisado_humano=0
      AND NOT (f.licenca='liberada' AND f.confianca='alta')`,
)[0];
checar(
  'B',
  'publicação automática só de fonte liberada E confiável',
  publicadoSemAlta.n === 0,
  `${publicadoSemAlta.n} item(ns) no ar sem revisão vindos de fonte que não permite`,
);

/* ---- de quem é a conta que paga, e o glossário de duas colunas ---- */
const ia = saude.ia ?? {};
medidas.iaModo = ia.modo ?? '?';
medidas.iaConta = ia.conta || '(não declarada)';

checar(
  'B',
  'o healthcheck declara o modo da IA e a conta que paga',
  ia.modo === 'simulacao' || ia.modo === 'conectado',
  JSON.stringify(ia),
);
checar(
  'B',
  'conectado exige conta declarada',
  ia.modo !== 'conectado' || Boolean(ia.conta),
  'chamar a API sem dizer de quem é o custo gasta dinheiro de outra pessoa (acordo interno ponto 2)',
);
if (ia.modo === 'simulacao') {
  const gastoSimulando = sql(`SELECT COALESCE(SUM(brl),0) brl FROM custo_dia`)[0];
  checar(
    'B',
    'em simulação, nada foi gasto',
    Number(gastoSimulando.brl) === 0,
    `R$ ${gastoSimulando.brl} registrados com a IA em simulação — alguém chamou a API`,
  );
} else {
  avisar('a IA está CONECTADA', `conta: ${ia.conta} — cada execução gasta de verdade`);
}

const glossario = sql(
  `SELECT SUM(CASE WHEN manter_original=1 THEN 1 ELSE 0 END) mantem,
          SUM(CASE WHEN manter_original=0 THEN 1 ELSE 0 END) traduz,
          SUM(CASE WHEN manter_original=1 AND (nota IS NULL OR nota='') THEN 1 ELSE 0 END) semGlosa
     FROM glossario WHERE travado=1`,
)[0];
medidas.glossarioTraduz = glossario.traduz;
medidas.glossarioMantem = glossario.mantem;
checar(
  'B',
  'todo termo que não se traduz tem o significado aproximado',
  glossario.semGlosa === 0,
  `${glossario.semGlosa} termo(s) marcados para manter no original sem a glosa — a regra fica inaplicável`,
);
checar('B', 'o glossário tem as duas colunas povoadas', glossario.traduz > 0 && glossario.mantem > 0);

const custo = sql(`SELECT COALESCE(SUM(brl),0) brl, COUNT(*) dias FROM custo_dia`)[0];
medidas.custoAcumuladoBRL = Number(custo.brl).toFixed(4);
checar(
  'B',
  'contabilidade de custo existe e é coerente',
  Number(custo.brl) >= 0,
  `R$ ${custo.brl} em ${custo.dias} dia(s)`,
);

const tabelas = sql(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf%' AND name NOT LIKE 'd1_%'`).map((r) => r.name).sort();
const esperadas = ['assinante','assunto','correcao','custo_dia','evento','fonte','glossario','item','obra'];
checar('B', 'as 9 tabelas do modelo existem', JSON.stringify(tabelas) === JSON.stringify(esperadas), tabelas.join(', '));

/* -------------------------------------------- B. Conformidade com o texto */
titulo('B · Conformidade — o site diz o que os documentos prometem');

const radar = respostas['/industria'].corpo;
const operacao = respostas['/operacao'].corpo;

checar('B', 'núcleo em modo Radar se declara na página', operacao.includes('modo Radar'));
checar('B', 'núcleo quente NÃO exibe o aviso de Radar', !radar.includes('está em modo Radar'));
checar('B', 'o relógio aparece no radar', /relogio__valor/.test(radar));
checar('B', 'o "o que isso muda aqui" tem marcação própria', /item__contexto/.test(radar));
checar('B', 'item traduzido sem revisão mostra o selo', /selo--pendente/.test(radar));
checar('B', 'toda fonte é creditada com link', /item__fonte/.test(radar));

const paginaItem = rotaItem ? respostas[rotaItem].corpo : '';
checar('B', 'item explica como foi produzido', paginaItem.includes('Como este item foi produzido'));
// Analisa a âncora inteira: a ordem dos atributos não pode influenciar o
// resultado. A versão anterior deste teste exigia noopener DEPOIS de target
// e acusava um defeito que não existia — verificação errada é pior que
// verificação nenhuma, porque manda consertar o que está certo.
const ancorasNovaAba = [...paginaItem.matchAll(/<a\b[^>]*>/g)]
  .map((m) => m[0])
  .filter((tag) => /target\s*=\s*"_blank"/.test(tag));
const semNoopener = ancorasNovaAba.filter((tag) => !/rel\s*=\s*"[^"]*noopener/.test(tag));
checar(
  'B',
  `link externo tem rel noopener (${ancorasNovaAba.length} âncora(s) com target _blank)`,
  ancorasNovaAba.length > 0 && semNoopener.length === 0,
  semNoopener.join(' | ') || 'nenhuma âncora com target=_blank encontrada para conferir',
);

/* ------------------------------------------------------------- B. AGENDA */
titulo('B · Conformidade — a agenda');

const agenda = await pegar('/agenda');
const evPub = sql(
  `SELECT slug, nucleo, inicio, COALESCE(fim,inicio) termina FROM evento
    WHERE status='publicado' AND slug IS NOT NULL ORDER BY inicio`,
);
const hoje = new Date().toISOString().slice(0, 10);
const futuros = evPub.filter((e) => e.termina >= hoje);
const passados = evPub.filter((e) => e.termina < hoje);

const naListagem = (agenda.corpo.match(/class="evento /g) ?? []).length;
medidas.agendaListados = naListagem;
checar(
  'B',
  'a agenda lista exatamente os eventos que ainda não terminaram',
  naListagem === futuros.length,
  `listados ${naListagem}, esperados ${futuros.length}`,
);

// Evento em curso não pode sumir: feira de 4 dias no 3º dia ainda acontece.
const emCurso = evPub.filter((e) => e.inicio <= hoje && e.termina >= hoje);
if (emCurso.length) {
  const dentro = emCurso.every((e) => agenda.corpo.includes(`/agenda/${e.slug}`));
  checar('B', 'evento em curso continua na agenda', dentro);
}

// Nada com status diferente de publicado pode aparecer.
const naoPublicados = sql(`SELECT slug FROM evento WHERE status<>'publicado' AND slug IS NOT NULL`);
const vazou = naoPublicados.filter((e) => agenda.corpo.includes(`/agenda/${e.slug}`));
checar(
  'B',
  'envio não conferido não aparece na agenda',
  vazou.length === 0,
  vazou.map((e) => e.slug).join(', '),
);
if (naoPublicados.length) {
  const r = await pegar(`/agenda/${naoPublicados[0].slug}`);
  checar('B', 'página de evento não conferido devolve 404', r.status === 404, `veio ${r.status}`);
}

// Permalink de evento passado sobrevive, mas diz a verdade.
if (passados.length) {
  const r = await pegar(`/agenda/${passados[0].slug}`);
  checar('B', 'permalink de evento passado continua no ar', r.status === 200, `veio ${r.status}`);
  checar(
    'B',
    'e a página avisa que já aconteceu',
    r.corpo.includes('já aconteceu'),
    'quem chega pela busca meses depois não pode achar que ainda vai acontecer',
  );
}

// Cada combinação de filtro é uma URL própria, e o recorte confere.
for (const [qs, cond] of [
  ['?o=br', (e) => true],
  ['?f=online', () => true],
  ['?n=industria', () => true],
]) {
  const r = await pegar('/agenda' + qs);
  checar('B', `filtro ${qs} responde 200`, r.status === 200);
  checar(
    'B',
    `filtro ${qs} tem canonical próprio`,
    r.corpo.includes(`/agenda${qs.replace(/&/g, '&amp;')}"`),
    'sem canonical próprio, os recortes competem entre si na busca',
  );
}

const semResultado = await pegar('/agenda?n=operacao&o=fora');
checar(
  'B',
  'filtro sem resultado explica e oferece saída',
  semResultado.status === 200 && semResultado.corpo.includes('Nenhum evento com esses filtros'),
);

/* --- dados estruturados: é o que faz o Google mostrar data e local --- */
function lerLd(html) {
  const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return 'invalido';
  }
}

const ldAgenda = lerLd(agenda.corpo);
checar('C', 'a agenda traz JSON-LD válido', ldAgenda && ldAgenda !== 'invalido', String(ldAgenda));
checar('C', 'e é um ItemList com os eventos', ldAgenda?.['@type'] === 'ItemList' && ldAgenda?.numberOfItems === futuros.length);

if (futuros.length) {
  const r = await pegar(`/agenda/${futuros[0].slug}`);
  const ld = lerLd(r.corpo);
  checar('C', 'a página do evento traz JSON-LD válido', ld && ld !== 'invalido', String(ld));
  checar('C', 'do tipo Event, com data e modo de participação', ld?.['@type'] === 'Event' && Boolean(ld?.startDate) && Boolean(ld?.eventAttendanceMode));
  // Preço inventado em dado estruturado aparece na busca do Google.
  checar(
    'C',
    'não declara oferta sem preço conhecido',
    ld?.offers === undefined || ld?.offers?.price === '0',
    JSON.stringify(ld?.offers),
  );
}

// `</script>` dentro do JSON fecharia a tag: nome de evento é texto de terceiro.
checar(
  'C',
  'JSON-LD escapa < e > (nome de evento vem de formulário público)',
  !/<script type="application\/ld\+json">[^<]*<\//.test(agenda.corpo.replace(/\\u003c/g, '')) ||
    !agenda.corpo.includes('</script></script>'),
);

/* ------------------------------------------------- B. VEREDITO E MANCHETE */
titulo('B · Conformidade — o veredito e a manchete');

const VEREDITOS = ['chega', 'a_caminho', 'nao_chega', 'sem_efeito'];

const foraDaCategoria = sql(
  `SELECT COUNT(*) n FROM item
    WHERE contexto_veredito IS NOT NULL
      AND contexto_veredito NOT IN ('chega','a_caminho','nao_chega','sem_efeito')`,
)[0];
checar(
  'B',
  'o veredito é categoria FECHADA',
  foraDaCategoria.n === 0,
  'rótulo aberto vira rótulo literário — é o que o Aos Fatos resolve e o Semafor não',
);

const publicadoSemVeredito = sql(
  `SELECT COUNT(*) n FROM item WHERE status='publicado' AND contexto_br IS NOT NULL AND contexto_veredito IS NULL`,
)[0];
checar(
  'B',
  'todo contexto publicado tem veredito',
  publicadoSemVeredito.n === 0,
  'contexto sem veredito é juízo sem critério declarado',
);

// O recorte do filtro é conferido contra o banco, item a item.
const paginaNucleo = radar;
for (const v of VEREDITOS) {
  const esperado = sql(
    `SELECT COUNT(*) n FROM item WHERE status='publicado' AND nucleo='industria' AND contexto_veredito='${v}'`,
  )[0].n;
  const r = await pegar(`/industria?v=${v}`);
  const listados = (r.corpo.match(/class="item__titulo"/g) ?? []).length;
  checar('B', `filtro ?v=${v} lista exatamente ${esperado}`, listados === esperado, `listou ${listados}`);
  checar('B', `filtro ?v=${v} tem canonical próprio`, r.corpo.includes(`/industria?v=${v}"`));
  // Obra não tem veredito: sob o filtro, ela não pode aparecer.
  checar(
    'B',
    `filtro ?v=${v} não mistura obra no recorte`,
    !r.corpo.includes('>Obra<'),
    'o filtro promete um recorte; obra ali entregaria lista misturada',
  );
}

// A manchete não pode repetir na lista abaixo dela.
const idDestaque = sql(
  `SELECT slug FROM item WHERE status='publicado' AND contexto_br IS NOT NULL AND nucleo='industria'
    ORDER BY publicado_em DESC LIMIT 1`,
)[0];
if (idDestaque) {
  const ocorrencias = (paginaNucleo.match(new RegExp(`/industria/${idDestaque.slug}"`, 'g')) ?? []).length;
  checar(
    'B',
    'a manchete aparece uma vez só, sem repetir na lista',
    ocorrencias === 1,
    `apareceu ${ocorrencias}x`,
  );
  checar('C', 'a manchete usa o bloco de destaque', paginaNucleo.includes('destaque__titulo'));
}

// O rótulo de camada: a maior ambiguidade do produto.
if (rotaItem) {
  checar(
    'B',
    'a página do item separa o que a fonte diz do que nós lemos',
    paginaItem.includes('O que a fonte diz'),
  );
  const temVeredito = VEREDITOS.some((v) => paginaItem.includes(`veredito v-${v}`));
  checar('B', 'e mostra o veredito com critério declarado', temVeredito);
  checar('B', 'e diz que o veredito é redação do Instituto', paginaItem.includes('redação do Instituto'));
}

// Capa: número sem base é pior que capa sem número.
const capa = respostas['/'];
const temNumeros = capa.corpo.includes('numero__valor');
const temAvisoSemBase = capa.corpo.includes('quando houver base para eles');
checar(
  'B',
  'a capa mostra números OU explica por que ainda não há',
  temNumeros !== temAvisoSemBase,
  'capa abrindo com zeros seria pior que capa sem faixa',
);
medidas.capaComNumeros = temNumeros ? 'sim' : 'ainda não';

/* --------------------------------------------------------- B. OBRA E FEED */
titulo('B · Conformidade — a obra assinada e a distribuição');

const obras = sql(`SELECT slug, nucleo, formato, autor, assinada, item_id FROM obra WHERE status='publicado'`);
medidas.obrasPublicadas = obras.length;

const assinadas = obras.filter((o) => o.formato !== 'leitura');
const semAutor = assinadas.filter((o) => !o.assinada || !o.autor);
checar(
  'B',
  'Análise, Caso e Panorama são SEMPRE assinados',
  semAutor.length === 0,
  'autoridade não transfere de marca anônima para pessoa — é o objetivo do projeto',
);

const leituras = obras.filter((o) => o.formato === 'leitura');
checar(
  'B',
  'a Leitura sai como voz do núcleo, não assinada',
  leituras.every((o) => !o.assinada),
);
checar(
  'B',
  'toda Leitura está ancorada num item do radar',
  leituras.every((o) => Boolean(o.item_id)),
  'Leitura solta não é leitura de nada',
);

// O radar continua sem autor — o outro lado da mesma decisão.
const radarSemAutor = !/assinatura__autor/.test(radar);
checar('B', 'o radar continua SEM assinatura', radarSemAutor);

if (assinadas.length) {
  const o = assinadas[0];
  const r = await pegar(`/${o.formato}/${o.slug}`);
  checar('B', `página da obra responde (/${o.formato}/${o.slug})`, r.status === 200, `veio ${r.status}`);
  checar('B', 'e mostra a assinatura de quem escreveu', r.corpo.includes(o.autor));
  checar('B', 'e declara que é texto assinado', r.corpo.includes('Texto assinado'));
  const h1 = (r.corpo.match(/<h1[\s>]/g) ?? []).length;
  checar('C', 'obra tem exatamente um h1 (markdown começa no h2)', h1 === 1, `tem ${h1}`);
  checar('C', 'nenhuma tag crua sobreviveu ao markdown', !/<(script|iframe|object|embed)\b/i.test(r.corpo.replace(/<script>\(function/, '')));
}

if (leituras.length) {
  const it = sql(`SELECT nucleo, slug FROM item WHERE id='${leituras[0].item_id}' AND slug IS NOT NULL`)[0];
  if (it) {
    const r = await pegar(`/${it.nucleo}/${it.slug}`);
    checar('B', 'a Leitura aparece dentro do item que comenta', r.corpo.includes('Leitura do Instituto'));
  }
}

/* ---- os feeds que o <head> anuncia desde a sprint 0 ---- */
const NUCLEOS_LISTA = ['industria', 'observatorio', 'operacao', 'edificacoes'];
for (const n of NUCLEOS_LISTA) {
  const r = await pegar(`/feed/${n}.xml`);
  checar('B', `/feed/${n}.xml existe (o <head> já o anunciava)`, r.status === 200, `veio ${r.status}`);
  checar(
    'C',
    `/feed/${n}.xml é XML bem formado`,
    (r.cab['content-type'] ?? '').includes('rss+xml') &&
      r.corpo.startsWith('<?xml') &&
      !/&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(r.corpo.replace(/<\?xml[^>]*>/, '')),
    'ampersand solto quebra o feed inteiro em qualquer leitor',
  );
}
checar('B', 'feed de núcleo inexistente dá 404', (await pegar('/feed/inventado.xml')).status === 404);

const mapa = await pegar('/sitemap.xml');
checar('B', 'sitemap.xml existe', mapa.status === 200);
const qtdUrls = (mapa.corpo.match(/<loc>/g) ?? []).length;
medidas.sitemapUrls = qtdUrls;
checar('B', 'sitemap traz as páginas do site', qtdUrls >= 6, `${qtdUrls} URLs`);
checar(
  'B',
  'sitemap não lista evento que já passou',
  !passados.some((e) => mapa.corpo.includes(`/agenda/${e.slug}<`)),
  'sitemap com evento passado gasta rastreio à toa',
);

const rb = await pegar('/robots.txt');
checar('B', 'robots.txt existe e aponta o sitemap', rb.status === 200 && rb.corpo.includes('Sitemap:'));

const tokensCss = readFileSync(join(RAIZ, 'design', 'tokens.css'), 'utf8');

/* --------------------------------------------- B. PORTUGUÊS E TEMA */
titulo('B · Conformidade — o texto e o tema');

/**
 * Português sem acento.
 *
 * Nasceu de um defeito real: o conteúdo da capa foi escrito em ASCII num
 * script de edição, para fugir de problema de codificação, e foi para a
 * tela assim — "automacao", "portugues", "ninguem". Nenhum teste pegava,
 * e é a primeira coisa que o leitor vê.
 */
const SEM_ACENTO = [
  'automacao', 'portugues', 'nucleo', 'nucleos', 'traducao', 'associacoes',
  'ninguem', 'publicacoes', 'agregacao', 'analise', 'juizo', 'revisao',
  'informacao', 'proprio', 'credito', 'codigo', 'intencao', 'numeros',
  'calendario', 'media', 'ate hoje', 'fabrica', 'chao', 'genero', 'noticia',
  'secao', 'conteudo', 'unico',
];
for (const [caminho, html] of [['/', respostas['/'].corpo], ['/industria', radar]]) {
  // Compara em minúsculas e só no texto visível, fora de tag e de atributo.
  const texto = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase();
  const achados = SEM_ACENTO.filter((w) => new RegExp(`(^|[^a-zà-ú])${w}([^a-zà-ú]|$)`).test(texto));
  checar(
    'B',
    `${caminho} não tem português sem acento`,
    achados.length === 0,
    achados.join(', '),
  );
}

/**
 * O tema.
 *
 * O site seguia `prefers-color-scheme` e escurecia sozinho — três rodadas
 * de ajuste na paleta clara passaram sem que ninguém visse, porque a tela
 * estava em modo escuro. Portal institucional não auto-escurece.
 */
// Procura a REGRA, não a palavra: o comentário do arquivo explica por que a
// media query saiu, e citar o nome dela não pode reprovar o teste.
checar(
  'B',
  'o tema NÃO segue a preferência do sistema',
  !/@media[^{]*prefers-color-scheme/.test(tokensCss),
  'claro é o site; escuro é cortesia para quem pede no botão',
);
checar(
  'B',
  'o escuro só existe sob [data-theme="dark"]',
  tokensCss.includes(':root[data-theme="dark"]'),
);
checar(
  'C',
  'a raiz declara color-scheme: light',
  /:root\s*\{[\s\S]{0,200}color-scheme:\s*light\s*;/.test(tokensCss),
  'sem isso o navegador escurece formulário e barra de rolagem por conta própria',
);

/* --------------------------------------------------------- C. QUALIDADE */
titulo('C · Qualidade — semântica e acessibilidade (medidas no HTML)');

const paginas = [['/', respostas['/'].corpo], ['/industria', radar]];
if (rotaItem) paginas.push([rotaItem, paginaItem]);
for (const [caminho, html] of paginas) {
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  checar('C', `${caminho} tem exatamente um h1`, h1 === 1, `tem ${h1}`);
}
checar('C', 'lang declarado como pt-BR', /<html lang="pt-BR">/.test(radar));
checar('C', 'title não vazio', /<title>[^<]{10,}<\/title>/.test(radar));
checar('C', 'meta description presente', /<meta name="description"/.test(radar));
checar('C', 'canonical presente', /<link rel="canonical"/.test(radar));
checar('C', 'og:title e og:locale presentes', /og:title/.test(radar) && /og:locale/.test(radar));
checar('C', 'landmarks header/main/footer', /<header/.test(radar) && /<main/.test(radar) && /<footer/.test(radar));
checar('C', 'skip link para o conteúdo', /Pular para o conteúdo/.test(radar));
checar('C', 'nenhuma imagem sem alt', !/<img(?![^>]*\balt=)/.test(radar));
const scripts = (radar.match(/<script/g) ?? []).length;
checar('C', 'no máximo 1 script na página (só o tema)', scripts <= 1, `tem ${scripts}`);
checar('C', 'nenhum recurso JS externo', !/<script[^>]+src=/.test(radar));

/* ------------------------------------------------------ C. contraste real */
titulo('C · Qualidade — contraste WCAG, calculado dos tokens');

const claro = tokensDo(tokensCss, ':root {');
const escuro = tokensDo(tokensCss, ':root[data-theme="dark"]');

for (const [tema, t] of [['claro', claro], ['escuro', escuro]]) {
  const fundo = t['--paper'];
  const alvos = [
    ['--ink', 4.5],
    ['--ink-muted', 4.5],
    ['--ink-faint', 3.0],
    ['--industria-ink', 4.5],
    ['--observatorio-ink', 4.5],
    ['--operacao-ink', 4.5],
    ['--edificacoes-ink', 4.5],
    ['--acento-ink', 4.5],
    ['--v-chega-ink', 4.5],
    ['--v-caminho-ink', 4.5],
    ['--v-nao-chega-ink', 4.5],
    ['--v-sem-efeito-ink', 4.5],
    ['--live', 3.0],
  ];
  for (const [token, minimo] of alvos) {
    if (!t[token] || !fundo) {
      avisar(`${tema}: ${token} não encontrado`, 'token pode estar fora do bloco esperado');
      continue;
    }
    const r = contraste(t[token], fundo);
    medidas[`contraste_${tema}_${token}`] = r.toFixed(2);
    checar('C', `${tema}: ${token} ≥ ${minimo}:1 sobre o papel`, r >= minimo, `medido ${r.toFixed(2)}:1`);
  }

  // A marca é SUPERFÍCIE, não texto: ela é o fundo da faixa do topo e do
  // rótulo de seção, com texto invertido em cima. Medi-la contra o papel
  // seria medir a coisa errada — foi o que o QA fez antes desta correção.
  // O botão de ação é preenchimento sólido com texto em cima: o alvo é o
  // texto SOBRE o laranja, não o laranja sobre o papel.
  if (t['--acao'] && t['--acao-texto']) {
    const ra = contraste(t['--acao-texto'], t['--acao']);
    medidas[`contraste_${tema}_texto-sobre-acao`] = ra.toFixed(2);
    checar('C', `${tema}: texto sobre o botão de ação ≥ 4.5:1`, ra >= 4.5, `medido ${ra.toFixed(2)}:1`);
  }

  if (t['--marca'] && t['--marca-texto']) {
    const rr = contraste(t['--marca-texto'], t['--marca']);
    medidas[`contraste_${tema}_texto-sobre-marca`] = rr.toFixed(2);
    checar('C', `${tema}: texto invertido sobre a faixa de marca ≥ 4.5:1`, rr >= 4.5, `medido ${rr.toFixed(2)}:1`);
  }
}

/* ---------------------------------------------- C. tokens órfãos no CSS */
titulo('C · Qualidade — integridade do sistema de design');

const cssTodo = css.corpo;
const definidos = new Set([...cssTodo.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
const usados = new Set([...cssTodo.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
const orfaos = [...usados].filter((t) => !definidos.has(t));
checar('C', 'nenhum var(--token) sem definição', orfaos.length === 0, orfaos.join(', '));

// Cor crua só pode aparecer na definição de um token (--algo: #hex).
// Em qualquer outra propriedade é valor solto, e valor solto é dívida.
const cruaForaDeToken = [...cssTodo.matchAll(/(?:^|;|\{)\s*([a-z-]+)\s*:\s*#[0-9a-f]{3,8}/gim)]
  .map((m) => m[1])
  .filter((prop) => !prop.startsWith('--'));
checar(
  'C',
  'nenhuma cor crua fora da definição de token',
  cruaForaDeToken.length === 0,
  cruaForaDeToken.join(', '),
);

/* ---------------------------------------------------------- C. desempenho */
titulo('C · Qualidade — peso e tempo');

checar('C', 'HTML do radar abaixo de 60 KB', medidas.htmlRadar < 60000, `${(medidas.htmlRadar / 1024).toFixed(1)} KB`);
checar('C', 'CSS abaixo de 40 KB', medidas.css < 40000, `${(medidas.css / 1024).toFixed(1)} KB`);
checar('C', 'radar responde em menos de 500 ms local', medidas.msRadar < 500, `${medidas.msRadar} ms`);
if (/fonts\.googleapis\.com/.test(radar)) {
  avisar('fontes vindas do Google', 'pendência conhecida: self-hosting antes do deploy (design/SISTEMA.md)');
}

/* ------------------------------------------------------------- C. coletor */
titulo('C · Qualidade — parser e canonicalização');
try {
  const saida = execFileSync('npm', ['test'], { cwd: RAIZ, encoding: 'utf8', shell: true });
  const m = /(\d+) ok · (\d+) falha/.exec(saida);
  checar('C', `suíte do coletor: ${m?.[1] ?? '?'} conferências`, m && m[2] === '0', saida.slice(-400));
  medidas.testesColetor = m?.[1];
} catch (e) {
  checar('C', 'suíte do coletor', false, String(e.stdout ?? e).slice(-500));
}

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
