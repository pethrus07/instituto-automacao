/**
 * O glossário — a régua pública de como escrevemos.
 *
 * Lê a tabela `glossario` (semeada por seed.sql) e separa em duas listas: os
 * termos com tradução travada e os que NÃO se traduzem (`manter_original`),
 * que ficam na língua de origem com o significado aproximado. Nas peças a
 * tradução vai inline; esta página é o complemento para quem quer conferir.
 * O JSON-LD declara DefinedTermSet, um termo por DefinedTerm.
 */
import { Documento } from '../ui/Documento';
import { Secao } from '../ui/pecas';
import { ldJson, glossarioLd, trilhaLd } from '../ui/jsonld';
import { CACHE } from '../config';
import { listarGlossario } from '../db';
import { novaApp, pagina } from './app';

export const glossario = novaApp();

glossario.get('/glossario', async (c) => {
  const termos = await listarGlossario(c.env.DB);
  const traduz = termos.filter((t) => !t.manter_original);
  const mantem = termos.filter((t) => t.manter_original);
  const site = c.env.SITE_URL;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Glossário"
        secao="glossario"
        descricao={`Os ${termos.length} termos técnicos de automação e como o Instituto os escreve em português — inclusive os que não se traduzem.`}
        url={site + '/glossario'}
        ld={[ldJson(glossarioLd(termos, site)), ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Glossário', url: `${site}/glossario` }]))]}
      >
        <header class="cabeca-secao">
          <h1>Glossário</h1>
          <p class="cabeca-secao__lead">
            A régua pública de como escrevemos. Vocabulário de automação em português é traiçoeiro:
            quem traduz cru erra na primeira linha, e o engenheiro percebe antes do segundo parágrafo.
          </p>
        </header>

        <section class="bloco">
          <Secao titulo={`Traduções travadas · ${traduz.length}`} />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            Têm equivalente consagrado no setor, e ele é obrigatório.
          </p>
          <dl>
            {traduz.map((t) => (
              <div class="termo">
                <dt class="termo__par">
                  <span class="termo__origem">{t.termo_origem}</span>
                  <span class="termo__seta">→</span>
                  <span class="termo__pt">{t.termo_pt}</span>
                  <span class="termo__travado">{t.idioma}</span>
                </dt>
                {t.nota && <dd class="termo__nota">{t.nota}</dd>}
              </div>
            ))}
          </dl>
        </section>

        <section class="bloco">
          <Secao titulo={`Não se traduzem · ${mantem.length}`} />
          <p class="u-muted" style="max-width: var(--measure); margin-block-end: var(--space-m)">
            Ficam na língua de origem, com o significado aproximado na primeira ocorrência. Inventar
            equivalente que ninguém usa no chão de fábrica é pior que manter o estrangeirismo.
          </p>
          <dl>
            {mantem.map((t) => (
              <div class="termo">
                <dt class="termo__par">
                  <span class="termo__origem">{t.termo_origem}</span>
                  <span class="termo__seta">→</span>
                  <span class="termo__pt">mantém {t.termo_origem}</span>
                  <span class="termo__travado">{t.idioma}</span>
                </dt>
                {t.nota && <dd class="termo__nota">({t.nota})</dd>}
              </div>
            ))}
          </dl>
        </section>
      </Documento>,
    ),
  );
});
