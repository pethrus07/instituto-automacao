/**
 * Teste do interpretador de robots.txt — sem Worker, sem rede.
 *
 *   npm test
 *
 * Existe porque esse parser decide se uma fonte entra ou não entra no
 * radar, e o erro é assimétrico: um parser generoso demais faz o Instituto
 * coletar quem pediu para não ser coletado — que é justamente a promessa
 * publicada em /blueprints. Um parser rigoroso demais só nos custa uma
 * fonte, e isso a gente vê no inventário.
 *
 * Os casos vêm dos robots.txt REAIS medidos em 01/09/2026, não de exemplos
 * inventados: Control Engineering bloqueia rastreador de IA por nome e
 * libera o resto; The Robot Report libera com `Disallow:` vazio e pede
 * `Crawl-delay: 10`.
 */
import { interpretarRobots } from '../src/coletor/robots.ts';

let ok = 0;
let falhou = 0;

function conferir(nome: string, real: unknown, esperado: unknown) {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) {
    ok++;
    console.log(`  ok   ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHA ${nome}\n        esperado: ${b}\n        veio:     ${a}`);
  }
}

/* ------------------------------------------ Control Engineering (real) */
const CONTROL = `
User-agent: Amazonbot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: *
Allow: /
Disallow: /wp-admin/
Sitemap: https://www.controleng.com/sitemap.xml
`;

console.log('Control Engineering — bloqueia IA por nome, libera o resto');
conferir(
  'o curinga permite uma matéria comum',
  interpretarRobots(CONTROL, '/artigo/clp-novo').permite,
  true,
);
conferir(
  'e continua respeitando o Disallow do curinga',
  interpretarRobots(CONTROL, '/wp-admin/edit.php').permite,
  false,
);

/* ---------------------------------------------- The Robot Report (real) */
const ROBOT_REPORT = `
User-agent: *
Disallow:
Crawl-delay: 10

Sitemap: https://www.therobotreport.com/sitemap_index.xml
`;

console.log('The Robot Report — Disallow vazio libera tudo, e pede 10s');
const rr = interpretarRobots(ROBOT_REPORT, '/feed/');
conferir('`Disallow:` vazio quer dizer liberado', rr.permite, true);
conferir('o Crawl-delay é lido', rr.atraso, 10);

/* --- The Robot Report DE VERDADE: Crawl-delay antes do primeiro grupo --- */
const ROBOT_REPORT_REAL = `Crawl-delay: 10
# START YOAST BLOCK
# ---------------------------
User-agent: *
Disallow:

Sitemap: https://www.therobotreport.com/sitemap_index.xml
# ---------------------------
# END YOAST BLOCK
`;

console.log('Crawl-delay fora de grupo — como o arquivo real é escrito');
const rrReal = interpretarRobots(ROBOT_REPORT_REAL, '/feed/');
conferir('continua liberado', rrReal.permite, true);
conferir(
  'e o Crawl-delay solto NAO e perdido',
  rrReal.atraso,
  10,
);
conferir(
  'o Crawl-delay do grupo vence o solto',
  interpretarRobots('Crawl-delay: 10\nUser-agent: *\nCrawl-delay: 30\nDisallow:', '/x').atraso,
  30,
);

/* ------------------------------------------- o nosso agente pelo nome */
const NOMINAL = `
User-agent: *
Allow: /

User-agent: institutoautomacaobot
Disallow: /
`;

console.log('Grupo específico do nosso agente');
conferir(
  'o grupo do nosso nome vence o curinga, mesmo vindo depois',
  interpretarRobots(NOMINAL, '/qualquer').permite,
  false,
);

/* ------------------------------------------------------ especificidade */
const ESPECIFICO = `
User-agent: *
Disallow: /noticias/
Allow: /noticias/publicas/
`;

console.log('Regra mais específica vence');
conferir('o pai proíbe', interpretarRobots(ESPECIFICO, '/noticias/x').permite, false);
conferir(
  'e o filho mais específico libera',
  interpretarRobots(ESPECIFICO, '/noticias/publicas/x').permite,
  true,
);
conferir(
  'empate de tamanho vai para o Allow',
  interpretarRobots('User-agent: *\nDisallow: /a\nAllow: /a', '/a/b').permite,
  true,
);

/* ------------------------------------------------------------ curingas */
console.log('Curingas * e $');
conferir(
  '* no meio do caminho',
  interpretarRobots('User-agent: *\nDisallow: /*/privado', '/setor/privado/x').permite,
  false,
);
conferir(
  '$ ancora no fim: casa exatamente',
  interpretarRobots('User-agent: *\nDisallow: /*.pdf$', '/doc/manual.pdf').permite,
  false,
);
conferir(
  '$ ancora no fim: não casa com sufixo depois',
  interpretarRobots('User-agent: *\nDisallow: /*.pdf$', '/doc/manual.pdf.html').permite,
  true,
);

/* -------------------------------------------------------- comentários */
console.log('Ruído que os robots.txt reais têm');
conferir(
  'comentário no fim da linha não vira caminho',
  interpretarRobots('User-agent: *  # todos\nDisallow: /x  # privado', '/x/y').permite,
  false,
);
conferir(
  'User-agent seguidos compartilham o mesmo grupo',
  interpretarRobots('User-agent: bot-a\nUser-agent: *\nDisallow: /', '/x').permite,
  false,
);
conferir(
  'robots.txt vazio libera',
  interpretarRobots('', '/x').permite,
  true,
);
conferir(
  'regra sem grupo (sem User-agent antes) é ignorada, não aplicada a todos',
  interpretarRobots('Disallow: /\n', '/x').permite,
  true,
);

/* --------------------------------------------------------------- resultado */
console.log(`
${ok} ok · ${falhou} falha(s)`);
if (falhou > 0) process.exit(1);
