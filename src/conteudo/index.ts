/**
 * O conteúdo, do lado do Worker.
 *
 * Tudo aqui é leitura de um array em memória — o módulo gerado pelo
 * compilador. Não há banco, não há requisição, não há espera: a página de
 * uma peça é montada em microssegundos, e o Worker fica burro de propósito.
 *
 * O git é o CMS. Estas funções são só o índice.
 */
import { ARTES, AUTORES, PECAS } from '../conteudo.gerado';
import type { Autor, Peca, Secao } from './tipos';

export type { Autor, Peca, Secao, Tema, Formato, Veredito } from './tipos';
export { SECOES, TEMAS, VEREDITOS } from './tipos';

/** Todas, da mais recente para a mais antiga. */
export function todas(): readonly Peca[] {
  return PECAS;
}

export function porSecao(secao: Secao): Peca[] {
  return PECAS.filter((p) => p.secao === secao);
}

export function obter(secao: Secao, slug: string): Peca | null {
  return PECAS.find((p) => p.secao === secao && p.slug === slug) ?? null;
}

/**
 * A peça que abre a capa: a marcada com `destaque: true`; senão a notícia
 * mais recente; senão o relatório mais recente; senão null — e a capa diz
 * isso em vez de fingir.
 */
export function destaque(): Peca | null {
  // `destaque: true` no frontmatter manda; o compilador garante que é um só.
  // Sem ele, a notícia mais recente — e, no empate de data, a ordem do slug,
  // que é arbitrária: por isso o campo existe.
  return PECAS.find((p) => p.destaque) ?? porSecao('noticias')[0] ?? porSecao('relatorios')[0] ?? PECAS[0] ?? null;
}

/** As seguintes, sem repetir o destaque. Só notícia: artigo e relatório têm bloco próprio na capa. */
export function recentes(n: number, excluir?: Peca | null): Peca[] {
  return PECAS.filter((p) => p !== excluir && p.secao === 'noticias').slice(0, n);
}

export function ultimoGiro(): Peca | null {
  return porSecao('giro')[0] ?? null;
}

export function arte(nome: string | undefined): string | null {
  return nome ? (ARTES[nome] ?? null) : null;
}

/** O caminho público de uma peça. Um lugar só decide isso. */
export function caminho(p: Peca): string {
  return `/${p.secao}/${p.slug}`;
}

/* ---------------------------------------------------------------- autores */

/** Todos, na ordem do arquivo (`ordem:`; o editor primeiro). */
export function autores(): readonly Autor[] {
  return AUTORES;
}

export function autorPorSlug(slug: string): Autor | null {
  return AUTORES.find((a) => a.slug === slug) ?? null;
}

/** O autor de uma peça. O compilador garante que existe; o `?? null` é só para o tipo. */
export function autorDe(p: Peca): Autor | null {
  return AUTORES.find((a) => a.nome === p.autor) ?? null;
}

export function pecasDoAutor(a: Autor): Peca[] {
  return PECAS.filter((p) => p.autor === a.nome);
}

export function caminhoAutor(a: Autor): string {
  return `/autores/${a.slug}`;
}

/* ---------------------------------------------------------------- rótulos */

export const ROTULO_SECAO: Record<Secao, string> = {
  noticias: 'Notícias',
  artigos: 'Artigos',
  relatorios: 'Relatórios',
  giro: 'Giro da Semana',
};

export const ROTULO_TEMA: Record<Peca['tema'], string> = {
  industria: 'Indústria',
  processos: 'Processos',
};

export const ROTULO_FORMATO: Record<Peca['formato'], string> = {
  curta: 'Nota',
  contexto: 'Notícia',
  guia: 'Guia',
  conceito: 'Conceito',
  caso: 'Caso',
  analise: 'Análise',
  panorama: 'Panorama',
  giro: 'Giro',
};
