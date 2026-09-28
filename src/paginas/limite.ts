/**
 * O limite de envio por IP — o anti-spam dos formulários, sem script de
 * terceiro na página (a CSP do site não deixa entrar captcha, e nem deve).
 *
 * 28/09/2026, antes de divulgar o link de /escrever: o único filtro era o
 * campo-isca (`sitio`), que pega robô burro. Este pega o insistente: 5 envios
 * por minuto por IP, contados pela Cloudflare (binding LIMITE_ENVIO no
 * wrangler.toml). Quem escreve um artigo envia uma vez; quem manda 50 por
 * minuto não é autor.
 *
 * Sem o binding (dev local) não limita nada — o limite é da borda.
 */
import type { Context } from 'hono';
import type { Ambiente } from './app';

export async function passouDoLimite(c: Context<Ambiente>): Promise<boolean> {
  const limite = c.env.LIMITE_ENVIO;
  if (!limite) return false;
  const ip = c.req.header('cf-connecting-ip') ?? 'sem-ip';
  try {
    const { success } = await limite.limit({ key: `${new URL(c.req.url).pathname}:${ip}` });
    return !success;
  } catch {
    return false; // o limitador fora do ar não pode derrubar o formulário
  }
}
