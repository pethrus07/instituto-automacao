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
import {
  ItemDoRadar, Secao, Aviso, EmRadar, Relogio, Selo, dataBR, Kicker,
  EventoNaAgenda, FiltroAgenda, FormularioEvento, periodoEvento,
  AssinaturaObra, ObraNaLista, LeituraNoItem, ROTULO_OBRA,
} from './ui/pecas';
import { ldJson, eventoLd, agendaLd } from './ui/jsonld';
import { renderizarObra, minutosDeLeitura } from './ui/markdown';
import { feedDoNucleo, sitemap, robots } from './feed';
import { raw } from 'hono/html';
import { CSS, CSS_ROTA, CSS_HASH } from './estilo';
import { CACHE, NUCLEOS, ORDEM_NUCLEOS, ehNucleo, type Env } from './config';
import {
  listarRadar, obterItem, contarPorNucleo, medirAtraso,
  listarAgenda, obterEvento, contarAgenda, type FiltroAgenda as TipoFiltroAgenda,
  listarObras, obterObra, leituraDoItem, type FormatoObra,
} from './db';
import { coletar } from './coletor';
import { processar } from './pipeline';
import { estadoIA } from './ia/cliente';

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
  return c.json({
    ok: db === 'ok',
    db,
    ia: estadoIA(c.env),
    css: CSS_HASH,
    rota_css: CSS_ROTA,
    ms: Date.now() - t0,
  });
});

/* ----------------------------------------------------- feeds e indexação
 * O <head> anuncia estes quatro feeds desde a primeira sprint. Até aqui era
 * promessa sem lastro — apontada pelo próprio QA na sprint 0.
 */
app.get('/feed/:arquivo', async (c) => {
  const nome = c.req.param('arquivo').replace(/\.xml$/, '');
  if (!ehNucleo(nome)) return c.notFound();
  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  c.header('Cache-Control', CACHE.listagem);
  return c.body(await feedDoNucleo(c.env, nome));
});

app.get('/sitemap.xml', async (c) => {
  c.header('Content-Type', 'application/xml; charset=utf-8');
  c.header('Cache-Control', CACHE.listagem);
  return c.body(await sitemap(c.env));
});

app.get('/robots.txt', (c) => {
  c.header('Content-Type', 'text/plain; charset=utf-8');
  c.header('Cache-Control', CACHE.listagem);
  return c.body(robots(c.env));
});

/* -------------------------------------------------------------- panorama
 * Índice do que é institucional e assinado.
 */
app.get('/panorama', async (c) => {
  const obras = await listarObras(c.env.DB, { formato: 'panorama' }, 30);
  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Panorama"
        descricao="Relatórios do Instituto Automação, extraídos da própria base do radar."
        url={c.env.SITE_URL + '/panorama'}
      >
        <h1>Panorama</h1>
        <p class="u-muted" style="max-width: var(--measure); margin-block-start: var(--space-2xs)">
          O que a nossa própria base responde: quanto tempo a automação leva para sair da
          fronteira lá fora e chegar ao chão de fábrica daqui.
        </p>
        <div style="margin-block-start: var(--space-xl)">
          {obras.length === 0 ? (
            <Aviso>
              <strong>O primeiro Panorama sai quando houver base para ele.</strong> Ele não vem
              de entrevista nem de pesquisa de campo: sai do que o radar coletou. Por isso
              depende de tempo de coleta, e não de esforço.
            </Aviso>
          ) : (
            obras.map((o) => <ObraNaLista obra={o} />)
          )}
        </div>
      </Documento>,
    ),
  );
});

/* ------------------------------------------------------------------ agenda
 * O ativo mais durável do projeto: notícia decai em 48 h, calendário não.
 * Cada combinação de filtro vira URL própria — indexável, linkável, e
 * mandável no WhatsApp para o organizador da feira.
 */
