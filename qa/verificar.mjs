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
const esperadas = ['assinante','assunto','correcao','custo_dia','evento','fonte','giro','glossario','item','obra'];
checar('B', `as ${esperadas.length} tabelas do modelo existem`, JSON.stringify(tabelas) === JSON.stringify(esperadas), tabelas.join(', '));

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
  // Conta por data-item, que existe nos TRÊS níveis (manchete, secundária,
  // linha). Contar por classe de um nível quebra a cada mudança de layout —
  // foi o que aconteceu quando o radar ganhou hierarquia.
  const listados = (r.corpo.match(/ data-item/g) ?? []).length;
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
// Os números subiram para o hero na v5; o teste procurava a marcação antiga.
const temNumeros = capa.corpo.includes('hero__num"');
const temAvisoSemBase = capa.corpo.includes('quando houver base para eles');
checar(
  'B',
  'a capa mostra números OU explica por que ainda não há',
  temNumeros !== temAvisoSemBase,
  'capa abrindo com zeros seria pior que capa sem faixa',
);
medidas.capaComNumeros = temNumeros ? 'sim' : 'ainda não';

/* ------------------------------------------------------ B. PAGINAÇÃO */
titulo('B · Conformidade — paginação e volume');

const POR_PAGINA_QA = 30;
const totalIndustria = sql(
  `SELECT COUNT(*) n FROM item WHERE nucleo='industria' AND status='publicado'`,
)[0].n;
const ultimaEsperada = Math.max(1, Math.ceil(totalIndustria / POR_PAGINA_QA));
medidas.itensIndustria = totalIndustria;
medidas.paginasIndustria = ultimaEsperada;

/**
 * A soma das páginas tem de dar o total.
 *
 * Item que não cabe em página nenhuma some do site sem ninguém notar: não dá
 * 404, não dá erro, simplesmente nunca é alcançável. Esta é a asserção que
 * pega isso.
 */
let somaPaginas = 0;
for (let n = 1; n <= ultimaEsperada; n++) {
  const r = await pegar(n === 1 ? '/industria' : `/industria?p=${n}`);
  checar('B', `página ${n} do radar responde`, r.status === 200, `veio ${r.status}`);
  somaPaginas += (r.corpo.match(/ data-item/g) ?? []).length;
  if (ultimaEsperada > 1) {
    checar(
      'B',
      `página ${n} tem canonical próprio`,
      n === 1
        ? r.corpo.includes('rel="canonical" href="http://localhost:8787/industria"')
        : r.corpo.includes(`p=${n}"`),
      'sem canonical próprio as páginas competem entre si na busca',
    );
  }
}
checar(
  'B',
  'a soma das páginas devolve TODOS os itens',
  somaPaginas === totalIndustria,
  `as páginas somam ${somaPaginas}, o banco tem ${totalIndustria} — a diferença é item inalcançável`,
);

const alemDoFim = await pegar(`/industria?p=${ultimaEsperada + 5}`);
checar(
  'B',
  'página além do fim devolve 404',
  alemDoFim.status === 404,
  'página fantasma vira espaço infinito para rastreador e soft-404 na busca',
);

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

/* ------------------------------------- B. GLOSSÁRIO, BLUEPRINTS E LISTA */
titulo('B · Conformidade — glossário, blueprints e lista');

const glossario2 = await pegar('/glossario');
const blue = await pegar('/blueprints');
checar('B', '/glossario responde', glossario2.status === 200, `veio ${glossario2.status}`);
checar('B', '/blueprints responde', blue.status === 200, `veio ${blue.status}`);

const gDb = sql(
  `SELECT SUM(CASE WHEN manter_original=0 THEN 1 ELSE 0 END) traduz,
          SUM(CASE WHEN manter_original=1 THEN 1 ELSE 0 END) mantem
     FROM glossario WHERE travado=1`,
)[0];
checar(
  'B',
  'o glossário publica as duas colunas com a contagem do banco',
  glossario2.corpo.includes(`Traduções travadas · ${gDb.traduz}`) &&
    glossario2.corpo.includes(`Não se traduzem · ${gDb.mantem}`),
);

