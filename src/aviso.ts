/**
 * O AVISO de artigo recebido — por e-mail, na hora.
 *
 * 28/09/2026: o envio do editor só aparecia na pauta de sábado, e um escritor
 * podia esperar até sete dias sem ninguém ter visto o texto dele. Agora chega
 * um e-mail no minuto em que o artigo entra na caixa de entrada.
 *
 * Usa o Email Routing da Cloudflare (binding AVISO, `send_email`): o destino
 * é fixo no wrangler.toml e precisa estar VERIFICADO na zona; o remetente é
 * um endereço do domínio (AVISO_DE). Sem o binding — dev local, ou antes da
 * zona existir — não faz nada, e o envio do autor segue normal.
 *
 * ⚠️ Chamado por `ctx.waitUntil`: promessa solta é cancelada quando a resposta
 * sai, e o miniflare local deixa terminar — o defeito só apareceria em
 * produção.
 */
import { EmailMessage } from 'cloudflare:email';
import type { Env } from './config';

const cabecalho = (s: string) => `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(s)))}?=`;

export async function avisarArtigo(env: Env, a: { protocolo: string; titulo: string; autor: string; pauta: string | null; palavras: number; imagens: number }): Promise<void> {
  if (!env.AVISO || !env.AVISO_DE) return;
  const texto = [
    `Chegou um artigo pelo editor de /escrever.`,
    ``,
    `  ${a.titulo}`,
    `  ${a.autor} · ${a.palavras} palavras · ${a.imagens} imagem(ns) · ${a.pauta ? `pauta ${a.pauta}` : 'tema livre'}`,
    `  protocolo ${a.protocolo}`,
    ``,
    `Para trazer para o repositório:`,
    `  npm run submissoes -- --producao --abrir ${a.protocolo}`,
    ``,
    `O autor recebeu o protocolo na tela e espera resposta por e-mail.`,
  ].join('\r\n');
  const raw = [
    `From: Instituto Automação <${env.AVISO_DE}>`,
    `To: aviso`,
    `Subject: ${cabecalho(`Artigo recebido: ${a.titulo}`)}`,
    `Message-ID: <${a.protocolo}.${Date.now()}@${env.AVISO_DE.split('@')[1]}>`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    texto,
  ].join('\r\n');
  try {
    // o destino é o do binding; o "To" do cabeçalho é só rótulo
    await env.AVISO.send(new EmailMessage(env.AVISO_DE, 'aviso', raw));
  } catch (e) {
    console.warn('[aviso] não consegui mandar o e-mail do artigo recebido:', (e as Error).message);
  }
}
