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
 *
 * 07/09/2026, feedback do sócio: o botão de tema subiu do rodapé para a
 * navegação ("ficou pouco visível onde muda o tema"); entrou a linha de data
 * no alto, como num jornal; a seção Artigos entrou na navegação; o rodapé
 * ganhou a coluna do Instituto (quem escreve, escreva, apoie) e o colofão.
 */
import { raw } from 'hono/html';
import { CSS_ROTA } from '../estilo';
import { simbolo } from './marca';
import { TEMA_SCRIPT } from './tema';
import { dataHoje } from './pecas';
import { GOOGLE_VERIFICACAO, NOME_SITE, absoluta, descricaoCurta, origemDe, tituloDaAba } from './seo';
import type { Secao } from '../conteudo';

export type ImagemOg = { url: string; largura?: number; altura?: number; alt?: string };

type Props = {
  titulo: string;
  /** o título da aba e do resultado de busca, quando o título inteiro é longo */
  tituloCurto?: string;
  descricao?: string;
  /** a seção atual, para o estado ativo da navegação */
  secao?: Secao | 'agenda' | 'glossario' | 'blueprints' | 'marca' | 'autores' | 'apoie' | 'privacidade' | 'escrever';
  /** URL canônica, absoluta */
  url?: string;
  /** JSON-LD já serializado e escapado (ver ui/jsonld.ts); um ou vários blocos */
  ld?: string | string[];
  /** `article` para peça; `profile` para autor; `website` para o resto */
  tipoOg?: 'website' | 'article' | 'profile';
  /** a imagem de compartilhamento; sem ela, entra a padrão do site */
  imagemOg?: ImagemOg;
  /** metadados de artigo (Open Graph) — só em peça */
  artigo?: { publicado: string; autor: string; secao: string };
  /** páginas de erro e utilitárias não entram no índice */
  naoIndexar?: boolean;
  /** folhas de estilo a mais, só desta página (o editor de /escrever tem a dele) */
  estilos?: string[];
  children?: unknown;
};

const NAV: { href: string; texto: string; chave: Props['secao'] }[] = [
  { href: '/noticias', texto: 'Notícias', chave: 'noticias' },
  { href: '/artigos', texto: 'Artigos', chave: 'artigos' },
  { href: '/relatorios', texto: 'Relatórios', chave: 'relatorios' },
  { href: '/agenda', texto: 'Agenda', chave: 'agenda' },
  { href: '/giro', texto: 'Giro da Semana', chave: 'giro' },
  /* 24/09/2026: "vai ter uma abazinha chamada Escrever" — a promessa da
     reunião. Fica na navegação de toda página porque o autor é o ativo do
     Instituto, e o convite tem de estar onde o leitor já está. */
  { href: '/escrever', texto: 'Escrever', chave: 'escrever' },
];

/**
 * O ícone do botão de tema: no claro mostra a lua (para onde o clique leva);
 * no escuro, o sol. O CSS troca pelo data-theme — o script só alterna o atributo.
 */
const ICONE_TEMA = `<svg class="tema-icone" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
  <g class="tema-icone__sol"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"/></g>
  <path class="tema-icone__lua" d="M14.5 3.2a8.8 8.8 0 1 0 6.3 12.6A7 7 0 0 1 14.5 3.2Z"/>
</svg>`;

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
        {GOOGLE_VERIFICACAO && <meta name="google-site-verification" content={GOOGLE_VERIFICACAO} />}
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
        {p.estilos?.map((href) => <link rel="stylesheet" href={href} />)}

        {lds.map((ld) => (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
        ))}

        <link rel="alternate" type="application/rss+xml" title={NOME_SITE} href="/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title={`Notícias — ${NOME_SITE}`} href="/feed/noticias.xml" />
        <link rel="alternate" type="application/rss+xml" title={`Artigos — ${NOME_SITE}`} href="/feed/artigos.xml" />
        <link rel="alternate" type="application/rss+xml" title={`Relatórios — ${NOME_SITE}`} href="/feed/relatorios.xml" />
        <link rel="alternate" type="application/rss+xml" title={`Giro da Semana — ${NOME_SITE}`} href="/feed/giro.xml" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>

      <body>
        <a class="u-visually-hidden" href="#conteudo">
          Pular para o conteúdo
        </a>

        {/*
          O cabeçalho de revista: a linha de data no alto, símbolo e nome no
          centro, a linha de propósito, a régua dupla, e a navegação — que é a
          única parte que gruda ao rolar.
        */}
        <header class="cabecalho">
          <div class="wrap dateline">
            <span class="dateline__data">{dataHoje()}</span>
            <span class="dateline__nota">Lido na fonte, publicado com crédito e link.</span>
            <a class="dateline__link" href="/feed.xml">
              RSS
            </a>
          </div>
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
              {/* O tema mora aqui, não no rodapé: quem quer ler no escuro procura no alto. */}
              <button id="tema" type="button" class="navbar__tema" aria-label="Alternar tema claro e escuro" title="Alternar tema claro e escuro">
                {raw(ICONE_TEMA)}
                <span class="navbar__tema-texto">Tema</span>
              </button>
              {/* "Enviar um evento" saiu daqui em 11/09/2026 (decisão do Pedro).
                  Ele era o único botão de ação do site e aparecia em TODA página,
                  inclusive na capa — pedindo tarefa ao leitor antes de o site ter
                  entregado alguma coisa, e competindo com o cadastro, que é o
                  ativo. O convite agora vive só na agenda, que é onde o
                  formulário está. */}
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
                em todo texto. E guardamos tudo o que lemos, para medir quanto tempo cada assunto
                leva para chegar aqui.
              </p>
            </div>
            <nav class="rodape__colunas" aria-label="Rodapé">
              <div>
                <span class="rodape__rotulo">Seções</span>
                <a href="/noticias">Notícias</a>
                <a href="/artigos">Artigos</a>
                <a href="/relatorios">Relatórios</a>
                <a href="/agenda">Agenda</a>
                <a href="/giro">Giro da Semana</a>
              </div>
              <div>
                <span class="rodape__rotulo">O Instituto</span>
                <a href="/autores">Quem escreve</a>
                <a href="/escrever">Escreva no Instituto</a>
                <a href="/apoie">Apoie</a>
                <a href="/marca">Marca</a>
                <a href="/privacidade">Privacidade</a>
              </div>
              <div>
                <span class="rodape__rotulo">O método</span>
                <a href="/blueprints">Blueprints e fontes</a>
                <a href="/glossario">Glossário</a>
                <a href="/blueprints#dataset">Dataset</a>
                <a href="/feed.xml">RSS</a>
              </div>
            </nav>
          </div>
          <div class="wrap rodape__pe">
            <span>Toda notícia tem fonte, crédito e link. O Giro é boletim de números, gerado da apuração.</span>
            <span class="rodape__colofao">Composto em Newsreader e IBM Plex · Sem rastreador, sem terceiro na página</span>
          </div>
        </footer>

        {/* A única linha de JS do site (ui/tema.ts). A CSP só a deixa rodar
            pelo hash — o compilador calcula, o QA confere. */}
        <script dangerouslySetInnerHTML={{ __html: TEMA_SCRIPT }} />
      </body>
    </html>
  );
};
