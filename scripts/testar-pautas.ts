/**
 * Testes do plano editorial (src/pautas.ts).
 *
 *   node --experimental-strip-types scripts/testar-pautas.ts
 *
 * A série é uma promessa ao autor — "são cinco tópicos, com começo, meio e
 * fim". Série de 5 com 4 pautas, ou com duas partes 3, é promessa quebrada
 * que ninguém vê até o autor chegar na parte que falta.
 */
import { PAUTAS, SERIES, TRILHAS, pautasDaSerie } from '../src/pautas.ts';
import { BLOCOS } from '../src/ui/markdown.ts';

const erros: string[] = [];
const slugs = new Set<string>();
for (const p of PAUTAS) {
  if (slugs.has(p.slug)) erros.push(`pauta repetida: ${p.slug}`);
  slugs.add(p.slug);
  if (!/^[a-z0-9-]+$/.test(p.slug)) erros.push(`slug inválido: ${p.slug}`);
  if (!TRILHAS.some((t) => t.slug === p.trilha)) erros.push(`${p.slug}: trilha "${p.trilha}" não existe`);
  if (p.serie && !SERIES.some((s) => s.slug === p.serie)) erros.push(`${p.slug}: série "${p.serie}" não existe`);
  if (!!p.serie !== !!p.parte) erros.push(`${p.slug}: série e parte andam juntas`);
  if (p.cobrir.length < 2) erros.push(`${p.slug}: o esqueleto precisa de ao menos 2 itens`);
  if (!p.blocos.includes('quiz')) erros.push(`${p.slug}: toda pauta sugere o quiz — é a marca do site`);
  for (const b of p.blocos) if (!(b in BLOCOS) && !['tabela', 'codigo', 'terminal', 'imagem'].includes(b)) erros.push(`${p.slug}: bloco sugerido "${b}" não existe`);
}
for (const s of SERIES) {
  if (!TRILHAS.some((t) => t.slug === s.trilha)) erros.push(`série ${s.slug}: trilha "${s.trilha}" não existe`);
  const partes = pautasDaSerie(s.slug).map((p) => p.parte);
  const esperado = Array.from({ length: s.partes }, (_, i) => i + 1);
  if (JSON.stringify(partes) !== JSON.stringify(esperado)) erros.push(`série ${s.slug}: promete ${s.partes} partes, tem [${partes.join(', ')}]`);
  if (pautasDaSerie(s.slug).some((p) => p.trilha !== s.trilha)) erros.push(`série ${s.slug}: pauta de outra trilha dentro`);
}
for (const t of TRILHAS) if (!PAUTAS.some((p) => p.trilha === t.slug)) erros.push(`trilha ${t.slug} sem pauta`);

for (const e of erros) console.error(`✗ ${e}`);
console.log(`${erros.length ? '✗' : '✓'} pautas: ${PAUTAS.length} pautas · ${SERIES.length} séries · ${TRILHAS.length} trilhas · ${erros.length} erro(s)`);
if (erros.length) process.exit(1);
