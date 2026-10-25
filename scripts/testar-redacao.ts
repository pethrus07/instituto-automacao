/**
 * Teste da revisão da redação automática (scripts/redacao.ts › revisar).
 *
 * A notícia automática só vai ao ar se passar nela — então ela tem de
 * REPROVAR o que deve. Trava que nunca reprova é decoração: cada caso abaixo
 * estraga uma notícia boa de um jeito só e confere que a revisão pega.
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { revisar } from './redacao.ts';

let ok = 0;
let falhou = 0;
function conferir(nome: string, real: unknown, esperado: unknown) {
  if (JSON.stringify(real) === JSON.stringify(esperado)) {
    ok++;
    console.log(`  ok   ${nome}`);
  } else {
    falhou++;
    console.log(`  FALHA ${nome}\n        esperado: ${JSON.stringify(esperado)}\n        veio:     ${JSON.stringify(real)}`);
  }
}

const FONTE = `Acme Robotics announced a new palletizing cell that handles 1200 boxes per hour with 2 arms.
The company said the cell costs 40 percent less to install and ships in 2027. Its CEO said the design took 18 months.
The palletizer uses a vision system and a conveyor, and the controller runs on a standard industrial PC with safety rated monitored stop.`;

const corpo = (muda: string) => `A **Acme Robotics** lançou uma célula de paletização que movimenta **1200 caixas por hora** com 2 braços. Segundo a empresa, a instalação custa 40% menos, e as entregas começam em 2027. O projeto levou 18 meses, disse o presidente.

A célula usa visão e esteira, e o controlador roda num PC industrial comum, com parada monitorada de segurança. ${'Texto de contexto sobre a célula, sem número nenhum, para dar corpo à notícia e chegar no tamanho mínimo que a revisão exige de uma notícia curta. '.repeat(14)}

## O que isso muda aqui

${muda}`;

const MUDA = '*A caminho* — a paletização é das primeiras células que o integrador brasileiro vende para a indústria de alimentos e de bebidas, e uma célula mais barata de instalar muda a conta de quem ainda paletiza na mão. Falta saber se haverá representante por aqui, e quanto custa a célula depois de importada; sem isso, o anúncio é referência de preço para negociar com quem já vende solução parecida no Brasil.';

const fm = (extra = '', autor = 'Redação do Instituto') => `---
secao: noticias
formato: contexto
tema: industria
titulo: Acme lança célula de paletização que custa menos para instalar
titulo_curto: Acme lança paletizadora mais barata
lead: A célula movimenta 1200 caixas por hora com 2 braços e, segundo a empresa, custa 40% menos para instalar. As entregas começam em 2027.
autor: ${autor}
data: 2026-10-14
imagem:
  arquivo:   2026-10-14-siemens-skeleton-supercapacitores.jpg
  credito:   Acme
  licenca:   press
  alt:       Dois braços robóticos empilham caixas de papelão sobre um palete numa célula cercada
veredito: a_caminho
fonte:
  nome: Exemplo
  url: https://exemplo.com/acme
  idioma: en
  publicado: ${new Date().toISOString().slice(0, 10)}
${extra}---

`;

const pasta = mkdtempSync(join(tmpdir(), 'redacao-'));
const escrever = (nome: string, texto: string) => {
  const f = join(pasta, `2026-10-14-${nome}.md`);
  writeFileSync(f, texto, 'utf8');
  return f;
};
const erros = (f: string, fonte: string | null = FONTE) => revisar(f, fonte).erros;
const tem = (lista: string[], trecho: string) => lista.some((e) => e.includes(trecho));

console.log('A revisão da redação');
const boa = escrever('boa', fm() + corpo(MUDA));
conferir('a notícia boa passa', erros(boa), []);
conferir('número que não está na fonte reprova', tem(erros(escrever('numero', fm() + corpo(MUDA).replace('18 meses', '24 meses'))), '24'), true);
conferir('sem leitura da fonte reprova', tem(erros(boa, null), 'leitura da fonte'), true);
conferir('autor que é pessoa reprova', tem(erros(escrever('autor', fm('', 'Pedro Oliveira') + corpo(MUDA))), 'autor'), true);
conferir('sem "O que isso muda aqui" reprova', tem(erros(escrever('sem-muda', fm() + corpo(MUDA).replace('## O que isso muda aqui', '## Depois'))), 'O que isso muda aqui'), true);
conferir('"O que isso muda aqui" raso reprova', tem(erros(escrever('raso', fm() + corpo('*A caminho* — talvez.'))), 'no mínimo 400'), true);
conferir('trecho colado da fonte reprova', tem(erros(escrever('copia', fm() + corpo(MUDA) + '\n\nThe palletizer uses a vision system and a conveyor, and the controller runs on a standard industrial PC.')), 'copiado'), true);
conferir('fala de assistente reprova', tem(erros(escrever('assistente', fm() + corpo(MUDA) + '\n\nEspero que isso ajude!')), 'assistente'), true);
conferir('imagem que não existe reprova', tem(erros(escrever('sem-imagem', fm().replace('2026-10-14-siemens-skeleton-supercapacitores.jpg', 'nao-existe.jpg') + corpo(MUDA))), 'não está em publico/imagens'), true);
conferir('marcador de rascunho reprova', tem(erros(escrever('rascunho', fm() + corpo(MUDA) + '\n\nTODO: conferir o preço.')), 'rascunho'), true);
conferir('mas "todo" em português não é marcador', erros(escrever('todo', fm() + corpo(MUDA) + '\n\nVale para todo integrador.')), []);
conferir('intertítulo que pula nível reprova', tem(erros(escrever('salto', fm() + corpo(MUDA).replace('## O que isso muda aqui', '### Detalhe\n\nTexto.\n\n## O que isso muda aqui'))), 'pula nível'), true);
conferir('"# " no corpo reprova (o h1 é o título)', tem(erros(escrever('h1', fm() + '# Outro título\n\n' + corpo(MUDA))), 'h1'), true);
conferir('"###" debaixo de "##" passa', erros(escrever('sub', fm() + corpo(MUDA).replace('## O que isso muda aqui', '## Contexto\n\nTexto.\n\n### Detalhe\n\nTexto.\n\n## O que isso muda aqui'))), []);
conferir('o teste não alterou a notícia boa', readFileSync(boa, 'utf8').includes('18 meses'), true);

console.log(`\n${ok} ok · ${falhou} falha(s)`);
if (falhou > 0) process.exit(1);
