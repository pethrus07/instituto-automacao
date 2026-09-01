/**
 * O Giro da Semana — a rotina.
 *
 *   dados → agregar → redigir → AUDITAR → publicar (ou parar)
 *
 * Roda no cron de segunda-feira e cobre a semana que fechou no domingo. É a
 * peça que responde à pergunta "o que aconteceu?" sem depender de alguém ter
 * tempo de escrever na segunda de manhã — e sem que isso vire um agregador
 * automático a mais, porque três coisas o separam disso:
 *
 *   · o destaque é escolhido por uma FÓRMULA publicada, com o placar à vista;
 *   · a prosa é auditada contra os números, e não vai ao ar se inventar um;
 *   · quando não há destaque, o giro diz que não há e diz por quê.
 *
 * ⚠️ Edição publicada NÃO É REESCRITA. O giro da semana 36 tem de continuar
 * dizendo o que dizia na semana 36, mesmo que a base mude depois — por isso
 * o agregado inteiro é congelado em JSON na hora de publicar.
 */
import type { Env } from '../config';
import { estadoDoDia, registrar } from '../ia/custo';
import { agregarSemana, type Semana } from './agregar';
import { auditar, type Auditoria } from './auditar';
import { redigirGiro, type Redacao } from './redigir';
import { janelaDoSlug, semanaFechada, type Janela } from './semana';

export { FORMULA, PISO_FONTES } from './agregar';
export type { Candidato, Semana } from './agregar';
export { janelaDoSlug, semanaFechada } from './semana';

export type GiroLinha = {
  id: string;
  slug: string;
  rotulo: string;
  inicio: string;
  fim: string;
  titulo: string;
  lead: string | null;
  destaque_texto: string | null;
  por_nucleo: string | null;
  agregado: string;
  auditoria: string | null;
  simulado: number;
  status: 'rascunho' | 'publicado' | 'arquivado';
  motivo_rascunho: string | null;
  publicado_em: string | null;
};

/** A edição já desempacotada, que é o que as páginas querem. */
export type Giro = Omit<GiroLinha, 'agregado' | 'auditoria' | 'por_nucleo'> & {
  agregado: Semana;
  auditoria: Auditoria | null;
  nucleos: { nucleo: string; frase: string }[];
};

function desempacotar(l: GiroLinha): Giro {
  return {
    ...l,
    agregado: JSON.parse(l.agregado) as Semana,
    auditoria: l.auditoria ? (JSON.parse(l.auditoria) as Auditoria) : null,
    nucleos: l.por_nucleo ? (JSON.parse(l.por_nucleo) as { nucleo: string; frase: string }[]) : [],
  };
}

/* ------------------------------------------------------------- leitura */

export async function obterGiro(db: D1Database, slug: string): Promise<Giro | null> {
  const l = await db
    .prepare(`SELECT * FROM giro WHERE slug = ?1 AND status = 'publicado'`)
    .bind(slug)
    .first<GiroLinha>();
  return l ? desempacotar(l) : null;
}

