/**
 * Capas geradas — a linguagem visual própria do Instituto.
 *
 * O diagnóstico que originou este arquivo foi medido, não opinado: as
 * referências institucionais do setor têm de 17 a 50 imagens na home
 * (Fraunhofer 18 img + 32 figure + 93 background; VDMA 22 e ~60% da página
 * em visual; Serrapilheira 17). O Instituto tinha ZERO. "Não está atrativo"
 * não era cor — era não haver nada para olhar.
 *
 * Não podemos usar foto de terceiro sem licença e não temos fotógrafo. Em
 * vez de tratar isso como falta, vira linguagem: desenho técnico gerado, no
 * vocabulário de quem trabalha com automação — varredura de radar, malha de
 * pontos de E/S, degraus de sinal, blocos isométricos.
 *
 * Três propriedades que fazem isto funcionar em vez de parecer remendo:
 *   1. DETERMINÍSTICO — a mesma semente dá sempre a mesma capa. O item não
 *      muda de cara a cada recarga, e a imagem vira identidade dele.
 *   2. SEM REQUISIÇÃO — é SVG embutido no HTML. Não pesa rede, não quebra,
 *      não depende de R2 nem de licença de ninguém.
 *   3. UMA FAMÍLIA — quatro motivos com a mesma paleta e a mesma espessura
 *      de traço. Variam sem virar colcha de retalhos.
 */

/** Hash estável e barato. Mesma semente, mesma capa, sempre. */
function semente(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Gerador determinístico a partir da semente. */
function sorteio(s: number) {
  let estado = s || 1;
  return () => {
    estado ^= estado << 13;
    estado ^= estado >>> 17;
    estado ^= estado << 5;
    return ((estado >>> 0) % 10000) / 10000;
  };
}

const L = 800;
const A = 450;

/** Varredura de radar — o motivo principal, e o nome do produto. */
function radar(r: () => number): string {
  const cx = L * (0.62 + r() * 0.12);
  const cy = A * 0.52;
  const aneis = [0.18, 0.34, 0.5, 0.66, 0.82]
    .map((f) => `<circle cx="${cx}" cy="${cy}" r="${(A * 0.46 * f).toFixed(1)}" />`)
    .join('');
  const raios = Array.from({ length: 12 }, (_, i) => {
    const ang = (i / 12) * Math.PI * 2;
    const x = cx + Math.cos(ang) * A * 0.46;
    const y = cy + Math.sin(ang) * A * 0.46;
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />`;
  }).join('');
  const marcas = Array.from({ length: 5 }, () => {
    const ang = r() * Math.PI * 2;
    const d = 0.2 + r() * 0.7;
    const x = cx + Math.cos(ang) * A * 0.46 * d;
    const y = cy + Math.sin(ang) * A * 0.46 * d;
    return `<circle class="q" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" />`;
  }).join('');
  const varredura = (r() * 90 - 45).toFixed(0);
  return `<g class="t">${aneis}${raios}</g>
    <g class="a" transform="rotate(${varredura} ${cx} ${cy})">
      <line x1="${cx}" y1="${cy}" x2="${cx + A * 0.46}" y2="${cy}" />
    </g>${marcas}`;
}

/** Malha de pontos — o mapa de E/S de um controlador. */
function malha(r: () => number): string {
  const cols = 22;
  const linhas = 12;
  const passo = 30;
  const x0 = L - cols * passo - 40;
  const y0 = (A - linhas * passo) / 2 + 14;
  let saida = '';
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < linhas; j++) {
      const aceso = r() > 0.9;
      saida += `<circle class="${aceso ? 'q' : 't'}" cx="${x0 + i * passo}" cy="${y0 + j * passo}" r="${aceso ? 5 : 2}" />`;
    }
  }
  return saida;
}

/** Degraus de sinal — leitura de sensor em malha fechada. */
function sinal(r: () => number): string {
  const linhas = 4;
  let saida = '';
  for (let k = 0; k < linhas; k++) {
    const base = A * (0.24 + k * 0.18);
    let d = `M 60 ${base}`;
    let x = 60;
    while (x < L - 40) {
      const larg = 30 + r() * 60;
      const alt = (r() > 0.5 ? -1 : 1) * (10 + r() * 34);
      d += ` H ${(x + larg).toFixed(0)} V ${(base + alt).toFixed(0)}`;
      x += larg;
    }
    saida += `<path class="${k === 1 ? 'a' : 't'}" d="${d}" fill="none" />`;
  }
  return saida;
}

/** Blocos isométricos — a linha de produção vista de cima. */
function blocos(r: () => number): string {
  let saida = '';
  for (let i = 0; i < 14; i++) {
    const x = 70 + i * 50;
    const h = 30 + r() * 150;
    const destaque = r() > 0.82;
    saida += `<path class="${destaque ? 'a' : 't'}" d="M ${x} ${A - 70} l 22 -12 l 22 12 l 0 ${-h} l -22 -12 l -22 12 z" fill="none" />`;
  }
  return saida;
}

const MOTIVOS = [radar, malha, sinal, blocos];

export type Capa = { svg: string; motivo: string };

/**
 * Gera a capa de um item ou seção.
 *
 * `destaque = true` usa sempre a varredura de radar — é o motivo que dá
 * nome ao produto, e a peça de maior exposição não deve depender de sorteio.
 */
export function gerarCapa(sementeTexto: string, destaque = false): Capa {
  const s = semente(sementeTexto);
  const r = sorteio(s);
  const i = destaque ? 0 : s % MOTIVOS.length;
  const nomes = ['radar', 'malha', 'sinal', 'blocos'];
  const corpo = MOTIVOS[i]!(r);

  return {
    motivo: nomes[i]!,
    svg: `<svg class="capa-gerada" viewBox="0 0 ${L} ${A}" role="img" aria-label="Ilustração técnica gerada" preserveAspectRatio="xMidYMid slice">
  <rect width="${L}" height="${A}" class="f" />
  ${corpo}
</svg>`,
  };
}
