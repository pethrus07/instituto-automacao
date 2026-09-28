/**
 * A agenda: a listagem com filtros, o envio de evento e a página de cada um.
 *
 * Tudo vem do D1 (tabela `evento`), nunca do conteúdo compilado: evento chega
 * pelo formulário público, e o que o organizador envia não pode passar por
 * commit. Três rotas:
 *
 *   GET  /agenda            só eventos com status 'publicado' que ainda não
 *                           terminaram; filtros por URL (?t= tema, ?f= formato,
 *                           ?o= br|fora) — cada combinação é uma página própria,
 *                           mas a canônica é /agenda e a filtrada leva noindex
 *   POST /agenda/enviar     valida no servidor (nome, data futura, honeypot) e
 *                           grava com status 'coletado'. NADA aparece antes de
 *                           alguém conferir a data no site oficial e mudar o
 *                           status no banco — agenda com data errada não serve
 *   GET  /agenda/:slug      a página do evento, com schema.org/Event
 *
 * A capa mostra os 3 próximos pelo mesmo `listarAgenda` de db.ts.
 */
import { Documento } from '../ui/Documento';
import { Aviso, Vazio, Secao, EventoNaAgenda, FiltroAgenda, FormularioEvento, periodoEvento, nomeTema } from '../ui/pecas';
import { ldJson, eventoLd, agendaLd, trilhaLd } from '../ui/jsonld';
import { CACHE, TEMAS, ORDEM_TEMAS, ehTema } from '../config';
import { listarAgenda, obterEvento, contarAgenda, type FiltroAgenda as TipoFiltroAgenda } from '../db';
import { passouDoLimite } from './limite';
import { novaApp, pagina } from './app';

export const agenda = novaApp();

agenda.get('/agenda', async (c) => {
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
  const site = c.env.SITE_URL;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Agenda"
        secao="agenda"
        descricao={`Feiras, congressos e encontros de automação no Brasil e no exterior, em um calendário só: ${contagem.total} eventos à frente, ${contagem.brasil} no Brasil.`}
        // a versão filtrada aponta para a agenda inteira: uma URL canônica, várias visões
        url={`${site}/agenda`}
        naoIndexar={filtrando}
        ld={[
          ...(eventos.length ? [ldJson(agendaLd(eventos, site))] : []),
          ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Agenda', url: `${site}/agenda` }])),
        ]}
      >
        <header class="cabeca-secao">
          <h1>Agenda</h1>
          <p class="cabeca-secao__lead">
            Feiras, congressos e encontros de automação — no Brasil e lá fora. {contagem.total} evento
            {contagem.total === 1 ? '' : 's'} à frente, {contagem.brasil} no Brasil. Organiza um?{' '}
            <a href="#enviar">Mande para cá</a> — listar é de graça, e toda data é conferida no site
            oficial antes de entrar.
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
            eventos.map((e) => <EventoNaAgenda evento={e} nivel="h2" />)
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

agenda.post('/agenda/enviar', async (c) => {
  if (await passouDoLimite(c)) return c.text('Muitos envios seguidos deste endereço. Espere um minuto e tente de novo.', 429);
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
        <Documento titulo="Envio não aceito" naoIndexar>
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

agenda.get('/agenda/:slug', async (c) => {
  const e = await obterEvento(c.env.DB, c.req.param('slug'));
  if (!e) return c.notFound();

  const local =
    e.formato === 'online' ? 'Online' : [e.cidade, e.pais === 'BR' ? e.uf : e.pais].filter(Boolean).join(' · ');
  const passou = (e.fim ?? e.inicio).slice(0, 10) < new Date().toISOString().slice(0, 10);
  const site = c.env.SITE_URL;
  const url = `${site}/agenda/${e.slug}`;

  c.header('Cache-Control', CACHE.item);
  return c.html(
    pagina(
      <Documento
        titulo={e.nome}
        secao="agenda"
        descricao={e.descricao ?? `${e.nome} — ${periodoEvento(e.inicio, e.fim)}, ${local}.`}
        url={url}
        ld={[ldJson(eventoLd(e, site)), ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Agenda', url: `${site}/agenda` }, { nome: e.nome, url }]))]}
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
