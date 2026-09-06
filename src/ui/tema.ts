/**
 * A única linha de JavaScript do site: o botão de tema.
 *
 * Mora num arquivo só de texto porque DUAS coisas precisam dela idêntica:
 * o <script> inline do Documento e o hash SHA-256 que a Content-Security-Policy
 * exige para deixar esse script rodar. O compilador calcula o hash a partir
 * daqui e o grava no módulo gerado; o QA recalcula a partir do HTML servido e
 * compara com o cabeçalho. Se alguém mudar um caractere, o hash muda junto —
 * e se esquecer de recompilar, o QA avisa antes do navegador bloquear.
 *
 * O CSS não segue o sistema (decisão em design/tokens.css): sem `data-theme`,
 * a página É clara. Por isso o script parte do que está na tela, não do
 * `prefers-color-scheme`.
 */
export const TEMA_SCRIPT =
  "(function(){var r=document.documentElement;try{var t=localStorage.getItem('tema');if(t==='dark'||t==='light')r.dataset.theme=t}catch(e){}var b=document.getElementById('tema');if(!b)return;b.addEventListener('click',function(){var e=r.dataset.theme==='dark';var n=e?'light':'dark';r.dataset.theme=n;try{localStorage.setItem('tema',n)}catch(e){}})})()";
