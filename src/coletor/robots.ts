/**
 * robots.txt — ler antes de buscar, e obedecer.
 *
 * Nasceu de uma medição: três fontes do setor devolveram 403 à sondagem, e
 * olhar o robots.txt de cada uma mostrou que eram TRÊS CASOS DIFERENTES —
 *
 *   Control Engineering  robots 200, `User-agent: * / Allow: /`, mas bloqueia
 *                        por nome Amazonbot, CCBot, ClaudeBot, Bytespider.
 *                        Rastreador comum pode; a intenção contra IA é clara.
 *   Automation World     robots 403. Sem regra legível não há consentimento
 *                        a inferir, e o correto é não coletar.
 *   The Robot Report     robots 200, libera tudo, e pede `Crawl-delay: 10`.
 *                        Estávamos coletando sem respeitar o pedido.
 *
 * A postura do projeto é a mesma do resto: nada de trocar user-agent, usar
 * proxy ou navegador headless para driblar detecção. O diferencial do
 * Instituto é publicar em /blueprints o link que autoriza cada fonte — uma
 * fonte obtida furando bloqueio apareceria naquela tabela como o quê?
 *
 * Este módulo é essa postura virada código, e o veredito vai para o
 * inventário público.
 */

export type Robots = {
  /** Pode buscar? `null` = não deu para saber (robots inacessível). */
  permite: boolean | null;
  /** Segundos pedidos entre requisições, se a fonte pedir. */
  atraso: number | null;
  /** Por que o veredito é esse — vai para o inventário, legível por humano. */
  motivo: string;
};

const NOSSO_AGENTE = 'institutoautomacaobot';

/**
 * Lê e interpreta o robots.txt do host.
 *
 * Interpretação deliberadamente CONSERVADORA: na dúvida, não permite. Um
 * parser generoso aqui erra para o lado de coletar quem não quer ser
 * coletado, e esse é o erro que o projeto não pode cometer.
 */
export async function lerRobots(urlAlvo: string, userAgent: string): Promise<Robots> {
  let origem: string;
  let caminho: string;
  try {
    const u = new URL(urlAlvo);
    origem = u.origin;
    caminho = u.pathname + u.search;
  } catch {
    return { permite: false, atraso: null, motivo: 'URL inválida' };
  }

  let texto: string;
  try {
    const r = await fetch(`${origem}/robots.txt`, {
      headers: { 'user-agent': userAgent },
      signal: AbortSignal.timeout(8000),
    });
    // 404 é resposta legítima e quer dizer "sem restrição declarada".
    if (r.status === 404) return { permite: true, atraso: null, motivo: 'sem robots.txt' };
    if (!r.ok) {
      return {
        permite: null,
        atraso: null,
        motivo: `robots.txt respondeu ${r.status} — sem regra legível, não coletamos`,
      };
    }
    texto = await r.text();
  } catch {
    return { permite: null, atraso: null, motivo: 'robots.txt inacessível' };
  }

  return interpretarRobots(texto, caminho);
}

/**
 * A parte pura: dado o texto do robots.txt e um caminho, o veredito.
 *
 * Separada de `lerRobots` de propósito — é ela que decide se uma fonte entra
 * no radar, e decisão dessa gravidade tem de ser testável sem rede. Os casos
 * de `scripts/testar-robots.ts` são robots.txt reais, copiados na medição.
 */
export function interpretarRobots(texto: string, caminho: string): Robots {
  const { grupos, atrasoSolto } = agrupar(texto);
  /* O grupo do nosso nome vence o curinga, como manda o padrão — e a
     comparação é por prefixo, não por pedaço solto: `User-agent: ClaudeBot`
     não é regra sobre nós, e `User-agent: bot` também não. */
  const nosso = grupos.find((g) =>
    g.agentes.some((a) => a !== '*' && a.length > 0 && NOSSO_AGENTE.startsWith(a)),
  );
  const curinga = grupos.find((g) => g.agentes.includes('*'));
  const grupo = nosso ?? curinga;

  if (!grupo) {
    return { permite: true, atraso: atrasoSolto, motivo: 'robots.txt sem regra aplicável' };
  }

  const permite = permitido(grupo, caminho);
  return {
    permite,
    atraso: grupo.atraso ?? atrasoSolto,
    motivo: permite
      ? nosso
        ? 'robots.txt permite o nosso agente'
        : 'robots.txt permite o curinga'
      : `robots.txt proíbe ${caminho}`,
  };
}

