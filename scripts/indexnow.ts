/**
 * Avisa os buscadores do IndexNow (Bing, Yandex, Seznam, Naver — e quem lê o
 * índice do Bing, como o DuckDuckGo) de que há página nova ou mudada.
 *
 *   node --experimental-strip-types scripts/indexnow.ts <sha-antes> <sha-depois>
 *
 * Roda no fim do .github/workflows/publicar.yml, DEPOIS do deploy: avisar de
 * página que ainda não está no ar faz o robô bater num 404. Lê do git quais
 * textos de conteudo/ mudaram entre os dois commits e manda as URLs deles, a
 * capa e as listagens. O Google não usa IndexNow; para ele valem o Search
 * Console e o /sitemap-noticias.xml (16/10/2026).
 *
 * Falha de aviso não derruba a publicação: o site já está no ar, e o
 * buscador acaba passando pelo sitemap de qualquer jeito.
 */
import { execFileSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INDEXNOW_CHAVE } from '../src/ui/seo.ts';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://institutoautomacao.com.br';
const [antes, depois = 'HEAD'] = process.argv.slice(2);

let arquivos: string[] = [];
if (antes && !/^0+$/.test(antes)) {
  try {
    arquivos = execFileSync('git', ['diff', '--name-only', antes, depois, '--', 'conteudo'], { cwd: RAIZ, encoding: 'utf8' })
      .split('\n')
      .filter((f) => /^conteudo\/(noticias|artigos|relatorios|giro)\/\d{4}-\d{2}-\d{2}-.+\.md$/.test(f));
  } catch (e) {
    console.log(`· não consegui ler o diff (${(e as Error).message.slice(0, 80)}); aviso só a capa`);
  }
}

/* O endereço de cada texto é /<seção>/<slug>, e o arquivo é <data>-<slug>.md. */
const urls = new Set<string>([`${SITE}/`, `${SITE}/noticias`]);
for (const f of arquivos) {
  const secao = f.split('/')[1]!;
  const slug = basename(f, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, '');
  urls.add(`${SITE}/${secao}/${slug}`);
}

const corpo = {
  host: new URL(SITE).host,
  key: INDEXNOW_CHAVE,
  keyLocation: `${SITE}/${INDEXNOW_CHAVE}.txt`,
  urlList: [...urls],
};

try {
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(30_000),
  });
  // 200 = recebido; 202 = recebido, chave ainda em conferência
  console.log(`IndexNow respondeu ${r.status} para ${corpo.urlList.length} endereço(s):`);
  for (const u of corpo.urlList) console.log(`  ${u}`);
} catch (e) {
  console.log(`· IndexNow não respondeu (${(e as Error).message}) — o sitemap cobre`);
}
