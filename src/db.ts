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

export type NovaAssinatura = {
  email: string;
  /** de onde veio: 'capa', 'peca' */
  origem: string;
  /** o que a pessoa faz (config.ts → ATUACOES), quando disse */
  atuacao?: string | null;
  empresa?: string | null;
};

/** Guarda o e-mail. Devolve false se já estava lá — sem dizer isso a quem enviou. */
export async function assinar(db: D1Database, a: NovaAssinatura): Promise<boolean> {
  const r = await db
    .prepare(
      `INSERT OR IGNORE INTO assinante (email, origem, atuacao, empresa, criado_em)
       VALUES (?1, ?2, ?3, ?4, datetime('now'))`,
    )
    .bind(a.email.toLowerCase(), a.origem, a.atuacao ?? null, a.empresa ?? null)
    .run();
  return (r.meta?.changes ?? 0) > 0;
}

/* ========================================================================= */
/* Contato — quem quer escrever, quem quer apoiar                             */
/* ========================================================================= */

export type NovoContato = {
  tipo: 'autor' | 'parceiro';
  nome: string;
  email: string;
  empresa?: string | null;
  mensagem?: string | null;
};

/** Caixa de entrada. Nunca responde sozinha: alguém lê e escreve de volta. */
export async function registrarContato(db: D1Database, c: NovoContato): Promise<void> {
  await db
    .prepare(
      `INSERT INTO contato (id, tipo, nome, email, empresa, mensagem, criado_em)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))`,
    )
    .bind(crypto.randomUUID(), c.tipo, c.nome, c.email.toLowerCase(), c.empresa ?? null, c.mensagem ?? null)
    .run();
}

export async function contarContatos(db: D1Database): Promise<{ autor: number; parceiro: number }> {
  const { results } = await db.prepare(`SELECT tipo, COUNT(*) n FROM contato GROUP BY tipo`).all<{ tipo: string; n: number }>();
  const r = { autor: 0, parceiro: 0 };
  for (const l of results ?? []) if (l.tipo === 'autor' || l.tipo === 'parceiro') r[l.tipo] = l.n;
  return r;
}

export async function contarAssinantes(db: D1Database): Promise<number> {
  const l = await db.prepare(`SELECT COUNT(*) n FROM assinante`).first<{ n: number }>();
  return l?.n ?? 0;
}

/* ------------------------------------------------------------ submissão de artigo */

export type NovaSubmissao = {
  protocolo: string;
  pauta: string | null;
  titulo: string;
  autorNome: string;
  autorEmail: string;
  autor: Record<string, unknown>;
  meta: Record<string, unknown>;
  markdown: string;
  arquivos: { nome: string; tipo: 'image/jpeg' | 'image/png'; dados: ArrayBuffer }[];
};

/**
 * O envio do editor de /escrever. Texto e imagens entram num lote só: ou
 * chega tudo, ou não chega nada — artigo sem as imagens que ele cita é pior
 * que envio recusado, porque parece completo.
 *
 * É caixa de entrada: nada daqui vai para o ar. `npm run submissoes` baixa,
 * escreve o arquivo no git, e alguém lê antes de publicar.
 */
export async function registrarSubmissao(db: D1Database, s: NovaSubmissao): Promise<void> {
  const id = crypto.randomUUID();
  const lote = [
    db
      .prepare(
        `INSERT INTO submissao (id, protocolo, pauta, titulo, autor_nome, autor_email, autor_json, meta_json, markdown, criado_em)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'))`,
      )
      .bind(id, s.protocolo, s.pauta, s.titulo, s.autorNome, s.autorEmail.toLowerCase(), JSON.stringify(s.autor), JSON.stringify(s.meta), s.markdown),
    ...s.arquivos.map((a) =>
      db
        .prepare(`INSERT INTO submissao_arquivo (submissao_id, nome, tipo, bytes, dados) VALUES (?1, ?2, ?3, ?4, ?5)`)
        .bind(id, a.nome, a.tipo, a.dados.byteLength, a.dados),
    ),
  ];
  await db.batch(lote);
}

/* ------------------------------------------------------------ a capa que muda sozinha */

export type ManchetaLaFora = { titulo: string; url: string; fonte: string; idioma: string; publicado: string };

/**
 * "Lá fora, hoje" — as manchetes do setor que o coletor trouxe nas últimas
 * horas, como estão na fonte. Pedido do sócio (05/10: "a cara do site
 * mudando todo dia") e decisão do Pedro (11/10).
 *
 * É DADO, não texto nosso: título original, fonte e link para ela, com o
 * rótulo de que ninguém leu ainda. Muda a cada 15 minutos sem ninguém mexer,
 * e é a vitrine do que pode virar notícia. Não fere o "sem IA": nada aqui é
 * redigido — é listado.
 *
 * Só fonte estrangeira (é "lá fora"), só do SETOR (a coluna `papel`), só
 * imprensa (fórum e rede social não são manchete), um por assunto. Se as
 * últimas 24 h trouxeram pouco (fim de semana), a janela abre para 72 h — e
 * a capa diz qual janela está mostrando.
 */
export async function laFora(db: D1Database, n = 5): Promise<{ horas: number; itens: ManchetaLaFora[] }> {
  for (const horas of [24, 72]) {
    const { results } = await db
      .prepare(
        `SELECT i.titulo, i.url, f.nome AS fonte, i.idioma, i.publicado_fonte AS publicado
           FROM item i JOIN fonte f ON f.id = i.fonte_id
          WHERE f.ativo = 1 AND f.papel = 'setor' AND f.tipo NOT IN ('forum', 'social') AND f.pais <> 'BR'
            AND datetime(i.publicado_fonte) >= datetime('now', ?1) -- o coletor grava ISO com "T"; comparar texto cru erra na borda do dia
            AND i.publicado_fonte = (SELECT MIN(x.publicado_fonte) FROM item x WHERE x.assunto_id = i.assunto_id)
          ORDER BY i.publicado_fonte DESC
          LIMIT ?2`,
      )
      .bind(`-${horas} hours`, n)
      .all<ManchetaLaFora>();
    if ((results?.length ?? 0) >= 3 || horas === 72) return { horas, itens: results ?? [] };
  }
  return { horas: 72, itens: [] };
}

/**
 * O relógio vivo da capa: quantos assuntos do SETOR saíram lá fora nos
 * últimos 7 dias e ainda não tiveram nenhuma menção em fonte brasileira.
 *
 * ⚠️ Só o setor, de propósito — o mesmo critério do balanço da semana desde
 * 24/09 (migração 008). Contar a tecnologia geral faria o número dizer que o
 * Brasil "não repercutiu" lançamento de celular, que obviamente não chega à
 * imprensa industrial daqui.
 */
export async function naoChegaram(db: D1Database): Promise<{ assuntos: number; semMencao: number }> {
  const r = await db
    .prepare(
      `SELECT COUNT(*) AS assuntos, SUM(CASE WHEN a.primeira_mencao_br IS NULL THEN 1 ELSE 0 END) AS semMencao
         FROM assunto a JOIN fonte f ON f.id = a.fonte_original
        WHERE datetime(a.publicado_original) >= datetime('now', '-7 days')
          AND f.papel = 'setor' AND f.tipo NOT IN ('forum', 'social') AND f.pais <> 'BR'`,
    )
    .first<{ assuntos: number; semMencao: number | null }>();
  return { assuntos: r?.assuntos ?? 0, semMencao: r?.semMencao ?? 0 };
}
