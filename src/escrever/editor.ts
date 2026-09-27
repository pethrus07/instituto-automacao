/**
 * O EDITOR de /escrever/editor — "como se fosse um Google Docs".
 *
 * Promessa da reunião de 24/09/2026, para o convidado do sócio e para o
 * estranho que quer escrever: abrir, escrever em 20 a 30 minutos, ver como
 * fica, enviar. Sem Word, sem conta, sem instalar nada.
 *
 * Como funciona, do jeito mais curto:
 *
 *   · o artigo é uma LISTA DE BLOCOS (parágrafo, subtítulo, dica, passo a
 *     passo, quiz…), cada um com os campos que ele precisa;
 *   · a lista vira o MESMO markdown que o site publica (`serializar`), e a
 *     prévia é o markdown passado pelo MESMO renderizador da página
 *     (src/ui/markdown.ts) — não existe "como vai ficar" diferente de como fica;
 *   · o rascunho fica no NAVEGADOR: o texto no localStorage, as imagens no
 *     IndexedDB (já reduzidas para o teto do site). Nada sai daqui antes do
 *     botão Enviar — é o que a página de privacidade promete;
 *   · o envio é um POST para /escrever/enviar, que repete as travas e guarda
 *     numa caixa de entrada. Uma pessoa lê antes de qualquer coisa ir ao ar.
 *
 * Sem framework, de propósito: é uma página, e o site inteiro é zero
 * dependência no navegador. `h()` monta elemento; a lista só é redesenhada
 * quando muda de forma (entra, sai ou troca de lugar um bloco) — digitar só
 * atualiza o dado e a prévia, senão o cursor pularia a cada tecla.
 */
import katex from 'katex';
import { converterObra } from '../ui/markdown.ts';

/* ================================================================ os dados */

type Pauta = {
  slug: string;
  titulo: string;
  objetivo: string;
  formato: Formato;
  nivel: Nivel;
  cobrir: string[];
  blocos: string[];
  serie: { titulo: string; parte: number; partes: number } | null;
};
type Formato = 'guia' | 'conceito' | 'experiencia';
type Nivel = 'iniciante' | 'intermediario' | 'avancado';
type DadosDaPagina = {
  pauta: Pauta | null;
  blocos: Record<string, { rotulo: string; para: string }>;
  formatos: Record<Formato, string>;
  niveis: Record<Nivel, string>;
  finalidade: string;
};

const DADOS: DadosDaPagina = JSON.parse(document.getElementById('editor-dados')?.textContent ?? '{}');

type Img = { id: string; alt: string; credito: string };
type Item = { titulo: string; texto: string };
type Armadilha = { titulo: string; texto: string; evitar: string };
type Questao = { pergunta: string; opcoes: { texto: string; certa: boolean }[]; explica: string };

/** Um bloco. Solto de propósito: cada tipo usa os campos que precisa. */
type Bloco = {
  id: string;
  tipo: string;
  texto?: string;
  titulo?: string;
  nivel?: 2 | 3;
  linguagem?: string;
  img?: Img | null;
  antes?: Img | null;
  depois?: Img | null;
  linhas?: string[][];
  itens?: Item[];
  armadilhas?: Armadilha[];
  pro?: string;
  contra?: string;
  tex?: string;
  explica?: string;
  resultado?: string;
  autoria?: string;
  questoes?: Questao[];
};

type Autor = { nome: string; email: string; papel: string; bio: string; link: string; foto: string | null };

type Rascunho = {
  versao: 1;
  pauta: string | null;
  meta: { titulo: string; lead: string; formato: Formato | ''; nivel: Nivel | '' };
  blocos: Bloco[];
  autor: Autor;
  consentimentos: { autoria: boolean; imagens: boolean; privacidade: boolean };
  enviado: { protocolo: string; em: string } | null;
  salvo: string;
};

const CHAVE = 'instituto.rascunho.v1';
const CHAVE_AUTOR = 'instituto.autor.v1';

/* ================================================================ utilidades */

type Filho = Node | string | null | undefined | false;
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, unknown> = {}, ...filhos: (Filho | Filho[])[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else if (k === 'value') (el as HTMLInputElement).value = String(v);
    else if (k === 'checked') (el as HTMLInputElement).checked = Boolean(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) el.append(f);
  return el;
}

const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

function debounce<T extends (...a: never[]) => void>(fn: T, ms: number) {
  let t: number | undefined;
  return (...a: Parameters<T>) => {
    clearTimeout(t);
    t = window.setTimeout(() => fn(...a), ms);
  };
}

