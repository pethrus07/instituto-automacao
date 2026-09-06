/* MOTOR · narração
   ─────────────────────────────────────────────────────────────────
   Texto → arquivo de áudio, com a duração medida.

   Usa o `edge-tts` (pip), que dá vozes neurais em português de graça e
   sem chave. Precisa de internet só na hora de gerar; o resultado é um
   arquivo local. Se um dia isso sair do ar, trocar aqui dentro é o
   suficiente — nada mais no motor sabe como a voz é feita.

   Genérico: não sabe nada do projeto. Copiável como está.
*/
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffprobe from "@ffprobe-installer/ffprobe";

const exec = promisify(execFile);

/** Gera o áudio de um texto. Devolve { arquivo, segundos, palavras }.
 *
 *  `palavras` é [{texto, t, dur}] — o instante em que CADA palavra é dita.
 *  É isso que permite o ponteiro andar no compasso da voz. Sem esse dado só
 *  restava dividir o tempo da cena em partes iguais entre os alvos, e foi o
 *  que gerou a queixa de "o guia aponta para um lugar e a voz já está lá na
 *  frente": a voz não fala em partes iguais.
 */
export async function narrar(texto, arquivo, { voz, ritmo = "+0%" } = {}) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const palavrasArq = arquivo.replace(/\.\w+$/, "") + ".palavras.json";
  const lerPalavras = () => {
    try { return JSON.parse(fs.readFileSync(palavrasArq, "utf8")); }
    catch { return []; }
  };

  /* Cache: dublar de novo o que não mudou é desperdício, e numa gravação
     longa uma falha lá no fim obrigaria a redublar tudo. A chave é o
     texto + a voz + o ritmo, guardada ao lado do áudio. */
  const chave = arquivo + ".chave";
  const atual = JSON.stringify({ texto, voz, ritmo, v: 2 });
  if (fs.existsSync(arquivo) && fs.existsSync(chave) && fs.existsSync(palavrasArq) &&
      fs.readFileSync(chave, "utf8") === atual) {
    return { arquivo, segundos: await duracao(arquivo), palavras: lerPalavras(), doCache: true };
  }

  // o texto vai por arquivo, não por linha de comando: acento e aspas
  // em português quebram a linha de comando do Windows com facilidade
  const entrada = arquivo.replace(/\.\w+$/, "") + ".txt";
  fs.writeFileSync(entrada, texto, "utf8");

  // helper próprio em vez de `python -m edge_tts`: o CLI não expõe o tempo
  // por palavra (a linha de comando só entrega legenda por frase)
  const helper = path.join(path.dirname(fileURLToPath(import.meta.url)), "narrar.py");
  await exec("python", [helper, voz, ritmo, entrada, arquivo, palavrasArq],
    { maxBuffer: 1 << 24 });

  fs.unlinkSync(entrada);
  fs.writeFileSync(chave, atual, "utf8");
  return { arquivo, segundos: await duracao(arquivo), palavras: lerPalavras() };
}

/** Duração de um arquivo de mídia, em segundos. */
export async function duracao(arquivo) {
  const { stdout } = await exec(ffprobe.path, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    arquivo,
  ]);
  return parseFloat(stdout.trim());
}

/** Lista as vozes disponíveis de um idioma — útil para escolher. */
export async function vozes(idioma = "pt-BR") {
  const { stdout } = await exec("python", ["-c",
    "import asyncio,edge_tts,json;" +
    "print(json.dumps([v['ShortName'] for v in asyncio.run(edge_tts.list_voices())]))"]);
  return JSON.parse(stdout).filter(v => v.startsWith(idioma));
}
