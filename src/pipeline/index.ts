/**
 * O pipeline: de `coletado` até a página.
 *
 * Corre depois do coletor, sobre o que já está na base. Separar os dois é o
 * que permite o coletor continuar juntando material mesmo com o teto de
 * custo estourado — a coleta não pode parar, porque feed não guarda
 * histórico e dia sem coletar não volta.
 *
 * ⚠️ Quem chama envolve em ctx.waitUntil.
 */
import type { Env, ChaveNucleo } from '../config';
import { ehNucleo } from '../config';
import { slugificar } from '../coletor/url';
import { estadoDoDia, registrar } from '../ia/custo';
import { carregarGlossario, triar, traduzir, contextualizar } from '../ia/etapas';
import { classificarFalha, simulando } from '../ia/cliente';
import type { Uso } from '../ia/precos';

/** Teto por invocação: o cron volta em 15 min, e o Worker tem orçamento de CPU. */
const ITENS_POR_TICK = 6;

export type RelatorioPipeline = {
  processados: number;
  publicados: number;
  aguardando: number;
  arquivados: number;
  erros: { item: string; erro: string }[];
  custo_brl: number;
  pausado_por_teto: boolean;
  simulado: boolean;
  ms: number;
};

type Pendente = {
  id: string;
  titulo: string;
  resumo: string | null;
  idioma_origem: string;
  publicado_fonte: string;
  fonte_nome: string;
  licenca: 'liberada' | 'resumo' | 'bloqueada';
  confianca: 'alta' | 'media' | 'baixa';
};

export async function processar(env: Env, limite = ITENS_POR_TICK): Promise<RelatorioPipeline> {
  const t0 = Date.now();
  const rel: RelatorioPipeline = {
    processados: 0,
    publicados: 0,
    aguardando: 0,
    arquivados: 0,
    erros: [],
    custo_brl: 0,
    pausado_por_teto: false,
    simulado: simulando(env),
    ms: 0,
  };

  // O portão de custo vem ANTES de qualquer chamada — não depois.
  let custo = await estadoDoDia(env);
  if (custo.pausado) {
    rel.pausado_por_teto = true;
    rel.custo_brl = custo.brl;
    rel.ms = Date.now() - t0;
    return rel;
  }

  const { results } = await env.DB.prepare(
    `SELECT i.id, i.titulo, i.resumo, i.idioma_origem, i.publicado_fonte,
            f.nome AS fonte_nome, f.licenca, f.confianca
       FROM item i JOIN fonte f ON f.id = i.fonte_id
      WHERE i.status = 'coletado' AND f.licenca <> 'bloqueada'
      ORDER BY i.publicado_fonte DESC
      LIMIT ?1`,
  )
    .bind(limite)
    .all<Pendente>();

  const glossarios = new Map<string, string>();

  for (const p of results ?? []) {
    if (custo.pausado) {
      rel.pausado_por_teto = true;
      break;
    }

    const usos: Uso[] = [];
    try {
      /* 1 · triagem + classificação + título e resumo em pt — modelo barato */
      const t = await triar(env, {
        titulo: p.titulo,
        resumo: p.resumo,
        idioma_origem: p.idioma_origem,
        fonte: p.fonte_nome,
      });
      usos.push(t.uso);

      if (!t.dado.publicar) {
        await arquivar(env, p.id, t.dado.motivo);
        rel.arquivados++;
        rel.processados++;
        custo = await registrar(env, usos);
        continue;
      }

      const nucleo: ChaveNucleo = ehNucleo(t.dado.nucleo) ? t.dado.nucleo : 'industria';

      /* 2 · tradução integral — SÓ se a fonte permitir.
         A licença é lida do banco, não do que a etapa anterior achou. */
      let corpo: string | null = null;
      if (p.licenca === 'liberada') {
        if (!glossarios.has(p.idioma_origem)) {
          glossarios.set(p.idioma_origem, await carregarGlossario(env, p.idioma_origem));
        }
        const tr = await traduzir(
          env,
          { titulo: p.titulo, resumo: p.resumo, idioma_origem: p.idioma_origem },
          glossarios.get(p.idioma_origem)!,
        );
        usos.push(tr.uso);
        corpo = tr.dado;
      }

      /* 3 · o "o que isso muda aqui" — a camada que justifica o site */
      const ctx = await contextualizar(env, {
        titulo_pt: t.dado.titulo_pt,
        resumo_pt: t.dado.resumo_pt,
        fornecedores: t.dado.fornecedores,
      });
      usos.push(ctx.uso);

      /* 4 · publicar ou mandar para a fila.
         Fonte liberada e confiável vai ao ar sozinha COM o selo dizendo que
         ninguém revisou — honesto em vez de esperto. O resto espera o toque
         no WhatsApp (sprint 4). */
      const automatico = p.licenca === 'liberada' && p.confianca === 'alta';
      if (automatico) {
        await publicar(env, p, nucleo, t.dado, corpo, ctx.dado);
        rel.publicados++;
      } else {
        await guardarClassificado(env, p.id, nucleo, t.dado, corpo, ctx.dado);
        rel.aguardando++;
      }

      rel.processados++;
      custo = await registrar(env, usos);
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      rel.erros.push({ item: p.id, erro: msg });
      // Cobra o que já foi gasto antes da falha — token consumido não volta.
      if (usos.length) custo = await registrar(env, usos);
      if (classificarFalha(erro) === 'parar') break;
    }
  }

  rel.custo_brl = custo.brl;
  rel.pausado_por_teto = rel.pausado_por_teto || custo.pausado;
  rel.ms = Date.now() - t0;
  return rel;
}

