/**
 * Instituto Automação — um Worker só.
 *
 * Serve as páginas a partir do conteúdo compilado (conteudo/**.md →
 * src/conteudo.gerado.ts) e roda o coletor no cron. É tudo. Não há IA em
 * produção, não há pipeline, não há banco de conteúdo — o git é o CMS.
 *
 * ⚠️ Rota de caminho fixo antes de qualquer curinga. O roteador casa na
 * ordem, e um `/:x` cedo demais engole tudo o que vem depois.
 */
import { Hono, type Context } from 'hono';
import { raw } from 'hono/html';
import { Documento } from './ui/Documento';
import {
  Kicker, Selo, Secao, Aviso, Vazio, Numero, dataBR, dataPeca,
  EventoNaAgenda, FiltroAgenda, FormularioEvento, periodoEvento, nomeTema,
  Arte, Etiquetas, AssinaturaPeca, PecaDestaque, PecaCard, PecaLinha,
  FonteCaixa, VereditoCaixa, Veredito, ROTULO_VEREDITO, EXPLICA_VEREDITO,
} from './ui/pecas';
import { ldJson, eventoLd, agendaLd } from './ui/jsonld';
import { renderizarObra } from './ui/markdown';
import { favicon, simbolo } from './ui/marca';
import { feed, sitemap, robots } from './feed';
import { CSS, CSS_ROTA, CSS_HASH } from './estilo';
import { CACHE, REDIRECTS_V1, TEMAS, ORDEM_TEMAS, ehTema, type Env } from './config';
import {
  relogio as medirRelogio, saudeColeta,
  listarAgenda, obterEvento, contarAgenda, type FiltroAgenda as TipoFiltroAgenda,
  listarGlossario, inventarioFontes, listarCorrecoes, assinar,
} from './db';
import {
  todas, porSecao, obter, destaque, recentes, ultimoGiro, caminho,
  ROTULO_SECAO, ROTULO_TEMA, SECOES, type Secao as ChaveSecao, type Peca,
} from './conteudo';
import { coletar } from './coletor';

const app = new Hono<{ Bindings: Env }>();
const pagina = (no: unknown) => `<!doctype html>${String(no)}`;

const ehSecao = (v: string): v is ChaveSecao => (SECOES as readonly string[]).includes(v);

/* ================================================================ estático */

app.get('/a/:arquivo', (c) => {
  if (!c.req.param('arquivo').endsWith('.css')) return c.notFound();
  c.header('Content-Type', 'text/css; charset=utf-8');
  c.header('Cache-Control', CACHE.estatico);
  return c.body(CSS);
});

app.get('/favicon.svg', (c) => {
  c.header('Content-Type', 'image/svg+xml; charset=utf-8');
  c.header('Cache-Control', CACHE.estatico);
  return c.body(favicon());
});

app.get('/saude', async (c) => {
  const t0 = Date.now();
  let db = 'ok';
  let coleta: { ultima: string | null; horas: number | null } = { ultima: null, horas: null };
  try {
    coleta = await saudeColeta(c.env.DB);
  } catch (e) {
    db = `erro: ${(e as Error).message}`;
  }
  return c.json({
    ok: db === 'ok',
    db,
    pecas: todas().length,
    coleta,
    css: CSS_HASH,
    rota_css: CSS_ROTA,
    ms: Date.now() - t0,
  });
});

/* =========================================================== distribuição */

app.get('/feed.xml', (c) => {
  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  c.header('Cache-Control', CACHE.listagem);
  return c.body(feed(c.env));
});

