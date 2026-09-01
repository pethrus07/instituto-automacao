/**
 * As primitivas do sistema de design, em JSX.
 *
 * Nenhuma delas sabe em que núcleo está: todas leem --accent-*, que o
 * container .n-* define. É o que permite o mesmo card servir aos quatro.
 * Elas vestem design/components.css — não trazem estilo próprio.
 */
import { raw } from 'hono/html';
import { gerarCapa } from './capa';
import type { ItemRadar, Evento, Obra } from '../db';
import { NUCLEOS, ORDEM_NUCLEOS, type ChaveNucleo } from '../config';

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
    <article class="item" data-item>
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

/* ========================================================================= */
/* Agenda                                                                     */
/* ========================================================================= */

const MES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/**
 * Data só, sem fuso.
 *
 * `inicio` é uma data de calendário ('2027-03-03'), não um instante. Passar
 * pelo `new Date()` a trataria como meia-noite UTC e, no fuso do Brasil,
 * mostraria o dia anterior — feira que começa dia 3 apareceria como dia 2.
 */
function partesData(iso: string): { dia: string; mes: string; ano: string } {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return { dia: d ?? '', mes: MES_CURTO[Number(m) - 1] ?? '', ano: a ?? '' };
}

export function periodoEvento(inicio: string, fim: string | null): string {
  const i = partesData(inicio);
  if (!fim || fim.slice(0, 10) === inicio.slice(0, 10)) {
    return `${i.dia} de ${i.mes.toLowerCase()} de ${i.ano}`;
  }
  const f = partesData(fim);
  return i.mes === f.mes && i.ano === f.ano
    ? `${i.dia} a ${f.dia} de ${i.mes.toLowerCase()} de ${i.ano}`
    : `${i.dia} de ${i.mes.toLowerCase()} a ${f.dia} de ${f.mes.toLowerCase()} de ${f.ano}`;
}

const ROTULO_FORMATO: Record<string, string> = {
  presencial: 'Presencial',
  online: 'Online',
  hibrido: 'Híbrido',
};

export const EventoNaAgenda = (p: { evento: Evento }) => {
  const e = p.evento;
  const d = partesData(e.inicio);
  const local = e.pais === 'BR' ? [e.cidade, e.uf].filter(Boolean).join(' · ') : [e.cidade, e.pais].filter(Boolean).join(' · ');

  return (
    <article class={`evento ${NUCLEOS[e.nucleo].classe}`}>
      <div class="evento__data">
        <span class="evento__dia">{d.dia}</span>
        <span class="evento__mes">{d.mes}</span>
        <span class="evento__ano">{d.ano}</span>
      </div>
      <div class="evento__corpo">
        <h3 class="evento__nome">
          <a href={`/agenda/${e.slug}`}>{e.nome}</a>
        </h3>
        <p class="evento__meta">
          <span>{local || '—'}</span>
          <span>{ROTULO_FORMATO[e.formato] ?? e.formato}</span>
          {e.preco && <span>{e.preco === 'gratuito' ? 'Gratuito' : e.preco}</span>}
          <span class="selo selo--nucleo">{NUCLEOS[e.nucleo].nome}</span>
        </p>
      </div>
    </article>
  );
};

/**
 * Filtro sem JavaScript.
 *
 * Cada combinação vira URL própria — indexável, linkável, e mandável no
 * WhatsApp para o organizador da feira. É `<a>` em vez de `<form>` de
 * propósito: são poucas opções, e link já é navegável por teclado, abre em
 * nova aba e aparece no histórico.
 */
export const FiltroAgenda = (p: {
  rotulo: string;
  parametro: string;
  atual: string | undefined;
  opcoes: { valor: string; texto: string; classe?: string }[];
  base: URLSearchParams;
}) => {
  const href = (valor: string | null) => {
    const q = new URLSearchParams(p.base);
    if (valor) q.set(p.parametro, valor);
    else q.delete(p.parametro);
    const s = q.toString();
    return s ? `/agenda?${s}` : '/agenda';
  };

  return (
    <div class="filtro">
      <span class="filtro__rotulo">{p.rotulo}</span>
      <a class="pilula" href={href(null)} aria-current={!p.atual ? 'true' : undefined}>
        Todos
      </a>
      {p.opcoes.map((o) => (
        <a
          class={`pilula ${o.classe ?? ''}`}
          href={href(o.valor)}
          aria-current={p.atual === o.valor ? 'true' : undefined}
        >
          {o.texto}
        </a>
      ))}
    </div>
  );
};

