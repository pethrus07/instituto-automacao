/**
 * REAGRUPAR — reconstrói `assunto` a partir dos itens já guardados.
 *
 *   npm run reagrupar -- --homolog            mostra o que mudaria (não grava)
 *   npm run reagrupar -- --homolog --aplicar  grava
 *
 * ---------------------------------------------------------------------------
 * POR QUE ISTO EXISTE
 *
 * O agrupamento velho casava título inteiro e por isso nunca formava par: 0
 * atrasos apurados em toda a vida do projeto. O conserto está em
 * src/coletor/assunto.ts e vale para o que chegar daqui em diante — mas a base
 * de 2026 ficaria para trás.
 *
 * Ela não precisa ficar. A tabela `item` guarda título, data, idioma, fonte e
 * URL de tudo o que foi colhido; `assunto` é DERIVADO. Só a derivação estava
 * errada, então dá para refazê-la sobre o histórico inteiro — e o relógio
 * passa a medir retroativamente desde o primeiro dia de coleta contínua.
 *
 * É a diferença entre chegar em dezembro com três meses de atraso MEDIDO e
 * chegar com três meses de links coletados.
 *
 * ---------------------------------------------------------------------------
 * COMO AGRUPA (e por que não é igualzinho ao cron)
 *
 * O cron mede a raridade de um token contra os assuntos que existem NAQUELE
 * instante. Aqui o corpus inteiro já está na mão, então a raridade é medida
 * uma vez sobre todos os itens, antes de agrupar.
 *
 * É de propósito e é melhor: refazer a partida com o corpus vazio reproduziria
 * o "começo frio", em que os primeiros itens não têm com que comparar e
 * qualquer token parece raro — exatamente onde o agrupamento erra mais. O
 * resultado é estável e reproduzível: mesmo banco, mesmo agrupamento.
 *
 * ⚠️ Não inventa dado. Só reescreve `assunto`, `assunto_token` e
 * `item.assunto_id`. Item, fonte, evento, contato e lista não são tocados.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  melhorCandidato,
  nomesDe,
  podeAncorarOriginal,
  raros,
  tokensDe,
  type Candidato,
  type Token,
} from '../src/coletor/assunto.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);

const BANCOS = {
  local: { nome: 'instituto', args: ['--local'], rotulo: 'D1 local' },
  homolog: { nome: 'instituto-homolog', args: ['--remote', '--env', 'homolog'], rotulo: 'D1 da homologação' },
  producao: { nome: 'instituto', args: ['--remote'], rotulo: 'D1 de produção' },
} as const;
const qual = flag('producao') ? 'producao' : flag('homolog') ? 'homolog' : 'local';
const BANCO = BANCOS[qual];
const APLICAR = flag('aplicar');

function sql<T = Record<string, unknown>>(comando: string): T[] {
  const saida = execFileSync(
    process.execPath,
    [WRANGLER, 'd1', 'execute', BANCO.nome, ...BANCO.args, '--json', '--command', comando.replace(/\s+/g, ' ')],
    { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 },
  );
  return JSON.parse(saida.slice(saida.indexOf('[')))[0]?.results ?? [];
}

console.log(`· banco: ${BANCO.rotulo}${APLICAR ? '' : '  (ensaio — nada será gravado)'}`);

/* ----------------------------------------------------------------- 1 · ler */

type Linha = {
  id: string;
  titulo: string;
  idioma: string;
  publicado_fonte: string;
  fonte_id: string;
  tipo: string;
  nucleo: string | null;
};

/* Só fonte ATIVA: fonte desativada não deve marcar o relógio de nada, e
   incluí-la mudaria a medida conforme alguém liga e desliga fonte. */
const itens = sql<Linha>(
  `SELECT i.id, i.titulo, i.idioma, i.publicado_fonte, i.fonte_id, f.tipo, f.nucleo
     FROM item i JOIN fonte f ON f.id = i.fonte_id
    WHERE f.ativo = 1
    ORDER BY i.publicado_fonte ASC, i.id ASC`,
);
if (itens.length === 0) {
  console.error('✗ nenhum item — banco errado? tente --homolog');
  process.exit(1);
}
console.log(`· ${itens.length} itens lidos`);

/* -------------------------------------------------- 2 · raridade no corpus */

