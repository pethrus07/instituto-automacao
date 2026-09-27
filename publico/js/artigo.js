/*
 * O botão "Copiar" dos blocos de código do artigo.
 *
 * É o único script do artigo, e é opcional de propósito: o botão nasce com
 * `hidden` no HTML (src/ui/markdown.ts) e só aparece quando este arquivo
 * carrega. Sem script, o leitor seleciona o código com o mouse — e não vê um
 * botão que não funciona.
 */
for (const botao of document.querySelectorAll('.b-codigo__copiar')) {
  const codigo = botao.closest('.b-codigo')?.querySelector('code');
  if (!codigo || !navigator.clipboard) continue;
  botao.hidden = false;
  botao.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(codigo.textContent ?? '');
      botao.dataset.copiado = '';
      botao.textContent = 'Copiado';
      setTimeout(() => {
        delete botao.dataset.copiado;
        botao.textContent = 'Copiar';
      }, 1800);
    } catch {
      botao.textContent = 'Selecione e copie';
    }
  });
}
