/**
 * Parser de RSS 2.0, Atom 1.0 e RDF/RSS 1.0.
 *
 * Feito à mão e de propósito: os três formatos são regulares o bastante, e
 * um parser focado deixa explícito o que fazemos com CDATA, entidade e
 * namespace — que é onde parser genérico costuma engolir item em silêncio.
 * Silêncio aqui é grave: item não coletado não volta, porque feed guarda só
 * as últimas dezenas.
 *
 * Não valida XML. Se o feed vier quebrado, devolve o que deu para ler e
 * quem chama registra em fonte.ultimo_erro.
 */

export type EntradaFeed = {
  titulo: string;
  link: string;
  publicado: string | null; // ISO UTC
  resumo: string | null;
  guid: string | null;
};

/* ------------------------------------------------------------------ texto */

const ENTIDADES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
};

function decodificar(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (todo, nome) => ENTIDADES[nome.toLowerCase()] ?? todo);
}

/**
 * ⚠️ A ORDEM AQUI É O PONTO.
 *
 * Feed entrega HTML **escapado** (`&lt;p&gt;`). Se tirarmos as tags antes de
 * decodificar, o `&lt;p&gt;` passa ileso pela limpeza e só vira `<p>` no
 * final — e a tag entra no resumo de todo item do site.
 *
 * Então: CDATA → decodifica → tira tag → decodifica de novo (entidade
 * duplamente escapada, `&amp;amp;`) → colapsa espaço.
 */
function limpar(bruto: string | null, maxLen = 1200): string | null {
  if (bruto == null) return null;
  let s = bruto.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  s = decodificar(s);
  s = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ');
  s = s.replace(/<[^>]+>/g, ' '); // resumo é texto, nunca HTML de terceiro
  s = decodificar(s).replace(/\s+/g, ' ').trim();
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen - 1).trimEnd() + '…' : s;
}

/** Primeira ocorrência de <tag> em qualquer namespace (dc:date, media:title…). */
function tag(bloco: string, nome: string): string | null {
  const re = new RegExp(`<(?:[a-z0-9]+:)?${nome}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z0-9]+:)?${nome}>`, 'i');
  return re.exec(bloco)?.[1] ?? null;
}

function atributo(bloco: string, tagNome: string, attr: string): string | null {
  const re = new RegExp(`<(?:[a-z0-9]+:)?${tagNome}\\b[^>]*\\b${attr}\\s*=\\s*["']([^"']+)["']`, 'i');
  return re.exec(bloco)?.[1] ?? null;
}

/* ------------------------------------------------------------------ datas */

/**
 * RFC 822 (RSS), ISO 8601 (Atom) e o que mais aparecer. Data ilegível vira
 * null — e quem chama decide. Nunca inventar "agora": data errada estraga a
 * medição de atraso, que é a razão de o projeto existir.
 */
export function paraISO(bruta: string | null): string | null {
  if (!bruta) return null;
  const s = decodificar(bruta).trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  // feed com data no futuro costuma ser fuso mal escrito; 2 dias de tolerância
  if (d.getTime() > Date.now() + 2 * 86400000) return null;
  return d.toISOString();
}

/* ----------------------------------------------------------------- Atom */

function linkDeAtom(bloco: string): string | null {
  // prefere rel="alternate"; senão o primeiro <link href> que não seja self
  const links = [...bloco.matchAll(/<(?:[a-z0-9]+:)?link\b([^>]*)>/gi)].map((m) => m[1] ?? '');
  const href = (a: string) => /\bhref\s*=\s*["']([^"']+)["']/i.exec(a)?.[1] ?? null;
  const rel = (a: string) => /\brel\s*=\s*["']([^"']+)["']/i.exec(a)?.[1]?.toLowerCase() ?? 'alternate';

  const alternate = links.find((a) => rel(a) === 'alternate' && href(a));
  if (alternate) return href(alternate);
  const outro = links.find((a) => rel(a) !== 'self' && href(a));
  return outro ? href(outro) : null;
}

/* --------------------------------------------------------------- parser */

export function lerFeed(xml: string): EntradaFeed[] {
  const texto = xml.replace(/^﻿/, '');
  const atom = /<(?:[a-z0-9]+:)?entry[\s>]/i.test(texto);
  const marca = atom ? 'entry' : 'item';

  const blocos = [
    ...texto.matchAll(
      new RegExp(`<(?:[a-z0-9]+:)?${marca}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z0-9]+:)?${marca}>`, 'gi'),
    ),
  ].map((m) => m[1] ?? '');

  const entradas: EntradaFeed[] = [];

  for (const bloco of blocos) {
    let titulo = limpar(tag(bloco, 'title'), 400);

    const link = atom
      ? linkDeAtom(bloco)
      : limpar(tag(bloco, 'link'), 2000) ?? atributo(bloco, 'link', 'href');
    if (!link) continue; // sem link não há como creditar a fonte

    const publicado =
      paraISO(tag(bloco, 'pubDate')) ??
      paraISO(tag(bloco, 'published')) ??
      paraISO(tag(bloco, 'date')) ?? // dc:date
      paraISO(tag(bloco, 'updated'));

    // ordem importa: summary é mais curto e mais limpo que content
    const resumo =
      limpar(tag(bloco, 'summary')) ??
      limpar(tag(bloco, 'description')) ??
      limpar(tag(bloco, 'encoded')) ?? // content:encoded
      limpar(tag(bloco, 'content'));

    /**
     * Item sem título.
     *
     * A versão anterior descartava — "sem título não há item". Certo para
     * notícia, errado para microblog: post de Mastodon não tem <title>,
     * só <description>, e o post É o conteúdo. Descartando, o Instituto
     * simplesmente não enxergaria rede social.
     *
     * Descoberto sondando feed real, não lendo documentação.
     */
    if (!titulo) {
      const bruto = resumo ?? '';
      const corte = bruto.search(/[.!?](\s|$)/);
      const frase = corte > 20 ? bruto.slice(0, corte + 1) : bruto;
      titulo = frase.length > 160 ? frase.slice(0, 157).trimEnd() + '…' : frase;
    }
    if (!titulo) continue; // sem título E sem texto: não há item

    entradas.push({
      titulo,
      link: decodificar(link.trim()),
      publicado,
      resumo,
      guid: limpar(tag(bloco, 'guid') ?? tag(bloco, 'id'), 400),
    });
  }

  return entradas;
}
