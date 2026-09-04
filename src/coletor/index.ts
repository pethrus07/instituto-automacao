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
import { lerRobots } from './robots';
import { ehIndice, lerIndiceSitemaps, lerSitemapNoticias } from './sitemap';

/**
 * Identifica o robô com honestidade. Um veículo que se esconde não é veículo.
 *
 * ⚠️ SÓ ASCII. O "ç" de "automação" estava aqui e o workerd avisava a cada
 * requisição: cabeçalho HTTP não é UTF-8, e servidor que rejeita byte alto
 * devolve 403 — um bloqueio que teria parecido decisão da fonte e era nosso.
 * O nome do bot já não tinha cedilha; a descrição atrás dele tinha.
 */
const UA =
  'InstitutoAutomacaoBot/0.1 (+https://institutoautomacao.com.br/transparencia; radar de automacao)';

const TEMPO_LIMITE_MS = 10_000;
/** Teto da espera pedida por Crawl-delay dentro de um tick. */
const ESPERA_MAX_MS = 15_000;
/** De quanto em quanto tempo o veredito do robots.txt é reconferido. */
const ROBOTS_VALIDADE_MS = 7 * 86_400_000;
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
  colheita: 'feed' | 'sitemap';
  intervalo_min: number;
  robots_permite: number | null;
  robots_atraso: number | null;
  robots_conferido: string | null;
};

export type RelatorioColeta = {
  fontes: number;
  novos: number;
  repetidos: number;
  ignorados: number;
  /** fontes que ficaram para o próximo tick por já haver outra do mesmo host */
  adiados: number;
  /** fontes puladas porque o robots.txt delas não autoriza */
  recusados: number;
  erros: { fonte: string; erro: string }[];
  ms: number;
};

