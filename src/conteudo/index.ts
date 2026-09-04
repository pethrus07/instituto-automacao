/**
 * O conteúdo, do lado do Worker.
 *
 * Tudo aqui é leitura de um array em memória — o módulo gerado pelo
 * compilador. Não há banco, não há requisição, não há espera: a página de
 * uma peça é montada em microssegundos, e o Worker fica burro de propósito.
 *
 * O git é o CMS. Estas funções são só o índice.
 */
import { ARTES, PECAS } from '../conteudo.gerado';
import type { Peca, Secao } from './tipos';

export type { Peca, Secao, Tema, Formato, Veredito } from './tipos';
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
 * A peça que abre a capa: a notícia mais recente. Se não houver notícia, o
 * relatório mais recente; se não houver nada, null — e a capa diz isso em
 * vez de fingir.
 */
export function destaque(): Peca | null {
  return porSecao('noticias')[0] ?? porSecao('relatorios')[0] ?? PECAS[0] ?? null;
}

/** As seguintes, sem repetir o destaque. */
export function recentes(n: number, excluir?: Peca | null): Peca[] {
  return PECAS.filter((p) => p !== excluir && p.secao !== 'giro').slice(0, n);
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

export const ROTULO_SECAO: Record<Secao, string> = {
  noticias: 'Notícias',
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
  caso: 'Caso',
  analise: 'Análise',
  panorama: 'Panorama',
  giro: 'Giro',
};
