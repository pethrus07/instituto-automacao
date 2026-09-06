/**
 * As primitivas do sistema de design, em JSX.
 *
 * Elas vestem design/components.css — não trazem estilo próprio. E nenhuma
 * sabe de banco: recebem a peça pronta e desenham.
 */
import { raw } from 'hono/html';
import { gerarCapa } from './capa';
import type { Evento } from '../db';
import { ORDEM_TEMAS, TEMAS, type Tema } from '../config';
import {
  arte as arteDe,
  caminho,
  ROTULO_FORMATO,
  ROTULO_SECAO,
  ROTULO_TEMA,
  type Peca,
} from '../conteudo';
import { ROTULO_LICENCA } from '../conteudo/tipos';

/* ================================================================== texto */

export const Kicker = (p: { children: unknown; ponto?: boolean }) => (
  <span class={p.ponto ? 'kicker kicker--dot' : 'kicker'}>{p.children}</span>
);

export const Selo = (p: { tipo: string; children: unknown }) => (
  <span class={`selo selo--${p.tipo}`}>{p.children}</span>
);

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/**
 * Data de peça: `2026-09-03` → `3 de setembro de 2026`.
 *
 * É data de calendário, não instante: não passa por fuso. Passar por
 * `new Date()` e formatar em São Paulo mostraria o dia anterior — feira
 * marcada para dia 3 apareceria como dia 2.
 */
export function dataPeca(data: string, longa = true): string {
  const [a, m, d] = data.slice(0, 10).split('-').map(Number);
  if (!a || !m || !d) return data;
  return longa ? `${d} de ${MESES_LONGOS[m - 1]} de ${a}` : `${d} ${MESES[m - 1]} ${a}`;
}

/** Instante guardado em UTC, mostrado em São Paulo. */
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

export const Secao = (p: { titulo: string; acao?: { texto: string; href: string } }) => (
  <div class="secao">
    {/* h2 de verdade: o rótulo de seção É o título do bloco, e a hierarquia
        h1 → h2 → h3 é o que leitor de tela e buscador seguem. O visual vem da classe. */}
    <h2 class="secao__titulo">{p.titulo}</h2>
    {p.acao && (
      <span class="secao__acao">
        <a href={p.acao.href}>{p.acao.texto}</a>
      </span>
    )}
  </div>
);

export const Aviso = (p: { children: unknown }) => <div class="aviso">{p.children}</div>;

/**
 * O estado vazio que não parece abandono.
 *
 * Um site que publica pouco tem de dizer o que está vindo, não mostrar um
 * espaço em branco. O bloco tem o mesmo peso visual de uma peça — porque a
 * promessa honesta É conteúdo.
 */
export const Vazio = (p: { titulo: string; children: unknown }) => (
  <div class="vazio">
    <p class="vazio__titulo">{p.titulo}</p>
    <p class="vazio__texto">{p.children}</p>
  </div>
);

/* ================================================================ veredito */

/**
 * Categoria fechada, pública e auditável — a lição do Aos Fatos: o rótulo
 * não é literário, é um conjunto finito com critério publicado.
 */
export const ROTULO_VEREDITO: Record<string, string> = {
  chega: 'Chega aqui',
  a_caminho: 'A caminho',
  nao_chega: 'Não chega',
  sem_efeito: 'Sem efeito aqui',
};

export const EXPLICA_VEREDITO: Record<string, string> = {
  chega: 'já tem representação, distribuição ou efeito prático no Brasil',
  a_caminho: 'vai chegar, mas depende de representante, homologação ou preço',
  nao_chega: 'não tem caminho para o Brasil no horizonte visível',
  sem_efeito: 'não muda nada para quem opera aqui — e dizer isso é parte do trabalho',
};

export const Veredito = (p: { valor: string | null | undefined }) =>
  p.valor && ROTULO_VEREDITO[p.valor] ? (
    <span class={`veredito v-${p.valor}`}>{ROTULO_VEREDITO[p.valor]}</span>
  ) : null;

/* =================================================================== arte */