app.get('/agenda', async (c) => {
  const q = c.req.query();
  const filtro: TipoFiltroAgenda = {};
  if (q.n && ehNucleo(q.n)) filtro.nucleo = q.n;
  if (q.f === 'presencial' || q.f === 'online' || q.f === 'hibrido') filtro.formato = q.f;
  if (q.o === 'br' || q.o === 'fora') filtro.onde = q.o;

  const eventos = await listarAgenda(c.env.DB, filtro);
  const contagem = await contarAgenda(c.env.DB);

  // Base dos links de filtro: preserva os outros parâmetros ao trocar um.
  const base = new URLSearchParams();
  if (filtro.nucleo) base.set('n', filtro.nucleo);
  if (filtro.formato) base.set('f', filtro.formato);
  if (filtro.onde) base.set('o', filtro.onde);
  const filtrando = base.toString().length > 0;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Agenda"
        descricao="Feiras, congressos e encontros de automação no Brasil e no exterior, em um calendário só."
        url={`${c.env.SITE_URL}/agenda${filtrando ? `?${base}` : ''}`}
        ld={eventos.length ? ldJson(agendaLd(eventos, c.env.SITE_URL)) : undefined}
      >
        <h1>Agenda</h1>
        <p class="u-muted" style="max-width: var(--measure); margin-block-start: var(--space-2xs)">
          Feiras, congressos e encontros de automação — no Brasil e lá fora. {contagem.total} evento
          {contagem.total === 1 ? '' : 's'} à frente, {contagem.brasil} no Brasil.
        </p>

        {q.enviado === '1' && (
          <div style="margin-block-start: var(--space-m)">
            <Aviso>
              <strong>Recebido.</strong> O evento entra na agenda depois da conferência de data e
              local.
            </Aviso>
          </div>
        )}

        <div style="margin-block-start: var(--space-l)">
          <FiltroAgenda
            rotulo="Núcleo"
            parametro="n"
            atual={filtro.nucleo}
            base={base}
            opcoes={ORDEM_NUCLEOS.map((k) => ({
              valor: k,
              texto: NUCLEOS[k].nome,
              classe: NUCLEOS[k].classe,
            }))}
          />
          <FiltroAgenda
            rotulo="Formato"
            parametro="f"
            atual={filtro.formato}
            base={base}
            opcoes={[
              { valor: 'presencial', texto: 'Presencial' },
              { valor: 'online', texto: 'Online' },
              { valor: 'hibrido', texto: 'Híbrido' },
            ]}
          />
          <FiltroAgenda
            rotulo="Onde"
            parametro="o"
            atual={filtro.onde}
            base={base}
            opcoes={[
              { valor: 'br', texto: 'Brasil' },
              { valor: 'fora', texto: 'Exterior' },
            ]}
          />
        </div>

        <div style="margin-block-start: var(--space-xl)">
          {eventos.length === 0 ? (
            <Aviso>
              {filtrando ? (
                <>
                  <strong>Nenhum evento com esses filtros.</strong>{' '}
                  <a href="/agenda">Ver a agenda inteira</a>.
                </>
              ) : (
                <>
                  <strong>A agenda ainda está vazia.</strong> Organiza um evento de automação?{' '}
                  <a href="#enviar">Mande para cá</a> — listar é de graça.
                </>
              )}
            </Aviso>
          ) : (
            eventos.map((e) => <EventoNaAgenda evento={e} />)
          )}
        </div>

        <div id="enviar" style="margin-block-start: var(--space-3xl); scroll-margin-top: var(--space-l)">
          <Secao titulo="Enviar um evento" />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            Listar é gratuito. Todo envio passa por conferência antes de aparecer — data errada em
            agenda destrói a confiança na agenda inteira.
          </p>
          <FormularioEvento />
        </div>
      </Documento>,
    ),
  );
});