type Grupo = { agentes: string[]; regras: { permite: boolean; caminho: string }[]; atraso: number | null };

/**
 * Quebra o arquivo em grupos, e devolve também o Crawl-delay solto.
 *
 * O solto existe de verdade: o robots.txt do The Robot Report abre com
 * `Crawl-delay: 10` ANTES do primeiro `User-agent`. Pelo padrão, diretiva
 * fora de grupo é indefinida e pode ser ignorada — e era o que fazíamos,
 * silenciosamente. Mas a intenção de quem escreveu está clara, e a postura
 * do projeto é obedecer o pedido, não o tecnicismo. Vale como piso quando o
 * grupo aplicável não trouxer um seu.
 */
function agrupar(texto: string): { grupos: Grupo[]; atrasoSolto: number | null } {
  const grupos: Grupo[] = [];
  let atual: Grupo | null = null;
  let acabouDeVerAgente = false;
  let atrasoSolto: number | null = null;

  for (const bruta of texto.split('\n')) {
    const linha = bruta.split('#')[0]!.trim();
    if (!linha) continue;
    const i = linha.indexOf(':');
    if (i < 0) continue;
    const campo = linha.slice(0, i).trim().toLowerCase();
    const valor = linha.slice(i + 1).trim();

    if (campo === 'user-agent') {
      // User-agent seguidos sem regra no meio compartilham o mesmo grupo.
      if (!atual || !acabouDeVerAgente) {
        atual = { agentes: [], regras: [], atraso: null };
        grupos.push(atual);
      }
      atual.agentes.push(valor.toLowerCase());
      acabouDeVerAgente = true;
      continue;
    }
    if (!atual) {
      // fora de grupo: só o Crawl-delay é aproveitado, como piso global
      if (campo === 'crawl-delay') {
        const n = Number.parseFloat(valor);
        if (Number.isFinite(n) && n > 0) atrasoSolto = Math.max(atrasoSolto ?? 0, n);
      }
      continue;
    }
    acabouDeVerAgente = false;

    if (campo === 'disallow') atual.regras.push({ permite: false, caminho: valor });
    else if (campo === 'allow') atual.regras.push({ permite: true, caminho: valor });
    else if (campo === 'crawl-delay') {
      const n = Number.parseFloat(valor);
      if (Number.isFinite(n) && n > 0) atual.atraso = n;
    }
  }
  return { grupos, atrasoSolto };
}

/** Regra mais específica vence; empate vai para Allow, como manda o padrão. */
function permitido(grupo: Grupo, caminho: string): boolean {
  let melhor: { permite: boolean; tamanho: number } | null = null;

  for (const r of grupo.regras) {
    /* `Disallow:` vazio quer dizer "sem restrição" — é como o The Robot
       Report escreve a permissão dele. Não impõe nada, então não muda o
       veredito; só não pode encerrar a leitura, porque o mesmo grupo ainda
       pode trazer um Disallow de verdade depois. */
    if (r.caminho === '') continue;
    if (!casa(caminho, r.caminho)) continue;
    const tamanho = r.caminho.length;
    if (!melhor || tamanho > melhor.tamanho || (tamanho === melhor.tamanho && r.permite)) {
      melhor = { permite: r.permite, tamanho };
    }
  }
  return melhor ? melhor.permite : true;
}

/** Suporta `*` no meio e `$` no fim, que é o que os robots.txt reais usam. */
function casa(caminho: string, padrao: string): boolean {
  const fim = padrao.endsWith('$');
  const p = fim ? padrao.slice(0, -1) : padrao;
  const partes = p.split('*');
  let pos = 0;

  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i]!;
    if (parte === '') continue;
    const achou = i === 0 ? (caminho.startsWith(parte) ? 0 : -1) : caminho.indexOf(parte, pos);
    if (achou < 0) return false;
    pos = achou + parte.length;
  }
  return fim ? pos === caminho.length : true;
}