const tokensPorItem = new Map<string, Token[]>();
const df = new Map<string, number>();
for (const it of itens) {
  const t = tokensDe(it.titulo);
  tokensPorItem.set(it.id, t);
  for (const tok of t) df.set(tok.token, (df.get(tok.token) ?? 0) + 1);
}
const maisComuns = [...df].sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log(`· ${df.size} tokens distintos · mais comuns: ${maisComuns.map(([t, n]) => `${t}(${n})`).join(' ')}`);

/* ------------------------------------------------------------ 3 · agrupar */

type Assunto = {
  id: string;
  rotulo: string;
  nucleo: string;
  tokens: Map<string, boolean>;
  itens: string[];
  inicio: string;
  publicado_original: string | null;
  fonte_original: string | null;
  primeira_mencao_br: string | null;
  fonte_br: string | null;
};

const assuntos: Assunto[] = [];
const porToken = new Map<string, Assunto[]>();
const JANELA_MS = 30 * 86_400_000;
const quando = (s: string) => Date.parse(s) || 0;

for (const it of itens) {
  const tokens = tokensPorItem.get(it.id)!;
  if (tokens.length === 0) continue;

  const tokensRaros = raros(tokens, df, itens.length);

  /* candidatos: assuntos que compartilham token raro e estão na janela */
  const vistos = new Map<Assunto, Token[]>();
  for (const tok of tokensRaros) {
    for (const a of porToken.get(tok.token) ?? []) {
      if (quando(it.publicado_fonte) - quando(a.inicio) > JANELA_MS) continue;
      /* forte se qualquer um dos dois lados viu o token como nome */
      const t: Token = { token: tok.token, forte: tok.forte || a.tokens.get(tok.token) === true };
      const lista = vistos.get(a);
      if (lista) lista.push(t);
      else vistos.set(a, [t]);
    }
  }
  const candidatos: Candidato[] = [...vistos].map(([a, toks]) => ({ assuntoId: a.id, tokensEmComum: toks }));
  const escolhido = melhorCandidato(candidatos, df);

  const ehBR = it.idioma === 'pt';
  const ancora = podeAncorarOriginal(it.tipo);

  if (!escolhido) {
    const novo: Assunto = {
      id: `a-${it.id.slice(0, 16)}`,
      rotulo: it.titulo.slice(0, 300),
      nucleo: it.nucleo ?? 'industria',
      tokens: new Map(tokens.map((t) => [t.token, t.forte])),
      itens: [it.id],
      inicio: it.publicado_fonte,
      publicado_original: !ehBR && ancora ? it.publicado_fonte : null,
      fonte_original: !ehBR && ancora ? it.fonte_id : null,
      primeira_mencao_br: ehBR ? it.publicado_fonte : null,
      fonte_br: ehBR ? it.fonte_id : null,
    };
    assuntos.push(novo);
    for (const tok of tokens) {
      const l = porToken.get(tok.token);
      if (l) l.push(novo);
      else porToken.set(tok.token, [novo]);
    }
    continue;
  }

  const a = assuntos.find((x) => x.id === escolhido.assuntoId)!;
  a.itens.push(it.id);
  /* herda só os raros, para o assunto não virar ímã (mesma regra do cron) */
  for (const tok of tokensRaros) {
    if (a.tokens.has(tok.token)) {
      if (tok.forte) a.tokens.set(tok.token, true);
      continue;
    }
    a.tokens.set(tok.token, tok.forte);
    const l = porToken.get(tok.token);
    if (l) l.push(a);
    else porToken.set(tok.token, [a]);
  }
  if (!ehBR && ancora && (!a.publicado_original || it.publicado_fonte < a.publicado_original)) {
    a.publicado_original = it.publicado_fonte;
    a.fonte_original = it.fonte_id;
  }
  if (ehBR && !a.primeira_mencao_br) {
    a.primeira_mencao_br = it.publicado_fonte;
    a.fonte_br = it.fonte_id;
  }
}

/* ------------------------------------------------------------- 4 · medir */

const dias = (de: string, ate: string) => Math.round((quando(ate) - quando(de)) / 86_400_000);

const medidos = assuntos.filter(
  (a) => a.publicado_original && a.primeira_mencao_br && quando(a.primeira_mencao_br) >= quando(a.publicado_original),
);
const atrasos = medidos.map((a) => dias(a.publicado_original!, a.primeira_mencao_br!)).sort((x, y) => x - y);
const mediana = atrasos.length ? atrasos[Math.floor(atrasos.length / 2)] : null;
const comMais = assuntos.filter((a) => a.itens.length > 1);