/* -------------------------------------------------------- envio de evento */
app.post('/agenda/enviar', async (c) => {
  const f = await c.req.formData();
  const texto = (k: string) => String(f.get(k) ?? '').trim().slice(0, 500);

  // Armadilha para robô: campo escondido que humano nunca preenche. Não é
  // proteção séria — é o filtro barato. Ver qa/SPRINT-3.md §5.
  if (texto('sitio')) return c.redirect('/agenda?enviado=1', 303);

  const nome = texto('nome');
  const inicio = texto('inicio');
  const erro = !nome
    ? 'Falta o nome do evento.'
    : !/^\d{4}-\d{2}-\d{2}$/.test(inicio)
      ? 'A data de início precisa estar no formato AAAA-MM-DD.'
      : inicio < new Date().toISOString().slice(0, 10)
        ? 'A data de início já passou.'
        : null;

  if (erro) {
    c.status(400);
    return c.html(
      pagina(
        <Documento titulo="Envio não aceito">
          <h1>Envio não aceito</h1>
          <div style="margin-block-start: var(--space-m)">
            <Aviso>
              <strong>{erro}</strong> <a href="/agenda#enviar">Voltar ao formulário</a>.
            </Aviso>
          </div>
        </Documento>,
      ),
    );
  }

  const nucleoEnviado = texto('nucleo');
  const formatoEnviado = texto('formato');

  // Entra como 'coletado': nada aparece na agenda sem conferência humana.
  await c.env.DB.prepare(
    `INSERT INTO evento (id, nucleo, nome, descricao, inicio, fim, cidade, uf, pais,
                         formato, organizador, url, preco, origem, status)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,'formulario','coletado')`,
  )
    .bind(
      `e-${crypto.randomUUID().slice(0, 12)}`,
      ehNucleo(nucleoEnviado) ? nucleoEnviado : 'industria',
      nome,
      texto('descricao') || null,
      inicio,
      texto('fim') || null,
      texto('cidade') || null,
      texto('uf').toUpperCase().slice(0, 2) || null,
      texto('pais').toUpperCase().slice(0, 2) || 'BR',
      ['presencial', 'online', 'hibrido'].includes(formatoEnviado) ? formatoEnviado : 'presencial',
      texto('organizador') || null,
      texto('url') || null,
      texto('preco') || null,
    )
    .run();

  return c.redirect('/agenda?enviado=1', 303);
});

/* ------------------------------------------------------------ evento único
 * ⚠️ Precisa vir ANTES de /:nucleo/:slug — senão o curinga casa primeiro.
 */
