/**
 * O que uma peça É — o contrato entre o arquivo markdown, o compilador e o
 * site.
 *
 * Fica num arquivo só de tipos porque três lados dependem dele e nenhum
 * deles pode importar o outro: o compilador (roda no Node, antes do build),
 * o módulo gerado (é saída do compilador) e o site (lê o módulo gerado).
 */

export type Secao = 'noticias' | 'relatorios' | 'giro';
export type Tema = 'industria' | 'processos';
export type Formato = 'curta' | 'contexto' | 'caso' | 'analise' | 'panorama' | 'giro';
export type Veredito = 'chega' | 'a_caminho' | 'nao_chega' | 'sem_efeito';

export type Fonte = {
  nome: string;
  url: string;
  idioma: string;
  /** quando a fonte publicou — é o que o relógio compara */
  publicado?: string;
};

export type Peca = {
  /** do nome do arquivo, sem a data: `2026-09-03-skild-s1.md` → `skild-s1` */
  slug: string;
  secao: Secao;
  tema: Tema;
  formato: Formato;
  titulo: string;
  lead: string;
  autor: string;
  /** YYYY-MM-DD */
  data: string;
  /** obrigatório em notícia; ausente em relatório e giro */
  veredito?: Veredito;
  /** obrigatório em notícia: toda peça sobre terceiro credita e linka */
  fonte?: Fonte;
  /** nome do arquivo em conteudo/arte/, sem caminho */
  arte?: string;
  /** o markdown, sem o frontmatter */
  corpo: string;
  /** palavras do corpo, para o tempo de leitura */
  palavras: number;
};

export const SECOES: readonly Secao[] = ['noticias', 'relatorios', 'giro'];
export const TEMAS: readonly Tema[] = ['industria', 'processos'];
export const VEREDITOS: readonly Veredito[] = ['chega', 'a_caminho', 'nao_chega', 'sem_efeito'];

/** Que formatos cabem em cada seção. Notícia não vira caso; giro não vira nota. */
export const FORMATOS_POR_SECAO: Record<Secao, readonly Formato[]> = {
  noticias: ['curta', 'contexto'],
  relatorios: ['caso', 'analise', 'panorama'],
  giro: ['giro'],
};