/**
 * A arte da peça. Desenhada quando existe; gerada quando não.
 *
 * O gerador é o fallback honesto: mantém o vocabulário (varredura, malha,
 * sinal) para a página nunca ficar com buraco, e a arte desenhada entra
 * onde há gente para desenhá-la — que é o que 3 peças por semana permitem.
 */
export const Arte = (p: { peca: Peca; classe?: string; destaque?: boolean; comCredito?: boolean }) => {
  const im = p.peca.imagem;
  if (im) {
    /* Imagem real: só entra com crédito e licença, e o crédito vai na tela —
       não em atributo que ninguém lê. É a regra do texto valendo para a
       imagem: a licença governa, e quem deu a licença aparece. */
    return (
      <figure class={`arte arte--foto ${p.classe ?? ''}`} data-arte="foto" data-licenca={im.licenca}>
        <img src={`/imagens/${im.arquivo}`} alt={im.alt} loading={p.destaque ? 'eager' : 'lazy'} decoding="async" />
        {p.comCredito !== false && (
          <figcaption class="arte__credito">
            Imagem: {im.credito} · {ROTULO_LICENCA[im.licenca]}
          </figcaption>
        )}
      </figure>
    );
  }
  const svg = arteDe(p.peca.arte);
  return (
    <div class={`arte ${svg ? 'arte--desenhada' : 'arte--gerada'} ${p.classe ?? ''}`} data-arte={svg ? 'desenhada' : 'gerada'}>
      {raw(svg ?? gerarCapa(p.peca.slug, p.destaque).svg)}
    </div>
  );
};

/* =================================================================== peça */

/** Seção · tema, e o veredito quando houver. É a linha de etiquetas de toda peça. */
export const Etiquetas = (p: { peca: Peca; comVeredito?: boolean }) => (
  <div class="etiquetas">
    <Kicker ponto>
      {ROTULO_FORMATO[p.peca.formato]} · {ROTULO_TEMA[p.peca.tema]}
    </Kicker>
    {p.comVeredito !== false && <Veredito valor={p.peca.veredito} />}
  </div>
);

/** Autor, data, leitura, fonte — a linha que separa peça de agregação. */
export const AssinaturaPeca = (p: { peca: Peca; completa?: boolean }) => {
  const q = p.peca;
  const minutos = Math.max(1, Math.round(q.palavras / 200));
  return (
    <div class="assinatura">
      <span class="assinatura__autor">{q.autor}</span>
      <span class="u-dado">{dataPeca(q.data, false)}</span>
      {p.completa && <span>{minutos} min de leitura</span>}
      {q.fonte && (
        <span class="assinatura__fonte">
          a partir de{' '}
          <a href={q.fonte.url} rel="nofollow noopener" target="_blank">
            {q.fonte.nome}
          </a>
          <Selo tipo="original">{q.fonte.idioma.toUpperCase()}</Selo>
        </span>
      )}
    </div>
  );
};

/**
 * A peça que abre a capa.
 *
 * Uma manchete manda (Rest of World), e o peso vira tamanho: arte grande,
 * título grande, e o resto com espaço. É a primeira coisa que o site diz —
 * e com 3 peças por semana, é a única que precisa gritar.
 */
export const PecaDestaque = (p: { peca: Peca; principal?: boolean }) => {
  const q = p.peca;
  /* Na capa o destaque E o h1 da pagina. Dentro de uma secao, que ja tem o
     seu h1, ele desce um nivel — pagina com dois h1 e leitor de tela perdido. */
  const Titulo = p.principal ? 'h1' : 'h2';
  return (
    <article class="destaque" data-peca={q.slug}>
      <a href={caminho(q)} class="destaque__arte" aria-hidden="true" tabindex={-1}>
        <Arte peca={q} destaque />
      </a>
      <div class="destaque__texto">
        <Etiquetas peca={q} />
        <Titulo class="destaque__titulo">
          <a href={caminho(q)}>{q.titulo}</a>
        </Titulo>
        <p class="destaque__lead">{q.lead}</p>
        <AssinaturaPeca peca={q} />
      </div>
    </article>
  );
};

