/**
 * A prancha da marca — PROTOTIPAL. O símbolo é o que o site já usa
 * (src/ui/marca.ts); o nome é Newsreader convertido em caminhos para o SVG
 * viver fora do site. Quando a marca definitiva existir, trocam-se os
 * arquivos em publico/marca/ e a função simbolo(); esta página muda sozinha.
 */
import { raw } from 'hono/html';
import { Documento } from '../ui/Documento';
import { Secao, Aviso } from '../ui/pecas';
import { ldJson, trilhaLd } from '../ui/jsonld';
import { simbolo } from '../ui/marca';
import { CACHE } from '../config';
import { novaApp, pagina } from './app';

export const marca = novaApp();

const ARQUIVOS_MARCA = [
  ['logo-horizontal.svg', 'Logo horizontal · cor'],
  ['logo-horizontal-negativo.svg', 'Logo horizontal · negativo (fundo escuro)'],
  ['logo-horizontal-mono.svg', 'Logo horizontal · monocromático (herda a cor do texto)'],
  ['logo-vertical.svg', 'Logo vertical · cor'],
  ['logo-vertical-negativo.svg', 'Logo vertical · negativo'],
  ['logo-vertical-mono.svg', 'Logo vertical · monocromático'],
  ['simbolo.svg', 'Símbolo · cor'],
  ['simbolo-negativo.svg', 'Símbolo · negativo'],
  ['simbolo-mono.svg', 'Símbolo · monocromático'],
  ['icone-quadrado.svg', 'Ícone quadrado · claro (avatar, favicon)'],
  ['icone-quadrado-escuro.svg', 'Ícone quadrado · escuro'],
] as const;

