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

/**
 * De onde veio o direito de mostrar a imagem. Fechado de propósito.
 *
 *   press    material de imprensa do fabricante ou da instituição — existe
 *            para ser republicado com crédito
 *   cc-by    licença Creative Commons com atribuição
 *   cedida   o autor ou dono cedeu por escrito
 *   propria  fotografia ou desenho nosso
 *
 * Não existe "peguei da matéria". Imagem de veículo é obra dele, e a regra do
 * projeto é a mesma para texto e para imagem: a licença governa, não o formato.
 */
export type LicencaImagem = 'press' | 'cc-by' | 'cedida' | 'propria';

export type Imagem = {
  /** nome do arquivo em publico/imagens/ */
  arquivo: string;
  /** quem aparece no crédito visível: "Skild AI", "John Deere" */
  credito: string;
  licenca: LicencaImagem;
  /** o que há na imagem, para quem não a vê */
  alt: string;
  /** medidas lidas do arquivo pelo compilador — vão no og:image e no JSON-LD */
  largura: number;
  altura: number;
};

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
  /** o título da aba e do resultado de busca (≤ 70 caracteres); o inteiro fica no h1 */
  tituloCurto?: string;
  lead: string;
  autor: string;
  /** YYYY-MM-DD */
  data: string;
  /** obrigatório em notícia; ausente em relatório e giro */
  veredito?: Veredito;
  /** obrigatório em notícia: toda peça sobre terceiro credita e linka */
  fonte?: Fonte;
  /** imagem real, com licença — vence a arte quando existe */
  imagem?: Imagem;
  /** nome do arquivo em conteudo/arte/, sem caminho — o desenho nosso */
  arte?: string;
  /** a peça que abre a capa; no máximo uma, decidida por gente */
  destaque?: boolean;
  /**
   * o caminho da imagem de compartilhamento (og:image): a foto, quando há;
   * senão o PNG que o compilador rasterizou da arte (ou da capa gerada)
   */
  og: string;
  /** o markdown, sem o frontmatter */
  corpo: string;
  /** palavras do corpo, para o tempo de leitura */
  palavras: number;
};

export const SECOES: readonly Secao[] = ['noticias', 'relatorios', 'giro'];
export const TEMAS: readonly Tema[] = ['industria', 'processos'];
export const VEREDITOS: readonly Veredito[] = ['chega', 'a_caminho', 'nao_chega', 'sem_efeito'];
export const LICENCAS_IMAGEM: readonly LicencaImagem[] = ['press', 'cc-by', 'cedida', 'propria'];

/** Que formatos cabem em cada seção. Notícia não vira caso; giro não vira nota. */
export const FORMATOS_POR_SECAO: Record<Secao, readonly Formato[]> = {
  noticias: ['curta', 'contexto'],
  relatorios: ['caso', 'analise', 'panorama'],
  giro: ['giro'],
};

export const ROTULO_LICENCA: Record<LicencaImagem, string> = {
  press: 'divulgação',
  'cc-by': 'CC BY',
  cedida: 'imagem cedida',
  propria: 'Instituto Automação',
};
