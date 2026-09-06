/**
 * O que recebe POST e não é a agenda: a lista de e-mail.
 */
import { assinar } from '../db';
import { novaApp } from './app';

export const formularios = novaApp();

formularios.post('/assinar', async (c) => {
  const f = await c.req.formData();
  const email = String(f.get('email') ?? '').trim().slice(0, 200);
  const sitio = String(f.get('sitio') ?? '').trim();

  if (sitio) return c.redirect('/?assinado=1', 303);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return c.redirect('/?assinado=erro', 303);

  await assinar(c.env.DB, email, 'capa');
  return c.redirect('/?assinado=1', 303);
});