const guardar = {
  ler<T>(chave: string): T | null {
    try {
      const v = localStorage.getItem(chave);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  escrever(chave: string, v: unknown): boolean {
    try {
      localStorage.setItem(chave, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  },
  apagar(chave: string) {
    try {
      localStorage.removeItem(chave);
    } catch {
      /* sem armazenamento, sem rascunho */
    }
  },
};

/* ================================================================ as imagens
 * Ficam no IndexedDB: o localStorage aguenta 5 MB de texto, e três fotos já
 * passam disso. Toda imagem entra REDUZIDA — no máximo 1600 px de largura e
 * 580 KB — porque o compilador do site recusa acima de 600 KB, e é melhor o
 * autor não descobrir isso no fim.
 */
const IDB = {
  db: null as IDBDatabase | null,
  async abrir(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    return new Promise((ok) => {
      try {
        const r = indexedDB.open('instituto-editor', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('imagens', { keyPath: 'id' });
        r.onsuccess = () => ok((this.db = r.result));
        r.onerror = () => ok(null);
      } catch {
        ok(null);
      }
    });
  },
  async por(id: string, blob: Blob, largura: number, altura: number) {
    const db = await this.abrir();
    if (!db) return;
    await new Promise<void>((ok) => {
      const tx = db.transaction('imagens', 'readwrite');
      tx.objectStore('imagens').put({ id, blob, largura, altura });
      tx.oncomplete = () => ok();
      tx.onerror = () => ok();
    });
  },
  async ler(id: string): Promise<{ blob: Blob; largura: number; altura: number } | null> {
    const db = await this.abrir();
    if (!db) return null;
    return new Promise((ok) => {
      const r = db.transaction('imagens').objectStore('imagens').get(id);
      r.onsuccess = () => ok(r.result ?? null);
      r.onerror = () => ok(null);
    });
  },
};

const urls = new Map<string, string>();
async function urlDaImagem(id: string): Promise<string | null> {
  if (urls.has(id)) return urls.get(id)!;
  const r = await IDB.ler(id);
  if (!r) return null;
  const u = URL.createObjectURL(r.blob);
  urls.set(id, u);
  return u;
}

async function reduzir(arquivo: File, o: { largura: number; teto: number; quadrada?: boolean }): Promise<{ blob: Blob; largura: number; altura: number; original: number }> {
  const bmp = await createImageBitmap(arquivo, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height;
  if (o.quadrada) {
    const lado = Math.min(bmp.width, bmp.height);
    sx = (bmp.width - lado) / 2;
    sy = (bmp.height - lado) / 2;
    sw = sh = lado;
  }
  let escala = Math.min(1, o.largura / sw);
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const w = Math.round(sw * escala), hh = Math.round(sh * escala);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = hh;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff'; // PNG transparente vira JPEG com fundo branco, não preto
    ctx.fillRect(0, 0, w, hh);
    ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, hh);
    for (const q of [0.86, 0.78, 0.7, 0.62]) {
      const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/jpeg', q));
      if (blob && blob.size <= o.teto) return { blob, largura: w, altura: hh, original: bmp.width };
    }
    escala *= 0.8;
  }
  throw new Error('não consegui reduzir a imagem para o tamanho do site');
}

/* ================================================================ o rascunho */

const autorSalvo = guardar.ler<Autor>(CHAVE_AUTOR);
const autorVazio = (): Autor => autorSalvo ?? { nome: '', email: '', papel: '', bio: '', link: '', foto: null };

function novoRascunho(p: Pauta | null): Rascunho {
  return {
    versao: 1,
    pauta: p?.slug ?? null,
    // formato e nível já vêm escolhidos (da pauta, ou o mais comum no tema livre): é um campo a menos
    meta: { titulo: p?.titulo ?? '', lead: '', formato: p?.formato ?? 'guia', nivel: p?.nivel ?? 'intermediario' },
    blocos: p ? esqueleto(p) : [blocoVazio('resumo'), blocoVazio('paragrafo'), { ...blocoVazio('quiz'), questoes: [questaoVazia()] }],
    autor: autorVazio(),
    consentimentos: { autoria: false, imagens: false, privacidade: false },
    enviado: null,
    salvo: new Date().toISOString(),
  };
}

/** A certa é sempre a primeira NO EDITOR (é o campo "resposta certa"); no texto, o `serializar` embaralha. */
const questaoVazia = (): Questao => ({ pergunta: '', opcoes: [{ texto: '', certa: true }, { texto: '', certa: false }, { texto: '', certa: false }], explica: '' });

/** Um bloco novo, vazio, do tipo pedido. */
function blocoVazio(tipo: string): Bloco {
  const b: Bloco = { id: uid(), tipo };
  switch (tipo) {
    case 'subtitulo': b.texto = ''; b.nivel = 2; break;
    case 'imagem': b.img = null; break;
    case 'codigo': b.linguagem = ''; b.titulo = ''; b.texto = ''; break;
    case 'terminal': b.titulo = ''; b.texto = ''; break;
    case 'tabela': b.linhas = [['', '', ''], ['', '', ''], ['', '', '']]; break;
    case 'roteiro': case 'passos': case 'checklist': b.titulo = ''; b.itens = [{ titulo: '', texto: '' }, { titulo: '', texto: '' }, { titulo: '', texto: '' }]; break;
    case 'armadilhas': b.titulo = ''; b.armadilhas = [{ titulo: '', texto: '', evitar: '' }, { titulo: '', texto: '', evitar: '' }]; break;
    case 'proscontras': b.titulo = ''; b.pro = ''; b.contra = ''; break;
    case 'antesdepois': b.antes = null; b.depois = null; break;
    case 'formula': b.titulo = ''; b.tex = ''; b.explica = ''; b.resultado = ''; break;
    case 'arvore': b.titulo = ''; b.texto = ''; break;
    case 'frase': b.texto = ''; b.autoria = ''; b.img = null; break;
    case 'quiz': b.titulo = ''; b.questoes = [questaoVazia(), questaoVazia(), questaoVazia()]; break;
    default: b.titulo = ''; b.texto = '';
  }
  return b;
}

/**
 * A pauta vira esqueleto: "50% do caminho andado". O que já se sabe vem
 * preenchido (a promessa do artigo, o roteiro com os subtítulos); o resto vem
 * no lugar, vazio, esperando o que só o autor sabe.
 */
function esqueleto(p: Pauta): Bloco[] {
  /* LEVE DE PROPÓSITO (27/09/2026, pedido do Pedro: "como não pagamos, deve ser
     rápido e fácil"). A primeira versão trazia todos os blocos sugeridos já
     montados e vazios — uma página cheia de caixas para preencher assusta
     quem tem 20 minutos. Agora o esqueleto é só o que todo artigo tem (resumo,
     a promessa, as seções e uma pergunta do quiz); os blocos sugeridos viram
     botões de um clique no alto (`sugestoes()`), e só entra o que o autor usar. */
  const b: Bloco[] = [blocoVazio('resumo'), { ...blocoVazio('aprender'), texto: p.objetivo }];
  for (const titulo of p.cobrir) {
    b.push({ ...blocoVazio('subtitulo'), texto: titulo });
    b.push(blocoVazio('paragrafo'));
  }
  b.push({ ...blocoVazio('quiz'), questoes: [questaoVazia()] });
  return b;
}

let R: Rascunho;
{
  const salvo = guardar.ler<Rascunho>(CHAVE);
  R = salvo && salvo.versao === 1 ? salvo : novoRascunho(DADOS.pauta);
}

/* ================================================================ texto → markdown */

const umaLinha = (s: string | undefined) => (s ?? '').replace(/\s*\n\s*/g, ' ').trim();
/** Linha de texto que, sozinha, abriria um bloco ou fecharia um código — neutralizada. */
const neutra = (s: string) =>
  s
    .split('\n')
    .map((l) => l.replace(/^(\s*):::/, '$1::').replace(/^(\s*)```/, '$1``'))
    .join('\n')
    .trim();
const nomeImg = (img: Img) => `img-${img.id}.jpg`;

/** O crédito que o autor não precisa digitar: a foto é dele (é o que ele confirma no envio). */
const creditoDe = (img: Img) => img.credito.trim() || `Foto: ${R.autor.nome.trim() || 'do autor'}`;

/**
 * A resposta certa sai numa posição que depende da pergunta — sempre a mesma
 * para o mesmo texto (a prévia não pula), mas não sempre a primeira, senão o
 * leitor aprende que "a primeira é a certa".
 */
function embaralhar(q: Questao) {
  const ops = q.opcoes.filter((o) => o.texto.trim());
  const certa = ops.findIndex((o) => o.certa);
  if (certa < 0 || ops.length < 2) return ops;
  const [c] = ops.splice(certa, 1);
  let h = 0;
  for (const ch of q.pergunta) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  ops.splice(h % (ops.length + 1), 0, c!);
  return ops;
}
const semAspas = (s: string) => umaLinha(s).replace(/"/g, '”').replace(/[()]/g, '');

/** O bloco está vazio? Vazio não vai para o texto — e a conferência avisa. */
function vazio(b: Bloco): boolean {
  switch (b.tipo) {
    case 'imagem': return !b.img;
    case 'antesdepois': return !b.antes && !b.depois;
    case 'tabela': return !(b.linhas ?? []).some((l) => l.some((c) => c.trim()));
    case 'roteiro': case 'passos': case 'checklist': return !(b.itens ?? []).some((i) => i.titulo.trim());
    case 'armadilhas': return !(b.armadilhas ?? []).some((a) => a.titulo.trim());
    case 'proscontras': return !(b.pro ?? '').trim() && !(b.contra ?? '').trim();
    case 'formula': return !(b.tex ?? '').trim();
    case 'quiz': return !(b.questoes ?? []).some((q) => q.pergunta.trim());
    default: return !(b.texto ?? '').trim();
  }
}

function blocoParaMd(b: Bloco): string {
  const abre = (tipo: string, arg?: string) => `:::${tipo}${arg && umaLinha(arg) ? ' ' + umaLinha(arg) : ''}`;
  switch (b.tipo) {
    case 'paragrafo': return neutra(b.texto ?? '');
    case 'subtitulo': return `${b.nivel === 3 ? '###' : '##'} ${umaLinha(b.texto)}`;
    case 'lista': return (b.texto ?? '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => `- ${l.replace(/^[-*]\s+/, '')}`).join('\n');
    case 'numerada': return (b.texto ?? '').split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => `${i + 1}. ${l.replace(/^\d+\.\s+/, '')}`).join('\n');
    case 'citacao': return `> ${umaLinha(b.texto)}`;
    case 'imagem': return b.img ? `![${semAspas(b.img.alt).replace(/[\[\]]/g, '')}](${nomeImg(b.img)} "${semAspas(creditoDe(b.img))}")` : '';
    case 'codigo': return `\`\`\`${(b.linguagem ?? '').trim().toLowerCase().replace(/[^a-z0-9+#.-]/g, '')} ${umaLinha(b.titulo)}\n${(b.texto ?? '').replace(/^```\s*$/gm, '`` `')}\n\`\`\``;
    case 'terminal': return `\`\`\`terminal ${umaLinha(b.titulo)}\n${(b.texto ?? '').replace(/^```\s*$/gm, '`` `')}\n\`\`\``;
    case 'tabela': {
      const linhas = (b.linhas ?? []).filter((l) => l.some((c) => c.trim()));
      if (!linhas.length) return '';
      const cel = (c: string) => umaLinha(c).replace(/\|/g, '/') || ' ';
      const [cab, ...resto] = linhas;
      return [`| ${cab!.map(cel).join(' | ')} |`, `|${cab!.map(() => '---').join('|')}|`, ...resto.map((l) => `| ${l.map(cel).join(' | ')} |`)].join('\n');
    }
    case 'roteiro': case 'passos': case 'checklist':
      return [abre(b.tipo, b.titulo), ...(b.itens ?? []).filter((i) => i.titulo.trim()).map((i) => `- ${umaLinha(i.titulo)}${i.texto.trim() ? ` — ${umaLinha(i.texto)}` : ''}`), ':::'].join('\n');
    case 'armadilhas':
      return [abre('armadilhas', b.titulo), ...(b.armadilhas ?? []).filter((a) => a.titulo.trim()).flatMap((a) => [`### ${umaLinha(a.titulo)}`, ...(a.texto.trim() ? [umaLinha(a.texto)] : []), ...(a.evitar.trim() ? [`Como evitar: ${umaLinha(a.evitar)}`] : [])]), ':::'].join('\n');
    case 'proscontras': {
      const lados = (s: string | undefined, m: string) => (s ?? '').split('\n').map((l) => l.trim().replace(/^[-+*]\s+/, '')).filter(Boolean).map((l) => `${m} ${l}`);
      return [abre('proscontras', b.titulo), ...lados(b.pro, '+'), ...lados(b.contra, '-'), ':::'].join('\n');
    }
    case 'antesdepois':
      return [abre('antesdepois'), b.antes ? `antes: ${nomeImg(b.antes)} | ${umaLinha(b.antes.alt)}` : '', b.depois ? `depois: ${nomeImg(b.depois)} | ${umaLinha(b.depois.alt)}` : '', ':::'].filter(Boolean).join('\n');
    case 'formula':
      return [abre('formula', b.titulo), `$$ ${umaLinha(b.tex).replace(/\$\$/g, '$')} $$`, ...(b.explica?.trim() ? [neutra(b.explica)] : []), ...(b.resultado?.trim() ? [`= ${umaLinha(b.resultado)}`] : []), ':::'].join('\n');
    case 'arvore':
      return [abre('arvore', b.titulo), (b.texto ?? '').replace(/^\s*:::.*$/gm, '').replace(/\s+$/, ''), ':::'].join('\n');
    case 'frase':
      return [abre('frase'), b.img ? `imagem: ${nomeImg(b.img)} | ${umaLinha(b.img.alt)}` : '', umaLinha(b.texto), b.autoria?.trim() ? `— ${umaLinha(b.autoria)}` : '', ':::'].filter(Boolean).join('\n');
    case 'quiz':
      return [
        abre('quiz', b.titulo),
        ...(b.questoes ?? [])
          .filter((q) => q.pergunta.trim())
          .flatMap((q) => [`? ${umaLinha(q.pergunta)}`, ...embaralhar(q).map((o) => `${o.certa ? '+' : '-'} ${umaLinha(o.texto)}`), ...(q.explica.trim() ? [`> ${umaLinha(q.explica)}`] : [])]),
        ':::',
      ].join('\n');
    default:
      return [abre(b.tipo, b.titulo), neutra(b.texto ?? ''), ':::'].join('\n');
  }
}