/**
 * Formulário de envio de evento — o canal de entrada dos organizadores.
 *
 * HTML puro: `required`, `type="date"` e `pattern` fazem a validação de
 * primeira linha no próprio navegador, sem uma linha de JavaScript. O
 * servidor revalida tudo de qualquer jeito — validação de cliente é
 * conveniência, nunca barreira.
 */
export const FormularioEvento = () => (
  <form method="post" action="/agenda/enviar" class="u-fluxo" style="max-width: var(--measure)">
    {/* Armadilha para robô: invisível e fora da ordem de foco. */}
    <div aria-hidden="true" style="position:absolute; left:-9999px">
      <label>
        Não preencha este campo
        <input type="text" name="sitio" tabindex={-1} autocomplete="off" />
      </label>
    </div>

    <div style="display:grid; gap:var(--space-s)">
      <label style="display:grid; gap:var(--space-3xs)">
        <span style="font-size:var(--step--1); font-weight:500">Nome do evento *</span>
        <input type="text" name="nome" required maxlength={200} class="campo" />
      </label>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(9rem,1fr)); gap:var(--space-s)">
        <label style="display:grid; gap:var(--space-3xs)">
          <span style="font-size:var(--step--1); font-weight:500">Início *</span>
          <input type="date" name="inicio" required class="campo" />
        </label>
        <label style="display:grid; gap:var(--space-3xs)">
          <span style="font-size:var(--step--1); font-weight:500">Fim</span>
          <input type="date" name="fim" class="campo" />
        </label>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(9rem,1fr)); gap:var(--space-s)">
        <label style="display:grid; gap:var(--space-3xs)">
          <span style="font-size:var(--step--1); font-weight:500">Cidade</span>
          <input type="text" name="cidade" maxlength={80} class="campo" />
        </label>
        <label style="display:grid; gap:var(--space-3xs)">
          <span style="font-size:var(--step--1); font-weight:500">UF</span>
          <input type="text" name="uf" maxlength={2} class="campo" />
        </label>
        <label style="display:grid; gap:var(--space-3xs)">
          <span style="font-size:var(--step--1); font-weight:500">País</span>
          <input type="text" name="pais" maxlength={2} value="BR" class="campo" />
        </label>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(9rem,1fr)); gap:var(--space-s)">
        <label style="display:grid; gap:var(--space-3xs)">
          <span style="font-size:var(--step--1); font-weight:500">Formato</span>
          <select name="formato" class="campo">
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
            <option value="hibrido">Híbrido</option>
          </select>
        </label>
        <label style="display:grid; gap:var(--space-3xs)">
          <span style="font-size:var(--step--1); font-weight:500">Núcleo</span>
          <select name="nucleo" class="campo">
            {ORDEM_NUCLEOS.map((k) => (
              <option value={k}>{NUCLEOS[k].nome}</option>
            ))}
          </select>
        </label>
      </div>

      <label style="display:grid; gap:var(--space-3xs)">
        <span style="font-size:var(--step--1); font-weight:500">Página oficial</span>
        <input type="url" name="url" placeholder="https://" class="campo" />
      </label>

      <label style="display:grid; gap:var(--space-3xs)">
        <span style="font-size:var(--step--1); font-weight:500">Organização</span>
        <input type="text" name="organizador" maxlength={120} class="campo" />
      </label>

      <label style="display:grid; gap:var(--space-3xs)">
        <span style="font-size:var(--step--1); font-weight:500">O que é, em duas linhas</span>
        <textarea name="descricao" rows={3} maxlength={500} class="campo"></textarea>
      </label>

      <div>
        <button type="submit" class="pilula" style="cursor:pointer; font:inherit">
          Enviar para conferência
        </button>
      </div>
    </div>
  </form>
);

/* ========================================================================= */
/* Obra — o conteúdo assinado                                                 */
/* ========================================================================= */

