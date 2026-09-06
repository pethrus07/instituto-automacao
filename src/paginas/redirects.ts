/**
 * Link que alguém guardou é contrato. 301 para a seção que herdou o assunto.
 */
import { REDIRECTS_V1 } from '../config';
import { novaApp } from './app';

export const redirects = novaApp();

for (const [de, para] of Object.entries(REDIRECTS_V1)) {
  redirects.get(de, (c) => c.redirect(para, 301));
  redirects.get(`${de}/:slug`, (c) => c.redirect(para, 301));
}
for (const antigo of ['analise', 'caso']) {
  redirects.get(`/${antigo}/:slug`, (c) => c.redirect('/relatorios', 301));
}
