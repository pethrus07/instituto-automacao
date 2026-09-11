/**
 * Privacidade — o que o site guarda, por quê, e como sair.
 *
 * A LGPD (Lei 13.709/2018) pede que a finalidade seja declarada NA COLETA,
 * em linguagem clara (art. 6º, VI e art. 9º). Esta página é o texto longo; o
 * texto curto fica ao lado de cada formulário, e os dois têm de dizer a
 * mesma coisa — por isso as finalidades moram em FINALIDADES, aqui, e a
 * `Lista` importa daqui em vez de repetir a frase. Promessa duplicada é
 * promessa que diverge.
 *
 * ⚠️ Toda afirmação desta página é sobre o código deste repositório e foi
 * conferida nele — não é texto-modelo. Se algum dia o site passar a usar
 * cookie, medidor de audiência ou serviço de terceiro, é ESTA página que
 * mente primeiro. O QA confere o que dá para conferir sozinho (que não há
 * host de terceiro e que o único armazenamento no navegador é o tema).
 */
import { Documento } from '../ui/Documento';
import { Secao, Aviso } from '../ui/pecas';
import { ldJson, trilhaLd } from '../ui/jsonld';
import { CACHE, FINALIDADES } from '../config';
import { novaApp, pagina } from './app';

export const privacidade = novaApp();

const GUARDAMOS = [
  {
    o_que: 'Seu e-mail, na lista',
    onde: 'quando você preenche o cadastro em qualquer página',
    para_que: `Para ${FINALIDADES.lista}. Nada mais.`,
    base: 'Consentimento (art. 7º, I) — você preencheu e enviou.',
  },
  {
    o_que: 'O que você faz, e a empresa — se você disser',
    onde: 'os dois campos opcionais do mesmo cadastro',
    para_que: `Para ${FINALIDADES.atuacao}. "O que você faz" é uma lista fechada de cinco respostas; o que não bate com ela não é guardado.`,
    base: 'Consentimento (art. 7º, I) — os campos são opcionais e dizem que são.',
  },
  {
    o_que: 'Nome, e-mail, empresa e mensagem',
    onde: 'os formulários de "Escreva no Instituto" e de "Apoie"',
    para_que: `Para ${FINALIDADES.contato}.`,
    base: 'Procedimento preliminar a pedido do titular (art. 7º, V) — você escreveu para ser respondido.',
  },
  {
    o_que: 'Os dados do evento que você enviar',
    onde: 'o formulário da Agenda',
    para_que: `Para ${FINALIDADES.evento}. O evento é público; quem enviou, não.`,
    base: 'Legítimo interesse (art. 7º, IX) — agenda de eventos abertos do setor.',
  },
] as const;

