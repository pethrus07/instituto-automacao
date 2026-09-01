/**
 * O agregado da semana — SQL puro, zero IA.
 *
 * Esta é a metade do Giro que não depende de modelo nenhum: contagens,
 * medianas e o placar do destaque saem do banco e são sempre os mesmos para
 * a mesma semana. A IA só escreve prosa em cima disto, e a auditoria depois
 * confere que a prosa não inventou número.
 *
 * A ordem importa e é a mesma do resto do projeto:
 *
 *   dados → agregar → redigir → AUDITAR → publicar (ou abortar)
 *
 * Quem redige nunca vê o banco. Quem audita nunca vê o modelo. É assim que
 * "a IA escreveu" deixa de ser uma desculpa e vira um passo verificável.
 */
import type { ChaveNucleo } from '../config';
import { ORDEM_NUCLEOS } from '../config';
import type { Janela } from './semana';

/* ------------------------------------------------------------------ tipos */

/**
 * Um candidato a notícia da semana, com a conta aberta.
 *
 * `parcelas` existe para a página poder MOSTRAR por que este ficou na
 * frente. Um giro que diz "o destaque da semana foi X" sem mostrar a conta
 * é indistinguível de palpite — e palpite é o que todo agregador já faz.
 */
export type Candidato = {
  assunto_id: string;
  rotulo: string;
  nucleo: string;
  /** fontes independentes que cobriram o mesmo assunto */
  fontes: number;
  /** soma do peso editorial dessas fontes */
  peso: number;
  chegou_br: boolean;
  atraso_br_dias: number | null;
  veredito: string | null;
  publicado_original: string | null;
  pontos: number;
  parcelas: { repercussao: number; alcance: number; ineditismo: number; veredito: number };
  /** o item publicado que representa o assunto, se houver */
  item_slug: string | null;
  item_nucleo: string | null;
  item_titulo: string | null;
  item_resumo: string | null;
};

export type LinhaNucleo = {
  nucleo: ChaveNucleo;
  itens: number;
  publicados: number;
  topo: { titulo: string; slug: string | null; fonte: string }[];
};

export type Voz = {
  pessoa: string;
  papel: string | null;
  titulo: string;
  url: string;
  nucleo: string;
  publicado: string;
  pais: string;
};

export type Semana = {
  janela: Janela;
  totais: { itens: number; publicados: number; assuntos: number; fontes: number; vozes: number };
  /** null quando nenhum assunto alcançou o piso de repercussão — e isso é informação */
  destaque: Candidato | null;
  /** só quem alcançou o piso de repercussão — ver `sozinhos` para o resto */
  placar: Candidato[];
  /** quantos assuntos da semana tiveram UMA fonte só. É o número que mede o
      agrupamento: quanto mais alto, mais a mesma notícia está se dividindo */
  sozinhos: number;
  porNucleo: LinhaNucleo[];
  relogio: {
    medidos: number;
    medianaDias: number | null;
    naoChegaram: number;
    exemplos: { rotulo: string; dias: number }[];
  };
  vozes: Voz[];
  agenda: { titulo: string; slug: string; inicio: string; cidade: string | null; pais: string }[];
};

/* -------------------------------------------------------------- pontuação */

/**
 * PISO DE REPERCUSSÃO: 2 fontes independentes.
 *
 * Notícia da semana precisa ter sido notícia para mais de um. Sem o piso, o
 * ineditismo (que é o critério mais pesado) elegeria sempre o assunto mais
 * obscuro — um post que ninguém mais cobriu tem, por definição, zero menção
 * brasileira.
 *
 * E quando NINGUÉM alcança o piso o giro sai sem destaque, dizendo isso. É
 * a resposta honesta, e hoje é a mais provável: o agrupamento por título é
 * fraco (367 itens → 361 assuntos, medido em 01/09), então "duas fontes no
 * mesmo assunto" ainda é raro. O giro vazio de destaque é a pressão que
 * justifica os embeddings, escrita onde dá para ver.
 */
export const PISO_FONTES = 2;

