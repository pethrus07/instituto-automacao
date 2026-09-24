/**
 * OS NÚMEROS DA SEMANA — uma consulta só, dois consumidores.
 *
 * O dossiê (material de trabalho) e o Giro (o que se publica) leem daqui. Não
 * é economia de linha: é a única forma de o boletim publicado e a conferência
 * interna não divergirem. Duas cópias da mesma consulta divergem na primeira
 * vez que alguém mexe numa delas — e neste projeto isso já aconteceu duas
 * vezes, com o banco errado e com a finalidade do cadastro.
 *
 * Tudo aqui é SQL. Não há modelo, não há rede, não há juízo: só contagem sobre
 * o que o coletor guardou.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { janelaDoSlug, semanaFechada, type Janela } from '../src/giro/semana.ts';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const WRANGLER = join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

export const BANCOS = {
  local: { nome: 'instituto', args: ['--local'], rotulo: 'D1 local (colheita manual)' },
  homolog: { nome: 'instituto-homolog', args: ['--remote', '--env', 'homolog'], rotulo: 'D1 da homologação (cron da borda)' },
  producao: { nome: 'instituto', args: ['--remote'], rotulo: 'D1 de produção' },
} as const;
export type QualBanco = keyof typeof BANCOS;

/**
 * TRÊS BALDES, e os números da semana são de um só.
 *
 * Medido em 24/09/2026, desde 07/09: de 1.459 itens colhidos, 751 (52%) eram
 * do Fórum Home Assistant, 558 (38%) de tecnologia geral (The Verge, Ars
 * Technica e comentaristas de IA) e 150 (10%) do setor de automação.
 *
 *   SETOR       o assunto do site. É ele que o Giro conta.
 *   CONTEXTO    tecnologia geral e comentário de IA (`papel = 'contexto'`).
 *               Continuam colhidos e servem de pauta; ficam fora dos números
 *               da semana e da repercussão.
 *   COMUNIDADE  fórum e rede social (`tipo`). Atividade, não publicação.
 *
 * Sem essa separação o boletim da s37 dizia que o que repercutiu no setor de
 * automação foi "Trump White House tossed a grenade into space relations".
 *
 * ⚠️ O RELÓGIO não usa este filtro, de propósito: se uma fonte de contexto
 * publica sobre robótica e uma fonte brasileira repercute, o atraso medido é
 * verdadeiro. O filtro é sobre o que o boletim CONTA, não sobre o que a base
 * MEDE.
 */
const SETOR = `f.tipo NOT IN ('forum','social') AND f.papel = 'setor'`;
const CONTEXTO = `f.tipo NOT IN ('forum','social') AND f.papel = 'contexto'`;
const COMUNIDADE = `f.tipo IN ('forum','social')`;

export type Repercutido = { rotulo: string; fontes: number; chegou: number };
export type Fonte = { nome: string; pessoa: string | null; pais: string; tipo: string; papel: string; n: number };
export type Evento = { nome: string; slug: string; inicio: string; cidade: string | null; pais: string };
export type PecaDaSemana = { titulo: string; secao: string; data: string; slug: string };

export type DadosDaSemana = {
  janela: Janela;
  banco: string;
  apuradoEm: string;
  /** a semana ainda não fechou: serve para olhar, não para publicar */
  aberta: boolean;
  /** itens do SETOR — é o número que o boletim conta */
  itens: number;
  /** fórum e rede social */
  comunidade: number;
  /** tecnologia geral: colhida, fora da conta da semana */
  contexto: number;
  fontes: number;
  assuntos: number;
  sozinhos: number;
  repercutidos: Repercutido[];
  porFonte: Fonte[];
  relogio: { medidos: number; mediana: number | null; nao_chegaram: number };
  agenda: Evento[];
  pecas: PecaDaSemana[];
};

export function resolverJanela(alvo: string | undefined): Janela | null {
  return alvo ? janelaDoSlug(alvo) : semanaFechada();
}

