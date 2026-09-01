/**
 * Acesso ao D1. Consulta fica aqui; rota não escreve SQL.
 *
 * Tudo é paginado: o D1 tem teto de leitura por request, e listagem sem
 * limite é o jeito mais fácil de derrubar a página quando o radar encher.
 */
import type { ChaveNucleo } from './config';

/** Uma linha do radar, do jeito que a tela precisa. */
export type ItemRadar = {
  id: string;
  slug: string | null;
  nucleo: ChaveNucleo;
  titulo: string;
  titulo_original: string | null;
  url: string;
  idioma_origem: string;
  modo: 'traducao' | 'resumo';
  corpo: string | null;
  resumo: string | null;
  contexto_br: string | null;
  contexto_veredito: 'chega' | 'a_caminho' | 'nao_chega' | 'sem_efeito' | null;
  publicado_fonte: string;
  publicado_em: string | null;
  minutos_apos_fonte: number | null;
  revisado_humano: number;
  fonte_nome: string;
  fonte_site: string;
  fonte_licenca: 'liberada' | 'resumo' | 'bloqueada';
  /** null = o assunto ainda não foi mencionado no Brasil. Isso é dado, não falha. */
  atraso_br_dias: number | null;
};

const CAMPOS = `
  i.id, i.slug, i.nucleo, i.titulo, i.titulo_original, i.url, i.idioma_origem,
  i.modo, i.corpo, i.resumo, i.contexto_br, i.contexto_veredito, i.publicado_fonte, i.publicado_em,
  i.minutos_apos_fonte, i.revisado_humano,
  f.nome AS fonte_nome, f.url_site AS fonte_site, f.licenca AS fonte_licenca,
  a.atraso_br_dias AS atraso_br_dias
`;

/**
 * O radar de um núcleo.
 *
 * ⚠️ O filtro de veredito é feito AQUI, no SQL, e não na lista já carregada.
 * Filtrar em memória parece equivalente e não é: com 63 itens na base, o
 * recorte "não chega" mostrava 8 de 16 — porque só via a primeira página.
 * Recorte incompleto que não avisa é pior que recorte nenhum, e este só
 * apareceu quando o volume foi medido.
 */
export async function listarRadar(
  db: D1Database,
  nucleo: ChaveNucleo,
  limite = 30,
  deslocamento = 0,
  veredito?: string,
): Promise<ItemRadar[]> {
  const cond = veredito ? 'AND i.contexto_veredito = ?4' : '';
  const args: unknown[] = [nucleo, limite, deslocamento];
  if (veredito) args.push(veredito);

  const { results } = await db
    .prepare(
      `SELECT ${CAMPOS}
         FROM item i
         JOIN fonte f   ON f.id = i.fonte_id
         LEFT JOIN assunto a ON a.id = i.assunto_id
        WHERE i.nucleo = ?1 AND i.status = 'publicado' ${cond}
        ORDER BY i.publicado_em DESC
        LIMIT ?2 OFFSET ?3`,
    )
    .bind(...args)
    .all<ItemRadar>();
  return results ?? [];
}

export async function obterItem(
  db: D1Database,
  nucleo: ChaveNucleo,
  slug: string,
): Promise<ItemRadar | null> {
  return await db
    .prepare(
      `SELECT ${CAMPOS}
         FROM item i
         JOIN fonte f   ON f.id = i.fonte_id
         LEFT JOIN assunto a ON a.id = i.assunto_id
        WHERE i.nucleo = ?1 AND i.slug = ?2 AND i.status = 'publicado'`,
    )
    .bind(nucleo, slug)
    .first<ItemRadar>();
}

export type ResumoNucleo = { nucleo: ChaveNucleo; total: number; ultimo: string | null };

export async function contarPorNucleo(db: D1Database): Promise<ResumoNucleo[]> {
  const { results } = await db
    .prepare(
      `SELECT nucleo, COUNT(*) AS total, MAX(publicado_em) AS ultimo
         FROM item WHERE status = 'publicado' GROUP BY nucleo`,
    )
    .all<ResumoNucleo>();
  return results ?? [];
}

/**
 * A pergunta-assinatura, medida.
 * `sem_mencao` é o número que mais interessa: assuntos publicados lá fora há
 * mais de meio ano que nunca foram mencionados por fonte brasileira.
 */
export type Atraso = { medidos: number; media_dias: number | null; sem_mencao: number };