function serializar(): string {
  return R.blocos
    .filter((b) => !vazio(b))
    .map(blocoParaMd)
    .filter(Boolean)
    .join('\n\n');
}

/** As imagens que o texto cita, pelo nome que o markdown usa. */
function imagensUsadas(): Img[] {
  const lista: Img[] = [];
  for (const b of R.blocos) for (const i of [b.img, b.antes, b.depois]) if (i && !vazio(b)) lista.push(i);
  return lista;
}

/* ================================================================ o catálogo do menu */

const ROTULOS_LINHA: Record<string, { rotulo: string; para: string }> = {
  paragrafo: { rotulo: 'Parágrafo', para: 'Texto corrido. Linha em branco separa parágrafos.' },
  subtitulo: { rotulo: 'Subtítulo', para: 'Abre uma seção do artigo. No site, ganha número: 01, 02, 03.' },
  lista: { rotulo: 'Lista', para: 'Um item por linha.' },
  numerada: { rotulo: 'Lista numerada', para: 'Quando a ordem importa.' },
  citacao: { rotulo: 'Citação', para: 'O que alguém disse, com o nome.' },
  imagem: { rotulo: 'Imagem', para: 'Foto sua, print da sua tela, desenho seu — com crédito.' },
  codigo: { rotulo: 'Código', para: 'Programa ou configuração, com o botão Copiar.' },
  terminal: { rotulo: 'Terminal', para: 'Comando e o que aparece. $ no começo é comando.' },
  tabela: { rotulo: 'Tabela', para: 'Comparação lado a lado. (sim) (não) (parcial) ganham cor.' },
};
const rotuloDe = (tipo: string) => ROTULOS_LINHA[tipo] ?? DADOS.blocos[tipo] ?? { rotulo: tipo, para: '' };

const GRUPOS: { nome: string; tipos: string[] }[] = [
  // o que se usa em quase todo artigo vem primeiro, sem ter de procurar
  { nome: 'Mais usados', tipos: ['paragrafo', 'subtitulo', 'imagem', 'dica', 'passos', 'codigo'] },
  { nome: 'Texto', tipos: ['lista', 'numerada', 'citacao'] },
  { nome: 'Abertura', tipos: ['resumo', 'aprender', 'roteiro'] },
  { nome: 'Avisos', tipos: ['dica', 'atencao', 'perigo', 'nota', 'curiosidade', 'margem'] },
  { nome: 'Fazer', tipos: ['passos', 'armadilhas', 'checklist'] },
  { nome: 'Técnico', tipos: ['codigo', 'terminal', 'formula', 'tabela', 'arvore'] },
  { nome: 'Imagem', tipos: ['imagem', 'antesdepois', 'frase', 'proscontras'] },
  { nome: 'Fecho', tipos: ['quiz', 'recursos', 'notadoautor'] },
];

/* ================================================================ a tela */

const raiz = document.getElementById('editor')!;
/** No celular, escrever e ver a prévia se alternam; na tela larga ficam lado a lado. */
let aba: 'escrever' | 'previa' = 'escrever';
let areaAtiva: HTMLTextAreaElement | HTMLInputElement | null = null;
/** O bloco em que o autor está — é depois dele que entra o que for colado, arrastado ou sugerido. */
let blocoAtivo: string | null = null;

