/**
 * Instituto Automação — um Worker só.
 *
 * Este mesmo artefato serve as páginas, roda o coletor no cron e (a partir do
 * v0) recebe o webhook do WhatsApp. Um `wrangler deploy` e acabou.
 *
 * Bloco 1 do P0: rotas de leitura sobre o D1. Coletor entra no bloco 2.
 */
import { Hono } from 'hono';
import { Documento } from './ui/Documento';
import { ItemDoRadar, Secao, Aviso, EmRadar, Relogio, Selo, dataBR } from './ui/pecas';
import { CSS, CSS_ROTA, CSS_HASH } from './estilo';
import { CACHE, NUCLEOS, ORDEM_NUCLEOS, ehNucleo, type Env } from './config';
import { listarRadar, obterItem, contarPorNucleo, medirAtraso } from './db';
import { coletar } from './coletor';

const app = new Hono<{ Bindings: Env }>();

/** Renderiza um documento JSX como HTML completo. */
const pagina = (no: unknown) => `<!doctype html>${String(no)}`;

/* ------------------------------------------------------------------ estilo */
/**
 * O nome do arquivo carrega o hash só para invalidar cache — o conteúdo é
 * sempre o CSS atual. Qualquer /a/*.css serve, então folha antiga em cache
 * de terceiro nunca devolve 404.
 */
app.get('/a/:arquivo', (c) => {
  if (!c.req.param('arquivo').endsWith('.css')) return c.notFound();
  c.header('Content-Type', 'text/css; charset=utf-8');
  c.header('Cache-Control', CACHE.estatico);
  return c.body(CSS);
});

/* ------------------------------------------------------------------ saúde
 * ⚠️ Toda rota de caminho fixo precisa vir ANTES de /:nucleo — senão o
 * curinga casa primeiro e devolve 404.
 */
app.get('/saude', async (c) => {
  const t0 = Date.now();
  let db = 'ok';
  try {
    await c.env.DB.prepare('SELECT 1').first();
  } catch (e) {
    db = `erro: ${(e as Error).message}`;
  }
  return c.json({ ok: db === 'ok', db, css: CSS_HASH, rota_css: CSS_ROTA, ms: Date.now() - t0 });
});

/* ------------------------------------------------------------------ agenda
 * Entra no v0. Existe agora para o link do menu não morrer — e a página diz
 * o que vai ser, em vez de dar 404 no ativo mais importante do projeto.
 */
app.get('/agenda', (c) => {
  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Agenda"
        descricao="Calendário de feiras, congressos e eventos de automação no Brasil e no exterior."
        url={c.env.SITE_URL + '/agenda'}
      >
        <h1>Agenda</h1>
        <p class="u-muted" style="max-width: var(--measure); margin-block-start: var(--space-2xs)">
          Feiras, congressos e encontros de automação — no Brasil e lá fora.
        </p>
        <div style="margin-block-start: var(--space-l)">
          <Aviso>
            <strong>A agenda entra no v0.</strong> É o ativo mais durável do projeto: notícia
            decai em 48 horas, calendário não. Vai nascer completa nos quatro núcleos, com
            filtro por URL própria e <code>schema.org/Event</code>.
          </Aviso>
        </div>
      </Documento>,
    ),
  );
});