export async function medirAtraso(db: D1Database, nucleo?: ChaveNucleo): Promise<Atraso> {
  const filtro = nucleo ? 'WHERE nucleo = ?1' : '';
  const linha = await db
    .prepare(
      `SELECT
         COUNT(atraso_br_dias)                          AS medidos,
         AVG(atraso_br_dias)                            AS media_dias,
         SUM(CASE WHEN primeira_mencao_br IS NULL
                   AND publicado_original < datetime('now','-180 days')
                  THEN 1 ELSE 0 END)                    AS sem_mencao
       FROM assunto ${filtro}`,
    )
    .bind(...(nucleo ? [nucleo] : []))
    .first<{ medidos: number; media_dias: number | null; sem_mencao: number }>();

  return {
    medidos: linha?.medidos ?? 0,
    media_dias: linha?.media_dias != null ? Math.round(linha.media_dias) : null,
    sem_mencao: linha?.sem_mencao ?? 0,
  };
}

/* ========================================================================= */
/* Agenda                                                                     */
/* ========================================================================= */

export type Evento = {
  id: string;
  slug: string | null;
  nucleo: ChaveNucleo;
  nome: string;
  descricao: string | null;
  inicio: string;
  fim: string | null;
  cidade: string | null;
  uf: string | null;
  pais: string;
  formato: 'presencial' | 'online' | 'hibrido';
  organizador: string | null;
  url: string | null;
  preco: string | null;
  destaque: number;
};

export type FiltroAgenda = {
  nucleo?: ChaveNucleo;
  formato?: 'presencial' | 'online' | 'hibrido';
  onde?: 'br' | 'fora';
};

/**
 * Eventos que ainda não terminaram.
 *
 * Compara com `fim` quando existe: feira de quatro dias no terceiro dia
 * ainda é evento que acontece, e sumir dela no meio é o tipo de erro que
 * faz o leitor deixar de confiar na agenda inteira.
 *
 * Os filtros entram por lista branca — o valor vem da querystring, e
 * concatenar isso em SQL seria injeção com convite.
 */
export async function listarAgenda(
  db: D1Database,
  f: FiltroAgenda = {},
  limite = 60,
): Promise<Evento[]> {
  const cond = [`COALESCE(fim, inicio) >= date('now')`, `status = 'publicado'`];
  const args: unknown[] = [];

  if (f.nucleo) {
    args.push(f.nucleo);
    cond.push(`nucleo = ?${args.length}`);
  }
  if (f.formato) {
    args.push(f.formato);
    cond.push(`formato = ?${args.length}`);
  }
  if (f.onde === 'br') cond.push(`pais = 'BR'`);
  if (f.onde === 'fora') cond.push(`pais <> 'BR'`);

  args.push(limite);
  const { results } = await db
    .prepare(
      `SELECT id, slug, nucleo, nome, descricao, inicio, fim, cidade, uf, pais,
              formato, organizador, url, preco, destaque
         FROM evento
        WHERE ${cond.join(' AND ')}
        ORDER BY inicio ASC
        LIMIT ?${args.length}`,
    )
    .bind(...args)
    .all<Evento>();
  return results ?? [];
}

export async function obterEvento(db: D1Database, slug: string): Promise<Evento | null> {
  return await db
    .prepare(
      `SELECT id, slug, nucleo, nome, descricao, inicio, fim, cidade, uf, pais,
              formato, organizador, url, preco, destaque
         FROM evento WHERE slug = ?1 AND status = 'publicado'`,
    )
    .bind(slug)
    .first<Evento>();
}

/** Para a página dizer quantos há em cada recorte sem consultar de novo. */
export async function contarAgenda(db: D1Database): Promise<{ total: number; brasil: number }> {
  const l = await db
    .prepare(
      `SELECT COUNT(*) total, SUM(CASE WHEN pais='BR' THEN 1 ELSE 0 END) brasil
         FROM evento WHERE status='publicado' AND COALESCE(fim, inicio) >= date('now')`,
    )
    .first<{ total: number; brasil: number }>();
  return { total: l?.total ?? 0, brasil: l?.brasil ?? 0 };
}

/* ========================================================================= */
/* Obra — o conteúdo assinado                                                 */
/* ========================================================================= */

export type FormatoObra = 'leitura' | 'analise' | 'caso' | 'panorama';

