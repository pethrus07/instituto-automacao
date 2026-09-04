/**
 * NOVA peça — cria o arquivo com o frontmatter já preenchido.
 *
 *   npm run nova -- noticias skild-ai-s1 --url https://therobotreport.com/...
 *   npm run nova -- relatorios quanto-custa-automatizar-uma-retifica
 *   npm run nova -- giro 2026-s36
 *
 * Se a URL estiver na pauta (colheita/pendentes.json), o título, a fonte, o
 * idioma e a data de publicação vêm de lá — é o elo entre o tempo 2 (você
 * escolheu) e o tempo 3 (eu escrevo). O que o compilador vai exigir já está
 * no arquivo, marcado, para ninguém esquecer.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECOES, type Secao } from '../src/conteudo/tipos.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const secao = args[0] as Secao | undefined;
const slug = args[1];
const iUrl = args.indexOf('--url');
const url = iUrl >= 0 ? args[iUrl + 1] : undefined;

if (!secao || !SECOES.includes(secao) || !slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('uso: npm run nova -- <noticias|relatorios|giro> <slug-em-minusculas> [--url <url da fonte>]');
  process.exit(1);
}

const hoje = new Date().toISOString().slice(0, 10);
const pasta = join(RAIZ, 'conteudo', secao);
const arquivo = join(pasta, `${hoje}-${slug}.md`);
if (existsSync(arquivo)) {
  console.error(`✗ já existe: ${arquivo.replace(RAIZ, '.')}`);
  process.exit(2);
}

/* Da pauta, se houver. */
type Pendente = { titulo: string; fonte: string; idioma: string; publicado: string | null; pessoa: string | null };
let daPauta: Pendente | null = null;
if (url) {
  try {
    const pend = JSON.parse(readFileSync(join(RAIZ, 'colheita', 'pendentes.json'), 'utf8')) as Record<string, Pendente>;
    daPauta = pend[url] ?? Object.entries(pend).find(([u]) => u.replace(/\/$/, '') === url.replace(/\/$/, ''))?.[1] ?? null;
  } catch {
    /* sem pauta, sem problema — os campos ficam para preencher */
  }
}

const frontmatter: string[] = ['---'];
frontmatter.push(`titulo:    ${daPauta ? `"${daPauta.titulo.replace(/"/g, "'")}"` : 'PREENCHER — o título em português'}`);
frontmatter.push(`secao:     ${secao}`);
frontmatter.push(`tema:      industria            # industria | processos`);
frontmatter.push(
  `formato:   ${secao === 'noticias' ? 'curta                # curta | contexto' : secao === 'relatorios' ? 'caso                 # caso | analise | panorama' : 'giro'}`,
);
if (secao === 'noticias') {
  frontmatter.push(`veredito:  PREENCHER            # chega | a_caminho | nao_chega | sem_efeito`);
}
frontmatter.push(`lead:      PREENCHER — uma frase que faça o leitor querer a segunda`);
frontmatter.push(`autor:     Pedro Oliveira`);
frontmatter.push(`data:      ${hoje}`);
if (secao === 'noticias') {
  frontmatter.push('fonte:');
  frontmatter.push(`  nome:      ${daPauta ? (daPauta.pessoa ?? daPauta.fonte) : 'PREENCHER'}`);
  frontmatter.push(`  url:       ${url ?? 'PREENCHER'}`);
  frontmatter.push(`  idioma:    ${daPauta?.idioma ?? 'en'}`);
  if (daPauta?.publicado) frontmatter.push(`  publicado: ${daPauta.publicado.slice(0, 10)}`);
}
frontmatter.push(`# arte:    ${hoje}-${slug}.svg   # opcional; o arquivo tem de existir em conteudo/arte/`);
frontmatter.push('---');
frontmatter.push('');
frontmatter.push(
  secao === 'noticias'
    ? 'O texto começa aqui. Notícia curta: fato, consequência técnica, ponto. Com contexto: o fato e o que ele muda para quem opera no Brasil.'
    : secao === 'relatorios'
      ? 'Comece pela tese. Use o dado como evidência. Título de seção com ## quando precisar.'
      : 'A semana que fechou: o que aconteceu, o que importou, o que ficou de fora e por quê.',
);
frontmatter.push('');

mkdirSync(pasta, { recursive: true });
writeFileSync(arquivo, frontmatter.join('\n'), 'utf8');

console.log(`✓ ${arquivo.replace(RAIZ, '.')}`);
if (daPauta) console.log(`  preenchido da pauta: ${daPauta.fonte} · ${daPauta.publicado?.slice(0, 10) ?? 'sem data'}`);
console.log('  depois de escrever: npm run compilar');
