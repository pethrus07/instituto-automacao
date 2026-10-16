/**
 * O que não é página: o CSS com hash, o favicon, a saúde, os feeds, o
 * sitemap e o robots.
 */
import { CSS, CSS_ARTIGO, CSS_ESCREVER, CSS_HASH, CSS_ROTA } from '../estilo';
import { favicon } from '../ui/marca';
import { pautaDoDia, saudeColeta } from '../db';
import { todas, SECOES, type Secao } from '../conteudo';
import { feed, robots, sitemap, sitemapNoticias } from '../feed';
import { GOOGLE_ARQUIVO, INDEXNOW_CHAVE } from '../ui/seo';
import { CACHE } from '../config';
import { novaApp } from './app';

const ehSecao = (v: string): v is Secao => (SECOES as readonly string[]).includes(v);

export const estatico = novaApp();

estatico.get('/a/:arquivo', (c) => {
  const arquivo = c.req.param('arquivo');
  if (!arquivo.endsWith('.css')) return c.notFound();
  c.header('Content-Type', 'text/css; charset=utf-8');
  c.header('Cache-Control', CACHE.estatico);
  return c.body(arquivo.startsWith('escrever-') ? CSS_ESCREVER : arquivo.startsWith('artigo-') ? CSS_ARTIGO : CSS);
});

estatico.get('/favicon.svg', (c) => {
  c.header('Content-Type', 'image/svg+xml; charset=utf-8');
  c.header('Cache-Control', CACHE.estatico);
  return c.body(favicon());
});

estatico.get('/saude', async (c) => {
  const t0 = Date.now();
  let db = 'ok';
  let coleta: { ultima: string | null; horas: number | null } = { ultima: null, horas: null };
  try {
    coleta = await saudeColeta(c.env.DB);
  } catch (e) {
    db = `erro: ${(e as Error).message}`;
  }
  // a data da notícia mais recente: o vigia alarma se a redação automática parar (14/10/2026)
  const ultimaNoticia = todas().find((p) => p.secao === 'noticias')?.data ?? null;
  return c.json({ ok: db === 'ok', ambiente: c.env.HOMOLOG === '1' ? 'homologacao' : 'producao', db, pecas: todas().length, ultima_noticia: ultimaNoticia, coleta, css: CSS_HASH, rota_css: CSS_ROTA, ms: Date.now() - t0 });
});

/* A pauta do dia, aberta: o que a redação automática lê para escolher o que
   vira notícia (14/10/2026). Nada aqui é privado — é a mesma matéria-prima de
   "Lá fora" na capa, com a contagem de fontes ao lado. */
estatico.get('/pauta.json', async (c) => {
  c.header('Cache-Control', CACHE.listagem);
  const dias = Math.min(14, Math.max(1, Number(c.req.query('dias') ?? 7) || 7));
  return c.json({ gerado: new Date().toISOString(), dias, itens: await pautaDoDia(c.env.DB, dias) });
});

/* --------------------------------------------------------- distribuição */

estatico.get('/feed.xml', (c) => {
  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  c.header('Cache-Control', CACHE.listagem);
  return c.body(feed(c.env));
});

estatico.get('/feed/:arquivo', (c) => {
  const nome = c.req.param('arquivo').replace(/\.xml$/, '');
  if (!ehSecao(nome)) {
    // os quatro feeds de núcleo da v1 continuam sendo pedidos por leitor de feed
    if (['industria', 'observatorio', 'operacao', 'edificacoes'].includes(nome)) return c.redirect('/feed.xml', 301);
    return c.notFound();
  }
  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  c.header('Cache-Control', CACHE.listagem);
  return c.body(feed(c.env, nome));
});

estatico.get('/sitemap.xml', async (c) => {
  c.header('Content-Type', 'application/xml; charset=utf-8');
  c.header('Cache-Control', CACHE.listagem);
  return c.body(await sitemap(c.env));
});

estatico.get('/sitemap-noticias.xml', (c) => {
  c.header('Content-Type', 'application/xml; charset=utf-8');
  c.header('Cache-Control', CACHE.listagem);
  return c.body(sitemapNoticias(c.env));
});

// Search Console: o Google confere que o site é nosso lendo este arquivo
estatico.get(`/${GOOGLE_ARQUIVO}`, (c) => {
  c.header('Content-Type', 'text/html; charset=utf-8');
  return c.body(`google-site-verification: ${GOOGLE_ARQUIVO}`);
});

// IndexNow: o buscador confere que o aviso é nosso lendo a chave aqui
estatico.get(`/${INDEXNOW_CHAVE}.txt`, (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8');
  return c.body(INDEXNOW_CHAVE);
});

estatico.get('/robots.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8');
  c.header('Cache-Control', CACHE.listagem);
  return c.body(robots(c.env));
});
