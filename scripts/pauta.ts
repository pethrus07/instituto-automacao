/**
 * A PAUTA DA SEMANA — a pergunta que a máquina faz ao editor.
 *
 *   npm run pauta -- --homolog                 escreve colheita/pauta-semana-<data>.md e mostra
 *   npm run pauta -- --homolog --issue         o mesmo, no formato da issue do GitHub (stdout)
 *   npm run pauta -- --aprovadas 12            lê a issue nº 12 e diz o que foi marcado
 *
 * Reunião de 24/09/2026. O Pedro disse ao sócio que o fluxo não humano já
 * estava inteiro: "da coleta, a leitura, ele só faz a pergunta para mim —
 * esse e esse artigo está liberado de subir — e eu aprovo". A coleta era
 * verdade; a PERGUNTA não existia. A pauta era `npm run colher`, manual, lendo
 * o banco local, e o aceite pedia "muito mais informação do lado de cá do que
 * precisava". Este script é a pergunta, e ela pede duas coisas só:
 *
 *   1. quais destes assuntos viram notícia (caixa de marcar);
 *   2. qual abre a capa.
 *
 * E, na mesma mensagem, os artigos que chegaram pelo editor de /escrever:
 * "está liberado de subir?". O resto — o texto, o veredito proposto, a imagem
 * de imprensa — vem pronto para ler antes de ir ao ar, que é quando a
 * assinatura de quem aprova vale.
 *
 * ⚠️ CONTAR, NÃO JULGAR (a regra de 24/09). A ordem da lista é fórmula
 * publicada, não opinião: quantas fontes falaram do assunto, se já chegou ao
 * Brasil, quão recente é. A máquina ordena; quem escolhe é gente. Sem modelo
 * de linguagem em lugar nenhum.
 *
 * O `.github/workflows/pauta-semanal.yml` roda isto todo sábado de manhã e
 * abre a issue — o GitHub avisa por e-mail. Responder é marcar as caixas.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BANCOS, RAIZ, type QualBanco } from './dados-da-semana.ts';

const WRANGLER = join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const valor = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};

/* ------------------------------------------------------------ ler a resposta */
const nIssue = valor('aprovadas');
if (nIssue) {
  const corpo = JSON.parse(execFileSync('gh', ['issue', 'view', nIssue, '--json', 'body,title,comments'], { cwd: RAIZ, encoding: 'utf8' })) as { body: string; title: string; comments: { body: string }[] };
  const marcadas = [...corpo.body.matchAll(/^- \[x\] (.+)$/gim)].map((m) => m[1]!);
  const principal = /principal:\s*(\d+)/i.exec([corpo.body, ...corpo.comments.map((c) => c.body)].join('\n'))?.[1];
  console.log(`${corpo.title}\n`);
  if (!marcadas.length) console.log('Nada marcado ainda.');
  for (const m of marcadas) console.log(`✓ ${m.replace(/\*\*/g, '')}`);
  console.log(principal ? `\nA principal da capa: nº ${principal}` : '\nA principal: não indicada — a capa escolhe sozinha a mais recente com foto.');
  process.exit(0);
}

const qual: QualBanco = flag('producao') ? 'producao' : flag('local') ? 'local' : 'homolog';
const BANCO = BANCOS[qual];
const sql = <T = Record<string, unknown>>(comando: string): T[] => {
  const saida = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', BANCO.nome, ...BANCO.args, '--json', '--command', comando.replace(/\s+/g, ' ')], {
    cwd: RAIZ,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  });
  return JSON.parse(saida.slice(saida.indexOf('[')))[0]?.results ?? [];
};

/* ------------------------------------------------------------ o que já saiu */
const jaPublicadas = new Set<string>();
for (const nome of existsSync(join(RAIZ, 'conteudo', 'noticias')) ? readdirSync(join(RAIZ, 'conteudo', 'noticias')) : []) {
  const m = /^\s+url:\s*(\S+)/m.exec(readFileSync(join(RAIZ, 'conteudo', 'noticias', nome), 'utf8'));
  if (m) jaPublicadas.add(m[1]!.replace(/\/$/, ''));
}

/* ------------------------------------------------------------ a lista
 * Só o SETOR (a coluna `papel`, migração 008), só imprensa (fórum e rede
 * social não são notícia), só os últimos 7 dias. Um item por assunto: o mais
 * antigo, que é quem publicou primeiro. */
const DIAS = Number(valor('dias') ?? 7);
type Candidato = { assunto_id: string | null; titulo: string; url: string; fonte: string; pais: string; idioma: string; publicado: string; fontes: number; br: number; atraso: number | null };
const linhas = sql<Candidato>(`
  WITH janela AS (
    SELECT i.*, f.nome AS fonte, f.pais AS pais
      FROM item i JOIN fonte f ON f.id = i.fonte_id
     WHERE f.ativo = 1 AND f.tipo NOT IN ('forum','social') AND f.papel = 'setor'
       AND i.publicado_fonte >= datetime('now', '-${DIAS} days')
  ),
  por_assunto AS (
    SELECT i.assunto_id,
           COUNT(DISTINCT i.fonte_id) AS fontes,
           SUM(CASE WHEN f.pais = 'BR' THEN 1 ELSE 0 END) AS br
      FROM item i JOIN fonte f ON f.id = i.fonte_id
     WHERE i.assunto_id IN (SELECT assunto_id FROM janela)
     GROUP BY i.assunto_id
  )
  SELECT j.assunto_id, j.titulo, j.url, j.fonte, j.pais, j.idioma, j.publicado_fonte AS publicado,
         COALESCE(p.fontes, 1) AS fontes, COALESCE(p.br, 0) AS br, a.atraso_br_dias AS atraso
    FROM janela j
    LEFT JOIN por_assunto p ON p.assunto_id = j.assunto_id
    LEFT JOIN assunto a ON a.id = j.assunto_id
   WHERE j.publicado_fonte = (SELECT MIN(x.publicado_fonte) FROM janela x WHERE x.assunto_id = j.assunto_id)
`);