privacidade.get('/privacidade', (c) => {
  const site = c.env.SITE_URL;

  c.header('Cache-Control', CACHE.listagem);
  return c.html(
    pagina(
      <Documento
        titulo="Privacidade"
        secao="privacidade"
        descricao="O que o Instituto Automação guarda sobre você, para que serve cada dado, quanto tempo fica e como sair. Sem cookie, sem rastreador e sem terceiro na página."
        url={`${site}/privacidade`}
        ld={[ldJson(trilhaLd([{ nome: 'Capa', url: `${site}/` }, { nome: 'Privacidade', url: `${site}/privacidade` }]))]}
      >
        <header class="cabeca-secao">
          <span class="kicker">O Instituto</span>
          <h1>Privacidade</h1>
          <p class="cabeca-secao__lead">
            O site guarda quatro coisas, todas porque alguém as digitou num formulário. Não há
            cookie, não há medidor de audiência e não há nenhum endereço de terceiro carregando
            junto com a página. Esta página diz o que é guardado, para que serve e como sair.
          </p>
        </header>

        <section class="bloco--curto">
          <Secao titulo="O curto" />
          <div class="obra" style="font-size: var(--step-0)">
            <p>
              <strong>Não usamos cookie.</strong> A única coisa que este site escreve no seu
              navegador é a sua escolha de tema — claro ou escuro —, guardada no próprio
              navegador. Ela não sai de lá, não nos chega e não identifica ninguém.
            </p>
            <p>
              <strong>Não há rastreador nem analytics.</strong> Nenhum script de terceiro roda
              aqui; a política de segurança de conteúdo do site bloqueia isso, e não é uma
              promessa de texto: é uma regra que o navegador aplica. A única linha de JavaScript
              da página é o botão de tema.
            </p>
            <p>
              <strong>Não vendemos nem repassamos a lista.</strong> Nem para parceiro, nem para
              anunciante, nem em troca de nada. Quem apoia o Instituto compra um espaço na capa,
              descrito em <a href="/apoie">Apoie</a> — não compra o seu e-mail.
            </p>
          </div>
        </section>

        <section class="bloco">
          <Secao titulo="O que guardamos, e para quê" nota="Um item por formulário. Se um dado não está aqui, ele não é coletado." />
          <div class="scroll-x">
            <table>
              <thead>
                <tr>
                  <th>O quê</th>
                  <th>Quando</th>
                  <th>Para quê</th>
                  <th>Base legal</th>
                </tr>
              </thead>
              <tbody>
                {GUARDAMOS.map((g) => (
                  <tr>
                    <td>
                      <strong>{g.o_que}</strong>
                    </td>
                    <td>{g.onde}</td>
                    <td>{g.para_que}</td>
                    <td class="u-muted" style="font-size: var(--step--2)">
                      {g.base}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section class="bloco">
          <Secao titulo="O que NÃO fazemos com o seu e-mail" />
          <ul class="regras">
            <li>
              <strong>Não repassamos e não vendemos.</strong> A lista não é produto, não vai para
              parceiro e não vira mala direta de terceiro. Se um dia isso mudar, a mudança vale
              para quem se cadastrar depois dela — e não para você.
            </li>
            <li>
              <strong>Não mandamos oferta de outra empresa.</strong> O que chega no seu e-mail é o
              Giro e o aviso de texto novo, escritos aqui. Se um texto do Instituto for pago, ele
              chega rotulada como publicidade — no e-mail e no site, com o nome de quem pagou.
            </li>
            <li>
              <strong>Não cruzamos com nada.</strong> Não há perfil, não há pontuação de leitor,
              não há "quem abriu". O site não sabe o que você leu.
            </li>
          </ul>
        </section>

        <section class="bloco">
          <Secao titulo="Quanto tempo fica" />
          <div class="obra" style="font-size: var(--step-0)">
            <p>
              O e-mail da lista fica enquanto você quiser receber. Quando você pedir para sair,
              ele é <strong>apagado</strong> — não marcado como inativo, não guardado numa lista
              de descadastrados. Mensagem de contato fica enquanto a conversa fizer sentido, e no
              máximo dois anos.
            </p>
          </div>
        </section>

        <section class="bloco">
          <Secao titulo="Quem opera a infraestrutura" />
          <div class="obra" style="font-size: var(--step-0)">
            <p>
              O site roda na <strong>Cloudflare</strong>, que hospeda as páginas e o banco. Ela é
              operadora: processa o que o site guarda, a mando do site, e não usa esses dados para
              nada próprio. Como qualquer servidor da internet, a rede dela registra requisições —
              esse registro é dela, técnico, e não alimenta nada aqui. Nenhum outro serviço recebe
              qualquer coisa sua.
            </p>
          </div>
        </section>

        <section class="bloco" id="direitos" style="scroll-margin-top: var(--space-l)">
          <Secao titulo="Seus direitos, e como usar" nota="Art. 18 da LGPD. Na prática, é um pedido e a gente faz." />
          <div class="obra" style="font-size: var(--step-0)">
            <p>
              Você pode pedir, a qualquer momento: <strong>confirmação</strong> de que há dado seu
              aqui, <strong>acesso</strong> ao que há, <strong>correção</strong> do que estiver
              errado, <strong>eliminação</strong> do que foi coletado com o seu consentimento,{' '}
              <strong>portabilidade</strong>, e <strong>revogação do consentimento</strong> — que é
              o nome formal de sair da lista.
            </p>
            <p>
              Para qualquer um deles, escreva pelo{' '}
              <a href="/apoie#conversar">formulário de contato</a> dizendo o que quer. Responde uma
              pessoa, não um robô. Se você estiver na lista, responder a qualquer e-mail nosso
              também funciona.
            </p>
          </div>
          <Aviso>
            <strong>O Instituto ainda não é pessoa jurídica.</strong> Hoje quem responde pelos
            dados é o editor que assina os textos, e a formalização como associação está no plano.
            Preferimos dizer isso a estampar um CNPJ que não existe.
          </Aviso>
        </section>

        <section class="bloco">
          <Secao titulo="Quando esta página mudar" />
          <div class="obra" style="font-size: var(--step-0)">
            <p>
              Mudança aqui entra pelo mesmo caminho de qualquer texto: um commit no repositório,
              com data e autor. Se a mudança afetar o que já foi coletado, quem está na lista é
              avisado antes — e não depois.
            </p>
          </div>
        </section>
      </Documento>,
    ),
  );
});