app.get('/feed/:arquivo', (c) => {
  const nome = c.req.param('arquivo').replace(/\.xml$/, '');
  if (!ehSecao(nome)) {
    // os quatro feeds de núcleo da v1 continuam sendo pedidos por leitor de feed
    if (['industria', 'observatorio', 'operacao', 'edificacoes'].includes(nome)) {
      return c.redirect('/feed.xml', 301);
    }
    return c.notFound();
  }
  c.header('Content-Type', 'application/rss+xml; charset=utf-8');
  c.header('Cache-Control', CACHE.listagem);
  return c.body(feed(c.env, nome));
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

/* ================================================================== a capa
 * Uma peça manda. Depois as seguintes, o relógio, a agenda, o giro e a
 * lista. Com pouco conteúdo, cada bloco tem de ter razão de existir — e o
 * espaço entre eles é o que separa "curado" de "abandonado".
 */
app.get('/', async (c) => {
  const q = c.req.query();
  const principal = destaque();
  const seguintes = recentes(3, principal);
  const giro = ultimoGiro();
  const relatorios = porSecao('relatorios');
  const [rel, eventos] = await Promise.all([medirRelogio(c.env.DB), listarAgenda(c.env.DB, {}, 3)]);

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Instituto Automação"
        descricao="O que o setor de automação publica lá fora, lido daqui: notícias escolhidas e escritas em português, relatórios com dado próprio, e a medição de quanto tempo cada assunto leva para chegar ao Brasil."
        url={c.env.SITE_URL + '/'}
      >
        {principal ? (
          <PecaDestaque peca={principal} principal />
        ) : (
          <Vazio titulo="A primeira peça está a caminho.">
            O Instituto publica pouco e escolhido: notícias lidas na fonte e escritas em
            português, e relatórios com dado que só nós temos. Enquanto a primeira não sai, a{' '}
            <a href="/agenda">agenda</a> e o <a href="/blueprints">método</a> já estão aqui.
          </Vazio>
        )}

        {seguintes.length > 0 && (
          <section class="bloco">
            <Secao titulo="Também nesta semana" acao={{ texto: 'todas as notícias', href: '/noticias' }} />
            <div class="grade">
              {seguintes.map((p) => (
                <PecaCard peca={p} />
              ))}
            </div>
          </section>
        )}

        {/* O relógio — a pergunta-assinatura, medida. Faixa escura de ponta
            a ponta: é o único bloco com massa da página, e é o que o
            Instituto tem que ninguém tem. */}
        <section class="faixa-relogio sangra">
          <div class="wrap faixa-relogio__miolo" style="padding-inline: 0">
            <div class="faixa-relogio__texto">
              <span class="faixa-relogio__kicker">O que medimos</span>
              <h2 class="faixa-relogio__titulo">Quanto tempo a automação leva para chegar ao Brasil?</h2>
              <p class="faixa-relogio__lead">
                Todo assunto que o setor publica lá fora entra numa base própria, com a data em que
                saiu e a data da primeira menção em fonte brasileira. Ninguém mede esse intervalo — e
                sem medida, toda conversa sobre o atraso do parque industrial daqui é opinião.
              </p>
              <a href="/blueprints" class="faixa-relogio__link">Como medimos, e o que ainda não conseguimos medir</a>
            </div>
            <div class="faixa-relogio__numeros">
              <Numero valor={rel.acompanhados} rotulo="assuntos acompanhados" />
              <Numero valor={rel.fontes} rotulo="fontes lidas todo dia" />
              <Numero
                valor={rel.mediana_dias !== null ? `${rel.mediana_dias} d` : '—'}
                rotulo={rel.mediana_dias !== null ? 'atraso mediano até a primeira menção aqui' : 'atraso mediano: ainda sem par medido'}
              />
              <Numero valor={rel.sem_mencao} rotulo="publicados lá fora há mais de 90 dias e nunca mencionados aqui" />
            </div>
          </div>
        </section>

        <div class="duas-colunas">
          <section class="bloco">
            <Secao titulo="Relatórios" acao={relatorios.length ? { texto: 'todos', href: '/relatorios' } : undefined} />
            {relatorios.length > 0 ? (
              relatorios.slice(0, 3).map((p) => <PecaLinha peca={p} />)
            ) : (
              <Vazio titulo="O primeiro relatório sai com dado próprio, não com opinião.">
                Caso com custo aberto de uma automação real; análise a partir da nossa base; o
                Panorama trimestral do relógio. Nenhum deles se escreve antes de haver o que medir —
                e o primeiro está em apuração.
              </Vazio>
            )}
          </section>

          <section class="bloco">
            <Secao titulo="Agenda" acao={{ texto: 'calendário completo', href: '/agenda' }} />
            {eventos.length > 0 ? (
              eventos.map((e) => <EventoNaAgenda evento={e} />)
            ) : (
              <Vazio titulo="A agenda está aberta.">
                Organiza um evento de automação? <a href="/agenda#enviar">Mande para cá</a> — listar
                é de graça, e todo envio passa por conferência antes de aparecer.
              </Vazio>
            )}
          </section>
        </div>

        {giro && (
          <section class="bloco">
            <Secao titulo="Giro da Semana" acao={{ texto: 'edições anteriores', href: '/giro' }} />
            <PecaLinha peca={giro} />
          </section>
        )}

        {/* A lista. Site é aluguel, lista é propriedade. */}
        <section class="bloco">
          <div class="lista">
            <div>
              <p class="lista__titulo">O Giro da Semana na sua caixa, quando ele nascer.</p>
              <p class="lista__nota">
                Um e-mail por semana com o que o setor publicou e o que muda por aqui. Ainda não
                enviamos nada — a lista começa agora, e o primeiro envio sai quando houver o que
                mandar. Sem repassar seu e-mail a ninguém.
              </p>
            </div>
            <form class="lista__form" method="post" action="/assinar">
              <div aria-hidden="true" style="position:absolute; left:-9999px">
                <label>
                  Não preencha
                  <input type="text" name="sitio" tabindex={-1} autocomplete="off" />
                </label>
              </div>
              <label class="u-visually-hidden" for="email-lista">Seu e-mail</label>
              <input class="campo" id="email-lista" type="email" name="email" required placeholder="seu@email.com.br" />
              <button type="submit" class="botao-acao" style="border:0; cursor:pointer">Quero receber</button>
              {q.assinado === '1' ? (
                <p class="lista__rodape"><strong>Anotado.</strong> Você vai saber quando o primeiro sair.</p>
              ) : q.assinado === 'erro' ? (
                <p class="lista__rodape">Esse e-mail não parece válido. Confere e tenta de novo?</p>
              ) : null}
            </form>
          </div>
        </section>
      </Documento>,
    ),
  );
});

/* ================================================================= seções */

const DESCRICAO_SECAO: Record<ChaveSecao, string> = {
  noticias:
    'O que o setor de automação publicou lá fora, lido na fonte e escrito em português — com o que cada coisa muda para quem opera no Brasil.',
  relatorios:
    'O que apuramos com dado próprio: casos com custo aberto, análises a partir da nossa base, e o Panorama do relógio.',
  giro: 'O balanço da semana: o que aconteceu, o que importou, o que ficou de fora e por quê.',
};

