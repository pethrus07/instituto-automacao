/**
 * A capa. Uma notícia manda, o artigo fixo vem logo abaixo, depois as
 * seguintes, a lista, relatórios e agenda, quem escreve, o giro. Com pouco
 * conteúdo, cada bloco tem de ter razão de existir — e o espaço entre eles é
 * o que separa "curado" de "abandonado".
 *
 * A ordem mudou em 07/09/2026 pelo feedback do sócio: o espaço do parceiro
 * entrou entre o cabeçalho e a primeira notícia; o cadastro subiu (estava
 * "muito embaixo"); Relatórios e Agenda ganharam nota dizendo o que são;
 * entraram Artigos e Quem escreve.
 *
 * E mudou de novo em 11/09/2026, por três decisões do Pedro:
 *
 *  1. ARTIGO FIXO em segundo lugar. O pedido do sócio era "um artigo e duas
 *     notícias, para um artigo nunca sair"; o bloco era o quarto e mostrava
 *     os três mais recentes, então notícia nova empurrava. Agora o slot é um
 *     só, escolhido por `fixo: true`, e fica.
 *
 *  2. O RELÓGIO SAIU DA CAPA. Ele é a tese do Instituto e continua rodando,
 *     mas em 11/09 a medição estava em ZERO atraso apurado sobre 684
 *     assuntos — não por erro de conta: o agrupamento por título exige
 *     conjunto idêntico de palavras, então a fonte brasileira nunca cai no
 *     mesmo assunto do original estrangeiro e o par jamais se forma. A faixa
 *     tinha desvio honesto (mostrava o que foi lido, não um "0" fingindo
 *     medida), mas prometer medição na capa sem medição é promessa. Os
 *     números seguem em /blueprints, onde a limitação está escrita ao lado.
 *     A faixa volta quando houver par medido.
 *
 *  3. "ENVIAR UM EVENTO" SAIU DA CAPA, e ficou só na agenda: a capa de um
 *     site que publica pouco não pede tarefa ao leitor antes de ter entregado
 *     alguma coisa.
 */
import { Documento } from '../ui/Documento';
import { Secao, Vazio, EventoNaAgenda, PecaDestaque, PecaCard, PecaLinha, Lista, FaixaParceiro, QuemEscreve, Numero } from '../ui/pecas';
import { ldJson, organizacaoLd, siteLd } from '../ui/jsonld';
import { CACHE } from '../config';
import { laFora, listarAgenda, naoChegaram } from '../db';
import { destaque, recentes, ultimoGiro, porSecao, artigoDaCapa, autores, pecasDoAutor, todas } from '../conteudo';
import { parceiroDaCapa } from '../parceiros';
import { novaApp, pagina } from './app';

export const capa = novaApp();

