/**
 * O markdown do corpo da obra — e o dialeto de blocos do artigo.
 *
 * Nasceu mínimo (parágrafo, título, ênfase, link, lista, citação, regra)
 * porque o corpo chegava pelo WhatsApp. Em 24/09/2026 o sócio mandou o
 * "Padrão Artigo Instituto" — um tutorial em HTML com vinte recursos de
 * didática: resumo rápido, avisos, roteiro, código, fórmula, passo a passo,
 * armadilhas, antes e depois, tabela comparativa, quiz. O Pedro prometeu na
 * reunião que o artigo seguiria esse padrão "100%", escrito num editor que
 * parece um documento. Este arquivo é o padrão em forma de texto.
 *
 * O dialeto é markdown comum mais três coisas:
 *
 *   :::tipo argumento          um bloco, fechado por uma linha só com :::
 *   ```linguagem título        código (```terminal para saída de terminal)
 *   | a | b |                  tabela, com (sim) (não) (parcial) coloridos
 *
 * e, dentro da linha, [[Ctrl]] para tecla e {{termo|definição}} para o termo
 * explicado sem sair do texto. A lista completa, com exemplo de cada um, está
 * em BLOCOS (abaixo) e é publicada em /escrever/blocos.
 *
 * O mesmo código roda em três lugares: no Worker (página da peça), no
 * compilador (que aborta com os `erros`) e no navegador (a prévia do editor
 * em /escrever/editor). Por isso não importa nada de Node nem de DOM — a
 * prévia do editor é exatamente o que a página vai mostrar, porque é a
 * mesma função.
 *
 * ⚠️ A ORDEM É A SEGURANÇA. O texto é escapado ANTES de qualquer conversão.
 * Depois disso não existe mais `<` nem `>` vindos do autor, e a marcação que
 * geramos é a única que sobra. Escapar depois seria o mesmo que não escapar.
 * A única saída que não é nossa é a da fórmula, e ela vem do KaTeX, que
 * escapa o que recebe.
 */

export type Opcoes = {
  /** TeX → HTML (MathML). Sem ele, a fórmula sai como código, legível do mesmo jeito. */
  tex?: (fonte: string, emBloco: boolean) => string;
  /** o endereço de uma imagem do corpo. Padrão: /imagens/<arquivo>. O editor troca pela prévia local. */
  imagem?: (arquivo: string) => string;
  /** largura e altura da imagem, para a página não pular quando ela carrega (CLS) */
  medidas?: (arquivo: string) => { largura: number; altura: number } | null;
};

export type Resultado = {
  html: string;
  /** o que não dá para publicar assim — o compilador aborta, o editor mostra */
  erros: string[];
  /** os tipos de bloco usados, na ordem — o compilador confere, por exemplo, se o artigo tem quiz */
  blocos: string[];
  /** as imagens citadas no corpo (nome do arquivo) — o compilador confere se existem */
  imagens: string[];
};

/* ------------------------------------------------------------- o catálogo */

export type TipoBloco =
  | 'resumo'
  | 'aprender'
  | 'dica'
  | 'atencao'
  | 'perigo'
  | 'nota'
  | 'curiosidade'
  | 'margem'
  | 'roteiro'
  | 'passos'
  | 'checklist'
  | 'armadilhas'
  | 'proscontras'
  | 'antesdepois'
  | 'formula'
  | 'arvore'
  | 'frase'
  | 'quiz'
  | 'recursos'
  | 'notadoautor';

/**
 * Os blocos, com o rótulo que o leitor vê e a sintaxe que o autor (ou o
 * editor visual) escreve. É daqui que sai o guia público — um lugar só
 * descreve o dialeto, para o guia nunca contradizer o renderizador.
 */
