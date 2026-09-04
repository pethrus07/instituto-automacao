/**
 * O invólucro de toda página: <head>, cabeçalho, navegação e rodapé.
 *
 * Zero JavaScript, com uma exceção: o botão de tema. Tudo o mais é <a>.
 */
import { raw } from 'hono/html';
import { CSS_ROTA, FONTES_DEV } from '../estilo';
import { simbolo } from './marca';
import type { Secao } from '../conteudo';

type Props = {
  titulo: string;
  descricao?: string;
  /** a seção atual, para o estado ativo da navegação */
  secao?: Secao | 'agenda' | 'glossario' | 'blueprints';
  url?: string;
  /** JSON-LD já serializado e escapado (ver ui/jsonld.ts). */
  ld?: string;
  /** `article` para peça; `website` para o resto */
  tipoOg?: 'website' | 'article';
  children?: unknown;
};

const NAV: { href: string; texto: string; chave: Props['secao'] }[] = [
  { href: '/noticias', texto: 'Notícias', chave: 'noticias' },
  { href: '/relatorios', texto: 'Relatórios', chave: 'relatorios' },
  { href: '/agenda', texto: 'Agenda', chave: 'agenda' },
  { href: '/giro', texto: 'Giro da Semana', chave: 'giro' },
];

export const Documento = (p: Props) => {
  const titulo = p.titulo === 'Instituto Automação' ? p.titulo : `${p.titulo} — Instituto Automação`;

  return (
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{titulo}</title>
        {p.descricao && <meta name="description" content={p.descricao} />}
        <meta property="og:title" content={titulo} />
        {p.descricao && <meta property="og:description" content={p.descricao} />}
        <meta property="og:type" content={p.tipoOg ?? 'website'} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Instituto Automação" />
        {p.url && <link rel="canonical" href={p.url} />}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

        {/* DEV: em produção as fontes são self-hosted. Ver design/SISTEMA.md */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link rel="stylesheet" href={FONTES_DEV} />
        <link rel="stylesheet" href={CSS_ROTA} />

        {p.ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: p.ld }} />}

        <link rel="alternate" type="application/rss+xml" title="Instituto Automação" href="/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Notícias — Instituto Automação" href="/feed/noticias.xml" />
        <link rel="alternate" type="application/rss+xml" title="Relatórios — Instituto Automação" href="/feed/relatorios.xml" />
        <link rel="alternate" type="application/rss+xml" title="Giro da Semana — Instituto Automação" href="/feed/giro.xml" />
      </head>

      <body>
        <a class="u-visually-hidden" href="#conteudo">
          Pular para o conteúdo
        </a>

        {/*
          O cabeçalho de revista: símbolo e nome no centro, a linha de
          propósito embaixo, a régua, e a navegação — que é a única parte que
          gruda ao rolar.

          A marca gráfica é a varredura de radar das capas geradas: um anel,
          um raio, e UM ponto aceso. Duas cores com o mesmo trabalho que têm
          no resto do site — azul é a instituição, laranja é o que importa.
        */}
        <header>
          <div class="wrap marca">
            <a href="/" class="marca__lockup" aria-label="Instituto Automação — capa">
              {raw(simbolo(44))}
              <span class="marca__nome">
                <span class="marca__nome-fino">Instituto</span> Automação
              </span>
            </a>
            <p class="marca__linha">O que o setor de automação publica lá fora, lido daqui.</p>
          </div>
          <div class="wrap">
            <div class="marca__regua"></div>
          </div>

          <nav class="navbar" aria-label="Seções">
            <div class="wrap navbar__linha">
              {NAV.map((n) => (
                <a href={n.href} aria-current={p.secao === n.chave ? 'page' : undefined}>
                  {n.texto}
                </a>
              ))}
              <span class="navbar__sep" aria-hidden="true"></span>
              <a href="/glossario" class="navbar__secundario" aria-current={p.secao === 'glossario' ? 'page' : undefined}>
                Glossário
              </a>
              <a href="/blueprints" class="navbar__secundario" aria-current={p.secao === 'blueprints' ? 'page' : undefined}>
                Blueprints
              </a>
              <span class="navbar__acao">
                <a href="/agenda#enviar" class="botao-acao">Enviar um evento</a>
              </span>
            </div>
          </nav>
        </header>

        <main id="conteudo" class="wrap" style="padding-block: var(--space-xl) var(--space-3xl)">
          {p.children}
        </main>

        <footer class="rodape">
          <div class="wrap rodape__grade">
            <div>
              <a href="/" class="rodape__marca" aria-label="Instituto Automação">
                {raw(simbolo(28))}
                <span>Instituto Automação</span>
              </a>
              <p class="rodape__texto">
                Lemos o que o setor de automação publica lá fora, escolhemos o que importa para
                quem opera no Brasil, e escrevemos em português — com crédito e link para a fonte
                em toda peça. E medimos quanto tempo cada assunto leva para chegar aqui.
              </p>
            </div>
            <div class="rodape__colunas">
              <div>
                <span class="rodape__rotulo">Seções</span>
                <a href="/noticias">Notícias</a>
                <a href="/relatorios">Relatórios</a>
                <a href="/agenda">Agenda</a>
                <a href="/giro">Giro da Semana</a>
              </div>
              <div>
                <span class="rodape__rotulo">O método</span>
                <a href="/blueprints">Blueprints e fontes</a>
                <a href="/glossario">Glossário</a>
                <a href="/feed.xml">RSS</a>
              </div>
            </div>
          </div>
          <div class="wrap rodape__pe">
            <span>Nada aqui é gerado por máquina. Toda peça tem autor.</span>
            <button id="tema" type="button" class="pilula" aria-label="Alternar tema claro e escuro">
              Tema
            </button>
          </div>
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
