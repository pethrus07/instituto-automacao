/** Guias das trilhas IHM e dados, IA e Rede/TI — roteiro editorial do Instituto (ver ./tipos.ts). */
import type { Guia } from './tipos';

export const GUIAS_C: Record<string, Guia> = {
  /* ================= IA ================= */
  'ia-para-quem-e-de-automacao': {
    resumo: [
      'A diferença entre um programa com regra fixa e um modelo que aprende com exemplo.',
      'Os três tipos de IA que aparecem na indústria e onde cada um entra.',
      'Por que sem dado bom e rotulado não existe modelo que funcione.',
    ],
    secoes: [
      { dicas: [
        'Compare uma lógica ladder que você escreveu com um modelo que aprendeu com exemplos.',
        'Explique por que o modelo erra de um jeito que a regra fixa não erra.',
        'Conte um caso em que a regra fixa continua sendo a melhor saída.',
      ] },
      { dicas: [
        'Separe aprendizado de máquina com números, visão computacional e IA generativa.',
        'Dê um exemplo real de planta para cada um: preditiva, inspeção, assistente de texto.',
        'Mostre numa tabela a entrada, a saída e o dado que cada tipo exige.',
      ] },
      { dicas: [
        'Conte que dado uma planta típica guarda hoje e com que frequência.',
        'Explique por que histórico sem registro de falha não ensina o modelo a prever falha.',
        'Diga o que o leitor pode começar a guardar já, antes de pensar em IA.',
      ] },
    ],
    armadilhas: [
      'Achar que IA substitui o intertravamento',
      'Começar pelo modelo em vez de começar pelo dado',
      'Chamar qualquer automação de IA',
    ],
    quiz: [
      {
        pergunta: 'O que diferencia um modelo de aprendizado de máquina de um programa de CLP comum?',
        certa: 'O modelo aprende o comportamento a partir de exemplos',
        erradas: ['O modelo roda sempre mais rápido que o CLP', 'O modelo dispensa qualquer tipo de teste'],
      },
      {
        pergunta: 'Qual tipo de IA costuma ser usado para achar defeito em imagem de produto?',
        certa: 'Visão computacional com modelo treinado',
        erradas: ['IA generativa de texto', 'Controle PID com autoajuste'],
      },
      {
        pergunta: 'O que mais costuma faltar numa planta que quer começar com IA?',
        certa: 'Histórico de dados organizado e com registro de eventos',
        erradas: ['Computador com capacidade de processamento', 'Licença de software de programação'],
      },
    ],
    termos: [
      { termo: 'Aprendizado de máquina', definicao: 'Técnica em que o computador ajusta um modelo a partir de exemplos, em vez de seguir regras escritas à mão.' },
      { termo: 'Modelo', definicao: 'O resultado do treino: uma função que recebe um dado novo e devolve uma previsão ou classificação.' },
      { termo: 'IA generativa', definicao: 'Modelo que produz texto, código ou imagem a partir de um pedido, como os assistentes de conversa.' },
    ],
  },

  'manutencao-preditiva-com-vibracao': {
    resumo: [
      'A diferença entre manutenção corretiva, preventiva e preditiva.',
      'O que o sinal de vibração revela sobre rolamento, desbalanceamento e folga.',
      'Quanto dado e quanto tempo a preditiva exige antes de dar retorno.',
      'Como avaliar se o equipamento justifica o investimento.',
    ],
    secoes: [
      { dicas: [
        'Defina cada estratégia com um exemplo do mesmo motor ou bomba.',
        'Explique por que a preventiva por calendário troca componente bom e deixa passar o ruim.',
        'Mostre que a preditiva só funciona se alguém agir sobre o aviso.',
      ] },
      { dicas: [
        'Explique o valor global de vibração e a análise por frequência em linguagem simples.',
        'Conte quais defeitos costumam aparecer em que faixa do espectro.',
        'Mostre como a posição e a fixação do sensor mudam a leitura.',
        'Diga quando basta limite por tendência e quando entra um modelo.',
      ] },
      { dicas: [
        'Liste os critérios: custo da parada, criticidade e tempo de reposição.',
        'Explique quanto tempo de coleta é preciso para ter uma linha de base confiável.',
        'Dê um exemplo em que a preditiva não compensa e a corretiva é a escolha certa.',
      ] },
    ],
    armadilhas: [
      'Instalar sensor sem definir quem age sobre o alerta',
      'Comparar leituras tomadas em pontos diferentes',
      'Esperar previsão sem histórico de falhas reais',
    ],
    quiz: [
      {
        pergunta: 'O que caracteriza a manutenção preditiva?',
        certa: 'Intervir com base na condição medida do equipamento',
        erradas: ['Trocar componentes em intervalos fixos de calendário', 'Consertar o equipamento somente depois da quebra'],
      },
      {
        pergunta: 'Por que a análise por frequência ajuda no diagnóstico de vibração?',
        certa: 'Cada tipo de defeito tende a aparecer em frequências típicas',
        erradas: ['Ela elimina a necessidade de fixar bem o sensor', 'Ela mede a temperatura do rolamento diretamente'],
      },
      {
        pergunta: 'Em qual caso a preditiva costuma não compensar?',
        certa: 'Equipamento barato, redundante e de troca rápida',
        erradas: ['Compressor crítico sem reserva na planta', 'Motor grande com prazo longo de reposição'],
      },
    ],
    termos: [
      { termo: 'Linha de base', definicao: 'O comportamento normal do equipamento, medido quando ele está bom, que serve de referência para comparar.' },
      { termo: 'Espectro de frequência', definicao: 'Gráfico que decompõe a vibração nas frequências que a compõem, obtido pela FFT.' },
      { termo: 'FFT', definicao: 'Transformada rápida de Fourier: cálculo que converte um sinal no tempo em suas componentes de frequência.' },
    ],
  },

  'inspecao-visual-com-ia': {
    resumo: [
      'Quando a visão por regra fixa resolve e quando o defeito pede modelo treinado.',
      'Por que o número de fotos de defeito costuma ser o gargalo do projeto.',
      'Como falso positivo e falso negativo pesam no custo da linha.',
    ],
    secoes: [
      { dicas: [
        'Explique a visão por regra: medir, contar pixel, procurar borda com limite fixo.',
        'Mostre um defeito que a regra pega bem e um que varia demais para ela.',
        'Diga por que iluminação e enquadramento importam nos dois casos.',
      ] },
      { dicas: [
        'Explique por que defeito é raro e isso torna difícil juntar exemplos.',
        'Conte como variar posição, luz e lote nas fotos de treino.',
        'Diga por que separar um conjunto de fotos só para teste.',
      ] },
      { dicas: [
        'Defina falso positivo e falso negativo com o produto da sua linha.',
        'Mostre o custo de cada um: refugo de produto bom × defeito chegando ao cliente.',
        'Explique como o ajuste do limiar troca um erro pelo outro.',
      ] },
    ],
    armadilhas: [
      'Treinar com fotos de um lote só',
      'Mudar a iluminação depois do treino',
      'Medir só acerto geral e ignorar o defeito raro',
    ],
    quiz: [
      {
        pergunta: 'Quando a visão por regra fixa costuma bastar?',
        certa: 'Quando o defeito é bem definido e a imagem é estável',
        erradas: ['Quando o defeito muda muito de forma e cor', 'Quando não há iluminação controlada na linha'],
      },
      {
        pergunta: 'O que é um falso positivo na inspeção?',
        certa: 'Produto bom rejeitado como defeituoso',
        erradas: ['Produto com defeito aprovado como bom', 'Câmera que deixa de capturar a imagem'],
      },
      {
        pergunta: 'Por que separar fotos só para teste?',
        certa: 'Para medir o modelo em imagens que ele nunca viu',
        erradas: ['Para acelerar o tempo de treinamento', 'Para reduzir o tamanho do modelo final'],
      },
    ],
    termos: [
      { termo: 'Falso positivo', definicao: 'Quando o sistema acusa defeito num produto que estava bom.' },
      { termo: 'Falso negativo', definicao: 'Quando o sistema deixa passar um produto que tinha defeito.' },
      { termo: 'Limiar', definicao: 'Valor de corte da confiança do modelo a partir do qual o produto é rejeitado.' },
    ],
  },

  'deteccao-de-anomalia-em-dado-de-processo': {
    resumo: [
      'A diferença entre alarme por limite fixo e anomalia por padrão.',
      'Como aproveitar o histórico que o supervisório já guarda.',
      'Por que anomalia é um aviso para investigar, não um diagnóstico.',
    ],
    secoes: [
      { dicas: [
        'Mostre um sinal que fica dentro do limite e ainda assim está estranho.',
        'Explique a ideia de média e desvio: o quanto um valor se afasta do normal.',
        'Diga por que várias variáveis juntas revelam o que uma sozinha esconde.',
      ] },
      { dicas: [
        'Conte onde o histórico fica e como exportá-lo do supervisório.',
        'Explique por que o período de coleta e a compressão do histórico afetam a análise.',
        'Diga como separar os estados da máquina: parada, partida e produção.',
      ] },
      { dicas: [
        'Explique por que troca de produto ou de turno pode parecer anomalia.',
        'Conte como o operador confirma ou descarta o aviso.',
        'Mostre como registrar essa resposta para melhorar o modelo.',
      ] },
    ],
    armadilhas: [
      'Treinar com período que já tinha o defeito',
      'Misturar partida e regime normal no mesmo modelo',
      'Gerar tantos avisos que ninguém olha',
    ],
    quiz: [
      {
        pergunta: 'Qual a vantagem da detecção de anomalia sobre o limite fixo?',
        certa: 'Perceber comportamento estranho mesmo dentro dos limites',
        erradas: ['Dispensar o histórico de dados do processo', 'Substituir os alarmes de segurança da máquina'],
      },
      {
        pergunta: 'Por que separar os estados da máquina antes de analisar?',
        certa: 'Partida e parada têm comportamento normal diferente da produção',
        erradas: ['Porque o supervisório só grava em produção', 'Porque o modelo não aceita valores iguais a zero'],
      },
      {
        pergunta: 'Qual o papel do operador diante de um aviso de anomalia?',
        certa: 'Confirmar ou descartar o aviso com o que vê no processo',
        erradas: ['Desligar a máquina a cada novo aviso', 'Ignorar o aviso até virar alarme de limite'],
      },
    ],
    termos: [
      { termo: 'Anomalia', definicao: 'Comportamento que foge do padrão aprendido com o histórico normal do processo.' },
      { termo: 'Desvio padrão', definicao: 'Medida de quanto os valores costumam variar em torno da média.' },
      { termo: 'Historiador', definicao: 'Software ou banco que grava os valores do processo ao longo do tempo para consulta posterior.' },
    ],
  },

  'ia-generativa-para-programar-clp': {
    resumo: [
      'Um exemplo real de pedido a um assistente de IA e do código que ele devolveu.',
      'Onde o assistente economiza tempo e onde ele erra de forma perigosa.',
      'Por que a responsabilidade é de quem testou e assinou o programa.',
    ],
    secoes: [
      { dicas: [
        'Mostre o pedido exato que você fez, com o contexto que deu.',
        'Cole o código devolvido, em texto estruturado ou descrição da lógica.',
        'Conte qual CLP e qual linguagem estavam em jogo.',
      ] },
      { dicas: [
        'Aponte o que veio certo: estrutura, comentários, tarefas repetitivas.',
        'Aponte o erro: endereço inventado, instrução que não existe, lógica invertida.',
        'Explique como você descobriu o erro: simulação, revisão ou teste em bancada.',
      ] },
      { dicas: [
        'Diga que função de segurança não se delega ao assistente.',
        'Descreva seu roteiro de teste antes de carregar o programa na máquina.',
        'Conte o cuidado com dado do cliente colado no assistente.',
      ] },
    ],
    armadilhas: [
      'Aceitar código que compila sem testar a lógica',
      'Confiar em instrução ou função que o fabricante não tem',
      'Colar o programa do cliente num serviço externo',
    ],
    quiz: [
      {
        pergunta: 'Em que o assistente de IA costuma ajudar mais na programação de CLP?',
        certa: 'Rascunho de estrutura, comentários e trechos repetitivos',
        erradas: ['Validação final da função de segurança', 'Garantia de compatibilidade com o hardware'],
      },
      {
        pergunta: 'Qual erro típico do assistente é perigoso?',
        certa: 'Inventar instrução ou endereço que não existe',
        erradas: ['Escrever comentários longos demais', 'Usar nomes de variáveis em inglês'],
      },
      {
        pergunta: 'Quem responde pelo programa gerado com ajuda de IA?',
        certa: 'O profissional que testou e colocou o programa na máquina',
        erradas: ['A empresa que fornece o assistente de IA', 'Ninguém, porque o código foi gerado automaticamente'],
      },
    ],
    termos: [
      { termo: 'Texto estruturado', definicao: 'Linguagem de programação de CLP parecida com Pascal, definida na IEC 61131-3.' },
      { termo: 'Alucinação', definicao: 'Quando o modelo de IA inventa com confiança uma informação que não é verdadeira.' },
      { termo: 'Simulação', definicao: 'Rodar o programa num CLP virtual para testar a lógica antes de ir para a máquina.' },
    ],
  },

  'preparar-dado-de-maquina-para-ia': {
    resumo: [
      'Que variáveis coletar e com que frequência, conforme a pergunta.',
      'Como tratar buraco, pico falso e unidade errada no histórico.',
      'Por que rotular os eventos é o passo que decide o resultado.',
    ],
    secoes: [
      { dicas: [
        'Comece pela pergunta: o que se quer prever ou detectar.',
        'Explique por que vibração pede amostragem muito mais rápida que temperatura.',
        'Diga como guardar junto o estado da máquina e o produto em produção.',
      ] },
      { dicas: [
        'Mostre numa tabela um trecho com falha de comunicação, pico e valor congelado.',
        'Explique quando interpolar, quando descartar e quando marcar o trecho.',
        'Conte como acertar unidade e escala entre fontes diferentes.',
        'Diga por que alinhar o relógio das fontes antes de juntar os dados.',
      ] },
      { dicas: [
        'Explique o que é rótulo com um exemplo: falha, setup, produção normal.',
        'Conte de onde tirar o rótulo: ordem de serviço, apontamento, livro do turno.',
        'Diga como envolver o operador e o mantenedor no rótulo.',
      ] },
    ],
    armadilhas: [
      'Coletar tudo sem saber a pergunta',
      'Relógios desalinhados entre CLP e servidor',
      'Rótulo feito de memória semanas depois',
    ],
    quiz: [
      {
        pergunta: 'O que deve definir a frequência de coleta de uma variável?',
        certa: 'A velocidade com que o fenômeno de interesse muda',
        erradas: ['A capacidade máxima do disco do servidor', 'O padrão de fábrica do supervisório'],
      },
      {
        pergunta: 'O que é um valor congelado no histórico?',
        certa: 'Um valor repetido porque a leitura parou de atualizar',
        erradas: ['Um valor medido em ambiente refrigerado', 'Um valor que o operador digitou à mão'],
      },
      {
        pergunta: 'Por que o rótulo é tão importante para o modelo?',
        certa: 'É dele que o modelo aprende o que é falha e o que é normal',
        erradas: ['Ele reduz o tamanho do arquivo de dados', 'Ele substitui a limpeza dos dados brutos'],
      },
    ],
    termos: [
      { termo: 'Taxa de amostragem', definicao: 'Quantas leituras de uma variável são registradas por unidade de tempo.' },
      { termo: 'Rótulo', definicao: 'Marcação que diz o que estava acontecendo num trecho do dado, como falha ou setup.' },
      { termo: 'Conjunto de dados', definicao: 'O arquivo organizado, limpo e rotulado que se usa para treinar e testar um modelo.' },
    ],
  },

  'classificador-de-defeito-sem-programar': {
    resumo: [
      'Como tirar e organizar as fotos de produto bom e de produto com defeito.',
      'O que é treinar e testar um modelo, na prática, com ferramenta gratuita.',
      'Por que o resultado depende mais das fotos do que da ferramenta.',
    ],
    secoes: [
      { dicas: [
        'Diga quantas fotos você usou por classe e por que esse número.',
        'Mostre com foto o fundo, a luz e a distância que você fixou.',
        'Explique por que variar a posição do produto entre as fotos.',
      ] },
      { dicas: [
        'Mostre com captura de tela a ferramenta usada, como o Teachable Machine, e as classes criadas.',
        'Explique o que a ferramenta faz no treino sem entrar em matemática.',
        'Teste com fotos novas e mostre acertos e erros.',
      ] },
      { dicas: [
        'Conte o que acontece quando muda a luz ou o fundo.',
        'Explique a diferença entre o teste de bancada e uma linha real.',
        'Diga o que seria preciso para levar isso a produção.',
      ] },
    ],
    armadilhas: [
      'Fundo diferente em cada classe',
      'Testar com as mesmas fotos do treino',
      'Achar que acerto na bancada vale para a linha',
    ],
    quiz: [
      {
        pergunta: 'Por que manter o mesmo fundo nas fotos das duas classes?',
        certa: 'Para o modelo não aprender o fundo em vez do defeito',
        erradas: ['Para o arquivo de treino ficar menor', 'Para a ferramenta aceitar as imagens enviadas'],
      },
      {
        pergunta: 'O que significa testar o modelo?',
        certa: 'Avaliar o modelo com fotos que não foram usadas no treino',
        erradas: ['Repetir o treino várias vezes seguidas', 'Conferir se a câmera está bem focada'],
      },
      {
        pergunta: 'O que o experimento ensina sobre IA de verdade?',
        certa: 'A qualidade das fotos pesa mais que a ferramenta',
        erradas: ['Qualquer ferramenta gratuita serve para produção', 'O modelo acerta sempre depois de treinado'],
      },
    ],
    termos: [
      { termo: 'Classe', definicao: 'Cada categoria que o modelo aprende a separar, como produto bom e produto com defeito.' },
      { termo: 'Treino', definicao: 'Etapa em que o modelo ajusta seus parâmetros olhando os exemplos rotulados.' },
      { termo: 'Confiança', definicao: 'Número que o modelo devolve indicando o quanto ele aposta na classe escolhida.' },
    ],
  },

  'modelo-rodando-na-borda': {
    resumo: [
      'Por que rodar o modelo ao lado da máquina em vez de na nuvem.',
      'Como escolher o hardware pelo tempo de resposta que a linha exige.',
      'Como o resultado do modelo vira um sinal que o CLP entende.',
      'Por que o CLP continua dono da decisão de segurança.',
    ],
    secoes: [
      { dicas: [
        'Compare latência, dependência de internet e dado saindo da planta.',
        'Diga quando a nuvem ainda faz sentido: treino e análise histórica.',
        'Conte o cenário da sua linha e por que a borda foi a escolha.',
      ] },
      { dicas: [
        'Explique como medir o tempo entre a captura e a resposta do modelo.',
        'Compare opções genéricas: computador industrial, placa com acelerador, câmera inteligente.',
        'Fale de temperatura, poeira, fonte e montagem no painel.',
      ] },
      { dicas: [
        'Mostre como o resultado chega ao CLP: saída digital, Modbus TCP ou outro protocolo.',
        'Explique o que o CLP faz se o computador da borda parar de responder.',
        'Inclua um trecho de código que publica o resultado e um sinal de vida.',
      ] },
    ],
    armadilhas: [
      'Sem sinal de vida entre borda e CLP',
      'Medir tempo de resposta só no escritório',
      'Deixar o modelo acionar a máquina direto',
    ],
    quiz: [
      {
        pergunta: 'Qual a principal vantagem de rodar o modelo na borda?',
        certa: 'Resposta rápida sem depender da internet',
        erradas: ['Treinar o modelo sem nenhum dado', 'Dispensar o CLP no controle da máquina'],
      },
      {
        pergunta: 'Para que serve o sinal de vida entre o computador e o CLP?',
        certa: 'Para o CLP perceber que o computador parou',
        erradas: ['Para aumentar a precisão do modelo', 'Para sincronizar o relógio da câmera'],
      },
      {
        pergunta: 'Quem deve continuar responsável pela lógica de segurança?',
        certa: 'O CLP e os dispositivos de segurança da máquina',
        erradas: ['O computador da borda que roda o modelo', 'O servidor na nuvem que treinou o modelo'],
      },
    ],
    termos: [
      { termo: 'Borda', definicao: 'Processamento feito perto da máquina, na própria planta, em vez de num servidor distante.' },
      { termo: 'Latência', definicao: 'O tempo entre o evento acontecer e a resposta ficar disponível.' },
      { termo: 'Sinal de vida', definicao: 'Bit ou contador que muda periodicamente para provar que o outro lado está funcionando.' },
    ],
  },

  'humanoides-o-que-e-real': {
    resumo: [
      'O que os robôs humanoides fazem hoje em testes reais de fábrica.',
      'Por que o dado de treinamento da tarefa é o grande gargalo.',
      'Como separar vídeo de demonstração de instalação que produz.',
      'O que uma PME brasileira pode esperar no curto prazo.',
    ],
    secoes: [
      { dicas: [
        'Descreva as tarefas que aparecem nos pilotos divulgados: mover caixas, abastecer.',
        'Explique como perceber num vídeo se o robô é teleoperado ou acelerado.',
        'Compare com o que um robô industrial ou colaborativo já faz hoje.',
      ] },
      { dicas: [
        'Explique por que cada tarefa nova exige demonstrações e dados próprios.',
        'Fale de velocidade, taxa de erro e autonomia de bateria como limites.',
        'Diga o que ainda não se sabe publicamente sobre esses números.',
      ] },
      { dicas: [
        'Compare o custo e o risco de um humanoide com automação dedicada.',
        'Diga o que a PME ganha investindo antes em processo e dado.',
        'Evite prazo exato; mostre os sinais que indicariam maturidade.',
      ] },
    ],
    armadilhas: [
      'Tomar vídeo de lançamento como prova de produção',
      'Ignorar a norma de segurança de robôs',
      'Comparar humanoide com operador em vez de com automação dedicada',
    ],
    quiz: [
      {
        pergunta: 'Qual o principal gargalo dos humanoides em tarefas novas?',
        certa: 'Dado de treinamento específico de cada tarefa',
        erradas: ['Falta de motores elétricos no mercado', 'Impossibilidade de ligar o robô na rede'],
      },
      {
        pergunta: 'O que um vídeo de demonstração pode esconder?',
        certa: 'Teleoperação, cortes de edição ou velocidade acelerada',
        erradas: ['A cor original da carcaça do robô', 'O nome do engenheiro que o programou'],
      },
      {
        pergunta: 'Para uma PME, qual costuma ser a alternativa mais madura hoje?',
        certa: 'Automação dedicada ou robô colaborativo',
        erradas: ['Humanoide comprado para qualquer tarefa', 'Esperar sem mexer no processo atual'],
      },
    ],
    termos: [
      { termo: 'Humanoide', definicao: 'Robô com formato parecido com o corpo humano, pensado para atuar em ambientes feitos para pessoas.' },
      { termo: 'Teleoperação', definicao: 'Quando uma pessoa controla o robô a distância em tempo real, em vez de ele agir sozinho.' },
      { termo: 'Robô colaborativo', definicao: 'Robô projetado para trabalhar perto de pessoas, com limites de força e velocidade.' },
    ],
  },

  'agentes-de-ia-na-rotina-da-manutencao': {
    resumo: [
      'Como era a rotina de ordem de serviço, relatório ou estoque antes.',
      'O que foi automatizado com IA e com que ferramenta.',
      'O que continua precisando de conferência humana e por quê.',
    ],
    secoes: [
      { dicas: [
        'Descreva a tarefa repetitiva e quanto tempo ela tomava por semana.',
        'Conte onde o dado morava: planilha, papel, sistema de manutenção.',
        'Diga qual erro era mais comum no processo manual.',
      ] },
      { dicas: [
        'Diga a ferramenta usada e o que ela recebe e devolve.',
        'Mostre um exemplo real de entrada e saída, sem dado sensível.',
        'Conte o que deu trabalho para configurar.',
      ] },
      { dicas: [
        'Liste o que uma pessoa revisa antes de valer: valor, peso, código de material.',
        'Conte um erro que a revisão pegou.',
        'Diga quem é o responsável final pela informação.',
      ] },
    ],
    armadilhas: [
      'Deixar o agente gravar direto no sistema sem revisão',
      'Mandar dado sensível para serviço externo',
      'Medir só o tempo ganho e esquecer o erro novo',
    ],
    quiz: [
      {
        pergunta: 'O que é um agente de IA nesse contexto?',
        certa: 'Uma IA que executa etapas de uma tarefa usando outras ferramentas',
        erradas: ['Um funcionário treinado para usar a IA', 'Um sensor instalado na máquina da linha'],
      },
      {
        pergunta: 'Por que manter revisão humana na automação da rotina?',
        certa: 'Porque o modelo pode errar com aparência de certeza',
        erradas: ['Porque a IA não consegue ler planilhas', 'Porque a lei proíbe qualquer uso de IA'],
      },
      {
        pergunta: 'Que cuidado tomar com os dados usados pelo agente?',
        certa: 'Saber para onde vão e evitar expor dado sensível',
        erradas: ['Apagar os dados logo após cada uso', 'Enviar tudo para ter mais contexto'],
      },
    ],
    termos: [
      { termo: 'Agente de IA', definicao: 'Sistema em que um modelo de linguagem decide e executa passos, chamando ferramentas como planilha ou e-mail.' },
      { termo: 'Ordem de serviço', definicao: 'Registro que autoriza e documenta um trabalho de manutenção.' },
      { termo: 'Revisão humana', definicao: 'Etapa em que uma pessoa confere o resultado da IA antes de ele valer.' },
    ],
  },

  'riscos-de-usar-ia-na-industria': {
    resumo: [
      'O que perguntar antes de mandar dado do cliente para um serviço de IA.',
      'Por que IA não entra no lugar de função de segurança da máquina.',
      'Como definir quem responde quando o modelo erra.',
    ],
    secoes: [
      { dicas: [
        'Explique para onde vai o dado ao usar um serviço de IA na nuvem.',
        'Liste o que perguntar: onde é guardado, por quanto tempo, se treina o modelo.',
        'Lembre a LGPD quando houver dado pessoal de operador ou cliente.',
        'Diga como o contrato com o cliente deve tratar isso.',
      ] },
      { dicas: [
        'Explique por que função de segurança exige comportamento previsível e validado.',
        'Cite que segurança de máquina segue a NR-12 e normas como a ISO 13849, sem entrar no detalhe.',
        'Mostre onde a IA pode ficar: supervisão e aviso, fora do caminho de segurança.',
      ] },
      { dicas: [
        'Discuta a responsabilidade do integrador, do usuário e do fornecedor.',
        'Explique por que registrar versão do modelo, dado de treino e testes.',
        'Diga o que fazer quando o modelo começa a errar mais com o tempo.',
      ] },
    ],
    armadilhas: [
      'Aceitar termo de uso sem ler onde o dado fica',
      'Usar saída de modelo para liberar movimento perigoso',
      'Não versionar o modelo que está em produção',
    ],
    quiz: [
      {
        pergunta: 'O que perguntar antes de usar um serviço de IA com dado do cliente?',
        certa: 'Onde o dado fica guardado e se é usado para treino',
        erradas: ['Qual a cor da interface do serviço', 'Quantos usuários o serviço tem no mundo'],
      },
      {
        pergunta: 'Onde a IA pode entrar com segurança numa máquina?',
        certa: 'Em supervisão e aviso, fora da função de segurança',
        erradas: ['No lugar do relé de segurança da porta', 'No comando direto da parada de emergência'],
      },
      {
        pergunta: 'Por que registrar a versão do modelo em uso?',
        certa: 'Para saber qual modelo tomou cada decisão',
        erradas: ['Para o modelo rodar com mais velocidade', 'Para dispensar novos testes após a troca'],
      },
    ],
    termos: [
      { termo: 'LGPD', definicao: 'Lei Geral de Proteção de Dados, que regula o tratamento de dados pessoais no Brasil.' },
      { termo: 'Função de segurança', definicao: 'Função da máquina que protege pessoas, como parada de emergência e intertravamento de porta.' },
      { termo: 'Deriva do modelo', definicao: 'Quando o desempenho do modelo cai porque o processo real mudou em relação ao dado de treino.' },
    ],
  },

  /* ================= IHM e dados ================= */
  'ihm-supervisorio-e-dashboard': {
    resumo: [
      'Quem usa a IHM, o supervisório e o dashboard, e para quê.',
      'Onde o dado mora em cada uma dessas telas.',
      'Por que misturar operação, supervisão e gestão numa tela dá errado.',
    ],
    secoes: [
      { dicas: [
        'Descreva o operador, o supervisor e o gestor e a pergunta de cada um.',
        'Mostre numa tabela: usuário, decisão, tempo de reação.',
        'Dê um exemplo de cada tela na mesma planta.',
      ] },
      { dicas: [
        'Explique que a IHM lê o CLP direto e costuma guardar pouco histórico.',
        'Explique que o supervisório junta vários CLPs e grava histórico e alarmes.',
        'Explique que o dashboard costuma ler de um banco e mostra agregados.',
      ] },
      { dicas: [
        'Conte um caso de gestor mandando comando pela tela errada.',
        'Explique o risco de pôr botão de comando num painel de gestão.',
        'Diga como definir o que cada tela pode ler e escrever.',
      ] },
    ],
    armadilhas: [
      'Dashboard com botão que comanda a máquina',
      'IHM usada como banco de histórico',
      'Mesma tela para operador e gestor',
    ],
    quiz: [
      {
        pergunta: 'Quem é o usuário principal da IHM?',
        certa: 'O operador que comanda a máquina',
        erradas: ['O gestor que acompanha indicadores', 'O analista que cuida do servidor'],
      },
      {
        pergunta: 'O que diferencia o supervisório de uma IHM de máquina?',
        certa: 'Ele junta vários equipamentos e grava histórico',
        erradas: ['Ele só funciona sem conexão de rede', 'Ele substitui o CLP no controle'],
      },
      {
        pergunta: 'De onde o dashboard de gestão costuma ler os dados?',
        certa: 'De um banco com dados já agregados',
        erradas: ['Direto das entradas digitais do CLP', 'Da memória interna da IHM da máquina'],
      },
    ],
    termos: [
      { termo: 'IHM', definicao: 'Interface Homem-Máquina: a tela junto da máquina onde o operador vê o estado e dá comandos.' },
      { termo: 'Supervisório', definicao: 'Sistema que monitora vários equipamentos, grava histórico e alarmes; também chamado de SCADA.' },
      { termo: 'Dashboard', definicao: 'Painel de indicadores que resume o desempenho para quem acompanha e decide.' },
    ],
  },

  'tela-de-operacao-que-o-operador-entende': {
    resumo: [
      'Por que usar cor apenas para chamar atenção a estado anormal.',
      'O que fica na primeira tela e o que vai para o menu.',
      'Como evitar comando acionado sem querer.',
      'Um antes e depois de uma tela real.',
    ],
    secoes: [
      { dicas: [
        'Explique a ideia de fundo neutro e cor reservada para anormalidade.',
        'Mostre como a tela cheia de verde e vermelho esconde o problema.',
        'Lembre quem tem dificuldade de distinguir cores e use forma e texto junto.',
        'Cite a ISA-101 como referência de projeto de IHM.',
      ] },
      { dicas: [
        'Liste o que o operador consulta toda hora e o que consulta raramente.',
        'Mostre como organizar a navegação em poucos níveis.',
        'Explique por que tela de parâmetro não fica na tela principal.',
      ] },
      { dicas: [
        'Explique confirmação para comandos críticos e tamanho mínimo de botão.',
        'Fale de nível de acesso por senha para parâmetro e manutenção.',
        'Mostre como separar visualmente botões de ações opostas.',
      ] },
      { dicas: [
        'Mostre com foto a tela antiga e a tela nova lado a lado.',
        'Conte o que o operador comentou depois da troca.',
        'Diga o que mudou em tempo de reação ou em erro de operação.',
      ] },
    ],
    armadilhas: [
      'Tudo colorido o tempo todo',
      'Botão de liga e desliga colados',
      'Tela desenhada sem ouvir o operador',
    ],
    quiz: [
      {
        pergunta: 'Qual o uso recomendado da cor numa tela de operação?',
        certa: 'Destacar estado anormal que pede atenção',
        erradas: ['Diferenciar cada equipamento da máquina', 'Deixar a tela mais bonita e chamativa'],
      },
      {
        pergunta: 'O que deve ficar na primeira tela?',
        certa: 'O que o operador precisa ver e acionar com frequência',
        erradas: ['Todos os parâmetros de ajuste da máquina', 'O histórico completo de alarmes do mês'],
      },
      {
        pergunta: 'Como reduzir o acionamento acidental de um comando crítico?',
        certa: 'Pedir confirmação e afastar o botão dos demais',
        erradas: ['Deixar o botão menor e sem legenda', 'Colocar o botão na cor verde padrão'],
      },
    ],
    termos: [
      { termo: 'ISA-101', definicao: 'Norma da ISA com orientações para projeto e gestão de interfaces homem-máquina.' },
      { termo: 'Nível de acesso', definicao: 'Permissão que define o que cada usuário pode ver e alterar na tela.' },
      { termo: 'Navegação', definicao: 'O caminho entre as telas da IHM e como o operador passa de uma para outra.' },
    ],
  },

  'alarmes-que-servem': {
    resumo: [
      'A diferença entre alarme, evento e aviso.',
      'Como definir prioridade pela consequência de não agir.',
      'Como usar o histórico de alarmes para achar a causa.',
      'Por que excesso de alarme faz o operador ignorar todos.',
    ],
    secoes: [
      { dicas: [
        'Defina alarme como algo que exige ação do operador.',
        'Mostre exemplos de evento que só registra e de aviso que só informa.',
        'Explique o teste: se ninguém precisa agir, não é alarme.',
      ] },
      { dicas: [
        'Explique a prioridade pela consequência e pelo tempo para agir.',
        'Mostre uma tabela com poucas prioridades e exemplos de cada.',
        'Cite a ISA-18.2 e a IEC 62682 como referências de gestão de alarmes.',
      ] },
      { dicas: [
        'Explique o que registrar: hora de entrada, reconhecimento e saída.',
        'Mostre como achar o primeiro alarme de uma cascata.',
        'Conte como listar os alarmes mais frequentes do mês.',
      ] },
      { dicas: [
        'Explique alarme intermitente e alarme que fica ativo por dias.',
        'Fale de histerese e atraso para evitar alarme que liga e desliga.',
        'Diga como revisar periodicamente e retirar alarme sem ação.',
      ] },
    ],
    armadilhas: [
      'Todo alarme com prioridade alta',
      'Reconhecer tudo sem ler',
      'Alarme ativo há semanas que ninguém corrige',
    ],
    quiz: [
      {
        pergunta: 'O que distingue um alarme de um evento?',
        certa: 'O alarme exige uma ação do operador',
        erradas: ['O alarme sempre para a máquina', 'O alarme nunca é registrado no histórico'],
      },
      {
        pergunta: 'Como definir a prioridade de um alarme?',
        certa: 'Pela consequência e pelo tempo disponível para agir',
        erradas: ['Pela ordem em que foi configurado', 'Pelo equipamento mais caro envolvido'],
      },
      {
        pergunta: 'Para que serve a histerese num alarme analógico?',
        certa: 'Evitar que o alarme fique ligando e desligando',
        erradas: ['Aumentar a prioridade do alarme', 'Apagar o alarme do histórico'],
      },
    ],
    termos: [
      { termo: 'Reconhecimento', definicao: 'Ação do operador que confirma ter visto o alarme, registrada com hora.' },
      { termo: 'Inundação de alarmes', definicao: 'Situação em que chegam mais alarmes do que o operador consegue tratar.' },
      { termo: 'Histerese', definicao: 'Faixa entre o valor que ativa e o que desativa o alarme, para evitar oscilação.' },
    ],
  },

  'mqtt-para-quem-vem-do-chao-de-fabrica': {
    resumo: [
      'A diferença entre perguntar ciclicamente, como no Modbus, e publicar quando muda.',
      'Como organizar os tópicos de uma planta.',
      'O que são QoS e mensagem retida.',
      'Onde o MQTT entra e onde ele não substitui o protocolo de campo.',
    ],
    secoes: [
      { dicas: [
        'Compare o mestre que pergunta no Modbus com o publicador que avisa no MQTT.',
        'Explique o papel do broker como intermediário entre publicador e assinante.',
        'Mostre numa tabela as diferenças com o Modbus.',
      ] },
      { dicas: [
        'Mostre uma hierarquia de tópicos: planta, área, máquina, variável.',
        'Explique os curingas de assinatura, o de um nível e o de vários níveis.',
        'Dê regras de nome: minúsculas, sem espaço, sem acento.',
      ] },
      { dicas: [
        'Explique os níveis de QoS 0, 1 e 2 e quando usar cada um.',
        'Explique a mensagem retida para o assinante novo receber o último valor.',
        'Fale da última vontade para avisar que o dispositivo caiu.',
      ] },
      { dicas: [
        'Mostre onde o MQTT costuma ficar: do gateway ou do CLP para o supervisório ou nuvem.',
        'Explique por que ele não é usado para controle rápido de campo.',
        'Fale de usuário, senha e TLS no broker.',
        'Inclua um exemplo de publicação com um cliente de linha de comando.',
      ] },
    ],
    armadilhas: [
      'Broker aberto sem senha na rede',
      'Tópico sem padrão de nome',
      'Usar MQTT para intertravamento',
    ],
    quiz: [
      {
        pergunta: 'Qual o papel do broker no MQTT?',
        certa: 'Receber as mensagens e entregá-las aos assinantes',
        erradas: ['Perguntar cada valor aos dispositivos', 'Converter o sinal analógico em digital'],
      },
      {
        pergunta: 'Para que serve a mensagem retida?',
        certa: 'Entregar o último valor a quem assinar depois',
        erradas: ['Garantir a entrega em menos de um milissegundo', 'Bloquear o tópico para outros publicadores'],
      },
      {
        pergunta: 'Qual nível de QoS garante entrega exatamente uma vez?',
        certa: 'QoS 2',
        erradas: ['QoS 0', 'QoS 1'],
      },
    ],
    termos: [
      { termo: 'Broker', definicao: 'Servidor MQTT que recebe as mensagens publicadas e as distribui a quem assinou o tópico.' },
      { termo: 'Tópico', definicao: 'O endereço em texto, organizado em níveis, sob o qual uma mensagem é publicada.' },
      { termo: 'QoS', definicao: 'Nível de garantia de entrega da mensagem no MQTT: 0, 1 ou 2.' },
      { termo: 'Última vontade', definicao: 'Mensagem que o broker publica sozinho se o cliente cair sem se despedir.' },
    ],
  },

  'tela-de-lider-varias-maquinas': {
    resumo: [
      'Que um ou dois números de cada máquina importam ao líder.',
      'De onde veio cada dado e como ele chegou à tela.',
      'Como a tela ficou e o que mudou na rotina do turno.',
    ],
    secoes: [
      { dicas: [
        'Conte que decisões o líder toma no turno e que dado apoia cada uma.',
        'Explique por que escolheu poucos números: estado, produção, parada.',
        'Diga o que ficou de fora e por quê.',
      ] },
      { dicas: [
        'Diga de onde veio cada dado: CLP, IHM, apontamento manual.',
        'Conte o protocolo ou o caminho usado para juntar tudo.',
        'Explique como tratou máquina sem comunicação.',
      ] },
      { dicas: [
        'Mostre com foto ou captura a tela montada.',
        'Explique a escolha de cores e o destaque para máquina parada.',
        'Diga onde a tela fica: televisão no chão de fábrica, celular ou computador.',
      ] },
      { dicas: [
        'Conte o que o líder passou a fazer diferente.',
        'Diga se o tempo de reação a parada mudou.',
        'Conte o que você mudaria na próxima versão.',
      ] },
    ],
    armadilhas: [
      'Encher a tela com todos os dados de cada máquina',
      'Mostrar número sem saber de onde ele vem',
      'Tela bonita que ninguém consulta',
    ],
    quiz: [
      {
        pergunta: 'Qual o critério para escolher o dado da tela de líder?',
        certa: 'O dado que apoia uma decisão do líder no turno',
        erradas: ['Todo dado que o CLP disponibiliza', 'O dado mais fácil de coletar da máquina'],
      },
      {
        pergunta: 'Por que destacar a máquina parada na tela?',
        certa: 'Para o líder perceber de longe onde agir',
        erradas: ['Para esconder as máquinas que produzem', 'Para reduzir o tráfego de dados na rede'],
      },
      {
        pergunta: 'Como tratar máquina que perdeu comunicação?',
        certa: 'Mostrar claramente que o dado está sem atualização',
        erradas: ['Repetir o último valor como se fosse atual', 'Remover a máquina da tela sem aviso'],
      },
    ],
    termos: [
      { termo: 'Estado da máquina', definicao: 'Condição atual do equipamento, como produzindo, parado, em setup ou em falha.' },
      { termo: 'Apontamento', definicao: 'Registro manual feito pelo operador, como motivo de parada ou quantidade de refugo.' },
      { termo: 'Andon', definicao: 'Sinal visual, luminoso ou em tela, que mostra ao chão de fábrica onde há problema.' },
    ],
  },

  'oee-a-conta-e-as-armadilhas': {
    resumo: [
      'Como o OEE combina disponibilidade, desempenho e qualidade.',
      'De onde vem cada dado da conta e quem o registra.',
      'As maneiras mais comuns de inflar o número.',
      'Por que o OEE de duas fábricas não se compara diretamente.',
    ],
    secoes: [
      { dicas: [
        'Mostre a fórmula: OEE igual a disponibilidade vezes desempenho vezes qualidade.',
        'Explique cada fator com um turno de exemplo e números simples.',
        'Mostre como um fator baixo derruba o resultado final.',
      ] },
      { dicas: [
        'Diga de onde vem o tempo planejado, as paradas e a contagem de produtos.',
        'Explique de onde vem o tempo de ciclo ideal e quem o define.',
        'Fale da diferença entre dado automático do CLP e apontamento manual.',
      ] },
      { dicas: [
        'Mostre o efeito de tirar setup e manutenção programada do tempo planejado.',
        'Mostre o efeito de usar um ciclo ideal mais lento que o real.',
        'Mostre o efeito de contar retrabalho como produto bom.',
      ] },
    ],
    armadilhas: [
      'Ciclo ideal ajustado para o OEE subir',
      'Paradas curtas que ninguém registra',
      'Comparar OEE entre fábricas com regras diferentes',
    ],
    quiz: [
      {
        pergunta: 'Como se calcula o OEE?',
        certa: 'Disponibilidade vezes desempenho vezes qualidade',
        erradas: ['Disponibilidade mais desempenho mais qualidade', 'Produção real dividida pela meta do mês'],
      },
      {
        pergunta: 'O que o fator desempenho mede?',
        certa: 'A velocidade real comparada à velocidade ideal',
        erradas: ['A fração de produtos sem defeito', 'O tempo em que a máquina ficou ligada'],
      },
      {
        pergunta: 'Qual prática infla o OEE sem melhorar a máquina?',
        certa: 'Usar um tempo de ciclo ideal mais lento que o real',
        erradas: ['Registrar todas as paradas curtas', 'Contar só os produtos bons na qualidade'],
      },
    ],
    termos: [
      { termo: 'OEE', definicao: 'Eficiência Global do Equipamento: indicador que mede quanto do tempo planejado virou produto bom.' },
      { termo: 'Tempo de ciclo ideal', definicao: 'O menor tempo teórico para produzir uma unidade naquela máquina.' },
      { termo: 'Microparada', definicao: 'Parada curta, muitas vezes de segundos, que some do registro e reduz o desempenho.' },
    ],
  },

  'coletar-dados-de-maquina-antiga': {
    resumo: [
      'Como definir o que se quer saber antes de instalar qualquer coisa.',
      'Onde pegar o sinal de uma máquina antiga sem mexer no programa.',
      'Como o dado chegou ao destino e o que foi aprendido no caminho.',
    ],
    secoes: [
      { dicas: [
        'Descreva a máquina: idade, comando, se tem rede ou não.',
        'Diga a pergunta: contagem de produção, tempo parado, motivo de parada.',
        'Conte por que não se podia alterar o programa existente.',
      ] },
      { dicas: [
        'Mostre com foto de onde veio o sinal: sensor novo, contato auxiliar, sinaleiro.',
        'Explique a isolação usada para não interferir no circuito original.',
        'Fale de sensor de corrente como forma de saber se o motor está rodando.',
        'Conte quem autorizou a intervenção no painel.',
      ] },
      { dicas: [
        'Diga o equipamento que leu o sinal e como mandou o dado.',
        'Mostre o dado chegando: tabela, gráfico ou tela.',
        'Conte como conferiu a contagem com a produção real.',
      ] },
      { dicas: [
        'Conte o que deu errado na primeira tentativa.',
        'Diga o que o dado revelou que ninguém esperava.',
        'Diga o que faria diferente numa próxima máquina.',
      ] },
    ],
    armadilhas: [
      'Ligar sinal novo direto no circuito de comando sem isolação',
      'Contar pulso duplicado por repique do contato',
      'Mexer no painel sem autorização do responsável',
    ],
    quiz: [
      {
        pergunta: 'Qual forma não invasiva de saber se um motor está rodando?',
        certa: 'Medir a corrente com um sensor de corrente',
        erradas: ['Alterar o programa do CLP da máquina', 'Trocar o contator por um modelo novo'],
      },
      {
        pergunta: 'Por que isolar o sinal retirado do circuito original?',
        certa: 'Para não interferir no funcionamento da máquina',
        erradas: ['Para aumentar a velocidade da máquina', 'Para dispensar a fonte do coletor'],
      },
      {
        pergunta: 'Como confirmar que a contagem coletada está certa?',
        certa: 'Comparando com a produção real contada no período',
        erradas: ['Confiando no primeiro dia de coleta', 'Olhando apenas se o gráfico ficou bonito'],
      },
    ],
    termos: [
      { termo: 'Retrofit', definicao: 'Atualização de uma máquina antiga com componentes novos, mantendo a estrutura existente.' },
      { termo: 'Contato auxiliar', definicao: 'Contato extra de um contator ou relé que muda de estado junto com o principal.' },
      { termo: 'Repique', definicao: 'Abre e fecha rápido de um contato mecânico ao comutar, que pode gerar contagem duplicada.' },
    ],
  },

  /* ================= Rede / TI ================= */
  'cabo-de-rede-cat5e-cat6-cat6a': {
    resumo: [
      'O que muda entre Cat5e, Cat6 e Cat6A em frequência e velocidade.',
      'Quando o cabo blindado ajuda e quando atrapalha.',
      'O que exigir de um cabo industrial em óleo, dobra e vibração.',
      'De onde vem o limite de 100 metros.',
    ],
    secoes: [
      { dicas: [
        'Mostre numa tabela a frequência de cada categoria: 100, 250 e 500 MHz.',
        'Explique que 10 Gbit/s em Cat6 tem alcance reduzido e o Cat6A chega a 100 m.',
        'Diga que a maioria das redes de máquina roda a 100 Mbit/s e o que isso significa na escolha.',
      ] },
      { dicas: [
        'Explique as siglas de construção como U/UTP, F/UTP e S/FTP.',
        'Explique que a blindagem só funciona com conector blindado e aterramento correto.',
        'Diga quando o cabo não blindado é suficiente.',
      ] },
      { dicas: [
        'Fale de capa resistente a óleo e a raio ultravioleta.',
        'Explique a diferença entre condutor rígido e flexível para cabo que se movimenta.',
        'Fale de cabo para esteira porta-cabos e raio mínimo de curvatura.',
      ] },
      { dicas: [
        'Explique o canal de 100 m: 90 m de cabo fixo e até 10 m de cordões.',
        'Diga o que acontece quando se passa do limite: erro intermitente, não queda imediata.',
        'Mostre as saídas: switch intermediário ou fibra óptica.',
      ] },
    ],
    armadilhas: [
      'Cabo blindado sem aterramento',
      'Cabo de escritório em esteira porta-cabos',
      'Passar dos 100 m porque o link subiu',
    ],
    quiz: [
      {
        pergunta: 'Qual a frequência de especificação do Cat6A?',
        certa: '500 MHz',
        erradas: ['100 MHz', '250 MHz'],
      },
      {
        pergunta: 'Qual o comprimento máximo de um canal de par trançado Ethernet?',
        certa: '100 metros',
        erradas: ['50 metros', '300 metros'],
      },
      {
        pergunta: 'O que o cabo blindado exige para funcionar bem?',
        certa: 'Conector blindado e aterramento correto',
        erradas: ['Comprimento sempre abaixo de 10 metros', 'Switch com porta de 10 Gbit/s'],
      },
    ],
    termos: [
      { termo: 'Categoria', definicao: 'Classificação do cabo de par trançado pelo desempenho em frequência, como Cat5e, Cat6 e Cat6A.' },
      { termo: 'Par trançado', definicao: 'Cabo com pares de fios enrolados entre si para reduzir interferência.' },
      { termo: 'Canal', definicao: 'O caminho completo entre dois equipamentos, incluindo cabo fixo, tomadas e cordões.' },
    ],
  },

  'crimpar-e-testar-cabo': {
    resumo: [
      'A ordem de cores dos padrões T568A e T568B.',
      'O passo a passo para crimpar um conector RJ45 sem retrabalho.',
      'O que o testador simples prova e o que só um certificador prova.',
    ],
    secoes: [
      { dicas: [
        'Mostre a ordem de cores dos dois padrões numa tabela.',
        'Explique que o importante é usar o mesmo padrão nas duas pontas.',
        'Diga que o cabo cruzado quase não é mais preciso por causa do Auto MDI-X.',
      ] },
      { dicas: [
        'Mostre com foto cada etapa: decapar, destrançar, alinhar, cortar e inserir.',
        'Diga quanto destrançar e por que isso afeta o desempenho.',
        'Mostre como conferir que a capa ficou presa dentro do conector.',
        'Fale do conector blindado e da ligação da malha.',
      ] },
      { dicas: [
        'Explique que o testador simples mostra continuidade e ordem dos fios.',
        'Explique que ele não mostra par separado, perda ou desempenho em frequência.',
        'Diga quando vale contratar certificação do cabeamento.',
      ] },
    ],
    armadilhas: [
      'Padrões diferentes nas duas pontas',
      'Destrançar demais os pares',
      'Confiar só na luzinha do testador',
    ],
    quiz: [
      {
        pergunta: 'O que garante um cabo direto funcionando?',
        certa: 'Usar o mesmo padrão nas duas pontas',
        erradas: ['Usar sempre o T568A nas duas pontas', 'Usar T568A numa ponta e T568B na outra'],
      },
      {
        pergunta: 'O que um testador simples de continuidade não detecta?',
        certa: 'Par separado, com cada fio no pino certo',
        erradas: ['Fio aberto em um dos pinos', 'Dois fios invertidos de posição'],
      },
      {
        pergunta: 'Por que evitar destrançar demais os pares?',
        certa: 'Porque aumenta a interferência entre os pares',
        erradas: ['Porque o conector não fecha', 'Porque o cabo fica mais curto'],
      },
    ],
    termos: [
      { termo: 'T568B', definicao: 'Padrão de ordem de cores dos fios no conector RJ45, o mais usado no Brasil em redes comuns.' },
      { termo: 'Auto MDI-X', definicao: 'Recurso da porta de rede que ajusta sozinha a transmissão e a recepção, dispensando cabo cruzado.' },
      { termo: 'Par separado', definicao: 'Erro em que os fios chegam aos pinos certos, mas fios de pares diferentes formam um par.' },
    ],
  },

  'ip-mascara-e-gateway-para-quem-monta-painel': {
    resumo: [
      'Como o endereço IP e a máscara definem quem fala com quem.',
      'Quando o gateway é necessário e quando pode ficar em branco.',
      'Como montar um plano de endereços para a máquina.',
    ],
    secoes: [
      { dicas: [
        'Explique a máscara 255.255.255.0 com um exemplo de CLP, IHM e inversor.',
        'Mostre por que dois equipamentos em redes diferentes não se enxergam sem roteador.',
        'Cite as faixas privadas, como 192.168.x.x e 10.x.x.x.',
        'Mostre como testar com ping no terminal.',
      ] },
      { dicas: [
        'Explique que o gateway só é usado para falar com outra rede.',
        'Dê o exemplo de supervisório ou acesso remoto que exige gateway.',
        'Mostre o erro de gateway fora da rede do equipamento.',
      ] },
      { dicas: [
        'Mostre uma tabela de plano: faixa por tipo de equipamento.',
        'Explique por que reservar endereços para expansão e para o notebook de manutenção.',
        'Diga como documentar o plano no desenho elétrico e na porta do painel.',
      ] },
    ],
    armadilhas: [
      'Dois equipamentos com o mesmo IP',
      'Máscara diferente entre equipamentos da mesma rede',
      'Usar a faixa do escritório sem combinar com o TI',
    ],
    quiz: [
      {
        pergunta: 'Com máscara 255.255.255.0, qual endereço está na mesma rede que 192.168.1.10?',
        certa: '192.168.1.50',
        erradas: ['192.168.2.10', '192.169.1.10'],
      },
      {
        pergunta: 'Quando o gateway é necessário?',
        certa: 'Quando o equipamento precisa falar com outra rede',
        erradas: ['Sempre que houver mais de dois equipamentos', 'Só quando o cabo passa de 100 metros'],
      },
      {
        pergunta: 'Qual o sintoma típico de IP duplicado na rede?',
        certa: 'Comunicação que cai e volta de forma intermitente',
        erradas: ['O cabo de rede esquenta demais', 'O switch desliga todas as portas'],
      },
    ],
    termos: [
      { termo: 'Endereço IP', definicao: 'Número que identifica cada equipamento numa rede, como 192.168.1.10.' },
      { termo: 'Máscara de sub-rede', definicao: 'Número que indica qual parte do IP é a rede e qual parte é o equipamento.' },
      { termo: 'Gateway', definicao: 'Equipamento, normalmente um roteador, que leva o tráfego de uma rede para outra.' },
    ],
  },

  'switch-gerenciavel-ou-nao': {
    resumo: [
      'O que um switch gerenciável faz além de ligar portas.',
      'Como um laço de cabo gera tempestade de broadcast e derruba a rede.',
      'O que muda num switch industrial: temperatura, fonte e trilho.',
    ],
    secoes: [
      { dicas: [
        'Liste recursos: VLAN, espelhamento de porta, diagnóstico, IGMP snooping.',
        'Explique por que o tráfego multicast de alguns protocolos industriais pede IGMP snooping.',
        'Diga quando o não gerenciável basta: máquina pequena e isolada.',
      ] },
      { dicas: [
        'Explique como um cabo ligando duas portas cria um laço.',
        'Mostre o sintoma: luzes piscando sem parar e rede parada.',
        'Explique como o protocolo de árvore de expansão ou de anel evita o laço.',
      ] },
      { dicas: [
        'Compare faixa de temperatura, fonte redundante e montagem em trilho DIN.',
        'Fale de contato de alarme para falha de fonte ou de porta.',
        'Diga por que switch de escritório dentro do painel é risco.',
      ] },
    ],
    armadilhas: [
      'Cabo sobrando ligado em duas portas do mesmo switch',
      'Switch de escritório dentro do painel quente',
      'Multicast inundando a rede sem IGMP snooping',
    ],
    quiz: [
      {
        pergunta: 'O que causa uma tempestade de broadcast?',
        certa: 'Um laço físico na rede sem proteção',
        erradas: ['Um cabo de rede curto demais', 'Um IP fixo configurado no CLP'],
      },
      {
        pergunta: 'Qual recurso limita o tráfego multicast às portas interessadas?',
        certa: 'IGMP snooping',
        erradas: ['Auto MDI-X', 'Espelhamento de porta'],
      },
      {
        pergunta: 'O que diferencia um switch industrial?',
        certa: 'Faixa de temperatura ampla e montagem em trilho',
        erradas: ['Número maior de portas por padrão', 'Uso exclusivo de fibra óptica'],
      },
    ],
    termos: [
      { termo: 'Broadcast', definicao: 'Mensagem enviada para todos os equipamentos da rede de uma vez.' },
      { termo: 'Spanning Tree', definicao: 'Protocolo que detecta laços entre switches e bloqueia caminhos redundantes.' },
      { termo: 'IGMP snooping', definicao: 'Recurso do switch que entrega o tráfego multicast só às portas que pediram.' },
    ],
  },

  'separar-rede-da-fabrica-e-do-escritorio': {
    resumo: [
      'Por que a rede das máquinas não deve ser a mesma do escritório.',
      'O que é VLAN, em linguagem simples.',
      'Como decidir o que pode passar de uma rede para a outra.',
    ],
    secoes: [
      { dicas: [
        'Conte o risco de vírus do escritório chegando ao CLP.',
        'Explique o efeito de tráfego do escritório na comunicação da máquina.',
        'Cite a série IEC 62443 como referência de segurança em automação.',
      ] },
      { dicas: [
        'Explique VLAN como redes separadas dentro do mesmo switch.',
        'Mostre a diferença entre porta de acesso e porta tronco.',
        'Explique que para passar de uma VLAN a outra é preciso roteador ou firewall.',
      ] },
      { dicas: [
        'Liste o que costuma precisar passar: supervisório, historiador, atualização.',
        'Explique a regra de liberar só o necessário, com origem, destino e porta.',
        'Fale de zona intermediária entre fábrica e escritório.',
        'Diga como documentar e revisar as regras.',
      ] },
    ],
    armadilhas: [
      'Liberar tudo entre as redes para funcionar logo',
      'Notebook ligado nas duas redes ao mesmo tempo',
      'Regra de firewall sem dono nem documentação',
    ],
    quiz: [
      {
        pergunta: 'O que é uma VLAN?',
        certa: 'Uma rede lógica separada dentro do mesmo switch',
        erradas: ['Um cabo de rede de alta velocidade', 'Uma conexão sem fio de longo alcance'],
      },
      {
        pergunta: 'O que é preciso para o tráfego passar entre duas VLANs?',
        certa: 'Um roteador ou firewall entre elas',
        erradas: ['Apenas um cabo mais longo', 'Um switch não gerenciável'],
      },
      {
        pergunta: 'Qual princípio orienta as regras entre fábrica e escritório?',
        certa: 'Liberar só o tráfego necessário',
        erradas: ['Liberar tudo e bloquear depois', 'Bloquear tudo, inclusive o supervisório'],
      },
    ],
    termos: [
      { termo: 'VLAN', definicao: 'Rede local virtual: separa logicamente grupos de portas como se fossem switches diferentes.' },
      { termo: 'Firewall', definicao: 'Equipamento ou software que permite ou bloqueia tráfego entre redes conforme regras.' },
      { termo: 'Porta tronco', definicao: 'Porta do switch que carrega várias VLANs ao mesmo tempo, identificadas por etiqueta.' },
    ],
  },

  'acesso-remoto-a-maquina-com-seguranca': {
    resumo: [
      'Os jeitos errados de acesso remoto que ainda são os mais comuns.',
      'Como VPN e acesso sob demanda reduzem a exposição da rede do cliente.',
      'Por que registrar cada acesso e encerrá-lo ao final.',
    ],
    secoes: [
      { dicas: [
        'Liste: porta aberta no roteador, programa de área de trabalho remota sempre ligado, senha compartilhada.',
        'Explique por que um CLP exposto na internet pode ser encontrado por buscadores de dispositivos.',
        'Conte um caso real, sem identificar o cliente.',
      ] },
      { dicas: [
        'Explique a VPN como um túnel cifrado até a rede da máquina.',
        'Explique o acesso sob demanda: o cliente libera e desliga.',
        'Compare roteador industrial de acesso remoto com solução no computador.',
        'Fale de usuário individual e segundo fator de autenticação.',
      ] },
      { dicas: [
        'Diga o que registrar: quem, quando, de onde e o que foi alterado.',
        'Explique como encerrar a sessão e desativar o acesso depois do serviço.',
        'Lembre de revogar acesso de quem saiu da equipe.',
      ] },
    ],
    armadilhas: [
      'Encaminhar porta do CLP para a internet',
      'Senha única compartilhada por toda a equipe',
      'Acesso que fica ligado depois do serviço',
    ],
    quiz: [
      {
        pergunta: 'Por que não abrir a porta do CLP direto para a internet?',
        certa: 'Porque qualquer um pode encontrar e tentar acessar o CLP',
        erradas: ['Porque a velocidade da internet é baixa demais', 'Porque o CLP não aceita cabo de rede'],
      },
      {
        pergunta: 'O que caracteriza o acesso sob demanda?',
        certa: 'O cliente libera o acesso só quando há serviço',
        erradas: ['O acesso fica sempre ligado para agilizar', 'O técnico usa a senha do cliente'],
      },
      {
        pergunta: 'Por que usar usuário individual no acesso remoto?',
        certa: 'Para saber quem acessou e o que foi feito',
        erradas: ['Para a conexão ficar mais rápida', 'Para dispensar o uso de senha'],
      },
    ],
    termos: [
      { termo: 'VPN', definicao: 'Rede privada virtual: túnel cifrado que liga um computador a uma rede remota pela internet.' },
      { termo: 'Segundo fator', definicao: 'Confirmação extra além da senha, como código no celular, para autenticar o usuário.' },
      { termo: 'Encaminhamento de porta', definicao: 'Regra no roteador que expõe um equipamento interno a quem acessa pela internet.' },
    ],
  },
};