const VAZIO_SECAO: Record<ChaveSecao, { titulo: string; texto: string }> = {
  noticias: {
    titulo: 'A primeira notícia está a caminho.',
    texto: 'Lemos as fontes todo dia. A peça só sai depois de escolhida, escrita e lida — e a primeira está nessa fila.',
  },
  relatorios: {
    titulo: 'O primeiro relatório sai com dado próprio, não com opinião.',
    texto: 'Caso com custo aberto, análise da nossa base, o Panorama do relógio. Nenhum se escreve antes de haver o que medir.',
  },
  giro: {
    titulo: 'O primeiro Giro sai na segunda-feira seguinte à primeira semana cheia.',
    texto: 'Ele cobre a semana que fechou no domingo — o que aconteceu, o que virou peça, o que ficou de fora e por quê.',
  },
};

app.get('/noticias', (c) => secao(c, 'noticias'));
app.get('/relatorios', (c) => secao(c, 'relatorios'));
app.get('/giro', (c) => secao(c, 'giro'));

function secao(c: Context<{ Bindings: Env }>, s: ChaveSecao) {
  const pecas = porSecao(s);
  const [primeira, ...resto] = pecas;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento titulo={ROTULO_SECAO[s]} secao={s} descricao={DESCRICAO_SECAO[s]} url={`${c.env.SITE_URL}/${s}`}>
        <header class="cabeca-secao">
          <h1>{ROTULO_SECAO[s]}</h1>
          <p class="cabeca-secao__lead">{DESCRICAO_SECAO[s]}</p>
        </header>

        {!primeira ? (
          <Vazio titulo={VAZIO_SECAO[s].titulo}>{VAZIO_SECAO[s].texto}</Vazio>
        ) : (
          <>
            <PecaDestaque peca={primeira} />
            {resto.length > 0 && (
              <section class="bloco">
                <div class="grade">
                  {resto.slice(0, 6).map((p) => (
                    <PecaCard peca={p} />
                  ))}
                </div>
                {resto.length > 6 && (
                  <div class="bloco">
                    {resto.slice(6).map((p) => (
                      <PecaLinha peca={p} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </Documento>,
    ),
  );
}

/* ================================================================== a peça */

for (const s of SECOES) {
  app.get(`/${s}/:slug`, (c) => {
    const p = obter(s, c.req.param('slug'));
    if (!p) return c.notFound();
    return c.html(pagina(paginaDaPeca(p, c.env)));
  });
}

function paginaDaPeca(p: Peca, env: Env) {
  const html = renderizarObra(p.corpo);
  const outras = porSecao(p.secao).filter((x) => x.slug !== p.slug).slice(0, 3);

  return (
    <Documento
      titulo={p.titulo}
      secao={p.secao}
      descricao={p.lead}
      url={env.SITE_URL + caminho(p)}
      tipoOg="article"
    >
      <article class="peca" data-peca={p.slug} data-formato={p.formato}>
        <header class="peca__cabeca">
          <Etiquetas peca={p} />
          <h1 class="peca__titulo">{p.titulo}</h1>
          <p class="peca__lead">{p.lead}</p>
          <AssinaturaPeca peca={p} completa />
        </header>

        <Arte peca={p} classe="peca__arte" destaque />

        <div class="peca__corpo">
          <div class="obra">{raw(html)}</div>

          <div class="peca__lateral">
            {p.secao === 'noticias' && <VereditoCaixa valor={p.veredito} />}
            <FonteCaixa peca={p} />
          </div>
        </div>

        <footer class="peca__pe">
          <Aviso>
            <strong>Como esta peça foi feita.</strong>{' '}
            {p.fonte
              ? `Lida na fonte, escolhida e escrita por ${p.autor}, com crédito e link. Nada aqui foi traduzido ou redigido por máquina.`
              : `Escrita por ${p.autor} a partir de dado próprio do Instituto. Nada aqui foi redigido por máquina.`}
          </Aviso>
        </footer>
      </article>

      {outras.length > 0 && (
        <section class="bloco">
          <Secao titulo={`Mais em ${ROTULO_SECAO[p.secao]}`} acao={{ texto: 'ver todas', href: `/${p.secao}` }} />
          <div class="grade">
            {outras.map((o) => (
              <PecaCard peca={o} />
            ))}
          </div>
        </section>
      )}
    </Documento>
  );
}

/* ================================================================== agenda */

app.get('/agenda', async (c) => {
  const q = c.req.query();
  const filtro: TipoFiltroAgenda = {};
  if (q.t && ehTema(q.t)) filtro.tema = q.t;
  if (q.f === 'presencial' || q.f === 'online' || q.f === 'hibrido') filtro.formato = q.f;
  if (q.o === 'br' || q.o === 'fora') filtro.onde = q.o;

  const [eventos, contagem] = await Promise.all([listarAgenda(c.env.DB, filtro), contarAgenda(c.env.DB)]);

  const base = new URLSearchParams();
  if (filtro.tema) base.set('t', filtro.tema);
  if (filtro.formato) base.set('f', filtro.formato);
  if (filtro.onde) base.set('o', filtro.onde);
  const filtrando = base.toString().length > 0;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Agenda"
        secao="agenda"
        descricao="Feiras, congressos e encontros de automação no Brasil e no exterior, em um calendário só."
        url={`${c.env.SITE_URL}/agenda${filtrando ? `?${base}` : ''}`}
        ld={eventos.length ? ldJson(agendaLd(eventos, c.env.SITE_URL)) : undefined}
      >
        <header class="cabeca-secao">
          <h1>Agenda</h1>
          <p class="cabeca-secao__lead">
            Feiras, congressos e encontros de automação — no Brasil e lá fora. {contagem.total} evento
            {contagem.total === 1 ? '' : 's'} à frente, {contagem.brasil} no Brasil.
          </p>
        </header>

        {q.enviado === '1' && (
          <div class="bloco--curto">
            <Aviso>
              <strong>Recebido.</strong> O evento entra na agenda depois da conferência de data e local.
            </Aviso>
          </div>
        )}

        <div class="bloco--curto">
          <FiltroAgenda rotulo="Tema" parametro="t" atual={filtro.tema} base={base}
            opcoes={ORDEM_TEMAS.map((k) => ({ valor: k, texto: TEMAS[k].nome }))} />
          <FiltroAgenda rotulo="Formato" parametro="f" atual={filtro.formato} base={base}
            opcoes={[{ valor: 'presencial', texto: 'Presencial' }, { valor: 'online', texto: 'Online' }, { valor: 'hibrido', texto: 'Híbrido' }]} />
          <FiltroAgenda rotulo="Onde" parametro="o" atual={filtro.onde} base={base}
            opcoes={[{ valor: 'br', texto: 'Brasil' }, { valor: 'fora', texto: 'Exterior' }]} />
        </div>

        <div class="bloco">
          {eventos.length === 0 ? (
            filtrando ? (
              <Vazio titulo="Nenhum evento com esses filtros."><a href="/agenda">Ver a agenda inteira</a>.</Vazio>
            ) : (
              <Vazio titulo="A agenda está aberta.">
                Organiza um evento de automação? <a href="#enviar">Mande para cá</a> — listar é de graça.
              </Vazio>
            )
          ) : (
            eventos.map((e) => <EventoNaAgenda evento={e} />)
          )}
        </div>

        <section id="enviar" class="bloco" style="scroll-margin-top: var(--space-l)">
          <Secao titulo="Enviar um evento" />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            Listar é gratuito. Todo envio passa por conferência antes de aparecer — data errada em agenda
            destrói a confiança na agenda inteira.
          </p>
          <FormularioEvento />
        </section>
      </Documento>,
    ),
  );
});

app.post('/agenda/enviar', async (c) => {
  const f = await c.req.formData();
  const texto = (k: string) => String(f.get(k) ?? '').trim().slice(0, 500);

  // Armadilha para robô: campo escondido que humano nunca preenche.
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
          <div class="bloco--curto">
            <Aviso>
              <strong>{erro}</strong> <a href="/agenda#enviar">Voltar ao formulário</a>.
            </Aviso>
          </div>
        </Documento>,
      ),
    );
  }

  const tema = texto('tema');
  const formato = texto('formato');

  // Entra como 'coletado': nada aparece na agenda sem conferência humana.
  await c.env.DB.prepare(
    `INSERT INTO evento (id, nucleo, nome, descricao, inicio, fim, cidade, uf, pais,
                         formato, organizador, url, preco, origem, status)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,'formulario','coletado')`,
  )
    .bind(
      `e-${crypto.randomUUID().slice(0, 12)}`,
      ehTema(tema) ? tema : 'industria',
      nome,
      texto('descricao') || null,
      inicio,
      texto('fim') || null,
      texto('cidade') || null,
      texto('uf').toUpperCase().slice(0, 2) || null,
      texto('pais').toUpperCase().slice(0, 2) || 'BR',
      ['presencial', 'online', 'hibrido'].includes(formato) ? formato : 'presencial',
      texto('organizador') || null,
      texto('url') || null,
      texto('preco') || null,
    )
    .run();

  return c.redirect('/agenda?enviado=1', 303);
});

app.get('/agenda/:slug', async (c) => {
  const e = await obterEvento(c.env.DB, c.req.param('slug'));
  if (!e) return c.notFound();

  const local =
    e.formato === 'online' ? 'Online' : [e.cidade, e.pais === 'BR' ? e.uf : e.pais].filter(Boolean).join(' · ');
  const passou = (e.fim ?? e.inicio).slice(0, 10) < new Date().toISOString().slice(0, 10);

  c.header('Cache-Control', CACHE.item);
  return c.html(
    pagina(
      <Documento
        titulo={e.nome}
        secao="agenda"
        descricao={e.descricao ?? `${e.nome} — ${periodoEvento(e.inicio, e.fim)}, ${local}.`}
        url={`${c.env.SITE_URL}/agenda/${e.slug}`}
        ld={ldJson(eventoLd(e, c.env.SITE_URL))}
      >
        <article class="peca">
          <header class="peca__cabeca">
            <div class="etiquetas">
              <a href="/agenda" class="kicker kicker--dot">Agenda · {nomeTema(e.nucleo)}</a>
            </div>
            <h1 class="peca__titulo">{e.nome}</h1>
            {passou && (
              <Aviso>
                <strong>Este evento já aconteceu.</strong> A página fica no ar para quem chegou por um
                link antigo. Para o que vem pela frente, veja a <a href="/agenda">agenda</a>.
              </Aviso>
            )}
            <div class="assinatura">
              <span class="assinatura__autor u-dado">{periodoEvento(e.inicio, e.fim)}</span>
              <span>{local || '—'}</span>
              <span>{e.formato === 'hibrido' ? 'Híbrido' : e.formato === 'online' ? 'Online' : 'Presencial'}</span>
              {e.preco && <span>{e.preco === 'gratuito' ? 'Gratuito' : e.preco}</span>}
            </div>
          </header>

          {e.descricao && (
            <div class="obra">
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

          <footer class="peca__pe">
            <Aviso>
              <strong>Data e local conferidos na fonte oficial.</strong> Se algo mudou,{' '}
              <a href="/agenda#enviar">avise</a> — agenda com data errada não serve para nada.
            </Aviso>
          </footer>
        </article>
      </Documento>,
    ),
  );
});

/* =============================================================== glossário */

app.get('/glossario', async (c) => {
  const termos = await listarGlossario(c.env.DB);
  const traduz = termos.filter((t) => !t.manter_original);
  const mantem = termos.filter((t) => t.manter_original);

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Glossário"
        secao="glossario"
        descricao="Os termos técnicos de automação e como o Instituto os escreve em português — inclusive os que não se traduzem."
        url={c.env.SITE_URL + '/glossario'}
      >
        <header class="cabeca-secao">
          <h1>Glossário</h1>
          <p class="cabeca-secao__lead">
            A régua pública de como escrevemos. Vocabulário de automação em português é traiçoeiro:
            quem traduz cru erra na primeira linha, e o engenheiro percebe antes do segundo parágrafo.
          </p>
        </header>

        <section class="bloco">
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
        </section>

        <section class="bloco">
          <Secao titulo={`Não se traduzem · ${mantem.length}`} />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            Ficam na língua de origem, com o significado aproximado na primeira ocorrência. Inventar
            equivalente que ninguém usa no chão de fábrica é pior que manter o estrangeirismo.
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
        </section>
      </Documento>,
    ),
  );
});

/* ============================================================== blueprints */

function vereditoRobots(permite: number | null): string {
  if (permite === 1) return 'permite';
  if (permite === 0) return 'não permite';
  return 'não conferido';
}

/* ================================================================ marca */

/**
 * A prancha da marca — PROTOTIPAL. O símbolo é o que o site já usa
 * (src/ui/marca.ts); o nome é Newsreader convertido em caminhos para o SVG
 * viver fora do site. Quando a marca definitiva existir, trocam-se os
 * arquivos em publico/marca/ e a função simbolo(); esta página muda sozinha.
 */
const ARQUIVOS_MARCA = [
  ['logo-horizontal.svg', 'Logo horizontal · cor'],
  ['logo-horizontal-negativo.svg', 'Logo horizontal · negativo (fundo escuro)'],
  ['logo-horizontal-mono.svg', 'Logo horizontal · monocromático (herda a cor do texto)'],
  ['logo-vertical.svg', 'Logo vertical · cor'],
  ['logo-vertical-negativo.svg', 'Logo vertical · negativo'],
  ['logo-vertical-mono.svg', 'Logo vertical · monocromático'],
  ['simbolo.svg', 'Símbolo · cor'],
  ['simbolo-negativo.svg', 'Símbolo · negativo'],
  ['simbolo-mono.svg', 'Símbolo · monocromático'],
  ['icone-quadrado.svg', 'Ícone quadrado · claro (avatar, favicon)'],
  ['icone-quadrado-escuro.svg', 'Ícone quadrado · escuro'],
] as const;

app.get('/marca', (c) => {
  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Marca"
        secao="marca"
        descricao="A marca gráfica do Instituto Automação em versão prototipal: símbolo, nome, cores, construção, regras e arquivos."
        url={c.env.SITE_URL + '/marca'}
      >
        <header class="cabeca-secao">
          <h1>Marca</h1>
          <p class="cabeca-secao__lead">
            Versão <strong>prototipal</strong>. Um anel, um raio que varre e um ponto aceso: o setor lá fora,
            a leitura daqui, o que chega. Vale até a marca definitiva existir — e tudo o que a usa importa de
            um lugar só, então trocá-la é trocar dois arquivos.
          </p>
        </header>

        <section class="bloco">
          <Secao titulo="O símbolo" />
          <div class="prancha">
            <div class="prancha__caixa">
              {raw(simbolo(160))}
              <p class="prancha__legenda">Sobre papel. Azul é a instituição; laranja é o que importa.</p>
            </div>
            <div class="prancha__caixa prancha__caixa--escura">
              <img src="/marca/simbolo-negativo.svg" alt="Símbolo em branco com o ponto laranja, sobre o azul das capas" width="160" height="160" />
              <p class="prancha__legenda">Sobre o azul das capas: o anel vira branco, o ponto continua laranja.</p>
            </div>
            <div class="prancha__caixa">
              <svg viewBox="0 0 64 64" width="160" height="160" role="img" aria-label="Esquema de construção do símbolo: anel, raio a 38 graus, ponto a 62% do raio">
                <circle cx="32" cy="32" r="27" fill="none" stroke="var(--rule)" stroke-width="0.6" stroke-dasharray="1.5 1.5" />
                <line x1="32" y1="2" x2="32" y2="62" stroke="var(--rule)" stroke-width="0.6" stroke-dasharray="1.5 1.5" />
                <line x1="2" y1="32" x2="62" y2="32" stroke="var(--rule)" stroke-width="0.6" stroke-dasharray="1.5 1.5" />
                <path d="M59 32 A27 27 0 0 0 53.28 15.38" fill="none" stroke="var(--acao)" stroke-width="0.8" />
                <line x1="32" y1="32" x2="53.28" y2="15.38" stroke="var(--marca)" stroke-width="1.6" stroke-linecap="round" />
                <circle cx="45.19" cy="21.7" r="4.6" fill="none" stroke="var(--acao)" stroke-width="0.8" />
                <circle cx="32" cy="32" r="2.6" fill="none" stroke="var(--marca)" stroke-width="0.8" />
                <circle cx="32" cy="32" r="27" fill="none" stroke="var(--marca)" stroke-width="0.8" />
              </svg>
              <p class="prancha__legenda">
                Construção em 64 × 64: anel de raio 27 e traço 3,2; raio a −38°; ponto a 62% do raio, com
                raio 4,6; centro com raio 2,6; varredura de 0° ao raio, a 14% de opacidade.
              </p>
            </div>
          </div>
        </section>

        <section class="bloco">
          <Secao titulo="O nome" />
          <div class="prancha">
            <div class="prancha__caixa prancha__caixa--larga">
              <img src="/marca/logo-horizontal.svg" alt="Logo horizontal: símbolo à esquerda, 'Instituto' em peso regular e 'Automação' em negrito, em azul" width="1043" height="134" />
              <p class="prancha__legenda">Horizontal, a forma principal. Newsreader: "Instituto" regular, "Automação" negrito, espaçamento −0,022 em. O símbolo mede 0,86 do corpo do texto e centra na altura das capitulares.</p>
            </div>
            <div class="prancha__caixa prancha__caixa--escura prancha__caixa--larga">
              <img src="/marca/logo-horizontal-negativo.svg" alt="Logo horizontal em branco sobre azul escuro, com o ponto laranja" width="1043" height="134" />
              <p class="prancha__legenda">Negativo, para o azul das capas e fundos escuros.</p>
            </div>
            <div class="prancha__caixa">
              <img src="/marca/logo-vertical.svg" alt="Logo vertical: símbolo grande sobre o nome" width="619" height="262" />
              <p class="prancha__legenda">Vertical, para espaços quadrados: avatar, capa, crachá.</p>
            </div>
            <div class="prancha__caixa prancha__caixa--escura">
              <img src="/marca/logo-vertical-negativo.svg" alt="Logo vertical em branco sobre azul escuro" width="619" height="262" />
              <p class="prancha__legenda">Vertical, negativo.</p>
            </div>
            <div class="prancha__caixa prancha__mono">
              <img src="/marca/logo-horizontal-mono.svg" alt="Logo horizontal monocromático, na cor do texto" width="1043" height="134" />
              <p class="prancha__legenda">Monocromático: herda a cor do texto (<code>currentColor</code>). Para carimbo, gravação, uma cor só.</p>
            </div>
          </div>
        </section>

        <section class="bloco">
          <Secao titulo="Tamanhos" />
          <div class="tamanhos">
            {[16, 24, 32, 44, 64, 96].map((t) => (
              <figure>
                {raw(simbolo(t))}
                <figcaption>{t} px</figcaption>
              </figure>
            ))}
            <figure>
              <img src="/marca/logo-horizontal.svg" alt="" width="140" height="18" />
              <figcaption>140 px · mínimo do horizontal</figcaption>
            </figure>
          </div>
          <p class="u-muted" style="max-width: var(--measure); margin-block-start: var(--space-m)">
            O símbolo sobrevive a 16 px porque tem quatro formas e duas cores, nada mais. O horizontal não
            desce de 140 px: abaixo disso o nome fica ilegível e o símbolo deve ir sozinho.
          </p>
        </section>

        <section class="bloco">
          <Secao titulo="Cores" />
          <div class="amostras">
            <div class="amostra"><div class="amostra__cor" style="background: var(--marca)"></div><span class="amostra__nome">Azul · marca</span><span class="amostra__hex">#0d47a1 · escuro #6f9df3</span></div>
            <div class="amostra"><div class="amostra__cor" style="background: var(--acao)"></div><span class="amostra__nome">Laranja · o ponto</span><span class="amostra__hex">#c2410c · escuro #f97316</span></div>
            <div class="amostra"><div class="amostra__cor" style="background: var(--capa-fundo)"></div><span class="amostra__nome">Azul das capas · fundo escuro</span><span class="amostra__hex">#0a2540</span></div>
            <div class="amostra"><div class="amostra__cor" style="background: var(--paper)"></div><span class="amostra__nome">Papel · fundo claro</span><span class="amostra__hex">o fundo da página</span></div>
          </div>
          <p class="u-muted" style="max-width: var(--measure); margin-block-start: var(--space-m)">
            São as mesmas cores do site, com o mesmo trabalho: azul é a instituição (anel, raio, centro, nome);
            laranja é o que importa (o ponto, e só ele). Nada de gradiente, nada de sombra.
          </p>
        </section>

        <section class="bloco">
          <Secao titulo="Regras" />
          <ul class="regras">
            <li><strong>O ponto fica onde está.</strong> A −38°, a 62% do raio. Mover o ponto é outra marca.</li>
            <li><strong>Não gira.</strong> O raio aponta para cima e para a direita; é a direção de quem lê o que vem de fora.</li>
            <li><strong>Duas cores, sempre as mesmas.</strong> Azul e laranja da paleta; ou uma cor só, no monocromático.</li>
            <li><strong>Fundo: papel ou o azul das capas.</strong> Sobre foto ou fundo colorido, usa-se o ícone quadrado.</li>
            <li><strong>Respiro de meio anel.</strong> Nada encosta na marca a menos de metade da altura do símbolo.</li>
            <li><strong>Nunca sem o ponto.</strong> Sem ele sobra um relógio parado; com ele, um radar que achou algo.</li>
          </ul>
        </section>

        <section class="bloco">
          <Secao titulo="Arquivos" />
          <ul class="lista">
            {ARQUIVOS_MARCA.map(([arquivo, rotulo]) => (
              <li>
                <a href={`/marca/${arquivo}`} download>{rotulo}</a>
                <span class="u-muted"> · </span>
                <code>{arquivo}</code>
              </li>
            ))}
          </ul>
          <Aviso>
            <strong>Prototipal.</strong> Esta marca nasceu do vocabulário das capas geradas para o site ter uma
            identidade enquanto a definitiva não existe. Quando ela existir, substituem-se os arquivos em{' '}
            <code>publico/marca/</code> e a função <code>simbolo()</code> em <code>src/ui/marca.ts</code>; o
            cabeçalho, o favicon, o rodapé e esta página mudam sozinhos.
          </Aviso>
        </section>
      </Documento>,
    ),
  );
});

