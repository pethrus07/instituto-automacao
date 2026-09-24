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
 * IMPRENSA e COMUNIDADE contadas separado.
 *
 * Em 23/09/2026 o Fórum Home Assistant sozinho era 297 dos 557 itens da s38 —
 * 53%. Somar tudo num total só faria o Giro dizer "a semana teve 557 itens"
 * quando metade é thread de fórum de automação residencial num site de
 * automação industrial. O número que descreve a semana do SETOR é o de
 * imprensa; o fórum é atividade de comunidade, e aparece dito assim.
 */
const PUBLICACAO = `f.tipo NOT IN ('forum','social')`;

export type Repercutido = { rotulo: string; fontes: number; chegou: number };
export type Fonte = { nome: string; pessoa: string | null; pais: string; tipo: string; n: number };
export type Evento = { nome: string; slug: string; inicio: string; cidade: string | null; pais: string };
export type PecaDaSemana = { titulo: string; secao: string; data: string; slug: string };

export type DadosDaSemana = {
  janela: Janela;
  banco: string;
  apuradoEm: string;
  /** a semana ainda não fechou: serve para olhar, não para publicar */
  aberta: boolean;
  itens: number;
  comunidade: number;
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

  const totais = sql<{ itens: number; fontes: number; assuntos: number; comunidade: number }>(
    `SELECT COUNT(*) itens, COUNT(DISTINCT i.fonte_id) fontes, COUNT(DISTINCT i.assunto_id) assuntos,
            (SELECT COUNT(*) FROM item i2 JOIN fonte f2 ON f2.id = i2.fonte_id
              WHERE f2.ativo = 1 AND f2.tipo IN ('forum','social')
                AND i2.publicado_fonte >= ${q(inicio)} AND i2.publicado_fonte < ${q(fim)}) comunidade
       FROM item i JOIN fonte f ON f.id = i.fonte_id
      WHERE f.ativo = 1 AND ${PUBLICACAO}
        AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}`,
  )[0]!;

  const porFonte = sql<Fonte>(
    `SELECT f.nome, f.pessoa, f.pais, f.tipo, COUNT(*) n
       FROM item i JOIN fonte f ON f.id = i.fonte_id
      WHERE f.ativo = 1 AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}
      GROUP BY f.id ORDER BY n DESC`,
  );

  const repercutidos = sql<Repercutido>(
    `SELECT a.rotulo, COUNT(DISTINCT i.fonte_id) fontes,
            CASE WHEN a.primeira_mencao_br IS NULL THEN 0 ELSE 1 END chegou
       FROM assunto a JOIN item i ON i.assunto_id = a.id JOIN fonte f ON f.id = i.fonte_id
      WHERE f.ativo = 1 AND ${PUBLICACAO}
        AND i.publicado_fonte >= ${q(inicio)} AND i.publicado_fonte < ${q(fim)}
      GROUP BY a.id HAVING fontes >= 2 ORDER BY fontes DESC LIMIT 10`,
  );

  const sozinhos = sql<{ n: number }>(
    `SELECT COUNT(*) n FROM (
       SELECT a.id FROM assunto a JOIN item i ON i.assunto_id = a.id JOIN fonte f ON f.id = i.fonte_id
        WHERE f.ativo = 1 AND ${PUBLICACAO}
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
    comunidade: totais.comunidade,
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
    d.itens, d.comunidade, d.fontes, d.assuntos, d.sozinhos,
    d.relogio.medidos, d.relogio.nao_chegaram,
    d.repercutidos.length, d.agenda.length, d.pecas.length,
    ...(d.relogio.mediana !== null ? [d.relogio.mediana] : []),
    ...d.repercutidos.map((r) => r.fontes),
    ...d.porFonte.map((f) => f.n),
  ]);
  return [...n].sort((a, b) => a - b);
}