export function colherSemana(janela: Janela, qual: QualBanco): DadosDaSemana {
  const BANCO = BANCOS[qual];
  const sql = <T = Record<string, unknown>>(comando: string): T[] => {
    const saida = execFileSync(
      process.execPath,
      [WRANGLER, 'd1', 'execute', BANCO.nome, ...BANCO.args, '--json', '--command', comando.replace(/\s+/g, ' ')],
      { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 256 * 1024 * 1024 },
    );
    return JSON.parse(saida.slice(saida.indexOf('[')))[0]?.results ?? [];
  };

  const { inicio, fim } = janela;
  const q = (s: string) => `'${s}'`;

  const naJanela = `i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}`;
  const contar = (filtro: string) =>
    sql<{ n: number }>(
      `SELECT COUNT(*) n FROM item i JOIN fonte f ON f.id = i.fonte_id
        WHERE f.ativo = 1 AND ${filtro} AND ${naJanela}`,
    )[0]!.n;

  const totais = sql<{ itens: number; fontes: number; assuntos: number }>(
    `SELECT COUNT(*) itens, COUNT(DISTINCT i.fonte_id) fontes, COUNT(DISTINCT i.assunto_id) assuntos
       FROM item i JOIN fonte f ON f.id = i.fonte_id
      WHERE f.ativo = 1 AND ${SETOR} AND ${naJanela}`,
  )[0]!;
  const comunidade = contar(COMUNIDADE);
  const contexto = contar(CONTEXTO);

  const porFonte = sql<Fonte>(
    `SELECT f.nome, f.pessoa, f.pais, f.tipo, f.papel, COUNT(*) n
       FROM item i JOIN fonte f ON f.id = i.fonte_id
      WHERE f.ativo = 1 AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}
      GROUP BY f.id ORDER BY n DESC`,
  );

  const repercutidos = sql<Repercutido>(
    `SELECT a.rotulo, COUNT(DISTINCT i.fonte_id) fontes,
            CASE WHEN a.primeira_mencao_br IS NULL THEN 0 ELSE 1 END chegou
       FROM assunto a JOIN item i ON i.assunto_id = a.id JOIN fonte f ON f.id = i.fonte_id
      WHERE f.ativo = 1 AND ${SETOR}
        AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}
      GROUP BY a.id HAVING fontes >= 2 ORDER BY fontes DESC LIMIT 10`,
  );

  const sozinhos = sql<{ n: number }>(
    `SELECT COUNT(*) n FROM (
       SELECT a.id FROM assunto a JOIN item i ON i.assunto_id = a.id JOIN fonte f ON f.id = i.fonte_id
        WHERE f.ativo = 1 AND ${SETOR}
          AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}
        GROUP BY a.id HAVING COUNT(DISTINCT i.fonte_id) = 1)`,
  )[0]!.n;

  const relogio = sql<{ medidos: number; mediana: number | null; nao_chegaram: number }>(
    `SELECT (SELECT COUNT(*) FROM assunto WHERE atraso_apurado_em >= ${q(inicio)} AND atraso_apurado_em < ${q(fim)}) medidos,
            (SELECT atraso_br_dias FROM assunto WHERE atraso_apurado_em >= ${q(inicio)} AND atraso_apurado_em < ${q(fim)}
                AND atraso_br_dias IS NOT NULL ORDER BY atraso_br_dias
                LIMIT 1 OFFSET (SELECT COUNT(*)/2 FROM assunto WHERE atraso_apurado_em >= ${q(inicio)} AND atraso_apurado_em < ${q(fim)} AND atraso_br_dias IS NOT NULL)) mediana,
            (SELECT COUNT(*) FROM assunto WHERE publicado_original >= ${q(inicio)} AND publicado_original < ${q(fim)} AND primeira_mencao_br IS NULL) nao_chegaram`,
  )[0]!;

  const agenda = sql<Evento>(
    `SELECT nome, slug, inicio, cidade, pais FROM evento
      WHERE status = 'publicado' AND inicio >= ${q(fim)} AND inicio < datetime(${q(fim)}, '+30 days')
      ORDER BY inicio LIMIT 8`,
  );

  /* O que o Instituto publicou na semana sai dos arquivos, não do banco: o
     conteúdo mora no git. */
  const pecas: PecaDaSemana[] = [];
  for (const secao of ['noticias', 'artigos', 'relatorios']) {
    const pasta = join(RAIZ, 'conteudo', secao);
    if (!existsSync(pasta)) continue;
    for (const n of readdirSync(pasta).filter((x) => x.endsWith('.md'))) {
      const m = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/.exec(n);
      if (!m) continue;
      const data = m[1]!;
      if (data < inicio.slice(0, 10) || data >= fim.slice(0, 10)) continue;
      const texto = readFileSync(join(pasta, n), 'utf8');
      const titulo = /^titulo:\s*"?(.+?)"?\s*$/m.exec(texto)?.[1] ?? m[2]!;
      pecas.push({ titulo, secao, data, slug: m[2]! });
    }
  }
  pecas.sort((a, b) => a.data.localeCompare(b.data));

  return {
    janela,
    banco: BANCO.rotulo,
    apuradoEm: new Date().toISOString().slice(0, 16).replace('T', ' '),
    aberta: new Date(janela.fim).getTime() > Date.now(),
    itens: totais.itens,
    comunidade,
    contexto,
    fontes: totais.fontes,
    assuntos: totais.assuntos,
    sozinhos,
    repercutidos,
    porFonte,
    relogio,
    agenda,
    pecas,
  };
}

/**
 * Todo inteiro que o boletim tem direito de usar.
 *
 * É o conjunto que a auditoria do compilador confere contra a prosa: número
 * que não esteja aqui para o build. Montado a partir do MESMO objeto que
 * gerou o texto, então não há como a lista e o texto discordarem.
 */
export function numerosPermitidos(d: DadosDaSemana): number[] {
  const n = new Set<number>([
    d.itens, d.comunidade, d.contexto, d.fontes, d.assuntos, d.sozinhos,
    d.relogio.medidos, d.relogio.nao_chegaram,
    d.repercutidos.length, d.agenda.length, d.pecas.length,
    ...(d.relogio.mediana !== null ? [d.relogio.mediana] : []),
    ...d.repercutidos.map((r) => r.fontes),
    ...d.porFonte.map((f) => f.n),
  ]);
  return [...n].sort((a, b) => a - b);
}
