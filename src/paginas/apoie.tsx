/**
 * Apoie — a única página comercial do site.
 *
 * O sócio pediu um espaço de parceiro na capa (feedback de 07/09/2026).
 * Esta página diz o que esse espaço é, o que o parceiro NÃO ganha (pauta,
 * notícia, veredito), quem já apoia, e como falar com a gente. Sem preço:
 * preço é conversa, e a conversa começa pelo formulário.
 */
import { Documento } from '../ui/Documento';
import { Secao, Aviso, FormularioContato } from '../ui/pecas';
import { ldJson, trilhaLd } from '../ui/jsonld';
import { CACHE } from '../config';
import { registrarContato } from '../db';
import { PARCEIROS } from '../parceiros';
import { passouDoLimite } from './limite';
import { novaApp, pagina } from './app';

export const apoie = novaApp();

const REGRAS = [
  ['Aparece na capa, em toda visita', 'Nome, logo e uma frase, no alto da capa, carregando com a página — não é anúncio que gira nem banner que some.'],
  ['Identificado como parceiro, sempre', 'O rótulo "Parceiro do Instituto" fica escrito. Leitor sabe o que está vendo.'],
  ['Não escreve notícia', 'O que o Instituto publica é lido na fonte e publicado com crédito e link. Parceiro não escreve, não revisa, não sugere.'],
  ['Não escolhe pauta nem veredito', 'O que entra, o que fica de fora e o "chega aqui / não chega" são decisão editorial, e o critério é público em Blueprints.'],
] as const;

apoie.get('/apoie', (c) => {
  const site = c.env.SITE_URL;
  const enviado = c.req.query('enviado') === '1';

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Apoie o Instituto"
        secao="apoie"
        descricao="Como apoiar o Instituto Automação: o espaço de parceiro na capa, o que ele é, o que ele não compra, e como conversar."
        url={`${site}/apoie`}
        ld={[ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Apoie', url: `${site}/apoie` }]))]}
      >
        <header class="cabeca-secao">
          <span class="kicker">O Instituto</span>
          <h1>Apoie o Instituto</h1>
          <p class="cabeca-secao__lead">
            O Instituto é lido por quem opera, integra e ensina automação no Brasil. Um parceiro
            aparece na capa, para todos eles, em toda visita — e é só isso que aparece. O resto do
            site continua sendo o que é.
          </p>
        </header>

        <section class="bloco--curto">
          <Secao titulo="O que é o espaço de parceiro" />
          <ul class="regras">
            {REGRAS.map(([t, d]) => (
              <li>
                <strong>{t}</strong>
                {d}
              </li>
            ))}
          </ul>
        </section>

        <section class="bloco">
          <Secao titulo="Quem apoia" />
          {PARCEIROS.length ? (
            PARCEIROS.map((p) => (
              <article class="linha">
                <span class="linha__data u-dado">desde {p.desde}</span>
                <div>
                  <h3 class="linha__titulo">
                    <a href={p.url} rel="sponsored noopener" target="_blank">
                      {p.nome}
                    </a>
                  </h3>
                  <p class="linha__pe">{p.frase}</p>
                </div>
              </article>
            ))
          ) : (
            <Aviso>
              <strong>Ainda não há parceiro.</strong> O espaço da capa é do primeiro — e o primeiro
              define, com a gente, como ele vai ser.
            </Aviso>
          )}
        </section>

        <section class="bloco" id="conversar" style="scroll-margin-top: var(--space-2xl)">
          <Secao titulo="Vamos conversar" nota="Conte o que a empresa faz e por que faz sentido apoiar. Alguém lê e responde — não é resposta automática." />
          <FormularioContato acao="/apoie/enviar" tipo="parceiro" enviado={enviado} />
        </section>
      </Documento>,
    ),
  );
});

apoie.post('/apoie/enviar', async (c) => {
  if (await passouDoLimite(c)) return c.text('Muitos envios seguidos deste endereço. Espere um minuto e tente de novo.', 429);
  const f = await c.req.formData();
  const texto = (k: string, max = 200) => String(f.get(k) ?? '').trim().slice(0, max);
  if (texto('sitio')) return c.redirect('/apoie?enviado=1#conversar', 303);

  const nome = texto('nome', 120);
  const email = texto('email');
  const empresa = texto('empresa', 120);
  const erro =
    nome.length < 2 ? 'Falta o seu nome.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'Esse e-mail não parece válido.' : !empresa ? 'Falta o nome da empresa.' : null;
  if (erro) {
    c.status(400);
    return c.html(
      pagina(
        <Documento titulo="Envio não aceito" naoIndexar>
          <h1>Envio não aceito</h1>
          <div class="bloco--curto">
            <Aviso>
              <strong>{erro}</strong> <a href="/apoie#conversar">Voltar ao formulário</a>.
            </Aviso>
          </div>
        </Documento>,
      ),
    );
  }

  await registrarContato(c.env.DB, { tipo: 'parceiro', nome, email, empresa, mensagem: texto('mensagem', 1000) || null });
  return c.redirect('/apoie?enviado=1#conversar', 303);
});
