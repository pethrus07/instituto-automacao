/**
 * Instituto Automação — um Worker só.
 *
 * Serve as páginas a partir do conteúdo compilado (conteudo/**.md →
 * src/conteudo.gerado.ts) e roda o coletor no cron. É tudo. Não há IA em
 * produção, não há pipeline, não há banco de conteúdo — o git é o CMS.
 *
 * Cada página mora em src/paginas/; aqui só se monta a ordem e o que vale
 * para todas: os cabeçalhos de segurança, a 404 e o cron.
 *
 * ⚠️ Rota de caminho fixo antes de qualquer curinga. O roteador casa na
 * ordem, e um `/:x` cedo demais engole tudo o que vem depois.
 */
import type { Env } from './config';
import { TEMA_SCRIPT_HASH } from './conteudo.gerado';
import { coletar } from './coletor';
import { novaApp } from './paginas/app';
import { estatico } from './paginas/estatico';
import { capa } from './paginas/capa';
import { secoes } from './paginas/secoes';
import { agenda } from './paginas/agenda';
import { glossario } from './paginas/glossario';
import { blueprints } from './paginas/blueprints';
import { marca } from './paginas/marca';
import { paginasDeAutor } from './paginas/autores';
import { escrever } from './paginas/escrever';
import { apoie } from './paginas/apoie';
import { privacidade } from './paginas/privacidade';
import { formularios } from './paginas/formularios';
import { redirects } from './paginas/redirects';
import { naoEncontrado } from './paginas/naoEncontrado';

const app = novaApp();

/* ------------------------------------------------------------ segurança
 * Os cabeçalhos que todo site deveria mandar e quase nenhum manda. A CSP é
 * estrita: o script inline do tema vai pelo hash (ui/tema.ts → compilador →
 * aqui), e fora ele só arquivo do próprio site; estilo inline é permitido porque o HTML usa
 * `style=""` em alguns lugares; nada de terceiro em lugar nenhum.
 */
const CSP = [
  "default-src 'self'",
  // 'self': os dois scripts servidos do próprio site — o botão Copiar do código
  // no artigo (publico/js/artigo.js) e o editor em /escrever. Terceiro, nunca.
  `script-src 'self' 'sha256-${TEMA_SCRIPT_HASH}'`,
  "style-src 'self' 'unsafe-inline'",
  // blob: é a imagem que o autor escolheu no editor de /escrever, guardada no
  // navegador dele — a miniatura e a prévia. Não é terceiro: nunca saiu da máquina.
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

app.use('*', async (c, next) => {
  await next();
  const h = c.res.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
  h.set('X-Frame-Options', 'DENY');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  if ((h.get('Content-Type') ?? '').includes('text/html')) h.set('Content-Security-Policy', CSP);
  // homologação: nada indexa, em nenhuma resposta
  if (c.env.HOMOLOG === '1') h.set('X-Robots-Tag', 'noindex, nofollow');
});

/* ------------------------------------------------------------ um endereço só
 * www.institutoautomacao.com.br responde (está nas rotas), mas o endereço do
 * site é um: sem www. 301 para lá, com o caminho — link que alguém guardou
 * com www continua valendo, e a busca não vê duas cópias do site. */
app.use('*', async (c, next) => {
  const u = new URL(c.req.url);
  if (u.hostname.startsWith('www.')) {
    u.hostname = u.hostname.slice(4);
    return c.redirect(u.toString(), 301);
  }
  await next();
});

/* ------------------------------------------------------------ as páginas */
app.route('/', estatico);
app.route('/', capa);
app.route('/', secoes);
app.route('/', agenda);
app.route('/', glossario);
app.route('/', blueprints);
app.route('/', marca);
app.route('/', paginasDeAutor);
app.route('/', escrever);
app.route('/', apoie);
app.route('/', privacidade);
app.route('/', formularios);
app.route('/', redirects);
app.notFound(naoEncontrado);

export default {
  fetch: app.fetch,

  /**
   * O cron: só o coletor.
   *
   * ⚠️ TODO trabalho assíncrono passa por ctx.waitUntil. Promessa não
   * esperada é CANCELADA quando a resposta sai — e o miniflare local deixa
   * terminar, então esse defeito só aparece em produção.
   */
  async scheduled(_evento: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        try {
          const r = await coletar(env);
          console.log(
            `[coletor] ${r.fontes} fontes · ${r.novos} novos · ${r.repetidos} repetidos · ` +
              `${r.ignorados} ignorados · ${r.adiados} adiados · ` +
              `${r.recusados} recusados pelo robots · ${r.erros.length} erros · ${r.ms}ms`,
          );
          for (const e of r.erros) console.warn(`[coletor] ${e.fonte}: ${e.erro}`);
        } catch (e) {
          console.error('[coletor] falhou inteiro:', e);
        }
      })(),
    );
  },
} satisfies ExportedHandler<Env>;
