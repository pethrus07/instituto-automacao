/**
 * Sonda candidatos a fonte.
 *
 *   npm run sondar
 *
 * Para cada URL: busca, mede, e passa pelo NOSSO parser. Serve a dois
 * propósitos de uma vez — descobre quais feeds existem de verdade e exercita
 * o parser contra XML do mundo real, que é onde ele quebra.
 *
 * ⚠️ Isto NÃO classifica licença. Toda fonte que entrar no banco a partir
 * daqui nasce como `resumo`, e só sobe para `liberada` depois que uma pessoa
 * ler os termos e gravar o link que autoriza. Sonda mede se o feed responde;
 * não mede permissão.
 */
import { lerFeed } from '../src/coletor/feed.ts';
import { canonicalizar } from '../src/coletor/url.ts';

type Candidato = {
  nome: string;
  url: string;
  tipo: 'press' | 'imprensa' | 'associacao' | 'academico' | 'social' | 'forum' | 'video' | 'release';
  idioma: string;
  pais: string;
  nucleo: string;
  /** 1 = fonte brasileira que existe para medir quando o assunto chegou aqui */
  relogio?: boolean;
  termos?: string;
};

const CANDIDATOS: Candidato[] = [
  /* --- salas de imprensa de fabricante: onde mora o "primeira mão" --- */
  { nome: 'Siemens Press', url: 'https://press.siemens.com/global/en/rss.xml', tipo: 'press', idioma: 'en', pais: 'DE', nucleo: 'industria' },
  { nome: 'ABB News', url: 'https://new.abb.com/news/rss', tipo: 'press', idioma: 'en', pais: 'CH', nucleo: 'industria' },
  { nome: 'Beckhoff News', url: 'https://www.beckhoff.com/pt-br/rss/news.xml', tipo: 'press', idioma: 'en', pais: 'DE', nucleo: 'industria' },
  { nome: 'Universal Robots', url: 'https://www.universal-robots.com/blog/rss/', tipo: 'press', idioma: 'en', pais: 'DK', nucleo: 'industria' },
  { nome: 'KUKA News', url: 'https://www.kuka.com/rss/news', tipo: 'press', idioma: 'en', pais: 'DE', nucleo: 'industria' },
  { nome: 'Omron Industrial', url: 'https://industrial.omron.eu/en/news-events/rss', tipo: 'press', idioma: 'en', pais: 'JP', nucleo: 'industria' },
  { nome: 'Schneider Electric', url: 'https://www.se.com/ww/en/rss/news.xml', tipo: 'press', idioma: 'en', pais: 'FR', nucleo: 'industria' },
  { nome: 'WEG', url: 'https://www.weg.net/institutional/BR/pt/rss', tipo: 'press', idioma: 'pt', pais: 'BR', nucleo: 'industria', relogio: true },

  /* --- imprensa técnica: só resumo próprio, nunca tradução --- */
  { nome: 'The Robot Report', url: 'https://www.therobotreport.com/feed/', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { nome: 'Control Engineering', url: 'https://www.controleng.com/feed/', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { nome: 'Automation World', url: 'https://www.automationworld.com/rss/all', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { nome: 'IEEE Spectrum · Robótica', url: 'https://spectrum.ieee.org/feeds/topic/robotics.rss', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { nome: 'IEEE Spectrum · IA', url: 'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'observatorio' },
  { nome: 'heise online', url: 'https://www.heise.de/rss/heise-atom.xml', tipo: 'imprensa', idioma: 'de', pais: 'DE', nucleo: 'observatorio' },
  { nome: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'observatorio' },
  { nome: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'observatorio' },

  /* --- brasileiras: marcam o relógio, quase nunca são publicadas --- */
  { nome: 'Olhar Digital', url: 'https://olhardigital.com.br/feed/', tipo: 'imprensa', idioma: 'pt', pais: 'BR', nucleo: 'observatorio', relogio: true },
  { nome: 'Tecnoblog', url: 'https://tecnoblog.net/feed/', tipo: 'imprensa', idioma: 'pt', pais: 'BR', nucleo: 'observatorio', relogio: true },
  { nome: 'Canaltech', url: 'https://canaltech.com.br/rss/', tipo: 'imprensa', idioma: 'pt', pais: 'BR', nucleo: 'observatorio', relogio: true },
  { nome: 'ABIMAQ', url: 'https://www.abimaq.org.br/rss', tipo: 'associacao', idioma: 'pt', pais: 'BR', nucleo: 'industria', relogio: true },

  /* --- operação e edificações --- */
  { nome: 'n8n Blog', url: 'https://blog.n8n.io/rss/', tipo: 'press', idioma: 'en', pais: 'DE', nucleo: 'operacao' },
  { nome: 'Home Assistant', url: 'https://www.home-assistant.io/atom.xml', tipo: 'press', idioma: 'en', pais: 'US', nucleo: 'edificacoes' },

  /* =====================================================================
     EXPANSÃO — rede social, fórum, artigo, vídeo e release.

     A descoberta que muda o plano: quase tudo isso É RSS. Reddit, Mastodon,
     arXiv, YouTube, GitHub e fórum Discourse publicam feed nativo, então o
     coletor que já existe serve sem uma linha nova.

     As exceções são X/Twitter e LinkedIn: nenhum dos dois tem feed público,
     e a API do X é paga. Sondados aqui para o "não dá" ficar medido em vez
     de suposto.
     ===================================================================== */

  /* fórum — onde o problema aparece antes da notícia */
  { nome: 'Reddit · PLC', url: 'https://www.reddit.com/r/PLC/.rss', tipo: 'forum', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { nome: 'Reddit · Robótica', url: 'https://www.reddit.com/r/robotics/.rss', tipo: 'forum', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { nome: 'Reddit · Automação industrial', url: 'https://www.reddit.com/r/IndustrialAutomation/.rss', tipo: 'forum', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { nome: 'Fórum Home Assistant', url: 'https://community.home-assistant.io/latest.rss', tipo: 'forum', idioma: 'en', pais: 'US', nucleo: 'edificacoes' },
  { nome: 'Hacker News · automação', url: 'https://hnrss.org/newest?q=industrial+automation&points=20', tipo: 'forum', idioma: 'en', pais: 'US', nucleo: 'observatorio' },

  /* artigo acadêmico — a ponte com a universidade */
  { nome: 'arXiv · Sistemas e Controle', url: 'https://rss.arxiv.org/rss/eess.SY', tipo: 'academico', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { nome: 'arXiv · Robótica', url: 'https://rss.arxiv.org/rss/cs.RO', tipo: 'academico', idioma: 'en', pais: 'US', nucleo: 'industria' },

  /* rede social aberta — Mastodon dá RSS por conta, sem autenticação */
  { nome: 'Mastodon · fosstodon tag automation', url: 'https://fosstodon.org/tags/automation.rss', tipo: 'social', idioma: 'en', pais: 'US', nucleo: 'operacao' },
  { nome: 'Mastodon · ioc.exchange tag robotics', url: 'https://ioc.exchange/tags/robotics.rss', tipo: 'social', idioma: 'en', pais: 'US', nucleo: 'industria' },

  /* vídeo — canal do YouTube tem feed nativo por channel_id */
  { nome: 'YouTube · Automation Direct', url: 'https://www.youtube.com/feeds/videos.xml?user=automationdirect', tipo: 'video', idioma: 'en', pais: 'US', nucleo: 'industria' },

  /* release de produto — changelog é factual, datado, e ninguém traduz */
  { nome: 'GitHub · n8n releases', url: 'https://github.com/n8n-io/n8n/releases.atom', tipo: 'release', idioma: 'en', pais: 'DE', nucleo: 'operacao' },
  { nome: 'GitHub · Home Assistant releases', url: 'https://github.com/home-assistant/core/releases.atom', tipo: 'release', idioma: 'en', pais: 'US', nucleo: 'edificacoes' },

  /* os dois que NÃO têm feed — sondados para o "não dá" ficar medido */
  { nome: 'X/Twitter (sem feed público)', url: 'https://twitter.com/i/rss', tipo: 'social', idioma: 'en', pais: 'US', nucleo: 'observatorio' },
  { nome: 'LinkedIn (sem feed público)', url: 'https://www.linkedin.com/feed/rss', tipo: 'social', idioma: 'en', pais: 'US', nucleo: 'observatorio' },
];

const UA =
  'InstitutoAutomacaoBot/0.1 (+https://institutoautomacao.com.br/blueprints; sondagem de fontes)';

type Resultado = Candidato & {
  status: number | string;
  entradas: number;
  comData: number;
  maisRecente: string | null;
  ms: number;
  obs: string;
};

const resultados: Resultado[] = [];

for (const c of CANDIDATOS) {
  const t0 = Date.now();
  const base: Resultado = { ...c, status: 0, entradas: 0, comData: 0, maisRecente: null, ms: 0, obs: '' };
  try {
    const r = await fetch(c.url, {
      headers: { 'user-agent': UA, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });
    base.status = r.status;
    base.ms = Date.now() - t0;

    if (!r.ok) {
      base.obs = r.status === 403 ? 'bloqueia robô' : r.status === 404 ? 'não existe' : '';
    } else {
      const xml = await r.text();
      const entradas = lerFeed(xml);
      base.entradas = entradas.length;
      base.comData = entradas.filter((e) => e.publicado).length;
      base.maisRecente = entradas.map((e) => e.publicado).filter(Boolean).sort().at(-1) ?? null;

      if (entradas.length === 0) {
        base.obs = xml.trimStart().startsWith('<') ? 'responde, mas o parser não achou item' : 'não é XML';
      } else if (base.comData < entradas.length) {
        base.obs = `${entradas.length - base.comData} sem data`;
      }
      // Exercita a canonicalização contra URL de verdade.
      const ruins = entradas.filter((e) => !canonicalizar(e.link, c.url)).length;
      if (ruins) base.obs += `${base.obs ? ' · ' : ''}${ruins} link inaproveitável`;
    }
  } catch (e) {
    base.status = 'erro';
    base.ms = Date.now() - t0;
    base.obs = (e as Error).message.slice(0, 60);
  }
  resultados.push(base);

  const marca = base.entradas > 0 ? 'ok ' : '   ';
  console.log(
    `${marca}${String(base.status).padEnd(5)} ${String(base.entradas).padStart(3)} itens  ${String(base.ms).padStart(5)}ms  ${c.nome}${base.obs ? `  — ${base.obs}` : ''}`,
  );
}

const bons = resultados.filter((r) => r.entradas > 0);
console.log(`\n${bons.length} de ${resultados.length} feeds utilizáveis.`);
console.log(`Bloqueiam robô: ${resultados.filter((r) => r.status === 403).length}`);
console.log(`Sem data em algum item: ${bons.filter((r) => r.comData < r.entradas).length}`);

/* ---- o SQL de carga, com TUDO como `resumo` ---- */
const esc = (v: string | null | undefined) => (v == null ? 'NULL' : `'${v.replace(/'/g, "''")}'`);
const linhas = bons.map((r) => {
  const id = 'f-' + r.nome.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const site = new URL(r.url).origin;
  return `  (${esc(id)}, ${esc(r.nome)}, ${esc(site)}, ${esc(r.url)}, ${esc(r.tipo)}, ${esc(r.idioma)}, ${esc(r.pais)}, ${esc(r.nucleo)}, 'resumo', NULL, 'media', ${r.relogio ? 1 : 0}, 60, 1)`;
});

console.log('\n-- Cole em fontes.sql. TUDO nasce como `resumo`: sondagem mede se o');
console.log('-- feed responde, não mede permissão. Subir para `liberada` exige');
console.log('-- alguém ler os termos e gravar licenca_evidencia.');
console.log(
  `INSERT OR REPLACE INTO fonte (id, nome, url_site, url_feed, tipo, idioma, pais, nucleo,\n                              licenca, licenca_evidencia, confianca, marca_relogio, intervalo_min, ativo)\nVALUES\n${linhas.join(',\n')};`,
);
