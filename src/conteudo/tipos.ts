/**
 * O que uma peça É — o contrato entre o arquivo markdown, o compilador e o
 * site.
 *
 * Fica num arquivo só de tipos porque três lados dependem dele e nenhum
 * deles pode importar o outro: o compilador (roda no Node, antes do build),
 * o módulo gerado (é saída do compilador) e o site (lê o módulo gerado).
 */

/**
 * As quatro seções. `artigos` entrou em 07/09/2026, pelo feedback do sócio:
 * o coração do Instituto é o que ENSINA, e a notícia é o que mantém o site
 * vivo entre um artigo e outro. Artigo não tem veredito (não é sobre
 * terceiro) e pode ou não ter fonte.
 */
export type Secao = 'noticias' | 'artigos' | 'relatorios' | 'giro';
export type Tema = 'industria' | 'processos';
export type Formato = 'curta' | 'contexto' | 'guia' | 'conceito' | 'experiencia' | 'caso' | 'analise' | 'panorama' | 'giro';

/** Para quem o artigo foi escrito. Só em artigos — é o que o padrão do sócio põe na linha de assinatura. */
export type Nivel = 'iniciante' | 'intermediario' | 'avancado';
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

/**
 * Peça paga — e o rótulo que nasce junto com ela.
 *
 * Existe ANTES da primeira venda, de propósito. O sócio quer vender três
 * artigos para uma empresa; se o rótulo for combinado peça a peça, ele vira
 * negociação toda vez, e a que sai sem rótulo é justamente a que ninguém
 * lembrou de rotular. Aqui rotular não é decisão de quem publica: é
 * consequência do frontmatter, e o compilador recusa peça paga sem o nome de
 * quem pagou.
 *
 * A obrigação é de lei, não de estilo. O CDC (art. 36) exige que a
 * publicidade seja identificada COMO TAL, fácil e imediatamente; o Código do
 * CONAR (art. 28) diz o mesmo do publieditorial. Por isso o rótulo sai em
 * TODA superfície onde a peça aparece — página, capa, listagem, RSS e dado
 * estruturado — e não só na página dela: quem vê o título na capa e não
 * entra precisa saber tanto quanto quem entra.
 */
export type Patrocinio = {
  /** quem pagou. Vai no rótulo visível, com todas as letras */
  anunciante: string;
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
  /** o NOME do autor, igual ao `nome` de um arquivo em conteudo/autores/. Ausente só em boletim gerado */
  autor?: string;
  /** YYYY-MM-DD */
  data: string;
  /** obrigatório em notícia; ausente em artigo, relatório e giro */
  veredito?: Veredito;
  /** obrigatório em notícia: toda peça sobre terceiro credita e linka; opcional nas outras */
  fonte?: Fonte;
  /** imagem real, com licença — vence a arte quando existe */
  imagem?: Imagem;
  /** nome do arquivo em conteudo/arte/, sem caminho — o desenho nosso */
  arte?: string;
  /**
   * boletim GERADO dos dados, não redigido por uma pessoa. Só em `giro`.
   *
   * Existe para o site não poder mentir por omissão: peça gerada não tem
   * autor, então a assinatura mostra a origem em vez de um nome, e a página
   * leva o aviso. Notícia, artigo e relatório continuam exigindo autor com
   * arquivo em conteudo/autores/ — a promessa do rodapé foi estreitada para
   * eles, não apagada.
   *
   * E não é modelo de linguagem: `src/giro/redigir.ts` é função pura sobre os
   * números medidos. Mesmos dados, mesmo texto.
   */
  gerado?: boolean;
  /** a peça que abre a capa; no máximo uma, decidida por gente */
  destaque?: boolean;
  /**
   * o artigo que ocupa o slot fixo da capa. Só em `artigos`, no máximo um.
   *
   * Existe porque o pedido do sócio (08/09) foi "um artigo e duas notícias,
   * para um artigo nunca sair": o slot não pode ser "o artigo mais recente",
   * senão a semana de dois artigos empurra o que importa. Quem fica é
   * decisão editorial, e decisão editorial mora no frontmatter.
   */
  fixo?: boolean;
  /**
   * peça paga: quem pagou. Vem de `patrocinada: true` + `patrocinador: Nome`
   * no frontmatter, e só existe onde publicidade pode existir (ver
   * SECOES_PATROCINAVEIS). Presente = o rótulo sai, em todo lugar.
   */
  patrocinada?: Patrocinio;
  /**
   * o caminho da imagem de compartilhamento (og:image): a foto, quando há;
   * senão o PNG que o compilador rasterizou da arte (ou da capa gerada)
   */
  og: string;
  /** o markdown, sem o frontmatter */
  corpo: string;
  /**
   * o corpo já em HTML, convertido NO BUILD (scripts/compilar.ts). A fórmula
   * precisa do KaTeX, e o KaTeX não precisa ir para o bundle do Worker: o
   * compilador converte uma vez e a página só imprime.
   */
  html: string;
  /** só em artigos: iniciante, intermediário ou avançado */
  nivel?: Nivel;
  /** só em artigos: a pauta de src/pautas.ts que este texto cumpre — é assim que a pauta vira "publicada" */
  pauta?: string;
  /** só em artigos de série: qual série e qual parte, lidos da pauta */
  serie?: { slug: string; parte: number };
  /** palavras do corpo, para o tempo de leitura */
  palavras: number;
};