marca.get('/marca', (c) => {
  const site = c.env.SITE_URL;
  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Marca"
        secao="marca"
        descricao="A marca gráfica do Instituto Automação em versão prototipal: símbolo, nome, cores, construção, regras e arquivos para download."
        url={site + '/marca'}
        ld={ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Marca', url: `${site}/marca` }]))}
      >
        <header class="cabeca-secao">
          <h1>Marca</h1>
          <p class="cabeca-secao__lead">
            Versão <strong>prototipal</strong>. Um anel, um raio que varre e um ponto aceso: o setor lá fora,
            a leitura daqui, o que chega. Vale até a marca definitiva existir — e tudo o que a usa importa de
            um lugar só, então trocá-la é trocar dois arquivos.
          </p>
        </header>

        <section class="bloco">
          <Secao titulo="O símbolo" />
          <div class="prancha">
            <div class="prancha__caixa">
              {raw(simbolo(160))}
              <p class="prancha__legenda">Sobre papel. Azul é a instituição; laranja é o que importa.</p>
            </div>
            <div class="prancha__caixa prancha__caixa--escura">
              <img src="/marca/simbolo-negativo.svg" alt="Símbolo em branco com o ponto laranja, sobre o azul das capas" width="160" height="160" />
              <p class="prancha__legenda">Sobre o azul das capas: o anel vira branco, o ponto continua laranja.</p>
            </div>
            <div class="prancha__caixa">
              <svg viewBox="0 0 64 64" width="160" height="160" role="img" aria-label="Esquema de construção do símbolo: anel, raio a 38 graus, ponto a 62% do raio">
                <circle cx="32" cy="32" r="27" fill="none" stroke="var(--rule)" stroke-width="0.6" stroke-dasharray="1.5 1.5" />
                <line x1="32" y1="2" x2="32" y2="62" stroke="var(--rule)" stroke-width="0.6" stroke-dasharray="1.5 1.5" />
                <line x1="2" y1="32" x2="62" y2="32" stroke="var(--rule)" stroke-width="0.6" stroke-dasharray="1.5 1.5" />
                <path d="M59 32 A27 27 0 0 0 53.28 15.38" fill="none" stroke="var(--acao)" stroke-width="0.8" />
                <line x1="32" y1="32" x2="53.28" y2="15.38" stroke="var(--marca)" stroke-width="1.6" stroke-linecap="round" />
                <circle cx="45.19" cy="21.7" r="4.6" fill="none" stroke="var(--acao)" stroke-width="0.8" />
                <circle cx="32" cy="32" r="2.6" fill="none" stroke="var(--marca)" stroke-width="0.8" />
                <circle cx="32" cy="32" r="27" fill="none" stroke="var(--marca)" stroke-width="0.8" />
              </svg>
              <p class="prancha__legenda">
                Construção em 64 × 64: anel de raio 27 e traço 3,2; raio a −38°; ponto a 62% do raio, com
                raio 4,6; centro com raio 2,6; varredura de 0° ao raio, a 14% de opacidade.
              </p>
            </div>
          </div>
        </section>

        <section class="bloco">
          <Secao titulo="O nome" />
          <div class="prancha">
            <div class="prancha__caixa prancha__caixa--larga">
              <img src="/marca/logo-horizontal.svg" alt="Logo horizontal: símbolo à esquerda, 'Instituto' em peso regular e 'Automação' em negrito, em azul" width="1043" height="134" />
              <p class="prancha__legenda">Horizontal, a forma principal. Newsreader: "Instituto" regular, "Automação" negrito, espaçamento −0,022 em. O símbolo mede 0,86 do corpo do texto e centra na altura das capitulares.</p>
            </div>
            <div class="prancha__caixa prancha__caixa--escura prancha__caixa--larga">
              <img src="/marca/logo-horizontal-negativo.svg" alt="Logo horizontal em branco sobre azul escuro, com o ponto laranja" width="1043" height="134" />
              <p class="prancha__legenda">Negativo, para o azul das capas e fundos escuros.</p>
            </div>
            <div class="prancha__caixa">
              <img src="/marca/logo-vertical.svg" alt="Logo vertical: símbolo grande sobre o nome" width="619" height="262" />
              <p class="prancha__legenda">Vertical, para espaços quadrados: avatar, capa, crachá.</p>
            </div>
            <div class="prancha__caixa prancha__caixa--escura">
              <img src="/marca/logo-vertical-negativo.svg" alt="Logo vertical em branco sobre azul escuro" width="619" height="262" />
              <p class="prancha__legenda">Vertical, negativo.</p>
            </div>
            <div class="prancha__caixa prancha__mono">
              <img src="/marca/logo-horizontal-mono.svg" alt="Logo horizontal monocromático, na cor do texto" width="1043" height="134" />
              <p class="prancha__legenda">Monocromático: herda a cor do texto (<code>currentColor</code>). Para carimbo, gravação, uma cor só.</p>
            </div>
          </div>
        </section>

        <section class="bloco">
          <Secao titulo="Tamanhos" />
          <div class="tamanhos">
            {[16, 24, 32, 44, 64, 96].map((t) => (
              <figure>
                {raw(simbolo(t))}
                <figcaption>{t} px</figcaption>
              </figure>
            ))}
            <figure>
              <img src="/marca/logo-horizontal.svg" alt="" width="140" height="18" />
              <figcaption>140 px · mínimo do horizontal</figcaption>
            </figure>
          </div>
          <p class="u-muted" style="max-width: var(--measure); margin-block-start: var(--space-m)">
            O símbolo sobrevive a 16 px porque tem quatro formas e duas cores, nada mais. O horizontal não
            desce de 140 px: abaixo disso o nome fica ilegível e o símbolo deve ir sozinho.
          </p>
        </section>

        <section class="bloco">
          <Secao titulo="Cores" />
          <div class="amostras">
            <div class="amostra"><div class="amostra__cor" style="background: var(--marca)"></div><span class="amostra__nome">Azul · marca</span><span class="amostra__hex">#0d47a1 · escuro #6f9df3</span></div>
            <div class="amostra"><div class="amostra__cor" style="background: var(--acao)"></div><span class="amostra__nome">Laranja · o ponto</span><span class="amostra__hex">#c2410c · escuro #f97316</span></div>
            <div class="amostra"><div class="amostra__cor" style="background: var(--capa-fundo)"></div><span class="amostra__nome">Azul das capas · fundo escuro</span><span class="amostra__hex">#0a2540</span></div>
            <div class="amostra"><div class="amostra__cor" style="background: var(--paper)"></div><span class="amostra__nome">Papel · fundo claro</span><span class="amostra__hex">o fundo da página</span></div>
          </div>
          <p class="u-muted" style="max-width: var(--measure); margin-block-start: var(--space-m)">
            São as mesmas cores do site, com o mesmo trabalho: azul é a instituição (anel, raio, centro, nome);
            laranja é o que importa (o ponto, e só ele). Nada de gradiente, nada de sombra.
          </p>
        </section>

        <section class="bloco">
          <Secao titulo="Regras" />
          <ul class="regras">
            <li><strong>O ponto fica onde está.</strong> A −38°, a 62% do raio. Mover o ponto é outra marca.</li>
            <li><strong>Não gira.</strong> O raio aponta para cima e para a direita; é a direção de quem lê o que vem de fora.</li>
            <li><strong>Duas cores, sempre as mesmas.</strong> Azul e laranja da paleta; ou uma cor só, no monocromático.</li>
            <li><strong>Fundo: papel ou o azul das capas.</strong> Sobre foto ou fundo colorido, usa-se o ícone quadrado.</li>
            <li><strong>Respiro de meio anel.</strong> Nada encosta na marca a menos de metade da altura do símbolo.</li>
            <li><strong>Nunca sem o ponto.</strong> Sem ele sobra um relógio parado; com ele, um radar que achou algo.</li>
          </ul>
        </section>

        <section class="bloco">
          <Secao titulo="Arquivos" />
          <ul class="lista">
            {ARQUIVOS_MARCA.map(([arquivo, rotulo]) => (
              <li>
                <a href={`/marca/${arquivo}`} download>{rotulo}</a>
                <span class="u-muted"> · </span>
                <code>{arquivo}</code>
              </li>
            ))}
          </ul>
          <Aviso>
            <strong>Prototipal.</strong> Esta marca nasceu do vocabulário das capas geradas para o site ter uma
            identidade enquanto a definitiva não existe. Quando ela existir, substituem-se os arquivos em{' '}
            <code>publico/marca/</code> e a função <code>simbolo()</code> em <code>src/ui/marca.ts</code>; o
            cabeçalho, o favicon, o rodapé e esta página mudam sozinhos.
          </Aviso>
        </section>
      </Documento>,
    ),
  );
});
