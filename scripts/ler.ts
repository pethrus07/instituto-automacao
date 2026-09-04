/**
 * LER um artigo — o insumo do tempo 3 (ver docs/CONCEPCAO-V2.md).
 *
 *   npm run ler -- <url>
 *
 * Baixa UM artigo, confere o robots.txt daquele caminho (regra é por
 * caminho, não por domínio), tira navegação, rodapé, propaganda e script, e
 * devolve o texto legível. Salva em colheita/leituras/ para eu abrir e
 * escrever em cima.
 *
 * É leitura, não republicação: o texto fica na máquina, nunca vai para o
 * git nem para o site. O que vai para o site é o que EU escrevo depois de
 * ler — com crédito e link para isto aqui.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerRobots } from '../src/coletor/robots.ts';
import { slugificar } from '../src/coletor/url.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PASTA = join(RAIZ, 'colheita', 'leituras');
const UA =
  'InstitutoAutomacaoBot/0.2 (+https://institutoautomacao.com.br/transparencia; leitura editorial)';

const url = process.argv[2];
if (!url || !/^https?:\/\//.test(url)) {
  console.error('uso: npm run ler -- https://fonte.com/artigo');
  process.exit(1);
}

const rb = await lerRobots(url, UA);
if (rb.permite !== true) {
  console.error(`✗ o robots.txt não permite ler este caminho: ${rb.motivo}`);
  console.error('  Não contornamos. Se a fonte não quer ser lida por robô, a leitura é no navegador.');
  process.exit(2);
}
if (rb.atraso) await new Promise((r) => setTimeout(r, Math.min(rb.atraso! * 1000, 15_000)));

const r = await fetch(url, {
  headers: { 'user-agent': UA, accept: 'text/html' },
  signal: AbortSignal.timeout(30_000),
});
if (!r.ok) {
  console.error(`✗ HTTP ${r.status}`);
  process.exit(3);
}
const html = await r.text();

/* ------------------------------------------------------------ o extrator */

function decodificar(s: string): string {
  const ent: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (t, n) => ent[n.toLowerCase()] ?? t);
}

/**
 * Sem biblioteca de "readability": o que precisamos é tirar o que não é
 * texto e ficar com o bloco maior. Para artigo de imprensa técnica isso
 * acerta quase sempre, e quando erra a gente vê — o arquivo é para ser lido.
 */
function extrair(h: string): { titulo: string; texto: string } {
  const titulo = decodificar(/<title>([^<]+)<\/title>/i.exec(h)?.[1] ?? '').replace(/\s+/g, ' ').trim();

  let corpo = h
    .replace(/<(script|style|nav|header|footer|aside|form|svg|noscript|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const bloco = /<article\b[\s\S]*?<\/article>/i.exec(corpo)?.[0] ?? /<main\b[\s\S]*?<\/main>/i.exec(corpo)?.[0];
  if (bloco) corpo = bloco;

  const texto = decodificar(
    corpo
      .replace(/<\/(p|h[1-6]|li|blockquote|div|section|figcaption)>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<(h[1-6])\b[^>]*>/gi, '\n\n## ')
      .replace(/<li\b[^>]*>/gi, '\n- ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { titulo, texto };
}

const { titulo, texto } = extrair(html);
const nome = slugificar(titulo || url, 60) || 'artigo';
mkdirSync(PASTA, { recursive: true });
const arquivo = join(PASTA, `${new Date().toISOString().slice(0, 10)}-${nome}.md`);

writeFileSync(
  arquivo,
  `# ${titulo}\n\n<${url}>\n\nLido em ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ` +
    `${texto.split(/\s+/).length} palavras · robots: ${rb.motivo}\n\n---\n\n${texto}\n`,
  'utf8',
);

console.log(`✓ ${titulo}`);
console.log(`  ${texto.split(/\s+/).length} palavras · robots: ${rb.motivo}`);
console.log(`→ ${arquivo.replace(RAIZ, '.')}`);