/**
 * A fórmula, e ela é publicada em /giro junto com o resultado.
 *
 * Os pesos são decisão editorial, não otimização: o ineditismo pesa mais que
 * a repercussão porque a pergunta-assinatura do Instituto é o que NÃO chegou
 * aqui. Um veículo que ordenasse por repercussão seria mais um agregador.
 */
export const FORMULA = {
  repercussao: 'cada fonte independente vale 10',
  alcance: 'soma do peso editorial das fontes',
  ineditismo: '25 se nenhuma fonte brasileira mencionou',
  veredito: 'não chega 15 · chega 10 · a caminho 5 · sem efeito 0',
} as const;

function pontuar(
  fontes: number,
  peso: number,
  chegouBr: boolean,
  veredito: string | null,
): Candidato['parcelas'] {
  const porVeredito =
    veredito === 'nao_chega' ? 15 : veredito === 'chega' ? 10 : veredito === 'a_caminho' ? 5 : 0;
  return {
    repercussao: fontes * 10,
    alcance: peso,
    ineditismo: chegouBr ? 0 : 25,
    veredito: porVeredito,
  };
}

const somar = (p: Candidato['parcelas']) =>
  p.repercussao + p.alcance + p.ineditismo + p.veredito;

/** O veredito mais forte entre os itens do assunto. */
function vereditoDominante(lista: string): string | null {
  const ordem = ['nao_chega', 'chega', 'a_caminho', 'sem_efeito'];
  const vistos = lista.split(',').filter(Boolean);
  for (const v of ordem) if (vistos.includes(v)) return v;
  return null;
}

/* ------------------------------------------------------------- agregação */

