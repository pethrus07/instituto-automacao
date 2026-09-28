/**
 * O que recebe POST e não é a agenda nem o contato: a lista de e-mail.
 *
 * Desde 07/09/2026 a lista pergunta, opcionalmente, o que a pessoa faz e
 * onde. Os dois campos são fechados ou curtos, e o que não bate com a lista
 * de atuações vira nulo — não vira texto livre no banco.
 */
import { ehAtuacao } from '../config';
import { assinar } from '../db';
import { passouDoLimite } from './limite';
import { novaApp } from './app';

export const formularios = novaApp();

formularios.post('/assinar', async (c) => {
  if (await passouDoLimite(c)) return c.text('Muitos envios seguidos deste endereço. Espere um minuto e tente de novo.', 429);
  const f = await c.req.formData();
  const email = String(f.get('email') ?? '').trim().slice(0, 200);
  const sitio = String(f.get('sitio') ?? '').trim();
  const atuacaoBruta = String(f.get('atuacao') ?? '').trim();
  const empresa = String(f.get('empresa') ?? '').trim().slice(0, 120);
  const origem = String(f.get('origem') ?? 'capa').trim().slice(0, 20) || 'capa';

  if (sitio) return c.redirect('/?assinado=1#assinar', 303);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return c.redirect('/?assinado=erro#assinar', 303);

  await assinar(c.env.DB, {
    email,
    origem,
    atuacao: ehAtuacao(atuacaoBruta) ? atuacaoBruta : null,
    empresa: empresa || null,
  });
  return c.redirect('/?assinado=1#assinar', 303);
});