/** A peça em grade: arte, etiqueta, título, lead curto, assinatura. */
export const PecaCard = (p: { peca: Peca }) => {
  const q = p.peca;
  return (
    <article class="card" data-peca={q.slug}>
      <a href={caminho(q)} class="card__arte" aria-hidden="true" tabindex={-1}>
        <Arte peca={q} />
      </a>
      <div class="card__texto">
        <Etiquetas peca={q} />
        <h3 class="card__titulo">
          <a href={caminho(q)}>{q.titulo}</a>
        </h3>
        <p class="card__lead">{q.lead}</p>
        <p class="card__pe">
          <span>{q.autor}</span>
          <span class="u-dado">{dataPeca(q.data, false)}</span>
          {q.fonte && <span class="u-faint">a partir de {q.fonte.nome}</span>}
        </p>
      </div>
    </article>
  );
};

/** A peça em linha — para listas longas dentro de uma seção. */
export const PecaLinha = (p: { peca: Peca }) => {
  const q = p.peca;
  return (
    <article class="linha" data-peca={q.slug}>
      <span class="linha__data u-dado">{dataPeca(q.data, false)}</span>
      <div>
        <h3 class="linha__titulo">
          <a href={caminho(q)}>{q.titulo}</a>
        </h3>
        <p class="linha__pe">
          {ROTULO_FORMATO[q.formato]} · {ROTULO_TEMA[q.tema]}
          {q.fonte && <> · a partir de {q.fonte.nome}</>}
        </p>
      </div>
      <Veredito valor={q.veredito} />
    </article>
  );
};

/**
 * A caixa da fonte, na página da peça.
 *
 * Crédito com link não é rodapé — é obrigação com quem publicou primeiro, e
 * é a prova de que o que está acima é leitura nossa de um texto deles.
 */
export const FonteCaixa = (p: { peca: Peca }) => {
  const f = p.peca.fonte;
  if (!f) return null;
  return (
    <aside class="fonte-caixa">
      <span class="fonte-caixa__rotulo">A fonte</span>
      <p class="fonte-caixa__nome">
        <a href={f.url} rel="nofollow noopener" target="_blank">
          {f.nome}
        </a>
        <Selo tipo="original">{f.idioma.toUpperCase()}</Selo>
      </p>
      <p class="fonte-caixa__texto">
        {f.publicado ? <>Publicado em {dataPeca(f.publicado)}. </> : null}
        O texto acima é leitura e redação do Instituto a partir desta publicação. O original
        está lá, inteiro — e vale a leitura.
      </p>
    </aside>
  );
};

/** O veredito com o critério, na página da notícia. */
export const VereditoCaixa = (p: { valor: string | undefined }) =>
  p.valor && ROTULO_VEREDITO[p.valor] ? (
    <aside class="veredito-caixa">
      <span class="fonte-caixa__rotulo">O que isso muda aqui</span>
      <p>
        <Veredito valor={p.valor} />
      </p>
      <p class="fonte-caixa__texto">
        {EXPLICA_VEREDITO[p.valor]}. Categoria fechada, com critério{' '}
        <a href="/blueprints#veredito">publicado</a>.
      </p>
    </aside>
  ) : null;

/* ================================================================ números */

/** Our World in Data: o rótulo é uma frase, não uma etiqueta. */
export const Numero = (p: { valor: number | string; rotulo: string; href?: string }) => (
  <div class="numero">
    <div class="numero__valor">{p.valor}</div>
    <div class="numero__rotulo">{p.href ? <a href={p.href}>{p.rotulo}</a> : p.rotulo}</div>
  </div>
);

/* ================================================================= agenda */

const MES_CURTO = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

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

const ROTULO_FORMATO_EVENTO: Record<string, string> = {
  presencial: 'Presencial',
  online: 'Online',
  hibrido: 'Híbrido',
};

/** O nome do tema, tolerando valor antigo no banco. */
export function nomeTema(v: string): string {
  return (TEMAS as Record<string, { nome: string }>)[v]?.nome ?? 'Automação';
}