/* ---- o inventário: a regra central exposta para conferência ---- */
const fontesDb = sql(`SELECT COUNT(*) n FROM fonte`)[0].n;
const linhasInv = (blue.corpo.match(/class="licenca licenca--/g) ?? []).length;
medidas.fontesNoInventario = linhasInv;
checar(
  'B',
  'o inventário publica TODAS as fontes',
  linhasInv === fontesDb,
  `publicou ${linhasInv}, existem ${fontesDb} — inventário incompleto é pior que inventário nenhum`,
);

const liberadasDb = sql(`SELECT COUNT(*) n FROM fonte WHERE licenca='liberada'`)[0].n;
const liberadasPag = (blue.corpo.match(/licenca--liberada/g) ?? []).length;
checar('B', 'as fontes liberadas aparecem como tal', liberadasPag === liberadasDb);
checar(
  'B',
  'toda fonte liberada mostra o link que autoriza',
  liberadasDb === 0 || blue.corpo.includes('>termos</a>'),
  'sem o link, o inventário vira "confie em nós" — que é justamente o que ele existe para não ser',
);
/* ---- robots.txt: a regra que decide quem entra no radar ---- */
/* A promessa publicada é "fonte que bloqueia robô não entra". Isso não é
   frase de página de método, é um invariante do banco — e aqui ele é medido.
   Se algum dia um item de fonte recusada aparecer, a página fica mentindo e
   o QA cai antes do deploy. */
const proibidos = sql(
  `SELECT COUNT(*) n FROM item i JOIN fonte f ON f.id = i.fonte_id
    WHERE f.robots_permite = 0`,
)[0].n;
checar(
  'B',
  'NENHUM item vem de fonte que o robots.txt recusa',
  proibidos === 0,
  `${proibidos} itens de fonte que pediu para não ser coletada — o /blueprints promete o contrário`,
);

const vereditos = (blue.corpo.match(/data-robots="/g) ?? []).length;
medidas.vereditosNoInventario = vereditos;
checar(
  'B',
  'o inventário publica o veredito do robots de TODA fonte',
  vereditos === fontesDb,
  `publicou ${vereditos} vereditos para ${fontesDb} fontes`,
);

const recusadasDb = sql(`SELECT COUNT(*) n FROM fonte WHERE robots_permite = 0`)[0].n;
checar(
  'B',
  'as fontes recusadas continuam listadas, dizendo que foram recusadas',
  (blue.corpo.match(/data-robots="não permite"/g) ?? []).length === recusadasDb,
  'esconder a fonte recusada esconderia exatamente o que o inventário existe para mostrar',
);
checar(
  'B',
  'e o texto do inventário confere com a contagem do banco',
  recusadasDb === 0 || blue.corpo.includes(`${recusadasDb} ${recusadasDb === 1 ? 'está' : 'estão'} fora do radar`),
);
checar(
  'B',
  'o método declara que NÃO contornamos bloqueio',
  blue.corpo.includes('sem proxy') && blue.corpo.includes('navegador disfarçado'),
  'a postura tem de estar escrita onde o leitor lê, não só no comentário do código',
);

const colheitaInvalida = sql(
  `SELECT COUNT(*) n FROM fonte WHERE colheita NOT IN ('feed','sitemap')`,
)[0].n;
checar(
  'B',
  'toda fonte tem um modo de colheita conhecido',
  colheitaInvalida === 0,
  'a migração 002 não pôde levar o CHECK do schema; esta asserção é a garantia no lugar dele',
);

/* Nenhuma fonte pode estar sendo coletada mais rápido do que pediu. O
   Crawl-delay vem em segundos e o nosso intervalo em minutos. */
const rapidoDemais = sql(
  `SELECT COUNT(*) n FROM fonte
    WHERE robots_atraso IS NOT NULL
      AND intervalo_min * 60 < robots_atraso`,
)[0].n;
checar(
  'B',
  'nenhuma fonte é coletada mais rápido do que o Crawl-delay dela pede',
  rapidoDemais === 0,
);

checar(
  'B',
  'o blueprints declara onde a IA NÃO decide',
  blue.corpo.includes('A IA nunca decide'),
);
checar(
  'B',
  'e diz que o dataset ainda não foi publicado',
  blue.corpo.includes('Ainda não publicado'),
  'publicar base vazia com DOI seria a única forma de estragá-la',
);

/* --------------------------------------------- B. O GIRO DA SEMANA ---- */
titulo('B · Conformidade — o Giro da Semana');

const giroLista = await pegar('/giro');
checar('B', '/giro responde', giroLista.status === 200, `veio ${giroLista.status}`);

const girosDb = sql(`SELECT slug, status FROM giro`);
const publicados = girosDb.filter((g) => g.status === 'publicado');
const naLista = (giroLista.corpo.match(/data-edicao="/g) ?? []).length;
medidas.girosPublicados = publicados.length;
checar(
  'B',
  'a lista traz todas as edições publicadas',
  naLista === publicados.length,
  `listou ${naLista}, existem ${publicados.length}`,
);

/* O cron do Giro mora em DOIS lugares que não se leem: `src/config.ts` e o
   `wrangler.toml`. Se alguém mudar o horário só no TOML, o disparo cai no
   ramo do coletor e o Giro simplesmente PARA DE SAIR — sem erro em lugar
   nenhum. Silêncio é o pior modo de falhar, e é este par que o produziria. */
const cronNoCodigo = /CRON_GIRO = '([^']+)'/.exec(readFileSync(join(RAIZ, 'src/config.ts'), 'utf8'))?.[1];
const cronNoToml = readFileSync(join(RAIZ, 'wrangler.toml'), 'utf8');
checar(
  'B',
  'o cron do Giro é o mesmo no código e no wrangler.toml',
  Boolean(cronNoCodigo) && cronNoToml.includes(`"${cronNoCodigo}"`),
  `código diz "${cronNoCodigo}" e o TOML não declara esse cron — o Giro pararia de sair em silêncio`,
);

/* A promessa central: edição publicada passou na auditoria. */
const semAuditoria = sql(
  `SELECT COUNT(*) n FROM giro WHERE status = 'publicado' AND auditoria IS NULL`,
)[0].n;
checar(
  'B',
  'toda edição publicada tem auditoria registrada',
  semAuditoria === 0,
  `${semAuditoria} edições no ar sem registro do que foi conferido`,
);
const retidoNoAr = sql(
  `SELECT COUNT(*) n FROM giro WHERE status = 'publicado' AND motivo_rascunho IS NOT NULL`,
)[0].n;
checar('B', 'nenhuma edição retida foi ao ar mesmo assim', retidoNoAr === 0);

if (publicados.length > 0) {
  const slug = publicados[0].slug;
  const ed = await pegar(`/giro/${slug}`);
  checar('B', `/giro/${slug} responde`, ed.status === 200, `veio ${ed.status}`);
  checar('B', 'edição inexistente devolve 404', (await pegar('/giro/1999-s01')).status === 404);

  const agregado = JSON.parse(
    sql(`SELECT agregado FROM giro WHERE slug = '${slug}'`)[0].agregado,
  );

  /* A página lê o agregado CONGELADO; se ela recalculasse, uma coleta nova
     mudaria uma edição já publicada — e balanço que se reescreve não é
     balanço. Conferir o número na tela contra o JSON gravado é o jeito de
     provar que ela não recalcula. */
  checar(
    'B',
    'os números da edição vêm do agregado congelado, não de nova consulta',
    ed.corpo.includes(`>${agregado.totais.itens}<`) &&
      ed.corpo.includes(`>${agregado.relogio.naoChegaram}<`),
  );

  const linhasPlacar = (ed.corpo.match(/data-placar="/g) ?? []).length;
  checar(
    'B',
    'o placar na tela tem as linhas que o agregado tem',
    linhasPlacar === agregado.placar.length,
    `tela ${linhasPlacar}, agregado ${agregado.placar.length}`,
  );

  /* O piso não é decoração: sem ele o critério de ineditismo elegeria
     sempre o assunto mais obscuro, porque quem ninguém cobriu tem, por
     definição, zero menção brasileira. */
  checar(
    'B',
    'nenhum assunto abaixo do piso entrou no placar',
    agregado.placar.every((c) => c.fontes >= 2),
  );
  checar(
    'B',
    'o destaque, quando existe, é o primeiro do placar',
    agregado.destaque === null ||
      agregado.destaque.assunto_id === agregado.placar[0]?.assunto_id,
  );
  checar(
    'B',
    'a página publica a fórmula que elegeu o destaque',
    ed.corpo.includes('cada fonte independente vale') && ed.corpo.includes('não chega'),
    'destaque sem a conta à vista é palpite com cara de método',
  );

  /* Uma voz prolífica engoliu a seção inteira na primeira execução real:
     doze linhas, um blog só. */
  const vozes = [...ed.corpo.matchAll(/data-voz="([^"]*)"/g)].map((m) => m[1]);
  const porPessoa = {};
  for (const v of vozes) porPessoa[v] = (porPessoa[v] ?? 0) + 1;
  medidas.vozesNaEdicao = vozes.length;
  checar(
    'B',
    'nenhuma voz aparece mais de duas vezes na edição',
    Object.values(porPessoa).every((n) => n <= 2),
    JSON.stringify(porPessoa),
  );

  checar('B', 'a edição está no sitemap', (await pegar('/sitemap.xml')).corpo.includes(`/giro/${slug}`));
}

checar(
  'B',
  'o Giro está na navegação de todas as páginas',
  giroLista.corpo.includes('href="/giro"'),
);

/* As vozes são um EIXO da fonte, não um tipo: `tipo` diz o meio, `pessoa`
   diz de quem é a assinatura. */
const vozesDb = sql(`SELECT COUNT(*) n FROM fonte WHERE pessoa IS NOT NULL`)[0].n;
medidas.vozesCadastradas = vozesDb;
checar(
  'B',
  'toda voz cadastrada declara o papel de quem assina',
  sql(`SELECT COUNT(*) n FROM fonte WHERE pessoa IS NOT NULL AND pessoa_papel IS NULL`)[0].n === 0,
  'voz sem papel vira nome solto na página — o leitor precisa saber por que aquela pessoa importa',
);
checar(
  'B',
  'o inventário identifica quais fontes são vozes',
  vozesDb === 0 || blue.corpo.includes('voz · '),
);

/* ---- a lista ---- */
const antes = sql(`SELECT COUNT(*) n FROM assinante`)[0].n;

async function postar(caminho, corpo) {
  return await fetch(BASE + caminho, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: corpo,
    redirect: 'manual',
  });
}

const rInvalido = await postar('/assinar', 'email=nao-e-email');
const depoisInvalido = sql(`SELECT COUNT(*) n FROM assinante`)[0].n;
checar('B', 'e-mail inválido não entra na lista', depoisInvalido === antes, `${depoisInvalido} vs ${antes}`);
checar('B', 'e o inválido não devolve erro cru', rInvalido.status === 303);

const rRobo = await postar('/assinar', 'email=robo.qa@exemplo.com&sitio=preenchido');
const depoisRobo = sql(`SELECT COUNT(*) n FROM assinante`)[0].n;
checar('B', 'honeypot não grava', depoisRobo === antes);
checar(
  'B',
  'e o robô recebe a MESMA resposta de quem acertou',
  rRobo.status === 303,
  'resposta diferente ensina o robô a contornar a armadilha',
);

const alvoQa = `qa.${Date.now()}@exemplo.com`;
const r1 = await postar('/assinar', `email=${encodeURIComponent(alvoQa.toUpperCase())}`);
const guardado = sql(`SELECT email FROM assinante WHERE email='${alvoQa}'`)[0];
checar('B', 'e-mail válido entra, normalizado em minúsculas', Boolean(guardado), alvoQa);

const r2 = await postar('/assinar', `email=${encodeURIComponent(alvoQa)}`);
checar(
  'B',
  'reenviar o mesmo e-mail responde IGUAL',
  r1.status === r2.status && r1.headers.get('location') === r2.headers.get('location'),
  'resposta diferente entregaria a terceiros quem está na lista',
);
sql(`DELETE FROM assinante WHERE email='${alvoQa}'`);

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
  /* `matchAll`, não `exec`: `npm test` roda MAIS DE UMA suíte (feed e
     robots) e cada uma imprime o próprio placar. Com `exec` o QA lia só a
     primeira e anunciava um número menor do que rodou — medição errada é
     pior que medição nenhuma, porque parece medição. */
  const placares = [...saida.matchAll(/(\d+) ok · (\d+) falha/g)];
  const passaram = placares.reduce((t, m) => t + Number(m[1]), 0);
  const quebraram = placares.reduce((t, m) => t + Number(m[2]), 0);
  checar(
    'C',
    `suíte do coletor: ${passaram} conferências em ${placares.length} suíte(s)`,
    placares.length >= 2 && quebraram === 0,
    placares.length < 2
      ? `só ${placares.length} suíte(s) reportou placar — alguma parou antes de imprimir`
      : saida.slice(-400),
  );
  medidas.testesColetor = passaram;
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
