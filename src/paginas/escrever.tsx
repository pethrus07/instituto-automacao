/**
 * ESCREVER — a aba onde quem sabe fazer vira autor.
 *
 * Reunião de 24/09/2026. O sócio convidou gente e todos toparam — e
 * travaram: não sabiam o tema, não tinham padrão, não queriam abrir o Word e
 * "ressuscitar da cabeça" um artigo. O Pedro prometeu três coisas, e esta
 * página é as três:
 *
 *   1. o GUIA DE TEMAS: trilhas, séries de 3, 5 e 10, e o artigo avulso para
 *      quem quer zero compromisso (src/pautas.ts);
 *   2. o PADRÃO: os recursos do "Padrão Artigo Instituto" que o sócio mandou,
 *      publicados como blocos em /escrever/blocos;
 *   3. o EDITOR: "como se fosse um Google Docs", para o convidado e para o
 *      estranho, com a pauta já montada — "50% do caminho andado" — e a
 *      prévia exatamente como o site vai mostrar.
 *
 * O que NÃO mudou: o git é o CMS. O envio cai numa caixa de entrada
 * (tabela `submissao`); alguém lê, `npm run submissoes` escreve o arquivo, e
 * só então o texto compila e vai ao ar. Não há backoffice, não há publicação
 * automática, e não há modelo de linguagem "melhorando" o texto de ninguém —
 * o sócio perguntou, e a resposta é a mesma de 03/09: quem assina, escreve.
 */
import { raw } from 'hono/html';
import { Documento } from '../ui/Documento';
import { Aviso, Secao, FormularioContato } from '../ui/pecas';
import { ldJson, trilhaLd } from '../ui/jsonld';
import { BLOCOS, converterObra, type TipoBloco } from '../ui/markdown';
import { EXEMPLOS_BLOCOS } from '../conteudo.gerado';
import { CACHE, FINALIDADES } from '../config';
import { registrarSubmissao } from '../db';
import { caminho, porSecao } from '../conteudo';
import {
  EXPLICA_FORMATO_ARTIGO,
  PAUTAS,
  ROTULO_FORMATO_ARTIGO,
  ROTULO_NIVEL,
  SERIES,
  TRILHAS,
  avulsasDaTrilha,
  estadoDaPauta,
  pautaPorSlug,
  pautasDaSerie,
  seriePorSlug,
  seriesDaTrilha,
  trilhaPorSlug,
  type Pauta,
} from '../pautas';
import { CSS_ARTIGO_ROTA, CSS_ESCREVER_ROTA } from '../estilo';
import { novaApp, pagina } from './app';

export const escrever = novaApp();

/** As pautas já cumpridas: o artigo publicado diz `pauta:` no frontmatter. */
const publicadas = () => new Set(porSecao('artigos').map((p) => p.pauta).filter((x): x is string => !!x));
const artigoDaPauta = (slug: string) => porSecao('artigos').find((p) => p.pauta === slug) ?? null;

/** Até 53 caracteres, cortado na palavra — o mesmo teto do `titulo_curto` das peças. */
const curto = (s: string) => (s.length <= 53 ? s : `${s.slice(0, 52).replace(/\s+\S*$/, '')}…`);

const ROTULO_ESTADO ={ livre: 'livre', reservada: 'reservada', publicada: 'publicada' } as const;

const O_QUE_O_AUTOR_GANHA = [
  ['Assinatura em todo texto', 'Nome no alto, com link para a sua página — e no RSS, no dado estruturado e no cartão de compartilhamento.'],
  ['Página própria', 'Papel, bio, foto, tudo o que publicou aqui e o link para o seu currículo, LinkedIn ou Lattes.'],
  ['Leitor certo', 'Quem lê o Instituto opera, integra ou ensina automação no Brasil. É para eles que você escreve.'],
  ['Edição de gente', 'O editor lê, questiona e devolve. Nada aqui passa por máquina — nem para "melhorar".'],
] as const;

