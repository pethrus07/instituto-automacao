/**
 * Acesso ao D1. Consulta fica aqui; rota não escreve SQL.
 *
 * v2: o banco guarda o que a máquina colhe (a base do relógio) e o que vem
 * de fora (evento, e-mail). Conteúdo não passa por aqui — mora em
 * src/conteudo, compilado de arquivo.
 */
import type { Tema } from './config';

/* ========================================================================= */
/* O relógio — a pergunta-assinatura, medida                                  */
/* ========================================================================= */

export type Relogio = {
  /** assuntos acompanhados no total */
  acompanhados: number;
  /** assuntos com atraso apurado */
  medidos: number;
  mediana_dias: number | null;
  /** publicados lá fora há mais de 90 dias e nunca mencionados aqui */
  sem_mencao: number;
  /** itens colhidos no total */
  itens: number;
  /** fontes ativas */
  fontes: number;
};

export async function relogio(db: D1Database): Promise<Relogio> {
  const l = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM assunto)                                        AS acompanhados,
         (SELECT COUNT(*) FROM assunto WHERE atraso_br_dias IS NOT NULL)      AS medidos,
         (SELECT atraso_br_dias FROM assunto WHERE atraso_br_dias IS NOT NULL
             ORDER BY atraso_br_dias
             LIMIT 1 OFFSET (SELECT COUNT(*)/2 FROM assunto WHERE atraso_br_dias IS NOT NULL)) AS mediana_dias,
         (SELECT COUNT(*) FROM assunto WHERE primeira_mencao_br IS NULL
             AND publicado_original < datetime('now','-90 days'))             AS sem_mencao,
         (SELECT COUNT(*) FROM item)                                           AS itens,
         (SELECT COUNT(*) FROM fonte WHERE ativo = 1)                          AS fontes`,
    )
    .first<Relogio>();

  return {
    acompanhados: l?.acompanhados ?? 0,
    medidos: l?.medidos ?? 0,
    mediana_dias: l?.mediana_dias ?? null,
    sem_mencao: l?.sem_mencao ?? 0,
    itens: l?.itens ?? 0,
    fontes: l?.fontes ?? 0,
  };
}

/** Para o /saude e para o critério P13: o coletor não pode perder dia. */
export async function saudeColeta(db: D1Database): Promise<{ ultima: string | null; horas: number | null }> {
  const l = await db
    .prepare(`SELECT MAX(coletado_em) ultima FROM item`)
    .first<{ ultima: string | null }>();
  const ultima = l?.ultima ?? null;
  const horas = ultima ? Math.round((Date.now() - Date.parse(ultima.replace(' ', 'T') + 'Z')) / 3600000) : null;
  return { ultima, horas };
}

/* ========================================================================= */
/* Agenda                                                                     */
/* ========================================================================= */

export type Evento = {
  id: string;
  slug: string | null;
  /** o tema; chama-se `nucleo` no banco por herança da v1 */
  nucleo: Tema;
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
  tema?: Tema;
  formato?: 'presencial' | 'online' | 'hibrido';
  onde?: 'br' | 'fora';
};

/**
 * Eventos que ainda não terminaram.
 *
 * Compara com `fim` quando existe: feira de quatro dias no terceiro dia
 * ainda é evento que acontece. Os filtros entram por lista branca — o valor
 * vem da querystring, e concatenar isso em SQL seria injeção com convite.
 */
export async function listarAgenda(db: D1Database, f: FiltroAgenda = {}, limite = 60): Promise<Evento[]> {
  const cond = [`COALESCE(fim, inicio) >= date('now')`, `status = 'publicado'`];
  const args: unknown[] = [];

  if (f.tema) {
    args.push(f.tema);
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
/* Glossário, inventário de fontes, correções e lista                         */
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
  nucleo: string | null;
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
  itens: number;
};

/**
 * O inventário público de fontes — com quantos itens cada uma trouxe.
 *
 * É o card mais valioso do Blueprints: de onde vem o que lemos, o que cada
 * fonte autoriza, e se o robots.txt dela permite. É a diferença entre
 * "lemos com autorização" e "confie em nós".
 */
export async function inventarioFontes(db: D1Database): Promise<FonteInventario[]> {
  const { results } = await db
    .prepare(
      `SELECT f.nome, f.veiculo, f.url_site, f.tipo, f.idioma, f.pais, f.nucleo, f.licenca,
              f.licenca_evidencia, f.marca_relogio, f.ativo,
              f.robots_permite, f.robots_atraso, f.robots_motivo, f.robots_conferido,
              f.pessoa, f.pessoa_papel,
              (SELECT COUNT(*) FROM item i WHERE i.fonte_id = f.id) AS itens
         FROM fonte f
        ORDER BY f.ativo DESC, (f.pessoa IS NULL), f.pais = 'BR' DESC, f.nome`,
    )
    .all<FonteInventario>();
  return results ?? [];
}

export type Correcao = { texto: string; data: string; peca: string | null };

export async function listarCorrecoes(db: D1Database): Promise<Correcao[]> {
  const { results } = await db
    .prepare(`SELECT texto, data, peca FROM correcao ORDER BY data DESC LIMIT 100`)
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