/**
 * Quem escreve. Um arquivo por pessoa em conteudo/autores/; toda peça tem de
 * apontar para um deles pelo nome — o compilador recusa autor que não existe.
 *
 * A página do autor é o currículo dele dentro do Instituto: o papel, a bio,
 * as peças, e o link para fora (LinkedIn, Lattes, site) quando ele quiser.
 */
export type Autor = {
  /** do nome do arquivo: `pedro-oliveira.md` → `pedro-oliveira` */
  slug: string;
  nome: string;
  /** o que a pessoa é aqui: "Editor", "Colaborador", "Engenheiro de automação" */
  papel: string;
  /** a bio, em markdown — o corpo do arquivo */
  bio: string;
  /** o currículo lá fora, se houver */
  link?: string;
  /** como chamar o link: "LinkedIn", "Lattes", "Site" */
  linkRotulo?: string;
  /** foto em publico/autores/, opcional — sem ela, o monograma */
  foto?: { arquivo: string; largura: number; altura: number };
  /** as iniciais, para o monograma */
  iniciais: string;
  /** posição na lista; o editor vem primeiro */
  ordem: number;
};

export const SECOES: readonly Secao[] = ['noticias', 'artigos', 'relatorios', 'giro'];
export const TEMAS: readonly Tema[] = ['industria', 'processos'];
export const VEREDITOS: readonly Veredito[] = ['chega', 'a_caminho', 'nao_chega', 'sem_efeito'];
export const LICENCAS_IMAGEM: readonly LicencaImagem[] = ['press', 'cc-by', 'cedida', 'propria'];
export const NIVEIS: readonly Nivel[] = ['iniciante', 'intermediario', 'avancado'];

/**
 * Onde publicidade PODE existir.
 *
 * Artigo e relatório, sim: são texto assinado sobre um assunto, e o leitor
 * que vê o rótulo sabe exatamente o que está lendo. Notícia e Giro, não — e
 * isso não é pudor:
 *
 *   · a notícia carrega o VEREDITO ("chega aqui" / "não chega"), e veredito
 *     que se compra deixa de ser veredito. A promessa já está publicada em
 *     /apoie: "não escolhe pauta nem veredito";
 *   · o Giro é o balanço dos números da semana. Patrocinar o balanço é
 *     patrocinar a medição.
 *
 * É aqui que mora a diferença entre vender espaço e vender a régua. O
 * compilador aborta se uma peça paga aparecer fora desta lista — inclusive a
 * "notícia boa" para um cliente virar parceiro, que é publicidade velada com
 * outro nome.
 */
export const SECOES_PATROCINAVEIS: readonly Secao[] = ['artigos', 'relatorios'];

/** Que formatos cabem em cada seção. Notícia não vira caso; giro não vira nota. */
export const FORMATOS_POR_SECAO: Record<Secao, readonly Formato[]> = {
  noticias: ['curta', 'contexto'],
  artigos: ['guia', 'conceito', 'experiencia'],
  relatorios: ['caso', 'analise', 'panorama'],
  giro: ['giro'],
};

export const ROTULO_LICENCA: Record<LicencaImagem, string> = {
  press: 'divulgação',
  'cc-by': 'CC BY',
  cedida: 'imagem cedida',
  propria: 'Instituto Automação',
};
