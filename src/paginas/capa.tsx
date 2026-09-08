/**
 * A capa. Uma peça manda. Depois as seguintes, a lista, os artigos, o
 * relógio, relatórios e agenda, quem escreve, o giro. Com pouco conteúdo,
 * cada bloco tem de ter razão de existir — e o espaço entre eles é o que
 * separa "curado" de "abandonado".
 *
 * A ordem mudou em 07/09/2026 pelo feedback do sócio: o espaço do parceiro
 * entrou entre o cabeçalho e a primeira notícia; o cadastro subiu (estava
 * "muito embaixo"); Relatórios e Agenda ganharam nota dizendo o que são;
 * entraram Artigos e Quem escreve. O relógio ficou — é a tese do Instituto —,
 * mas agora diz sobre quais fontes mede, e não mostra "0" como se fosse
 * medida: quando ainda não há par medido, mostra o que já foi lido.
 */
import { Documento } from '../ui/Documento';
import { Secao, Vazio, Numero, EventoNaAgenda, PecaDestaque, PecaCard, PecaLinha, Lista, FaixaParceiro, QuemEscreve } from '../ui/pecas';
import { ldJson, organizacaoLd, siteLd } from '../ui/jsonld';
import { CACHE } from '../config';
import { relogio as medirRelogio, listarAgenda } from '../db';
import { destaque, recentes, ultimoGiro, porSecao, autores, pecasDoAutor } from '../conteudo';
import { parceiroDaCapa } from '../parceiros';
import { novaApp, pagina } from './app';

export const capa = novaApp();

capa.get('/', async (c) => {
  const q = c.req.query();
  const principal = destaque();
  const seguintes = recentes(3, principal);
  const giro = ultimoGiro();
  const relatorios = porSecao('relatorios');
  const artigos = porSecao('artigos');
  const quemEscreve = autores().filter((a) => pecasDoAutor(a).length > 0);
  const [rel, eventos] = await Promise.all([medirRelogio(c.env.DB), listarAgenda(c.env.DB, {}, 3)]);
  const base = c.env.SITE_URL;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Instituto Automação"
        descricao="O que o setor de automação publica lá fora, lido daqui: notícias escolhidas e escritas em português, artigos que ensinam, relatórios com dado próprio, e a medição de quanto tempo cada assunto leva para chegar ao Brasil."
        url={base + '/'}
        imagemOg={principal?.imagem ? { url: principal.og, largura: principal.imagem.largura, altura: principal.imagem.altura, alt: principal.imagem.alt } : undefined}
        ld={[ldJson(organizacaoLd(base)), ldJson(siteLd(base))]}
      >
        <FaixaParceiro parceiro={parceiroDaCapa()} />

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

        {/* A lista, alta na página: quem chegou até aqui já viu o que o site é. */}
        <section class="bloco">
          <Lista origem="capa" estado={q.assinado} />
        </section>

        {/* Artigos: o que ensina. É o coração do Instituto (sócio, 07/09), e
            por isso tem bloco próprio mesmo antes do primeiro sair. */}
        <section class="bloco">
          <Secao
            titulo="Artigos"
            acao={artigos.length ? { texto: 'todos os artigos', href: '/artigos' } : undefined}
            nota="O que ensina: guias e conceitos de automação escritos por quem faz, para quem opera no Brasil. A notícia diz o que aconteceu; o artigo explica como funciona."
          />
          {artigos.length > 0 ? (
            <div class="grade">
              {artigos.slice(0, 3).map((p) => (
                <PecaCard peca={p} />
              ))}
            </div>
          ) : (
            <Vazio titulo="O primeiro artigo está sendo escrito.">
              Artigo aqui é um guia ou um conceito, assinado por quem faz automação — com página de
              autor, bio e link para o currículo. Escreve sobre o assunto?{' '}
              <a href="/autores#escrever">Publique no Instituto</a>.
            </Vazio>
          )}
        </section>

        {/* O relógio — a pergunta-assinatura, medida. Faixa escura de ponta
            a ponta: é o único bloco com massa da página, e é o que o
            Instituto tem que ninguém tem. Quando ainda não há par medido,
            os números são os da leitura — nunca um "0" fingindo medida. */}
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
              <p class="faixa-relogio__metodo">
                A medida vale para as {rel.fontes} fontes que acompanhamos, listadas em Blueprints —
                não para toda a imprensa. É uma amostra, e dizemos isso.
              </p>
              <a href="/blueprints" class="faixa-relogio__link">Como medimos, e o que ainda não conseguimos medir</a>
            </div>
            <div class="faixa-relogio__numeros">
              {rel.medidos > 0 ? (
                <>
                  <Numero valor={rel.acompanhados} rotulo="assuntos acompanhados" />
                  <Numero valor={rel.fontes} rotulo="fontes lidas todo dia" />
                  <Numero valor={`${rel.mediana_dias} d`} rotulo="atraso mediano até a primeira menção aqui" />
                  <Numero valor={rel.sem_mencao} rotulo="publicados lá fora há mais de 90 dias e nunca mencionados aqui" />
                </>
              ) : (
                <>
                  <Numero valor={rel.itens} rotulo="itens lidos e guardados desde o início" />
                  <Numero valor={rel.fontes} rotulo="fontes lidas todo dia" />
                  <Numero valor={rel.acompanhados} rotulo="assuntos agrupados até agora" />
                  <Numero valor="—" rotulo="atraso mediano: sai quando a primeira fonte brasileira mencionar um assunto colhido lá fora" />
                </>
              )}
            </div>
          </div>
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
              nota={
                <>
                  Feiras, congressos e encontros de automação, cada data conferida no site oficial
                  do evento. Organiza um? <a href="/agenda#enviar">Envie</a> — listar é de graça.
                </>
              }
            />
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

        {/* Quem escreve: gente, com nome e caminho para o currículo. */}
        <section class="bloco">
          <Secao
            titulo="Quem escreve"
            acao={{ texto: 'todos os autores', href: '/autores' }}
            nota="Toda peça tem autor, e o autor tem página: o que faz, o que já publicou e o link para o currículo dele."
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
