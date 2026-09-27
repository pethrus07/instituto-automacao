/**
 * Os guias de todas as pautas, num lugar só (ver ./tipos.ts).
 *
 * Divididos em quatro arquivos por trilha só para ficarem legíveis; quem
 * consulta usa `guiaDe(slug)`. `scripts/testar-pautas.ts` exige que toda
 * pauta de src/pautas.ts tenha guia, e que o guia bata com ela (uma lista de
 * dicas por item de `cobrir`, três perguntas de quiz, nada de caractere que o
 * dialeto do artigo interpretaria).
 */
import type { Guia } from './tipos';
import { GUIAS_A } from './grupo-a.ts';
import { GUIAS_B } from './grupo-b.ts';
import { GUIAS_C } from './grupo-c.ts';
import { GUIAS_D } from './grupo-d.ts';

export type { Guia } from './tipos';

export const GUIAS: Readonly<Record<string, Guia>> = { ...GUIAS_A, ...GUIAS_B, ...GUIAS_C, ...GUIAS_D };

export const guiaDe = (slug: string): Guia | null => GUIAS[slug] ?? null;
