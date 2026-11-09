# A redação automática

Desde 14/10/2026 o Instituto publica notícia sozinho, todo dia. Este arquivo é
o manual da rotina que faz isso: uma sessão agendada do Claude Code no notebook do Pedro,
que lê este documento e segue os passos. Também serve para quem quiser fazer o
mesmo à mão.

**Decisão do Pedro (14/10/2026):** as notícias vão sozinhas para o ar,
passando pelo crivo de qualidade, com thumb e manchete. Assinatura: **Redação
do Instituto** (nunca nome de pessoa em texto que a pessoa não leu).

## O caminho de uma notícia

```
/pauta.json ──▶ candidatas ──▶ fonte (lê + baixa a thumb) ──▶ escrever
   ──▶ conferir ──▶ compilar ──▶ testes ──▶ commit + push no main
   ──▶ .github/workflows/publicar.yml: compila, testa, QA inteiro, deploy
```

Se qualquer trava reprovar, **a notícia não sai**. Reprovada se corrige ou se
apaga; nunca se afrouxa a trava para passar.

## Passo a passo da rotina

1. **Atualizar e instalar**: `git pull --rebase` e `npm ci`.
2. **Ver a pauta**: `npm run redacao -- candidatas`. A lista já vem sem o que
   saiu e sem o que foi descartado, na ordem da fórmula publicada (3 por fonte
   que falou do assunto, +2 se lá fora falou e o Brasil não, +1 se é imprensa
   brasileira, desempate pelo mais recente).
3. **Escolher até 2 notícias por execução** (no máximo 4 por dia), descendo a
   lista. Para cada uma, decida se vale. **Descarte** com
   `npm run redacao -- descartar <url> "<motivo>"` quando:
   - não é automação, robótica, controle, IA aplicada à indústria, energia
     industrial, manufatura ou formação técnica;
   - é release vazio (parceria sem número, prêmio, contratação de executivo,
     webinar, "a empresa X participa da feira Y");
   - é opinião, podcast, vídeo, lista ou patrocinado;
   - repete assunto que já saiu aqui (confira `conteudo/noticias/`).
4. **Ler a fonte**: `npm run redacao -- fonte <url> <slug>`. O slug é curto, em
   minúsculas, com hífen (ex.: `abb-robo-pintura-ford`). O comando confere o
   robots.txt, salva o texto em `colheita/redacao/<slug>.md` e baixa a og:image
   para `publico/imagens/<data>-<slug>.jpg`. **Sem imagem (`semImagem`), descarte
   a pauta.** Leia a matéria inteira antes de escrever.
5. **Escrever** `conteudo/noticias/<data>-<slug>.md` (data de hoje em São Paulo,
   formato `AAAA-MM-DD`), no molde abaixo.
6. **Conferir**: `npm run redacao -- conferir`. Corrija até passar. Se não
   passar em três tentativas, apague a notícia e a imagem e descarte a pauta.
7. **Manchete**: se a melhor notícia do dia (mais fontes, mais impacto para quem
   opera no Brasil) for das que você escreveu agora, rode
   `npm run redacao -- destaque conteudo/noticias/<arquivo>.md`. Na dúvida, a
   mais recente com imagem vira manchete sozinha.
8. **Compilar e testar**: `npm run compilar` e `npm test`. Os dois têm de passar.
9. **Publicar**: `git add conteudo publico/imagens` e commit com a mensagem
   `noticias: <títulos curtos>`, depois `git push`. O workflow `publicar.yml`
   faz o QA e o deploy. **Sem notícia aprovada, não commite nada** — só o
   `conteudo/descartadas.txt`, se mudou.

## O molde