export const ROTULO_OBRA: Record<string, string> = {
  analise: 'Análise',
  caso: 'Caso',
  panorama: 'Panorama',
  leitura: 'Leitura do Instituto',
};

/** O caminho de cada obra. A Leitura não tem página própria: vive no item. */
export function caminhoObra(o: Obra): string {
  return o.formato === 'leitura' && o.item_nucleo && o.item_slug
    ? `/${o.item_nucleo}/${o.item_slug}#leitura`
    : `/${o.formato}/${o.slug}`;
}

/**
 * A assinatura.
 *
 * É aqui que a decisão central do projeto aparece na tela: radar e agenda
 * não têm autor, obra tem. Autoridade não transfere de marca anônima para
 * pessoa — e é autoridade pessoal o objetivo do Instituto.
 *
 * A Leitura sai como voz do núcleo (`assinada = 0`): o formato é curto e o
 * parceiro não quer ser colunista.
 */
export const AssinaturaObra = (p: { obra: Obra; minutos?: number }) => {
  const o = p.obra;
  return (
    <div class="assinatura">
      <span class="assinatura__autor">{o.assinada ? o.autor : `Núcleo ${NUCLEOS[o.nucleo].nome}`}</span>
      {o.assinada && <span class="assinatura__nucleo">Núcleo {NUCLEOS[o.nucleo].nome}</span>}
      {o.publicado_em && <span class="u-dado">{dataBR(o.publicado_em, false)}</span>}
      {p.minutos && <span>{p.minutos} min de leitura</span>}
    </div>
  );
};

/** A obra numa lista — no núcleo ou no índice de Panoramas. */
export const ObraNaLista = (p: { obra: Obra }) => {
  const o = p.obra;
  return (
    <article class={`item ${NUCLEOS[o.nucleo].classe}`}>
      <div class="item__topo">
        <Kicker>{ROTULO_OBRA[o.formato] ?? o.formato}</Kicker>
        {o.assinada ? (
          <span class="u-faint" style="font-size:var(--step--2)">por {o.autor}</span>
        ) : (
          <Selo tipo="radar">voz do núcleo</Selo>
        )}
        {o.publicado_em && (
          <span class="u-dado u-faint" style="font-size:var(--step--2)">
            {dataBR(o.publicado_em, false)}
          </span>
        )}
      </div>
      <h3 class="item__titulo">
        <a href={caminhoObra(o)}>{o.titulo}</a>
      </h3>
      {o.lead && <p class="item__resumo">{o.lead}</p>}
    </article>
  );
};

/**
 * A Leitura do Instituto, dentro da página do item.
 *
 * Três a cinco linhas por cima de um item que o parceiro já ia ler de
 * qualquer jeito. Atrito quase zero — e é o suficiente para o núcleo ter
 * voz própria sem exigir que alguém vire colunista.
 */
export const LeituraNoItem = (p: { obra: Obra; html: string }) => (
  <aside
    id="leitura"
    style="margin-block-start: var(--space-xl); border-block: var(--border-mark); padding-block: var(--space-m); scroll-margin-top: var(--space-l)"
  >
    <Kicker>Leitura do Instituto</Kicker>
    <div class="obra" style="margin-block-start: var(--space-s); font-size: var(--step-0)">
      {raw(p.html)}
    </div>
  </aside>
);

/* ========================================================================= */
/* O veredito, o destaque e os números — o mapa das referências aplicado      */
/* ========================================================================= */

/**
 * O veredito do "o que isso muda aqui".
 *
 * Categoria fechada, pública e auditável — a lição do Aos Fatos, que resolveu
 * melhor que o Semafor: o rótulo não é literário, é um conjunto finito com
 * critério publicado.
 *
 * `nao_chega` é exatamente o que o atraso mede. `sem_efeito` é a opção
 * honesta, e ela é obrigatória: sem ela o parágrafo vira enchimento, porque
 * o modelo sempre encontra alguma consequência quando é obrigado a encontrar.
 */
export const ROTULO_VEREDITO: Record<string, string> = {
  chega: 'Chega aqui',
  a_caminho: 'A caminho',
  nao_chega: 'Não chega',
  sem_efeito: 'Sem efeito aqui',
};