const salvarJa = () => {
  R.salvo = new Date().toISOString();
  const ok = guardar.escrever(CHAVE, R);
  guardar.escrever(CHAVE_AUTOR, { ...R.autor });
  estadoSalvo.textContent = ok ? `Salvo · ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Não consegui salvar neste navegador — baixe o .md';
};
const salvar = debounce(salvarJa, 500);
const atualizarPrevia = debounce(() => desenharPrevia(), 250);

/** Toda edição passa por aqui: guarda, redesenha a prévia, a conferência e o progresso. */
function mudou() {
  if (R.enviado) R.enviado = null; // editou depois de enviar: é outra versão
  salvar();
  atualizarPrevia();
  atualizarConferencia();
  atualizarProgresso();
}

const estadoSalvo = h('span', { class: 'editor__salvo', 'aria-live': 'polite' }, 'Salvo neste navegador');
const contador = h('span', { class: 'editor__contador' });
const progresso = h('span', { class: 'editor__progresso' });

const painelEscrever = h('section', { class: 'editor__painel editor__painel--escrever', id: 'painel-escrever', 'aria-label': 'Escrever' });
const painelPrevia = h('section', { class: 'editor__painel editor__painel--previa', id: 'painel-previa', 'aria-label': 'Como vai ficar', tabindex: 0 });
const painelEnviar = h('div', { class: 'editor__painel--enviar' });
const dialogo = h('dialog', { class: 'editor__dialogo', 'aria-label': 'Enviar para o editor' });
const listaBlocos = h('div', { class: 'editor__blocos' });
const conferencia = h('div', { class: 'conferencia', 'aria-live': 'polite' });
const botaoVer = h('button', { type: 'button', class: 'botao-secundario editor__ver', 'aria-pressed': 'false' }, 'Ver como fica');

function alternarPrevia() {
  aba = aba === 'escrever' ? 'previa' : 'escrever';
  raiz.dataset.aba = aba;
  botaoVer.textContent = aba === 'previa' ? 'Voltar a escrever' : 'Ver como fica';
  botaoVer.setAttribute('aria-pressed', String(aba === 'previa'));
  if (aba === 'previa') desenharPrevia();
  window.scrollTo({ top: raiz.offsetTop - 16, behavior: 'smooth' });
}

function abrirEnvio() {
  desenharEnviar();
  dialogo.showModal();
}

/** "3 de 5 seções escritas": o autor vê quanto falta sem ter de contar. */
function atualizarProgresso() {
  let secoes = 0;
  let escritas = 0;
  R.blocos.forEach((b, i) => {
    if (b.tipo !== 'subtitulo' || b.nivel === 3) return;
    secoes++;
    const seguinte = R.blocos.slice(i + 1).find((x) => x.tipo !== 'subtitulo' || x.nivel === 3);
    if (seguinte && seguinte.tipo !== 'subtitulo' && !vazio(seguinte)) escritas++;
  });
  progresso.textContent = secoes ? `${escritas} de ${secoes} seções escritas` : '';
}

function montar() {
  raiz.textContent = '';
  raiz.dataset.estado = 'pronto';
  raiz.dataset.aba = aba;
  botaoVer.onclick = alternarPrevia;

  // Uma faixa só gruda no alto: a formatação, o estado, a prévia e o Enviar.
  const topo = h(
    'div',
    { class: 'editor__topo' },
    barraDeFormatacao(),
    h('div', { class: 'editor__estado' }, progresso, contador, estadoSalvo),
    h('div', { class: 'editor__acoes' }, botaoVer, h('button', { type: 'button', class: 'botao-acao', onclick: abrirEnvio }, 'Enviar →')),
  );

  dialogo.textContent = '';
  dialogo.append(
    h('div', { class: 'editor__dialogo-cabeca' }, h('h2', {}, 'Enviar para o editor'), h('button', { type: 'button', class: 'cartao__tirar', 'aria-label': 'Fechar', onclick: () => dialogo.close() }, '×')),
    painelEnviar,
  );

  raiz.append(
    avisoDeRascunho(),
    cabecaDaPauta(),
    topo,
    h('div', { class: 'editor__area' }, painelEscrever, painelPrevia),
    dialogo,
  );

  desenharEscrever();
  desenharPrevia();
  atualizarConferencia();
  atualizarProgresso();
}

/** Rascunho de outra pauta salvo aqui: pergunta antes de apagar. */
function avisoDeRascunho(): Node {
  const outra = DADOS.pauta && R.pauta !== DADOS.pauta.slug && R.blocos.some((b) => !vazio(b));
  if (!outra) {
    if (DADOS.pauta && R.pauta !== DADOS.pauta.slug) R = novoRascunho(DADOS.pauta);
    return document.createTextNode('');
  }
  const caixa = h(
    'div',
    { class: 'editor__aviso', role: 'alert' },
    h('p', {}, h('strong', {}, 'Você tem outro rascunho aqui: '), `“${R.meta.titulo || 'sem título'}”. O editor guarda um de cada vez.`),
    h(
      'p',
      { class: 'editor__aviso-acoes' },
      h('button', { type: 'button', class: 'botao-secundario', onclick: () => { caixa.remove(); } }, 'Continuar nele'),
      h('button', { type: 'button', class: 'botao-secundario', onclick: () => baixarMd() }, 'Baixar o .md dele'),
      h('button', { type: 'button', class: 'botao-acao', onclick: () => { R = novoRascunho(DADOS.pauta); salvarJa(); montar(); } }, `Começar “${DADOS.pauta!.titulo}”`),
    ),
  );
  return caixa;
}

function cabecaDaPauta(): Node {
  const p = DADOS.pauta && R.pauta === DADOS.pauta.slug ? DADOS.pauta : null;
  const dicas = h('p', { class: 'editor__cabeca-texto' }, 'Escreva direto no texto. Para mais recursos, o ', h('strong', {}, '+'), ' entre os blocos ou ', h('kbd', {}, '/'), ' num parágrafo vazio. Fotos: cole (', h('kbd', {}, 'Ctrl'), ' ', h('kbd', {}, 'V'), ') ou arraste para cá — várias de uma vez.');
  if (!p) return h('header', { class: 'editor__cabeca' }, h('span', { class: 'kicker' }, R.pauta ? 'Continuando o seu rascunho' : 'Tema livre'), dicas);
  return h(
    'header',
    { class: 'editor__cabeca' },
    h('span', { class: 'kicker' }, p.serie ? `Série ${p.serie.titulo} · parte ${p.serie.parte} de ${p.serie.partes}` : 'Pauta avulsa'),
    h('p', { class: 'editor__cabeca-texto' }, h('strong', {}, 'O esqueleto já está montado: '), 'é só escrever embaixo de cada subtítulo.'),
    dicas,
    sugestoes(p),
  );
}

/** Os blocos que a pauta sugere, como botões de um clique — em vez de caixas vazias na página. */
function sugestoes(p: Pauta): Node {
  const tipos = [...new Set(p.blocos)].filter((t) => !['resumo', 'aprender', 'quiz'].includes(t));
  if (!tipos.length) return document.createTextNode('');
  return h(
    'p',
    { class: 'sugestoes' },
    h('span', { class: 'sugestoes__rotulo' }, 'Costuma servir aqui:'),
    ...tipos.map((t) => h('button', { type: 'button', class: 'sugestoes__botao', title: rotuloDe(t).para, onclick: () => inserir([blocoVazio(t)]) }, `+ ${rotuloDe(t).rotulo}`)),
  );
}

/** Onde entra o bloco novo: depois do bloco em que o autor está; sem foco, antes do quiz do fim. */
function inserir(novos: Bloco[], pos?: number) {
  let i = pos ?? -1;
  if (i < 0 && blocoAtivo) i = R.blocos.findIndex((b) => b.id === blocoAtivo) + 1;
  if (i <= 0) {
    const quiz = R.blocos.map((b) => b.tipo).lastIndexOf('quiz');
    i = quiz >= 0 ? quiz : R.blocos.length;
  }
  R.blocos.splice(i, 0, ...novos);
  desenharBlocos();
  mudou();
  const alvo = listaBlocos.querySelector(`[data-bloco="${novos[0]!.id}"]`) as HTMLElement | null;
  alvo?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  (alvo?.querySelector('textarea, input:not([type=file])') as HTMLElement | null)?.focus({ preventScroll: true });
}

/** Foto colada ou arrastada vira bloco de imagem na hora, já reduzida e com o crédito do autor. */
async function fotosParaBlocos(arquivos: File[]) {
  const imagens = arquivos.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type));
  if (!imagens.length) return;
  estadoSalvo.textContent = imagens.length > 1 ? `Preparando ${imagens.length} fotos…` : 'Preparando a foto…';
  const novos: Bloco[] = [];
  for (const f of imagens) {
    try {
      const r = await reduzir(f, { largura: 1600, teto: 580_000 });
      const id = uid();
      await IDB.por(id, r.blob, r.largura, r.altura);
      novos.push({ ...blocoVazio('imagem'), img: { id, alt: '', credito: '' } });
    } catch {
      /* uma foto ruim não impede as outras */
    }
  }
  if (novos.length) inserir(novos);
  salvarJa();
}

/* ---------------------------------------------------------------- escrever */

function desenharEscrever() {
  painelEscrever.textContent = '';
  const titulo = h('textarea', { class: 'doc-titulo', rows: 1, placeholder: 'O título do artigo', maxlength: 160, 'aria-label': 'Título', value: R.meta.titulo });
  const lead = h('textarea', { class: 'doc-lead', rows: 1, placeholder: 'Uma frase que diga ao leitor o que ele vai ganhar lendo', maxlength: 300, 'aria-label': 'Linha fina', value: R.meta.lead });
  for (const [el, campo] of [[titulo, 'titulo'], [lead, 'lead']] as const) {
    crescer(el);
    el.addEventListener('input', () => {
      R.meta[campo] = el.value.replace(/\n/g, ' ');
      crescer(el);
      mudou();
    });
  }
  painelEscrever.append(h('div', { class: 'doc' }, titulo, lead), listaBlocos);
  desenharBlocos();
}

/* Colar e arrastar fotos, em qualquer lugar do texto. */
painelEscrever.addEventListener('paste', (e) => {
  const arquivos = [...(e.clipboardData?.files ?? [])];
  if (!arquivos.some((f) => f.type.startsWith('image/'))) return;
  e.preventDefault();
  void fotosParaBlocos(arquivos);
});
painelEscrever.addEventListener('dragover', (e) => {
  if ([...(e.dataTransfer?.items ?? [])].some((i) => i.kind === 'file')) {
    e.preventDefault();
    raiz.dataset.soltando = '';
  }
});
painelEscrever.addEventListener('dragleave', (e) => {
  if (!painelEscrever.contains(e.relatedTarget as Node)) delete raiz.dataset.soltando;
});
painelEscrever.addEventListener('drop', (e) => {
  delete raiz.dataset.soltando;
  const arquivos = [...(e.dataTransfer?.files ?? [])];
  if (!arquivos.length || (e.target as HTMLElement).closest('input[type=file]')) return;
  e.preventDefault();
  const cartao = (e.target as HTMLElement).closest<HTMLElement>('[data-bloco]');
  if (cartao) blocoAtivo = cartao.dataset.bloco ?? blocoAtivo;
  void fotosParaBlocos(arquivos);
});
listaBlocos.addEventListener('focusin', (e) => {
  const c = (e.target as HTMLElement).closest<HTMLElement>('[data-bloco]');
  if (c) blocoAtivo = c.dataset.bloco ?? null;
});

/** Campo que cresce com o texto — medido depois de estar na página (fora dela, scrollHeight é 0). */
function crescer(el: HTMLTextAreaElement) {
  if (!el.isConnected) {
    requestAnimationFrame(() => crescer(el));
    return;
  }
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}
window.addEventListener('resize', debounce(() => document.querySelectorAll<HTMLTextAreaElement>('.editor textarea').forEach(crescer), 150));

/** A barra do "Docs": age sobre o último campo de texto em que o autor esteve. */
function barraDeFormatacao(): Node {
  const envolver = (antes: string, depois: string, exemplo: string) => () => {
    const a = areaAtiva;
    if (!a) return;
    const [i, f] = [a.selectionStart ?? a.value.length, a.selectionEnd ?? a.value.length];
    const sel = a.value.slice(i, f) || exemplo;
    a.setRangeText(antes + sel + depois, i, f, 'end');
    if (!a.value.slice(i, f).length) a.setSelectionRange(i + antes.length, i + antes.length + sel.length);
    a.dispatchEvent(new Event('input'));
    a.focus();
  };
  const botao = (rotulo: string, titulo: string, acao: () => void, classe = '') =>
    h('button', { type: 'button', class: `barra__botao ${classe}`, title: titulo, 'aria-label': titulo, onmousedown: (e: Event) => e.preventDefault(), onclick: acao }, rotulo);
  return h(
    'div',
    { class: 'barra', role: 'toolbar', 'aria-label': 'Formatação do texto' },
    botao('N', 'Negrito — **texto**', envolver('**', '**', 'negrito'), 'barra__botao--n'),
    botao('I', 'Itálico — _texto_', envolver('_', '_', 'itálico'), 'barra__botao--i'),
    botao('</>', 'Código na linha — `texto`', envolver('`', '`', 'código')),
    botao('Link', 'Link — [texto](https://…)', envolver('[', '](https://)', 'texto do link')),
    botao('Tecla', 'Tecla — [[Ctrl]]', envolver('[[', ']]', 'Ctrl')),
    botao('Termo', 'Termo explicado — {{termo|definição}}', envolver('{{', '|a definição em uma frase}}', 'termo')),
  );
}

function desenharBlocos() {
  listaBlocos.textContent = '';
  listaBlocos.append(inseridor(0));
  R.blocos.forEach((b, i) => {
    listaBlocos.append(cartao(b, i), inseridor(i + 1));
  });
}

function mover(i: number, d: number) {
  const j = i + d;
  if (j < 0 || j >= R.blocos.length) return;
  [R.blocos[i], R.blocos[j]] = [R.blocos[j]!, R.blocos[i]!];
  desenharBlocos();
  mudou();
  (listaBlocos.querySelector(`[data-bloco="${R.blocos[j]!.id}"] .cartao__mover--${d < 0 ? 'cima' : 'baixo'}`) as HTMLElement | null)?.focus();
}

function cartao(b: Bloco, i: number): HTMLElement {
  const r = rotuloDe(b.tipo);
  const texto = ['paragrafo', 'subtitulo'].includes(b.tipo);
  return h(
    'div',
    { class: `cartao cartao--${b.tipo}${texto ? ' cartao--texto' : ''}`, 'data-bloco': b.id },
    h(
      'div',
      { class: 'cartao__cabeca' },
      h('span', { class: 'cartao__tipo', title: r.para }, r.rotulo),
      h(
        'span',
        { class: 'cartao__acoes' },
        h('button', { type: 'button', class: 'cartao__mover cartao__mover--cima', 'aria-label': `Subir ${r.rotulo}`, title: 'Subir', disabled: i === 0, onclick: () => mover(i, -1) }, '↑'),
        h('button', { type: 'button', class: 'cartao__mover cartao__mover--baixo', 'aria-label': `Descer ${r.rotulo}`, title: 'Descer', disabled: i === R.blocos.length - 1, onclick: () => mover(i, 1) }, '↓'),
        h('button', {
          type: 'button', class: 'cartao__tirar', 'aria-label': `Tirar ${r.rotulo}`, title: 'Tirar este bloco',
          onclick: () => {
            if (!vazio(b) && !confirm(`Tirar este bloco (${r.rotulo})? O que está escrito nele some.`)) return;
            R.blocos.splice(i, 1);
            desenharBlocos();
            mudou();
          },
        }, '×'),
      ),
    ),
    h('div', { class: 'cartao__corpo' }, campos(b)),
  );
}

/** O "+" entre dois blocos: abre o menu, escolhe, entra no lugar. */
/** Os menus abertos pelo "/" num parágrafo: o parágrafo com a barra é trocado pelo bloco escolhido. */
const abrirMenu = new Map<HTMLElement, (substituir: string | null) => void>();

function inseridor(pos: number): HTMLElement {
  const menu = h('div', { class: 'menu-blocos', hidden: true });
  const botao = h('button', { type: 'button', class: 'inseridor__botao', 'aria-expanded': 'false', 'aria-label': 'Adicionar um bloco aqui' }, '+');
  let substituir: string | null = null;
  const fechar = () => { menu.hidden = true; botao.setAttribute('aria-expanded', 'false'); substituir = null; };
  const abrir = (sub: string | null) => {
    for (const m of listaBlocos.querySelectorAll<HTMLElement>('.menu-blocos')) m.hidden = true;
    for (const x of listaBlocos.querySelectorAll('.inseridor__botao')) x.setAttribute('aria-expanded', 'false');
    substituir = sub;
    menu.hidden = false;
    botao.setAttribute('aria-expanded', 'true');
    (menu.querySelector('button') as HTMLElement | null)?.focus();
  };
  botao.addEventListener('click', () => (menu.hidden ? abrir(null) : fechar()));
  menu.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fechar(); botao.focus(); } });
  for (const g of GRUPOS) {
    menu.append(
      h('div', { class: 'menu-blocos__grupo' },
        h('span', { class: 'menu-blocos__nome' }, g.nome),
        ...g.tipos.map((t) =>
          h('button', {
            type: 'button', class: 'menu-blocos__item', title: rotuloDe(t).para,
            onclick: () => {
              const novo = blocoVazio(t);
              const i = substituir ? R.blocos.findIndex((b) => b.id === substituir) : -1;
              if (i >= 0) R.blocos.splice(i, 1, novo);
              else R.blocos.splice(pos, 0, novo);
              desenharBlocos();
              mudou();
              (listaBlocos.querySelector(`[data-bloco="${novo.id}"] textarea, [data-bloco="${novo.id}"] input:not([type=file])`) as HTMLElement | null)?.focus();
            },
          }, rotuloDe(t).rotulo),
        ),
      ),
    );
  }
  const el = h('div', { class: 'inseridor' }, botao, menu);
  abrirMenu.set(el, abrir);
  return el;
}

/* ---------------------------------------------------------------- os campos de cada bloco */

function area(valor: string, placeholder: string, aoMudar: (v: string) => void, o: { mono?: boolean; linhas?: number; classe?: string; rotulo?: string } = {}): HTMLTextAreaElement {
  const el = h('textarea', { class: `campo-doc${o.mono ? ' campo-doc--mono' : ''} ${o.classe ?? ''}`, rows: o.linhas ?? 2, placeholder, 'aria-label': o.rotulo ?? placeholder, value: valor, spellcheck: o.mono ? 'false' : 'true' });
  crescer(el);
  el.addEventListener('focus', () => (areaAtiva = el));
  el.addEventListener('input', () => { aoMudar(el.value); crescer(el); mudou(); });
  if (o.mono) el.addEventListener('keydown', (e) => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); el.setRangeText('  ', el.selectionStart, el.selectionEnd, 'end'); el.dispatchEvent(new Event('input')); } });
  return el;
}

function linha(valor: string, placeholder: string, aoMudar: (v: string) => void, classe = ''): HTMLInputElement {
  const el = h('input', { type: 'text', class: `campo-doc campo-doc--linha ${classe}`, placeholder, 'aria-label': placeholder, value: valor });
  el.addEventListener('focus', () => (areaAtiva = el));
  el.addEventListener('input', () => { aoMudar(el.value); mudou(); });
  return el;
}

function tituloOpcional(b: Bloco, dica: string) {
  return linha(b.titulo ?? '', dica, (v) => (b.titulo = v), 'campo-doc--rotulo');
}

/** Os itens de roteiro, passos e checklist: título — descrição, com + e ×. */
function itensEditaveis(b: Bloco, dicaTitulo: string, dicaTexto: string | null): HTMLElement {
  const caixa = h('div', { class: 'itens' });
  const redesenhar = () => {
    caixa.textContent = '';
    (b.itens ?? []).forEach((it, n) => {
      caixa.append(
        h('div', { class: 'item' },
          h('span', { class: 'item__n' }, String(n + 1)),
          h('div', { class: 'item__campos' },
            linha(it.titulo, dicaTitulo, (v) => (it.titulo = v), 'item__titulo'),
            dicaTexto ? linha(it.texto, dicaTexto, (v) => (it.texto = v)) : null,
          ),
          h('button', { type: 'button', class: 'item__tirar', 'aria-label': 'Tirar este item', onclick: () => { b.itens!.splice(n, 1); redesenhar(); mudou(); } }, '×'),
        ),
      );
    });
    caixa.append(h('button', { type: 'button', class: 'item__mais', onclick: () => { b.itens!.push({ titulo: '', texto: '' }); redesenhar(); mudou(); (caixa.querySelector('.item:last-of-type input') as HTMLElement | null)?.focus(); } }, '+ item'));
  };
  redesenhar();
  return caixa;
}

/** Escolher imagem: reduz, guarda no IndexedDB, mostra a miniatura. */
function campoImagem(atual: Img | null | undefined, definir: (i: Img | null) => void, o: { rotulo: string; semCredito?: boolean }): HTMLElement {
  const caixa = h('div', { class: 'imagem-campo' });
  const redesenhar = async () => {
    caixa.textContent = '';
    const img = atual;
    if (!img) {
      const input = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', class: 'imagem-campo__arquivo', 'aria-label': o.rotulo });
      const status = h('span', { class: 'imagem-campo__status' });
      input.addEventListener('change', async () => {
        const f = input.files?.[0];
        if (!f) return;
        status.textContent = 'Preparando a imagem…';
        try {
          const r = await reduzir(f, { largura: 1600, teto: 580_000 });
          const id = uid();
          await IDB.por(id, r.blob, r.largura, r.altura);
          atual = { id, alt: '', credito: '' }; // vazio = "Foto: <nome do autor>" (creditoDe)
          definir(atual);
          await redesenhar();
          mudou();
          if (r.original < 600) status.textContent = 'A imagem é pequena (menos de 600 px) — no celular vai bem, numa tela grande fica borrada.';
        } catch (e) {
          status.textContent = `Não consegui usar esta imagem: ${(e as Error).message}.`;
        }
      });
      caixa.append(h('label', { class: 'imagem-campo__vazio' }, h('span', {}, o.rotulo), input, h('small', {}, 'Ou cole a foto (Ctrl V) / arraste para o texto. O editor reduz sozinho.')), status);
      return;
    }
    const url = await urlDaImagem(img.id);
    caixa.append(
      h('div', { class: 'imagem-campo__cheio' },
        url ? h('img', { src: url, alt: '' }) : h('span', { class: 'imagem-campo__perdida' }, 'imagem não encontrada neste navegador — escolha de novo'),
        h('div', { class: 'imagem-campo__textos' },
          linha(img.alt, 'O que a foto mostra — ex.: o menu de parâmetros do inversor', (v) => (img.alt = v)),
          // o crédito é opcional: vazio, vale "Foto: <o seu nome>"; só se escreve quando a foto é de outra pessoa
          o.semCredito ? null : linha(img.credito, `Crédito (se vazio: Foto: ${R.autor.nome.trim() || 'o seu nome'})`, (v) => (img.credito = v), 'campo-doc--secundario'),
          h('button', { type: 'button', class: 'botao-texto', onclick: () => { atual = null; definir(null); redesenhar(); mudou(); } }, 'Trocar imagem'),
        ),
      ),
    );
  };
  void redesenhar();
  return caixa;
}

function campos(b: Bloco): Node {
  const para = rotuloDe(b.tipo).para;
  switch (b.tipo) {
    case 'paragrafo': {
      const el = area(b.texto ?? '', 'Escreva aqui…  ( / abre os blocos )', (v) => (b.texto = v), { classe: 'campo-doc--obra', linhas: 2, rotulo: 'Parágrafo' });
      // "/" sozinho num parágrafo abre o menu de blocos ali mesmo, como nos editores de hoje
      el.addEventListener('input', () => {
        if (el.value.trim() !== '/') return;
        const ins = el.closest('[data-bloco]')?.previousElementSibling as HTMLElement | null;
        if (ins) abrirMenu.get(ins)?.(b.id);
      });
      return el;
    }
    case 'subtitulo':
      // sem seletor de nível: ele cortava o subtítulo e quase ninguém usava — subtítulo é seção
      // campo que quebra a linha: subtítulo comprido era cortado no celular (a quebra some no texto: umaLinha)
      return area(b.texto ?? '', 'Subtítulo', (v) => (b.texto = v), { linhas: 1, classe: b.nivel === 3 ? 'campo-doc--h3' : 'campo-doc--h2', rotulo: 'Subtítulo' });
    case 'lista': case 'numerada':
      return area(b.texto ?? '', 'Um item por linha', (v) => (b.texto = v), { linhas: 3 });
    case 'citacao':
      return area(b.texto ?? '', '“O que foi dito” — quem disse', (v) => (b.texto = v));
    case 'imagem':
      return campoImagem(b.img, (i) => (b.img = i), { rotulo: 'Escolher imagem' });
    case 'codigo':
      return h('div', { class: 'grade-campos' },
        h('div', { class: 'grade-campos__linha' }, linha(b.linguagem ?? '', 'Linguagem (st, python, c…)', (v) => (b.linguagem = v)), linha(b.titulo ?? '', 'Título opcional', (v) => (b.titulo = v))),
        area(b.texto ?? '', 'O código', (v) => (b.texto = v), { mono: true, linhas: 5 }));
    case 'terminal':
      return h('div', { class: 'grade-campos' }, linha(b.titulo ?? '', 'Título opcional (ex.: ping no CLP)', (v) => (b.titulo = v)), area(b.texto ?? '', '$ comando\nsaída do comando', (v) => (b.texto = v), { mono: true, linhas: 4 }));
    case 'tabela':
      return tabelaEditavel(b);
    case 'roteiro':
      return h('div', { class: 'grade-campos' }, tituloOpcional(b, 'Título (padrão: O roteiro)'), itensEditaveis(b, 'Etapa', 'O que se faz nela'));
    case 'passos':
      return h('div', { class: 'grade-campos' }, tituloOpcional(b, 'Título (padrão: Passo a passo)'), itensEditaveis(b, 'O passo', 'Detalhe do passo'));
    case 'checklist':
      return h('div', { class: 'grade-campos' }, tituloOpcional(b, 'Título (ex.: O que você conquistou)'), itensEditaveis(b, 'Item', null));
    case 'armadilhas':
      return armadilhasEditaveis(b);
    case 'proscontras':
      return h('div', { class: 'grade-campos' },
        linha(b.titulo ?? '', 'Sobre o quê (ex.: Modbus RTU)', (v) => (b.titulo = v)),
        h('div', { class: 'grade-campos__linha' },
          area(b.pro ?? '', 'A favor — um por linha', (v) => (b.pro = v), { linhas: 3, classe: 'campo-doc--pro' }),
          area(b.contra ?? '', 'Contra — um por linha', (v) => (b.contra = v), { linhas: 3, classe: 'campo-doc--contra' })));
    case 'antesdepois':
      return h('div', { class: 'grade-campos__linha' },
        campoImagem(b.antes, (i) => (b.antes = i), { rotulo: 'Imagem do antes', semCredito: true }),
        campoImagem(b.depois, (i) => (b.depois = i), { rotulo: 'Imagem do depois', semCredito: true }));
    case 'formula':
      return formulaEditavel(b);
    case 'arvore':
      return h('div', { class: 'grade-campos' }, linha(b.titulo ?? '', 'Pasta raiz (ex.: projeto-clp)', (v) => (b.titulo = v)), area(b.texto ?? '', 'pasta/\n  arquivo.st  // comentário *', (v) => (b.texto = v), { mono: true, linhas: 4 }), h('small', { class: 'dica-campo' }, 'Dois espaços por nível · pasta termina em / · comentário depois de // · * no fim destaca'));
    case 'frase':
      return h('div', { class: 'grade-campos' }, area(b.texto ?? '', 'A frase', (v) => (b.texto = v), { classe: 'campo-doc--frase' }), linha(b.autoria ?? '', 'Quem disse (opcional)', (v) => (b.autoria = v)), campoImagem(b.img, (i) => (b.img = i), { rotulo: 'Imagem de fundo (opcional)', semCredito: true }));
    case 'quiz':
      return quizEditavel(b);
    case 'dica': case 'atencao': case 'perigo': case 'nota': case 'curiosidade':
      return h('div', { class: 'grade-campos' }, tituloOpcional(b, `Título (padrão: ${rotuloDe(b.tipo).rotulo})`), area(b.texto ?? '', para, (v) => (b.texto = v)));
    default:
      return area(b.texto ?? '', para, (v) => (b.texto = v), { linhas: 3 });
  }
}

function tabelaEditavel(b: Bloco): HTMLElement {
  const caixa = h('div', { class: 'tabela-campo' });
  const redesenhar = () => {
    caixa.textContent = '';
    const linhas = b.linhas!;
    const tabela = h('table', {},
      h('tbody', {}, ...linhas.map((l, i) =>
        h('tr', {}, ...l.map((c, j) => {
          const el = h('input', { type: 'text', class: `tabela-campo__celula${i === 0 ? ' tabela-campo__celula--cabeca' : ''}`, value: c, 'aria-label': `Linha ${i + 1}, coluna ${j + 1}`, placeholder: i === 0 ? 'Cabeçalho' : '' });
          el.addEventListener('focus', () => (areaAtiva = el));
          el.addEventListener('input', () => { linhas[i]![j] = el.value; mudou(); });
          return h('td', {}, el);
        })))));
    caixa.append(
      h('div', { class: 'tabela-campo__rolar' }, tabela),
      h('p', { class: 'tabela-campo__acoes' },
        h('button', { type: 'button', class: 'botao-texto', onclick: () => { linhas.push(linhas[0]!.map(() => '')); redesenhar(); mudou(); } }, '+ linha'),
        h('button', { type: 'button', class: 'botao-texto', onclick: () => { linhas.forEach((l) => l.push('')); redesenhar(); mudou(); } }, '+ coluna'),
        h('button', { type: 'button', class: 'botao-texto', disabled: linhas.length <= 2, onclick: () => { linhas.pop(); redesenhar(); mudou(); } }, '− linha'),
        h('button', { type: 'button', class: 'botao-texto', disabled: linhas[0]!.length <= 2, onclick: () => { linhas.forEach((l) => l.pop()); redesenhar(); mudou(); } }, '− coluna'),
        h('small', { class: 'dica-campo' }, 'A primeira linha é o cabeçalho · (sim) (não) (parcial) ganham cor'),
      ),
    );
  };
  redesenhar();
  return caixa;
}

function armadilhasEditaveis(b: Bloco): HTMLElement {
  const caixa = h('div', { class: 'grade-campos' });
  const redesenhar = () => {
    caixa.textContent = '';
    caixa.append(tituloOpcional(b, 'Título (ex.: Top 5 armadilhas)'));
    b.armadilhas!.forEach((a, n) => {
      caixa.append(
        h('div', { class: 'item item--armadilha' },
          h('span', { class: 'item__n' }, String(n + 1).padStart(2, '0')),
          h('div', { class: 'item__campos' },
            linha(a.titulo, 'O erro (ex.: A leitura volta sempre zero)', (v) => (a.titulo = v), 'item__titulo'),
            linha(a.texto, 'O que acontece e por quê', (v) => (a.texto = v)),
            linha(a.evitar, 'Como evitar', (v) => (a.evitar = v), 'campo-doc--evitar'),
          ),
          h('button', { type: 'button', class: 'item__tirar', 'aria-label': 'Tirar esta armadilha', onclick: () => { b.armadilhas!.splice(n, 1); redesenhar(); mudou(); } }, '×'),
        ),
      );
    });
    caixa.append(h('button', { type: 'button', class: 'item__mais', onclick: () => { b.armadilhas!.push({ titulo: '', texto: '', evitar: '' }); redesenhar(); mudou(); } }, '+ armadilha'));
  };
  redesenhar();
  return caixa;
}

function formulaEditavel(b: Bloco): HTMLElement {
  const amostra = h('div', { class: 'formula-campo__amostra', 'aria-live': 'polite' });
  const desenhar = () => {
    const tex = (b.tex ?? '').trim();
    if (!tex) { amostra.textContent = 'A fórmula aparece aqui enquanto você escreve.'; return; }
    try {
      amostra.innerHTML = katex.renderToString(tex, { output: 'mathml', displayMode: true, throwOnError: true });
    } catch (e) {
      amostra.textContent = `Ainda não entendi a fórmula: ${(e as Error).message.replace(/^KaTeX parse error: /, '')}`;
    }
  };
  desenhar();
  const tex = linha(b.tex ?? '', 'A fórmula em TeX — ex.: V = \\frac{I - 4}{16}', (v) => { b.tex = v; desenhar(); }, 'campo-doc--mono');
  return h('div', { class: 'grade-campos' },
    linha(b.titulo ?? '', 'O que a fórmula calcula (ex.: Escala de 4–20 mA)', (v) => (b.titulo = v)),
    tex,
    amostra,
    h('small', { class: 'dica-campo' }, 'Fração: \\frac{a}{b} · índice: V_{max} · potência: x^2 · multiplicação: \\cdot · raiz: \\sqrt{x}'),
    area(b.explica ?? '', 'Onde: cada letra e o que ela significa (use lista com -)', (v) => (b.explica = v), { linhas: 3 }),
    linha(b.resultado ?? '', 'Um exemplo resolvido (ex.: Com 12 mA: V = 250 °C)', (v) => (b.resultado = v)),
  );
}

function quizEditavel(b: Bloco): HTMLElement {
  /* O mais direto possível: a pergunta, a resposta certa e as erradas — sem
     marcar rádio. A certa fica sempre no primeiro campo aqui; no texto
     publicado, `embaralhar` a põe numa posição que muda de pergunta a pergunta. */
  const caixa = h('div', { class: 'grade-campos' });
  for (const q of b.questoes ?? []) {
    const certa = q.opcoes.findIndex((o) => o.certa);
    if (certa > 0) q.opcoes.unshift(...q.opcoes.splice(certa, 1)); // rascunho antigo: a certa vai para o primeiro campo
    q.opcoes.forEach((o, k) => (o.certa = k === 0));
  }
  const redesenhar = () => {
    caixa.textContent = '';
    caixa.append(h('small', { class: 'dica-campo' }, 'Uma a cinco perguntas sobre o que o artigo ensinou. O site embaralha as respostas.'));
    b.questoes!.forEach((q, n) => {
      caixa.append(
        h('div', { class: 'questao-campo' },
          h('span', { class: 'questao-campo__n' }, `Pergunta ${n + 1}`),
          linha(q.pergunta, 'A pergunta', (v) => (q.pergunta = v), 'item__titulo'),
          ...q.opcoes.map((o, k) =>
            h('div', { class: `questao-campo__opcao questao-campo__opcao--${k === 0 ? 'certa' : 'errada'}` },
              h('span', { class: 'questao-campo__marca', 'aria-hidden': 'true' }, k === 0 ? '✓' : '✕'),
              linha(o.texto, k === 0 ? 'A resposta certa' : 'Uma resposta errada (mas plausível)', (v) => (o.texto = v)),
              k > 1 ? h('button', { type: 'button', class: 'item__tirar', 'aria-label': 'Tirar esta resposta', onclick: () => { q.opcoes.splice(k, 1); redesenhar(); mudou(); } }, '×') : h('span', {}),
            )),
          h('p', { class: 'questao-campo__acoes' },
            h('button', { type: 'button', class: 'botao-texto', disabled: q.opcoes.length >= 5, onclick: () => { q.opcoes.push({ texto: '', certa: false }); redesenhar(); mudou(); } }, '+ errada'),
            b.questoes!.length > 1 ? h('button', { type: 'button', class: 'botao-texto', onclick: () => { b.questoes!.splice(n, 1); redesenhar(); mudou(); } }, 'tirar pergunta') : null),
          linha(q.explica, 'Por que a certa é a certa — opcional, aparece depois da resposta', (v) => (q.explica = v), 'campo-doc--secundario'),
        ),
      );
    });
    caixa.append(h('button', { type: 'button', class: 'item__mais', disabled: b.questoes!.length >= 5, onclick: () => { b.questoes!.push(questaoVazia()); redesenhar(); mudou(); } }, '+ pergunta'));
  };
  redesenhar();
  return caixa;
}

/* ---------------------------------------------------------------- a prévia */

function palavras(md: string) {
  return md.replace(/[:#>*_`|[\]{}()$+-]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
}

