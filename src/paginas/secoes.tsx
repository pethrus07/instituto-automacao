/**
 * As seções (Notícias, Relatórios, Giro) e a página de cada peça.
 */
import { raw } from 'hono/html';
import type { Context } from 'hono';
import { Documento } from '../ui/Documento';
import { Aviso, Vazio, Secao, Arte, Etiquetas, AssinaturaPeca, PecaDestaque, PecaCard, PecaLinha, FonteCaixa, VereditoCaixa } from '../ui/pecas';
import { ldJson, colecaoLd, pecaLd, trilhaLd } from '../ui/jsonld';
import { renderizarObra } from '../ui/markdown';
import { CACHE, type Env } from '../config';
import { porSecao, obter, caminho, ROTULO_SECAO, SECOES, type Secao as ChaveSecao, type Peca } from '../conteudo';
import { novaApp, pagina, type Ambiente } from './app';

export const secoes = novaApp();

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

secoes.get('/noticias', (c) => secao(c, 'noticias'));
secoes.get('/relatorios', (c) => secao(c, 'relatorios'));
secoes.get('/giro', (c) => secao(c, 'giro'));

function secao(c: Context<Ambiente>, s: ChaveSecao) {
  const pecas = porSecao(s);
  const [primeira, ...resto] = pecas;
  const base = c.env.SITE_URL;
  const url = `${base}/${s}`;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo={ROTULO_SECAO[s]}
        secao={s}
        descricao={DESCRICAO_SECAO[s]}
        url={url}
        imagemOg={primeira?.imagem ? { url: primeira.og, largura: primeira.imagem.largura, altura: primeira.imagem.altura, alt: primeira.imagem.alt } : undefined}
        ld={[
          ldJson(colecaoLd(ROTULO_SECAO[s], DESCRICAO_SECAO[s], url, pecas, base)),
          ldJson(trilhaLd([{ nome: 'Capa', url: `${base}/` }, { nome: ROTULO_SECAO[s], url }])),
        ]}
      >
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

/* ---------------------------------------------------------------- a peça */

for (const s of SECOES) {
  secoes.get(`/${s}/:slug`, (c) => {
    const p = obter(s, c.req.param('slug'));
    if (!p) return c.notFound();
    c.header('Cache-Control', CACHE.item);
    return c.html(pagina(paginaDaPeca(p, c.env)));
  });
}

export function paginaDaPeca(p: Peca, env: Env) {
  const html = renderizarObra(p.corpo);
  const outras = porSecao(p.secao).filter((x) => x.slug !== p.slug).slice(0, 3);
  const base = env.SITE_URL;
  const url = base + caminho(p);

  return (
    <Documento
      titulo={p.titulo}
      tituloCurto={p.tituloCurto}
      secao={p.secao}
      descricao={p.lead}
      url={url}
      tipoOg="article"
      imagemOg={p.imagem ? { url: p.og, largura: p.imagem.largura, altura: p.imagem.altura, alt: p.imagem.alt } : { url: p.og, largura: 1200, altura: 630, alt: p.titulo }}
      artigo={{ publicado: p.data, autor: p.autor, secao: ROTULO_SECAO[p.secao] }}
      ld={[
        ldJson(pecaLd(p, base)),
        ldJson(trilhaLd([{ nome: 'Capa', url: `${base}/` }, { nome: ROTULO_SECAO[p.secao], url: `${base}/${p.secao}` }, { nome: p.tituloCurto ?? p.titulo, url }])),
      ]}
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