app.get('/agenda/:slug', async (c) => {
  const e = await obterEvento(c.env.DB, c.req.param('slug'));
  if (!e) return c.notFound();

  const local =
    e.formato === 'online'
      ? 'Online'
      : [e.cidade, e.pais === 'BR' ? e.uf : e.pais].filter(Boolean).join(' · ');

  /**
   * Evento que já passou continua tendo página — permalink é contrato com
   * quem linkou, e derrubar para 404 quebra o link de todo mundo. Mas a
   * página TEM de dizer que já aconteceu: quem chega pela busca meses
   * depois não pode achar que ainda vai acontecer.
   */
  const passou = (e.fim ?? e.inicio).slice(0, 10) < new Date().toISOString().slice(0, 10);

  c.header('Cache-Control', CACHE.item);
  return c.html(
    pagina(
      <Documento
        titulo={e.nome}
        nucleo={e.nucleo}
        descricao={e.descricao ?? `${e.nome} — ${periodoEvento(e.inicio, e.fim)}, ${local}.`}
        url={`${c.env.SITE_URL}/agenda/${e.slug}`}
        ld={ldJson(eventoLd(e, c.env.SITE_URL))}
      >
        <p>
          <a href="/agenda" class="kicker kicker--dot">
            Agenda
          </a>
        </p>
        <h1 style="max-width: var(--measure); margin-block-start: var(--space-2xs)">{e.nome}</h1>

        {passou && (
          <div style="margin-block-start: var(--space-m)">
            <Aviso>
              <strong>Este evento já aconteceu.</strong> A página fica no ar para quem chegou por
              um link antigo. Para o que vem pela frente, veja a <a href="/agenda">agenda</a>.
            </Aviso>
          </div>
        )}

        <div class="assinatura" style="margin-block-start: var(--space-m)">
          <span class="assinatura__autor u-dado">{periodoEvento(e.inicio, e.fim)}</span>
          <span>{local || '—'}</span>
          <span>
            {e.formato === 'hibrido' ? 'Híbrido' : e.formato === 'online' ? 'Online' : 'Presencial'}
          </span>
          {e.preco && <span>{e.preco === 'gratuito' ? 'Gratuito' : e.preco}</span>}
          <span class="assinatura__nucleo">{NUCLEOS[e.nucleo].nome}</span>
        </div>

        {e.descricao && (
          <div class="obra" style="margin-block-start: var(--space-l)">
            <p>{e.descricao}</p>
          </div>
        )}

        <p style="margin-block-start: var(--space-l)">
          {e.url && (
            <a href={e.url} rel="nofollow noopener" target="_blank">
              Página oficial do evento
            </a>
          )}
          {e.organizador && <span class="u-muted"> · organização: {e.organizador}</span>}
        </p>

        <div style="margin-block-start: var(--space-xl)">
          <Aviso>
            <strong>Data e local conferidos na fonte oficial.</strong> Se algo mudou,{' '}
            <a href="/agenda#enviar">avise</a> — agenda com data errada não serve para nada.
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

/* --------------------------------------------------------------- a obra
 * Análise, Caso e Panorama têm página própria e URL sem núcleo: obra é para
 * durar, e o núcleo pode mudar de nome antes do texto envelhecer.
 * A Leitura NÃO tem página: ela vive dentro do item que comenta.
 *
 * ⚠️ Antes de /:nucleo/:slug — senão o curinga casa primeiro.
 */
app.get('/:formato{analise|caso|panorama}/:slug', async (c) => {
  const formato = c.req.param('formato') as FormatoObra;
  const o = await obterObra(c.env.DB, formato, c.req.param('slug'));
  if (!o) return c.notFound();

  const html = renderizarObra(o.corpo);
  const minutos = minutosDeLeitura(o.corpo);

  c.header('Cache-Control', CACHE.item);
  return c.html(
    pagina(
      <Documento
        titulo={o.titulo}
        nucleo={o.nucleo}
        descricao={o.lead ?? undefined}
        url={`${c.env.SITE_URL}/${o.formato}/${o.slug}`}
      >
        <Kicker>{ROTULO_OBRA[o.formato] ?? o.formato}</Kicker>
        <h1 style="max-width: var(--measure); margin-block-start: var(--space-2xs)">{o.titulo}</h1>

        <div style="margin-block-start: var(--space-m)">
          <AssinaturaObra obra={o} minutos={minutos} />
        </div>

        <div class="obra" style="margin-block-start: var(--space-l)">
          {o.lead && <p class="lead">{o.lead}</p>}
          {raw(html)}
        </div>

        {o.item_slug && o.item_nucleo && (
          <p class="u-muted" style="margin-block-start: var(--space-xl); font-size: var(--step--1)">
            Comenta:{' '}
            <a href={`/${o.item_nucleo}/${o.item_slug}`}>{o.item_titulo}</a>
          </p>
        )}

        <div style="margin-block-start: var(--space-xl)">
          <Aviso>
            <strong>Texto assinado.</strong> O radar e a agenda deste site não têm autor — são
            agregação. Análise, Caso e Panorama têm, e a responsabilidade pelo que está escrito
            aqui é de quem assina.
          </Aviso>
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
  const obras = await listarObras(c.env.DB, { nucleo: chave }, 5);

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

        {obras.length > 0 && (
          <div style="margin-block-start: var(--space-xl)">
            <Secao titulo="Obra" />
            {obras.map((o) => (
              <ObraNaLista obra={o} />
            ))}
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
  const leitura = await leituraDoItem(c.env.DB, i.id);
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

        {leitura && <LeituraNoItem obra={leitura} html={renderizarObra(leitura.corpo)} />}

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
      (async () => {
        // Coletor primeiro, pipeline depois — e o pipeline nunca pode
        // impedir a coleta: feed não guarda histórico, e dia sem coletar
        // não volta. Se o teto de custo estourar, a base continua crescendo.
        try {
          const c = await coletar(env);
          console.log(
            `[coletor] ${c.fontes} fontes · ${c.novos} novos · ${c.repetidos} repetidos · ` +
              `${c.ignorados} ignorados · ${c.erros.length} erros · ${c.ms}ms`,
          );
          for (const e of c.erros) console.warn(`[coletor] ${e.fonte}: ${e.erro}`);
        } catch (e) {
          console.error('[coletor] falhou inteiro:', e);
        }

        try {
          const p = await processar(env);
          console.log(
            `[pipeline] ${p.processados} processados · ${p.publicados} publicados · ` +
              `${p.aguardando} na fila · ${p.arquivados} arquivados · ` +
              `R$ ${p.custo_brl.toFixed(4)} no dia${p.simulado ? ' · SIMULADO' : ''}` +
              `${p.pausado_por_teto ? ' · PAUSADO PELO TETO' : ''} · ${p.ms}ms`,
          );
          for (const e of p.erros) console.warn(`[pipeline] ${e.item}: ${e.erro}`);
        } catch (e) {
          console.error('[pipeline] falhou inteiro:', e);
        }
      })(),
    );
  },
} satisfies ExportedHandler<Env>;
