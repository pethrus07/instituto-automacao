/**
 * O coletor.
 *
 * Roda no cron e faz POUCO por invocação: pega as fontes vencidas, busca,
 * dedupica e grava como `coletado`. Não traduz, não classifica, não publica
 * — isso é o pipeline (sprint 2). Separar as duas coisas é o que impede uma
 * fonte lenta de segurar a fila inteira.
 *
 * ⚠️ Quem chama TEM de envolver em ctx.waitUntil. Promessa não esperada é
 * cancelada quando a resposta sai, e o miniflare local deixa terminar — o
 * defeito só aparece em produção.
 */
import type { Env } from '../config';
import { lerFeed } from './feed';
import { canonicalizar, chaveAssunto } from './url';

/** Identifica o robô com honestidade. Um veículo que se esconde não é veículo. */
const UA =
  'InstitutoAutomacaoBot/0.1 (+https://institutoautomacao.com.br/transparencia; radar de automação)';

const TEMPO_LIMITE_MS = 10_000;
/** Teto por invocação: o Worker tem orçamento de CPU, e o cron volta em 15 min. */
const FONTES_POR_TICK = 8;
const ENTRADAS_POR_FONTE = 25;

export type LinhaFonte = {
  id: string;
  nome: string;
  url_feed: string | null;
  url_site: string;
  idioma: string;
  nucleo: string | null;
  licenca: 'liberada' | 'resumo' | 'bloqueada';
};

export type RelatorioColeta = {
  fontes: number;
  novos: number;
  repetidos: number;
  ignorados: number;
  erros: { fonte: string; erro: string }[];
  ms: number;
};

/** Fontes ativas cujo intervalo venceu. Bloqueada nunca entra. */
async function fontesVencidas(db: D1Database, limite: number): Promise<LinhaFonte[]> {
  const { results } = await db
    .prepare(
      `SELECT id, nome, url_feed, url_site, idioma, nucleo, licenca
         FROM fonte
        WHERE ativo = 1
          AND licenca <> 'bloqueada'
          AND url_feed IS NOT NULL
          AND (ultima_coleta IS NULL
               OR datetime(ultima_coleta, '+' || intervalo_min || ' minutes') <= datetime('now'))
        ORDER BY (ultima_coleta IS NULL) DESC, peso DESC, ultima_coleta ASC
        LIMIT ?1`,
    )
    .bind(limite)
    .all<LinhaFonte>();
  return results ?? [];
}

