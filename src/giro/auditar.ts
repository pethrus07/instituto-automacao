/**
 * A auditoria do Giro — e ela ABORTA.
 *
 * Vem de uma lição cara de outro projeto: documento com número gerado por
 * modelo não se revisa lendo. Revisão humana passa por cima de um "37" que
 * deveria ser "31" com uma facilidade constrangedora, e o erro só aparece
 * quando o cliente confere. O que funciona é a máquina conferir a prosa
 * contra os dados, e o processo PARAR quando não bate.
 *
 * Aqui a parada tem forma concreta: o giro fica em `rascunho` com o motivo
 * gravado, e não vai ao ar. Ninguém precisa acordar para impedir — precisa
 * acordar para consertar, que é diferente e é o lado certo.
 *
 * O que se confere:
 *   1. TODO número da prosa existe no agregado
 *   2. os quatro núcleos estão presentes, nenhum inventado
 *   3. só há texto de destaque quando há destaque
 *   4. nada de URL, marcação ou promessa que o site não cumpre
 *   5. tamanhos plausíveis — texto vazio também é falha
 */
import { ORDEM_NUCLEOS } from '../config.ts';
import type { Semana } from './agregar';
import type { Redacao } from './redigir';

export type Auditoria = {
  passou: boolean;
  conferidas: number;
  falhas: string[];
  /** os números que a prosa usou, para ficar registrado no que saiu */
  numeros: number[];
};

/**
 * Os números que a prosa PODE usar.
 *
 * Deliberadamente montado a partir do agregado, e não de uma faixa genérica:
 * "todo inteiro de 0 a 100 é aceitável" seria uma auditoria que sempre passa,
 * que é o mesmo que auditoria nenhuma.
 */
function permitidos(s: Semana): Set<number> {
  const p = new Set<number>();
  const por = (n: number | null | undefined) => {
    if (typeof n === 'number' && Number.isFinite(n)) p.add(n);
  };

  por(s.totais.itens);
  por(s.totais.publicados);
  por(s.totais.assuntos);
  por(s.totais.fontes);
  por(s.totais.vozes);

  por(s.relogio.medidos);
  por(s.relogio.medianaDias);
  por(s.relogio.naoChegaram);
  for (const e of s.relogio.exemplos) por(e.dias);

  for (const n of s.porNucleo) {
    por(n.itens);
    por(n.publicados);
  }
  for (const c of s.placar) {
    por(c.fontes);
    por(c.atraso_br_dias);
    por(c.pontos);
  }
  por(s.sozinhos);
  por(s.vozes.length);
  por(s.agenda.length);
  por(s.porNucleo.filter((n) => n.itens > 0).length);

  /* Datas do período são fato, não afirmação: o ano e os dias do rótulo
     podem aparecer no texto sem que isso seja um número inventado. */
  const ini = new Date(s.janela.inicio);
  const fim = new Date(s.janela.fim);
  por(ini.getUTCFullYear());
  por(fim.getUTCFullYear());
  for (let d = new Date(ini); d < fim; d.setUTCDate(d.getUTCDate() + 1)) por(d.getUTCDate());

  return p;
}

/** Números escritos na prosa. Ignora o que faz parte de um nome próprio. */
function numerosDe(texto: string): number[] {
  /* `Indústria 4.0`, `IEC 61131-3`, `RS-485`: versão e norma são NOME, não
     quantidade, e derrubar toda edição que cite uma norma seria absurdo.
     Mas o reconhecimento é pelo FORMATO do número — ponto ou hífen entre
     dígitos — e nunca pela palavra anterior.

     ⚠️ A primeira versão olhava a palavra anterior, e por isso apagava
     `em 12`, `de 40`, `a 7`: exatamente o formato em que um número inventado
     apareceria numa frase em português. Auditoria com esse buraco é pior que
     auditoria nenhuma, porque parece auditoria. */
  const limpo = texto
    .replace(/\b\d+(?:[.,]\d+)*\s*-\s*\d+\b/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)+\b/g, ' ');

  return [...limpo.matchAll(/\b(\d+)\b/g)].map((m) => Number(m[1]));
}

export function auditar(s: Semana, r: Redacao): Auditoria {
  const falhas: string[] = [];
  let conferidas = 0;
  const ok = (nome: string, condicao: boolean) => {
    conferidas++;
    if (!condicao) falhas.push(nome);
  };

  const prosa = [r.titulo, r.lead, r.destaque_texto, ...r.nucleos.map((n) => n.frase)].join('\n');

  /* 1 · números */
  const validos = permitidos(s);
  const usados = numerosDe(prosa);
  const inventados = [...new Set(usados.filter((n) => !validos.has(n)))];
  ok(
    inventados.length
      ? `números que não existem no agregado: ${inventados.join(', ')}`
      : 'todo número da prosa existe no agregado',
    inventados.length === 0,
  );

  /* 2 · núcleos */
  const vistos = r.nucleos.map((n) => n.nucleo);
  ok(
    'os quatro núcleos aparecem, uma vez cada',
    vistos.length === ORDEM_NUCLEOS.length &&
      ORDEM_NUCLEOS.every((n) => vistos.filter((v) => v === n).length === 1),
  );
  ok(
    'nenhum núcleo inventado',
    vistos.every((v) => (ORDEM_NUCLEOS as readonly string[]).includes(v)),
  );

  /* 3 · o destaque não pode existir só no texto */
  if (!s.destaque) {
    ok(
      'sem destaque no agregado, o texto não afirma um',
      !/destaque da semana foi|o destaque foi|a notícia da semana foi/i.test(r.destaque_texto),
    );
  } else {
    ok('com destaque no agregado, o texto fala dele', r.destaque_texto.trim().length > 40);
  }

  /* 4 · nada de link ou marcação — o site é que resolve navegação */
  ok('sem URL na prosa', !/https?:\/\/|www\./i.test(prosa));
  ok('sem marcação markdown', !/[*_`#]{2,}|\[[^\]]+\]\(/.test(prosa));

  /* 5 · tamanhos plausíveis */
  ok('título com 3 a 90 caracteres', r.titulo.trim().length >= 3 && r.titulo.length <= 90);
  ok('lead entre 60 e 700 caracteres', r.lead.trim().length >= 60 && r.lead.length <= 700);
  ok(
    'parágrafo do destaque entre 60 e 1400 caracteres',
    r.destaque_texto.trim().length >= 60 && r.destaque_texto.length <= 1400,
  );
  ok(
    'nenhuma frase de núcleo vazia',
    r.nucleos.every((n) => n.frase.trim().length >= 10),
  );

  /* 6 · núcleo sem item não pode ganhar movimento na prosa */
  for (const n of s.porNucleo) {
    if (n.itens > 0) continue;
    const frase = r.nucleos.find((x) => x.nucleo === n.nucleo)?.frase ?? '';
    ok(
      `${n.nucleo} sem item na semana não recebe atividade inventada`,
      /nenhum|sem item|sem movimento|não houve|nada/i.test(frase),
    );
  }

  return { passou: falhas.length === 0, conferidas, falhas, numeros: [...new Set(usados)] };
}
