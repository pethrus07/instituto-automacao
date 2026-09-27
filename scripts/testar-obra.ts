/**
 * Testes do dialeto de blocos do artigo (src/ui/markdown.ts).
 *
 *   node --experimental-strip-types scripts/testar-obra.ts
 *
 * Três coisas que não podem voltar a quebrar calado:
 *   1. todo exemplo publicado no guia (/escrever/blocos) renderiza SEM ERRO —
 *      o guia não pode ensinar uma sintaxe que o compilador recusa;
 *   2. a segurança: o autor não injeta HTML, script nem link perigoso por
 *      nenhum bloco novo;
 *   3. os erros que o compilador usa para abortar aparecem quando devem.
 */
import { BLOCOS, converterObra, renderizarObra, type TipoBloco } from '../src/ui/markdown.ts';

let falhas = 0;
let total = 0;
function conferir(nome: string, ok: boolean, detalhe = '') {
  total++;
  if (!ok) {
    falhas++;
    console.error(`✗ ${nome}${detalhe ? `\n    ${detalhe}` : ''}`);
  }
}

/* 1 — o guia não mente */
for (const [tipo, b] of Object.entries(BLOCOS) as [TipoBloco, (typeof BLOCOS)[TipoBloco]][]) {
  const r = converterObra(b.exemplo);
  conferir(`exemplo de ":::${tipo}" renderiza sem erro`, r.erros.length === 0, r.erros.join(' · '));
  conferir(`exemplo de ":::${tipo}" registra o bloco`, r.blocos.includes(tipo), r.blocos.join(','));
  conferir(`exemplo de ":::${tipo}" produz HTML`, r.html.length > 20);
}

/* 2 — segurança */
{
  const ataque = [
    ':::dica <script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    ':::',
    ':::quiz',
    '? <b>pergunta</b>',
    '+ [certa](javascript:alert(1))',
    '- errada',
    ':::',
    '```html',
    '<script>alert(2)</script>',
    '```',
    '| <b>a</b> | b |',
    '|---|---|',
    '| x | (sim) |',
    '![a" onerror="x](../../etc/passwd.jpg "c")',
    '{{termo|<script>x</script>}} e [[<b>]]',
  ].join('\n');
  const r = converterObra(ataque);
  conferir('nenhuma tag <script> sobrevive', !/<script/i.test(r.html), r.html);
  // só dentro de tag de verdade: "onerror=" escapado no meio do texto é texto
  const tags = r.html.match(/<[a-z][^>]*>/gi) ?? [];
  conferir('nenhum atributo de evento sobrevive', !tags.some((t) => /\son[a-z]+\s*=/i.test(t)), tags.filter((t) => /\son/i.test(t)).join(' '));
  conferir('nenhum link javascript:', !/href="javascript:/i.test(r.html));
  conferir('nenhuma <b> do autor vira tag', !/<b>/.test(r.html));
  conferir('imagem com caminho é recusada', r.erros.some((e) => e.includes('passwd')), r.erros.join(' · '));
  conferir('imagem com caminho não vira <img>', !/passwd/.test(r.html.replace(/erros/g, '')) || !/<img[^>]+passwd/.test(r.html));
}

/* 3 — os erros que abortam o build */
const deveErrar = (nome: string, md: string, trecho: string) => {
  const r = converterObra(md);
  conferir(nome, r.erros.some((e) => e.includes(trecho)), `erros: ${r.erros.join(' · ') || '(nenhum)'}`);
};
deveErrar('bloco que não existe', ':::inventado\nx\n:::', 'não existe');
deveErrar('bloco sem fechar', ':::dica\nx', 'sem a linha');
deveErrar('bloco aninhado', ':::dica\n:::nota\nx\n:::\n:::', 'não se aninham');
deveErrar('quiz sem resposta certa', ':::quiz\n? P\n- a\n- b\n:::', 'exatamente uma');
deveErrar('quiz com duas certas', ':::quiz\n? P\n+ a\n+ b\n:::', 'exatamente uma');
deveErrar('fórmula sem $$', ':::formula\nx = y\n:::', '$$');
deveErrar('antes e depois pela metade', ':::antesdepois\nantes: a.jpg\n:::', 'duas linhas');
deveErrar('prós sem contras', ':::proscontras\n+ bom\n:::', 'dois lados');
deveErrar('imagem sem crédito', '![uma placa](placa.jpg)', 'sem crédito');
deveErrar('imagem sem alt', '![](placa.jpg "Foto: eu")', 'alternativo');
deveErrar('código sem fechar', '```js\nx', 'sem a linha');

/* 4 — o que o leitor vê */
{
  const h = renderizarObra('Aperte [[Ctrl]] + [[C]] e veja o {{CLP|controlador lógico programável}}.');
  conferir('tecla vira <kbd>', (h.match(/<kbd>/g) ?? []).length === 2, h);
  conferir('termo vira dica inline', h.includes('termo-inline__def') && h.includes('controlador lógico programável'), h);

  const t = renderizarObra('| Item | A | B |\n|---|---|---|\n| MQTT 5 | (não) | (sim) |');
  conferir('tabela tem cabeçalho e linha', t.includes('<thead>') && t.includes('<th scope="row">MQTT 5</th>'), t);
  conferir('(sim)/(não) viram estado', t.includes('b-estado--sim') && t.includes('b-estado--nao'), t);

  const c = renderizarObra('```cpp\nif (a < b && **x**) {}\n```');
  conferir('código preserva < e ** literais', c.includes('a &lt; b &amp;&amp; **x**'), c);
  conferir('código tem botão Copiar escondido', c.includes('b-codigo__copiar" hidden'), c);

  const q = converterObra(':::quiz\n? A\n+ sim\n- não\n:::\n\n:::quiz\n? B\n+ sim\n- não\n:::');
  conferir('dois quizzes não compartilham o nome dos botões', q.html.includes('name="quiz1-1"') && q.html.includes('name="quiz2-1"'), q.html);

  const f = converterObra(':::formula\n$$ a < b $$\n= ok\n:::', { tex: (s) => `<math data-fonte="${s.replace(/</g, '&lt;')}"></math>` });
  conferir('fórmula entrega o TeX desescapado ao KaTeX', f.html.includes('data-fonte="a &lt; b"'), f.html);

  const m = renderizarObra('![placa](placa.jpg "Foto: eu")', { medidas: () => ({ largura: 1200, altura: 800 }) });
  conferir('imagem leva largura e altura (CLS)', m.includes('width="1200" height="800"'), m);

  const a = renderizarObra(':::arvore raiz\npasta/\n  arquivo.txt  // o principal *\n:::');
  conferir('árvore aninha e destaca', /<ul><li>.*pasta\/.*<ul><li>.*arquivo\.txt/.test(a) && a.includes('b-arvore__item--destaque'), a);
}

console.log(`${falhas ? '✗' : '✓'} obra: ${total - falhas}/${total} conferências`);
if (falhas) process.exit(1);