async function desenharPrevia() {
  const md = serializar();
  const nomes = new Map(imagensUsadas().map((i) => [nomeImg(i), i.id]));
  for (const id of nomes.values()) await urlDaImagem(id);
  const r = converterObra(md, {
    tex: (f, emBloco) => {
      try {
        return katex.renderToString(f, { output: 'mathml', displayMode: emBloco, throwOnError: true });
      } catch {
        return `<code>${f.replace(/</g, '&lt;')}</code>`;
      }
    },
    imagem: (arquivo) => urls.get(nomes.get(arquivo) ?? '') ?? '',
  });
  const n = palavras(md);
  contador.textContent = `${n} palavras · ${Math.max(1, Math.round(n / 200))} min de leitura`;

  const p = DADOS.pauta && R.pauta === DADOS.pauta.slug ? DADOS.pauta : null;
  const artigo = h('article', { class: 'peca', 'data-secao': 'artigos' },
    h('header', { class: 'peca__cabeca' },
      h('div', { class: 'etiquetas' }, h('span', { class: 'kicker kicker--dot' }, `${R.meta.formato ? DADOS.formatos[R.meta.formato] : 'Artigo'}`)),
      h('h1', { class: 'peca__titulo' }, R.meta.titulo || 'O título do artigo'),
      h('p', { class: 'peca__lead' }, R.meta.lead || 'A linha fina aparece aqui.'),
      h('div', { class: 'assinatura' },
        h('span', { class: 'assinatura__autor' }, R.autor.nome || 'O seu nome'),
        h('span', { class: 'u-dado' }, new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })),
        h('span', {}, `${Math.max(1, Math.round(n / 200))} min de leitura`),
        R.meta.nivel ? h('span', {}, `Nível ${DADOS.niveis[R.meta.nivel].toLowerCase()}`) : null),
      p?.serie ? h('p', { class: 'serie-faixa' }, h('span', {}, h('span', { class: 'serie-faixa__titulo' }, `Série ${p.serie.titulo}`), ` · parte ${p.serie.parte} de ${p.serie.partes}`)) : null,
    ),
  );
  const obra = h('div', { class: 'obra' });
  obra.innerHTML = r.html || '<p class="previa__vazia">O texto aparece aqui enquanto você escreve.</p>';
  artigo.append(h('div', { class: 'peca__corpo' }, obra));
  painelPrevia.textContent = '';
  painelPrevia.append(h('p', { class: 'previa__rotulo' }, 'Como vai ficar no site'), artigo);
}

