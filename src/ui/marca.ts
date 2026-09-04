/**
 * A marca gráfica.
 *
 * Nasceu do vocabulário que o site já tinha: a varredura de radar das capas
 * geradas. Um anel, um raio que varre, e UM ponto aceso — o assunto que o
 * radar pegou. É o produto inteiro num desenho: acompanhamos o que o setor
 * lança lá fora e marcamos o que chega aqui.
 *
 * Duas cores, cada uma com o mesmo trabalho que tem no resto do site: azul
 * é a instituição (o anel, o raio, o centro), laranja é o que importa (o
 * ponto). Nada de gradiente, nada de sombra — tem de sobreviver a 16 px no
 * favicon e a 2 cm num crachá.
 *
 * Em página, as cores vêm dos tokens (classes). Em favicon, vão cruas: o
 * SVG servido sozinho não vê o CSS da página.
 */

const ANGULO = -38; // graus; o raio aponta para cima e para a direita
const R = 27;
const C = 32;

const rad = (ANGULO * Math.PI) / 180;
const borda = { x: C + Math.cos(rad) * R, y: C + Math.sin(rad) * R };
const ponto = { x: C + Math.cos(rad) * R * 0.62, y: C + Math.sin(rad) * R * 0.62 };
// a varredura: o setor de 0° até o raio
const inicioVarredura = { x: C + R, y: C };

const n = (v: number) => v.toFixed(2);

/** O desenho, com as classes que os tokens vestem. */
function corpo(cores?: { marca: string; acao: string }): string {
  const anel = cores ? `fill="none" stroke="${cores.marca}" stroke-width="3.2"` : 'class="m-anel"';
  const varredura = cores ? `fill="${cores.marca}" opacity=".14"` : 'class="m-varredura"';
  const raio = cores ? `stroke="${cores.marca}" stroke-width="3.2" stroke-linecap="round"` : 'class="m-raio"';
  const alvo = cores ? `fill="${cores.acao}"` : 'class="m-ponto"';
  const centro = cores ? `fill="${cores.marca}"` : 'class="m-centro"';

  return `<circle cx="${C}" cy="${C}" r="${R}" ${anel}/>
  <path d="M${C} ${C} L${n(inicioVarredura.x)} ${n(inicioVarredura.y)} A${R} ${R} 0 0 0 ${n(borda.x)} ${n(borda.y)} Z" ${varredura}/>
  <line x1="${C}" y1="${C}" x2="${n(borda.x)}" y2="${n(borda.y)}" ${raio}/>
  <circle cx="${n(ponto.x)}" cy="${n(ponto.y)}" r="4.6" ${alvo}/>
  <circle cx="${C}" cy="${C}" r="2.6" ${centro}/>`;
}

/** O símbolo para a página, na altura pedida (em px de CSS). */
export function simbolo(altura = 40): string {
  return `<svg class="marca-simbolo" width="${altura}" height="${altura}" viewBox="0 0 64 64" role="img" aria-label="Instituto Automação">
  ${corpo()}
</svg>`;
}

/** O favicon, com as cores cravadas — é servido sozinho, sem o CSS da página. */
export function favicon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#ffffff"/>
  ${corpo({ marca: '#0d47a1', acao: '#c2410c' })}
</svg>`;
}