export type Obra = {
  id: string;
  slug: string;
  nucleo: ChaveNucleo;
  formato: FormatoObra;
  titulo: string;
  lead: string | null;
  corpo: string;
  autor: string;
  assinada: number;
  item_id: string | null;
  publicado_em: string | null;
  /** vem da junção, quando a obra está ancorada num item do radar */
  item_slug?: string | null;
  item_titulo?: string | null;
  item_nucleo?: string | null;
};

const CAMPOS_OBRA = `
  o.id, o.slug, o.nucleo, o.formato, o.titulo, o.lead, o.corpo, o.autor,
  o.assinada, o.item_id, o.publicado_em,
  i.slug AS item_slug, i.titulo AS item_titulo, i.nucleo AS item_nucleo
`;

export async function listarObras(
  db: D1Database,
  filtro: { nucleo?: ChaveNucleo; formato?: FormatoObra } = {},
  limite = 20,
): Promise<Obra[]> {
  const cond = [`o.status = 'publicado'`];
  const args: unknown[] = [];
  if (filtro.nucleo) {
    args.push(filtro.nucleo);
    cond.push(`o.nucleo = ?${args.length}`);
  }
  if (filtro.formato) {
    args.push(filtro.formato);
    cond.push(`o.formato = ?${args.length}`);
  }
  args.push(limite);

  const { results } = await db
    .prepare(
      `SELECT ${CAMPOS_OBRA} FROM obra o
         LEFT JOIN item i ON i.id = o.item_id
        WHERE ${cond.join(' AND ')}
        ORDER BY o.publicado_em DESC
        LIMIT ?${args.length}`,
    )
    .bind(...args)
    .all<Obra>();
  return results ?? [];
}

export async function obterObra(
  db: D1Database,
  formato: FormatoObra,
  slug: string,
): Promise<Obra | null> {
  return await db
    .prepare(
      `SELECT ${CAMPOS_OBRA} FROM obra o
         LEFT JOIN item i ON i.id = o.item_id
        WHERE o.formato = ?1 AND o.slug = ?2 AND o.status = 'publicado'`,
    )
    .bind(formato, slug)
    .first<Obra>();
}

/** A Leitura do Instituto ancorada num item — aparece na página do item. */
export async function leituraDoItem(db: D1Database, itemId: string): Promise<Obra | null> {
  return await db
    .prepare(
      `SELECT ${CAMPOS_OBRA} FROM obra o
         LEFT JOIN item i ON i.id = o.item_id
        WHERE o.item_id = ?1 AND o.formato = 'leitura' AND o.status = 'publicado'
        LIMIT 1`,
    )
    .bind(itemId)
    .first<Obra>();
}

/**
 * A capa em números.
 *
 * `nao_chega` é o veredito que dá rosto à pergunta-assinatura: é a contagem
 * pública do que o setor lançou lá fora e não chegou aqui.
 */
export type Placar = {
  nao_chega: number;
  chega: number;
  traduzidos_24h: number;
};

