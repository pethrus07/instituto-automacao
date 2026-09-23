/**
 * O AGRUPAMENTO EM ASSUNTO — e, com ele, o relógio.
 *
 * ---------------------------------------------------------------------------
 * POR QUE ISTO FOI REESCRITO (23/09/2026)
 *
 * A primeira versão montava a chave do assunto com o TÍTULO INTEIRO: tirava as
 * palavras vazias, ordenava o resto e juntava. Dois textos só caíam no mesmo
 * assunto se tivessem o CONJUNTO IDÊNTICO de palavras significativas.
 *
 * Entre idiomas diferentes isso não acontece nunca — e o efeito foi medido:
 *
 *     11/09/2026   2 assuntos de   684 tinham mais de um item
 *     23/09/2026   557 assuntos para 557 itens numa semana (exatamente 1:1)
 *     sempre       0 atrasos apurados, em qualquer banco
 *
 * Como `atraso_br_dias` só é calculado quando uma fonte brasileira cai num
 * assunto que JÁ existe com um original estrangeiro, a fonte brasileira criava
 * assunto próprio e o par que daria a medida jamais se formava. A tese do site
 * — quanto tempo o assunto leva para chegar aqui — nunca produziu um número.
 *
 * ---------------------------------------------------------------------------
 * O QUE MUDA
 *
 * Agrupar por TOKEN RARO COMPARTILHADO em vez de por título inteiro.
 *
 * A ideia é simples: o que sobrevive à tradução é o nome próprio e o código —
 * "Siemens", "NVIDIA", "Hugging Face", "61131", "RS-485". O verbo muda
 * ("acquire" → "compra"), a preposição muda, o nome não. Então dois textos
 * falam do mesmo assunto quando compartilham tokens que são raros NO CORPUS.
 *
 * Raro no corpus, e não numa lista fixa: "robot", "ai" e "automation" aparecem
 * em quase todo item de um site de automação e não distinguem nada, enquanto
 * "tractian" distingue muito. Quem decide isso é a frequência medida na base,
 * não uma lista que alguém teria de manter — e ela se ajusta sozinha conforme
 * a pauta do setor muda.
 *
 * ---------------------------------------------------------------------------
 * O QUE ISTO NÃO É
 *
 * Não é IA. Não há modelo, não há embedding, não há chamada de rede: é
 * contagem de palavra e interseção de conjunto, roda no Worker e é
 * reproduzível — o mesmo corpus dá o mesmo agrupamento, sempre. Embeddings
 * foram considerados e estão mortos no ROADMAP §9: seriam IA em produção.
 */

/**
 * Palavras que não distinguem nada em nenhum dos três idiomas que lemos.
 *
 * A lista é curta de propósito: o trabalho pesado é da frequência no corpus
 * (ver `raros`). Aqui ficam só as gramaticais, que apareceriam em toda
 * contagem e só dariam ruído à medição de raridade.
 */
const VAZIAS = new Set([
  // pt
  'a', 'ao', 'aos', 'as', 'com', 'como', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'entre',
  'na', 'nas', 'no', 'nos', 'o', 'os', 'ou', 'para', 'pela', 'pelo', 'por', 'que', 'se', 'sem',
  'seu', 'sua', 'sob', 'sobre', 'um', 'uma', 'uns', 'umas',
  // en
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has', 'have', 'how',
  'in', 'into', 'is', 'it', 'its', 'not', 'of', 'on', 'or', 'that', 'the', 'their', 'this',
  'to', 'was', 'were', 'what', 'when', 'which', 'why', 'will', 'with', 'you', 'your',
  // de
  'auf', 'aus', 'bei', 'das', 'dem', 'den', 'der', 'des', 'die', 'ein', 'eine', 'einen', 'einer',
  'fur', 'ist', 'im', 'in', 'mit', 'nach', 'sich', 'sind', 'und', 'von', 'vor', 'wie', 'zu', 'zum', 'zur',
]);

/**
 * Um título é "Title Case" quando quase toda palavra começa em maiúscula.
 *
 * Importa porque a maiúscula no meio da frase é o melhor sinal de nome
 * próprio que existe sem dicionário — mas só vale em título escrito em frase.
 * Em "Rainer Brehm Appointed President of Automation at Siemens" TUDO está em
 * maiúscula, e ali a maiúscula não diz nada.
 */
