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
          Cabeçalho centrado, no registro de jornal e de revista acadêmica.

          Sem símbolo, um instituto fica só com tipografia — e num cabeçalho
          centrado O NOME É O LOGOTIPO. É assim que publicação séria vive há
          duzentos anos sem nenhuma marca gráfica.

          Só a navegação gruda ao rolar: o bloco centrado gasta altura e,
          colado inteiro, comeria a tela. O botão de ação não cabe no centro,
          então fica na direita da navegação. E o laranja fica só com o
          estado ativo — azul no nome, na régua e no link deixaria o topo
          monocromático.
        */}
        <header>
          <div class="wrap marca">
            <a href="/" class="marca__nome">Instituto Automação</a>
            <span class="marca__linha">Radar · Agenda · Panorama da automação</span>
          </div>
          <div class="wrap"><div class="marca__regua"></div></div>

          <nav class="navbar" aria-label="Seções">
            <div class="wrap navbar__linha">
              {ORDEM_NUCLEOS.map((n) => (
                <a href={`/${n}`} aria-current={p.nucleo === n ? 'page' : undefined}>
                  {NUCLEOS[n].nome}
                </a>
              ))}
              <a href="/agenda">Agenda</a>
              <a href="/panorama">Panorama</a>
              <a href="/glossario" class="navbar__secundario">Glossário</a>
              <a href="/blueprints" class="navbar__secundario">Blueprints</a>
              <span class="navbar__acao">
                <a href="/agenda#enviar" class="botao-acao">Enviar um evento</a>
              </span>
            </div>
          </nav>
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
