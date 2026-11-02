# Instituto Automação · roadmap

Fila curta, em ordem. Atualizado em 01/11/2026.
O diário de decisões até esta data (o que era este arquivo) está em [HISTORICO.md](HISTORICO.md).
Cada item diz quem destrava: Pedro, sócio ou código.

## Estado em 01/11/2026

- No ar em https://institutoautomacao.com.br desde 28/09/2026, na conta Cloudflare do Pedro.
  O domínio é do sócio.
- Anda sozinho: coleta a cada 15 min (cron do Worker), redação de notícia 2 vezes ao dia
  (notebook do Pedro, `scripts/redacao-local.ps1`), Giro toda segunda, pauta todo sábado,
  cópia do banco todo domingo e vigia de hora em hora (GitHub Actions).
- Compromisso contratado: máquina rodando até 31/12/2026 (acordo interno).

## Agora

1. **Renovação do domínio** (sócio). O registro vence em 20/11/2026 e a renovação automática
   nunca foi confirmada (HISTORICO §2i). Sem isso o site sai do ar.
2. **Redação que não depende do notebook ligado** (Pedro). Em 31/10 não houve edição nenhuma
   e em 01/11 só a das 15:30: as tarefas das 07:30 e 15:30 só rodam com o notebook ligado.
   O vigia avisa depois de 2 dias sem notícia. Decidir se basta assim ou se a redação vai para
   outra máquina.
3. **Indexação no Google** (Pedro). Search Console verificado em 16/10; falta conferir se as
   notícias aparecem na busca e enviar o sitemap se ainda não foi.
4. **Juntar o branch `revisao-2026-11`** (Pedro, depois de revisar): script de migrações
   pendentes (`npm run db:migrar`) e log da redação em UTF-8. Depois do merge, rodar
   `.\scripts\redacao-local.ps1 -Instalar` para a tarefa usar o script novo.
5. **Panorama nº 1 e dataset com DOI** (código + Pedro), 1ª quinzena de dezembro: ~3 meses de
   base, CSV no Zenodo (CC-BY).
6. **Renegociação com o sócio** até 31/12/2026, chegando com a base, o Panorama e o que a
   redação publicou.

## Depois

- **Mais fontes brasileiras que marcam o relógio** (código). Hoje são poucas e elas escrevem
  sobre o Brasil; é o que separa um Panorama com distribuição de um com uma dezena de pares.
- **Ideias do sócio de 05/10** (sócio responde primeiro): artigos de empresas convidadas,
  vídeo de terceiro virando artigo com a assinatura de quem fez, quantos textos por semana,
  preço do artigo feito de vídeo (HISTORICO §2j).
- **Giro contando só o setor**, como a capa (Pedro decide; muda a série a partir da semana
  seguinte; HISTORICO §2k).
- **Primeiro artigo assinado, primeiro parceiro e logo definitiva** (sócio).
- **E-mail `contato@`** com Email Routing e o binding `AVISO` para o aviso de artigo recebido
  (código, quando a zona tiver Email Routing).
- **Homologação**: desligar o cron da conta ryzecode08 e apagar o D1 `instituto` vazio criado
  por engano em WEUR (Pedro, exige login nessa conta).
- **Lint e formatação** (código).

## Talvez

- Coletor por API com credencial (GitHub, Reddit, YouTube) para as fontes que o robots.txt
  recusa. O Reddit de CLP é a perda mais sentida.
- Pedido de acesso a Control Engineering, Automation World e WEG (é mensagem, não código).
- Newsletter, quando a lista justificar, com a finalidade declarada.
- Busca (FTS5), quando houver o que procurar.
- Diretório de quem opera, integra e ensina, só com base legal e rótulo comercial.
- Espanhol nas fontes, depois de inglês e alemão estáveis.
- Repositório público, quando o acordo do código estiver escrito.

## Decisões abertas do Pedro

- Peça paga pode ser `destaque: true`? Hoje o compilador permite.
- IEEE Spectrum (IA) é setor ou contexto? Home Assistant entra como setor?
- Cortar e completar o plano editorial (`src/pautas.ts`, 95 pautas) com o sócio.
- Quem toca redes e comunidade.

## Não volta sem fato novo

IA no Worker (a notícia é escrita fora dele) · quatro núcleos · teto de custo e chave de API no
Worker · tradução integral de terceiro · backoffice fora do git.