/* ---------------------------------------------------------------- escrita */

async function arquivar(env: Env, id: string, motivo: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE item SET status='arquivado', motivo_arquivo=?2 WHERE id=?1`,
  )
    .bind(id, motivo.slice(0, 300))
    .run();
}

type Classificado = {
  titulo_pt: string;
  resumo_pt: string;
  tipo_de_item: string;
  tema: string[];
  fornecedores: string[];
  uf: string | null;
};

async function guardarClassificado(
  env: Env,
  id: string,
  nucleo: ChaveNucleo,
  t: Classificado,
  corpo: string | null,
  contexto: string,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE item SET status='classificado', nucleo=?2, titulo=?3, resumo=?4, corpo=?5,
            contexto_br=?6, tipo_de_item=?7, tema=?8, fornecedores=?9, uf=?10
      WHERE id=?1`,
  )
    .bind(
      id,
      nucleo,
      t.titulo_pt,
      t.resumo_pt,
      corpo,
      contexto,
      t.tipo_de_item,
      JSON.stringify(t.tema),
      JSON.stringify(t.fornecedores),
      t.uf,
    )
    .run();
}

/**
 * Publica. O slug é gerado aqui e nunca mais muda — URL de item publicado é
 * contrato com quem linkou.
 */
async function publicar(
  env: Env,
  p: Pendente,
  nucleo: ChaveNucleo,
  t: Classificado,
  corpo: string | null,
  contexto: string,
): Promise<void> {
  const agora = new Date();
  const minutos = Math.max(
    0,
    Math.round((agora.getTime() - new Date(p.publicado_fonte).getTime()) / 60000),
  );

  await env.DB.prepare(
    `UPDATE item
        SET status='publicado', nucleo=?2, titulo=?3, resumo=?4, corpo=?5, contexto_br=?6,
            tipo_de_item=?7, tema=?8, fornecedores=?9, uf=?10,
            slug=COALESCE(slug, ?11), publicado_em=?12, minutos_apos_fonte=?13,
            traduzido_em=CASE WHEN ?5 IS NOT NULL THEN ?12 ELSE NULL END
      WHERE id=?1`,
  )
    .bind(
      p.id,
      nucleo,
      t.titulo_pt,
      t.resumo_pt,
      corpo,
      contexto,
      t.tipo_de_item,
      JSON.stringify(t.tema),
      JSON.stringify(t.fornecedores),
      t.uf,
      await slugUnico(env, t.titulo_pt, p.id),
      agora.toISOString(),
      minutos,
    )
    .run();
}

/** Dois lançamentos podem ter o mesmo título; o slug tem de ser único. */
async function slugUnico(env: Env, titulo: string, id: string): Promise<string> {
  const base = slugificar(titulo) || 'item';
  const existe = await env.DB.prepare(`SELECT id FROM item WHERE slug = ?1 AND id <> ?2`)
    .bind(base, id)
    .first<{ id: string }>();
  return existe ? `${base}-${id.slice(-6)}` : base;
}