export const Veredito = (p: { valor: string | null }) =>
  p.valor && ROTULO_VEREDITO[p.valor] ? (
    <span class={`veredito v-${p.valor}`}>{ROTULO_VEREDITO[p.valor]}</span>
  ) : null;

/**
 * A manchete que manda (Manufacturing Dive) com o peso virando tamanho
 * (Rest of World).
 *
 * Sem imagem licenciada, a capa é o próprio bloco tipográfico. Não é
 * remendo: é o MESMO desenho que vira a OG image gerada, então uma decisão
 * serve aos dois lugares e o layout nunca fica com buraco.
 */
export const Destaque = (p: { item: ItemRadar }) => {
  const i = p.item;
  const n = NUCLEOS[i.nucleo];
  const traduzido = i.modo === 'traducao';
  const pendente = traduzido && i.revisado_humano === 0;

  return (
    <article class={`destaque ${n.classe}`} data-item>
      <div class="moldura-capa">{raw(gerarCapa(i.slug ?? i.id, true).svg)}</div>
      <div style="display:grid; gap:var(--space-s); align-content:start">
        <div class="item__topo">
          <Kicker ponto>{n.nome}</Kicker>
          <Relogio minutos={i.minutos_apos_fonte} />
          {pendente && <Selo tipo="pendente">Revisão pendente</Selo>}
        </div>
        <h2 class="destaque__titulo">
          <a href={`/${i.nucleo}/${i.slug}`}>{i.titulo}</a>
        </h2>
        {i.resumo && <p class="destaque__lead">{i.resumo}</p>}

        {/* O "o que isso muda aqui" na manchete. Ele é a camada que justifica
            o site existir — sumir dela na peça de maior exposição foi
            regressão, e o QA pegou. */}
        {i.contexto_br && (
          <div class="item__contexto" style="max-width: var(--measure)">
            {i.contexto_veredito && (
              <p style="margin-block-end: var(--space-3xs)">
                <Veredito valor={i.contexto_veredito} />
              </p>
            )}
            {i.contexto_br}
          </div>
        )}

        <p class="destaque__pe">
          <span class="item__fonte">
            <a href={i.url} rel="nofollow noopener" target="_blank">
              {i.fonte_nome}
            </a>
          </span>
          <span>·</span>
          <span>{dataBR(i.publicado_fonte, false)}</span>
          <span>·</span>
          <Selo tipo="original">{i.idioma_origem.toUpperCase()}</Selo>
        </p>
      </div>
    </article>
  );
};

/**
 * Um número da capa.
 *
 * Our World in Data: o rótulo é uma frase, não uma etiqueta. Número sem
 * pergunta não informa ninguém — é o erro clássico de painel.
 */
export const Numero = (p: { valor: number | string; rotulo: string; href?: string }) => (
  <div>
    <div class="numero__valor">{p.valor}</div>
    <div class="numero__rotulo">{p.href ? <a href={p.href}>{p.rotulo}</a> : p.rotulo}</div>
  </div>
);


/* ========================================================================= */
/* Os três níveis do radar                                                    */
/* ========================================================================= */

/**
 * Nível 2 · a secundária.
 *
 * Capa menor, título médio, sem resumo. O peso editorial vira tamanho — é o
 * recurso do Rest of World, e é o que permite densidade sem poluição.
 */
export const ItemSecundario = (p: { item: ItemRadar }) => {
  const i = p.item;
  const pendente = i.modo === 'traducao' && i.revisado_humano === 0;
  return (
    <article class="sec" data-item>
      <div class="moldura-capa">{raw(gerarCapa(i.slug ?? i.id).svg)}</div>
      <div class="sec__pe">
        <Kicker ponto>{NUCLEOS[i.nucleo].nome}</Kicker>
        <Veredito valor={i.contexto_veredito} />
        {pendente && <Selo tipo="pendente">Revisão pendente</Selo>}
      </div>
      <h3 class="sec__titulo">
        <a href={`/${i.nucleo}/${i.slug}`}>{i.titulo}</a>
      </h3>
      <p class="sec__pe">
        <Relogio minutos={i.minutos_apos_fonte} />
        {/* Crédito com link em TODA peça, não só na página do item: é
            obrigação com a fonte, não decoração de rodapé. */}
        <span class="item__fonte">
          <a href={i.url} rel="nofollow noopener" target="_blank">
            {i.fonte_nome}
          </a>
        </span>
      </p>
    </article>
  );
};

