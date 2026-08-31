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

const rotas = [
  ['/', 200],
  ['/industria', 200],
  ['/observatorio', 200],
  ['/operacao', 200],
  ['/edificacoes', 200],
  ['/agenda', 200],
  ['/saude', 200],
  ['/industria/controladores-diagnostico-preditivo-no-clp', 200],
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
checar(
  'A',
  'item tem s-maxage de 1 h',
  respostas['/industria/controladores-diagnostico-preditivo-no-clp'].cab['cache-control'] ===
    'public, max-age=0, s-maxage=3600',
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

const paginaItem = respostas['/industria/controladores-diagnostico-preditivo-no-clp'].corpo;
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

/* --------------------------------------------------------- C. QUALIDADE */
titulo('C · Qualidade — semântica e acessibilidade (medidas no HTML)');

for (const [caminho, html] of [['/', respostas['/'].corpo], ['/industria', radar], ['/industria/…', paginaItem]]) {
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

const tokensCss = readFileSync(join(RAIZ, 'design', 'tokens.css'), 'utf8');
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
