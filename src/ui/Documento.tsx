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

        {/* v4 · cabeçalho institucional: nome, fio da marca, navegação.
            A tarja sólida do topo saiu — instituição se apresenta com nome e
            fio, não com faixa de portal. */}
        <header style="border-bottom: 3px solid var(--marca); background: var(--paper)">
          <div class="wrap" style="padding-block: var(--space-m) var(--space-s)">
            <div style="display:flex; flex-wrap:wrap; gap:var(--space-m); align-items:baseline; justify-content:space-between">
              <a href="/" style="text-decoration:none; color:inherit">
                <span style="display:block; font-family:var(--face-obra); font-size:var(--step-3); font-weight:700; letter-spacing:var(--tracking-tight); line-height:1.05">
                  Instituto Automação
                </span>
                <span
                  class="u-fluxo"
                  style="display:block; font-size:var(--step--2); text-transform:uppercase; letter-spacing:var(--tracking-kicker); color:var(--ink-faint); margin-block-start:var(--space-3xs)"
                >
                  Radar · Agenda · Panorama do setor
                </span>
              </a>
              <a
                href="/agenda"
                class="u-fluxo"
                style="font-size:var(--step--1); text-decoration:none; border:1px solid var(--marca); color:var(--marca); padding:var(--space-3xs) var(--space-xs); border-radius:var(--radius-s)"
              >
                Enviar um evento
              </a>
            </div>

            <nav
              class="u-fluxo"
              style="display:flex; flex-wrap:wrap; gap:var(--space-m); font-size:var(--step--1); margin-block-start:var(--space-m)"
            >
              {ORDEM_NUCLEOS.map((n) => (
                <a
                  href={`/${n}`}
                  style={
                    p.nucleo === n
                      ? 'text-decoration:none; color:var(--marca); font-weight:700; border-bottom:2px solid var(--marca); padding-block-end:var(--space-3xs)'
                      : 'text-decoration:none; color:var(--ink-muted); padding-block-end:var(--space-3xs)'
                  }
                  aria-current={p.nucleo === n ? 'page' : undefined}
                >
                  {NUCLEOS[n].nome}
                </a>
              ))}
              <span style="color:var(--rule-strong)">|</span>
              <a href="/agenda" style="text-decoration:none; color:var(--ink-muted)">Agenda</a>
              <a href="/panorama" style="text-decoration:none; color:var(--ink-muted)">Panorama</a>
            </nav>
          </div>
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