app.get('/blueprints', async (c) => {
  const [fontes, correcoes, rel] = await Promise.all([
    inventarioFontes(c.env.DB),
    listarCorrecoes(c.env.DB),
    medirRelogio(c.env.DB),
  ]);
  const ativas = fontes.filter((f) => f.ativo);
  const recusadas = fontes.filter((f) => f.robots_permite === 0);
  const relogioBR = fontes.filter((f) => f.marca_relogio && f.ativo);
  const vozes = fontes.filter((f) => f.pessoa && f.ativo);
  const pecas = todas();

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Blueprints"
        secao="blueprints"
        descricao="Nossos dados, nosso método e nossas fontes — abertos para conferência."
        url={c.env.SITE_URL + '/blueprints'}
      >
        <header class="cabeca-secao">
          <h1>Blueprints</h1>
          <p class="cabeca-secao__lead">
            Nossos dados, nosso método e as fontes de cada coisa. Se você quiser conferir, contestar
            ou ampliar o que publicamos, comece por aqui.
          </p>
        </header>

        {/* --- como o Instituto funciona --- */}
        <section class="bloco">
          <Secao titulo="Como funciona" />
          <div class="obra" style="font-size: var(--step-0)">
            <p>
              <strong>A máquina colhe. A gente decide. Alguém escreve. O git publica.</strong> Um
              coletor lê {rel.fontes} fontes todo dia, obedecendo o <code>robots.txt</code> de cada
              uma. O que ele traz vira uma pauta que uma pessoa lê inteira. O que vale virar peça é
              escolhido, escrito em português a partir da fonte e lido de novo antes de sair.
            </p>
            <p>
              <strong>Não há inteligência artificial em produção.</strong> Nenhuma peça deste site foi
              traduzida ou redigida por modelo. Toda peça tem autor, e a responsabilidade pelo que
              está escrito é de quem assina. Hoje são {pecas.length} peça{pecas.length === 1 ? '' : 's'}.
            </p>
          </div>
        </section>

        {/* --- o veredito --- */}
        <section class="bloco" id="veredito" style="scroll-margin-top: var(--space-l)">
          <Secao titulo="O veredito: o que isso muda aqui" />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            Toda notícia recebe uma de quatro categorias. Fechadas de propósito: rótulo aberto vira
            rótulo literário, e a gente quer que dê para discordar.
          </p>
          <div class="grade-vereditos">
            {Object.keys(ROTULO_VEREDITO).map((v) => (
              <div class="veredito-explicado">
                <Veredito valor={v} />
                <p>{EXPLICA_VEREDITO[v]}.</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- o relógio --- */}
        <section class="bloco">
          <Secao titulo="Como medimos o atraso" />
          <div class="obra" style="font-size: var(--step-0)">
            <p>
              Cada item colhido é agrupado num <strong>assunto</strong> — a mesma notícia publicada por
              fontes e em idiomas diferentes. O atraso é a diferença entre a{' '}
              <strong>primeira publicação em qualquer lugar</strong> e a{' '}
              <strong>primeira menção em fonte brasileira</strong>. Só a primeira menção conta.
            </p>
            <p>
              Hoje: {rel.acompanhados} assuntos acompanhados, {rel.medidos} com atraso apurado
              {rel.mediana_dias !== null ? ` (mediana de ${rel.mediana_dias} dias)` : ''}, e {rel.sem_mencao}{' '}
              publicados lá fora há mais de 90 dias sem nenhuma menção aqui.
            </p>
            <p>
              <em>Limitações declaradas:</em> o agrupamento por título erra quando duas notícias
              diferentes usam palavras parecidas, e acerta menos entre idiomas distantes. E a medição
              depende de haver imprensa brasileira especializada cobrindo o mesmo assunto — hoje são{' '}
              {relogioBR.length} fontes marcando o relógio, o que é pouco, e dizemos isso.
            </p>
          </div>
        </section>

        {/* --- o inventário --- */}
        <section class="bloco">
          <Secao titulo={`As fontes · ${ativas.length} ativas`} />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            De onde vem o que lemos. <strong>Fonte que bloqueia robô não entra</strong>, e não tentamos
            contornar: sem trocar a identificação do nosso robô, sem proxy, sem navegador disfarçado.
            Se o <code>robots.txt</code> não puder ser lido, a fonte também fica de fora — sem regra
            legível não há autorização a supor.
          </p>
          <div class="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>Fonte</th>
                  <th>Origem</th>
                  <th>Papel</th>
                  <th>Itens</th>
                  <th>robots.txt</th>
                </tr>
              </thead>
              <tbody>
                {fontes.map((f) => (
                  <tr class={f.ativo ? '' : 'u-faint'}>
                    <td>
                      <a href={f.url_site} rel="nofollow noopener" target="_blank">{f.nome}</a>
                      {f.pessoa && (
                        <>
                          <br />
                          <span class="u-faint" style="font-size: var(--step--2)">voz · {f.pessoa_papel ?? f.pessoa}</span>
                        </>
                      )}
                    </td>
                    <td class="u-dado">{f.pais} · {f.idioma}</td>
                    <td>
                      {!f.ativo ? (
                        <span class="u-faint">desativada</span>
                      ) : f.marca_relogio ? (
                        'marca o relógio'
                      ) : f.pessoa ? (
                        'voz'
                      ) : (
                        'radar'
                      )}
                    </td>
                    <td class="u-dado">{f.itens}</td>
                    <td data-robots={vereditoRobots(f.robots_permite)}>
                      <span class="u-dado">{vereditoRobots(f.robots_permite)}</span>
                      <br />
                      <span class="u-faint" style="font-size: var(--step--2)">{f.robots_motivo ?? 'ainda não consultado'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p class="u-faint" style="font-size: var(--step--2); margin-block-start: var(--space-s)">
            {vozes.length} são <strong>vozes</strong> — pessoa pública que publica com nome próprio, não
            redação. {relogioBR.length} são brasileiras e existem para marcar quando o assunto chegou
            aqui. {recusadas.length > 0 && (
              <>{recusadas.length} {recusadas.length === 1 ? 'está' : 'estão'} fora porque o robots.txt não autoriza — e seguem listadas de propósito.</>
            )}
          </p>
        </section>

        {/* --- correções --- */}
        <section class="bloco">
          <Secao titulo={`Correções · ${correcoes.length}`} />
          {correcoes.length === 0 ? (
            <Aviso>
              <strong>Nenhuma correção até agora.</strong> Quando houver, aparece aqui com data e com o
              que mudou — e o texto original não é apagado. Registro que some não é registro.
            </Aviso>
          ) : (
            correcoes.map((k) => (
              <div class="termo">
                <p class="termo__nota">
                  <span class="u-dado">{dataBR(k.data, false)}</span> — {k.texto}
                  {k.peca && <> (<a href={k.peca}>{k.peca}</a>)</>}
                </p>
              </div>
            ))
          )}
        </section>

        <section class="bloco">
          <Secao titulo="O dataset" />
          <p>
            O primeiro recorte já está público: os <strong>274 itens</strong> colhidos entre 25 de agosto e
            1º de setembro de 2026, com fonte, país, data, título e endereço, em{' '}
            <a href="/dados/2026-09-04-itens-colhidos-25ago-01set.csv">um arquivo CSV</a>. É a base do
            relatório <a href="/relatorios/oito-dias-de-medicao-imprensa-brasileira-e-automacao">Oito dias de medição</a>,
            e serve para conferir a contagem ou refazê-la com outro critério.
          </p>
          <Aviso>
            <strong>A base completa ainda não.</strong> O conjunto de dados inteiro sai com DOI e licença CC-BY
            quando houver o primeiro trimestre de coleta — publicar uma base vazia seria a única forma de
            estragá-la.
          </Aviso>
        </section>
      </Documento>,
    ),
  );
});

/* ================================================================ assinar */

app.post('/assinar', async (c) => {
  const f = await c.req.formData();
  const email = String(f.get('email') ?? '').trim().slice(0, 200);
  const sitio = String(f.get('sitio') ?? '').trim();

  if (sitio) return c.redirect('/?assinado=1', 303);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return c.redirect('/?assinado=erro', 303);

  await assinar(c.env.DB, email, 'capa');
  return c.redirect('/?assinado=1', 303);
});

/* =========================================================== redirects v1
 * Link que alguém guardou é contrato. 301 para a seção que herdou o assunto.
 */
for (const [de, para] of Object.entries(REDIRECTS_V1)) {
  app.get(de, (c) => c.redirect(para, 301));
  app.get(`${de}/:slug`, (c) => c.redirect(para, 301));
}
for (const antigo of ['analise', 'caso']) {
  app.get(`/${antigo}/:slug`, (c) => c.redirect('/relatorios', 301));
}

/* ==================================================================== 404 */

app.notFound((c) =>
  c.html(
    pagina(
      <Documento titulo="Não encontrado">
        <header class="cabeca-secao">
          <h1>Não encontrado</h1>
          <p class="cabeca-secao__lead">
            A página que você procurou não existe, ou ainda não existe. <a href="/">Voltar à capa</a>.
          </p>
        </header>
      </Documento>,
    ),
    404,
  ),
);

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