export function ehTitleCase(titulo: string): boolean {
  const palavras = titulo.split(/\s+/).filter((p) => /^[A-Za-zÀ-ÿ]{4,}$/.test(p));
  if (palavras.length < 4) return false;
  const maiusculas = palavras.filter((p) => p[0] === p[0]!.toUpperCase()).length;
  return maiusculas / palavras.length >= 0.6;
}

/**
 * Token que é IDENTIFICADOR, não palavra: "rs485", "go2rtc", "s7", "61131".
 *
 * ⚠️ Dígito puro só conta com 4 casas ou mais, e fora da faixa de ano. Sem
 * isso, "2026.9.1" viraria os tokens `2026`, `9` e `1` — e em 23/09/2026 era
 * exatamente assim que 37 threads do fórum do Home Assistant caíam todas no
 * mesmo assunto, casadas por um "9" solto. Um número de versão não é um
 * identificador de assunto.
 */
export function ehCodigo(token: string): boolean {
  const temLetra = /[a-z]/.test(token);
  const temDigito = /\d/.test(token);
  if (temLetra && temDigito) return true;
  if (!temDigito) return false;
  if (token.length < 4) return false;
  const n = Number(token);
  return !(n >= 1900 && n <= 2100); // ano não identifica assunto
}

export type Token = {
  token: string;
  /**
   * Token que carrega identidade: nome próprio ou código. É o que sobrevive à
   * tradução, e é o que separa um par de verdade de duas threads de fórum que
   * por acaso usam as mesmas palavras comuns.
   */
  forte: boolean;
};

/**
 * Os tokens de um título, com a marca de quem carrega identidade.
 *
 * Normaliza acento (para "automação" e "automacao" serem o mesmo token, e
 * para o alemão com trema casar), corta em qualquer coisa que não seja letra
 * ou dígito, e descarta o que não distingue.
 */
export function tokensDe(titulo: string): Token[] {
  const titleCase = ehTitleCase(titulo);
  const brutos = titulo.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  const vistos = new Map<string, boolean>();
  brutos.forEach((bruto, i) => {
    const t = bruto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!t) return;
    const codigo = ehCodigo(t);
    if (!codigo && t.length < 4) return; // "novo", "the", "der" não distinguem
    if (VAZIAS.has(t)) return;

    /* Maiúscula NO MEIO da frase, em título que não é Title Case: nome
       próprio. A primeira palavra não conta — toda frase começa assim. */
    const maiusculaNoMeio = i > 0 && !titleCase && bruto[0] !== bruto[0]!.toLowerCase();
    vistos.set(t, (vistos.get(t) ?? false) || codigo || maiusculaNoMeio);
  });

  return [...vistos]
    .map(([token, forte]) => ({ token, forte }))
    .sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : 0));
}

/** Só os nomes, quando o resto não importa. */
export const nomesDe = (t: readonly Token[]): string[] => t.map((x) => x.token);

/**
 * Quantos assuntos distintos um token pode tocar e ainda ser considerado raro.
 *
 * Expresso em FRAÇÃO do corpus, não em número absoluto: com 600 assuntos um
 * token em 30 deles é comum; com 60 mil, não é. Fixar "aparece em até 20
 * assuntos" envelheceria mal e silenciosamente — o agrupamento iria
 * degradando conforme a base cresce, sem nada acusar.
 *
 * ⚠️ Começou em 2% e foi medido: frouxo demais. Com 1.700 itens, 2% deixava
 * passar como "raro" qualquer palavra em até 34 itens — e aí `industria`,
 * `brasil`, `anuncia`, `investimento`, `update` e `core` entravam. Pior que o
 * ruído em si: com token comum sobrando, um item casava com A, A casava com B,
 * e o grupo virava um blob por ENCADEAMENTO. Foi o que juntou o lançamento da
 * Universal Robots na IMTS com a briga de patentes Teradyne × JAKA e fez o
 * relógio medir 17 dias onde o par verdadeiro dava 6.
 *
 * Em 0,5% o teto cai para 8 itens: `universal`(6) e `imts`(3) continuam raros,
 * `robots`(22) e `industria` passam a ser o que são — palavras comuns do ramo.
 */
export const FRACAO_COMUM = 0.005;

/** Nunca menos que isto, senão num corpus pequeno TODO token vira "comum". */
export const PISO_COMUM = 8;

/**
 * Separa os tokens raros dos comuns, dada a frequência medida no corpus.
 *
 * `df` = em quantos assuntos o token aparece. Token ausente do mapa é novo na
 * base, portanto raríssimo — e entra.
 */