console.log('');
console.log(`  assuntos ............... ${assuntos.length}  (eram ${itens.length} itens)`);
console.log(`  com mais de um item .... ${comMais.length}`);
console.log(`  maior grupo ............ ${Math.max(...assuntos.map((a) => a.itens.length))} itens`);
console.log(`  ATRASOS APURADOS ....... ${medidos.length}`);
console.log(`  atraso mediano ......... ${mediana ?? '—'}${mediana !== null ? ' dias' : ''}`);
if (atrasos.length) console.log(`  faixa .................. ${atrasos[0]} a ${atrasos[atrasos.length - 1]} dias`);

if (medidos.length) {
  console.log('\n  os pares medidos:');
  for (const a of medidos.slice(0, 12)) {
    console.log(`    ${String(dias(a.publicado_original!, a.primeira_mencao_br!)).padStart(3)}d · ${a.rotulo.slice(0, 82)}`);
  }
}

/* ------------------------------------------------------------ 5 · gravar */

const esc = (v: string | null) => (v === null ? 'NULL' : `'${v.replace(/'/g, "''")}'`);

const l: string[] = [];
l.push('-- Gerado por scripts/reagrupar.ts · NÃO editar à mão.');
l.push(`-- ${new Date().toISOString()} · ${BANCO.rotulo} · ${itens.length} itens → ${assuntos.length} assuntos`);
l.push('UPDATE item SET assunto_id = NULL;');
l.push('DELETE FROM assunto_token;');
l.push('DELETE FROM assunto;');

for (const lote of pedacos(assuntos, 100)) {
  const vals = lote.map((a) => {
    const atraso =
      a.publicado_original && a.primeira_mencao_br && quando(a.primeira_mencao_br) >= quando(a.publicado_original)
        ? String(dias(a.publicado_original, a.primeira_mencao_br))
        : 'NULL';
    const apurado = atraso === 'NULL' ? 'NULL' : esc(a.primeira_mencao_br);
    return `(${esc(a.id)},${esc(a.rotulo)},${esc([...a.tokens.keys()].sort().join('-').slice(0, 200))},${esc(a.nucleo)},${esc(a.publicado_original)},${esc(a.fonte_original)},${esc(a.primeira_mencao_br)},${esc(a.fonte_br)},${atraso},${apurado},${a.itens.length},${esc(a.inicio)})`;
  });
  l.push(
    `INSERT INTO assunto (id,rotulo,chave,nucleo,publicado_original,fonte_original,primeira_mencao_br,fonte_br,atraso_br_dias,atraso_apurado_em,qtd_itens,criado_em) VALUES ${vals.join(',')};`,
  );
}

const pares: string[] = [];
for (const a of assuntos) for (const [t, forte] of a.tokens) pares.push(`(${esc(t)},${forte ? 1 : 0},${esc(a.id)})`);
for (const lote of pedacos(pares, 300)) {
  l.push(`INSERT OR IGNORE INTO assunto_token (token,forte,assunto_id) VALUES ${lote.join(',')};`);
}

for (const a of assuntos) {
  for (const lote of pedacos(a.itens, 200)) {
    l.push(`UPDATE item SET assunto_id=${esc(a.id)} WHERE id IN (${lote.map(esc).join(',')});`);
  }
}

function pedacos<T>(arr: readonly T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const pasta = join(RAIZ, 'colheita');
mkdirSync(pasta, { recursive: true });
const arquivo = join(pasta, `reagrupar-${qual}.sql`);
writeFileSync(arquivo, l.join('\n'), 'utf8');
console.log(`\n→ ${arquivo.replace(RAIZ, '.')}  (${l.length} comandos)`);

if (!APLICAR) {
  console.log('\n· ensaio: nada foi gravado. Para valer:');
  console.log(`    npm run reagrupar -- --${qual} --aplicar`);
  process.exit(0);
}

console.log('\n· aplicando...');
execFileSync(
  process.execPath,
  [WRANGLER, 'd1', 'execute', BANCO.nome, ...BANCO.args, '--file', arquivo, '--yes'],
  { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'], maxBuffer: 256 * 1024 * 1024 },
);
console.log('\n✓ reagrupado.');