/** Fontes ativas cujo intervalo venceu. Bloqueada nunca entra. */
async function fontesVencidas(db: D1Database, limite: number): Promise<LinhaFonte[]> {
  const { results } = await db
    .prepare(
      `SELECT id, nome, url_feed, url_site, idioma, nucleo, licenca, colheita, intervalo_min,
              robots_permite, robots_atraso, robots_conferido
         FROM fonte
        WHERE ativo = 1
          AND licenca <> 'bloqueada'
          AND url_feed IS NOT NULL
          -- fonte recusada pelo robots não ocupa vaga no tick, mas volta a ser
          -- conferida quando o veredito vence: fonte muda de ideia
          AND (robots_permite IS NULL OR robots_permite = 1
               OR robots_conferido <= datetime('now', '-7 days'))
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
  const rel: RelatorioColeta = {
    fontes: 0, novos: 0, repetidos: 0, ignorados: 0, adiados: 0, recusados: 0, erros: [], ms: 0,
  };

  const fontes = await fontesVencidas(env.DB, limite);

  /**
   * No máximo uma fonte por host a cada tick.
   *
   * Descoberto medindo: três feeds do Reddit em sequência devolveram 429 no
   * segundo e no terceiro. Espaçar por host é mais honesto que aumentar o
   * intervalo de todas as fontes — o cron volta em 15 min e pega as que
   * ficaram, então nada se perde, e paramos de bater na porta de quem já
   * respondeu agora.
   */
  const hostsDoTick = new Set<string>();

  for (const f of fontes) {
    let host = '';
    try {
      host = new URL(f.url_feed!).hostname;
    } catch {
      /* URL inválida cai no catch de baixo, com erro registrado */
    }
    if (host && hostsDoTick.has(host)) {
      rel.adiados++;
      continue;
    }
    if (host) hostsDoTick.add(host);

    /**
     * O robots.txt decide, e o veredito vale 7 dias.
     *
     * Reconferir é barato perto do custo de coletar quem pediu para não ser
     * coletado. O resultado fica gravado com o motivo e a data, e aparece em
     * /blueprints: dá para conferir por que cada fonte entra ou não entra.
     */
    const conferido = f.robots_conferido
      ? new Date(f.robots_conferido.replace(' ', 'T') + 'Z').getTime()
      : 0;
    const venceu = Date.now() - conferido > ROBOTS_VALIDADE_MS;

    if (venceu) {
      const rb = await lerRobots(f.url_feed!, UA);
      // `null` (robots ilegível) é tratado como não: sem regra legível não há
      // consentimento a inferir.
      f.robots_permite = rb.permite === true ? 1 : 0;
      f.robots_atraso = rb.atraso;
      await env.DB.prepare(
        `UPDATE fonte SET robots_permite = ?2, robots_atraso = ?3, robots_motivo = ?4,
                robots_conferido = datetime('now') WHERE id = ?1`,
      )
        .bind(f.id, f.robots_permite, rb.atraso, rb.motivo.slice(0, 200))
        .run();
    }

    if (f.robots_permite === 0) {
      rel.recusados++;
      continue;
    }

    /**
     * Crawl-delay entre o robots.txt e o feed.
     *
     * Acabamos de bater no mesmo host para ler o robots; buscar o feed no
     * instante seguinte violaria o intervalo que a fonte pediu. Espera de
     * verdade, com teto para não estourar o orçamento do tick.
     */
    if (venceu && f.robots_atraso) {
      await new Promise((r) => setTimeout(r, Math.min(f.robots_atraso! * 1000, ESPERA_MAX_MS)));
    }

    rel.fontes++;
    try {
      const eSitemap = f.colheita === 'sitemap';
      const resp = await fetch(f.url_feed!, {
        headers: {
          'user-agent': UA,
          accept: eSitemap
            ? 'application/xml, text/xml'
            : 'application/rss+xml, application/atom+xml, application/xml, text/xml',
        },
        signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      let xml = await resp.text();

      /**
       * Índice de sitemaps: desce UM nível, e só um.
       *
       * O endereço que o robots.txt anuncia costuma ser o índice, não a
       * lista. Descer é necessário; descer sem limite é como um coletor
       * vira um rastreador do site inteiro — que é exatamente o que não
       * queremos ser. O robots do filho é conferido de novo porque as
       * regras são por caminho, não por domínio.
       */
      if (eSitemap && ehIndice(xml)) {
        const filho = lerIndiceSitemaps(xml)[0];
        if (!filho) throw new Error('índice de sitemaps sem filhos');

        const permissao = await lerRobots(filho, UA);
        if (permissao.permite !== true) throw new Error(`robots.txt barra ${filho}`);
        if (f.robots_atraso) {
          await new Promise((r) => setTimeout(r, Math.min(f.robots_atraso! * 1000, ESPERA_MAX_MS)));
        }

        const resp2 = await fetch(filho, {
          headers: { 'user-agent': UA, accept: 'application/xml, text/xml' },
          signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
        });
        if (!resp2.ok) throw new Error(`HTTP ${resp2.status} no sitemap ${filho}`);
        xml = await resp2.text();
      }

      const entradas = (eSitemap ? lerSitemapNoticias(xml) : lerFeed(xml)).slice(
        0,
        ENTRADAS_POR_FONTE,
      );
      if (entradas.length === 0) {
        throw new Error(eSitemap ? 'sitemap sem notícia legível' : 'feed sem entradas legíveis');
      }

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

      /**
       * Crawl-delay também vira piso do intervalo entre coletas.
       *
       * O padrão fala em segundos entre requisições e o nosso intervalo é em
       * minutos, então converter para cima é conservador: quem pede 10 s já
       * está folgado com os nossos 60 min, e quem pedir 2 h passa a mandar.
       */
      const pedido = f.robots_atraso ? Math.ceil(f.robots_atraso / 60) : 0;
      const intervalo = Math.max(f.intervalo_min, pedido);

      await env.DB.prepare(
        `UPDATE fonte SET ultima_coleta = datetime('now'), ultimo_erro = NULL,
                intervalo_min = ?2 WHERE id = ?1`,
      )
        .bind(f.id, intervalo)
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
 * v2: grava DEZ colunas. Não há mais `modo`, `status` nem `nucleo` no item —
 * eram estado do pipeline de IA sobre o registro, e o pipeline não existe.
 * Item é o que foi colhido; peça é outra coisa, mora em conteudo/**.
 */
async function gravar(
  db: D1Database,
  f: LinhaFonte,
  e: { titulo: string; link: string; publicado: string | null; resumo: string | null },
  canonica: string,
): Promise<boolean> {
  const publicado = e.publicado ?? new Date().toISOString();
  const id = `i-${await digest(canonica)}`;

  const r = await db
    .prepare(
      `INSERT OR IGNORE INTO item
         (id, fonte_id, titulo, url, url_canonica, idioma, resumo, publicado_fonte)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    )
    .bind(id, f.id, e.titulo, e.link, canonica, f.idioma, e.resumo, publicado)
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
