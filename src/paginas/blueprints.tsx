/**
 * Blueprints: nossos dados, nosso método, nossas fontes — abertos.
 *
 * É a página que sustenta a frase "confira em vez de confiar". Em ordem:
 *   1. o tour narrado (publico/tour/, gerado por npm run tour)
 *   2. como funciona — os quatro tempos, em linguagem simples
 *   3. o veredito — as quatro categorias e o critério de cada uma
 *   4. como medimos o atraso — a definição, os números atuais e as limitações
 *   5. as fontes — o inventário inteiro do D1 com o veredito do robots.txt de
 *      cada uma (permite · não permite · não conferido), a licença e a voz
 *   6. correções — o registro público (tabela `correcao`)
 *   7. o dataset — o CSV em publico/dados/, descrito em DATASET e no JSON-LD
 *
 * Tudo aqui é lido do banco ou do conteúdo compilado; nada é redigido à mão
 * que a página não possa provar. Os números do relógio vêm de db.ts.
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
            Uma volta pelo site, narrada e legendada: o que cada seção é e onde ficam os dados.
          </p>
          <figure class="tour">
            <video class="tour__video" controls preload="metadata" playsinline poster="/og/padrao.png" width="1280" height="720">
              <source src="/tour/instituto-automacao-tour.mp4" type="video/mp4" />
              <track kind="captions" src="/tour/instituto-automacao-tour.vtt" srclang="pt-BR" label="Português" default />
              Seu navegador não toca vídeo. <a href="/tour/instituto-automacao-tour.mp4">Baixe o tour</a>.
            </video>
            <figcaption class="tour__legenda">
              A narração é voz sintética. As telas são o site de verdade, sem encenação.{' '}
              <a href="/tour/instituto-automacao-tour-capitulos.txt">Capítulos</a>.
            </figcaption>
          </figure>
        </section>

        {/* --- como o Instituto funciona ---
             Alongado em 11/09/2026: o sócio leu a versão curta e disse que o
             texto era "bem curto para explicar tudo isso", e que faltava "uma
             ordem certa de explicação". Virou quatro tempos numerados, cada um
             dizendo também o que NÃO acontece nele — que é onde estava a
             dúvida dele. */}
        <section class="bloco" id="como-funciona" style="scroll-margin-top: var(--space-l)">
          <Secao
            titulo="Como funciona"
            nota="Quatro tempos, sempre na mesma ordem, todo dia."
          />
          <div class="obra" style="font-size: var(--step-0)">
            <p>
              <strong>Colher. Escolher. Escrever. Publicar.</strong> O Instituto anda sozinho, todo
              dia, e cada tempo deixa registro: o que foi colhido está no banco, o que foi escolhido
              segue uma fórmula publicada, e o que foi publicado tem autor, data e histórico.
            </p>
          </div>

          <ol class="regras" style="margin-block-start: var(--space-m)">
            <li>
              <strong>1 · Colher</strong>
              Um coletor visita as {rel.fontes} fontes da tabela abaixo a cada quinze minutos e lê o
              feed de cada uma — só o feed, que é o canal que o site publica justamente para ser
              lido. Antes de cada visita ele confere o <code>robots.txt</code> daquele endereço, e
              fonte que não autoriza fica de fora, listada aqui dizendo que ficou. Ele guarda o
              título, a data, o endereço e a fonte. <em>Não guarda o texto da matéria alheia</em>.
            </li>
            <li>
              <strong>2 · Escolher</strong>
              A pauta sai de uma fórmula: quantas fontes falaram do assunto, se lá fora já falou e o
              Brasil ainda não, quão recente é. Só fontes do setor entram, e só imprensa — fórum e
              rede social não viram notícia. A maior parte do que sai lá fora não muda nada para quem
              opera aqui, e fica de fora.
            </li>
            <li>
              <strong>3 · Escrever e conferir</strong>
              A notícia é escrita em português a partir da fonte, com crédito e link para ela. É texto
              novo, não tradução. Antes de publicar, uma revisão automática confere cada número do
              texto contra a fonte, mede o tamanho, exige imagem com crédito e a seção{' '}
              <a href="#veredito">o que isso muda aqui</a> — a parte que não existe na fonte
              original, e é para ela que o site existe. O que não passa não sai.
            </li>
            <li>
              <strong>4 · Publicar</strong>
              Cada texto é um arquivo no repositório. Publicar é registrar uma alteração nele, com
              autor, data e o texto exato do que mudou. Nada é editado direto no ar, e um texto
              corrigido guarda a versão anterior em vez de apagá-la.
            </li>
          </ol>

          <div class="obra" style="font-size: var(--step-0); margin-block-start: var(--space-m)">
            <p>
              <strong>Quem assina.</strong> As notícias do dia saem assinadas pela{' '}
              <a href="/autores/redacao-do-instituto">Redação do Instituto</a>. Texto com nome de
              pessoa é texto que essa pessoa escreveu ou leu antes de ir ao ar. O Giro da Semana é
              montado a partir dos números que o coletor mediu, e o compilador recusa publicá-lo se a
              prosa tiver número que a apuração não tem. Hoje são {pecas.length} texto
              {pecas.length === 1 ? '' : 's'}.
            </p>
            <p>
              <strong>E quando um texto for pago, ele diz.</strong> O Instituto pode publicar conteúdo
              patrocinado, e ele sai marcado como publicidade com o nome de quem pagou — no texto, na
              capa, na listagem e no RSS. Notícia e Giro da Semana não são patrocináveis: a notícia
              carrega o veredito e o Giro carrega a medição, e nenhum dos dois está à venda. As
              regras completas estão em <a href="/apoie">Apoie</a>.
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
        <section class="bloco" id="relogio" style="scroll-margin-top: var(--space-l)">
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
              <em>Como dois textos viram o mesmo assunto:</em> pelos termos <strong>raros</strong>{' '}
              que eles compartilham. O que sobrevive à tradução é o nome próprio e o código —
              "Siemens", "IMTS", "61131" —, enquanto o verbo e a preposição mudam. Raro é medido na
              nossa própria base, não numa lista: num site de automação, "robô" está em toda parte e
              não distingue nada; "Tractian" distingue muito. São precisos <strong>dois</strong>{' '}
              termos raros em comum, e ao menos um deles tem de ser nome ou código. Nada disso é
              inteligência artificial: é contagem de palavra, roda no mesmo coletor e dá o mesmo
              resultado toda vez.
            </p>
            <p>
              <em>E a limitação que importa:</em> a medida só existe quando a imprensa brasileira
              escreve sobre o mesmo assunto que saiu lá fora — e, na maior parte do tempo, ela
              escreve sobre o Brasil. Das {relogioBR.length} fontes brasileiras que marcam o
              relógio, o que chega é sobretudo fábrica nova, financiamento e feira daqui. Por isso
              o número de pares medidos é pequeno e vai crescer devagar: {rel.medidos}{' '}
              {rel.medidos === 1 ? 'par apurado' : 'pares apurados'} até agora. Preferimos publicar
              uma amostra pequena e dizer o tamanho dela a publicar uma média que pareça maior do
              que é.
            </p>
            <p>
              Os {rel.sem_mencao} assuntos publicados lá fora há mais de 90 dias sem nenhuma menção
              aqui não são falha da medição — <strong>são o achado</strong>. O que nunca chega é
              parte da resposta.
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
              <strong>Nenhuma correção até agora.</strong> Quando houver, ela aparece nesta lista com
              a data e o que mudou, e o texto corrigido diz no pé que foi corrigido. O texto errado não
              é apagado: quem leu a versão antiga precisa conseguir achar o que mudou.
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
            <strong>A base completa sai em dezembro.</strong> O conjunto inteiro será publicado com
            licença CC-BY e um identificador permanente (DOI), para poder ser citado em trabalho
            acadêmico. A data não é arbitrária: uma base de medição só serve para alguma coisa depois
            de um trimestre inteiro de coleta contínua.
          </Aviso>
        </section>
      </Documento>,
    ),
  );
});