export async function placar(db: D1Database): Promise<Placar> {
  const l = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN contexto_veredito='nao_chega' THEN 1 ELSE 0 END) nao_chega,
         SUM(CASE WHEN contexto_veredito='chega'     THEN 1 ELSE 0 END) chega,
         SUM(CASE WHEN publicado_em >= datetime('now','-1 day') THEN 1 ELSE 0 END) traduzidos_24h
       FROM item WHERE status='publicado'`,
    )
    .first<Placar>();
  return { nao_chega: l?.nao_chega ?? 0, chega: l?.chega ?? 0, traduzidos_24h: l?.traduzidos_24h ?? 0 };
}

/** O item que abre a página: o mais recente com contexto escrito. */
export async function destaque(db: D1Database, nucleo?: ChaveNucleo): Promise<ItemRadar | null> {
  const cond = nucleo ? 'AND i.nucleo = ?1' : '';
  return await db
    .prepare(
      `SELECT ${CAMPOS}
         FROM item i
         JOIN fonte f   ON f.id = i.fonte_id
         LEFT JOIN assunto a ON a.id = i.assunto_id
        WHERE i.status='publicado' AND i.contexto_br IS NOT NULL ${cond}
        ORDER BY i.publicado_em DESC LIMIT 1`,
    )
    .bind(...(nucleo ? [nucleo] : []))
    .first<ItemRadar>();
}


/* ========================================================================= */
/* Glossário, inventário de fontes e lista                                    */
/* ========================================================================= */

export type TermoPublico = {
  termo_origem: string;
  idioma: string;
  termo_pt: string;
  nota: string | null;
  manter_original: number;
  nucleo: string | null;
};

export async function listarGlossario(db: D1Database): Promise<TermoPublico[]> {
  const { results } = await db
    .prepare(
      `SELECT termo_origem, idioma, termo_pt, nota, manter_original, nucleo
         FROM glossario WHERE travado = 1
        ORDER BY manter_original, LOWER(termo_origem)`,
    )
    .all<TermoPublico>();
  return results ?? [];
}

export type FonteInventario = {
  nome: string;
  veiculo: string | null;
  url_site: string;
  tipo: string;
  idioma: string;
  pais: string;
  licenca: 'liberada' | 'resumo' | 'bloqueada';
  licenca_evidencia: string | null;
  marca_relogio: number;
  ativo: number;
  robots_permite: number | null;
  robots_atraso: number | null;
  robots_motivo: string | null;
  robots_conferido: string | null;
  pessoa: string | null;
  pessoa_papel: string | null;
};

/**
 * O inventário público de fontes.
 *
 * É o card mais valioso do Blueprints: publica o link que AUTORIZA cada
 * tradução. A regra central do projeto — tradução integral só de fonte
 * liberada — deixa de ser promessa e vira coisa que qualquer um confere.
 * É a diferença entre "traduzimos com autorização" e "confie em nós".
 */
export async function inventarioFontes(db: D1Database): Promise<FonteInventario[]> {
  const { results } = await db
    .prepare(
      `SELECT nome, veiculo, url_site, tipo, idioma, pais, licenca,
              licenca_evidencia, marca_relogio, ativo,
              robots_permite, robots_atraso, robots_motivo, robots_conferido,
              pessoa, pessoa_papel
         FROM fonte ORDER BY licenca, nome`,
    )
    .all<FonteInventario>();
  return results ?? [];
}

export type Correcao = { texto: string; data: string; item_slug: string | null; item_nucleo: string | null };

export async function listarCorrecoes(db: D1Database): Promise<Correcao[]> {
  const { results } = await db
    .prepare(
      `SELECT c.texto, c.data, i.slug AS item_slug, i.nucleo AS item_nucleo
         FROM correcao c LEFT JOIN item i ON i.id = c.item_id
        ORDER BY c.data DESC LIMIT 100`,
    )
    .all<Correcao>();
  return results ?? [];
}

/** Guarda o e-mail. Devolve false se já estava lá — sem dizer isso a quem enviou. */
export async function assinar(db: D1Database, email: string, origem: string): Promise<boolean> {
  const r = await db
    .prepare(
      `INSERT OR IGNORE INTO assinante (email, origem, criado_em)
       VALUES (?1, ?2, datetime('now'))`,
    )
    .bind(email.toLowerCase(), origem)
    .run();
  return (r.meta?.changes ?? 0) > 0;
}

export async function contarAssinantes(db: D1Database): Promise<number> {
  const l = await db.prepare(`SELECT COUNT(*) n FROM assinante`).first<{ n: number }>();
  return l?.n ?? 0;
}


/**
 * Quantos itens publicados há num núcleo.
 *
 * Existe por causa da paginação: sem o total, a última página não sabe que é
 * a última, e o leitor descobre pelo vazio. Contador separado é uma consulta
 * a mais — e é mais barata que carregar tudo para saber o tamanho.
 */
export async function contarRadar(db: D1Database, nucleo: ChaveNucleo): Promise<number> {
  const l = await db
    .prepare(`SELECT COUNT(*) n FROM item WHERE nucleo = ?1 AND status = 'publicado'`)
    .bind(nucleo)
    .first<{ n: number }>();
  return l?.n ?? 0;
}

/** O mesmo, para um recorte de veredito. */
export async function contarRadarPorVeredito(
  db: D1Database,
  nucleo: ChaveNucleo,
  veredito: string,
): Promise<number> {
  const l = await db
    .prepare(
      `SELECT COUNT(*) n FROM item
        WHERE nucleo = ?1 AND status = 'publicado' AND contexto_veredito = ?2`,
    )
    .bind(nucleo, veredito)
    .first<{ n: number }>();
  return l?.n ?? 0;
}
