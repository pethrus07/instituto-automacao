/**
 * Quem escreve — a lista, a página de cada autor e o convite para escrever.
 *
 * Feedback do sócio (07/09/2026): "um local simples onde fica passando
 * todos os autores… vão diretamente para o currículo do autor. É uma forma
 * dos autores se promoverem através de artigos no Instituto." A página do
 * autor É esse currículo dentro do site: papel, bio, o que publicou, e o
 * link para fora quando ele quiser. Nenhum autor entra sem arquivo em
 * conteudo/autores/ — e nenhuma peça sai sem um deles.
 */
import { raw } from 'hono/html';
import { Documento } from '../ui/Documento';
import { Secao, Aviso, AutorCard, Monograma, PecaLinha, dataPeca } from '../ui/pecas';
import { ldJson, perfilLd, trilhaLd } from '../ui/jsonld';
import { renderizarObra } from '../ui/markdown';
import { CACHE } from '../config';
import { registrarContato } from '../db';
import { autores, autorPorSlug, caminhoAutor, pecasDoAutor } from '../conteudo';
import { passouDoLimite } from './limite';
import { novaApp, pagina } from './app';

export const paginasDeAutor = novaApp();

paginasDeAutor.get('/autores', (c) => {
  const lista = autores();
  const site = c.env.SITE_URL;
  const enviado = c.req.query('enviado') === '1';

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Quem escreve"
        secao="autores"
        descricao="Quem assina os textos do Instituto Automação — e como publicar um artigo aqui, com autoria, página própria e link para o seu currículo."
        url={`${site}/autores`}
        ld={[ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Quem escreve', url: `${site}/autores` }]))]}
      >
        <header class="cabeca-secao">
          <span class="kicker">O Instituto</span>
          <h1>Quem escreve</h1>
          <p class="cabeca-secao__lead">
            Toda notícia, artigo e relatório tem autor, e o autor tem página. O que a pessoa faz, o que já publicou aqui, e
            o caminho para o currículo dela.
          </p>
        </header>

        <div class="grade grade--autores">
          {lista.map((a) => (
            <AutorCard autor={a} pecas={pecasDoAutor(a).length} />
          ))}
        </div>

        {/* O convite para escrever mudou de casa em 27/09/2026: virou a aba
            /escrever, com pautas, padrão e editor. Aqui fica a porta, com a
            âncora antiga (#escrever) viva para quem guardou o link. */}
        <section class="bloco" id="escrever" style="scroll-margin-top: var(--space-2xl)">
          <Secao
            titulo="Escreva no Instituto"
            nota="Escolha uma pauta — ela já vem com o esqueleto pronto —, escreva no editor e publique com o seu nome e a sua página."
            acao={{ texto: 'escolher uma pauta', href: '/escrever' }}
          />
          {enviado && (
            <Aviso>
              <strong>Recebido.</strong> Alguém lê e responde pelo e-mail que você deixou — não é resposta automática,
              então pode levar uns dias.
            </Aviso>
          )}
        </section>
      </Documento>,
    ),
  );
});

paginasDeAutor.get('/autores/:slug', (c) => {
  const a = autorPorSlug(c.req.param('slug'));
  if (!a) return c.notFound();
  const pecas = pecasDoAutor(a);
  const site = c.env.SITE_URL;
  const url = site + caminhoAutor(a);
  const desde = pecas.length ? pecas[pecas.length - 1]!.data : null;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo={a.nome}
        secao="autores"
        descricao={`${a.nome}, ${a.papel.toLowerCase()} do Instituto Automação: ${pecas.length} ${pecas.length === 1 ? 'texto publicado' : 'textos publicados'}. ${a.bio.split(/\n\n/)[0] ?? ''}`}
        url={url}
        tipoOg="profile"
        imagemOg={a.foto ? { url: `/autores/${a.foto.arquivo}`, largura: a.foto.largura, altura: a.foto.altura, alt: `Retrato de ${a.nome}` } : undefined}
        ld={[ldJson(perfilLd(a, pecas, site)), ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Quem escreve', url: `${site}/autores` }, { nome: a.nome, url }]))]}
      >
        <header class="perfil">
          <Monograma autor={a} grande />
          <div class="perfil__texto">
            <span class="kicker">{a.papel}</span>
            <h1 class="perfil__nome">{a.nome}</h1>
            <div class="obra perfil__bio">{raw(renderizarObra(a.bio))}</div>
            <p class="perfil__meta">
              <span>
                <strong>{pecas.length}</strong> {pecas.length === 1 ? 'texto' : 'textos'} no Instituto
              </span>
              {desde && <span>desde {dataPeca(desde)}</span>}
              {a.link && (
                <a class="botao-secundario" href={a.link} rel="noopener" target="_blank">
                  {a.linkRotulo} ↗
                </a>
              )}
            </p>
          </div>
        </header>

        <section class="bloco">
          <Secao titulo={`O que ${a.nome.split(' ')[0]} publicou`} />
          {pecas.length ? (
            pecas.map((p) => <PecaLinha peca={p} />)
          ) : (
            <Aviso>Ainda não há texto assinado por {a.nome}. A primeira aparece aqui assim que sair.</Aviso>
          )}
        </section>
      </Documento>,
    ),
  );
});

/* ------------------------------------------------------------ o convite */

paginasDeAutor.post('/autores/escrever', async (c) => {
  if (await passouDoLimite(c)) return c.text('Muitos envios seguidos deste endereço. Espere um minuto e tente de novo.', 429);
  const f = await c.req.formData();
  const texto = (k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max);
  if (texto('sitio')) return c.redirect('/escrever?enviado=1#conversar', 303);

  const nome = texto('nome', 120);
  const email = texto('email');
  const erro = nome.length < 2 ? 'Falta o seu nome.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'Esse e-mail não parece válido.' : null;
  if (erro) {
    c.status(400);
    return c.html(
      pagina(
        <Documento titulo="Envio não aceito" naoIndexar>
          <h1>Envio não aceito</h1>
          <div class="bloco--curto">
            <Aviso>
              <strong>{erro}</strong> <a href="/escrever#conversar">Voltar ao formulário</a>.
            </Aviso>
          </div>
        </Documento>,
      ),
    );
  }

  await registrarContato(c.env.DB, { tipo: 'autor', nome, email, empresa: texto('empresa', 120) || null, mensagem: texto('mensagem', 1000) || null });
  return c.redirect('/escrever?enviado=1#conversar', 303);
});