/* ---------------------------------------------------------------- a conferência */

type Achado = { nivel: 'erro' | 'aviso'; texto: string };

function conferir(): { achados: Achado[]; md: string } {
  const md = serializar();
  const r = converterObra(md);
  // os erros de imagem do renderizador falam a língua do markdown; aqui vão os
  // mesmos, ditos para quem está no editor (logo abaixo)
  const a: Achado[] = r.erros.filter((e) => !/^imagem "img-/.test(e)).map((texto) => ({ nivel: 'erro' as const, texto }));
  if (R.meta.titulo.trim().length < 10) a.push({ nivel: 'erro', texto: 'Falta o título (pelo menos 10 letras).' });
  if (R.meta.lead.trim().length < 20) a.push({ nivel: 'erro', texto: 'Falta a linha fina — uma frase logo abaixo do título.' });
  if (!R.meta.formato) a.push({ nivel: 'erro', texto: 'Escolha o formato: guia, conceito ou "o que eu fiz".' });
  if (!R.meta.nivel) a.push({ nivel: 'erro', texto: 'Escolha o nível: iniciante, intermediário ou avançado.' });
  const n = palavras(md);
  if (md.length < 300) a.push({ nivel: 'erro', texto: 'O texto ainda está curto demais para enviar.' });
  else if (n < 250) a.push({ nivel: 'aviso', texto: `${n} palavras — curto pode (um bom passo a passo com fotos cabe em 400), mas confira se falta alguma seção.` });
  if (!r.blocos.includes('quiz')) a.push({ nivel: 'aviso', texto: 'Sem quiz no fim. Três perguntas bastam — é a marca do Instituto.' });
  if (!r.blocos.includes('resumo')) a.push({ nivel: 'aviso', texto: 'Sem resumo rápido no alto. Quem tem um minuto lê só ele.' });
  const vazios = R.blocos.filter(vazio).filter((b) => b.tipo !== 'paragrafo');
  if (vazios.length) a.push({ nivel: 'aviso', texto: `${vazios.length} bloco(s) vazio(s) — não vão no texto: ${[...new Set(vazios.map((b) => rotuloDe(b.tipo).rotulo))].join(', ')}.` });
  for (const b of R.blocos) for (const i of [b.img, b.antes, b.depois]) if (i && !i.alt.trim()) a.push({ nivel: 'erro', texto: 'Uma foto está sem a frase do que ela mostra.' });
  return { achados: [...new Map(a.map((x) => [x.texto, x])).values()], md };
}

function atualizarConferencia() {
  const { achados } = conferir();
  conferencia.textContent = '';
  const erros = achados.filter((x) => x.nivel === 'erro');
  const avisos = achados.filter((x) => x.nivel === 'aviso');
  conferencia.dataset.estado = erros.length ? 'erro' : avisos.length ? 'aviso' : 'ok';
  conferencia.append(
    h('p', { class: 'conferencia__titulo' }, erros.length ? `Falta ${erros.length} coisa(s) para poder enviar` : avisos.length ? 'Pode enviar — mas dê uma olhada' : 'Tudo certo para enviar'),
  );
  if (achados.length) conferencia.append(h('ul', {}, ...achados.map((x) => h('li', { class: `conferencia__${x.nivel}` }, x.texto))));
  const botao = document.getElementById('enviar-artigo') as HTMLButtonElement | null;
  if (botao) botao.disabled = erros.length > 0 || !autorOk().ok;
}

/* ---------------------------------------------------------------- enviar */

function autorOk(): { ok: boolean; falta: string[] } {
  const a = R.autor;
  const falta: string[] = [];
  if (a.nome.trim().split(/\s+/).length < 2) falta.push('nome e sobrenome');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email.trim())) falta.push('um e-mail válido');
  if (a.bio.trim().length < 40) falta.push('a bio (40 letras ou mais)');
  if (a.link.trim() && !/^https?:\/\//.test(a.link.trim())) falta.push('o link começando com https://');
  const c = R.consentimentos;
  if (!c.autoria || !c.imagens || !c.privacidade) falta.push('a confirmação do fim');
  return { ok: falta.length === 0, falta };
}