/* -------------------------------------------------------------------- capa */
app.get('/', async (c) => {
  const contagens = await contarPorNucleo(c.env.DB);
  const atraso = await medirAtraso(c.env.DB);
  const porNucleo = new Map(contagens.map((x) => [x.nucleo, x]));

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="O que o setor publicou lá fora hoje"
        descricao="Notícia internacional de automação, em português, no mesmo dia. Indústria, IA, processos e edificações."
        url={c.env.SITE_URL + '/'}
      >
        <h1 style="max-width: var(--measure)">
          O que o setor publicou lá fora hoje, em português, hoje
        </h1>
        <p class="obra" style="margin-block-start: var(--space-m)">
          <span class="lead">
            Quase toda notícia de automação nasce em inglês e alemão e chega ao Brasil com
            dias ou semanas de atraso — quando chega. Aqui ela chega no mesmo dia, com uma
            linha sobre o que muda por aqui.
          </span>
        </p>

        {atraso.medidos > 0 && (
          <div style="margin-block-start: var(--space-xl)">
            <Secao titulo="O atraso, medido" />
            <div style="display:flex; flex-wrap:wrap; gap:var(--space-xl); margin-block-start:var(--space-m)">
              <div>
                <div class="u-dado" style="font-size:var(--step-4); font-weight:700; line-height:1">
                  {atraso.media_dias ?? '—'}
                </div>
                <div style="font-size:var(--step--2); text-transform:uppercase; letter-spacing:var(--tracking-kicker); color:var(--ink-faint)">
                  dias em média até chegar ao Brasil
                </div>
              </div>
              <div>
                <div class="u-dado" style="font-size:var(--step-4); font-weight:700; line-height:1">
                  {atraso.sem_mencao}
                </div>
                <div style="font-size:var(--step--2); text-transform:uppercase; letter-spacing:var(--tracking-kicker); color:var(--ink-faint)">
                  assuntos que nunca chegaram
                </div>
              </div>
            </div>
          </div>
        )}

        <div style="margin-block-start: var(--space-2xl)">
          <Secao titulo="Núcleos" />
          {ORDEM_NUCLEOS.map((chave) => {
            const n = NUCLEOS[chave];
            const c2 = porNucleo.get(chave);
            return (
              <article class={`item ${n.classe}`}>
                <div class="item__topo">
                  <span class="kicker kicker--dot">{n.nome}</span>
                  {!n.quente && <Selo tipo="radar">Radar</Selo>}
                </div>
                <h3 class="item__titulo">
                  <a href={`/${chave}`}>{n.resumo}</a>
                </h3>
                <p class="item__pe">
                  <span>{c2?.total ?? 0} itens publicados</span>
                  {c2?.ultimo && (
                    <>
                      <span>·</span>
                      <span>último em {dataBR(c2.ultimo, false)}</span>
                    </>
                  )}
                </p>
              </article>
            );
          })}
        </div>
      </Documento>,
    ),
  );
});

/* ------------------------------------------------------------------ núcleo */
app.get('/:nucleo', async (c) => {
  const chave = c.req.param('nucleo');
  if (!ehNucleo(chave)) return c.notFound();

  const n = NUCLEOS[chave];
  const itens = await listarRadar(c.env.DB, chave, 30);

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento titulo="Radar" nucleo={chave} descricao={n.resumo} url={`${c.env.SITE_URL}/${chave}`}>
        <h1>{n.nome}</h1>
        <p class="u-muted" style="max-width: var(--measure); margin-block-start: var(--space-2xs)">
          {n.resumo}
        </p>

        {!n.quente && (
          <div style="margin-block-start: var(--space-m)">
            <EmRadar nucleo={chave} />
          </div>
        )}

        <div style="margin-block-start: var(--space-xl)">
          <Secao titulo={`Radar · ${n.nome}`} />
          {itens.length === 0 ? (
            <Aviso>
              <strong>Ainda não há itens aqui.</strong> O coletor entra no bloco 2 do P0 — até
              lá, esta página existe para provar que a esteira chega até a tela.
            </Aviso>
          ) : (
            itens.map((i) => <ItemDoRadar item={i} comContexto />)
          )}
        </div>
      </Documento>,
    ),
  );
});

