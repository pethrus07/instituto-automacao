/**
 * Sonda candidatos a VOZ — pessoa pública que publica com nome próprio.
 *
 *   npm run sondar:vozes
 *
 * Voz não é veículo. Veículo tem redação, pauta e periodicidade; voz tem
 * opinião e responsabilidade pessoal. A diferença importa para o Giro da
 * Semana: "a IEEE Spectrum noticiou" e "Rodney Brooks disse" são frases de
 * peso diferente, e misturar as duas é o jeito mais rápido de o giro virar
 * agregador sem sotaque.
 *
 * Sonda de verdade — busca o feed, passa pelo nosso parser E lê o
 * robots.txt antes. Fonte que só existe na cabeça de quem cadastrou não
 * entra na base.
 */
import { lerFeed } from '../src/coletor/feed.ts';
import { lerRobots } from '../src/coletor/robots.ts';

const UA =
  'InstitutoAutomacaoBot/0.1 (+https://institutoautomacao.com.br/transparencia; radar de automacao)';

type Candidato = {
  pessoa: string;
  papel: string;
  url: string;
  site: string;
  idioma: string;
  pais: string;
  nucleo: string;
};

/**
 * Os candidatos, e o critério: pessoa que publica com nome próprio, tem
 * autoridade reconhecida no assunto, e mantém feed aberto. Nomeados aqui de
 * propósito — lista de fonte é decisão editorial, não configuração.
 */
const CANDIDATOS: Candidato[] = [
  {
    pessoa: 'Rodney Brooks',
    papel: 'fundador do iRobot e da Rethink Robotics; ex-diretor do laboratório de IA do MIT',
    url: 'https://rodneybrooks.com/feed/',
    site: 'https://rodneybrooks.com',
    idioma: 'en',
    pais: 'US',
    nucleo: 'industria',
  },
  {
    pessoa: 'Ethan Mollick',
    papel: 'professor na Wharton; escreve sobre IA aplicada ao trabalho',
    url: 'https://www.oneusefulthing.org/feed',
    site: 'https://www.oneusefulthing.org',
    idioma: 'en',
    pais: 'US',
    nucleo: 'observatorio',
  },
  {
    pessoa: 'Simon Willison',
    papel: 'criador do Django e do Datasette; documenta o uso prático de modelos',
    url: 'https://simonwillison.net/atom/everything/',
    site: 'https://simonwillison.net',
    idioma: 'en',
    pais: 'US',
    nucleo: 'operacao',
  },
  {
    pessoa: 'Gary Marcus',
    papel: 'cientista cognitivo; a voz mais consistente do ceticismo sobre IA',
    url: 'https://garymarcus.substack.com/feed',
    site: 'https://garymarcus.substack.com',
    idioma: 'en',
    pais: 'US',
    nucleo: 'observatorio',
  },
  {
    pessoa: 'Benedict Evans',
    papel: 'analista de tecnologia e mercado',
    url: 'https://www.ben-evans.com/benedictevans?format=rss',
    site: 'https://www.ben-evans.com',
    idioma: 'en',
    pais: 'GB',
    nucleo: 'observatorio',
  },
  {
    pessoa: 'Andrej Karpathy',
    papel: 'ex-diretor de IA da Tesla; escreve raro e denso',
    url: 'https://karpathy.github.io/feed.xml',
    site: 'https://karpathy.github.io',
    idioma: 'en',
    pais: 'US',
    nucleo: 'observatorio',
  },
  {
    pessoa: 'Sebastian Raschka',
    papel: 'pesquisador; explica arquitetura de modelo com implementação junto',
    url: 'https://magazine.sebastianraschka.com/feed',
    site: 'https://magazine.sebastianraschka.com',
    idioma: 'en',
    pais: 'US',
    nucleo: 'observatorio',
  },
  {
    pessoa: 'Tim Bray',
    papel: 'coautor do XML; escreve sobre infraestrutura e o ofício',
    url: 'https://www.tbray.org/ongoing/ongoing.atom',
    site: 'https://www.tbray.org/ongoing/',
    idioma: 'en',
    pais: 'CA',
    nucleo: 'operacao',
  },
  {
    pessoa: 'Rodrigo Ghedin',
    papel: 'jornalista; edita o Manual do Usuário — voz brasileira, marca o relógio',
    url: 'https://manualdousuario.net/feed/',
    site: 'https://manualdousuario.net',
    idioma: 'pt',
    pais: 'BR',
    nucleo: 'observatorio',
  },
  {
    pessoa: 'Chris Anderson',
    papel: 'ex-editor da Wired; DIY Robocars e veículo autônomo amador',
    url: 'https://diyrobocars.com/feed/',
    site: 'https://diyrobocars.com',
    idioma: 'en',
    pais: 'US',
    nucleo: 'industria',
  },
  {
    pessoa: 'Kerry Wang',
    papel: 'engenharia de automação residencial; blog do Home Assistant é coletivo, este é pessoal',
    url: 'https://www.jefflean.com/feed.xml',
    site: 'https://www.jefflean.com',
    idioma: 'en',
    pais: 'US',
    nucleo: 'edificacoes',
  },
  {
    pessoa: 'Paulo Silveira',
    papel: 'fundador da Alura; escreve sobre tecnologia e trabalho no Brasil',
    url: 'https://www.alura.com.br/artigos/rss',
    site: 'https://www.alura.com.br',
    idioma: 'pt',
    pais: 'BR',
    nucleo: 'observatorio',
  },
];