capa.get('/', async (c) => {
  const q = c.req.query();
  const principal = destaque();
  const seguintes = recentes(3, principal);
  const giro = ultimoGiro();
  const relatorios = porSecao('relatorios');
  const artigoFixo = artigoDaCapa();
  // os outros artigos: o fixo já tem o próprio espaço e não se repete na grade
  const outrosArtigos = porSecao('artigos').filter((p) => p !== artigoFixo);
  const quemEscreve = autores().filter((a) => pecasDoAutor(a).length > 0);
  const eventos = await listarAgenda(c.env.DB, {}, 3);
  // o que muda sozinho, todo dia: o que o coletor trouxe e o relógio da semana
  const [foraBruto, relogio] = await Promise.all([laFora(c.env.DB, 10), naoChegaram(c.env.DB)]);
  /* O que já virou notícia aqui não é mais "sem leitura nossa" (14/10/2026:
     a redação automática publica do mesmo feed que esta faixa lista). */
  const lidas = new Set(todas().map((p) => p.fonte?.url.replace(/\/$/, '')).filter(Boolean));
  const fora = { ...foraBruto, itens: foraBruto.itens.filter((i) => !lidas.has(i.url.replace(/\/$/, ''))).slice(0, 5) };
  const base = c.env.SITE_URL;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Instituto Automação"
        descricao="O que o setor de automação publica lá fora, lido daqui: notícias escolhidas e escritas em português, artigos que ensinam e relatórios com dado próprio."
        url={base + '/'}
        imagemOg={principal?.imagem ? { url: principal.og, largura: principal.imagem.largura, altura: principal.imagem.altura, alt: principal.imagem.alt } : undefined}
        ld={[ldJson(organizacaoLd(base)), ldJson(siteLd(base))]}
      >
        <FaixaParceiro parceiro={parceiroDaCapa()} />

        {principal ? (
          <PecaDestaque peca={principal} principal />
        ) : (
          <Vazio titulo="A primeira notícia está a caminho.">
            O Instituto publica pouco e escolhido: notícias lidas na fonte e escritas em
            português, e relatórios com dado que só nós temos. Enquanto a primeira não sai, a{' '}
            <a href="/agenda">agenda</a> e o <a href="/blueprints">método</a> já estão aqui.
          </Vazio>
        )}

        {/* LÁ FORA, HOJE — o bloco que muda sozinho (11/10/2026). O sócio
            pediu "a cara do site mudando todo dia" sem perder a credibilidade;
            o Pedro escolheu este: manchetes do setor como estão na fonte, com
            link para ela e o rótulo de que ninguém leu ainda, mais o número
            vivo do relógio. É dado listado, não texto redigido — o "sem IA"
            continua inteiro. Só aparece se houver o que mostrar. */}
        {fora.itens.length > 0 && <LaForaHoje horas={fora.horas} itens={fora.itens} relogio={relogio} />}

        {/* O ARTIGO FIXO, em segundo lugar e antes das outras notícias.
            É o coração do Instituto (sócio, 07/09) e o slot que notícia nova
            não empurra (decisão de 11/09). Quando ainda não há artigo, o
            convite para escrever ocupa o lugar — é o que existe de verdade. */}
        <section class="bloco">
          <Secao
            titulo="Artigos"
            acao={artigoFixo ? { texto: 'todos os artigos', href: '/artigos' } : undefined}
            nota="O que ensina: guias e conceitos de automação escritos por quem faz, para quem opera no Brasil. A notícia diz o que aconteceu; o artigo explica como funciona."
          />
          {artigoFixo ? (
            <>
              <PecaDestaque peca={artigoFixo} />
              {outrosArtigos.length > 0 && (
                <div class="grade" style="margin-block-start: var(--space-l)">
                  {outrosArtigos.slice(0, 2).map((p) => (
                    <PecaCard peca={p} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <Vazio titulo="O primeiro artigo está sendo escrito.">
              Artigo aqui é um guia ou um conceito, assinado por quem faz automação — com página de
              autor, bio e link para o currículo. Escreve sobre o assunto?{' '}
              <a href="/escrever">Publique no Instituto</a>.
            </Vazio>
          )}
        </section>

        {seguintes.length > 0 && (
          <section class="bloco">
            <Secao titulo={seguintes.every((p) => Date.now() - Date.parse(p.data) < 7 * 86_400_000) ? 'Também nesta semana' : 'Mais notícias'} acao={{ texto: 'todas as notícias', href: '/noticias' }} />
            <div class="grade">
              {seguintes.map((p) => (
                <PecaCard peca={p} />
              ))}
            </div>
          </section>
        )}

        {/* A lista, alta na página: quem chegou até aqui já viu o que o site é. */}
        <section class="bloco">
          <Lista origem="capa" estado={q.assinado} />
        </section>

        <div class="duas-colunas">
          <section class="bloco">
            <Secao
              titulo="Relatórios"
              acao={relatorios.length ? { texto: 'todos', href: '/relatorios' } : undefined}
              nota="O que apuramos com dado próprio: o coletor lê as fontes todo dia e guarda tudo; o relatório conta, confere e publica o dado bruto junto."
            />
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
            <Secao
              titulo="Agenda"
              acao={{ texto: 'calendário completo', href: '/agenda' }}
              nota="Feiras, congressos e encontros de automação, cada data conferida no site oficial do evento."
            />
            {eventos.length > 0 ? (
              eventos.map((e) => <EventoNaAgenda evento={e} />)
            ) : (
              <Vazio titulo="A agenda está sendo montada.">
                Feiras, congressos e encontros de automação, com a data conferida no site oficial de
                cada um. O <a href="/agenda">calendário completo</a> já está aberto.
              </Vazio>
            )}
          </section>
        </div>

        {/* Quem escreve: gente, com nome e caminho para o currículo. */}
        <section class="bloco">
          <Secao
            titulo="Quem escreve"
            acao={{ texto: 'todos os autores', href: '/autores' }}
            nota="Toda notícia, artigo e relatório tem autor, e o autor tem página: o que faz, o que já publicou e o link para o currículo dele."
          />
          <QuemEscreve autores={quemEscreve} contar={(a) => pecasDoAutor(a).length} />
        </section>

        {giro && (
          <section class="bloco">
            <Secao titulo="Giro da Semana" acao={{ texto: 'edições anteriores', href: '/giro' }} />
            <PecaLinha peca={giro} />
          </section>
        )}
      </Documento>,
    ),
  );
});

const quandoFoi = (iso: string) => {
  const h = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 3_600_000));
  return h < 1 ? 'agora há pouco' : h < 24 ? `há ${h} h` : `há ${Math.round(h / 24)} ${Math.round(h / 24) === 1 ? 'dia' : 'dias'}`;
};

const LaForaHoje = (p: { horas: number; itens: { titulo: string; url: string; fonte: string; idioma: string; publicado: string }[]; relogio: { assuntos: number; semMencao: number } }) => (
  <section class="bloco la-fora" aria-labelledby="la-fora-titulo">
    <div class="la-fora__cabeca">
      <div>
        <h2 class="secao__titulo" id="la-fora-titulo">
          Lá fora, {p.horas === 24 ? 'hoje' : 'nos últimos dias'}
        </h2>
        <p class="secao__nota">
          O que as fontes do setor publicaram {p.horas === 24 ? 'nas últimas 24 horas' : `nas últimas ${p.horas} horas`}, como saiu
          lá. Colhido pela máquina, ainda sem leitura nossa — o que virar notícia aparece aqui em cima.
        </p>
      </div>
      {p.relogio.assuntos > 0 && (
        <Numero
          valor={p.relogio.semMencao}
          rotulo={`de ${p.relogio.assuntos} assuntos do setor publicados lá fora nos últimos 7 dias ainda sem menção no Brasil`}
          href="/blueprints#relogio"
        />
      )}
    </div>
    <ol class="la-fora__lista">
      {p.itens.map((m) => (
        <li>
          <a href={m.url} rel="nofollow noopener" target="_blank" lang={m.idioma}>
            {m.titulo}
          </a>
          <span class="la-fora__meta u-fluxo">
            {m.fonte} · <abbr title={`título original, em ${m.idioma === 'en' ? 'inglês' : m.idioma === 'de' ? 'alemão' : m.idioma === 'es' ? 'espanhol' : m.idioma}`}>{m.idioma.toUpperCase()}</abbr> · {quandoFoi(m.publicado)}
          </span>
        </li>
      ))}
    </ol>
  </section>
);
