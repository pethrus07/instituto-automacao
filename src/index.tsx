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
  Veredito, Destaque, Numero, ROTULO_VEREDITO,
} from './ui/pecas';
import { ldJson, eventoLd, agendaLd } from './ui/jsonld';
import { renderizarObra, minutosDeLeitura } from './ui/markdown';
import { gerarCapa } from './ui/capa';
import { feedDoNucleo, sitemap, robots } from './feed';
import { raw } from 'hono/html';
import { CSS, CSS_ROTA, CSS_HASH } from './estilo';
import { CACHE, NUCLEOS, ORDEM_NUCLEOS, ehNucleo, type Env } from './config';
import {
  listarRadar, obterItem, contarPorNucleo, medirAtraso,
  listarAgenda, obterEvento, contarAgenda, type FiltroAgenda as TipoFiltroAgenda,
  listarObras, obterObra, leituraDoItem, type FormatoObra,
  placar, destaque as itemDestaque,
  listarGlossario, inventarioFontes, listarCorrecoes, assinar, contarAssinantes,
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

/* -------------------------------------------------------------------- capa
 * PORTAL INSTITUCIONAL, não portal de notícia.
 *
 * A diferença não é de estilo, é de gênero: a home diz o que a instituição
 * É e o que ela FAZ; a notícia é uma seção dentro disso. E há um motivo
 * prático para o momento — portal institucional envelhece bem com pouco
 * conteúdo, portal de notícia parece abandonado. Com o radar ainda vazio,
 * é o único gênero que não denuncia a falta.
 */
app.get('/', async (c) => {
  const q = c.req.query();
  const [contagens, atraso, p, destaque, eventos, obras] = await Promise.all([
    contarPorNucleo(c.env.DB),
    medirAtraso(c.env.DB),
    placar(c.env.DB),
    itemDestaque(c.env.DB),
    listarAgenda(c.env.DB, {}, 3),
    listarObras(c.env.DB, {}, 2),
  ]);
  const porNucleo = new Map(contagens.map((x) => [x.nucleo, x]));
  const totalItens = contagens.reduce((soma, x) => soma + x.total, 0);
  const temBase = totalItens > 0 || atraso.medidos > 0;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Instituto Automação"
        descricao="O Instituto Automação acompanha o que o setor publica no mundo e traduz para o português no mesmo dia — e mede quanto tempo leva para chegar ao Brasil."
        url={c.env.SITE_URL + '/'}
      >
        {/*
          1 · O HERO.

          Max Planck abre com imagem de largura total e texto sobreposto;
          Igarapé, com banner grande e DOIS botões. O nosso era lado a lado e
          claro — por isso não tinha peso. Escuro e sangrando de ponta a
          ponta, ele vira o bloco que segura a página.

          E os números moram DENTRO dele: num instituto que mede, o dado é
          parte da apresentação, não uma seção à parte.
        */}
        <section class="hero sangra">
          <div class="hero__fundo">{raw(gerarCapa('abertura-instituto', true).svg)}</div>
          <div class="hero__veu"></div>

          <div class="wrap hero__conteudo" style="padding-inline: 0">
            <span class="hero__kicker">O que o setor publicou hoje, lá fora</span>
            <h1 class="hero__titulo">O setor de automação, em português, no mesmo dia</h1>
            <p class="hero__lead">
              Acompanhamos o que fabricantes, associações e imprensa técnica publicam no mundo,
              traduzimos no dia em que sai e dizemos o que cada coisa muda para quem trabalha
              com automação no Brasil.
            </p>
            <div class="hero__acoes">
              <a href="/industria" class="botao-acao">Ver o radar</a>
              <a href="#como-trabalhamos" class="botao-vazado">Como trabalhamos</a>
            </div>

            {temBase ? (
              <div class="hero__numeros">
                <div>
                  <div class="hero__num">{atraso.media_dias ?? '—'}</div>
                  <div class="hero__rot">dias, em média, até um assunto chegar ao Brasil</div>
                </div>
                <div>
                  <div class="hero__num">{p.nao_chega}</div>
                  <div class="hero__rot">
                    <a href="/industria?v=nao_chega">itens que não chegaram aqui</a>
                  </div>
                </div>
                <div>
                  <div class="hero__num">{totalItens}</div>
                  <div class="hero__rot">itens traduzidos e publicados</div>
                </div>
              </div>
            ) : (
              /* Número zerado na abertura é pior que número nenhum: promete
                 medição e entrega vazio. Enquanto a base não se forma, a
                 faixa diz por que ela ainda não existe. */
              <p class="hero__numeros hero__rot" style="max-width: 52ch">
                Os números desta faixa aparecem quando houver base para eles. O atraso até o
                Brasil não se estima — mede-se, coletando todo dia.
              </p>
            )}
          </div>
        </section>

        {/* 2 · O que fazemos: os núcleos como estrutura, não como feed */}
        <section style="padding-block: var(--space-2xl)">
          <Secao titulo="Os núcleos" />
          <div style="display:grid; gap:var(--space-l); grid-template-columns:repeat(auto-fit,minmax(17rem,1fr))">
            {ORDEM_NUCLEOS.map((chave) => {
              const n = NUCLEOS[chave];
              const c2 = porNucleo.get(chave);
              return (
                <article style="display:grid; gap:var(--space-2xs); align-content:start">
                  <div class="moldura-capa" style="aspect-ratio: 21/9; margin-block-end: var(--space-2xs)">
                    {raw(gerarCapa(`nucleo-${chave}`).svg)}
                  </div>
                  <h3 style="font-size: var(--step-1)">
                    <a href={`/${chave}`} style="text-decoration:none">
                      {n.nome}
                    </a>
                  </h3>
                  <p class="u-muted" style="font-size: var(--step--1)">
                    {n.resumo}
                  </p>
                  <p class="u-faint u-fluxo" style="font-size: var(--step--2); margin-block-start: var(--space-2xs)">
                    {c2?.total ?? 0} publicados{n.quente ? '' : ' · em modo Radar'}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* 3 · A pergunta que o Instituto persegue. Os números subiram para
            o hero; aqui fica o porquê deles, que é o que dá sentido a eles. */}
        <section class="faixa sangra">
          <div class="wrap" style="padding-inline: 0">
            <Secao titulo="O que medimos" />
            <div class="obra" style="font-size: var(--step-0)">
              <p>
                Quase toda notícia de automação nasce em inglês e alemão. Parte dela chega ao
                Brasil semanas depois; parte nunca chega. <strong>Ninguém mede esse intervalo</strong>
                {' '}— e sem medida não há conversa sobre o atraso do parque industrial brasileiro
                que não seja opinião.
              </p>
              <p>
                Todo item que passa pelo radar entra numa base própria, com a data em que saiu
                lá fora e a data da primeira menção brasileira. É dela que sai o Panorama, e é
                ela que vai ser publicada aberta, com DOI, para quem quiser conferir ou
                contestar.
              </p>
            </div>
          </div>
        </section>

        {/* 4 · A notícia. Seção, não a home inteira. */}
        {destaque && (
          <section style="padding-block: var(--space-2xl)">
            <Secao titulo="Do radar" acao={{ texto: 'ver tudo', href: '/industria' }} />
            <Destaque item={destaque} />
          </section>
        )}

        {/* 5 · Obra assinada */}
        {obras.length > 0 && (
          <section style="padding-block: var(--space-2xl); border-top: var(--border-hair)">
            <Secao titulo="Publicações" acao={{ texto: 'panorama', href: '/panorama' }} />
            {obras.map((o) => (
              <ObraNaLista obra={o} />
            ))}
          </section>
        )}

        {/* 6 · Agenda */}
        {eventos.length > 0 && (
          <section style="padding-block: var(--space-2xl); border-top: var(--border-hair)">
            <Secao titulo="Agenda" acao={{ texto: 'calendário completo', href: '/agenda' }} />
            {eventos.map((e) => (
              <EventoNaAgenda evento={e} />
            ))}
          </section>
        )}

        {/* 6.5 · A lista.
            Manufacturing Dive põe a chamada em três pontos fixos; Igarapé
            fecha a home com ela. O motivo é o mesmo: o site é aluguel, a
            lista é propriedade — é o único ativo que sobrevive a mudança de
            domínio, de plataforma e de humor de buscador. */}
        <section style="padding-block: var(--space-2xl)">
          <div class="lista">
            <p class="lista__titulo">O que saiu lá fora, em português, na sua caixa</p>
            <p class="lista__nota">
              Um resumo por semana com o que o setor publicou e o que muda por aqui. Sem
              patrocínio disfarçado de matéria, e sem repassar seu e-mail a ninguém.
            </p>
            <form class="lista__form" method="post" action="/assinar">
              <div aria-hidden="true" style="position:absolute; left:-9999px">
                <label>
                  Não preencha
                  <input type="text" name="sitio" tabindex={-1} autocomplete="off" />
                </label>
              </div>
              <label class="u-visually-hidden" for="email-lista">
                Seu e-mail
              </label>
              <input
                class="campo"
                id="email-lista"
                type="email"
                name="email"
                required
                placeholder="seu@email.com.br"
              />
              <button type="submit" class="botao-acao" style="border:0; cursor:pointer">
                Quero receber
              </button>
            </form>
            {q.assinado === '1' ? (
              <p class="lista__rodape">
                <strong>Anotado.</strong> O primeiro envio sai quando houver o que mandar — a
                lista não serve para avisar que a lista existe.
              </p>
            ) : q.assinado === 'erro' ? (
              <p class="lista__rodape">Esse e-mail não parece válido. Confere e tenta de novo?</p>
            ) : (
              <p class="lista__rodape">
                Ainda não enviamos nada: a lista começa agora, e o primeiro envio sai quando
                houver conteúdo que justifique.
              </p>
            )}
          </div>
        </section>

        {/* 7 · Como trabalhamos — a credibilidade, declarada na home */}
        <section
          id="como-trabalhamos"
          style="padding-block: var(--space-2xl); border-top: var(--border-hair); scroll-margin-top: 4rem"
        >
          <Secao titulo="Como trabalhamos" />
          <div style="display:grid; gap:var(--space-l); grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))">
            <div>
              <h3 style="font-size: var(--step-1)">Só publicamos o que a fonte autoriza</h3>
              <p class="u-muted" style="font-size: var(--step--1); margin-block-start: var(--space-2xs)">
                Tradução integral apenas de material liberado para imprensa. Do restante, resumo
                próprio com crédito e link. A regra está no código, não na intenção — e o{' '}
                <a href="/blueprints">inventário de fontes</a> mostra a autorização de cada uma.
              </p>
            </div>
            <div>
              <h3 style="font-size: var(--step-1)">Dizemos onde a IA entra</h3>
              <p class="u-muted" style="font-size: var(--step--1); margin-block-start: var(--space-2xs)">
                A tradução e a triagem são feitas por máquina, e o item avisa quando ainda não
                passou por revisão humana. O que é juízo do Instituto vem rotulado como tal, e o{' '}
                <a href="/glossario">glossário</a> que trava os termos técnicos é público.
              </p>
            </div>
            <div>
              <h3 style="font-size: var(--step-1)">O radar e a agenda não têm autor</h3>
              <p class="u-muted" style="font-size: var(--step--1); margin-block-start: var(--space-2xs)">
                São agregação. Análise, Caso e Panorama são assinados — e a responsabilidade
                pelo que está escrito ali é de quem assina.
              </p>
            </div>
          </div>
        </section>
      </Documento>,
    ),
  );
});

/* ----------------------------------------------------------- glossário
 * A infraestrutura de tradução, aberta.
 *
 * Ele já existia como dado — entra no prompt como dicionário obrigatório.
 * Publicá-lo é o mesmo movimento do inventário de fontes: mostrar a régua,
 * não só o resultado. E cresce sozinho conforme as traduções são corrigidas.
 */
app.get('/glossario', async (c) => {
  const termos = await listarGlossario(c.env.DB);
  const traduz = termos.filter((t) => !t.manter_original);
  const mantem = termos.filter((t) => t.manter_original);

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Glossário"
        descricao="Os termos técnicos de automação e como o Instituto os traduz — inclusive os que não se traduzem."
        url={c.env.SITE_URL + '/glossario'}
      >
        <h1>Glossário</h1>
        <div class="obra" style="margin-block-start: var(--space-m)">
          <p class="lead">
            Estes termos não são sugestão: entram travados no prompt de tradução. Vocabulário de
            automação em português é traiçoeiro, e uma máquina traduzindo cru erra na primeira
            linha — o engenheiro percebe antes do segundo parágrafo.
          </p>
        </div>

        <div style="margin-block-start: var(--space-2xl)">
          <Secao titulo={`Traduções travadas · ${traduz.length}`} />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            Têm equivalente consagrado no setor, e ele é obrigatório.
          </p>
          {traduz.map((t) => (
            <div class="termo">
              <div class="termo__par">
                <span class="termo__origem">{t.termo_origem}</span>
                <span class="termo__seta">→</span>
                <span class="termo__pt">{t.termo_pt}</span>
                <span class="termo__travado">{t.idioma}</span>
              </div>
              {t.nota && <p class="termo__nota">{t.nota}</p>}
            </div>
          ))}
        </div>

        <div style="margin-block-start: var(--space-2xl)">
          <Secao titulo={`Não se traduzem · ${mantem.length}`} />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            Ficam na língua de origem, com o significado aproximado na primeira ocorrência.
            Inventar um equivalente em português que ninguém usa no chão de fábrica é pior que
            manter o estrangeirismo: denuncia tradução automática e queima o texto inteiro.
          </p>
          {mantem.map((t) => (
            <div class="termo">
              <div class="termo__par">
                <span class="termo__origem">{t.termo_origem}</span>
                <span class="termo__seta">→</span>
                <span class="termo__pt">mantém {t.termo_origem}</span>
                <span class="termo__travado">{t.idioma}</span>
              </div>
              {t.nota && <p class="termo__nota">({t.nota})</p>}
            </div>
          ))}
        </div>
      </Documento>,
    ),
  );
});

