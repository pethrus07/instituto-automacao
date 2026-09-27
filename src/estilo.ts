/**
 * O sistema de design servido pelo Worker.
 *
 * Os arquivos de design/ são importados como texto (regra Text no
 * wrangler.toml), concatenados e servidos num único CSS com hash no nome e
 * cache imutável. Sem etapa de build: editar design/tokens.css e recarregar.
 *
 * O hash muda sozinho quando o CSS muda, então o navegador nunca fica com
 * folha velha e nunca rebusca folha igual.
 */
import tokens from '../design/tokens.css';
import base from '../design/base.css';
import componentes from '../design/components.css';
import blocos from '../design/blocos.css';
import paginasEscrever from '../design/escrever-paginas.css';
import editor from '../design/escrever.css';

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
 * A folha do ARTIGO: os blocos do padrão (resumo, avisos, quiz, fórmula…) e
 * as páginas de /escrever. À parte desde 27/09/2026 — somados à folha geral
 * eles a levavam de 48 para 73 KB, e quem lê notícia pagaria por um quiz que
 * nunca vê. Vai só na peça que usa bloco e em /escrever.
 */
export const CSS_ARTIGO = enxugar([blocos, paginasEscrever].join('\n'));
export const CSS_ARTIGO_ROTA = `/a/artigo-${hash(CSS_ARTIGO)}.css`;

/**
 * A folha do editor de /escrever, à parte: só uma página a usa, e o leitor
 * de notícia não precisa baixar o CSS de um editor que nunca vai abrir.
 */
export const CSS_ESCREVER = enxugar(editor);
export const CSS_ESCREVER_ROTA = `/a/escrever-${hash(CSS_ESCREVER)}.css`;