export async function listarGiros(db: D1Database, limite = 20): Promise<Giro[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM giro WHERE status = 'publicado' ORDER BY inicio DESC LIMIT ?1`,
    )
    .bind(limite)
    .all<GiroLinha>();
  return (results ?? []).map(desempacotar);
}

/**
 * As edições que não saíram, com o motivo.
 *
 * Existe para o `/blueprints`: uma auditoria que reprova em silêncio é uma
 * auditoria que ninguém confere. Se o giro parou de sair, tem de dar para
 * ver que parou e por quê.
 */
export async function girosBarrados(
  db: D1Database,
  limite = 10,
): Promise<{ slug: string; rotulo: string; motivo: string | null; criado_em: string }[]> {
  const { results } = await db
    .prepare(
      `SELECT slug, rotulo, motivo_rascunho AS motivo, criado_em
         FROM giro WHERE status = 'rascunho' ORDER BY inicio DESC LIMIT ?1`,
    )
    .bind(limite)
    .all<{ slug: string; rotulo: string; motivo: string | null; criado_em: string }>();
  return results ?? [];
}

/* ------------------------------------------------------------- escrita */

export type RelatorioGiro = {
  slug: string;
  rotulo: string;
  publicou: boolean;
  motivo: string | null;
  simulado: boolean;
  conferidas: number;
  falhas: string[];
  custo_brl: number;
  ms: number;
};

export async function montarGiro(env: Env, alvo?: string | Janela): Promise<RelatorioGiro> {
  const t0 = Date.now();
  const janela =
    typeof alvo === 'string' ? (janelaDoSlug(alvo) ?? semanaFechada()) : (alvo ?? semanaFechada());

  const base: RelatorioGiro = {
    slug: janela.slug,
    rotulo: janela.rotulo,
    publicou: false,
    motivo: null,
    simulado: false,
    conferidas: 0,
    falhas: [],
    custo_brl: 0,
    ms: 0,
  };
  const fechar = (r: Partial<RelatorioGiro>) => ({ ...base, ...r, ms: Date.now() - t0 });

  /* Edição já publicada não se refaz. */
  const existente = await env.DB.prepare(`SELECT status FROM giro WHERE slug = ?1`)
    .bind(janela.slug)
    .first<{ status: string }>();
  if (existente?.status === 'publicado') {
    return fechar({ publicou: true, motivo: 'edição já publicada — não é reescrita' });
  }

  const agregado = await agregarSemana(env.DB, janela);

  /* Semana sem nada coletado não vira edição vazia: vira nada. Publicar um
     giro que diz "não houve nada" toda semana treinaria o leitor a ignorar. */
  if (agregado.totais.itens === 0) {
    await guardar(env, janela, agregado, null, null, false, 'semana sem item coletado');
    return fechar({ motivo: 'semana sem item coletado' });
  }

  /* O teto de custo vale aqui como vale no pipeline. Diferença: o giro é
     UMA chamada por semana, então esbarrar no teto quase sempre quer dizer
     que o pipeline gastou tudo — e aí o giro fica para o próximo tick. */
  const custo = await estadoDoDia(env);
  if (custo.pausado) {
    await guardar(env, janela, agregado, null, null, false, 'teto diário de custo atingido');
    return fechar({ motivo: 'teto diário de custo atingido', custo_brl: custo.brl });
  }

  const r = await redigirGiro(env, agregado);
  const depois = await registrar(env, [r.uso]);
  const auditoria = auditar(agregado, r.dado);

  if (!auditoria.passou) {
    const motivo = `auditoria reprovou: ${auditoria.falhas.join(' · ')}`;
    await guardar(env, janela, agregado, r.dado, auditoria, r.simulado, motivo);
    return fechar({
      motivo,
      simulado: r.simulado,
      conferidas: auditoria.conferidas,
      falhas: auditoria.falhas,
      custo_brl: depois.brl,
    });
  }

  await guardar(env, janela, agregado, r.dado, auditoria, r.simulado, null);
  return fechar({
    publicou: true,
    simulado: r.simulado,
    conferidas: auditoria.conferidas,
    custo_brl: depois.brl,
  });
}

async function guardar(
  env: Env,
  janela: Janela,
  agregado: Semana,
  redacao: Redacao | null,
  auditoria: Auditoria | null,
  simulado: boolean,
  motivo: string | null,
): Promise<void> {
  const publicado = motivo === null && redacao !== null;
  await env.DB.prepare(
    `INSERT INTO giro (id, slug, inicio, fim, rotulo, titulo, lead, destaque_texto,
                       por_nucleo, agregado, auditoria, simulado, status,
                       motivo_rascunho, publicado_em)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
     ON CONFLICT(slug) DO UPDATE SET
       titulo = excluded.titulo, lead = excluded.lead,
       destaque_texto = excluded.destaque_texto, por_nucleo = excluded.por_nucleo,
       agregado = excluded.agregado, auditoria = excluded.auditoria,
       simulado = excluded.simulado, status = excluded.status,
       motivo_rascunho = excluded.motivo_rascunho, publicado_em = excluded.publicado_em`,
  )
    .bind(
      `g-${janela.slug}`,
      janela.slug,
      janela.inicio,
      janela.fim,
      janela.rotulo,
      redacao?.titulo ?? `Giro de ${janela.rotulo}`,
      redacao?.lead ?? null,
      redacao?.destaque_texto ?? null,
      redacao ? JSON.stringify(redacao.nucleos) : null,
      JSON.stringify(agregado),
      auditoria ? JSON.stringify(auditoria) : null,
      simulado ? 1 : 0,
      publicado ? 'publicado' : 'rascunho',
      motivo,
      publicado ? new Date().toISOString() : null,
    )
    .run();
}