function desenharEnviar() {
  painelEnviar.textContent = '';
  const a = R.autor;
  const campo = (rotulo: string, el: HTMLElement, nota?: string) => h('label', { class: 'campo-rotulo' }, h('span', {}, rotulo), el, nota ? h('small', {}, nota) : null);
  const entrada = (chave: keyof Autor, tipo: string, extra: Record<string, unknown> = {}) => {
    const el = h('input', { type: tipo, class: 'campo', value: (a[chave] as string) ?? '', ...extra });
    el.addEventListener('input', () => { (a[chave] as string) = el.value; salvar(); atualizarConferencia(); atualizarFalta(); });
    return el;
  };
  const bio = h('textarea', { class: 'campo', rows: 3, maxlength: 1200, value: a.bio, placeholder: 'Técnico em automação há 12 anos, hoje integrador em Curitiba. Programo CLP Siemens e WEG e dou aula no SENAI.' });
  bio.addEventListener('input', () => { a.bio = bio.value; salvar(); atualizarConferencia(); atualizarFalta(); });

  const foto = h('div', { class: 'foto-campo' });
  const desenharFoto = async () => {
    foto.textContent = '';
    const url = a.foto ? await urlDaImagem(a.foto) : null;
    const input = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', 'aria-label': 'Sua foto' });
    input.addEventListener('change', async () => {
      const f = input.files?.[0];
      if (!f) return;
      const r = await reduzir(f, { largura: 480, teto: 190_000, quadrada: true });
      const id = uid();
      await IDB.por(id, r.blob, r.largura, r.altura);
      a.foto = id;
      salvar();
      desenharFoto();
    });
    foto.append(
      url ? h('img', { src: url, alt: 'A sua foto', class: 'foto-campo__img' }) : h('span', { class: 'foto-campo__vazia', 'aria-hidden': 'true' }, (a.nome.trim()[0] ?? '?').toUpperCase()),
      h('span', { class: 'foto-campo__texto' }, h('strong', {}, 'Foto (opcional)'), h('small', {}, 'Vai recortada em quadrado. Sem foto, a página mostra as suas iniciais.'), input),
    );
  };
  void desenharFoto();

  /* UMA confirmação cobre as três (autoria, imagens, privacidade): o servidor
     continua recebendo e conferindo as três, mas o autor marca uma vez. */
  const c = R.consentimentos;
  const confirma = h('input', { type: 'checkbox', checked: c.autoria && c.imagens && c.privacidade });
  confirma.addEventListener('change', () => {
    c.autoria = c.imagens = c.privacidade = confirma.checked;
    salvar();
    atualizarConferencia();
    atualizarFalta();
  });
  const selecionar = <K extends 'formato' | 'nivel'>(chave: K, opcoes: Record<string, string>, rotulo: string) =>
    h('label', { class: 'campo-rotulo' }, h('span', {}, rotulo),
      h('select', { class: 'campo', onchange: (e: Event) => { R.meta[chave] = (e.target as HTMLSelectElement).value as Rascunho['meta'][K]; mudou(); } },
        ...Object.entries(opcoes).map(([k, v]) => h('option', { value: k, selected: R.meta[chave] === k }, v))));
  const jaConhecido = a.nome.trim().split(/\s+/).length >= 2 && /@/.test(a.email) && a.bio.trim().length >= 40;

  const falta = h('p', { class: 'enviar__falta', 'aria-live': 'polite' });
  const atualizarFalta = () => {
    const { falta: f } = autorOk();
    falta.textContent = f.length ? `Para enviar, falta: ${f.join(', ')}.` : '';
  };
  const resultado = h('div', { class: 'enviar__resultado', 'aria-live': 'polite' });
  const botao = h('button', { type: 'button', id: 'enviar-artigo', class: 'botao-acao', onclick: () => enviar(botao, resultado) }, 'Enviar para o editor');

  // quem já escreveu antes não preenche de novo: o autor fica guardado neste navegador
  const quem = h('details', { class: 'enviar__quem', open: !jaConhecido },
    h('summary', {}, jaConhecido ? h('span', {}, 'Assina: ', h('strong', {}, a.nome), ' · trocar') : h('strong', {}, 'Quem assina')),
    h('p', { class: 'enviar__nota' }, 'Vai na sua página de autor. O e-mail não aparece em lugar nenhum — é só para o editor responder.'),
    campo('Nome e sobrenome *', entrada('nome', 'text', { autocomplete: 'name', maxlength: 120 })),
    campo('E-mail *', entrada('email', 'email', { autocomplete: 'email', maxlength: 200 })),
    campo('Quem você é, em duas frases *', bio, 'Ex.: o que você faz e onde. Vai na sua página.'),
    h('details', { class: 'enviar__mais' },
      h('summary', {}, 'Mais sobre você (opcional): o que faz, link do currículo, foto'),
      campo('O que você faz', entrada('papel', 'text', { maxlength: 80, placeholder: 'Engenheiro de automação, técnico, integrador…' })),
      campo('Link do currículo', entrada('link', 'url', { maxlength: 300, placeholder: 'https://www.linkedin.com/in/…' }), 'LinkedIn, Lattes ou site.'),
      foto,
    ),
  );

  painelEnviar.append(
    h('div', { class: 'enviar' },
      h('div', { class: 'enviar__coluna' },
        quem,
        h('div', { class: 'grade-campos__linha' }, selecionar('formato', DADOS.formatos, 'Formato'), selecionar('nivel', DADOS.niveis, 'Nível')),
      ),
      h('div', { class: 'enviar__coluna' },
        conferencia,
        h('label', { class: 'confirma' }, confirma, h('span', {}, 'Escrevi este texto (não foi gerado por máquina), as fotos são minhas ou autorizadas, e concordo com o uso dos meus dados para publicá-lo. ', h('a', { href: '/privacidade', target: '_blank' }, 'Privacidade'))),
        falta,
        h('p', { class: 'enviar__acoes' }, botao, h('button', { type: 'button', class: 'botao-secundario', onclick: () => baixarMd() }, 'Baixar o .md')),
        resultado,
        h('p', { class: 'enviar__nota' }, 'O que acontece depois: uma pessoa lê, responde no seu e-mail (às vezes com perguntas ou ajustes) e publica com o seu nome. Nada vai ao ar sozinho.'),
      ),
    ),
  );
  if (R.enviado) mostrarEnviado(resultado, R.enviado.protocolo);
  atualizarConferencia();
  atualizarFalta();
}