export function raros(tokens: readonly Token[], df: ReadonlyMap<string, number>, totalAssuntos: number): Token[] {
  const teto = Math.max(PISO_COMUM, Math.floor(totalAssuntos * FRACAO_COMUM));
  return tokens.filter((t) => (df.get(t.token) ?? 0) <= teto);
}

/**
 * Quantos tokens raros dois títulos precisam compartilhar para serem o mesmo
 * assunto.
 *
 * DOIS, e não um. Um só casa "NVIDIA compra a Run:ai" com "NVIDIA anuncia
 * lucro recorde" — as duas são sobre a NVIDIA e não são o mesmo assunto.
 * Falso positivo aqui é pior que falso negativo: ele não deixa a medida
 * faltando, ele a deixa ERRADA, e ninguém percebe olhando o número.
 *
 * A exceção é o token muito forte: um código ou identificador raríssimo
 * ("61131", "rs485", "gr00t") sozinho já ancora, porque não existe por acaso
 * em dois assuntos diferentes.
 */
export const MINIMO_COMPARTILHADO = 2;

/** Código raríssimo ancora sozinho: "rs485" em dois textos não é coincidência. */
export const DF_ANCORA = 2;

export type Candidato = { assuntoId: string; tokensEmComum: readonly Token[] };

/**
 * Escolhe entre os candidatos, ou nenhum.
 *
 * ---------------------------------------------------------------------------
 * A REGRA, e o dia em que ela foi escrita assim
 *
 * Dois tokens raros em comum, e ao menos UM deles FORTE (nome próprio ou
 * código). A segunda metade não estava aqui no primeiro ensaio de 23/09/2026,
 * e o resultado foi medido: 37 threads do fórum do Home Assistant caíram num
 * assunto só, casadas por `after`, `update`, `working` e um `9` solto.
 *
 * Frequência sozinha não resolve isso, e vale entender por quê: neste corpus
 * `siemens` aparece em 24 itens e `update` em ~25. São igualmente raros. O
 * que os separa não é quanto aparecem — é que um é NOME e o outro é palavra.
 * Daí `forte`, medido no próprio título (maiúscula no meio da frase, ou
 * formato de código), sem dicionário e sem lista para manter.
 *
 * Pontua pela raridade somada, não pela quantidade: compartilhar "siemens" e
 * "sinamics" vale mais que compartilhar quatro palavras medianas. Empate
 * resolve pelo id, para o agrupamento ser reproduzível — a mesma base tem de
 * dar o mesmo resultado em qualquer execução, que é o mínimo para um veículo
 * que publica os próprios dados.
 */
export function melhorCandidato(
  candidatos: readonly Candidato[],
  df: ReadonlyMap<string, number>,
): Candidato | null {
  let melhor: Candidato | null = null;
  let melhorNota = 0;

  for (const c of candidatos) {
    const temForte = c.tokensEmComum.some((t) => t.forte);
    const ancora = c.tokensEmComum.some((t) => ehCodigo(t.token) && (df.get(t.token) ?? 1) <= DF_ANCORA);

    if (!ancora) {
      if (c.tokensEmComum.length < MINIMO_COMPARTILHADO) continue;
      if (!temForte) continue;
    }

    // peso do token = 1/log2(2+df): quanto mais raro, mais pesa
    const nota = c.tokensEmComum.reduce((s, t) => s + 1 / Math.log2(2 + (df.get(t.token) ?? 0)), 0);
    if (nota > melhorNota || (nota === melhorNota && melhor && c.assuntoId < melhor.assuntoId)) {
      melhor = c;
      melhorNota = nota;
    }
  }
  return melhor;
}

/**
 * Um fórum não é a fronteira publicando.
 *
 * O relógio mede quanto tempo um assunto leva da primeira publicação LÁ FORA
 * até a primeira menção em fonte brasileira. Thread de fórum e post de rede
 * social são atividade de comunidade, não evento de publicação: deixá-los
 * ancorar `publicado_original` faria o relógio medir o dia em que alguém
 * comentou, não o dia em que a coisa saiu.
 *
 * Eles continuam sendo colhidos e continuam entrando no assunto — só não
 * servem de marco. Em 23/09/2026 isso não era detalhe: o Fórum Home Assistant
 * sozinho era 297 de 557 itens da semana (53%).
 */
export function podeAncorarOriginal(tipoFonte: string): boolean {
  return tipoFonte !== 'forum' && tipoFonte !== 'social';
}
