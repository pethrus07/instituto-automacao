/* MOTOR · montagem
   ─────────────────────────────────────────────────────────────────
   Recorte, normalização, trilha de narração e junção — tudo em ffmpeg.

   O ffmpeg vem de `@ffmpeg-installer/ffmpeg`: binário estático dentro do
   node_modules, nada instalado no sistema. Já conferido nesta máquina:
   decodifica vp8/vp9 (o Playwright grava em webm) e codifica H.264 + AAC.

   Genérico: não sabe nada do projeto. Copiável como está.
*/
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import ffmpeg from "@ffmpeg-installer/ffmpeg";

const exec = promisify(execFile);
const rodar = args => exec(ffmpeg.path, ["-hide_banner", "-loglevel", "error", "-y", ...args],
  { maxBuffer: 1 << 26 });

export const PALCO = { largura: 1280, altura: 720, fundo: "0x090c14", fps: 30 };

/** mm:ss a partir de segundos — usado nos capítulos. */
export const relogio = s => {
  // arredonda ANTES de dividir, senão 59,7s vira "00:60" em vez de "01:00"
  const t = Math.round(s);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

/**
 * Recorta um trecho e põe no palco padrão.
 * O trecho de celular entra centralizado num fundo escuro, para as duas
 * telas casarem no mesmo quadro sem distorcer nada.
 */
export async function recortar(entrada, saida, { inicio, fim, palco = PALCO, moldura = false } = {}) {
  fs.mkdirSync(path.dirname(saida), { recursive: true });

  /* Gravação de celular é bem mais alta que larga: no quadro de 16 por 9
     ela fica solta no meio. Com uma moldura fina em volta, lê como
     aparelho em vez de vídeo cortado. */
  const dentro = moldura
    ? `scale=-2:${palco.altura - 44},pad=iw+6:ih+6:3:3:color=0x2b384c,`
    : `scale=${palco.largura}:${palco.altura}:force_original_aspect_ratio=decrease,`;
  const filtro = dentro +
    `pad=${palco.largura}:${palco.altura}:(ow-iw)/2:(oh-ih)/2:color=${palco.fundo},` +
    `fps=${palco.fps},format=yuv420p`;
  const args = ["-i", entrada];
  if (inicio != null) args.push("-ss", String(inicio));
  if (fim != null) args.push("-to", String(fim));
  args.push("-vf", filtro, "-an",
    "-c:v", "libx264", "-preset", "medium", "-crf", "23", saida);  // 23: tela de site é plana; 20 dava 12 MB por 2 min
  await rodar(args);
  return saida;
}

const TAXA = 24000;   // o edge-tts entrega 24 kHz mono

/**
 * Monta a trilha de narração de um trecho: cada áudio entra no instante em
 * que a cena começa. Devolve o caminho do áudio, ou null se não houver.
 *
 * Cada cena precisa de { inicio, duracao, audio }.
 *
 * NÃO usa `amix`. O `amix` normaliza o ganho, mas *como* ele normaliza
 * muda entre versões do ffmpeg: nesta build ele divide pelas entradas
 * ATIVAS naquele instante (as narrações não se sobrepõem, então divide por
 * 1), enquanto em versões novas divide pelo total. Compensar isso na mão
 * dá certo numa versão e estoura na outra — na primeira montagem o áudio
 * saiu +16 dB, batendo no teto. Aqui a trilha é montada emendando
 * silêncio e clipe em sequência: o nível é o do arquivo original, em
 * qualquer versão.
 */
export async function trilha(cenas, total, saida) {
  const usadas = cenas
    .filter(c => c.audio && fs.existsSync(c.audio))
    .sort((a, b) => a.inicio - b.inicio);
  if (!usadas.length) return null;
  fs.mkdirSync(path.dirname(saida), { recursive: true });

  const args = [];
  const filtros = [];
  const ordem = [];
  let entrada = 0;
  let relogioTrilha = 0;

  const silencio = segundos => {
    if (segundos <= 0.02) return;
    args.push("-f", "lavfi", "-t", segundos.toFixed(3), "-i", `anullsrc=r=${TAXA}:cl=mono`);
    ordem.push(`[${entrada}:a]`);
    entrada++;
    relogioTrilha += segundos;
  };

  for (const c of usadas) {
    silencio(c.inicio - relogioTrilha);
    args.push("-i", c.audio);
    // todo mundo no mesmo formato, senão o concat recusa
    filtros.push(`[${entrada}:a]aresample=${TAXA},aformat=sample_fmts=fltp:channel_layouts=mono[c${entrada}]`);
    ordem.push(`[c${entrada}]`);
    entrada++;
    relogioTrilha += c.duracao ?? 0;
  }
  // rabicho de silêncio até o fim do trecho: sem ele o `-shortest` da
  // junção cortaria o VÍDEO no ponto em que a última fala termina
  silencio(total - relogioTrilha);

  filtros.push(`${ordem.join("")}concat=n=${ordem.length}:v=0:a=1[saida]`);
  args.push("-filter_complex", filtros.join(";"),
    "-map", "[saida]", "-t", String(total),
    "-c:a", "aac", "-b:a", "160k", saida);
  await rodar(args);
  return saida;
}

/** Junta imagem e som num arquivo só. */
export async function juntar(video, audio, saida) {
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  if (!audio) { fs.copyFileSync(video, saida); return saida; }
  // a trilha já saiu em AAC: copiar evita um segundo encode, que além de
  // perder qualidade faz o pico estourar um pouco acima do teto
  await rodar(["-i", video, "-i", audio,
    "-c:v", "copy", "-c:a", "copy", "-shortest",
    "-movflags", "+faststart", saida]);
  return saida;
}

/** Emenda vários trechos já normalizados num vídeo só. */
export async function emendar(arquivos, saida) {
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  const lista = saida + ".lista.txt";
  fs.writeFileSync(lista,
    arquivos.map(a => `file '${path.resolve(a).replace(/\\/g, "/")}'`).join("\n"), "utf8");
  await rodar(["-f", "concat", "-safe", "0", "-i", lista,
    "-c", "copy", "-movflags", "+faststart", saida]);
  fs.unlinkSync(lista);
  return saida;
}

/** Arquivo de capítulos, no formato que YouTube e players entendem. */
export function capitulos(marcas, saida) {
  const texto = marcas.map(m => `${relogio(m.inicio)}  ${m.titulo}`).join("\n") + "\n";
  fs.writeFileSync(saida, texto, "utf8");
  return texto;
}
