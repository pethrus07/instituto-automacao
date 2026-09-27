/**
 * SUBMISSÕES — a ponte entre a caixa de entrada do editor e o git.
 *
 *   npm run submissoes -- --homolog                     o que chegou (ou --producao / --local)
 *   npm run submissoes -- --homolog --abrir IA-7K2Q9M   escreve o artigo no repositório
 *   npm run submissoes -- --homolog --estado IA-7K2Q9M publicada|recusada|em_edicao
 *
 * O editor de /escrever grava o envio na tabela `submissao` (migração 009).
 * Nada dali vai para o ar sozinho: é isto que transforma o envio em arquivo,
 * e só o arquivo no git publica. O "--abrir":
 *
 *   · escreve conteudo/artigos/AAAA-MM-DD-<slug>.md com o frontmatter pronto;
 *   · baixa as imagens para publico/imagens/<slug>-1.jpg, -2.jpg… e troca os
 *     nomes provisórios (img-xxxx.jpg) no texto;
 *   · se o autor é novo, cria conteudo/autores/<slug>.md (e a foto em
 *     publico/autores/) — o compilador recusa artigo de autor sem arquivo;
 *   · marca o envio como `em_edicao`.
 *
 * Depois: ler o texto, `npm run compilar` (que aborta se algo do dialeto
 * estiver errado), conferir no `npm run dev`, e commitar. O "está liberado de
 * subir" da reunião de 24/09 é esse commit — e é decisão de gente.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BANCOS, RAIZ, type QualBanco } from './dados-da-semana.ts';
import { pautaPorSlug } from '../src/pautas.ts';

const WRANGLER = join(RAIZ, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const args = process.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const valor = (n: string) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const qual: QualBanco = flag('producao') ? 'producao' : flag('local') ? 'local' : 'homolog';
const BANCO = BANCOS[qual];

function sql<T = Record<string, unknown>>(comando: string): T[] {
  const saida = execFileSync(process.execPath, [WRANGLER, 'd1', 'execute', BANCO.nome, ...BANCO.args, '--json', '--command', comando], {
    cwd: RAIZ,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 256 * 1024 * 1024,
  });
  return JSON.parse(saida.slice(saida.indexOf('[')))[0]?.results ?? [];
}
const aspas = (s: string) => `'${s.replace(/'/g, "''")}'`;

type Linha = {
  id: string;
  protocolo: string;
  pauta: string | null;
  titulo: string;
  autor_nome: string;
  autor_email: string;
  autor_json: string;
  meta_json: string;
  markdown: string;
  estado: string;
  criado_em: string;
};

const slugificar = (s: string, max = 60) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, max)
    .replace(/-+$/, '') || 'artigo';

console.log(`· banco: ${BANCO.rotulo}`);

/* ------------------------------------------------------------ mudar o estado */
const alvoEstado = valor('estado');
if (alvoEstado) {
  const novo = args[args.indexOf('--estado') + 2];
  if (!novo || !['recebida', 'em_edicao', 'publicada', 'recusada'].includes(novo)) {
    console.error('uso: npm run submissoes -- --estado IA-XXXXXX publicada|recusada|em_edicao|recebida');
    process.exit(1);
  }
  sql(`UPDATE submissao SET estado = ${aspas(novo)} WHERE protocolo = ${aspas(alvoEstado)}`);
  console.log(`✓ ${alvoEstado} → ${novo}`);
  process.exit(0);
}