export async function agregarSemana(db: D1Database, janela: Janela): Promise<Semana> {
  const { inicio, fim } = janela;

  /* --- totais ------------------------------------------------------- */
  const t = await db
    .prepare(
      `SELECT COUNT(*) itens,
              SUM(CASE WHEN status = 'publicado' THEN 1 ELSE 0 END) publicados,
              COUNT(DISTINCT assunto_id) assuntos,
              COUNT(DISTINCT fonte_id) fontes
         FROM item
        WHERE publicado_fonte >= ?1 AND publicado_fonte < ?2`,
    )
    .bind(inicio, fim)
    .first<{ itens: number; publicados: number; assuntos: number; fontes: number }>();

  /* --- candidatos a destaque ---------------------------------------- */
  /* O peso vem por subconsulta sobre fontes DISTINTAS: somar na junção
     contaria duas vezes a fonte que publicou dois itens do mesmo assunto, e
     o placar premiaria quem repete em vez de quem repercute. */
  const { results: brutos } = await db
    .prepare(
      `SELECT a.id, a.rotulo, a.nucleo, a.publicado_original, a.atraso_br_dias,
              a.primeira_mencao_br,
              COUNT(DISTINCT i.fonte_id) AS fontes,
              (SELECT COALESCE(SUM(peso), 0) FROM fonte
                WHERE id IN (SELECT DISTINCT fonte_id FROM item WHERE assunto_id = a.id)) AS peso,
              COALESCE(GROUP_CONCAT(i.contexto_veredito), '') AS vereditos,
              (SELECT slug   FROM item WHERE assunto_id = a.id AND slug IS NOT NULL
                 ORDER BY publicado_em DESC LIMIT 1) AS item_slug,
              (SELECT nucleo FROM item WHERE assunto_id = a.id AND slug IS NOT NULL
                 ORDER BY publicado_em DESC LIMIT 1) AS item_nucleo,
              (SELECT titulo FROM item WHERE assunto_id = a.id AND slug IS NOT NULL
                 ORDER BY publicado_em DESC LIMIT 1) AS item_titulo,
              (SELECT resumo FROM item WHERE assunto_id = a.id AND slug IS NOT NULL
                 ORDER BY publicado_em DESC LIMIT 1) AS item_resumo
         FROM assunto a
         JOIN item i ON i.assunto_id = a.id
        WHERE i.publicado_fonte >= ?1 AND i.publicado_fonte < ?2
        GROUP BY a.id
        ORDER BY fontes DESC
        LIMIT 200`,
    )
    .bind(inicio, fim)
    .all<{
      id: string;
      rotulo: string;
      nucleo: string;
      publicado_original: string | null;
      atraso_br_dias: number | null;
      primeira_mencao_br: string | null;
      fontes: number;
      peso: number;
      vereditos: string;
      item_slug: string | null;
      item_nucleo: string | null;
      item_titulo: string | null;
      item_resumo: string | null;
    }>();

  const candidatos: Candidato[] = (brutos ?? []).map((r) => {
    const chegou = Boolean(r.primeira_mencao_br);
    const veredito = vereditoDominante(r.vereditos);
    const parcelas = pontuar(r.fontes, r.peso, chegou, veredito);
    return {
      assunto_id: r.id,
      rotulo: r.rotulo,
      nucleo: r.nucleo,
      fontes: r.fontes,
      peso: r.peso,
      chegou_br: chegou,
      atraso_br_dias: r.atraso_br_dias,
      veredito,
      publicado_original: r.publicado_original,
      pontos: somar(parcelas),
      parcelas,
      item_slug: r.item_slug,
      item_nucleo: r.item_nucleo,
      item_titulo: r.item_titulo,
      item_resumo: r.item_resumo,
    };
  });

  candidatos.sort((a, b) => b.pontos - a.pontos || b.fontes - a.fontes);

  /**
   * O placar só mostra quem alcançou o piso.
   *
   * A primeira versão mostrava os 5 melhores sem piso, "para o leitor
   * discordar com dados". Rodando na base real, quatro das cinco linhas
   * eram posts do mesmo blog empatados em 43 pontos — porque assunto de uma
   * fonte só pontua igual a qualquer outro assunto de uma fonte só. Isso não
   * é dado para discordar, é ruído com aparência de ranking.
   *
   * O que substitui: `sozinhos`, o número de assuntos com uma fonte só. Um
   * número honesto vale mais que cinco linhas empatadas — e ele mede
   * exatamente a fraqueza conhecida do agrupamento por título.
   */
  const placar = candidatos.filter((c) => c.fontes >= PISO_FONTES).slice(0, 5);
  const sozinhos = candidatos.filter((c) => c.fontes < PISO_FONTES).length;
  const destaque = placar[0] ?? null;

  /* --- por núcleo ---------------------------------------------------- */
  const porNucleo: LinhaNucleo[] = [];
  for (const nucleo of ORDEM_NUCLEOS) {
    const c = await db
      .prepare(
        `SELECT COUNT(*) itens,
                SUM(CASE WHEN status = 'publicado' THEN 1 ELSE 0 END) publicados
           FROM item
          WHERE nucleo = ?3 AND publicado_fonte >= ?1 AND publicado_fonte < ?2`,
      )
      .bind(inicio, fim, nucleo)
      .first<{ itens: number; publicados: number }>();

    const { results: topo } = await db
      .prepare(
        `SELECT i.titulo, i.slug, f.nome AS fonte
           FROM item i JOIN fonte f ON f.id = i.fonte_id
          WHERE i.nucleo = ?3 AND i.publicado_fonte >= ?1 AND i.publicado_fonte < ?2
          ORDER BY (i.status = 'publicado') DESC, f.peso DESC, i.publicado_fonte DESC
          LIMIT 3`,
      )
      .bind(inicio, fim, nucleo)
      .all<{ titulo: string; slug: string | null; fonte: string }>();

    porNucleo.push({
      nucleo,
      itens: c?.itens ?? 0,
      publicados: c?.publicados ?? 0,
      topo: topo ?? [],
    });
  }

  /* --- o relógio ----------------------------------------------------- */
  /* Mediana, não média: um único assunto que demorou 300 dias puxaria a
     média e faria o número dizer o oposto do que a semana foi. */
  const { results: atrasos } = await db
    .prepare(
      `SELECT rotulo, atraso_br_dias dias
         FROM assunto
        WHERE atraso_apurado_em >= ?1 AND atraso_apurado_em < ?2
          AND atraso_br_dias IS NOT NULL
        ORDER BY atraso_br_dias DESC`,
    )
    .bind(inicio, fim)
    .all<{ rotulo: string; dias: number }>();

  const dias = (atrasos ?? []).map((a) => a.dias).sort((x, y) => x - y);
  const mediana =
    dias.length === 0
      ? null
      : dias.length % 2
        ? dias[(dias.length - 1) / 2]!
        : Math.round((dias[dias.length / 2 - 1]! + dias[dias.length / 2]!) / 2);

  const naoChegaram = await db
    .prepare(
      `SELECT COUNT(*) n FROM assunto
        WHERE publicado_original >= ?1 AND publicado_original < ?2
          AND primeira_mencao_br IS NULL`,
    )
    .bind(inicio, fim)
    .first<{ n: number }>();

  /* --- as vozes ------------------------------------------------------ */
  /* Pessoa pública é outro eixo, não outro tipo: `fonte.tipo` diz o MEIO
     (blog, rede, fórum) e `fonte.pessoa` diz de QUEM é a assinatura. "A
     IEEE Spectrum noticiou" e "Rodney Brooks escreveu" são frases de peso
     diferente, e o giro precisa saber a diferença. */
  const { results: vozesBrutas } = await db
    .prepare(
      `SELECT f.pessoa, f.pessoa_papel AS papel, f.pais, i.titulo, i.url, i.nucleo,
              i.publicado_fonte AS publicado
         FROM item i JOIN fonte f ON f.id = i.fonte_id
        WHERE f.pessoa IS NOT NULL
          AND i.publicado_fonte >= ?1 AND i.publicado_fonte < ?2
        ORDER BY f.peso DESC, i.publicado_fonte DESC
        LIMIT 200`,
    )
    .bind(inicio, fim)
    .all<Voz>();

  /**
   * No máximo duas entradas por pessoa.
   *
   * Sem o teto, quem publica todo dia ocupa a seção inteira: na primeira
   * execução real, as doze linhas eram do mesmo blog. A seção existe para
   * mostrar QUEM falou na semana, não quanto cada um escreve — e um limite
   * simples entrega isso melhor que qualquer ordenação por relevância.
   */
  const porPessoa = new Map<string, number>();
  const vozes: Voz[] = [];
  for (const v of vozesBrutas ?? []) {
    const n = porPessoa.get(v.pessoa) ?? 0;
    if (n >= 2) continue;
    porPessoa.set(v.pessoa, n + 1);
    vozes.push(v);
    if (vozes.length >= 10) break;
  }

  /* --- a agenda logo à frente ---------------------------------------- */
  const { results: agenda } = await db
    .prepare(
      /* `nome`, não `titulo`: a tabela de eventos veio antes da de itens e
         usa outro nome para a mesma ideia. Alias na consulta em vez de
         renomear a coluna — o schema já está em produção. */
      `SELECT nome AS titulo, slug, inicio, cidade, pais
         FROM evento
        WHERE status = 'publicado' AND inicio >= ?1 AND inicio < datetime(?1, '+30 days')
        ORDER BY inicio ASC
        LIMIT 6`,
    )
    .bind(fim)
    .all<{ titulo: string; slug: string; inicio: string; cidade: string | null; pais: string }>();

  return {
    janela,
    totais: {
      itens: t?.itens ?? 0,
      publicados: t?.publicados ?? 0,
      assuntos: t?.assuntos ?? 0,
      fontes: t?.fontes ?? 0,
      vozes: porPessoa.size,
    },
    destaque,
    placar,
    sozinhos,
    porNucleo,
    relogio: {
      medidos: dias.length,
      medianaDias: mediana,
      naoChegaram: naoChegaram?.n ?? 0,
      exemplos: (atrasos ?? []).slice(0, 3),
    },
    vozes,
    agenda: agenda ?? [],
  };
}