/* A FÓRMULA, publicada aqui para ninguém ter de adivinhar a ordem:
 *   3 pontos por fonte que falou do assunto (repercussão),
 *   2 se lá fora já falou e o Brasil ainda não (é a tese do site),
 *   1 se é de fonte brasileira (o leitor é daqui),
 *   e o desempate é o mais recente. */
const pontos = (c: Candidato) => 3 * c.fontes + (c.pais !== 'BR' && c.br === 0 ? 2 : 0) + (c.pais === 'BR' ? 1 : 0);
/* Já publicado é o ASSUNTO, não a URL: a Universal Robots saiu aqui pela fonte
   americana, e a versão brasileira do mesmo assunto voltava na pauta. */
const aspas = (u: string) => `'${u.replace(/'/g, "''")}'`;
const urls = [...jaPublicadas];
const assuntosPublicados = new Set(
  urls.length
    ? sql<{ assunto_id: string }>(`SELECT DISTINCT assunto_id FROM item WHERE assunto_id IS NOT NULL AND (url IN (${urls.map(aspas).join(',')}) OR url_canonica IN (${urls.map(aspas).join(',')}))`).map((r) => r.assunto_id)
    : [],
);
const candidatos = linhas
  .filter((c) => !jaPublicadas.has(c.url.replace(/\/$/, '')) && !(c.assunto_id && assuntosPublicados.has(c.assunto_id)))
  .sort((a, b) => pontos(b) - pontos(a) || b.publicado.localeCompare(a.publicado))
  .slice(0, Number(valor('quantos') ?? 10));

type Envio = { protocolo: string; titulo: string; autor_nome: string; pauta: string | null; criado_em: string };
let envios: Envio[] = [];
try {
  envios = sql<Envio>(`SELECT protocolo, titulo, autor_nome, pauta, criado_em FROM submissao WHERE estado = 'recebida' ORDER BY criado_em`);
} catch {
  /* banco sem a migração 009: sem envios, sem erro */
}

/* ------------------------------------------------------------ a escrita */
const hoje = new Date();
const de = new Date(hoje.getTime() - DIAS * 86_400_000);
const dm = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' });
const titulo = `Pauta da semana — ${dm(de)} a ${dm(hoje)}`;

const porque = (c: Candidato) =>
  [
    `${c.fontes} ${c.fontes === 1 ? 'fonte' : 'fontes'}`,
    c.pais === 'BR' ? 'imprensa brasileira' : c.br === 0 ? 'ainda não chegou ao Brasil' : c.atraso !== null ? `chegou aqui em ${c.atraso} dia(s)` : 'já saiu no Brasil',
  ].join(' · ');

const l: string[] = [];
l.push(`## ${titulo}`, '');
l.push(
  candidatos.length
    ? `A máquina separou ${candidatos.length} assuntos do setor que ainda não viraram notícia aqui. **Marque os que valem uma notícia** e, num comentário, escreva \`principal: N\` para o que abre a capa. Só isso: o texto, o veredito proposto e a imagem de imprensa chegam prontos para você ler antes de ir ao ar.`
    : 'Nenhum assunto novo do setor nos últimos dias — ou a coleta parou (confira o /saude).',
  '',
);
candidatos.forEach((c, i) =>
  l.push(`- [ ] **${i + 1}. ${c.titulo.replace(/[\[\]]/g, '')}** — ${c.fonte} (${c.idioma.toUpperCase()}) · ${porque(c)} · [ler](${c.url})`),
);
l.push('', `<sub>Ordem por fórmula, não por opinião: 3 por fonte que falou do assunto · +2 se lá fora falou e o Brasil não · +1 se é imprensa brasileira · desempate pelo mais recente. Só fontes do setor, só imprensa, últimos ${DIAS} dias, sem o que já foi publicado.</sub>`, '');
l.push('### Artigos que chegaram pelo editor', '');
if (envios.length) {
  l.push('Marque os que estão **liberados para subir** (a leitura é antes: `npm run submissoes -- --producao --abrir <protocolo>`).', '');
  for (const e of envios) l.push(`- [ ] **${e.protocolo}** — ${e.autor_nome}: ${e.titulo}${e.pauta ? ` · pauta \`${e.pauta}\`` : ' · tema livre'} · recebido ${e.criado_em.slice(0, 10)}`);
} else {
  l.push('Nenhum artigo novo esta semana.');
}
l.push('', `<sub>Gerado por \`npm run pauta\` (${BANCO.rotulo}) em ${hoje.toISOString().slice(0, 16).replace('T', ' ')} UTC. Para ler a resposta: \`npm run pauta -- --aprovadas <nº desta issue>\`.</sub>`);
const md = l.join('\n');

if (flag('issue')) {
  process.stdout.write(md + '\n');
} else {
  mkdirSync(join(RAIZ, 'colheita'), { recursive: true });
  const arq = join(RAIZ, 'colheita', `pauta-semana-${hoje.toISOString().slice(0, 10)}.md`);
  writeFileSync(arq, md, 'utf8');
  console.log(md);
  console.log(`\n→ ${arq.replace(RAIZ, '.')}`);
}