/* ---------------------------------------------------------- blueprints
 * O que o The Markup chama de Blueprints: dataset, metodologia e processo
 * publicados como SEÇÃO, não como anexo. Anexo ninguém acha; seção tem
 * endereço e é citada.
 */
app.get('/blueprints', async (c) => {
  const [fontes, correcoes, atraso] = await Promise.all([
    inventarioFontes(c.env.DB),
    listarCorrecoes(c.env.DB),
    medirAtraso(c.env.DB),
  ]);
  const liberadas = fontes.filter((f) => f.licenca === 'liberada');
  const relogio = fontes.filter((f) => f.marca_relogio);

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Blueprints"
        descricao="Nossos dados, nosso método e nossas fontes — abertos para conferência."
        url={c.env.SITE_URL + '/blueprints'}
      >
        <h1>Blueprints</h1>
        <div class="obra" style="margin-block-start: var(--space-m)">
          <p class="lead">
            Nossos dados, nosso método e as licenças de cada fonte. Se você quiser conferir,
            contestar ou ampliar o que publicamos, comece por aqui.
          </p>
        </div>

        {/* --- o inventário: a regra central exposta para conferência --- */}
        <div style="margin-block-start: var(--space-2xl)">
          <Secao titulo={`As fontes e suas licenças · ${fontes.length}`} />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            <strong>Tradução integral só de fonte que autoriza.</strong> A coluna da direita traz
            o link da página que dá essa autorização — é a nossa prova de que nada foi
            republicado sem permissão, e não um pedido para acreditar na gente.
          </p>
          <div class="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>Fonte</th>
                  <th>Origem</th>
                  <th>O que podemos fazer</th>
                  <th>Autorização</th>
                </tr>
              </thead>
              <tbody>
                {fontes.map((f) => (
                  <tr>
                    <td>
                      <a href={f.url_site} rel="nofollow noopener" target="_blank">
                        {f.nome}
                      </a>
                      {Boolean(f.marca_relogio) && (
                        <span class="u-faint"> · marca o relógio</span>
                      )}
                    </td>
                    <td class="u-dado">
                      {f.pais} · {f.idioma}
                    </td>
                    <td>
                      <span class={`licenca licenca--${f.licenca}`}>
                        {f.licenca === 'liberada'
                          ? 'tradução integral'
                          : f.licenca === 'resumo'
                            ? 'só resumo próprio'
                            : 'não coletamos'}
                      </span>
                    </td>
                    <td>
                      {f.licenca_evidencia ? (
                        <a href={f.licenca_evidencia} rel="nofollow noopener" target="_blank">
                          termos
                        </a>
                      ) : (
                        <span class="u-faint">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p class="u-faint" style="font-size: var(--step--2); margin-block-start: var(--space-s)">
            {liberadas.length} de {fontes.length} fontes autorizam tradução integral.{' '}
            {relogio.length} são brasileiras e não são publicadas: existem para medir quando o
            assunto chegou aqui.
          </p>
        </div>

        {/* --- método --- */}
        <div style="margin-block-start: var(--space-2xl)">
          <Secao titulo="Como medimos o atraso" />
          <div class="obra" style="font-size: var(--step-0)">
            <p>
              Cada item coletado é agrupado num <strong>assunto</strong> — a mesma notícia
              publicada por fontes e em idiomas diferentes. O agrupamento usa título
              normalizado, fornecedores citados em comum e uma janela de 30 dias.
            </p>
            <p>
              O atraso é a diferença entre a <strong>primeira publicação em qualquer lugar</strong>{' '}
              e a <strong>primeira menção em fonte brasileira</strong>. Só a primeira menção
              conta.
            </p>
            <p>
              <strong>Assunto que fica sem menção brasileira não é falha de coleta.</strong> É o
              achado: é o que o setor lançou lá fora e nunca chegou aqui. Hoje temos{' '}
              {atraso.medidos} assunto{atraso.medidos === 1 ? '' : 's'} com atraso apurado.
            </p>
            <p>
              <em>Limitações declaradas:</em> o agrupamento por título erra quando duas notícias
              diferentes usam palavras muito parecidas, e acerta menos entre idiomas distantes.
              Fonte que bloqueia robô não entra — e duas das principais publicações técnicas do
              setor bloqueiam.
            </p>
          </div>
        </div>

        {/* --- IA --- */}
        <div style="margin-block-start: var(--space-2xl)">
          <Secao titulo="Como usamos inteligência artificial" />
          <div class="obra" style="font-size: var(--step-0)">
            <p>
              <strong>A IA decide sozinha:</strong> se um item é notícia ou ruído, em que núcleo
              ele entra, e o resumo em português.
            </p>
            <p>
              <strong>A IA escreve, e a licença manda:</strong> a tradução integral só acontece
              quando a fonte autoriza, e essa checagem é feita no banco, não pelo modelo.
            </p>
            <p>
              <strong>A IA nunca decide:</strong> se uma fonte pode ser traduzida, se um evento
              entra na agenda, ou o que é publicado com assinatura.
            </p>
            <p>
              Item traduzido que ainda não passou por olho humano vai ao ar{' '}
              <strong>com o selo dizendo isso</strong>. O selo some quando alguém revisa.
            </p>
          </div>
        </div>

        {/* --- correções --- */}
        <div style="margin-block-start: var(--space-2xl)">
          <Secao titulo={`Correções · ${correcoes.length}`} />
          {correcoes.length === 0 ? (
            <Aviso>
              <strong>Nenhuma correção até agora.</strong> Quando houver, ela aparece aqui com
              data e com o que mudou — e o texto original não é apagado. Registro que some não
              é registro.
            </Aviso>
          ) : (
            correcoes.map((k) => (
              <div class="termo">
                <p class="termo__nota">
                  <span class="u-dado">{dataBR(k.data, false)}</span> — {k.texto}
                </p>
              </div>
            ))
          )}
        </div>

        {/* --- dataset --- */}
        <div style="margin-block-start: var(--space-2xl)">
          <Secao titulo="O dataset" />
          <Aviso>
            <strong>Ainda não publicado.</strong> O conjunto de dados sai com DOI e licença
            CC-BY quando houver o primeiro trimestre de coleta — publicar uma base vazia seria a
            única forma de estragá-la. Enquanto isso, a tabela de fontes acima já mostra o que
            está sendo coletado e sob que autorização.
          </Aviso>
        </div>
      </Documento>,
    ),
  );
});

/* ------------------------------------------------------------ assinar */
app.post('/assinar', async (c) => {
  const f = await c.req.formData();
  const email = String(f.get('email') ?? '').trim().slice(0, 200);
  const sitio = String(f.get('sitio') ?? '').trim();

  // Robô: devolve sucesso sem gravar. Ele acha que funcionou.
  if (sitio) return c.redirect('/?assinado=1', 303);

  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!valido) return c.redirect('/?assinado=erro', 303);

  await assinar(c.env.DB, email, 'capa');
  // Sempre a mesma resposta, tenha ou não gravado: dizer "já existe"
  // entregaria a terceiros quem está na lista.
  return c.redirect('/?assinado=1', 303);
});

/* --------------------------------------------------------------- a obra
 * Análise, Caso e Panorama têm página própria e URL sem núcleo: obra é para
 * durar, e núcleo pode mudar de nome antes do texto envelhecer.
 * A Leitura NÃO tem página: vive dentro do item que comenta.
 *
 * ⚠️ Três caminhos EXPLÍCITOS, e antes de /:nucleo/:slug. A versão anterior
 * usava um parâmetro com alternância na própria rota; explícito não depende
 * de como o roteador interpreta a expressão.
 */
for (const formato of ['analise', 'caso', 'panorama'] as const) {
  app.get(`/${formato}/:slug`, async (c) => {
    const o = await obterObra(c.env.DB, formato as FormatoObra, c.req.param('slug'));
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
              Comenta: <a href={`/${o.item_nucleo}/${o.item_slug}`}>{o.item_titulo}</a>
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
}

/* ------------------------------------------------------------------ núcleo */
app.get('/:nucleo', async (c) => {
  const chave = c.req.param('nucleo');
  if (!ehNucleo(chave)) return c.notFound();

  const n = NUCLEOS[chave];
  const v = c.req.query('v');
  const filtrandoVeredito = v && ROTULO_VEREDITO[v] ? v : undefined;

  const [todos, obras, manchete] = await Promise.all([
    listarRadar(c.env.DB, chave, 40),
    listarObras(c.env.DB, { nucleo: chave }, 5),
    itemDestaque(c.env.DB, chave),
  ]);

  // O filtro por veredito é o que dá rosto à pergunta-assinatura: a lista do
  // que o setor lançou lá fora e não chegou aqui.
  const itens = filtrandoVeredito
    ? todos.filter((i) => i.contexto_veredito === filtrandoVeredito)
    : todos.filter((i) => i.id !== manchete?.id);

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento titulo="Radar" nucleo={chave} descricao={n.resumo} url={`${c.env.SITE_URL}/${chave}${filtrandoVeredito ? `?v=${filtrandoVeredito}` : ''}`}>
        <h1>{n.nome}</h1>
        <p class="u-muted" style="max-width: var(--measure); margin-block-start: var(--space-2xs)">
          {n.resumo}
        </p>

        {!n.quente && (
          <div style="margin-block-start: var(--space-m)">
            <EmRadar nucleo={chave} />
          </div>
        )}

        {/* Filtro por veredito — cada recorte com URL própria, sem JS. */}
        <div class="filtro" style="margin-block-start: var(--space-m)">
          <span class="filtro__rotulo">O que muda aqui</span>
          <a class="pilula" href={`/${chave}`} aria-current={!filtrandoVeredito ? 'true' : undefined}>
            Tudo
          </a>
          {Object.keys(ROTULO_VEREDITO).map((k) => (
            <a
              class="pilula"
              href={`/${chave}?v=${k}`}
              aria-current={filtrandoVeredito === k ? 'true' : undefined}
            >
              {ROTULO_VEREDITO[k]}
            </a>
          ))}
        </div>

        {manchete && !filtrandoVeredito && (
          <div style="margin-block-start: var(--space-xl)">
            <Destaque item={manchete} />
          </div>
        )}

        {/* Sob filtro de veredito a obra sai: ela não tem veredito, e mostrá-la
            ali entregaria lista misturada onde a página prometeu um recorte. */}
        {obras.length > 0 && !filtrandoVeredito && (
          <div style="margin-block-start: var(--space-xl)">
            <Secao titulo="Obra" />
            {obras.map((o) => (
              <ObraNaLista obra={o} />
            ))}
          </div>
        )}

        <div style="margin-block-start: var(--space-xl)">
          <Secao
            titulo={
              filtrandoVeredito
                ? `Radar · ${ROTULO_VEREDITO[filtrandoVeredito]}`
                : `Radar · ${n.nome}`
            }
          />
          {itens.length === 0 ? (
            <Aviso>
              {filtrandoVeredito ? (
                <>
                  <strong>Nenhum item com este veredito ainda.</strong>{' '}
                  <a href={`/${chave}`}>Ver o radar inteiro</a>.
                </>
              ) : (
                <>
                  <strong>Ainda não há itens aqui.</strong> O radar publica assim que a coleta
                  encontrar algo que passe na triagem.
                </>
              )}
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

        {/* A maior ambiguidade do produto, resolvida com uma palavra: o que
            está acima é apuração de terceiro; o que vem abaixo é juízo do
            Instituto. Semafor deu a ideia, Aos Fatos deu a forma. */}
        <div style="margin-block-start: var(--space-l)">
          <span class="camada">O que a fonte diz</span>
          <div class="obra" style="margin-block-start: var(--space-2xs)">
            {(i.corpo ?? i.resumo ?? '')
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((par) => (
                <p>{par}</p>
              ))}
          </div>
        </div>

        {i.contexto_br && (
          <>
            <div
              class="item__contexto"
              style="margin-block-start: var(--space-xl); max-width: var(--measure)"
            >
              {i.contexto_veredito && (
                <p style="margin-block-end: var(--space-2xs)">
                  <Veredito valor={i.contexto_veredito} />
                </p>
              )}
              {i.contexto_br}
            </div>
            <p
              class="u-faint"
              style="margin-block-start: var(--space-s); font-size: var(--step--2); max-width: var(--measure)"
            >
              O veredito e o parágrafo acima são <strong>redação do Instituto</strong> e seguem
              critério público. O texto anterior é da fonte.
            </p>
          </>
        )}

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
