/**
 * O invólucro de toda página: <head>, cabeçalho, navegação e rodapé.
 *
 * Zero JavaScript, com uma exceção: o botão de tema. Navegação entre núcleos
 * é <a>, filtro é <form method="get"> — cada estado vira URL própria.
 */
import { CSS_ROTA, FONTES_DEV } from '../estilo';
import { NUCLEOS, ORDEM_NUCLEOS, type ChaveNucleo } from '../config';

type Props = {
  titulo: string;
  descricao?: string;
  /** define --accent-* para a página inteira */
  nucleo?: ChaveNucleo;
  url?: string;
  /** JSON-LD já serializado e escapado (ver ui/jsonld.ts). */
  ld?: string;
  children?: unknown;
};

export const Documento = (p: Props) => {
  const classe = p.nucleo ? NUCLEOS[p.nucleo].classe : '';
  const titulo = p.nucleo
    ? `${p.titulo} · ${NUCLEOS[p.nucleo].nome} — Instituto Automação`
    : `${p.titulo} — Instituto Automação`;

  return (
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{titulo}</title>
        {p.descricao && <meta name="description" content={p.descricao} />}
        <meta property="og:title" content={titulo} />
        {p.descricao && <meta property="og:description" content={p.descricao} />}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
        {p.url && <link rel="canonical" href={p.url} />}

        {/* DEV: em produção as fontes são self-hosted. Ver design/SISTEMA.md */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link rel="stylesheet" href={FONTES_DEV} />
        <link rel="stylesheet" href={CSS_ROTA} />

        {p.ld && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: p.ld }} />
        )}

        {ORDEM_NUCLEOS.map((n) => (
          <link
            rel="alternate"
            type="application/rss+xml"
            title={`${NUCLEOS[n].nome} — Instituto Automação`}
            href={`/feed/${n}.xml`}
          />
        ))}
      </head>

      <body class={classe}>
        <a class="u-visually-hidden" href="#conteudo">
          Pular para o conteúdo
        </a>

        {/*
          Cabeçalho institucional. Duas cores com trabalho definido:
          azul é a instituição — nome, estado ativo, link;
          laranja é a ação — o fio de topo e o único botão.

          Os dois fios emoldurando o bloco são recurso de jornal impresso:
          dão começo e fim ao cabeçalho sem caixa e sem sombra.
        */}
        <header class="cabecalho">
          <div class="wrap">
            <div class="cabecalho__topo">
              <a href="/" class="marca-nome">
                <span class="marca-nome__texto">Instituto Automação</span>
                <span class="marca-nome__linha">Radar · Agenda · Panorama do setor</span>
              </a>
              <a href="/agenda#enviar" class="botao-acao">Enviar um evento</a>
            </div>

            <nav class="cabecalho__nav" aria-label="Seções">
              {ORDEM_NUCLEOS.map((n) => (
                <a href={`/${n}`} aria-current={p.nucleo === n ? 'page' : undefined}>
                  {NUCLEOS[n].nome}
                </a>
              ))}
              <span class="cabecalho__sep" aria-hidden="true">
                ·
              </span>
              <a href="/agenda">Agenda</a>
              <a href="/panorama">Panorama</a>
            </nav>
          </div>
          <div class="cabecalho__fio"></div>
        </header>

        <main id="conteudo" class="wrap" style="padding-block: var(--space-xl)">
          {p.children}
        </main>

        <footer
          class="wrap u-fluxo"
          style="padding-block: var(--space-xl); border-top: var(--border-hair); font-size: var(--step--1); color: var(--ink-muted)"
        >
          <p style="max-width: var(--measure)">
            O que o setor publicou lá fora hoje, em português, hoje. Todo item traz crédito e
            link para a fonte original.
          </p>
          <p style="margin-block-start: var(--space-s)">
            <button
              id="tema"
              type="button"
              class="pilula"
              style="background:none; font: inherit"
              aria-label="Alternar tema claro e escuro"
            >
              Tema
            </button>
          </p>
        </footer>

        {/* A única linha de JS do site. Tudo o mais é HTML. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var r=document.documentElement;try{var t=localStorage.getItem('tema');if(t==='dark'||t==='light')r.dataset.theme=t}catch(e){}var b=document.getElementById('tema');if(!b)return;b.addEventListener('click',function(){var e=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;var n=e?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('tema',n)}catch(e){}})})()`,
          }}
        />
      </body>
    </html>
  );
};