export async function coletar(env: Env, limite = FONTES_POR_TICK): Promise<RelatorioColeta> {
  const t0 = Date.now();
  const rel: RelatorioColeta = { fontes: 0, novos: 0, repetidos: 0, ignorados: 0, erros: [], ms: 0 };

  const fontes = await fontesVencidas(env.DB, limite);

  for (const f of fontes) {
    rel.fontes++;
    try {
      const resp = await fetch(f.url_feed!, {
        headers: { 'user-agent': UA, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const entradas = lerFeed(await resp.text()).slice(0, ENTRADAS_POR_FONTE);
      if (entradas.length === 0) throw new Error('feed sem entradas legíveis');

      for (const e of entradas) {
        const canonica = canonicalizar(e.link, f.url_site);
        if (!canonica) {
          rel.ignorados++;
          continue;
        }
        const gravou = await gravar(env.DB, f, e, canonica);
        if (gravou) rel.novos++;
        else rel.repetidos++;
      }

      await env.DB.prepare(
        `UPDATE fonte SET ultima_coleta = datetime('now'), ultimo_erro = NULL WHERE id = ?1`,
      )
        .bind(f.id)
        .run();
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      rel.erros.push({ fonte: f.nome, erro: msg });
      // marca a coleta mesmo com erro: senão a fonte quebrada é tentada
      // a cada tick e come o orçamento das que funcionam
      await env.DB.prepare(
        `UPDATE fonte SET ultima_coleta = datetime('now'), ultimo_erro = ?2 WHERE id = ?1`,
      )
        .bind(f.id, msg.slice(0, 500))
        .run();
    }
  }

  rel.ms = Date.now() - t0;
  return rel;
}

/**
 * Grava um item novo. Devolve false se já existia.
 *
 * Na coleta ainda não se sabe o núcleo real nem o título em português —
 * isso é trabalho do pipeline. O que se grava aqui é o palpite da fonte e o
 * texto original, com status 'coletado' dizendo exatamente isso.
 *
 * `modo` já sai decidido pela licença, porque essa é a única regra que não
 * pode depender de julgamento depois: licença não liberada nunca vira
 * tradução integral.
 */
async function gravar(
  db: D1Database,
  f: LinhaFonte,
  e: { titulo: string; link: string; publicado: string | null; resumo: string | null },
  canonica: string,
): Promise<boolean> {
  const modo = f.licenca === 'liberada' ? 'traducao' : 'resumo';
  const publicado = e.publicado ?? new Date().toISOString();
  const id = `i-${await digest(canonica)}`;

  const r = await db
    .prepare(
      `INSERT OR IGNORE INTO item
         (id, fonte_id, nucleo, titulo, titulo_original, url, url_canonica,
          idioma_origem, modo, resumo, publicado_fonte, status)
       VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'coletado')`,
    )
    .bind(
      id,
      f.id,
      f.nucleo ?? 'industria',
      e.titulo,
      e.link,
      canonica,
      f.idioma,
      modo,
      e.resumo,
      publicado,
    )
    .run();

  const inseriu = (r.meta?.changes ?? 0) > 0;
  if (inseriu) await ligarAssunto(db, id, e.titulo, publicado, f);
  return inseriu;
}

/**
 * Liga o item a um assunto — e é aqui que o atraso começa a ser medido.
 *
 * Fonte brasileira não vira pauta: ela marca `primeira_mencao_br`. Um
 * assunto que fica com atraso NULL por meses não é falha do coletor, é o
 * achado: é o que nunca chegou ao Brasil.
 */
async function ligarAssunto(
  db: D1Database,
  itemId: string,
  titulo: string,
  publicado: string,
  f: LinhaFonte,
): Promise<void> {
  const chave = chaveAssunto(titulo);
  if (!chave) return;

  const ehBR = f.idioma === 'pt';
  const existente = await db
    .prepare(
      `SELECT id, publicado_original, primeira_mencao_br
         FROM assunto
        WHERE chave = ?1 AND criado_em >= datetime('now','-30 days')
        LIMIT 1`,
    )
    .bind(chave)
    .first<{ id: string; publicado_original: string | null; primeira_mencao_br: string | null }>();

  if (!existente) {
    const id = `a-${await digest(chave)}`;
    await db
      .prepare(
        `INSERT OR IGNORE INTO assunto
           (id, rotulo, chave, nucleo, publicado_original, fonte_original,
            primeira_mencao_br, fonte_br, qtd_itens)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1)`,
      )
      .bind(
        id,
        titulo.slice(0, 300),
        chave,
        f.nucleo ?? 'industria',
        ehBR ? null : publicado,
        ehBR ? null : f.id,
        ehBR ? publicado : null,
        ehBR ? f.id : null,
      )
      .run();
    await db.prepare(`UPDATE item SET assunto_id = ?1 WHERE id = ?2`).bind(id, itemId).run();
    return;
  }

  await db.prepare(`UPDATE item SET assunto_id = ?1 WHERE id = ?2`).bind(existente.id, itemId).run();
  await db
    .prepare(`UPDATE assunto SET qtd_itens = qtd_itens + 1 WHERE id = ?1`)
    .bind(existente.id)
    .run();

  // primeira menção lá fora, se esta for anterior à que estava registrada
  if (!ehBR && (!existente.publicado_original || publicado < existente.publicado_original)) {
    await db
      .prepare(`UPDATE assunto SET publicado_original = ?2, fonte_original = ?3 WHERE id = ?1`)
      .bind(existente.id, publicado, f.id)
      .run();
  }

  // primeira menção brasileira — só a PRIMEIRA conta
  if (ehBR && !existente.primeira_mencao_br) {
    await db
      .prepare(
        `UPDATE assunto
            SET primeira_mencao_br = ?2,
                fonte_br = ?3,
                atraso_br_dias = CAST(julianday(?2) - julianday(publicado_original) AS INTEGER),
                atraso_apurado_em = datetime('now')
          WHERE id = ?1 AND publicado_original IS NOT NULL`,
      )
      .bind(existente.id, publicado, f.id)
      .run();
  }
}

/** id estável e curto a partir da URL canônica — mesma URL, mesmo id, sempre. */
async function digest(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(texto));
  return [...new Uint8Array(buf)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
