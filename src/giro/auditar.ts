/**
 * A auditoria de números — e ela reprova.
 *
 * Na v1 existia porque um modelo escrevia o Giro. Na v2 existe porque EU
 * escrevo o Giro — e eu também erro número. A lição é de outro projeto e é
 * cara: documento com número não se revisa lendo. Revisão humana passa por
 * cima de um "37" que deveria ser "31" com facilidade constrangedora, e o
 * erro só aparece quando o leitor confere.
 *
 * O que funciona é a máquina conferir a prosa contra os dados. Aqui: cada
 * inteiro que aparece no texto tem de existir no dossiê que o originou. Se
 * não existir, o QA reprova e o deploy não sai.
 */

/**
 * Os inteiros escritos na prosa.
 *
 * Versão e norma são NOME, não quantidade: `Indústria 4.0`, `IEC 61131-3`,
 * `RS-485`. O reconhecimento é pelo FORMATO do número (ponto ou hífen entre
 * dígitos), nunca pela palavra anterior — a primeira versão olhava a palavra
 * anterior e por isso apagava `em 12`, `de 40`, `a 7`: exatamente o formato
 * em que um número inventado aparece em português.
 */
export function numerosDe(texto: string): number[] {
  const limpo = texto
    .replace(/\b\d+(?:[.,]\d+)*\s*-\s*\d+\b/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)+\b/g, ' ')
    // anos são fato de calendário, não afirmação sobre os dados
    .replace(/\b(19|20)\d{2}\b/g, ' ');

  return [...limpo.matchAll(/\b(\d+)\b/g)].map((m) => Number(m[1]));
}

export type Auditoria = {
  passou: boolean;
  usados: number[];
  inventados: number[];
};

/**
 * Confere a prosa contra o conjunto de números permitidos.
 *
 * `permitidos` é montado a partir do dossiê — deliberadamente, e não de uma
 * faixa genérica: "todo inteiro de 0 a 100 é aceitável" seria uma auditoria
 * que sempre passa, que é o mesmo que auditoria nenhuma.
 */
export function auditarNumeros(texto: string, permitidos: Iterable<number>): Auditoria {
  const ok = new Set(permitidos);
  const usados = [...new Set(numerosDe(texto))];
  const inventados = usados.filter((n) => !ok.has(n));
  return { passou: inventados.length === 0, usados, inventados };
}
