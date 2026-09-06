/**
 * A 404: diz que não existe, não entra no índice, e devolve à capa.
 */
import type { Context } from 'hono';
import { Documento } from '../ui/Documento';
import { pagina, type Ambiente } from './app';

export function naoEncontrado(c: Context<Ambiente>) {
  return c.html(
    pagina(
      <Documento titulo="Não encontrado" naoIndexar>
        <header class="cabeca-secao">
          <h1>Não encontrado</h1>
          <p class="cabeca-secao__lead">
            A página que você procurou não existe, ou ainda não existe. <a href="/">Voltar à capa</a>, ou
            ver as <a href="/noticias">notícias</a>, os <a href="/relatorios">relatórios</a> e a{' '}
            <a href="/agenda">agenda</a>.
          </p>
        </header>
      </Documento>,
    ),
    404,
  );
}