const ok: string[] = [];

console.log(`Sondando ${CANDIDATOS.length} vozes…\n`);

for (const c of CANDIDATOS) {
  let veredito = '';
  try {
    const rb = await lerRobots(c.url, UA);
    if (rb.permite !== true) {
      console.log(`  ✗ ${c.pessoa.padEnd(20)} robots: ${rb.motivo}`);
      continue;
    }
    veredito = rb.atraso ? ` (pede ${rb.atraso}s)` : '';

    const r = await fetch(c.url, {
      headers: { 'user-agent': UA, accept: 'application/rss+xml, application/atom+xml, application/xml' },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      console.log(`  ✗ ${c.pessoa.padEnd(20)} HTTP ${r.status}`);
      continue;
    }

    const itens = lerFeed(await r.text());
    if (itens.length === 0) {
      console.log(`  ✗ ${c.pessoa.padEnd(20)} feed sem item legível`);
      continue;
    }

    const ultimo = itens[0]!;
    const dias = ultimo.publicado
      ? Math.round((Date.now() - new Date(ultimo.publicado).getTime()) / 86400000)
      : null;
    console.log(
      `  ✓ ${c.pessoa.padEnd(20)} ${String(itens.length).padStart(3)} itens${veredito} · ` +
        `último há ${dias ?? '?'} dia(s): ${ultimo.titulo.slice(0, 60)}`,
    );

    const id = 'f-voz-' + c.pessoa.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '-');
    ok.push(
      `  ('${id}', ${sql(c.pessoa)}, ${sql(c.site)}, ${sql(c.url)}, 'pessoa', '${c.idioma}', '${c.pais}', ` +
        `'${c.nucleo}', 'resumo', NULL, 'media', ${c.pais === 'BR' ? 1 : 0}, 180, 1, ` +
        `${sql(c.pessoa)}, ${sql(c.papel)}),`,
    );
  } catch (e) {
    console.log(`  ✗ ${c.pessoa.padEnd(20)} ${e instanceof Error ? e.message : String(e)}`);
  }
}

function sql(s: string) {
  return `'${s.replace(/'/g, "''")}'`;
}

console.log(`\n${ok.length} de ${CANDIDATOS.length} responderam.\n`);
if (ok.length) {
  console.log(`INSERT OR REPLACE INTO fonte (id, nome, url_site, url_feed, tipo, idioma, pais, nucleo,
                              licenca, licenca_evidencia, confianca, marca_relogio, intervalo_min, ativo,
                              pessoa, pessoa_papel)
VALUES`);
  console.log(ok.join('\n').replace(/,$/, ';'));
}
