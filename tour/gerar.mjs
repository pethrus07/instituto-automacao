/* O TOUR NARRADO — gerado do site rodando, não gravado à mão.
   ─────────────────────────────────────────────────────────────────
   Motor copiado dos tutoriais do Mettria (qa-parresia/tutoriais/motor),
   que é genérico de propósito; o método está em
   sinapse/03-PROJETOS/tutoriais-em-video.md. Em ordem:

     1. narra   — cada cena vira um MP3 (edge-tts, voz pt-BR), e a duração
                  dele manda no tempo da cena
     2. grava   — o Playwright dirige o site de verdade, com ponteiro desenhado,
                  e o ponteiro anda no compasso da PALAVRA falada
     3. recorta — cada parte vira um MP4 no palco 1280×720 com a narração
     4. emenda  — as partes viram um vídeo só, com capítulos e LEGENDAS (WebVTT)

   Diferenças em relação ao original do Mettria: aqui grava-se o site LOCAL
   (`npm run dev` na porta 8787), só leitura, sem trava de escrita — o tour
   não preenche nem envia formulário nenhum. A saída vai para publico/tour/,
   que o Worker serve como asset, e a página /blueprints a embute.

   Rodar:  npm run tour          (com o dev de pé)
   Variáveis: VOZ, RITMO, BASE (padrão http://127.0.0.1:8787).

   O vídeo é regenerável: mudou a tela, roda de novo. Por isso o roteiro
   (roteiro-site.mjs) é conteúdo versionado e .trabalho/ não é.
*/
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { narrar, duracao } from "./motor/narrar.mjs";
import { abrirGravacao, criarCena, rodarBloco } from "./motor/gravar.mjs";
import { recortar, trilha, juntar, emendar, capitulos, relogio } from "./motor/montar.mjs";

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const TRABALHO = path.join(RAIZ, ".trabalho");
const SAIDA = path.join(RAIZ, "..", "publico", "tour");
const passo = (n, t) => console.log(`\n[${n}] ${t}`);

const roteiro = await import("./roteiro-site.mjs");
const VOZ = process.env.VOZ || roteiro.VOZ;
const RITMO = process.env.RITMO || roteiro.RITMO || "+0%";
const PREFIXO = roteiro.PREFIXO || "tour";
fs.mkdirSync(TRABALHO, { recursive: true });
fs.mkdirSync(SAIDA, { recursive: true });

/* ── 1. narração ─────────────────────────────────────────────── */
passo(1, `Narração (voz ${VOZ}, ritmo ${RITMO})`);
const audios = {};
let totalFala = 0;
for (const parte of roteiro.PARTES) {
  for (const cena of parte.cenas) {
    const arq = path.join(TRABALHO, "audio", `${cena.id}.mp3`);
    audios[cena.id] = await narrar(cena.narracao, arq, { voz: VOZ, ritmo: RITMO });
    totalFala += audios[cena.id].segundos;
    console.log(`    ${cena.id.padEnd(24)} ${audios[cena.id].segundos.toFixed(1)}s` + (audios[cena.id].doCache ? "  (cache)" : ""));
  }
}
console.log(`    ── total falado: ${relogio(totalFala)}`);
if (process.env.SO_NARRAR) process.exit(0);

/* ── 2. gravação, em blocos de mesma tela ────────────────────── */
passo(2, "Gravação do site");
const blocos = [];
for (const parte of roteiro.PARTES) {
  const ultimo = blocos[blocos.length - 1];
  if (ultimo && ultimo.tela === parte.tela) ultimo.partes.push(parte);
  else blocos.push({ tela: parte.tela, partes: [parte] });
}