/**
 * Nível 3 · a linha.
 *
 * Hora, título, fonte. Quem varre radar procura título e hora, não card —
 * Techmeme e Hacker News são feios de propósito e usados todo dia por quem
 * trabalha com aquilo.
 */
export const ItemLinha = (p: { item: ItemRadar }) => {
  const i = p.item;
  const frio = (i.minutos_apos_fonte ?? 0) >= 60 * 24;
  return (
    <article class="linha-item" data-item>
      <span class={frio ? 'linha-item__hora linha-item__hora--frio' : 'linha-item__hora'}>
        {i.minutos_apos_fonte != null ? humanizarMinutos(i.minutos_apos_fonte) : '—'}
      </span>
      <h3 class="linha-item__titulo">
        <a href={`/${i.nucleo}/${i.slug}`}>{i.titulo}</a>
      </h3>
      <span class="linha-item__fonte item__fonte">
        {i.idioma_origem.toUpperCase()} ·{' '}
        <a href={i.url} rel="nofollow noopener" target="_blank">
          {i.fonte_nome}
        </a>
      </span>
    </article>
  );
};

/** O card de núcleo da capa. Quente pesa mais que Radar — e parece. */
export const CardNucleo = (p: { chave: ChaveNucleo; total: number; ultimo: string | null }) => {
  const n = NUCLEOS[p.chave];
  return (
    <article class={`nucleo-card ${n.quente ? 'nucleo-card--quente' : 'nucleo-card--frio'}`}>
      <div class="moldura-capa" style={n.quente ? 'aspect-ratio: 16/9' : 'aspect-ratio: 21/9'}>
        {raw(gerarCapa(`nucleo-${p.chave}`).svg)}
      </div>
      <div class="sec__pe" style="margin-block-start: var(--space-2xs)">
        <Kicker ponto>{n.nome}</Kicker>
        {!n.quente && <Selo tipo="radar">Radar</Selo>}
      </div>
      <h3 class="nucleo-card__nome">
        <a href={`/${p.chave}`}>{n.resumo}</a>
      </h3>
      <p class="nucleo-card__pe">
        {p.total} publicado{p.total === 1 ? '' : 's'}
        {p.ultimo ? ` · último em ${dataBR(p.ultimo, false)}` : ''}
      </p>
    </article>
  );
};


/**
 * Paginação sem JavaScript, com URL própria por página.
 *
 * Rolagem infinita seria mais fácil e pior: a página 3 deixaria de ter
 * endereço, ninguém conseguiria marcá-la nem mandá-la no WhatsApp, e o
 * rodapé ficaria inalcançável para quem quer chegar nele.
 */
export const Paginacao = (p: {
  base: string;
  busca: URLSearchParams;
  pagina: number;
  porPagina: number;
  total: number;
}) => {
  const ultima = Math.max(1, Math.ceil(p.total / p.porPagina));
  if (ultima <= 1) return null;

  const href = (n: number) => {
    const q = new URLSearchParams(p.busca);
    if (n > 1) q.set('p', String(n));
    else q.delete('p');
    const t = q.toString();
    return t ? `${p.base}?${t}` : p.base;
  };

  const de = (p.pagina - 1) * p.porPagina + 1;
  const ate = Math.min(p.pagina * p.porPagina, p.total);

  return (
    <nav class="paginacao" aria-label="Paginação">
      <span class="paginacao__onde">
        {de}–{ate} de {p.total} · página {p.pagina} de {ultima}
      </span>
      <span class="paginacao__botoes">
        {p.pagina > 1 ? (
          <a href={href(p.pagina - 1)} rel="prev">
            ← Anteriores
          </a>
        ) : (
          <span aria-disabled="true">← Anteriores</span>
        )}
        {p.pagina < ultima ? (
          <a href={href(p.pagina + 1)} rel="next">
            Mais antigas →
          </a>
        ) : (
          <span aria-disabled="true">Mais antigas →</span>
        )}
      </span>
    </nav>
  );
};