/* -------------------------------------------------------------------- item */
app.get('/:nucleo/:slug', async (c) => {
  const chave = c.req.param('nucleo');
  if (!ehNucleo(chave)) return c.notFound();

  const i = await obterItem(c.env.DB, chave, c.req.param('slug'));
  if (!i) return c.notFound();

  const n = NUCLEOS[chave];
  const traduzido = i.modo === 'traducao';
  const pendente = traduzido && i.revisado_humano === 0;

  c.header('Cache-Control', CACHE.item);
  return c.html(
    pagina(
      <Documento
        titulo={i.titulo}
        nucleo={chave}
        descricao={i.resumo ?? i.contexto_br ?? undefined}
        url={`${c.env.SITE_URL}/${chave}/${i.slug}`}
      >
        <div class="item__topo" style="margin-block-end: var(--space-s)">
          <span class="kicker kicker--dot">{n.nome}</span>
          <Relogio minutos={i.minutos_apos_fonte} />
          {traduzido && <Selo tipo="traducao">Tradução integral</Selo>}
          {pendente && <Selo tipo="pendente">Revisão pendente</Selo>}
        </div>

        <h1 style="max-width: var(--measure)">{i.titulo}</h1>

        <div class="assinatura" style="margin-block-start: var(--space-m)">
          <span>
            Fonte:{' '}
            <a href={i.url} rel="nofollow noopener" target="_blank">
              {i.fonte_nome}
            </a>
          </span>
          <span class="u-dado">{dataBR(i.publicado_fonte)}</span>
          <Selo tipo="original">{i.idioma_origem.toUpperCase()}</Selo>
          {i.atraso_br_dias != null && <span>chegou ao Brasil {i.atraso_br_dias} dias depois</span>}
        </div>

        {i.contexto_br && (
          <p class="item__contexto" style="margin-block-start: var(--space-l)">
            {i.contexto_br}
          </p>
        )}

        <div class="obra" style="margin-block-start: var(--space-l)">
          {(i.corpo ?? i.resumo ?? '')
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((par) => (
              <p>{par}</p>
            ))}
        </div>

        <div style="margin-block-start: var(--space-xl)">
          <Aviso>
            <strong>Como este item foi produzido.</strong>{' '}
            {traduzido
              ? 'Tradução integral a partir de material liberado para imprensa pela própria fonte, com crédito e link.'
              : 'Resumo escrito pelo Instituto a partir da publicação original, com crédito e link. O texto integral está na fonte.'}{' '}
            O parágrafo destacado acima é redação do Instituto.
            {pendente && ' A tradução ainda não passou por revisão humana.'}
          </Aviso>
        </div>

        {i.titulo_original && (
          <p class="u-faint" style="margin-block-start: var(--space-m); font-size: var(--step--1)">
            Título original: <span class="u-dado">{i.titulo_original}</span>
          </p>
        )}
      </Documento>,
    ),
  );
});

app.notFound((c) =>
  c.html(
    pagina(
      <Documento titulo="Não encontrado">
        <h1>Não encontrado</h1>
        <p class="u-muted" style="margin-block-start: var(--space-s)">
          A página que você procurou não existe (ou ainda não existe).{' '}
          <a href="/">Voltar à capa</a>.
        </p>
      </Documento>,
    ),
    404,
  ),
);

export default {
  fetch: app.fetch,

  /**
   * O cron.
   *
   * ⚠️ TODO trabalho assíncrono passa por ctx.waitUntil. Promessa não
   * esperada é CANCELADA quando a resposta sai — e o miniflare local deixa
   * terminar, então esse defeito só aparece em produção. Já derrubou outro
   * Worker desta casa.
   *
   * Testar local:  npm run dev  →  curl "localhost:8787/cdn-cgi/handler/scheduled"
   */
  async scheduled(_evento: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      coletar(env)
        .then((r) => {
          console.log(
            `[coletor] ${r.fontes} fontes · ${r.novos} novos · ${r.repetidos} repetidos · ` +
              `${r.ignorados} ignorados · ${r.erros.length} erros · ${r.ms}ms`,
          );
          for (const e of r.erros) console.warn(`[coletor] ${e.fonte}: ${e.erro}`);
        })
        .catch((e) => console.error('[coletor] falhou inteiro:', e)),
    );
  },
} satisfies ExportedHandler<Env>;
