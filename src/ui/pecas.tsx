/**
 * As primitivas do sistema de design, em JSX.
 *
 * Nenhuma delas sabe em que núcleo está: todas leem --accent-*, que o
 * container .n-* define. É o que permite o mesmo card servir aos quatro.
 * Elas vestem design/components.css — não trazem estilo próprio.
 */
import type { ItemRadar } from '../db';
import { NUCLEOS, type ChaveNucleo } from '../config';

/** ---------------------------------------------------------------- Kicker */
export const Kicker = (p: { children: string; ponto?: boolean }) => (
  <span class={p.ponto ? 'kicker kicker--dot' : 'kicker'}>{p.children}</span>
);

/** ---------------------------------------------------------------- Selo */
export const Selo = (p: { tipo: string; children: string }) => (
  <span class={`selo selo--${p.tipo}`}>{p.children}</span>
);

/** --------------------------------------------------------------- Relógio
 * A assinatura visual do projeto: explica o produto sem uma linha de texto
 * institucional. Passadas 24 h o argumento "primeira mão" não vale mais e o
 * destaque some sozinho — daí o modo frio.
 */
export function humanizarMinutos(min: number): string {
  if (min < 60) return `${min} min`;
  if (min < 60 * 24) return `${Math.round(min / 60)} h`;
  const dias = Math.round(min / (60 * 24));
  return dias === 1 ? '1 dia' : `${dias} dias`;
}

export const Relogio = (p: { minutos: number | null }) => {
  if (p.minutos == null) return null;
  const frio = p.minutos >= 60 * 24;
  return (
    <span class={frio ? 'relogio relogio--frio' : 'relogio'}>
      <span class="relogio__ponto"></span>
      <span class="relogio__valor">{humanizarMinutos(p.minutos)}</span> após a fonte
    </span>
  );
};

/** ------------------------------------------------------------- Data em PT */
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Guardamos UTC; mostramos São Paulo. Nunca o contrário. */
export function dataBR(iso: string | null, comHora = true): string {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return '';
  const p = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'numeric',
    year: 'numeric',
    ...(comHora ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).formatToParts(d);
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  const mes = MESES[Number(v('month')) - 1] ?? '';
  const base = `${v('day')} ${mes} ${v('year')}`;
  return comHora ? `${base}, ${v('hour')}:${v('minute')}` : base;
}

/** --------------------------------------------------------- Item do radar
 * Sem caixa e sem sombra: fio embaixo e espaço. Lista longa de cards
 * fechados vira parede, e o radar é para varrer com o olho.
 */
export const ItemDoRadar = (p: { item: ItemRadar; comContexto?: boolean }) => {
  const i = p.item;
  const nucleo = NUCLEOS[i.nucleo];
  const traduzido = i.modo === 'traducao';
  const pendente = traduzido && i.revisado_humano === 0;

  return (
    <article class="item">
      <div class="item__topo">
        <Kicker ponto>{nucleo.nome}</Kicker>
        <Relogio minutos={i.minutos_apos_fonte} />
        {traduzido && <Selo tipo="traducao">Tradução integral</Selo>}
        {pendente && <Selo tipo="pendente">Revisão pendente</Selo>}
      </div>

      <h3 class="item__titulo">
        <a href={`/${i.nucleo}/${i.slug}`}>{i.titulo}</a>
      </h3>

      {(i.resumo || i.corpo) && (
        <p class="item__resumo">{i.resumo ?? primeiroParagrafo(i.corpo!)}</p>
      )}

      {p.comContexto && i.contexto_br && <p class="item__contexto">{i.contexto_br}</p>}

      <p class="item__pe">
        <span class="item__fonte">
          <a href={i.url} rel="nofollow noopener" target="_blank">
            {i.fonte_nome}
          </a>
        </span>
        <span>·</span>
        <span>{dataBR(i.publicado_fonte)}</span>
        <span>·</span>
        <Selo tipo="original">{i.idioma_origem.toUpperCase()}</Selo>
        {i.atraso_br_dias != null && (
          <>
            <span>·</span>
            <span>chegou ao Brasil {i.atraso_br_dias} dias depois</span>
          </>
        )}
      </p>
    </article>
  );
};

function primeiroParagrafo(corpo: string): string {
  const p = corpo.split(/\n{2,}/)[0] ?? corpo;
  return p.length > 320 ? p.slice(0, 317).trimEnd() + '…' : p;
}

/** ---------------------------------------------------- Cabeçalho de seção */
export const Secao = (p: { titulo: string; acao?: { texto: string; href: string } }) => (
  <div class="secao">
    <span class="secao__titulo">{p.titulo}</span>
    {p.acao && (
      <span class="secao__acao">
        <a href={p.acao.href}>{p.acao.texto}</a>
      </span>
    )}
  </div>
);

/** ------------------------------------------------------------- Aviso */
export const Aviso = (p: { children: unknown }) => <div class="aviso">{p.children}</div>;

/** ------------------------------------------------- Selo de núcleo em radar
 * O site declara quando uma seção é só agregação. É a diferença entre
 * "seção abandonada" e "seção que promete o que entrega".
 */
export const EmRadar = (p: { nucleo: ChaveNucleo }) => (
  <Aviso>
    <strong>{NUCLEOS[p.nucleo].nome} está em modo Radar.</strong> Por enquanto esta seção só
    agrega e traduz o que sai lá fora — sem análise própria. Quando ganhar voz, ela ganha cor.
  </Aviso>
);