export const EventoNaAgenda = (p: { evento: Evento; nivel?: 'h2' | 'h3' }) => {
  const e = p.evento;
  /* na agenda o evento vem logo abaixo do h1 da página (h2); na capa, abaixo do bloco "Agenda" (h3) */
  const Titulo = p.nivel ?? 'h3';
  const d = partesData(e.inicio);
  const local =
    e.pais === 'BR'
      ? [e.cidade, e.uf].filter(Boolean).join(' · ')
      : [e.cidade, e.pais].filter(Boolean).join(' · ');

  return (
    <article class="evento">
      <div class="evento__data">
        <span class="evento__dia">{d.dia}</span>
        <span class="evento__mes">{d.mes}</span>
        <span class="evento__ano">{d.ano}</span>
      </div>
      <div class="evento__corpo">
        <Titulo class="evento__nome">
          <a href={`/agenda/${e.slug}`}>{e.nome}</a>
        </Titulo>
        <p class="evento__meta">
          <span>{local || '—'}</span>
          <span>{ROTULO_FORMATO_EVENTO[e.formato] ?? e.formato}</span>
          {e.preco && <span>{e.preco === 'gratuito' ? 'Gratuito' : e.preco}</span>}
          <span class="selo selo--tema">{nomeTema(e.nucleo)}</span>
        </p>
      </div>
    </article>
  );
};

/**
 * Filtro sem JavaScript: cada combinação vira URL própria — indexável,
 * linkável, e mandável no WhatsApp para o organizador da feira.
 */
export const FiltroAgenda = (p: {
  rotulo: string;
  parametro: string;
  atual: string | undefined;
  opcoes: { valor: string; texto: string }[];
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
        <a class="pilula" href={href(o.valor)} aria-current={p.atual === o.valor ? 'true' : undefined}>
          {o.texto}
        </a>
      ))}
    </div>
  );
};

/** O formulário de envio: HTML puro, e o servidor revalida tudo. */
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
      <label class="campo-rotulo">
        <span>Nome do evento *</span>
        <input type="text" name="nome" required maxlength={200} class="campo" />
      </label>

      <div class="campo-grade">
        <label class="campo-rotulo">
          <span>Início *</span>
          <input type="date" name="inicio" required class="campo" />
        </label>
        <label class="campo-rotulo">
          <span>Fim</span>
          <input type="date" name="fim" class="campo" />
        </label>
      </div>

      <div class="campo-grade">
        <label class="campo-rotulo">
          <span>Cidade</span>
          <input type="text" name="cidade" maxlength={80} class="campo" />
        </label>
        <label class="campo-rotulo">
          <span>UF</span>
          <input type="text" name="uf" maxlength={2} class="campo" />
        </label>
        <label class="campo-rotulo">
          <span>País</span>
          <input type="text" name="pais" maxlength={2} value="BR" class="campo" />
        </label>
      </div>

      <div class="campo-grade">
        <label class="campo-rotulo">
          <span>Formato</span>
          <select name="formato" class="campo">
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
            <option value="hibrido">Híbrido</option>
          </select>
        </label>
        <label class="campo-rotulo">
          <span>Tema</span>
          <select name="tema" class="campo">
            {ORDEM_TEMAS.map((k: Tema) => (
              <option value={k}>{TEMAS[k].nome}</option>
            ))}
          </select>
        </label>
      </div>

      <label class="campo-rotulo">
        <span>Página oficial</span>
        <input type="url" name="url" placeholder="https://" class="campo" />
      </label>
      <label class="campo-rotulo">
        <span>Organização</span>
        <input type="text" name="organizador" maxlength={120} class="campo" />
      </label>
      <label class="campo-rotulo">
        <span>O que é, em duas linhas</span>
        <textarea name="descricao" rows={3} maxlength={500} class="campo"></textarea>
      </label>

      <div>
        <button type="submit" class="botao-acao" style="border:0; cursor:pointer">
          Enviar para conferência
        </button>
      </div>
    </div>
  </form>
);

export { ROTULO_SECAO };
