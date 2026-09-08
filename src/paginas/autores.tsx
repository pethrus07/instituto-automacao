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
import { Secao, Aviso, AutorCard, Monograma, PecaLinha, FormularioContato, dataPeca } from '../ui/pecas';
import { ldJson, perfilLd, trilhaLd } from '../ui/jsonld';
import { renderizarObra } from '../ui/markdown';
import { CACHE } from '../config';
import { registrarContato } from '../db';
import { autores, autorPorSlug, caminhoAutor, pecasDoAutor } from '../conteudo';
import { novaApp, pagina } from './app';

export const paginasDeAutor = novaApp();

const O_QUE_O_AUTOR_GANHA = [
  ['Assinatura em toda peça', 'Nome no alto, com link para a sua página — e no RSS, no JSON-LD e no cartão de compartilhamento.'],
  ['Página própria', 'Papel, bio, tudo o que publicou aqui e o link para o seu currículo, LinkedIn ou Lattes.'],
  ['Leitor certo', 'Quem lê o Instituto opera, integra ou ensina automação no Brasil. É para eles que você escreve.'],
  ['Edição de gente', 'O editor lê, questiona e devolve. Nada aqui passa por máquina — nem para "melhorar".'],
] as const;

const O_QUE_SE_PEDE = [
  ['Guia ou conceito', 'Um artigo ensina algo: como se faz, ou como funciona. Notícia é outra seção, e é o Instituto que escreve.'],
  ['Fonte creditada', 'O que vem de outro lugar tem nome e link. A regra vale para texto e para imagem.'],
  ['Sem texto de máquina', 'O site diz "nada aqui é gerado por máquina" em toda página. É promessa sua também.'],
  ['Assinado com nome e sobrenome', 'É currículo. Pseudônimo não entra.'],
] as const;

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
        descricao="Quem assina as peças do Instituto Automação — e como publicar um artigo aqui, com autoria, página própria e link para o seu currículo."
        url={`${site}/autores`}
        ld={[ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Quem escreve', url: `${site}/autores` }]))]}
      >
        <header class="cabeca-secao">
          <span class="kicker">O Instituto</span>
          <h1>Quem escreve</h1>
          <p class="cabeca-secao__lead">
            Toda peça tem autor, e o autor tem página. O que a pessoa faz, o que já publicou aqui, e
            o caminho para o currículo dela.
          </p>
        </header>

        <div class="grade grade--autores">
          {lista.map((a) => (
            <AutorCard autor={a} pecas={pecasDoAutor(a).length} />
          ))}
        </div>

        <section class="bloco" id="escrever" style="scroll-margin-top: var(--space-2xl)">
          <Secao
            titulo="Escreva no Instituto"
            nota="Artigo aqui é o que ensina: um guia ou um conceito de automação, assinado por quem faz. É o coração do site — e é onde quem escreve aparece."
          />
          <div class="duas-colunas duas-colunas--justas">
            <div>
              <h3 class="lista-regras__titulo">O que você ganha</h3>
              <ul class="regras">
                {O_QUE_O_AUTOR_GANHA.map(([t, d]) => (
                  <li>
                    <strong>{t}</strong>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 class="lista-regras__titulo">O que se pede</h3>
              <ul class="regras">
                {O_QUE_SE_PEDE.map(([t, d]) => (
                  <li>
                    <strong>{t}</strong>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div class="bloco--curto" style="margin-block-start: var(--space-l)">
            <FormularioContato acao="/autores/escrever" tipo="autor" enviado={enviado} />
          </div>
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
        descricao={`${a.nome}, ${a.papel.toLowerCase()} do Instituto Automação: ${pecas.length} ${pecas.length === 1 ? 'peça publicada' : 'peças publicadas'}. ${a.bio.split(/\n\n/)[0] ?? ''}`}
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
                <strong>{pecas.length}</strong> {pecas.length === 1 ? 'peça' : 'peças'} no Instituto
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
            <Aviso>Ainda não há peça assinada por {a.nome}. A primeira aparece aqui assim que sair.</Aviso>
          )}
        </section>
      </Documento>,
    ),
  );
});

/* ------------------------------------------------------------ o convite */

paginasDeAutor.post('/autores/escrever', async (c) => {
  const f = await c.req.formData();
  const texto = (k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max);
  if (texto('sitio')) return c.redirect('/autores?enviado=1#escrever', 303);

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
              <strong>{erro}</strong> <a href="/autores#escrever">Voltar ao formulário</a>.
            </Aviso>
          </div>
        </Documento>,
      ),
    );
  }

  await registrarContato(c.env.DB, { tipo: 'autor', nome, email, empresa: texto('empresa', 120) || null, mensagem: texto('mensagem', 1000) || null });
  return c.redirect('/autores?enviado=1#escrever', 303);
});
