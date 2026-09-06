/**
 * O que toda página compartilha: o tipo do app e o envelope do HTML.
 *
 * Cada arquivo em src/paginas/ exporta um `Hono` com as suas rotas; o
 * src/index.tsx monta todos. Dividir por página é o que mantém cada arquivo
 * legível — e é o que deixa apagar uma página sem ler as outras.
 */
import { Hono } from 'hono';
import type { Env } from '../config';

export type Ambiente = { Bindings: Env };
export type App = Hono<Ambiente>;

/**
 * `strict: false`: /noticias e /noticias/ são a mesma coisa. Barra final
 * virando 404 é o erro mais bobo de SEO que existe, e ninguém digita URL
 * pensando nisso.
 */
export const novaApp = (): App => new Hono<Ambiente>({ strict: false });

export const pagina = (no: unknown) => `<!doctype html>${String(no)}`;
