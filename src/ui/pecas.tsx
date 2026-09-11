/**
 * As primitivas do sistema de design, em JSX.
 *
 * Elas vestem design/components.css — não trazem estilo próprio. E nenhuma
 * sabe de banco: recebem a peça pronta e desenham.
 */
import { raw } from 'hono/html';
import { gerarCapa } from './capa';
import { simbolo } from './marca';
import type { Evento } from '../db';
import { ATUACOES, FINALIDADES, ORDEM_ATUACOES, ORDEM_TEMAS, TEMAS, type Atuacao, type Tema } from '../config';
import type { Parceiro } from '../parceiros';
import {
  arte as arteDe,
  autorDe,
  caminho,
  caminhoAutor,
  ROTULO_FORMATO,
  ROTULO_SECAO,
  ROTULO_TEMA,
  type Autor,
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

/**
 * A data de hoje, em São Paulo, para a linha de data do cabeçalho:
 * "Segunda-feira, 7 de setembro de 2026". A página fica até 5 min na borda
 * (listagem) ou 1 h (peça) — na virada da meia-noite a linha pode atrasar
 * esse tanto. É a data de um jornal: a da edição, não a do relógio.
 */
export function dataHoje(): string {
  const s = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * A cabeça de um bloco: o rótulo (é um h2 de verdade), a ação à direita e,
 * quando o bloco não se explica sozinho, uma NOTA embaixo dizendo o que ele
 * é. Veio do feedback do sócio: "o que são os relatórios e como é montada
 * essa agenda?" — se quem é do ramo pergunta, a página tem de responder.
 */
export const Secao = (p: { titulo: string; acao?: { texto: string; href: string }; nota?: unknown; id?: string }) => (
  <div class="secao" id={p.id}>
    <div class="secao__cabeca">
      {/* h2 de verdade: o rótulo de seção É o título do bloco, e a hierarquia
          h1 → h2 → h3 é o que leitor de tela e buscador seguem. O visual vem da classe. */}
      <h2 class="secao__titulo">{p.titulo}</h2>
      {p.acao && (
        <span class="secao__acao">
          <a href={p.acao.href}>{p.acao.texto}</a>
        </span>
      )}
    </div>
    {p.nota && <p class="secao__nota">{p.nota}</p>}
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

/* ---------------------------------------------------------- publicidade */

/**
 * O rótulo de peça paga, na etiqueta.
 *
 * A palavra é **Publicidade** — não "patrocinado", não "conteúdo de marca",
 * não "apresentado por". O CDC (art. 36) pede identificação fácil e
 * imediata, e as três alternativas existem justamente para suavizar a
 * primeira. Quem lê "publicidade" entende na hora; é esse o teste.
 *
 * Fica no mesmo lugar do veredito, com contraste próprio: o leitor que
 * aprendeu a olhar a linha de etiquetas encontra o rótulo sem procurar.
 */
export const SeloPatrocinada = (p: { peca: Peca }) =>
  p.peca.patrocinada ? (
    <span class="selo-publi" title={`Conteúdo pago por ${p.peca.patrocinada.anunciante}`}>
      Publicidade · {p.peca.patrocinada.anunciante}
    </span>
  ) : null;

/**
 * O rótulo por extenso, na página da peça — antes do texto, nunca depois.
 *
 * Vem acima do corpo de propósito: rótulo no pé da página é rótulo que só vê
 * quem já leu, e a lei fala em identificação IMEDIATA. Diz também o que o
 * dinheiro não comprou, porque é isso que separa peça paga rotulada de
 * publieditorial disfarçado.
 */
export const PatrocinioCaixa = (p: { peca: Peca }) =>
  p.peca.patrocinada ? (
    <aside class="publi-caixa" aria-label="Aviso de publicidade">
      <p class="publi-caixa__rotulo">Publicidade</p>
      <p class="publi-caixa__texto">
        Este texto foi <strong>pago por {p.peca.patrocinada.anunciante}</strong>. É assinado por{' '}
        {p.peca.autor} e segue as mesmas regras de todo texto do Instituto. O que o anunciante não
        decide: a pauta das outras seções, o veredito de notícia nenhuma e o que entra no{' '}
        <a href="/giro">Giro da Semana</a>. As regras estão em <a href="/apoie">Apoie</a>.
      </p>
    </aside>
  ) : null;

/** Seção · tema, o veredito quando houver, e o rótulo quando a peça for paga. */
export const Etiquetas = (p: { peca: Peca; comVeredito?: boolean }) => (
  <div class="etiquetas">
    <Kicker ponto>
      {ROTULO_FORMATO[p.peca.formato]} · {ROTULO_TEMA[p.peca.tema]}
    </Kicker>
    {p.comVeredito !== false && <Veredito valor={p.peca.veredito} />}
    <SeloPatrocinada peca={p.peca} />
  </div>
);

/** Autor, data, leitura, fonte — a linha que separa peça de agregação. O nome leva à página do autor. */
export const AssinaturaPeca = (p: { peca: Peca; completa?: boolean }) => {
  const q = p.peca;
  const minutos = Math.max(1, Math.round(q.palavras / 200));
  const autor = autorDe(q);
  return (
    <div class="assinatura">
      {autor ? (
        <a href={caminhoAutor(autor)} rel="author" class="assinatura__autor">
          {q.autor}
        </a>
      ) : (
        <span class="assinatura__autor">{q.autor}</span>
      )}
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
        {/* a listagem também rotula: quem lê a lista e não clica precisa saber tanto quanto quem clica */}
        <SeloPatrocinada peca={q} />
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

/* ================================================================ autores */

/** O retrato: a foto quando há, o monograma quando não. */
export const Monograma = (p: { autor: Autor; grande?: boolean }) =>
  p.autor.foto ? (
    <img
      class={p.grande ? 'autor__foto autor__foto--grande' : 'autor__foto'}
      src={`/autores/${p.autor.foto.arquivo}`}
      alt={`Retrato de ${p.autor.nome}`}
      width={p.autor.foto.largura}
      height={p.autor.foto.altura}
      loading="lazy"
      decoding="async"
    />
  ) : (
    <span class={p.grande ? 'monograma monograma--grande' : 'monograma'} aria-hidden="true">
      {p.autor.iniciais}
    </span>
  );

/**
 * Quem escreveu, na página da peça. Pedido do sócio: o autor tem de
 * aparecer como gente, com caminho para o currículo dele — a peça promove
 * quem a escreveu, e é assim que se atrai quem escreve.
 */
export const AutorCaixa = (p: { autor: Autor; pecas: number }) => (
  <aside class="autor-caixa">
    <Monograma autor={p.autor} />
    <div>
      <span class="fonte-caixa__rotulo">Quem escreveu</span>
      <p class="fonte-caixa__nome">
        <a href={caminhoAutor(p.autor)} rel="author">
          {p.autor.nome}
        </a>
      </p>
      <p class="fonte-caixa__texto">
        {p.autor.papel} · {p.pecas} {p.pecas === 1 ? 'texto' : 'textos'} no Instituto
        {p.autor.link && (
          <>
            {' · '}
            <a href={p.autor.link} rel="noopener" target="_blank">
              {p.autor.linkRotulo}
            </a>
          </>
        )}
      </p>
    </div>
  </aside>
);

/** O cartão de autor, na faixa "Quem escreve" e na página de autores. */
export const AutorCard = (p: { autor: Autor; pecas: number }) => (
  <article class="autor-card">
    <a href={caminhoAutor(p.autor)} class="autor-card__link">
      <Monograma autor={p.autor} />
      <span class="autor-card__nome">{p.autor.nome}</span>
      <span class="autor-card__papel">{p.autor.papel}</span>
      <span class="autor-card__pecas u-dado">
        {p.pecas} {p.pecas === 1 ? 'texto' : 'textos'}
      </span>
    </a>
  </article>
);

/**
 * A faixa de quem escreve — rola de lado quando não cabe, e termina no
 * convite. É o "carrossel" que o sócio pediu, sem JavaScript: rolagem com
 * encaixe, que o dedo e a roda do mouse já sabem usar.
 */
export const QuemEscreve = (p: { autores: readonly Autor[]; contar: (a: Autor) => number }) => (
  <div class="autores-faixa" role="list">
    {p.autores.map((a) => (
      <div role="listitem">
        <AutorCard autor={a} pecas={p.contar(a)} />
      </div>
    ))}
    <div role="listitem">
      <article class="autor-card autor-card--convite">
        <a href="/autores#escrever" class="autor-card__link">
          <span class="monograma monograma--convite" aria-hidden="true">
            +
          </span>
          <span class="autor-card__nome">Escreva no Instituto</span>
          <span class="autor-card__papel">
            Guia ou conceito, assinado, com página de autor e link para o seu currículo.
          </span>
        </a>
      </article>
    </div>
  </div>
);

/* =============================================================== parceiro */

/**
 * O espaço do parceiro, entre o cabeçalho e a primeira notícia. Um só, com
 * nome, logo e uma frase — e sem ele, o espaço diz de quem é. Regras em
 * src/parceiros.ts.
 */
export const FaixaParceiro = (p: { parceiro: Parceiro | null }) => (
  <aside class="parceiro" aria-label="Parceiro do Instituto">
    <span class="parceiro__rotulo">Parceiro do Instituto</span>
    {p.parceiro ? (
      <a class="parceiro__corpo" href={p.parceiro.url} rel="sponsored noopener" target="_blank">
        {p.parceiro.logo ? (
          <img class="parceiro__logo" src={p.parceiro.logo} alt={p.parceiro.nome} height={36} loading="eager" />
        ) : (
          <span class="parceiro__nome">{p.parceiro.nome}</span>
        )}
        <span class="parceiro__frase">{p.parceiro.frase}</span>
      </a>
    ) : (
      <p class="parceiro__corpo">
        <span class="parceiro__nome">Este espaço é do primeiro parceiro do Instituto.</span>
        <span class="parceiro__frase">
          Visto por todo leitor, em toda visita à capa — sem escrever notícia nem escolher pauta.
        </span>
      </p>
    )}
    <a class="parceiro__acao" href="/apoie">
      {p.parceiro ? 'Como apoiar' : 'Saiba como apoiar'}
    </a>
  </aside>
);

/* ================================================================== lista */

/**
 * A lista — site é aluguel, lista é propriedade.
 *
 * Subiu na capa e passou a perguntar o que a pessoa faz (feedback do sócio).
 * Opcional, fechado, e dito para que serve: saber para quem se escreve. Não
 * há promessa de diretório nem de "sua empresa aqui" — o que não existe não
 * se anuncia.
 */
export const Lista = (p: { origem: string; estado?: string }) => (
  <div class="lista" id="assinar">
    <span class="lista__marca" aria-hidden="true">
      {raw(simbolo(220))}
    </span>
    <div class="lista__texto">
      <Kicker>A lista</Kicker>
      <p class="lista__titulo">O Giro da Semana na sua caixa, quando ele nascer.</p>
      <p class="lista__nota">
        Um e-mail por semana com o que o setor publicou e o que muda por aqui. Ainda não enviamos
        nada — a lista começa agora, e o primeiro envio sai quando houver o que mandar.
      </p>
    </div>
    <form class="lista__form" method="post" action="/assinar">
      <div aria-hidden="true" style="position:absolute; left:-9999px">
        <label>
          Não preencha
          <input type="text" name="sitio" tabindex={-1} autocomplete="off" />
        </label>
      </div>
      <input type="hidden" name="origem" value={p.origem} />
      <div class="lista__linha">
        <label class="u-visually-hidden" for="email-lista">
          Seu e-mail
        </label>
        <input class="campo" id="email-lista" type="email" name="email" required placeholder="seu@email.com.br" autocomplete="email" />
        <button type="submit" class="botao-acao" style="border:0; cursor:pointer">
          Quero receber
        </button>
      </div>
      <div class="lista__linha lista__linha--opcional">
        <label class="campo-rotulo">
          <span>
            O que você faz <em class="u-faint">(opcional)</em>
          </span>
          <select name="atuacao" class="campo">
            <option value="">Prefiro não dizer</option>
            {ORDEM_ATUACOES.map((k: Atuacao) => (
              <option value={k}>{ATUACOES[k]}</option>
            ))}
          </select>
        </label>
        <label class="campo-rotulo">
          <span>
            Empresa ou instituição <em class="u-faint">(opcional)</em>
          </span>
          <input class="campo" type="text" name="empresa" maxlength={120} autocomplete="organization" />
        </label>
      </div>
      {/* A FINALIDADE, na coleta — exigência da LGPD (art. 6º, VI e art. 9º), e o
          que decide se esta lista pode ser usada para alguma coisa depois. Fica
          aqui, colada no botão, e não só em /privacidade: política que o leitor
          não abre não declara nada. O texto vem de config.ts para não divergir
          da página. */}
      <p class="lista__pe">
        <strong>Para que serve o seu e-mail:</strong> para {FINALIDADES.lista} — e nada mais. Não
        repassamos, não vendemos e não mandamos oferta de outra empresa. Os dois campos de cima são
        opcionais e servem para {FINALIDADES.atuacao}. Você sai quando quiser, e o e-mail é
        apagado. <a href="/privacidade">Como isso funciona por inteiro</a>.
      </p>
      {p.estado === '1' ? (
        <p class="lista__rodape">
          <strong>Anotado.</strong> Você vai saber quando o primeiro sair.
        </p>
      ) : p.estado === 'erro' ? (
        <p class="lista__rodape">Esse e-mail não parece válido. Confere e tenta de novo?</p>
      ) : null}
    </form>
  </div>
);

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

/**
 * O formulário de contato — o mesmo para quem quer escrever e para quem quer
 * apoiar. Cai na tabela `contato`, lida por gente.
 */
export const FormularioContato = (p: { acao: string; tipo: 'autor' | 'parceiro'; enviado?: boolean }) => (
  <form method="post" action={p.acao} class="u-fluxo" style="max-width: var(--measure)">
    <div aria-hidden="true" style="position:absolute; left:-9999px">
      <label>
        Não preencha este campo
        <input type="text" name="sitio" tabindex={-1} autocomplete="off" />
      </label>
    </div>
    {p.enviado && (
      <div style="margin-block-end: var(--space-m)">
        <Aviso>
          <strong>Recebido.</strong> Alguém lê e responde pelo e-mail que você deixou — não é
          resposta automática, então pode levar uns dias.
        </Aviso>
      </div>
    )}
    <div style="display:grid; gap:var(--space-s)">
      <div class="campo-grade">
        <label class="campo-rotulo">
          <span>Seu nome *</span>
          <input type="text" name="nome" required maxlength={120} class="campo" autocomplete="name" />
        </label>
        <label class="campo-rotulo">
          <span>Seu e-mail *</span>
          <input type="email" name="email" required maxlength={200} class="campo" autocomplete="email" />
        </label>
      </div>
      <label class="campo-rotulo">
        <span>{p.tipo === 'parceiro' ? 'Empresa *' : 'Empresa ou instituição'}</span>
        <input type="text" name="empresa" required={p.tipo === 'parceiro'} maxlength={120} class="campo" autocomplete="organization" />
      </label>
      <label class="campo-rotulo">
        <span>{p.tipo === 'parceiro' ? 'O que a empresa faz, e por que apoiar o Instituto' : 'Sobre o que você escreveria, e o que você faz'}</span>
        <textarea name="mensagem" rows={4} maxlength={1000} class="campo"></textarea>
      </label>
      <div>
        <button type="submit" class="botao-acao" style="border:0; cursor:pointer">
          {p.tipo === 'parceiro' ? 'Quero conversar sobre apoiar' : 'Quero escrever no Instituto'}
        </button>
      </div>
    </div>
  </form>
);

export { ROTULO_SECAO };