const O_QUE_SE_PEDE = [
  ['O que você sabe fazer', 'Um artigo ensina: como se faz, como funciona, ou o que você fez e deu certo.'],
  ['Fonte creditada', 'O que vem de outro lugar tem nome e link. A regra vale para texto e para imagem.'],
  ['Imagem sua ou cedida', 'Foto que você tirou, print da sua tela, desenho seu. Imagem de outro site, não.'],
  ['Nome e sobrenome', 'É currículo. Pseudônimo não entra — e texto de máquina também não.'],
] as const;

/* ------------------------------------------------------------------ hub */

escrever.get('/escrever', (c) => {
  const site = c.env.SITE_URL;
  const pub = publicadas();
  const livres = PAUTAS.filter((p) => estadoDaPauta(p, pub) === 'livre').length;
  const enviado = c.req.query('enviado') === '1';

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Escreva no Instituto"
        secao="escrever"
        estilos={[CSS_ARTIGO_ROTA]}
        descricao="Escolha uma pauta — ela já vem com o esqueleto pronto —, escreva no editor do Instituto em 20 a 30 minutos e publique com o seu nome e a sua página de autor."
        url={`${site}/escrever`}
        ld={[ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Escreva no Instituto', url: `${site}/escrever` }]))]}
      >
        <header class="cabeca-secao">
          <span class="kicker">Escreva no Instituto</span>
          <h1>Escreva o que você sabe fazer.</h1>
          <p class="cabeca-secao__lead">
            Escolha uma pauta — ela já vem com o esqueleto montado —, escreva no editor em 20 a 30 minutos e envie. O
            editor lê, devolve se precisar, e publica com o seu nome e a sua página.
          </p>
          <p class="escrever-acoes">
            <a class="botao-acao" href="#pautas">
              Escolher uma pauta
            </a>
            <a class="botao-secundario" href="/escrever/editor">
              Tema livre →
            </a>
          </p>
        </header>

        <ol class="escrever-passos" aria-label="Como funciona">
          <li>
            <strong>Escolha</strong> uma das {livres} pautas livres, ou traga o seu tema.
          </li>
          <li>
            <strong>Escreva</strong> no editor, com os blocos do padrão e a prévia ao lado.
          </li>
          <li>
            <strong>Envie.</strong> Uma pessoa lê e responde no seu e-mail.
          </li>
        </ol>

        <section class="bloco">
          <Secao
            titulo="Quanto você quer se comprometer"
            nota="Série tem começo, meio e fim — e você só pega a próxima se gostar."
          />
          <div class="compromissos">
            <div class="compromisso">
              <span class="compromisso__n">1</span>
              <strong>Avulso</strong>
              <span>Um artigo, zero compromisso. Publicou, virou autor, ganhou a página.</span>
            </div>
            {([3, 5, 10] as const).map((n) => {
              const qtd = SERIES.filter((s) => s.partes === n).length;
              return (
                <div class="compromisso">
                  <span class="compromisso__n">{n}</span>
                  <strong>Série de {n}</strong>
                  <span>
                    {qtd} {qtd === 1 ? 'série' : 'séries'} no plano. {n === 3 ? 'Um tema de ponta a ponta.' : n === 5 ? 'O assunto inteiro, do básico ao diagnóstico.' : 'Um curso, em dez artigos.'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section class="bloco" id="pautas" style="scroll-margin-top: var(--space-2xl)">
          <Secao titulo="As pautas" nota={`${PAUTAS.length} pautas em ${TRILHAS.length} trilhas. Abra uma trilha para ver as séries e os avulsos.`} />
          <div class="trilhas">
            {TRILHAS.map((t) => {
              const pautas = PAUTAS.filter((p) => p.trilha === t.slug);
              const livresT = pautas.filter((p) => estadoDaPauta(p, pub) === 'livre').length;
              return (
                <details class="trilha" id={`trilha-${t.slug}`}>
                  <summary>
                    <span class="trilha__titulo">{t.titulo}</span>
                    <span class="trilha__resumo">
                      {t.descricao} <span class="u-dado">{livresT} de {pautas.length} livres</span>
                    </span>
                  </summary>
                  <div class="trilha__corpo">
                    {seriesDaTrilha(t.slug).map((s) => (
                      <div class="serie">
                        <p class="serie__cabeca">
                          <strong>{s.titulo}</strong> <span class="serie__partes">série de {s.partes}</span>
                        </p>
                        <p class="serie__descricao">{s.descricao}</p>
                        <ol class="lista-pautas">
                          {pautasDaSerie(s.slug).map((p) => (
                            <LinhaPauta pauta={p} estado={estadoDaPauta(p, pub)} />
                          ))}
                        </ol>
                      </div>
                    ))}
                    {avulsasDaTrilha(t.slug).length > 0 && (
                      <div class="serie">
                        <p class="serie__cabeca">
                          <strong>Avulsos</strong> <span class="serie__partes">um artigo cada</span>
                        </p>
                        <ul class="lista-pautas lista-pautas--avulsa">
                          {avulsasDaTrilha(t.slug).map((p) => (
                            <LinhaPauta pauta={p} estado={estadoDaPauta(p, pub)} />
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
          <p class="escrever-nota">
            Não achou o seu assunto? <a href="/escrever/editor">Escreva sobre tema livre</a> — o editor é o mesmo.
          </p>
        </section>

        <section class="bloco">
          <Secao titulo="O padrão do artigo" nota="Os recursos que deixam um artigo didático — cada um vira um bloco no editor." />
          <p class="escrever-blocos-chips">
            {(Object.keys(BLOCOS) as TipoBloco[]).map((k) => (
              <span class="chip">{BLOCOS[k].rotulo}</span>
            ))}
            <span class="chip">Código</span>
            <span class="chip">Terminal</span>
            <span class="chip">Tabela</span>
            <span class="chip">Imagem</span>
          </p>
          <p>
            <a href="/escrever/blocos">Ver cada bloco, com exemplo →</a>
          </p>
        </section>

        <section class="bloco">
          <details class="mais-opcoes">
            <summary>
              <strong>O que você ganha e o que se pede</strong>
              <span>Assinatura, página própria, edição de gente · o que você sabe fazer, fonte creditada, imagem sua</span>
            </summary>
            <div class="duas-colunas duas-colunas--justas" style="margin-block-start: var(--space-m)">
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
          </details>
          <details class="mais-opcoes" id="conversar" open={enviado}>
            <summary>
              <strong>Prefere conversar antes de escrever?</strong>
              <span>Deixe o seu nome e o assunto — alguém responde por e-mail</span>
            </summary>
            <div style="margin-block-start: var(--space-m)">
              <FormularioContato acao="/autores/escrever" tipo="autor" enviado={enviado} />
            </div>
          </details>
        </section>
      </Documento>,
    ),
  );
});

const LinhaPauta = (p: { pauta: Pauta; estado: 'livre' | 'reservada' | 'publicada' }) => (
  <li class={`linha-pauta linha-pauta--${p.estado}`}>
    <a href={`/escrever/pauta/${p.pauta.slug}`}>
      {p.pauta.parte && <span class="linha-pauta__parte u-dado">{String(p.pauta.parte).padStart(2, '0')}</span>}
      <span class="linha-pauta__titulo">{p.pauta.titulo}</span>
    </a>
    <span class="linha-pauta__meta">
      {ROTULO_FORMATO_ARTIGO[p.pauta.formato]} · {ROTULO_NIVEL[p.pauta.nivel].toLowerCase()}
      {p.estado !== 'livre' && <span class={`estado-pauta estado-pauta--${p.estado}`}>{ROTULO_ESTADO[p.estado]}</span>}
    </span>
  </li>
);

/* ------------------------------------------------------------ uma pauta */

escrever.get('/escrever/pauta/:slug', (c) => {
  const p = pautaPorSlug(c.req.param('slug'));
  if (!p) return c.notFound();
  const site = c.env.SITE_URL;
  const pub = publicadas();
  const estado = estadoDaPauta(p, pub);
  const trilha = trilhaPorSlug(p.trilha)!;
  const serie = p.serie ? seriePorSlug(p.serie) : null;
  const artigo = artigoDaPauta(p.slug);
  const url = `${site}/escrever/pauta/${p.slug}`;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo={p.titulo}
        // a aba e a busca: "Pauta: …" cortado na palavra, dentro dos 53 que cabem
        tituloCurto={curto(`Pauta: ${p.titulo}`)}
        secao="escrever"
        estilos={[CSS_ARTIGO_ROTA]}
        descricao={`Pauta do Instituto Automação: ${p.objetivo}`}
        url={url}
        ld={[ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Escreva no Instituto', url: `${site}/escrever` }, { nome: p.titulo, url }]))]}
      >
        <article class="pauta">
          <header class="cabeca-secao">
            <span class="kicker">
              <a href={`/escrever#trilha-${trilha.slug}`}>{trilha.titulo}</a>
              {serie ? ` · série ${serie.titulo}, parte ${p.parte} de ${serie.partes}` : ' · avulso'}
            </span>
            <h1>{p.titulo}</h1>
            <p class="cabeca-secao__lead">{p.objetivo}</p>
            <p class="pauta__meta">
              <span>{ROTULO_FORMATO_ARTIGO[p.formato]}</span>
              <span>{ROTULO_NIVEL[p.nivel]}</span>
              <span class={`estado-pauta estado-pauta--${estado}`}>{estado === 'reservada' ? `reservada para ${p.reservada}` : ROTULO_ESTADO[estado]}</span>
            </p>
          </header>

          {estado === 'publicada' && artigo ? (
            <Aviso>
              <strong>Esta pauta já foi escrita.</strong> <a href={caminho(artigo)}>Leia o artigo</a>, ou escolha outra em{' '}
              <a href="/escrever#pautas">Escreva no Instituto</a>.
            </Aviso>
          ) : (
            <p class="escrever-acoes">
              <a class="botao-acao" href={`/escrever/editor?pauta=${p.slug}`}>
                Escrever esta pauta
              </a>
              {estado === 'reservada' && <span class="escrever-nota">Alguém já pegou esta — escreva só se combinou com o editor.</span>}
            </p>
          )}

          <section class="bloco">
            <Secao titulo="O esqueleto" nota="Cada item vira um subtítulo no editor. Mude, junte, tire — é ponto de partida, não formulário." />
            <ol class="pauta__esqueleto">
              {p.cobrir.map((item) => (
                <li>{item}</li>
              ))}
            </ol>
          </section>

          <section class="bloco">
            <Secao titulo="Os blocos que costumam servir" nota="O editor já traz estes montados, vazios, no lugar certo." />
            <p class="escrever-blocos-chips">
              {p.blocos.map((b) => (
                <span class="chip">{b in BLOCOS ? BLOCOS[b as TipoBloco].rotulo : { tabela: 'Tabela', codigo: 'Código', terminal: 'Terminal', imagem: 'Imagem' }[b as 'tabela']}</span>
              ))}
            </p>
            <p class="escrever-nota">
              <strong>{ROTULO_FORMATO_ARTIGO[p.formato]}:</strong> {EXPLICA_FORMATO_ARTIGO[p.formato]}
            </p>
          </section>

          {serie && (
            <section class="bloco">
              <Secao titulo={`A série inteira: ${serie.titulo}`} nota={serie.descricao} />
              <ol class="lista-pautas">
                {pautasDaSerie(serie.slug).map((x) => (
                  <LinhaPauta pauta={x} estado={estadoDaPauta(x, pub)} />
                ))}
              </ol>
            </section>
          )}
        </article>
      </Documento>,
    ),
  );
});

/* ------------------------------------------------------------ o guia de blocos */

escrever.get('/escrever/blocos', (c) => {
  const site = c.env.SITE_URL;
  c.header('Cache-Control', CACHE.listagem);
  const linha = [
    {
      rotulo: 'Código',
      para: 'Programa, configuração, trecho de ST. A linguagem vai depois das três crases; o leitor ganha o botão Copiar.',
      exemplo: '```st Liga a bomba\nIF nivel < 20.0 THEN\n  bomba := TRUE;\nEND_IF;\n```',
    },
    {
      rotulo: 'Terminal',
      para: 'O que se digita e o que aparece. Linha com $ é comando; o resto é a saída.',
      exemplo: '```terminal ping no CLP\n$ ping 192.168.0.10\nResposta de 192.168.0.10: tempo=2ms\n✓ o CLP está na rede\n```',
    },
    {
      rotulo: 'Tabela',
      para: 'Comparação lado a lado. (sim), (não) e (parcial) viram marca colorida.',
      exemplo: '| | Modbus RTU | Modbus TCP |\n|---|---|---|\n| Meio | RS-485 | Ethernet |\n| Precisa de IP | (não) | (sim) |\n| Vários mestres | (não) | (parcial) |',
    },
    {
      rotulo: 'Na linha do texto',
      para: 'Tecla entre colchetes duplos; termo explicado entre chaves duplas, com a definição depois da barra; negrito, itálico, código e link como no markdown.',
      exemplo: 'Aperte [[Ctrl]] + [[S]] para salvar. O {{CLP|controlador lógico programável}} lê as entradas a cada **ciclo de varredura**.',
    },
  ];
  return c.html(
    pagina(
      <Documento
        titulo="O padrão do artigo"
        secao="escrever"
        estilos={[CSS_ARTIGO_ROTA]}
        descricao="Os blocos do artigo do Instituto Automação — resumo, avisos, passo a passo, fórmula, armadilhas, quiz — com a sintaxe e o resultado de cada um."
        url={`${site}/escrever/blocos`}
        ld={[ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Escreva no Instituto', url: `${site}/escrever` }, { nome: 'O padrão do artigo', url: `${site}/escrever/blocos` }]))]}
      >
        <header class="cabeca-secao">
          <span class="kicker">
            <a href="/escrever">Escreva no Instituto</a>
          </span>
          <h1>O padrão do artigo</h1>
          <p class="cabeca-secao__lead">
            Os recursos que deixam um artigo didático. No editor, cada um é um botão; aqui está o que ele produz — e, para
            quem prefere escrever o arquivo à mão, a sintaxe.
          </p>
        </header>

        <div class="guia-blocos">
          {(Object.keys(BLOCOS) as TipoBloco[]).map((k) => (
            <section class="guia-bloco" id={`bloco-${k}`}>
              <div class="guia-bloco__texto">
                <h2>{BLOCOS[k].rotulo}</h2>
                <p>{BLOCOS[k].para}</p>
                <details>
                  <summary>Sintaxe</summary>
                  <pre class="guia-bloco__fonte">{BLOCOS[k].exemplo}</pre>
                </details>
              </div>
              <div class="guia-bloco__amostra peca" data-secao="artigos">
                <div class="obra">{raw(EXEMPLOS_BLOCOS[k] ?? '')}</div>
              </div>
            </section>
          ))}
          {linha.map((b) => (
            <section class="guia-bloco">
              <div class="guia-bloco__texto">
                <h2>{b.rotulo}</h2>
                <p>{b.para}</p>
                <details>
                  <summary>Sintaxe</summary>
                  <pre class="guia-bloco__fonte">{b.exemplo}</pre>
                </details>
              </div>
              <div class="guia-bloco__amostra peca" data-secao="artigos">
                <div class="obra">{raw(converterObra(b.exemplo).html)}</div>
              </div>
            </section>
          ))}
        </div>
        <script src="/js/artigo.js" defer></script>
      </Documento>,
    ),
  );
});

/* ------------------------------------------------------------ o editor */

escrever.get('/escrever/editor', (c) => {
  const site = c.env.SITE_URL;
  const slug = c.req.query('pauta');
  const p = slug ? pautaPorSlug(slug) : null;
  const serie = p?.serie ? seriePorSlug(p.serie) : null;
  // O que o editor precisa saber da pauta, e só isso. Vai como JSON inerte
  // (type="application/json" não executa, e a CSP não precisa abrir nada).
  const dados = {
    pauta: p ? { slug: p.slug, titulo: p.titulo, objetivo: p.objetivo, formato: p.formato, nivel: p.nivel, cobrir: p.cobrir, blocos: p.blocos, serie: serie ? { titulo: serie.titulo, parte: p.parte, partes: serie.partes } : null } : null,
    blocos: Object.fromEntries((Object.keys(BLOCOS) as TipoBloco[]).map((k) => [k, { rotulo: BLOCOS[k].rotulo, para: BLOCOS[k].para }])),
    formatos: ROTULO_FORMATO_ARTIGO,
    niveis: ROTULO_NIVEL,
    finalidade: FINALIDADES.artigo,
  };
  const json = JSON.stringify(dados).replace(/</g, '\\u003c');

  c.header('Cache-Control', 'no-store');
  return c.html(
    pagina(
      <Documento
        titulo="Escrever um artigo"
        secao="escrever"
        descricao="O editor do Instituto Automação: escreva o seu artigo em blocos, veja como vai ficar e envie para o editor."
        url={`${site}/escrever/editor`}
        naoIndexar
        estilos={[CSS_ARTIGO_ROTA, CSS_ESCREVER_ROTA]}
      >
        {/* O título visível do editor é um campo de texto (o título do artigo);
            o h1 da página, para leitor de tela e para a hierarquia, é este. */}
        <h1 class="u-visually-hidden">{p ? `Escrever a pauta: ${p.titulo}` : 'Escrever um artigo'}</h1>
        <div id="editor" class="editor" data-estado="carregando">
          <noscript>
            <Aviso>
              O editor precisa de JavaScript. Se preferir, <a href="/escrever#conversar">fale com o editor</a> e mande o
              texto por e-mail — ou escreva o arquivo à mão seguindo <a href="/escrever/blocos">o padrão</a>.
            </Aviso>
          </noscript>
          <p class="editor__carregando">Abrindo o editor…</p>
        </div>
        <script type="application/json" id="editor-dados" dangerouslySetInnerHTML={{ __html: json }} />
        <script src="/js/escrever.js" type="module"></script>
      </Documento>,
    ),
  );
});

/* ------------------------------------------------------------ o envio */

/** IA-XXXXXX, sem letra que se confunde com número. */
function protocolo(): string {
  const alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const b = crypto.getRandomValues(new Uint8Array(6));
  return 'IA-' + [...b].map((x) => alfabeto[x % alfabeto.length]).join('');
}

const LIMITE = { markdown: 80_000, imagem: 600_000, foto: 200_000, arquivos: 20, total: 9_000_000 } as const;

const ehJpegOuPng = (b: Uint8Array): 'image/jpeg' | 'image/png' | null =>
  b[0] === 0xff && b[1] === 0xd8 ? 'image/jpeg' : b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 ? 'image/png' : null;

escrever.post('/escrever/enviar', async (c) => {
  const erro = (msg: string, status: 400 | 413 = 400) => c.json({ ok: false, erro: msg }, status);
  const tamanho = Number(c.req.header('content-length') ?? '0');
  if (tamanho > LIMITE.total) return erro('O envio passou de 9 MB. Tire uma ou outra imagem, ou mande em mais de uma vez.', 413);

  let f: FormData;
  try {
    f = await c.req.formData();
  } catch {
    return erro('Não consegui ler o envio. Tente de novo.');
  }
  if (String(f.get('sitio') ?? '')) return c.json({ ok: true, protocolo: 'IA-000000' }); // robô: finge que deu certo

  let d: {
    pauta?: string | null;
    meta?: { titulo?: string; lead?: string; formato?: string; nivel?: string };
    autor?: { nome?: string; email?: string; papel?: string; bio?: string; link?: string; foto?: boolean };
    consentimentos?: { autoria?: boolean; imagens?: boolean; privacidade?: boolean };
  };
  try {
    d = JSON.parse(String(f.get('dados') ?? '{}'));
  } catch {
    return erro('Os dados do envio vieram corrompidos. Recarregue o editor — o rascunho está salvo.');
  }
  const markdown = String(f.get('markdown') ?? '');
  const t = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
  const autor = { nome: t(d.autor?.nome, 120), email: t(d.autor?.email, 200), papel: t(d.autor?.papel, 80), bio: t(d.autor?.bio, 1200), link: t(d.autor?.link, 300) };
  const meta = { titulo: t(d.meta?.titulo, 160), lead: t(d.meta?.lead, 300), formato: t(d.meta?.formato, 20), nivel: t(d.meta?.nivel, 20) };
  const pauta = d.pauta && pautaPorSlug(d.pauta) ? d.pauta : null;

  /* As mesmas travas que o editor mostra antes de deixar enviar — repetidas
     aqui porque o editor é do lado de quem envia, e o servidor não confia. */
  if (autor.nome.split(/\s+/).length < 2) return erro('Falta o seu nome e sobrenome — é assinatura.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(autor.email)) return erro('Esse e-mail não parece válido.');
  if (autor.bio.length < 40) return erro('A bio precisa de pelo menos 40 caracteres: diga quem você é e o que faz.');
  if (autor.link && !/^https?:\/\//.test(autor.link)) return erro('O link do currículo precisa começar com http:// ou https://');
  if (meta.titulo.length < 10) return erro('O título está curto demais.');
  if (meta.lead.length < 20) return erro('Falta a linha fina: uma frase que faça o leitor querer a segunda.');
  if (!['guia', 'conceito', 'experiencia'].includes(meta.formato)) return erro('Escolha o formato do artigo.');
  if (!['iniciante', 'intermediario', 'avancado'].includes(meta.nivel)) return erro('Escolha o nível do artigo.');
  if (!d.consentimentos?.autoria || !d.consentimentos?.imagens || !d.consentimentos?.privacidade) return erro('Faltou marcar as três confirmações do fim.');
  if (markdown.length < 300) return erro('O texto está curto demais para um artigo.');
  if (markdown.length > LIMITE.markdown) return erro('O texto passou de 80 mil caracteres. Que tal virar uma série?');

  const r = converterObra(markdown);
  if (r.erros.length) return erro(`O texto tem ${r.erros.length} problema(s): ${r.erros.slice(0, 3).join(' · ')}`);

  const arquivos: { nome: string; tipo: 'image/jpeg' | 'image/png'; dados: ArrayBuffer }[] = [];
  const citadas = new Set(r.imagens);
  for (const [nome, v] of f.entries()) {
    if (typeof v === 'string' || !(nome.startsWith('img-') || nome === 'foto.jpg')) continue;
    if (arquivos.length >= LIMITE.arquivos) return erro(`No máximo ${LIMITE.arquivos} imagens por artigo.`);
    if (nome !== 'foto.jpg' && !citadas.has(nome)) continue; // imagem que o texto não usa não é guardada
    const dados = await (v as File).arrayBuffer();
    const teto = nome === 'foto.jpg' ? LIMITE.foto : LIMITE.imagem;
    if (dados.byteLength > teto) return erro(`A imagem ${nome} passou de ${teto / 1000} KB.`);
    const tipo = ehJpegOuPng(new Uint8Array(dados.slice(0, 4)));
    if (!tipo) return erro(`${nome} não é JPEG nem PNG.`);
    arquivos.push({ nome, tipo, dados });
  }
  const faltando = [...citadas].filter((n) => !arquivos.some((a) => a.nome === n));
  if (faltando.length) return erro(`O texto cita imagens que não chegaram: ${faltando.join(', ')}. Adicione de novo e envie.`);

  const prot = protocolo();
  await registrarSubmissao(c.env.DB, {
    protocolo: prot,
    pauta,
    titulo: meta.titulo,
    autorNome: autor.nome,
    autorEmail: autor.email,
    autor: { papel: autor.papel, bio: autor.bio, link: autor.link || null, foto: arquivos.some((a) => a.nome === 'foto.jpg') },
    meta,
    markdown,
    arquivos,
  });
  return c.json({ ok: true, protocolo: prot });
});