export const BLOCOS: Record<TipoBloco, { rotulo: string; para: string; exemplo: string }> = {
  resumo: {
    rotulo: 'Resumo rápido',
    para: 'O artigo inteiro em quatro linhas, no alto. Quem só tem um minuto lê isto e sabe se vale seguir.',
    exemplo: ':::resumo\nVamos ler a temperatura de um inversor pela rede e mostrar no celular:\n- conectar o inversor na rede Modbus TCP\n- achar o registrador certo no manual\n- ler o valor a cada 2 segundos\n:::',
  },
  aprender: {
    rotulo: 'O que você vai aprender',
    para: 'A promessa do artigo, em uma ou duas frases. Vem logo depois do resumo.',
    exemplo: ':::aprender\nA achar qualquer dado de um equipamento Modbus sem software do fabricante — do manual ao número na tela.\n:::',
  },
  dica: {
    rotulo: 'Dica',
    para: 'O atalho que quem já fez conhece. Título opcional depois do tipo.',
    exemplo: ':::dica\nComece só lendo. Escrever no equipamento fica para depois que a leitura estiver certa.\n:::',
  },
  atencao: {
    rotulo: 'Atenção',
    para: 'O que costuma dar errado se o leitor pular.',
    exemplo: ':::atencao\nConfira se o endereço no manual começa em 0 ou em 1. Metade dos erros de leitura é isso.\n:::',
  },
  perigo: {
    rotulo: 'Cuidado',
    para: 'Risco de verdade: choque, máquina em movimento, perda de dado, equipamento queimado.',
    exemplo: ':::perigo Máquina energizada\nNunca escreva num registrador de comando com a máquina em operação sem saber o que ele aciona.\n:::',
  },
  nota: {
    rotulo: 'Nota',
    para: 'Uma observação que ajuda, mas que o texto não precisa para seguir.',
    exemplo: ':::nota\n2 segundos é um bom equilíbrio entre atualização e carga na rede.\n:::',
  },
  curiosidade: {
    rotulo: 'Curiosidade',
    para: 'A história por trás. Deixa o texto humano sem atrapalhar quem quer só o passo.',
    exemplo: ':::curiosidade\nO Modbus foi publicado pela Modicon em 1979 e continua sendo o protocolo mais usado na indústria.\n:::',
  },
  margem: {
    rotulo: 'Nota de margem',
    para: 'Um comentário curto, ao lado do raciocínio — o que você diria em voz baixa.',
    exemplo: ':::margem\nSe o equipamento for antigo, ele provavelmente só fala RS-485. Um conversor resolve.\n:::',
  },
  roteiro: {
    rotulo: 'Roteiro',
    para: 'O caminho do artigo em etapas, antes de começar. Uma etapa por linha: título — descrição.',
    exemplo: ':::roteiro\n- Preparar a rede — cabo, IP fixo e um teste de ping\n- Achar o registrador — o mapa de memória do manual\n- Ler o valor — com um programa gratuito, antes do app\n:::',
  },
  passos: {
    rotulo: 'Passo a passo',
    para: 'Passos que o leitor marca conforme faz. O contador sobe sozinho, sem nada instalado.',
    exemplo: ':::passos\n- Ligar o inversor na rede — cabo direto no switch\n- Configurar o IP — parâmetro de comunicação no painel\n- Testar a leitura — registrador 40001 no programa de teste\n:::',
  },
  checklist: {
    rotulo: 'Checklist',
    para: 'O que o leitor tem nas mãos no fim. Bom para fechar o artigo.',
    exemplo: ':::checklist O que você conquistou\n- Inversor respondendo na rede\n- Temperatura lida a cada 2 segundos\n:::',
  },
  armadilhas: {
    rotulo: 'Armadilhas',
    para: 'Os erros que quase todo mundo comete. Cada um com título, o que acontece e como evitar.',
    exemplo: ':::armadilhas Top 3 armadilhas\n### A leitura volta sempre zero\nO endereço está deslocado em uma posição.\nComo evitar: some ou tire 1 do endereço do manual e teste de novo.\n### O equipamento não responde\nO ID do escravo não bate.\nComo evitar: confira o parâmetro de ID no painel — o padrão costuma ser 1.\n:::',
  },
  proscontras: {
    rotulo: 'Prós e contras',
    para: 'Os dois lados de uma escolha. + para o que é a favor, - para o que é contra.',
    exemplo: ':::proscontras Modbus RTU\n+ Barato e simples\n+ Quase todo equipamento fala\n- Lento para muitos pontos\n- Não diz o que cada registrador é\n:::',
  },
  antesdepois: {
    rotulo: 'Antes e depois',
    para: 'Duas imagens lado a lado: como estava e como ficou.',
    exemplo: ':::antesdepois\nantes: painel-antes.jpg | O painel com fiação solta\ndepois: painel-depois.jpg | O mesmo painel organizado em canaletas\n:::',
  },
  formula: {
    rotulo: 'Fórmula',
    para: 'A conta, escrita direito, com o que cada letra significa e um exemplo resolvido. A expressão vai entre $$.',
    exemplo: ':::formula Escala de um sinal 4–20 mA\n$$ V = \\frac{(I - 4)}{16} \\cdot (V_{max} - V_{min}) + V_{min} $$\nOnde:\n- `I` — a corrente medida, em mA\n- `V_max` e `V_min` — o fundo e o começo da escala\n= Com 12 mA numa escala de 0 a 500 °C: **V = 250 °C**\n:::',
  },
  arvore: {
    rotulo: 'Árvore de pastas',
    para: 'Estrutura de pastas ou de projeto. Dois espaços por nível; pasta termina em /; comentário depois de //; * no fim destaca.',
    exemplo: ':::arvore projeto-clp\nprograma/\n  principal.st  // a lógica *\n  alarmes.st\nconfiguracao/\n  rede.xml  // IP e ID\n:::',
  },
  frase: {
    rotulo: 'Frase em destaque',
    para: 'Uma frase que resume o artigo. Pode ter uma imagem de fundo e a autoria.',
    exemplo: ':::frase\nA melhor manutenção é a que você não precisou fazer.\n— ditado de chão de fábrica\n:::',
  },
  quiz: {
    rotulo: 'Quiz',
    para: 'Três a cinco perguntas no fim — a marca do Instituto. ? é a pergunta, + a resposta certa, - as erradas, > a explicação.',
    exemplo: ':::quiz\n? Em que endereço começa a área de holding registers no Modbus?\n- 00001\n+ 40001\n- 30001\n> Holding registers são a faixa 4xxxx; 3xxxx são os input registers, só de leitura.\n:::',
  },
  recursos: {
    rotulo: 'Recursos e links',
    para: 'Para onde ir depois: manual, norma, ferramenta. Um link por linha.',
    exemplo: ':::recursos\n- [Especificação do protocolo Modbus](https://modbus.org/specs.php)\n:::',
  },
  notadoautor: {
    rotulo: 'Nota do autor',
    para: 'Em que equipamento você testou, o que ficou de fora, como falar com você.',
    exemplo: ':::notadoautor\nTestei em um inversor com firmware 2.1. Em versões anteriores o mapa de memória muda.\n:::',
  },
};