```markdown
---
secao: noticias
formato: contexto            # contexto (400–900 palavras) ou curta (250–400)
tema: industria              # industria ou processos
titulo: <30 a 120 caracteres, afirmativo, com o fato e o porquê>
titulo_curto: <até 53 caracteres>
lead: <80 a 320 caracteres: o que aconteceu e o número que importa>
autor: Redação do Instituto
data: <AAAA-MM-DD de hoje>
imagem:
  arquivo:   <data>-<slug>.jpg
  credito:   <dono da imagem se a fonte disser (ex.: ABB); senão, o veículo>
  licenca:   fonte            # press se for material de imprensa do fabricante
  alt:       <o que se vê na imagem, em uma frase concreta>
veredito: chega               # chega · a_caminho · nao_chega · sem_efeito
fonte:
  nome: <veículo>
  url: <url da matéria>
  idioma: <en, pt, de…>
  publicado: <AAAA-MM-DD>
---

<2 a 5 parágrafos: o fato, quem, quanto, quando, onde. Números em **negrito**.>

## <um intertítulo com o detalhe técnico que importa>

<o como funciona / o que é novo de verdade>

## O que isso muda aqui

*<Veredito por extenso>* — <o argumento: o que isso significa para quem opera,
integra, vende ou ensina automação no Brasil. Mínimo de 400 caracteres. Diga o
que dá para fazer, o que esperar e o que ainda não se sabe.>
```

Os vereditos: **chega** (já disponível ou com efeito direto no Brasil), **a
caminho** (vai chegar, com prazo), **não chega** (não há como chegar ou não
importa aqui), **sem efeito** (relevante lá fora, sem consequência prática
aqui). Leia `/blueprints#veredito` e as notícias de `conteudo/noticias/` de
24/09 para o tom.

## O que a revisão reprova (e por quê)

| Trava | Regra |
|---|---|
| Autor | `Redação do Instituto`, sempre |
| Número | todo inteiro do texto tem de estar na matéria original. Não converta unidade nem moeda por conta própria |
| Cópia | 10 palavras seguidas iguais às da fonte reprovam (citação vai em *itálico* ou entre aspas) |
| Inglês | palavra em inglês fora de citação é tradução pela metade |
| Thumb | arquivo existe, ≤ 600 KB, ≥ 700 px, crédito, licença e alt descritivo |
| Tamanho | título 30–120, título curto ≤ 53, lead 80–320, corpo 250–1.000 palavras |
| Nossa parte | `## O que isso muda aqui` com ≥ 400 caracteres e veredito |
| Validade | fonte de até 10 dias |
| Sobras | marcador de rascunho ou fala de assistente reprovam |

Depois dela, o compilador (frontmatter, autor, imagem, manchete única com
foto), os testes e o QA inteiro no GitHub.

## Erros e correções

Notícia errada no ar se corrige **no próprio arquivo** e se commita com
`correcao: <o que mudou>`. O git guarda a versão anterior. Pedido de dono de
imagem para tirar: troque a imagem ou tire o bloco `imagem:` e commite.

## A rotina agendada

Roda **no notebook do Pedro**, pelo Agendador de Tarefas do Windows, **às 15:30, uma vez por dia** (até 09/11/2026 eram duas,
07:30 e 15:30; ficou uma para gastar menos da conta compartilhada do Claude)
(se o notebook estiver desligado no horário, roda quando ligar). Quem escreve é o Claude Code
que vem com a extensão do VS Code, sem janela (`claude -p`), modelo `claude-sonnet-5-5`, num
**clone só da redação** em `Projetos/_redacao-instituto/instituto-automacao` — nunca na pasta em
que o Pedro trabalha. O push usa o git já logado na máquina.

```powershell
.\scripts\redacao-local.ps1              # roda agora
.\scripts\redacao-local.ps1 -Instalar    # cria/atualiza a tarefa (copia o script para _redacao-instituto)
.\scripts\redacao-local.ps1 -Desinstalar
```

Registro de cada execução em `Projetos/_redacao-instituto/logs/`. As ferramentas são
restritas: ler e escrever arquivo, `npm run`, `npm test`, `git status/diff/add/commit/push/log`
e apagar só em `publico/imagens/` e `conteudo/noticias/`.

**Por que não a rotina na nuvem do Claude:** ela exige conectar o GitHub à conta do Claude, que
é compartilhada (Pedro, 14/10). **Alarme:** o vigia do GitHub falha e manda e-mail se a notícia
mais recente tiver mais de 2 dias (`ultima_noticia` em `/saude`).