async function enviar(botao: HTMLButtonElement, resultado: HTMLElement) {
  const { achados, md } = conferir();
  if (achados.some((a) => a.nivel === 'erro') || !autorOk().ok) return;
  botao.disabled = true;
  botao.textContent = 'Enviando…';
  resultado.textContent = '';
  try {
    const f = new FormData();
    f.append('dados', JSON.stringify({ pauta: R.pauta, meta: R.meta, autor: { ...R.autor, foto: !!R.autor.foto }, consentimentos: R.consentimentos }));
    f.append('markdown', md);
    for (const img of imagensUsadas()) {
      const r = await IDB.ler(img.id);
      if (!r) throw new Error(`a imagem "${img.alt || img.id}" não está mais neste navegador — escolha de novo`);
      f.append(nomeImg(img), new File([r.blob], nomeImg(img), { type: 'image/jpeg' }));
    }
    if (R.autor.foto) {
      const r = await IDB.ler(R.autor.foto);
      if (r) f.append('foto.jpg', new File([r.blob], 'foto.jpg', { type: 'image/jpeg' }));
    }
    const resp = await fetch('/escrever/enviar', { method: 'POST', body: f });
    const j = (await resp.json().catch(() => ({ ok: false, erro: `o servidor respondeu ${resp.status}` }))) as { ok: boolean; protocolo?: string; erro?: string };
    if (!j.ok || !j.protocolo) throw new Error(j.erro ?? 'não deu certo');
    R.enviado = { protocolo: j.protocolo, em: new Date().toISOString() };
    salvarJa();
    mostrarEnviado(resultado, j.protocolo);
  } catch (e) {
    resultado.append(h('div', { class: 'aviso' }, h('strong', {}, 'Não foi desta vez. '), `${(e as Error).message}. O rascunho continua salvo aqui.`));
  } finally {
    botao.disabled = false;
    botao.textContent = 'Enviar para o editor';
    atualizarConferencia();
  }
}

function mostrarEnviado(resultado: HTMLElement, protocolo: string) {
  resultado.textContent = '';
  resultado.append(
    h('div', { class: 'enviado' },
      h('p', { class: 'enviado__titulo' }, 'Recebido.'),
      h('p', {}, 'O seu protocolo é ', h('strong', { class: 'u-dado' }, protocolo), '. Uma pessoa lê e responde no seu e-mail — não é resposta automática, então pode levar uns dias.'),
      h('p', {}, 'Se mudar alguma coisa, é só editar e enviar de novo: a versão mais nova vale.'),
    ),
  );
}

/** A saída de emergência: o artigo em arquivo, com o frontmatter do site. */
function baixarMd() {
  const f = [
    '---',
    `titulo:    "${R.meta.titulo.replace(/"/g, "'")}"`,
    'secao:     artigos',
    `formato:   ${R.meta.formato || 'guia'}`,
    'tema:      industria',
    `nivel:     ${R.meta.nivel || 'intermediario'}`,
    R.pauta ? `pauta:     ${R.pauta}` : null,
    `lead:      "${R.meta.lead.replace(/"/g, "'")}"`,
    `autor:     ${R.autor.nome || 'PREENCHER'}`,
    `data:      ${new Date().toISOString().slice(0, 10)}`,
    '---',
    '',
    serializar(),
    '',
  ].filter((l) => l !== null).join('\n');
  const a = h('a', { href: URL.createObjectURL(new Blob([f], { type: 'text/markdown' })), download: `${(R.meta.titulo || 'artigo').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'artigo'}.md` });
  document.body.append(a);
  a.click();
  a.remove();
}

/* ================================================================ começa */

montar();
salvarJa();
window.addEventListener('beforeunload', salvarJa);