/* ------------------------------------------------------------ abrir um envio */
const alvo = valor('abrir');
if (alvo) {
  const [s] = sql<Linha>(`SELECT * FROM submissao WHERE protocolo = ${aspas(alvo)}`);
  if (!s) {
    console.error(`✗ não achei o protocolo ${alvo} no ${BANCO.rotulo}`);
    process.exit(1);
  }
  const meta = JSON.parse(s.meta_json) as { titulo: string; lead: string; formato: string; nivel: string };
  const autor = JSON.parse(s.autor_json) as { papel: string; bio: string; link: string | null; foto: boolean };
  const hoje = new Date().toISOString().slice(0, 10);
  const slug = slugificar(meta.titulo);
  const arquivo = join(RAIZ, 'conteudo', 'artigos', `${hoje}-${slug}.md`);
  if (existsSync(arquivo)) {
    console.error(`✗ já existe ${arquivo.replace(RAIZ, '.')} — apague ou renomeie antes de abrir de novo`);
    process.exit(1);
  }

  /* as imagens, uma por vez: BLOB vem como hex, e uma consulta por arquivo
     mantém a saída do wrangler pequena */
  const nomes = sql<{ nome: string; tipo: string; bytes: number }>(`SELECT nome, tipo, bytes FROM submissao_arquivo WHERE submissao_id = ${aspas(s.id)} ORDER BY nome`);
  let corpo = s.markdown;
  let n = 0;
  mkdirSync(join(RAIZ, 'publico', 'imagens'), { recursive: true });
  const slugAutor = slugificar(s.autor_nome, 40);
  let foto: string | null = null;
  for (const a of nomes) {
    const [{ hex } = { hex: '' }] = sql<{ hex: string }>(`SELECT hex(dados) AS hex FROM submissao_arquivo WHERE submissao_id = ${aspas(s.id)} AND nome = ${aspas(a.nome)}`);
    const bytes = Buffer.from(hex, 'hex');
    const ext = a.tipo === 'image/png' ? 'png' : 'jpg';
    if (a.nome === 'foto.jpg') {
      mkdirSync(join(RAIZ, 'publico', 'autores'), { recursive: true });
      foto = `${slugAutor}.${ext}`;
      const destino = join(RAIZ, 'publico', 'autores', foto);
      if (!existsSync(destino)) writeFileSync(destino, bytes);
      continue;
    }
    const final = `${slug}-${++n}.${ext}`;
    writeFileSync(join(RAIZ, 'publico', 'imagens', final), bytes);
    corpo = corpo.split(a.nome).join(final);
    console.log(`  imagem  ${a.nome} → publico/imagens/${final} (${(a.bytes / 1024).toFixed(0)} KB)`);
  }

  const pauta = s.pauta ? pautaPorSlug(s.pauta) : null;
  const q = (v: string) => `"${v.replace(/"/g, "'")}"`;
  const fm = [
    '---',
    `titulo:    ${q(meta.titulo)}`,
    'secao:     artigos',
    `formato:   ${meta.formato}`,
    '# tema: industria ou processos — confira (o frontmatter não aceita comentário na mesma linha)',
    'tema:      industria',
    `nivel:     ${meta.nivel}`,
    pauta ? `pauta:     ${pauta.slug}` : null,
    `lead:      ${q(meta.lead)}`,
    `autor:     ${s.autor_nome}`,
    `data:      ${hoje}`,
    `# enviado pelo editor em ${s.criado_em} UTC · protocolo ${s.protocolo}`,
    '---',
    '',
    corpo.trim(),
    '',
  ]
    .filter((l) => l !== null)
    .join('\n');
  writeFileSync(arquivo, fm, 'utf8');
  console.log(`✓ artigo  ${arquivo.replace(RAIZ, '.')}`);

  const arqAutor = join(RAIZ, 'conteudo', 'autores', `${slugAutor}.md`);
  if (existsSync(arqAutor)) {
    console.log(`· autor   ${arqAutor.replace(RAIZ, '.')} já existe — não mexi (confira se a bio nova é melhor)`);
  } else {
    const fa = [
      '---',
      `nome: ${s.autor_nome}`,
      `papel: ${autor.papel || 'Colaborador'}`,
      'ordem: 50',
      autor.link ? `link: ${autor.link}` : null,
      autor.link ? `link_rotulo: ${/linkedin/i.test(autor.link) ? 'LinkedIn' : /lattes/i.test(autor.link) ? 'Lattes' : 'Site'}` : null,
      foto ? `foto: ${foto}` : null,
      `# e-mail (não publicado): ${s.autor_email}`,
      '---',
      autor.bio,
      '',
    ]
      .filter((l) => l !== null)
      .join('\n');
    writeFileSync(arqAutor, fa, 'utf8');
    console.log(`✓ autor   ${arqAutor.replace(RAIZ, '.')} (novo${foto ? ', com foto' : ''})`);
  }

  sql(`UPDATE submissao SET estado = 'em_edicao' WHERE id = ${aspas(s.id)}`);
  console.log(`\nPróximo: ler o texto, npm run compilar, npm run dev, e commitar. Depois:`);
  console.log(`  npm run submissoes -- --${qual} --estado ${s.protocolo} publicada`);
  console.log(`  e responder ${s.autor_email}.`);
  process.exit(0);
}

/* ------------------------------------------------------------ a caixa de entrada */
const lista = sql<Linha & { imagens: number }>(
  `SELECT s.protocolo, s.criado_em, s.estado, s.titulo, s.autor_nome, s.pauta,
          (SELECT COUNT(*) FROM submissao_arquivo a WHERE a.submissao_id = s.id AND a.nome <> 'foto.jpg') AS imagens
     FROM submissao s ORDER BY s.criado_em DESC LIMIT 50`,
);
if (!lista.length) {
  console.log('Nenhum artigo recebido pelo editor ainda.');
  process.exit(0);
}
for (const s of lista) {
  console.log(`${s.protocolo}  ${s.criado_em.slice(0, 16)}  ${s.estado.padEnd(9)}  ${s.autor_nome} — ${s.titulo}${s.pauta ? `  [pauta ${s.pauta}]` : '  [tema livre]'}  · ${s.imagens} imagem(ns)`);
}
console.log(`\nPara trazer um para o repositório: npm run submissoes -- --${qual} --abrir <protocolo>`);
