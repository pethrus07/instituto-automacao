/**
 * Configuração viva do site. O que muda com decisão editorial mora aqui,
 * não espalhado pelas rotas.
 *
 * v2, 03/09/2026: saíram os campos de IA (`ANTHROPIC_API_KEY`, `IA_CONTA`,
 * `IA_SIMULAR`, teto de custo) e o cron do Giro. Não há IA em produção, e o
 * Giro é escrito, não gerado. Saíram também os quatro núcleos — o site tem
 * três seções e dois temas.
 */

export type Env = {
  DB: D1Database;
  SITE_NOME: string;
  SITE_URL: string;
  /** "1" na homologação: robots fechado e X-Robots-Tag noindex em tudo */
  HOMOLOG?: string;
};

/**
 * TEMA é etiqueta no dado, não seção do site.
 *
 * O recorte da v2 é híbrido: o que se escreve sai de automação de processos
 * para PME (onde há dado próprio), o que se colhe é automação industrial
 * internacional. Uma peça é de um ou de outro — e isso fica no frontmatter,
 * no filtro da agenda e na etiqueta da fonte, sem virar quatro seções vazias.
 */
export type Tema = 'industria' | 'processos';

export const TEMAS: Record<Tema, { nome: string; descricao: string }> = {
  industria: {
    nome: 'Indústria',
    descricao: 'CLP, robótica, segurança de máquina e o que os fabricantes lançam lá fora.',
  },
  processos: {
    nome: 'Processos',
    descricao: 'Automação de rotina, agentes e no-code aplicados a quem opera uma empresa.',
  },
};

export const ORDEM_TEMAS: Tema[] = ['industria', 'processos'];

export function ehTema(v: string): v is Tema {
  return Object.prototype.hasOwnProperty.call(TEMAS, v);
}

/**
 * O que a pessoa que assina FAZ. Perguntado no cadastro (feedback do sócio,
 * 07/09/2026), opcional, fechado: cinco respostas dizem para quem se escreve;
 * texto livre não diria.
 */
export type Atuacao = 'opera' | 'integra' | 'ensina' | 'estuda' | 'outra';

export const ATUACOES: Record<Atuacao, string> = {
  opera: 'Opero uma planta, uma linha ou uma empresa',
  integra: 'Integro, vendo ou represento automação',
  ensina: 'Pesquiso ou ensino',
  estuda: 'Estudo',
  outra: 'Outra coisa',
};

export const ORDEM_ATUACOES: Atuacao[] = ['opera', 'integra', 'ensina', 'estuda', 'outra'];

export function ehAtuacao(v: string): v is Atuacao {
  return Object.prototype.hasOwnProperty.call(ATUACOES, v);
}

/**
 * Os caminhos da v1 que continuam chegando por link antigo, e para onde vão.
 * 301 em todos: link que alguém guardou é contrato, e 404 quebra o contrato
 * de todo mundo de uma vez.
 */
export const REDIRECTS_V1: Record<string, string> = {
  '/industria': '/noticias',
  '/observatorio': '/noticias',
  '/operacao': '/noticias',
  '/edificacoes': '/noticias',
  '/panorama': '/relatorios',
};

/** Cache na borda. Listagem muda a cada deploy; peça quase não muda. */
export const CACHE = {
  listagem: 'public, max-age=0, s-maxage=300',
  item: 'public, max-age=0, s-maxage=3600',
  estatico: 'public, max-age=31536000, immutable',
} as const;

/* ------------------------------------------------------------- LGPD
 * A finalidade de cada coleta, escrita uma vez.
 *
 * A LGPD (art. 6º, VI e art. 9º) exige que a finalidade seja declarada NA
 * COLETA, em linguagem clara — não só numa página de política que ninguém
 * abre. Então ela aparece em dois lugares: ao lado do formulário e em
 * /privacidade. Mora aqui porque os dois lugares TÊM de dizer a mesma
 * coisa, e duas frases escritas à mão divergem na primeira vez que alguém
 * mexer numa delas.
 *
 * Regra prática, e é o que decide se a lista vale alguma coisa depois:
 * dado coletado só pode ser usado para o que estava escrito no dia em que
 * foi coletado. Ampliar esta lista NÃO alcança quem já se cadastrou —
 * finalidade nova vale para quem entrar depois dela.
 */
export const FINALIDADES = {
  lista: 'mandar o Giro da Semana e avisar quando sai peça nova',
  atuacao: 'saber para quem se escreve — o que a lista lê muda o que vale escrever',
  contato: 'responder quem quer escrever no Instituto ou conversar sobre apoiar',
  evento: 'conferir e publicar o evento na agenda, e falar com quem enviou se faltar dado',
} as const;
