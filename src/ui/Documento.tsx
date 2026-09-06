/**
 * O invólucro de toda página: <head>, cabeçalho, navegação e rodapé.
 *
 * Zero JavaScript, com uma exceção: o botão de tema (ui/tema.ts). Tudo o
 * mais é <a>.
 *
 * O <head> é onde o site é lido por máquina: título curto para a busca,
 * descrição de até 160 caracteres, imagem para compartilhar (Open Graph e
 * Twitter), JSON-LD, fontes self-hosted com preload, ícones e manifesto.
 * Nada aqui é afirmado sem existir na página.
 */
import { raw } from 'hono/html';
import { CSS_ROTA } from '../estilo';
import { simbolo } from './marca';
import { TEMA_SCRIPT } from './tema';
import { NOME_SITE, absoluta, descricaoCurta, origemDe, tituloDaAba } from './seo';
import type { Secao } from '../conteudo';

export type ImagemOg = { url: string; largura?: number; altura?: number; alt?: string };

type Props = {
  titulo: string;
  /** o título da aba e do resultado de busca, quando o título inteiro é longo */
  tituloCurto?: string;
  descricao?: string;
  /** a seção atual, para o estado ativo da navegação */
  secao?: Secao | 'agenda' | 'glossario' | 'blueprints' | 'marca';
  /** URL canônica, absoluta */
  url?: string;
  /** JSON-LD já serializado e escapado (ver ui/jsonld.ts); um ou vários blocos */
  ld?: string | string[];
  /** `article` para peça; `website` para o resto */
  tipoOg?: 'website' | 'article';
  /** a imagem de compartilhamento; sem ela, entra a padrão do site */
  imagemOg?: ImagemOg;
  /** metadados de artigo (Open Graph) — só em peça */
  artigo?: { publicado: string; autor: string; secao: string };
  /** páginas de erro e utilitárias não entram no índice */
  naoIndexar?: boolean;
  children?: unknown;
};

const NAV: { href: string; texto: string; chave: Props['secao'] }[] = [
  { href: '/noticias', texto: 'Notícias', chave: 'noticias' },
  { href: '/relatorios', texto: 'Relatórios', chave: 'relatorios' },
  { href: '/agenda', texto: 'Agenda', chave: 'agenda' },
  { href: '/giro', texto: 'Giro da Semana', chave: 'giro' },
];

export const Documento = (p: Props) => {
  const titulo = tituloDaAba(p.titulo, p.tituloCurto);
  const descricao = descricaoCurta(p.descricao);
  const base = origemDe(p.url);
  const og: ImagemOg = p.imagemOg
    ? { ...p.imagemOg, url: absoluta(base, p.imagemOg.url) }
    : { url: absoluta(base, '/og/padrao.png'), largura: 1200, altura: 630, alt: `${NOME_SITE} — o que o setor de automação publica lá fora, lido daqui` };
  const lds = p.ld ? (Array.isArray(p.ld) ? p.ld : [p.ld]) : [];

  return (
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{titulo}</title>
        {descricao && <meta name="description" content={descricao} />}
        {p.naoIndexar && <meta name="robots" content="noindex, follow" />}
        {p.url && <link rel="canonical" href={p.url} />}

        {/* Open Graph: o que aparece quando alguém compartilha */}
        <meta property="og:type" content={p.tipoOg ?? 'website'} />
        <meta property="og:site_name" content={NOME_SITE} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:title" content={p.titulo === NOME_SITE ? p.titulo : `${p.titulo} — ${NOME_SITE}`} />
        {descricao && <meta property="og:description" content={descricao} />}
        {p.url && <meta property="og:url" content={p.url} />}
        <meta property="og:image" content={og.url} />
        {og.largura && <meta property="og:image:width" content={String(og.largura)} />}
        {og.altura && <meta property="og:image:height" content={String(og.altura)} />}
        {og.alt && <meta property="og:image:alt" content={og.alt} />}
        {p.artigo && <meta property="article:published_time" content={p.artigo.publicado} />}
        {p.artigo && <meta property="article:author" content={p.artigo.autor} />}
        {p.artigo && <meta property="article:section" content={p.artigo.secao} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={p.titulo} />
        {descricao && <meta name="twitter:description" content={descricao} />}
        <meta name="twitter:image" content={og.url} />
        {og.alt && <meta name="twitter:image:alt" content={og.alt} />}

        {/* cor da barra do navegador: o papel no claro, o papel do escuro no escuro */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0d0d0f" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icones/icone-180.png" />
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Fontes self-hosted (publico/fontes/), só o subset latin. As duas do
            caminho crítico vão em preload; a itálica e a mono chegam quando o
            CSS pedir. Nenhum terceiro no caminho da primeira pintura. */}
        <link rel="preload" href="/fontes/newsreader-latin.woff2" as="font" type="font/woff2" crossorigin="" />
        <link rel="preload" href="/fontes/plex-sans-latin.woff2" as="font" type="font/woff2" crossorigin="" />
        <link rel="stylesheet" href={CSS_ROTA} />

        {lds.map((ld) => (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
        ))}

        <link rel="alternate" type="application/rss+xml" title={NOME_SITE} href="/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title={`Notícias — ${NOME_SITE}`} href="/feed/noticias.xml" />
        <link rel="alternate" type="application/rss+xml" title={`Relatórios — ${NOME_SITE}`} href="/feed/relatorios.xml" />
        <link rel="alternate" type="application/rss+xml" title={`Giro da Semana — ${NOME_SITE}`} href="/feed/giro.xml" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>

      <body>
        <a class="u-visually-hidden" href="#conteudo">
          Pular para o conteúdo
        </a>

        {/*
          O cabeçalho de revista: símbolo e nome no centro, a linha de
          propósito embaixo, a régua, e a navegação — que é a única parte que
          gruda ao rolar.
        */}
        <header>
          <div class="wrap marca">
            <a href="/" class="marca__lockup" aria-label={`${NOME_SITE} — capa`}>
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
              <a href="/" class="rodape__marca" aria-label={NOME_SITE}>
                {raw(simbolo(28))}
                <span>{NOME_SITE}</span>
              </a>
              <p class="rodape__texto">
                Lemos o que o setor de automação publica lá fora, escolhemos o que importa para
                quem opera no Brasil, e escrevemos em português — com crédito e link para a fonte
                em toda peça. E medimos quanto tempo cada assunto leva para chegar aqui.
              </p>
            </div>
            <nav class="rodape__colunas" aria-label="Rodapé">
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
                <a href="/marca">Marca</a>
                <a href="/feed.xml">RSS</a>
              </div>
            </nav>
          </div>
          <div class="wrap rodape__pe">
            <span>Nada aqui é gerado por máquina. Toda peça tem autor.</span>
            <button id="tema" type="button" class="pilula" aria-label="Alternar tema claro e escuro">
              Tema
            </button>
          </div>
        </footer>

        {/* A única linha de JS do site (ui/tema.ts). A CSP só a deixa rodar
            pelo hash — o compilador calcula, o QA confere. */}
        <script dangerouslySetInnerHTML={{ __html: TEMA_SCRIPT }} />
      </body>
    </html>
  );
};