const TIPOS = new Set(Object.keys(BLOCOS));

/** Os blocos de texto corrido: o corpo deles é markdown comum. */
const DE_TEXTO: ReadonlySet<string> = new Set(['resumo', 'aprender', 'dica', 'atencao', 'perigo', 'nota', 'curiosidade', 'margem', 'recursos', 'notadoautor']);

/* ------------------------------------------------------------- escape */

function escapar(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** O caminho de volta — só para a fonte do TeX, que vai para o KaTeX e é escapada por ele. */
function desescapar(s: string): string {
  return s.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
}

/** Nome de arquivo de imagem que o corpo aceita: minúsculo, sem caminho, jpg ou png. */
const ARQUIVO_IMAGEM = /^[a-z0-9][a-z0-9-]*\.(jpe?g|png)$/;

/* ------------------------------------------------------------- a linha */

/** Ênfase, link, código, tecla e termo — dentro de uma linha já escapada. */
function inline(s: string): string {
  // O que já virou HTML fica guardado, para a regra seguinte não mexer dentro
  // dele: `**` dentro de código continua sendo dois asteriscos.
  const guardados: string[] = [];
  const guardar = (html: string) => `\u0000${guardados.push(html) - 1}\u0000`;

  let t = s
    .replace(/`([^`]+)`/g, (_, c: string) => guardar(`<code>${c}</code>`))
    .replace(/\[\[([^\]\n]{1,24})\]\]/g, (_, k: string) => guardar(`<kbd>${k.trim()}</kbd>`))
    .replace(/\{\{([^|}\n]{1,60})\|([^}\n]{1,280})\}\}/g, (_, termo: string, def: string) =>
      guardar(`<span class="termo-inline" tabindex="0">${termo.trim()}<span class="termo-inline__def" role="tooltip">${def.trim()}</span></span>`),
    )
    // link: só http(s). `javascript:` e `data:` não passam.
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, texto: string, url: string) =>
      guardar(`<a href="${url}" rel="nofollow noopener" target="_blank">${texto}</a>`),
    )
    // link interno: só caminho relativo do próprio site
    .replace(/\[([^\]]+)\]\((\/[^\s)]*)\)/g, (_, texto: string, url: string) => guardar(`<a href="${url}">${texto}</a>`))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, '$1<em>$2</em>');

  // devolve na ordem inversa: um link pode ter guardado código dentro do texto
  for (let i = guardados.length - 1; i >= 0; i--) t = t.split(`\u0000${i}\u0000`).join(guardados[i]!);
  return t;
}

/* ------------------------------------------------------------- o texto */

type Contexto = {
  op: Opcoes;
  erros: string[];
  blocos: string[];
  imagens: string[];
  /** conta os quizzes da página, para os nomes dos botões de opção não colidirem */
  quizzes: number;
};

const ehLinhaDeTabela = (l: string) => /^\|.*\|$/.test(l);
const ehSeparadorDeTabela = (l: string) => /^\|(\s*:?-{3,}:?\s*\|)+$/.test(l);

/**
 * O fluxo de texto: parágrafo, título, lista, citação, regra — e, no nível de
 * cima, os blocos, o código, a tabela e a imagem. Dentro de um bloco de texto
 * (`emBloco`) não se abre outro bloco: aninhar ::: dentro de ::: não tem como
 * fechar sem ambiguidade, e o erro diz isso em vez de adivinhar.
 */
function fluxo(linhas: string[], ctx: Contexto, emBloco = false): string {
  const saida: string[] = [];
  let lista: 'ul' | 'ol' | null = null;
  let paragrafo: string[] = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) {
      saida.push(`<p>${inline(paragrafo.join(' '))}</p>`);
      paragrafo = [];
    }
  };
  const fecharLista = () => {
    if (lista) {
      saida.push(`</${lista}>`);
      lista = null;
    }
  };
  const fechar = () => {
    fecharParagrafo();
    fecharLista();
  };

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]!.trim();

    if (!l) {
      fechar();
      continue;
    }

    /* ---- bloco :::tipo */
    const abre = /^:::\s*([a-z]+)\s*(.*)$/.exec(l);
    if (abre) {
      fechar();
      const tipo = abre[1]!;
      if (emBloco) {
        ctx.erros.push(`bloco ":::${tipo}" dentro de outro bloco — blocos não se aninham; feche o de fora antes`);
        continue;
      }
      const fim = linhas.findIndex((x, j) => j > i && x.trim() === ':::');
      if (fim < 0) {
        ctx.erros.push(`bloco ":::${tipo}" sem a linha ":::" que o fecha`);
        break;
      }
      const corpo = linhas.slice(i + 1, fim);
      i = fim;
      if (!TIPOS.has(tipo)) {
        ctx.erros.push(`bloco ":::${tipo}" não existe — os tipos são: ${[...TIPOS].join(', ')}`);
        continue;
      }
      ctx.blocos.push(tipo);
      saida.push(bloco(tipo as TipoBloco, abre[2]!.trim(), corpo, ctx));
      continue;
    }
    if (l === ':::') {
      fechar();
      ctx.erros.push('linha ":::" sem bloco aberto');
      continue;
    }

    /* ---- código ``` */
    const cerca = /^```\s*([a-z0-9+#.-]*)\s*(.*)$/i.exec(l);
    if (cerca) {
      fechar();
      const fim = linhas.findIndex((x, j) => j > i && x.trim() === '```');
      if (fim < 0) {
        ctx.erros.push('bloco de código sem a linha ``` que o fecha');
        break;
      }
      // o código mantém o recuo: é a única coisa aqui que não passa por trim
      const codigo = linhas.slice(i + 1, fim);
      i = fim;
      ctx.blocos.push(cerca[1]!.toLowerCase() === 'terminal' ? 'terminal' : 'codigo');
      saida.push(blocoDeCodigo(cerca[1]!, cerca[2]!.trim(), codigo));
      continue;
    }

    /* ---- tabela */
    if (!emBloco && ehLinhaDeTabela(l) && ehSeparadorDeTabela((linhas[i + 1] ?? '').trim())) {
      fechar();
      const corpo: string[] = [l];
      let j = i + 2;
      while (j < linhas.length && ehLinhaDeTabela(linhas[j]!.trim())) corpo.push(linhas[j++]!.trim());
      i = j - 1;
      ctx.blocos.push('tabela');
      saida.push(tabela(corpo));
      continue;
    }

    /* ---- imagem numa linha só */
    const img = /^!\[([^\]]*)\]\(([^\s)]+)(?:\s+&quot;(.*?)&quot;)?\)$/.exec(l);
    if (img) {
      fechar();
      saida.push(figura(img[2]!, img[1]!, img[3], ctx));
      continue;
    }

    const titulo = /^(#{2,4})\s+(.*)$/.exec(l);
    if (titulo) {
      fechar();
      // Começa no h2: o h1 da página é o título da obra, e só pode haver um.
      const nivel = Math.min(titulo[1]!.length, 4);
      saida.push(`<h${nivel}>${inline(titulo[2]!)}</h${nivel}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(l)) {
      fechar();
      saida.push('<hr />');
      continue;
    }

    const citacao = /^&gt;\s?(.*)$/.exec(l);
    if (citacao) {
      fechar();
      saida.push(`<blockquote><p>${inline(citacao[1]!)}</p></blockquote>`);
      continue;
    }

    const marcador = /^[-*]\s+(.*)$/.exec(l);
    const numerada = /^\d+\.\s+(.*)$/.exec(l);
    if (marcador || numerada) {
      fecharParagrafo();
      const tipo = marcador ? 'ul' : 'ol';
      if (lista !== tipo) {
        fecharLista();
        saida.push(`<${tipo}>`);
        lista = tipo;
      }
      saida.push(`<li>${inline((marcador ?? numerada)![1]!)}</li>`);
      continue;
    }

    fecharLista();
    paragrafo.push(l);
  }

  fechar();
  return saida.join('\n');
}

/* ------------------------------------------------------------- os blocos */

const ROTULO_AVISO: Record<string, string> = {
  dica: 'Dica',
  atencao: 'Atenção',
  perigo: 'Cuidado',
  nota: 'Nota',
  curiosidade: 'Curiosidade',
};

const rotulo = (texto: string) => `<p class="b-rotulo">${inline(texto)}</p>`;

/** "Título — descrição" (ou "Título | descrição"), num item de lista. */
function itens(corpo: string[], tipo: string, ctx: Contexto): { titulo: string; texto: string }[] {
  const saida: { titulo: string; texto: string }[] = [];
  for (const bruta of corpo) {
    const l = bruta.trim();
    if (!l) continue;
    const m = /^(?:[-*]|\d+\.)\s+(.*)$/.exec(l);
    if (!m) {
      // linha solta depois de um item continua a descrição dele
      if (saida.length) saida[saida.length - 1]!.texto += (saida[saida.length - 1]!.texto ? ' ' : '') + l;
      else ctx.erros.push(`":::${tipo}" espera itens começando com "- " (achei: "${desescapar(l).slice(0, 40)}")`);
      continue;
    }
    const partes = m[1]!.split(/\s+(?:—|–|\|)\s+/);
    saida.push({ titulo: partes[0]!.replace(/^\*\*(.*)\*\*$/, '$1'), texto: partes.slice(1).join(' — ') });
  }
  if (!saida.length) ctx.erros.push(`":::${tipo}" está vazio`);
  return saida;
}

function bloco(tipo: TipoBloco, arg: string, corpo: string[], ctx: Contexto): string {
  if (DE_TEXTO.has(tipo)) {
    const dentro = fluxo(corpo, ctx, true);
    if (!dentro.trim()) ctx.erros.push(`":::${tipo}" está vazio`);
    switch (tipo) {
      case 'resumo':
        return `<aside class="b-resumo">${rotulo(arg || 'Resumo rápido')}${dentro}</aside>`;
      case 'aprender':
        return `<aside class="b-aprender">${rotulo(arg || 'O que você vai aprender')}${dentro}</aside>`;
      case 'margem':
        return `<aside class="b-margem">${dentro}</aside>`;
      case 'recursos':
        return `<aside class="b-recursos">${rotulo(arg || 'Recursos e links')}${dentro}</aside>`;
      case 'notadoautor':
        return `<aside class="b-notaautor">${rotulo(arg || 'Nota do autor')}${dentro}</aside>`;
      default:
        return `<aside class="b-aviso b-aviso--${tipo}" role="note">${rotulo(arg || ROTULO_AVISO[tipo]!)}${dentro}</aside>`;
    }
  }

  switch (tipo) {
    case 'roteiro': {
      const lista = itens(corpo, tipo, ctx)
        .map((it, n) => `<li><span class="b-roteiro__n" aria-hidden="true">${n + 1}</span><span><strong>${inline(it.titulo)}</strong>${it.texto ? ` <span class="b-roteiro__texto">${inline(it.texto)}</span>` : ''}</span></li>`)
        .join('');
      return `<div class="b-roteiro">${rotulo(arg || 'O roteiro')}<ol>${lista}</ol></div>`;
    }

    case 'passos': {
      const lista = itens(corpo, tipo, ctx);
      const lis = lista
        .map(
          (it, n) =>
            `<li><label class="b-passo"><input type="checkbox" class="b-passo__caixa" /><span class="b-passo__corpo"><span class="b-passo__n">Passo ${String(n + 1).padStart(2, '0')}</span><strong class="b-passo__titulo">${inline(it.titulo)}</strong>${it.texto ? `<span class="b-passo__texto">${inline(it.texto)}</span>` : ''}</span></label></li>`,
        )
        .join('');
      // O contador é CSS puro (counter + :checked): sobe quando o leitor marca, sem script.
      return `<div class="b-passos">${rotulo(arg || 'Passo a passo')}<ol class="b-passos__lista">${lis}</ol><p class="b-passos__conta" data-total="${lista.length}" aria-hidden="true"></p></div>`;
    }

    case 'checklist': {
      const lis = itens(corpo, tipo, ctx)
        .map((it) => `<li>${inline(it.titulo)}${it.texto ? ` — ${inline(it.texto)}` : ''}</li>`)
        .join('');
      return `<div class="b-checklist">${arg ? rotulo(arg) : ''}<ul>${lis}</ul></div>`;
    }

    case 'armadilhas': {
      const lista: { titulo: string; texto: string[]; evitar: string }[] = [];
      for (const bruta of corpo) {
        const l = bruta.trim();
        if (!l) continue;
        const t = /^#{2,4}\s+(.*)$/.exec(l);
        if (t) {
          lista.push({ titulo: t[1]!, texto: [], evitar: '' });
          continue;
        }
        const atual = lista[lista.length - 1];
        if (!atual) {
          ctx.erros.push('":::armadilhas" — cada armadilha começa com "### Título"');
          break;
        }
        const ev = /^como evitar\s*:\s*(.*)$/i.exec(l);
        if (ev) atual.evitar = ev[1]!;
        else atual.texto.push(l);
      }
      if (!lista.length) ctx.erros.push('":::armadilhas" está vazio');
      const lis = lista
        .map(
          (a, n) =>
            `<li class="b-armadilha"><span class="b-armadilha__n" aria-hidden="true">${String(n + 1).padStart(2, '0')}</span><div><h3 class="b-armadilha__titulo">${inline(a.titulo)}</h3>${a.texto.length ? `<p>${inline(a.texto.join(' '))}</p>` : ''}${a.evitar ? `<p class="b-armadilha__evitar"><strong>Como evitar</strong> ${inline(a.evitar)}</p>` : ''}</div></li>`,
        )
        .join('');
      return `<section class="b-armadilhas"><header class="b-armadilhas__cabeca">${rotulo(arg || 'Armadilhas comuns')}<span class="b-armadilhas__conta">${lista.length} ${lista.length === 1 ? 'item' : 'itens'}</span></header><ol>${lis}</ol></section>`;
    }

    case 'proscontras': {
      const pro: string[] = [];
      const contra: string[] = [];
      for (const bruta of corpo) {
        const l = bruta.trim();
        if (!l) continue;
        const m = /^([+-])\s+(.*)$/.exec(l);
        if (!m) {
          ctx.erros.push(`":::proscontras" — cada linha começa com "+ " (a favor) ou "- " (contra): "${desescapar(l).slice(0, 40)}"`);
          continue;
        }
        (m[1] === '+' ? pro : contra).push(`<li>${inline(m[2]!)}</li>`);
      }
      if (!pro.length || !contra.length) ctx.erros.push('":::proscontras" precisa dos dois lados: ao menos um "+ " e um "- "');
      const sobre = arg ? ` <span class="b-pc__sobre">${inline(arg)}</span>` : '';
      return `<div class="b-pc"><div class="b-pc__lado b-pc__lado--pro"><p class="b-rotulo">A favor${sobre}</p><ul>${pro.join('')}</ul></div><div class="b-pc__lado b-pc__lado--contra"><p class="b-rotulo">Contra${sobre}</p><ul>${contra.join('')}</ul></div></div>`;
    }

    case 'antesdepois': {
      const lado: Record<string, { arquivo: string; legenda: string }> = {};
      for (const bruta of corpo) {
        const m = /^(antes|depois)\s*:\s*([^\s|]+)\s*(?:\|\s*(.*))?$/i.exec(bruta.trim());
        if (m) lado[m[1]!.toLowerCase()] = { arquivo: m[2]!, legenda: m[3] ?? '' };
        else if (bruta.trim()) ctx.erros.push(`":::antesdepois" — as linhas são "antes: arquivo.jpg | legenda" e "depois: …"`);
      }
      if (!lado['antes'] || !lado['depois']) {
        ctx.erros.push('":::antesdepois" precisa das duas linhas, "antes:" e "depois:"');
        return '';
      }
      const item = (qual: 'antes' | 'depois') => {
        const { arquivo, legenda } = lado[qual]!;
        return `<figure class="b-ad__item b-ad__item--${qual}"><span class="b-ad__rotulo">${qual === 'antes' ? 'Antes' : 'Depois'}</span>${img(arquivo, legenda || (qual === 'antes' ? 'Antes' : 'Depois'), ctx)}${legenda ? `<figcaption>${inline(legenda)}</figcaption>` : ''}</figure>`;
      };
      return `<div class="b-ad">${item('antes')}${item('depois')}</div>`;
    }

    case 'formula': {
      const texto = corpo.join('\n');
      const m = /\$\$([\s\S]+?)\$\$/.exec(texto);
      if (!m) {
        ctx.erros.push('":::formula" — a expressão vai entre $$ e $$');
        return '';
      }
      const fonte = desescapar(m[1]!.trim());
      const expr = ctx.op.tex ? ctx.op.tex(fonte, true) : `<code>${escapar(fonte)}</code>`;
      const resto = texto.slice(0, m.index) + texto.slice(m.index + m[0].length);
      const explica: string[] = [];
      const resultado: string[] = [];
      for (const l of resto.split('\n')) {
        const r = /^\s*=\s+(.*)$/.exec(l);
        if (r) resultado.push(r[1]!);
        else explica.push(l);
      }
      const corpoExplica = fluxo(explica, ctx, true);
      return (
        `<figure class="b-formula">${rotulo(arg ? `Fórmula · ${arg}` : 'Fórmula')}` +
        // tabindex: a fórmula larga rola no celular, e região que rola precisa de foco de teclado (axe)
        `<div class="b-formula__expr" tabindex="0">${expr}</div>` +
        (corpoExplica.trim() ? `<div class="b-formula__explica">${corpoExplica}</div>` : '') +
        resultado.map((r) => `<p class="b-formula__resultado">${inline(r)}</p>`).join('') +
        `</figure>`
      );
    }

    case 'arvore': {
      type No = { nome: string; comentario: string; destaque: boolean; pasta: boolean; filhos: No[] };
      const raiz: No[] = [];
      const pilha: { nivel: number; filhos: No[] }[] = [{ nivel: -1, filhos: raiz }];
      for (const bruta of corpo) {
        if (!bruta.trim()) continue;
        const nivel = Math.floor((bruta.match(/^ */)![0].length) / 2);
        let l = bruta.trim();
        const destaque = /\s\*$/.test(l);
        if (destaque) l = l.replace(/\s\*$/, '');
        const [nome, ...com] = l.split(/\s+\/\/\s*/);
        const no: No = { nome: nome!, comentario: com.join(' // '), destaque, pasta: nome!.endsWith('/'), filhos: [] };
        while (pilha.length > 1 && pilha[pilha.length - 1]!.nivel >= nivel) pilha.pop();
        pilha[pilha.length - 1]!.filhos.push(no);
        pilha.push({ nivel, filhos: no.filhos });
      }
      if (!raiz.length) ctx.erros.push('":::arvore" está vazio');
      const desenhar = (nos: No[]): string =>
        `<ul>${nos
          .map(
            (n) =>
              `<li><span class="b-arvore__item${n.pasta ? ' b-arvore__item--pasta' : ''}${n.destaque ? ' b-arvore__item--destaque' : ''}"><span class="b-arvore__nome">${n.nome}</span>${n.comentario ? `<span class="b-arvore__com">${inline(n.comentario)}</span>` : ''}</span>${n.filhos.length ? desenhar(n.filhos) : ''}</li>`,
          )
          .join('')}</ul>`;
      return `<figure class="b-arvore">${arg ? `<figcaption class="b-arvore__raiz">${arg}</figcaption>` : ''}${desenhar(raiz)}</figure>`;
    }

    case 'frase': {
      let imagem = '';
      let autoria = '';
      const texto: string[] = [];
      for (const bruta of corpo) {
        const l = bruta.trim();
        if (!l) continue;
        const im = /^imagem\s*:\s*([^\s|]+)\s*(?:\|\s*(.*))?$/i.exec(l);
        const au = /^(?:—|–|--)\s*(.*)$/.exec(l);
        if (im) imagem = img(im[1]!, im[2] ?? '', ctx);
        else if (au) autoria = au[1]!;
        else texto.push(l);
      }
      if (!texto.length) ctx.erros.push('":::frase" está vazio');
      return `<figure class="b-frase${imagem ? ' b-frase--imagem' : ''}">${imagem}<blockquote><p>${inline(texto.join(' '))}</p></blockquote>${autoria ? `<figcaption>${inline(autoria)}</figcaption>` : ''}</figure>`;
    }

    case 'quiz': {
      type Q = { pergunta: string; opcoes: { texto: string; certa: boolean }[]; explica: string[] };
      const qs: Q[] = [];
      for (const bruta of corpo) {
        const l = bruta.trim();
        if (!l) continue;
        const p = /^\?\s*(.*)$/.exec(l);
        if (p) {
          qs.push({ pergunta: p[1]!, opcoes: [], explica: [] });
          continue;
        }
        const q = qs[qs.length - 1];
        if (!q) {
          ctx.erros.push('":::quiz" — cada pergunta começa com "? "');
          break;
        }
        const o = /^([+-])\s+(.*)$/.exec(l);
        const e = /^&gt;\s?(.*)$/.exec(l);
        if (o) q.opcoes.push({ texto: o[2]!, certa: o[1] === '+' });
        else if (e) q.explica.push(e[1]!);
        else ctx.erros.push(`":::quiz" — linha que não é pergunta (?), opção (+ / -) nem explicação (>): "${desescapar(l).slice(0, 40)}"`);
      }
      if (!qs.length) ctx.erros.push('":::quiz" está vazio');
      qs.forEach((q, n) => {
        const certas = q.opcoes.filter((o) => o.certa).length;
        if (q.opcoes.length < 2) ctx.erros.push(`quiz, pergunta ${n + 1}: precisa de pelo menos duas opções`);
        if (certas !== 1) ctx.erros.push(`quiz, pergunta ${n + 1}: precisa de exatamente uma resposta certa ("+ "), tem ${certas}`);
      });
      const id = ++ctx.quizzes;
      const lis = qs
        .map(
          (q, n) =>
            `<li class="b-questao"><fieldset><legend>${inline(q.pergunta)}</legend>${q.opcoes
              .map((o) => `<label class="b-opcao"${o.certa ? ' data-certa=""' : ''}><input type="radio" name="quiz${id}-${n + 1}" /><span>${inline(o.texto)}</span></label>`)
              .join('')}</fieldset><p class="b-questao__retorno"><strong class="b-questao__certo">Isso.</strong><strong class="b-questao__errado">Não é essa.</strong>${q.explica.length ? ` ${inline(q.explica.join(' '))}` : ''}</p></li>`,
        )
        .join('');
      // Zero script: o :has(:checked) do CSS mostra a certa e a explicação.
      return `<section class="b-quiz">${rotulo(arg || 'Teste o que ficou')}<ol class="b-quiz__lista">${lis}</ol></section>`;
    }
  }
  return '';
}

/* ------------------------------------------------------------- código, tabela, imagem */

function blocoDeCodigo(linguagem: string, titulo: string, linhas: string[]): string {
  // o recuo comum sai, o relativo fica
  const recuo = Math.min(...linhas.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length), 99);
  const codigo = linhas.map((l) => l.slice(Math.min(recuo, 99))).join('\n');

  if (linguagem.toLowerCase() === 'terminal') {
    const corpo = codigo
      .split('\n')
      .map((l) => {
        const cmd = /^\$\s?(.*)$/.exec(l);
        if (cmd) return `<span class="b-terminal__prompt">$</span> <span class="b-terminal__cmd">${cmd[1]}</span>`;
        if (/^(✓|OK\b)/.test(l)) return `<span class="b-terminal__ok">${l}</span>`;
        return `<span class="b-terminal__saida">${l}</span>`;
      })
      .join('\n');
    return `<figure class="b-terminal"><figcaption class="b-terminal__cabeca"><span class="b-terminal__luzes" aria-hidden="true"></span><span>${titulo || 'terminal'}</span></figcaption><pre>${corpo}</pre></figure>`;
  }
  const rot = titulo || linguagem || 'código';
  // o botão Copiar nasce escondido e só aparece se o script do artigo carregar:
  // sem script, ele não existe — em vez de existir e não funcionar.
  return `<figure class="b-codigo"><figcaption class="b-codigo__cabeca"><span>${rot}</span><button type="button" class="b-codigo__copiar" hidden>Copiar</button></figcaption><pre><code${linguagem ? ` data-linguagem="${linguagem.toLowerCase()}"` : ''}>${codigo}</code></pre></figure>`;
}

const CELULA_ESTADO: Record<string, string> = { sim: 'Sim', 'não': 'Não', nao: 'Não', parcial: 'Parcial' };

function tabela(linhas: string[]): string {
  const celulas = (l: string) =>
    l
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());
  const cel = (c: string) =>
    inline(c).replace(/\((sim|não|nao|parcial)\)/gi, (_, e: string) => {
      const k = e.toLowerCase();
      return `<span class="b-estado b-estado--${k === 'não' || k === 'nao' ? 'nao' : k}">${CELULA_ESTADO[k]}</span>`;
    });
  const [cabeca, ...corpo] = linhas;
  const th = celulas(cabeca!).map((c) => `<th scope="col">${cel(c)}</th>`).join('');
  const trs = corpo
    .map((l) => `<tr>${celulas(l).map((c, i) => (i === 0 ? `<th scope="row">${cel(c)}</th>` : `<td>${cel(c)}</td>`)).join('')}</tr>`)
    .join('');
  return `<div class="b-tabela" role="region" tabindex="0"><table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

function img(arquivo: string, alt: string, ctx: Contexto): string {
  if (!ARQUIVO_IMAGEM.test(arquivo)) {
    ctx.erros.push(`imagem "${arquivo}" — o nome tem de ser minúsculo, sem pasta, .jpg ou .png`);
    return '';
  }
  ctx.imagens.push(arquivo);
  const src = ctx.op.imagem ? ctx.op.imagem(arquivo) : `/imagens/${arquivo}`;
  const m = ctx.op.medidas?.(arquivo);
  const dims = m ? ` width="${m.largura}" height="${m.altura}"` : '';
  return `<img src="${escapar(src)}" alt="${alt}"${dims} loading="lazy" decoding="async" />`;
}

function figura(arquivo: string, alt: string, credito: string | undefined, ctx: Contexto): string {
  if (!alt.trim()) ctx.erros.push(`imagem "${arquivo}" sem texto alternativo — ![o que há na imagem](${arquivo})`);
  if (!credito?.trim()) ctx.erros.push(`imagem "${arquivo}" sem crédito — ![alt](${arquivo} "Foto: quem fez")`);
  return `<figure class="b-imagem">${img(arquivo, alt, ctx)}${credito ? `<figcaption>${inline(credito)}</figcaption>` : ''}</figure>`;
}

/* ------------------------------------------------------------- a entrada */

export function converterObra(markdown: string, op: Opcoes = {}): Resultado {
  const ctx: Contexto = { op, erros: [], blocos: [], imagens: [], quizzes: 0 };
  const linhas = escapar(markdown.replace(/\r\n/g, '\n').replace(/\u0000/g, '')).split('\n');
  const html = fluxo(linhas, ctx);
  return { html, erros: ctx.erros, blocos: ctx.blocos, imagens: ctx.imagens };
}

export function renderizarObra(markdown: string, op: Opcoes = {}): string {
  return converterObra(markdown, op).html;
}

/** Tempo de leitura, para a assinatura. ~200 palavras por minuto em texto técnico. */
export function minutosDeLeitura(markdown: string): number {
  const palavras = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(palavras / 200));
}
