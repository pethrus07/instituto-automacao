/**
 * Markdown mínimo para o corpo da obra.
 *
 * Deliberadamente pequeno: parágrafo, título, ênfase, link, lista, citação e
 * regra. Nada de tabela, imagem embutida ou HTML cru — o corpo chega pelo
 * WhatsApp e é escrito no celular, não num editor.
 *
 * ⚠️ A ORDEM É A SEGURANÇA. O texto é escapado ANTES de qualquer conversão.
 * Depois disso não existe mais `<` nem `>` vindos do autor, e a marcação que
 * geramos é a única que sobra. Escapar depois seria o mesmo que não escapar.
 */

function escapar(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Ênfase e link, dentro de uma linha já escapada. */
function inline(s: string): string {
  return (
    s
      // link: só http(s). `javascript:` e `data:` não passam.
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, texto, url) => {
        const externo = ' rel="nofollow noopener" target="_blank"';
        return `<a href="${url}"${externo}>${texto}</a>`;
      })
      // link interno: só caminho relativo do próprio site
      .replace(/\[([^\]]+)\]\((\/[^\s)]*)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
  );
}

export function renderizarObra(markdown: string): string {
  const linhas = escapar(markdown.replace(/\r\n/g, '\n')).split('\n');
  const saida: string[] = [];
  let lista: 'ul' | 'ol' | null = null;
  let paragrafo: string[] = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) {
      saida.push(`<p>${inline(paragrafo.join(' '))}</p>`);
      paragrafo = [];
    }
  };
  const fecharLista = () => {
    if (lista) {
      saida.push(`</${lista}>`);
      lista = null;
    }
  };
  const fechar = () => {
    fecharParagrafo();
    fecharLista();
  };

  for (const linha of linhas) {
    const l = linha.trim();

    if (!l) {
      fechar();
      continue;
    }

    const titulo = /^(#{2,4})\s+(.*)$/.exec(l);
    if (titulo) {
      fechar();
      // Começa no h2: o h1 da página é o título da obra, e só pode haver um.
      const nivel = Math.min(titulo[1]!.length, 4);
      saida.push(`<h${nivel}>${inline(titulo[2]!)}</h${nivel}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(l)) {
      fechar();
      saida.push('<hr />');
      continue;
    }

    const citacao = /^&gt;\s?(.*)$/.exec(l);
    if (citacao) {
      fechar();
      saida.push(`<blockquote><p>${inline(citacao[1]!)}</p></blockquote>`);
      continue;
    }

    const marcador = /^[-*]\s+(.*)$/.exec(l);
    const numerada = /^\d+\.\s+(.*)$/.exec(l);
    if (marcador || numerada) {
      fecharParagrafo();
      const tipo = marcador ? 'ul' : 'ol';
      if (lista !== tipo) {
        fecharLista();
        saida.push(`<${tipo}>`);
        lista = tipo;
      }
      saida.push(`<li>${inline((marcador ?? numerada)![1]!)}</li>`);
      continue;
    }

    fecharLista();
    paragrafo.push(l);
  }

  fechar();
  return saida.join('\n');
}

/** Tempo de leitura, para a assinatura. ~200 palavras por minuto em texto técnico. */
export function minutosDeLeitura(markdown: string): number {
  const palavras = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(palavras / 200));
}
