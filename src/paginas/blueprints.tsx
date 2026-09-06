/**
 * Blueprints: nossos dados, nosso método, nossas fontes — abertos.
 */
import { Documento } from '../ui/Documento';
import { Secao, Aviso, Veredito, ROTULO_VEREDITO, EXPLICA_VEREDITO, dataBR } from '../ui/pecas';
import { ldJson, datasetLd, trilhaLd } from '../ui/jsonld';
import { CACHE } from '../config';
import { relogio as medirRelogio, inventarioFontes, listarCorrecoes } from '../db';
import { todas } from '../conteudo';
import { novaApp, pagina } from './app';

export const blueprints = novaApp();

/** O dataset publicado. Um registro só, para o texto e o JSON-LD dizerem a mesma coisa. */
export const DATASET = {
  nome: 'Itens colhidos de feeds de automação e tecnologia, 25/08 a 01/09/2026',
  descricao:
    'Os 274 itens que 20 fontes (4 brasileiras de tecnologia, 16 estrangeiras) publicaram em seus feeds RSS entre 25 de agosto e 1º de setembro de 2026, com país, fonte, data, título e endereço. Base do relatório "Oito dias de medição".',
  arquivo: '/dados/2026-09-04-itens-colhidos-25ago-01set.csv',
  publicado: '2026-09-04',
  periodo: '2026-08-25/2026-09-01',
  linhas: 274,
};

function vereditoRobots(permite: number | null): string {
  if (permite === 1) return 'permite';
  if (permite === 0) return 'não permite';
  return 'não conferido';
}

blueprints.get('/blueprints', async (c) => {
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
  const site = c.env.SITE_URL;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Blueprints"
        secao="blueprints"
        descricao="Nossos dados, nosso método e nossas fontes — abertos para conferência: como colhemos, como medimos o atraso, quais fontes lemos e o que já corrigimos."
        url={site + '/blueprints'}
        ld={[ldJson(datasetLd(site, DATASET)), ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Blueprints', url: `${site}/blueprints` }]))]}
      >
        <header class="cabeca-secao">
          <h1>Blueprints</h1>
          <p class="cabeca-secao__lead">
            Nossos dados, nosso método e as fontes de cada coisa. Se você quiser conferir, contestar
            ou ampliar o que publicamos, comece por aqui.
          </p>
        </header>

        {/* --- o tour narrado: gerado do site rodando (tour/gerar.mjs), com legendas --- */}
        <section class="bloco" id="tour" style="scroll-margin-top: var(--space-l)">
          <Secao titulo="O site em menos de dois minutos" />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            Um tour narrado, gerado do próprio site em funcionamento — quando uma tela muda, o vídeo é
            refeito, não regravado. Com legendas.
          </p>
          <figure class="tour">
            <video class="tour__video" controls preload="metadata" playsinline poster="/og/padrao.png" width="1280" height="720">
              <source src="/tour/instituto-automacao-tour.mp4" type="video/mp4" />
              <track kind="captions" src="/tour/instituto-automacao-tour.vtt" srclang="pt-BR" label="Português" default />
              Seu navegador não toca vídeo. <a href="/tour/instituto-automacao-tour.mp4">Baixe o tour</a>.
            </video>
            <figcaption class="tour__legenda">
              Narração em voz neural em português; nenhuma cena é encenada — é o site de verdade, dirigido por
              automação. <a href="/tour/instituto-automacao-tour-capitulos.txt">Capítulos</a>.
            </figcaption>
          </figure>
        </section>

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

        <section class="bloco" id="dataset" style="scroll-margin-top: var(--space-l)">
          <Secao titulo="O dataset" />
          <p>
            O primeiro recorte já está público: os <strong>{DATASET.linhas} itens</strong> colhidos entre 25 de agosto e
            1º de setembro de 2026, com fonte, país, data, título e endereço, em{' '}
            <a href={DATASET.arquivo}>um arquivo CSV</a>. É a base do
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
