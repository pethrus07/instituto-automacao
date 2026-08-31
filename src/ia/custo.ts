/**
 * Contabilidade de custo e o kill-switch.
 *
 * Isto não é um extra: a infraestrutura é da conta do sócio, e o custo de
 * API não é Cloudflare. Um feed que enlouquece à meia-noite vira uma conta
 * que não é de quem construiu — e é a coisa mais fácil de estragar uma
 * sociedade. O teto pausa o coletor antes disso.
 *
 * Ver acordo interno ponto 2.
 */
import type { Env } from '../config';
import { usdParaBrl, type Uso } from './precos';

/** Teto padrão, em reais por dia. Sobrescrito por env. */
const TETO_PADRAO_BRL = 3.0;
const COTACAO_PADRAO = 5.4;

export const tetoDiario = (env: Env) => Number(env.TETO_DIARIO_BRL ?? TETO_PADRAO_BRL);
export const cotacao = (env: Env) => Number(env.USD_BRL ?? COTACAO_PADRAO);

const hoje = () => new Date().toISOString().slice(0, 10);

export type EstadoCusto = {
  data: string;
  brl: number;
  teto: number;
  itens: number;
  pausado: boolean;
};

export async function estadoDoDia(env: Env): Promise<EstadoCusto> {
  const linha = await env.DB.prepare(
    `SELECT data, brl, itens, pausado_em FROM custo_dia WHERE data = ?1`,
  )
    .bind(hoje())
    .first<{ data: string; brl: number; itens: number; pausado_em: string | null }>();

  const teto = tetoDiario(env);
  return {
    data: hoje(),
    brl: linha?.brl ?? 0,
    teto,
    itens: linha?.itens ?? 0,
    pausado: Boolean(linha?.pausado_em) || (linha?.brl ?? 0) >= teto,
  };
}

/**
 * Registra o uso e devolve o estado depois dele.
 *
 * A gravação é acumulativa e num INSERT só (upsert), porque duas invocações
 * do cron podem se sobrepor — ler-somar-gravar em duas idas perderia uma.
 */
export async function registrar(env: Env, usos: Uso[]): Promise<EstadoCusto> {
  if (usos.length === 0) return estadoDoDia(env);

  const tIn = usos.reduce((s, u) => s + u.tokens_in, 0);
  const tOut = usos.reduce((s, u) => s + u.tokens_out, 0);
  const brl = usdParaBrl(
    usos.reduce((s, u) => s + u.usd, 0),
    cotacao(env),
  );

  await env.DB.prepare(
    `INSERT INTO custo_dia (data, tokens_in, tokens_out, brl, itens)
     VALUES (?1, ?2, ?3, ?4, 1)
     ON CONFLICT(data) DO UPDATE SET
       tokens_in  = tokens_in  + excluded.tokens_in,
       tokens_out = tokens_out + excluded.tokens_out,
       brl        = brl        + excluded.brl,
       itens      = itens      + 1`,
  )
    .bind(hoje(), tIn, tOut, brl)
    .run();

  const estado = await estadoDoDia(env);

  // Carimba a pausa uma vez só, para o relatório saber a que horas parou.
  if (estado.brl >= estado.teto) {
    await env.DB.prepare(
      `UPDATE custo_dia SET pausado_em = datetime('now') WHERE data = ?1 AND pausado_em IS NULL`,
    )
      .bind(hoje())
      .run();
  }

  return estado;
}
