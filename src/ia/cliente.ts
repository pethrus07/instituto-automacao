/**
 * A camada fina sobre a SDK da Anthropic.
 *
 * Duas responsabilidades e nada mais: devolver a resposta já no formato que
 * o pipeline espera, e contabilizar o que cada chamada custou. Prompt fica
 * em etapas.ts; orquestração fica no pipeline.
 *
 * MODO SIMULAÇÃO (`IA_SIMULAR=1`): devolve resposta determinística sem
 * chamar a API. Existe porque a chave é da conta do sócio e todo teste com
 * chave real gasta dinheiro dele — dá para exercitar o pipeline inteiro,
 * inclusive o teto, sem gastar um centavo.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Env } from '../config';
import { calcularUsd, type Uso } from './precos';

export type Resposta<T> = { dado: T; uso: Uso; simulado: boolean };

export const simulando = (env: Env) => env.IA_SIMULAR === '1' || !env.ANTHROPIC_API_KEY;

function cliente(env: Env): Anthropic {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2 });
}

const usoZero = (modelo: string): Uso => ({ modelo, tokens_in: 0, tokens_out: 0, usd: 0 });

/**
 * Chamada que devolve texto puro. Usada na tradução, onde a saída é prosa e
 * amarrar em esquema só atrapalharia.
 */
export async function pedirTexto(
  env: Env,
  opcoes: {
    modelo: string;
    sistema: string;
    entrada: string;
    maxTokens?: number;
    /** Trecho estável do sistema (glossário) marcado para cache. */
    sistemaCacheavel?: string;
    simulacao: string;
  },
): Promise<Resposta<string>> {
  if (simulando(env)) return { dado: opcoes.simulacao, uso: usoZero(opcoes.modelo), simulado: true };

  const sistema: Anthropic.TextBlockParam[] = [];
  if (opcoes.sistemaCacheavel) {
    sistema.push({
      type: 'text',
      text: opcoes.sistemaCacheavel,
      cache_control: { type: 'ephemeral' },
    });
  }
  sistema.push({ type: 'text', text: opcoes.sistema });

  const r = await cliente(env).messages.create({
    model: opcoes.modelo,
    max_tokens: opcoes.maxTokens ?? 4000,
    system: sistema,
    messages: [{ role: 'user', content: opcoes.entrada }],
  });

  const texto = r.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  return { dado: texto, uso: medir(opcoes.modelo, r.usage), simulado: false };
}

/**
 * Chamada que devolve dado estruturado.
 *
 * Usa tool use ESTRITO em vez de pedir JSON no prompt: com `strict: true` +
 * `additionalProperties: false` + `required`, o que volta em `input` já
 * validou contra o esquema. Pedir JSON em prosa é a forma clássica de
 * receber texto explicativo em volta e quebrar o parse em produção.
 */
export async function pedirEstruturado<T>(
  env: Env,
  opcoes: {
    modelo: string;
    sistema: string;
    entrada: string;
    ferramenta: { nome: string; descricao: string; esquema: Record<string, unknown> };
    maxTokens?: number;
    sistemaCacheavel?: string;
    simulacao: T;
  },
): Promise<Resposta<T>> {
  if (simulando(env)) return { dado: opcoes.simulacao, uso: usoZero(opcoes.modelo), simulado: true };

  const sistema: Anthropic.TextBlockParam[] = [];
  if (opcoes.sistemaCacheavel) {
    sistema.push({
      type: 'text',
      text: opcoes.sistemaCacheavel,
      cache_control: { type: 'ephemeral' },
    });
  }
  sistema.push({ type: 'text', text: opcoes.sistema });

  const r = await cliente(env).messages.create({
    model: opcoes.modelo,
    max_tokens: opcoes.maxTokens ?? 2000,
    system: sistema,
    messages: [{ role: 'user', content: opcoes.entrada }],
    tools: [
      {
        name: opcoes.ferramenta.nome,
        description: opcoes.ferramenta.descricao,
        strict: true,
        input_schema: opcoes.ferramenta.esquema as Anthropic.Tool['input_schema'],
      },
    ],
    tool_choice: { type: 'tool', name: opcoes.ferramenta.nome },
  });

  const bloco = r.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === opcoes.ferramenta.nome,
  );
  if (!bloco) throw new Error(`modelo não devolveu ${opcoes.ferramenta.nome}`);

  return { dado: bloco.input as T, uso: medir(opcoes.modelo, r.usage), simulado: false };
}

function medir(modelo: string, u: Anthropic.Usage): Uso {
  return {
    modelo,
    tokens_in: u.input_tokens + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
    tokens_out: u.output_tokens,
    usd: calcularUsd(modelo, u),
  };
}

/**
 * Classifica a falha para o pipeline decidir entre desistir do item ou parar
 * o lote inteiro. Erro de credencial não melhora tentando o próximo item;
 * limite de taxa, sim.
 */
export function classificarFalha(erro: unknown): 'parar' | 'pular' {
  if (erro instanceof Anthropic.AuthenticationError) return 'parar';
  if (erro instanceof Anthropic.RateLimitError) return 'parar';
  if (erro instanceof Anthropic.APIError && erro.status && erro.status >= 500) return 'parar';
  return 'pular';
}