const navegador = await chromium.launch();
for (const [i, bloco] of blocos.entries()) {
  const pasta = path.join(TRABALHO, "bruto", String(i));
  fs.rmSync(pasta, { recursive: true, force: true });
  fs.mkdirSync(pasta, { recursive: true });
  const { ctx, page, videoZero } = await abrirGravacao(navegador, bloco.tela, pasta);
  const c = criarCena(page, { ganchos: roteiro.GANCHOS });

  /* Folga de partida: o screencast do Chromium engata com ~1,3 s de atraso;
     sem esta espera, o desconto do atraso seria ceifado no zero. */
  await page.waitForTimeout(2500);

  const cenas = bloco.partes.flatMap((p) => p.cenas);
  console.log(`    bloco ${i + 1}/${blocos.length} · ${bloco.tela} · ${cenas.length} cenas`);
  const marcas = await rodarBloco(c, cenas, audios, { tolerante: true, t0: videoZero });

  const fimRelogio = (Date.now() - videoZero) / 1000;
  await ctx.close();
  bloco.video = fs.readdirSync(pasta).filter((f) => f.endsWith(".webm")).map((f) => path.join(pasta, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
  if (!bloco.video) throw new Error(`bloco ${i}: o Playwright não deixou vídeo em ${pasta}`);

  const videoDur = await duracao(bloco.video);
  bloco.atraso = Math.max(0, fimRelogio - videoDur);
  console.log(`    relógio ${fimRelogio.toFixed(2)}s · vídeo ${videoDur.toFixed(2)}s · atraso de partida ${bloco.atraso.toFixed(2)}s`);
  let k = 0;
  for (const parte of bloco.partes) {
    const minhas = marcas.slice(k, k + parte.cenas.length);
    k += parte.cenas.length;
    parte.inicio = minhas[0].inicio;
    parte.fim = minhas[minhas.length - 1].fim;
    parte.marcas = minhas;
    parte.bloco = bloco;
  }
}
await navegador.close();

const falhas = roteiro.PARTES.flatMap((p) => (p.marcas || []).filter((m) => m.falhou).map((m) => ({ parte: p.id, cena: m.id, erro: m.falhou })));
if (falhas.length) {
  console.log(`\n    ⚠ ${falhas.length} cena(s) falharam — o vídeo NÃO é publicável:`);
  for (const f of falhas) console.log(`      ${f.parte} / ${f.cena}: ${f.erro}`);
} else console.log("    todas as cenas executaram");

/* ── 3. cada parte vira um MP4 com a sua narração ────────────── */
passo(3, "Montagem das partes");
for (const parte of roteiro.PARTES) {
  const semSom = path.join(TRABALHO, "partes", `${parte.id}-mudo.mp4`);
  await recortar(parte.bloco.video, semSom, {
    inicio: Math.max(0, parte.inicio - parte.bloco.atraso),
    fim: Math.max(0, parte.fim - parte.bloco.atraso),
  });
  const dur = parte.fim - parte.inicio;
  const cenas = parte.marcas.map((m) => ({ inicio: m.inicio - parte.inicio, duracao: audios[m.id]?.segundos ?? 0, audio: audios[m.id]?.arquivo }));
  const som = await trilha(cenas, dur, path.join(TRABALHO, "partes", `${parte.id}.m4a`));
  parte.arquivo = await juntar(semSom, som, path.join(TRABALHO, "partes", `${parte.id}.mp4`));
  console.log(`    ${parte.id.padEnd(20)} ${relogio(dur)}`);
}

/* ── 4. o vídeo, os capítulos e as legendas ──────────────────── */
passo(4, "Vídeo final");
const destino = path.join(SAIDA, `${PREFIXO}.mp4`);
await emendar(roteiro.PARTES.map((p) => p.arquivo), destino);

let t = 0;
const marcasCap = [];
const legendas = [];
const vtt = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = (s % 60).toFixed(3).padStart(6, "0");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${seg}`;
};
for (const parte of roteiro.PARTES) {
  marcasCap.push({ inicio: t, titulo: parte.titulo || parte.id });
  for (const m of parte.marcas) {
    const cena = parte.cenas.find((c) => c.id === m.id);
    const ini = t + (m.inicio - parte.inicio);
    const fim = ini + (audios[m.id]?.segundos ?? 0);
    legendas.push(`${vtt(ini)} --> ${vtt(fim)}\n${cena.narracao.trim()}`);
  }
  t += parte.fim - parte.inicio;
}
capitulos(marcasCap, destino.replace(/\.mp4$/, "-capitulos.txt"));
fs.writeFileSync(path.join(SAIDA, `${PREFIXO}.vtt`), `WEBVTT\n\n${legendas.join("\n\n")}\n`, "utf8");

const tamanho = (fs.statSync(destino).size / 1024 / 1024).toFixed(1);
console.log(`    ${path.basename(destino)}  ${relogio(t)}  ${tamanho} MB  + capítulos + legendas WebVTT`);
console.log(`\nPronto. Saída em publico/tour/. Os arquivos de trabalho ficam em tour/.trabalho (fora do git).`);
