/**
 * Configuração viva do site. O que muda com decisão editorial mora aqui,
 * não espalhado pelas rotas.
 */

export type Env = {
  DB: D1Database;
  SITE_NOME: string;
  SITE_URL: string;

  /** Segredo (`wrangler secret put`). Ausente = pipeline roda em simulação. */
  ANTHROPIC_API_KEY?: string;
  /** '1' força simulação mesmo com chave presente. */
  IA_SIMULAR?: string;
  /** Teto de gasto por dia, em reais. Ao bater, o pipeline para. */
  TETO_DIARIO_BRL?: string;
  /** Cotação usada para converter o custo da API. Estimativa declarada. */
  USD_BRL?: string;
};

export type ChaveNucleo = 'industria' | 'observatorio' | 'operacao' | 'edificacoes';

export type Nucleo = {
  chave: ChaveNucleo;
  nome: string;
  /** classe do sistema de design que define --accent-* no container */
  classe: string;
  /** quente = tem gente escrevendo. Radar = só agregação, e o site declara isso. */
  quente: boolean;
  resumo: string;
};

/**
 * Operação e Edificações nascem em modo Radar, e o site diz isso com todas as
 * letras. É a diferença entre "seção abandonada" e "seção que promete o que
 * entrega" — e é por isso que os dois estão em neutro no sistema de design.
 */
export const NUCLEOS: Record<ChaveNucleo, Nucleo> = {
  industria: {
    chave: 'industria',
    nome: 'Indústria',
    classe: 'n-industria',
    quente: true,
    resumo:
      'CLP, SCADA, robótica, Indústria 4.0 e o que os fabricantes lançam lá fora — em português, no mesmo dia.',
  },
  observatorio: {
    chave: 'observatorio',
    nome: 'Observatório',
    classe: 'n-observatorio',
    quente: true,
    resumo: 'Inteligência artificial, trabalho e o que a automação faz com a operação das empresas.',
  },
  operacao: {
    chave: 'operacao',
    nome: 'Operação',
    classe: 'n-operacao',
    quente: false,
    resumo: 'Automação de processos, agentes e no-code aplicados à rotina de quem opera.',
  },
  edificacoes: {
    chave: 'edificacoes',
    nome: 'Edificações',
    classe: 'n-edificacoes',
    quente: false,
    resumo: 'Automação predial e residencial, IoT e energia em edificações.',
  },
};

export const ORDEM_NUCLEOS: ChaveNucleo[] = [
  'industria',
  'observatorio',
  'operacao',
  'edificacoes',
];

export function ehNucleo(v: string): v is ChaveNucleo {
  return Object.prototype.hasOwnProperty.call(NUCLEOS, v);
}

/** Cache na borda. Listagem muda a cada coleta; item publicado quase não muda. */
export const CACHE = {
  listagem: 'public, max-age=0, s-maxage=300',
  item: 'public, max-age=0, s-maxage=3600',
  estatico: 'public, max-age=31536000, immutable',
} as const;
