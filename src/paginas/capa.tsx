/**
 * A capa. Uma peça manda. Depois as seguintes, o relógio, a agenda, o giro e
 * a lista. Com pouco conteúdo, cada bloco tem de ter razão de existir — e o
 * espaço entre eles é o que separa "curado" de "abandonado".
 */
import { Documento } from '../ui/Documento';
import { Secao, Vazio, Numero, EventoNaAgenda, PecaDestaque, PecaCard, PecaLinha } from '../ui/pecas';
import { ldJson, organizacaoLd, siteLd } from '../ui/jsonld';
import { CACHE } from '../config';
import { relogio as medirRelogio, listarAgenda } from '../db';
import { destaque, recentes, ultimoGiro, porSecao } from '../conteudo';
import { novaApp, pagina } from './app';

export const capa = novaApp();

capa.get('/', async (c) => {
  const q = c.req.query();
  const principal = destaque();
  const seguintes = recentes(3, principal);
  const giro = ultimoGiro();
  const relatorios = porSecao('relatorios');
  const [rel, eventos] = await Promise.all([medirRelogio(c.env.DB), listarAgenda(c.env.DB, {}, 3)]);
  const base = c.env.SITE_URL;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Instituto Automação"
        descricao="O que o setor de automação publica lá fora, lido daqui: notícias escolhidas e escritas em português, relatórios com dado próprio, e a medição de quanto tempo cada assunto leva para chegar ao Brasil."
        url={base + '/'}
        imagemOg={principal?.imagem ? { url: principal.og, largura: principal.imagem.largura, altura: principal.imagem.altura, alt: principal.imagem.alt } : undefined}
        ld={[ldJson(organizacaoLd(base)), ldJson(siteLd(base))]}
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
              <input class="campo" id="email-lista" type="email" name="email" required placeholder="seu@email.com.br" autocomplete="email" />
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
