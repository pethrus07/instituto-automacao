/**
 * O sistema de design servido pelo Worker.
 *
 * Os três arquivos de design/ são importados como texto (regra Text no
 * wrangler.toml), concatenados e servidos num único CSS com hash no nome e
 * cache imutável. Sem etapa de build: editar design/tokens.css e recarregar.
 *
 * O hash muda sozinho quando o CSS muda, então o navegador nunca fica com
 * folha velha e nunca rebusca folha igual.
 */
import tokens from '../design/tokens.css';
import base from '../design/base.css';
import componentes from '../design/components.css';

/**
 * O CSS servido, sem os comentários.
 *
 * O sistema de design é fortemente comentado de propósito — é onde as
 * decisões ficam registradas, e apagar isso do repositório seria perder o
 * porquê. Mas comentário é documentação para quem edita, não para quem lê a
 * página: mandá-lo ao navegador é cobrar do leitor uma conversa que não é
 * com ele.
 *
 * Conservador de propósito: tira comentário e recuo, e não mexe em mais
 * nada. Minificador esperto é como se quebra CSS de madrugada.
 */
function enxugar(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((linha) => linha.trim())
    .filter(Boolean)
    .join('\n');
}

export const CSS = enxugar([tokens, base, componentes].join('\n'));

/** djb2 — barato, síncrono, e suficiente para invalidar cache. */
function hash(texto: string): string {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) {
    h = ((h << 5) + h + texto.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

export const CSS_HASH = hash(CSS);
export const CSS_ROTA = `/a/app-${CSS_HASH}.css`;

/**
 * ⚠️ Pendência antes do primeiro deploy (design/SISTEMA.md): as três famílias
 * precisam ser self-hosted, com subset latin e .woff2, servidas daqui com
 * cache imutável. Enquanto isso, dev puxa do Google — um terceiro no caminho
 * crítico que não vai para produção.
 */
export const FONTES_DEV =
  'https://fonts.googleapis.com/css2' +
  '?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..600' +
  '&family=IBM+Plex+Mono:wght@400;500;600' +
  '&family=IBM+Plex+Sans:wght@400;500;600;700' +
  '&display=swap';
