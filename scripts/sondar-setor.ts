/**
 * Sonda fontes candidatas ao SETOR — a matéria-prima da redação automática.
 *
 *   npm run sondar:setor
 *
 * 14/10/2026: com a notícia saindo sozinha, o gargalo virou a pauta. As fontes
 * do setor que publicam notícia de fato traziam ~40 itens por semana, e a
 * primeira execução agendada descartou as 8 candidatas por escopo. Esta
 * sondagem mede, para cada candidata, o que importa para a redação:
 *   · o feed responde e o parser do coletor lê;
 *   · o robots.txt deixa o NOSSO robô ler o feed (é a mesma função do coletor);
 *   · quantos itens saíram nos últimos 7 dias (volume de pauta).
 * Não decide nada: imprime a tabela e o SQL das que passaram.
 */
import { lerFeed } from '../src/coletor/feed.ts';
import { lerRobots } from '../src/coletor/robots.ts';

const UA = 'InstitutoAutomacaoBot/0.1 (+https://institutoautomacao.com.br/transparencia; radar de automacao)';

type Candidata = { id: string; nome: string; site: string; feed: string; tipo: 'imprensa' | 'press' | 'associacao'; idioma: string; pais: string; nucleo: 'industria' | 'processos'; relogio?: boolean };

const CANDIDATAS: Candidata[] = [
  // imprensa internacional do setor
  { id: 'f-robotics-automation-news', nome: 'Robotics & Automation News', site: 'https://roboticsandautomationnews.com', feed: 'https://roboticsandautomationnews.com/feed/', tipo: 'imprensa', idioma: 'en', pais: 'GB', nucleo: 'industria' },
  { id: 'f-robotics-247', nome: 'Robotics 24/7', site: 'https://www.robotics247.com', feed: 'https://www.robotics247.com/rss/', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { id: 'f-automation-com', nome: 'Automation.com (ISA)', site: 'https://www.automation.com', feed: 'https://www.automation.com/en-us/rss', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'processos' },
  { id: 'f-design-world', nome: 'Design World', site: 'https://www.designworldonline.com', feed: 'https://www.designworldonline.com/feed/', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { id: 'f-mobile-robot-guide', nome: 'Mobile Robot Guide', site: 'https://www.mobilerobotguide.com', feed: 'https://www.mobilerobotguide.com/feed/', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { id: 'f-the-manufacturer', nome: 'The Manufacturer', site: 'https://www.themanufacturer.com', feed: 'https://www.themanufacturer.com/feed/', tipo: 'imprensa', idioma: 'en', pais: 'GB', nucleo: 'industria' },
  { id: 'f-industryweek', nome: 'IndustryWeek', site: 'https://www.industryweek.com', feed: 'https://www.industryweek.com/rss', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { id: 'f-assembly-magazine', nome: 'Assembly Magazine', site: 'https://www.assemblymag.com', feed: 'https://www.assemblymag.com/rss/topic/2652-automation', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { id: 'f-eenews-europe', nome: 'eeNews Europe', site: 'https://www.eenewseurope.com', feed: 'https://www.eenewseurope.com/en/feed/', tipo: 'imprensa', idioma: 'en', pais: 'FR', nucleo: 'industria' },
  { id: 'f-engineering-com', nome: 'Engineering.com', site: 'https://www.engineering.com', feed: 'https://www.engineering.com/feed/', tipo: 'imprensa', idioma: 'en', pais: 'CA', nucleo: 'industria' },
  { id: 'f-packaging-world', nome: 'Packaging World', site: 'https://www.packworld.com', feed: 'https://www.packworld.com/rss', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { id: 'f-new-equipment-digest', nome: 'New Equipment Digest', site: 'https://www.newequipment.com', feed: 'https://www.newequipment.com/rss', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { id: 'f-interesting-engineering', nome: 'Interesting Engineering · Robótica', site: 'https://interestingengineering.com', feed: 'https://interestingengineering.com/feed/robotics', tipo: 'imprensa', idioma: 'en', pais: 'US', nucleo: 'industria' },
  // fabricantes e associações
  { id: 'f-abb-news', nome: 'ABB News', site: 'https://new.abb.com', feed: 'https://new.abb.com/news/feed', tipo: 'press', idioma: 'en', pais: 'CH', nucleo: 'industria' },
  { id: 'f-rockwell-press', nome: 'Rockwell Automation', site: 'https://www.rockwellautomation.com', feed: 'https://www.rockwellautomation.com/en-us/company/news/press-releases.rss.xml', tipo: 'press', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { id: 'f-a3', nome: 'A3 · Association for Advancing Automation', site: 'https://www.automate.org', feed: 'https://www.automate.org/rss/news', tipo: 'associacao', idioma: 'en', pais: 'US', nucleo: 'industria' },
  { id: 'f-ifr', nome: 'IFR · International Federation of Robotics', site: 'https://ifr.org', feed: 'https://ifr.org/news/rss', tipo: 'associacao', idioma: 'en', pais: 'DE', nucleo: 'industria' },
  // Brasil
  { id: 'f-inovacao-tecnologica', nome: 'Inovação Tecnológica', site: 'https://www.inovacaotecnologica.com.br', feed: 'https://www.inovacaotecnologica.com.br/boletim/rss.xml', tipo: 'imprensa', idioma: 'pt', pais: 'BR', nucleo: 'industria', relogio: true },
  { id: 'f-agencia-industria', nome: 'Agência de Notícias da Indústria (CNI)', site: 'https://noticias.portaldaindustria.com.br', feed: 'https://noticias.portaldaindustria.com.br/feed/', tipo: 'associacao', idioma: 'pt', pais: 'BR', nucleo: 'industria', relogio: true },
  { id: 'f-logweb', nome: 'Logweb', site: 'https://www.logweb.com.br', feed: 'https://www.logweb.com.br/feed/', tipo: 'imprensa', idioma: 'pt', pais: 'BR', nucleo: 'industria', relogio: true },
  { id: 'f-embrapii', nome: 'EMBRAPII', site: 'https://embrapii.org.br', feed: 'https://embrapii.org.br/feed/', tipo: 'associacao', idioma: 'pt', pais: 'BR', nucleo: 'industria', relogio: true },
  { id: 'f-mundo-logistica', nome: 'Mundo Logística', site: 'https://revistamundologistica.com.br', feed: 'https://revistamundologistica.com.br/feed', tipo: 'imprensa', idioma: 'pt', pais: 'BR', nucleo: 'industria', relogio: true },
  { id: 'f-revista-ferramental', nome: 'Revista Ferramental', site: 'https://www.revistaferramental.com.br', feed: 'https://www.revistaferramental.com.br/feed/', tipo: 'imprensa', idioma: 'pt', pais: 'BR', nucleo: 'industria', relogio: true },
  { id: 'f-usinagem-brasil', nome: 'Usinagem Brasil', site: 'https://www.usinagem-brasil.com.br', feed: 'https://www.usinagem-brasil.com.br/feed/', tipo: 'imprensa', idioma: 'pt', pais: 'BR', nucleo: 'industria', relogio: true },
  { id: 'f-automacao-industrial-teste', nome: 'Automação Industrial (reteste)', site: 'https://www.automacaoindustrial.info', feed: 'https://www.automacaoindustrial.info/feed/', tipo: 'imprensa', idioma: 'pt', pais: 'BR', nucleo: 'industria', relogio: true },
];

const semana = Date.now() - 7 * 86_400_000;
const passaram: (Candidata & { n7: number })[] = [];
for (const c of CANDIDATAS) {
  let linha = '';
  try {
    const rb = await lerRobots(c.feed, UA);
    if (rb.permite !== true) {
      linha = `robots NÃO (${rb.motivo})`;
    } else {
      const r = await fetch(c.feed, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
      if (!r.ok) linha = `HTTP ${r.status}`;
      else {
        const itens = lerFeed(await r.text());
        const n7 = itens.filter((i) => i.publicado && Date.parse(i.publicado) >= semana).length;
        linha = `${itens.length} itens, ${n7} na semana`;
        if (n7 > 0) passaram.push({ ...c, n7 });
      }
    }
  } catch (e) {
    linha = `erro: ${(e as Error).message.slice(0, 60)}`;
  }
  console.log(`${passaram.at(-1)?.id === c.id ? 'ok ' : '   '} ${c.nome.padEnd(42)} ${linha}`);
}

const esc = (v: string) => `'${v.replace(/'/g, "''")}'`;
console.log(`\n${passaram.length} de ${CANDIDATAS.length} passaram. SQL:\n`);
console.log(
  `INSERT OR IGNORE INTO fonte (id, nome, url_site, url_feed, tipo, idioma, pais, nucleo, licenca, confianca, marca_relogio, intervalo_min, ativo, papel)\nVALUES\n` +
    passaram.map((c) => `  (${esc(c.id)}, ${esc(c.nome)}, ${esc(c.site)}, ${esc(c.feed)}, ${esc(c.tipo)}, ${esc(c.idioma)}, ${esc(c.pais)}, ${esc(c.nucleo)}, 'resumo', 'media', ${c.relogio ? 1 : 0}, 60, 1, 'setor')`).join(',\n') +
    ';',
);
