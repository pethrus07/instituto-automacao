/** Guias das trilhas Fundamentos e CLP — roteiro editorial do Instituto (ver ./tipos.ts). */
import type { Guia } from './tipos';

export const GUIAS_A: Record<string, Guia> = {
  /* ---------------- Fundamentos do zero */
  'tensao-corrente-e-a-lei-de-ohm': {
    resumo: [
      'Tensão empurra, corrente circula, resistência freia.',
      'V = R × I e P = V × I resolvem a maioria das contas do painel.',
      'A corrente é que aquece o fio e faz o fusível abrir.',
      'O 24 V CC do comando e o 220 V CA da força convivem no mesmo painel.',
    ],
    secoes: [
      { dicas: [
        'Conte a analogia da caixa d’água: pressão como tensão, vazão como corrente, cano fino como resistência.',
        'Explique onde a analogia quebra: a corrente elétrica precisa de circuito fechado para existir.',
        'Mostre por que tensão se mede entre dois pontos e corrente se mede passando por dentro do circuito.',
      ] },
      { dicas: [
        'Resolva um exemplo real: a corrente de uma bobina de contator em 24 V CC a partir da potência de placa.',
        'Mostre como a potência total das cargas leva à corrente e daí à escolha do fusível e da bitola.',
        'Explique por que se usa margem e se consulta a tabela do fabricante do cabo, e não só a conta.',
      ] },
      { dicas: [
        'Explique a diferença entre CC e CA com o que o técnico vê: fonte chaveada de 24 V e rede de 220 V.',
        'Conte por que o comando costuma ser em 24 V CC: segurança de quem mexe e compatibilidade com o CLP.',
        'Alerte que o multímetro precisa estar na escala certa, CC ou CA, para cada lado do painel.',
      ] },
    ],
    armadilhas: [
      'Confundir potência com corrente ao escolher o fusível',
      'Esquecer a corrente de partida do motor',
      'Medir corrente em paralelo como se fosse tensão',
      'Tratar 24 V CC e 24 V CA como a mesma coisa',
    ],
    quiz: [
      { pergunta: 'Uma carga de 24 V consome 0,5 A. Qual a potência dela?', certa: '12 W', erradas: ['48 W', '2 W'] },
      { pergunta: 'Pela lei de Ohm, o que acontece com a corrente se a resistência dobra e a tensão fica igual?', certa: 'A corrente cai pela metade', erradas: ['A corrente dobra', 'A corrente não muda'] },
      { pergunta: 'O que faz o fio aquecer e o fusível abrir?', certa: 'A corrente que passa por ele', erradas: ['A tensão aplicada nele', 'A frequência da rede'] },
    ],
    termos: [
      { termo: 'Tensão', definicao: 'A diferença de potencial entre dois pontos, medida em volts, que empurra a corrente pelo circuito.' },
      { termo: 'Corrente', definicao: 'O fluxo de carga elétrica pelo condutor, medido em ampères.' },
      { termo: 'Resistência', definicao: 'A oposição que um material oferece à passagem da corrente, medida em ohms.' },
      { termo: 'Potência', definicao: 'A energia consumida por segundo, em watts, igual a tensão vezes corrente em CC.' },
    ],
  },

  'multimetro-sem-medo': {
    resumo: [
      'Onde ligar as pontas para cada tipo de medição.',
      'Como medir tensão sem provocar curto.',
      'Continuidade com o circuito desenergizado acha o fio que não chega.',
      'Medir corrente exige abrir o circuito ou usar alicate amperímetro.',
    ],
    secoes: [
      { dicas: [
        'Mostre com uma foto o seletor e os bornes COM, V/Ω e A do multímetro.',
        'Explique a diferença entre escala CC e CA e o que acontece ao escolher a errada.',
        'Conte por que a ponta vermelha no borne de corrente é o erro que queima fusível do aparelho.',
      ] },
      { dicas: [
        'Liste os passos: conferir o seletor, testar o multímetro num ponto conhecido, medir, testar de novo.',
        'Explique por que tensão se mede em paralelo, entre dois pontos, com o circuito energizado.',
        'Fale da categoria de medição do aparelho e das pontas, e do EPI para medir em painel energizado.',
      ] },
      { dicas: [
        'Explique que continuidade se mede sempre com o circuito desligado e isolado.',
        'Mostre como seguir um fio do borne do CLP até o sensor, trecho por trecho.',
        'Conte como caminhos em paralelo podem dar uma leitura falsa de continuidade.',
      ] },
    ],
    armadilhas: [
      'Ponta esquecida no borne de corrente',
      'Medir continuidade com o circuito energizado',
      'Não testar o multímetro antes de confiar no zero',
      'Escala CC numa medição de rede CA',
    ],
    quiz: [
      { pergunta: 'Como se liga o multímetro para medir tensão?', certa: 'Em paralelo, entre os dois pontos', erradas: ['Em série, abrindo o circuito', 'Com o circuito desligado'] },
      { pergunta: 'Qual a condição para medir continuidade com segurança?', certa: 'Circuito desenergizado', erradas: ['Circuito energizado em 24 V', 'Seletor na escala de corrente'] },
      { pergunta: 'Por que testar o multímetro num ponto conhecido antes de medir?', certa: 'Para garantir que um zero não é defeito do aparelho', erradas: ['Para calibrar a escala de corrente', 'Para descarregar as pontas de prova'] },
    ],
    termos: [
      { termo: 'Continuidade', definicao: 'Teste que verifica se existe caminho elétrico entre dois pontos, geralmente com um bipe.' },
      { termo: 'Borne COM', definicao: 'A entrada comum do multímetro, onde fica a ponta preta em quase todas as medições.' },
      { termo: 'Alicate amperímetro', definicao: 'Instrumento que mede corrente abraçando um condutor, sem abrir o circuito.' },
    ],
  },

  'logica-booleana-e-tabela-verdade': {
    resumo: [
      'E, OU e NÃO descrevem qualquer regra de liga-desliga.',
      'A tabela verdade lista todas as combinações das entradas.',
      'Contatos em série fazem E, contatos em paralelo fazem OU.',
    ],
    secoes: [
      { dicas: [
        'Monte o exemplo com dois botões e uma lâmpada para cada operação.',
        'Explique o NÃO com um botão normalmente fechado, como o de emergência.',
        'Mostre a notação que o leitor vai encontrar: E, OU, NÃO e as portas AND, OR, NOT.',
      ] },
      { dicas: [
        'Escolha uma regra real, por exemplo: a bomba liga se o nível está baixo e o modo é automático, desde que não haja falha.',
        'Mostre como o número de linhas dobra a cada entrada nova.',
        'Explique como conferir a tabela com quem conhece o processo antes de programar.',
      ] },
      { dicas: [
        'Desenhe a regra da seção anterior como contatos em série e em paralelo.',
        'Explique a ligação entre este desenho e a linha de Ladder que o leitor vai ver na trilha de CLP.',
        'Mostre como o NÃO vira um contato fechado na lógica.',
      ] },
    ],
    armadilhas: [
      'Confundir OU com OU exclusivo',
      'Esquecer combinações na tabela verdade',
      'Trocar o contato físico NF pela negação na lógica',
    ],
    quiz: [
      { pergunta: 'Dois contatos ligados em série realizam qual operação?', certa: 'E', erradas: ['OU', 'NÃO'] },
      { pergunta: 'Quantas linhas tem a tabela verdade de uma regra com três entradas?', certa: 'Oito', erradas: ['Seis', 'Três'] },
      { pergunta: 'Na operação OU com duas entradas, quando a saída é falsa?', certa: 'Só quando as duas entradas são falsas', erradas: ['Quando as duas entradas são verdadeiras', 'Quando uma entrada é falsa'] },
    ],
    termos: [
      { termo: 'Tabela verdade', definicao: 'Tabela que mostra o resultado de uma lógica para cada combinação possível das entradas.' },
      { termo: 'Porta lógica', definicao: 'Operação básica, como E, OU ou NÃO, que combina sinais de verdadeiro e falso.' },
      { termo: 'Lógica booleana', definicao: 'Álgebra em que as variáveis só valem verdadeiro ou falso, 1 ou 0.' },
    ],
  },

  'binario-hexadecimal-e-bits': {
    resumo: [
      'Contar em binário é contar só com 0 e 1.',
      'Cada dígito hexadecimal representa exatamente quatro bits.',
      'Bit, byte, palavra e palavra dupla são os tamanhos do mapa de memória.',
    ],
    secoes: [
      { dicas: [
        'Mostre uma tabela de 0 a 15 em decimal e binário.',
        'Explique o peso de cada posição: 1, 2, 4, 8, 16 e assim por diante.',
        'Relacione cada bit com uma entrada ou saída do CLP ligada ou desligada.',
      ] },
      { dicas: [
        'Explique por que um dígito hexadecimal cobre exatamente quatro bits.',
        'Converta um valor de 16 bits para hexadecimal em grupos de quatro, passo a passo.',
        'Mostre onde o hexadecimal aparece no dia a dia: código de falha, endereço, valor de status.',
      ] },
      { dicas: [
        'Defina bit, byte de 8 bits, palavra de 16 bits e palavra dupla de 32 bits.',
        'Explique que o nome e o tamanho da palavra podem variar entre fabricantes e que vale conferir o manual.',
        'Mostre como um bit dentro de uma palavra é endereçado no CLP.',
      ] },
    ],
    armadilhas: [
      'Contar os bits a partir de 1 em vez de 0',
      'Ler o número em hexadecimal como se fosse decimal',
      'Supor que palavra tem o mesmo tamanho em todo CLP',
    ],
    quiz: [
      { pergunta: 'Quanto vale o binário 1010 em decimal?', certa: '10', erradas: ['12', '5'] },
      { pergunta: 'Quantos bits representa um único dígito hexadecimal?', certa: 'Quatro', erradas: ['Oito', 'Dois'] },
      { pergunta: 'Quantos bits tem um byte?', certa: 'Oito', erradas: ['Dezesseis', 'Quatro'] },
    ],
    termos: [
      { termo: 'Bit', definicao: 'A menor unidade de informação, que só pode valer 0 ou 1.' },
      { termo: 'Byte', definicao: 'Um conjunto de oito bits.' },
      { termo: 'Hexadecimal', definicao: 'Sistema de base 16, com dígitos de 0 a 9 e de A a F, usado para ler binário de forma curta.' },
      { termo: 'Palavra', definicao: 'Grupo de bits tratado como um valor só, normalmente 16 bits nos CLPs.' },
    ],
  },

  'lendo-diagrama-eletrico': {
    resumo: [
      'Os símbolos de contato, bobina, proteção e motor que aparecem sempre.',
      'Como a folha e a coluna localizam cada componente.',
      'Referência cruzada leva da bobina aos contatos dela.',
      'Seguir um circuito da alimentação até a carga, sem se perder.',
    ],
    secoes: [
      { dicas: [
        'Mostre com uma imagem os símbolos de contato NA, NF, bobina, disjuntor, fusível, relé térmico e motor.',
        'Explique que existem padrões diferentes de simbologia e que a legenda do projeto manda.',
        'Conte como a identificação do componente, como K1 ou Q1, se repete em todo o diagrama.',
      ] },
      { dicas: [
        'Explique o carimbo da folha e o que ele informa: número, revisão, projeto.',
        'Mostre como a coluna numerada no topo localiza um ponto na folha.',
        'Explique a referência cruzada: embaixo da bobina, a lista de onde estão os contatos dela.',
      ] },
      { dicas: [
        'Escolha um circuito de comando e siga do disjuntor até a bobina, folha por folha.',
        'Mostre como os números de fio e de borne ajudam a achar o ponto no painel real.',
        'Conte como usar o diagrama e o multímetro juntos na busca de defeito.',
      ] },
    ],
    armadilhas: [
      'Trabalhar com uma revisão antiga do diagrama',
      'Ignorar a referência cruzada e procurar contato no olho',
      'Achar que o diagrama mostra a posição física do componente',
    ],
    quiz: [
      { pergunta: 'Para que serve a referência cruzada embaixo de uma bobina?', certa: 'Indicar onde estão os contatos dela', erradas: ['Indicar a tensão da bobina', 'Indicar o fabricante do contator'] },
      { pergunta: 'Qual informação do carimbo evita trabalhar com projeto desatualizado?', certa: 'A revisão da folha', erradas: ['O número de colunas', 'O nome do desenhista'] },
      { pergunta: 'Num diagrama de comando, o contato é desenhado em que estado?', certa: 'Em repouso, sem energia', erradas: ['Acionado, com energia', 'No meio do ciclo da máquina'] },
    ],
    termos: [
      { termo: 'Referência cruzada', definicao: 'Anotação que liga um componente aos outros pontos do diagrama onde ele aparece.' },
      { termo: 'Carimbo', definicao: 'Quadro da folha com projeto, número, revisão e responsável.' },
      { termo: 'Diagrama de comando', definicao: 'A parte do projeto que mostra a lógica de acionamento, separada do circuito de força.' },
    ],
  },

  'comandos-eletricos-contator-e-rele': {
    resumo: [
      'O contator é uma chave acionada por bobina.',
      'O relé térmico protege o motor contra sobrecarga, não contra curto.',
      'A partida direta com selo é a lógica que o CLP repete depois.',
    ],
    secoes: [
      { dicas: [
        'Mostre com uma foto a bobina, os contatos principais e os auxiliares NA e NF.',
        'Explique a identificação dos terminais da bobina, A1 e A2, e dos contatos.',
        'Conte por que a tensão da bobina precisa bater com a do comando.',
      ] },
      { dicas: [
        'Explique que o térmico protege contra sobrecarga e que o curto fica com disjuntor ou fusível.',
        'Mostre como regular o térmico pela corrente nominal da placa do motor.',
        'Explique como o contato auxiliar do térmico entra no circuito de comando.',
      ] },
      { dicas: [
        'Liste os passos de montagem: força primeiro, comando depois, teste sem motor.',
        'Explique o selo: o contato auxiliar NA do próprio contator em paralelo com o botão liga.',
        'Alerte sobre desenergizar e bloquear antes de mexer na força.',
      ] },
    ],
    armadilhas: [
      'Bobina de tensão diferente da do comando',
      'Térmico regulado muito acima da corrente do motor',
      'Selo ligado no contato NF por engano',
      'Mexer na força com o painel energizado',
    ],
    quiz: [
      { pergunta: 'Contra o que o relé térmico protege o motor?', certa: 'Sobrecarga prolongada', erradas: ['Curto-circuito', 'Queda de tensão rápida'] },
      { pergunta: 'O que faz o contator continuar ligado depois que se solta o botão liga?', certa: 'O contato de selo em paralelo com o botão', erradas: ['O relé térmico em série', 'O botão desliga em paralelo'] },
      { pergunta: 'Como se escolhe o ajuste do relé térmico?', certa: 'Pela corrente nominal na placa do motor', erradas: ['Pela tensão da bobina do contator', 'Pela corrente de partida do motor'] },
    ],
    termos: [
      { termo: 'Contator', definicao: 'Chave eletromagnética que liga cargas de potência quando sua bobina é energizada.' },
      { termo: 'Selo', definicao: 'Contato do próprio contator que mantém a bobina ligada depois que o botão é solto.' },
      { termo: 'Relé térmico', definicao: 'Dispositivo que desarma o comando quando a corrente do motor fica acima do ajuste por tempo demais.' },
    ],
  },

  'sinal-digital-e-sinal-analogico': {
    resumo: [
      'Sinal digital só tem dois estados: ligado ou desligado.',
      'Sinal analógico varia continuamente dentro de uma faixa.',
      '4–20 mA e 0–10 V são as faixas analógicas mais comuns.',
      'Cada sensor pede o tipo de entrada certo no CLP.',
    ],
    secoes: [
      { dicas: [
        'Explique o sinal de 0 e 24 V CC e as faixas que a entrada considera ligado e desligado.',
        'Dê exemplos: botão, fim de curso, sensor indutivo.',
        'Conte que a faixa exata de reconhecimento está no manual do cartão de entrada.',
      ] },
      { dicas: [
        'Explique como o valor da grandeza vira corrente ou tensão proporcional.',
        'Compare 4–20 mA e 0–10 V: distância do cabo, ruído, detecção de fio rompido.',
        'Mostre que o cartão converte o sinal num número para o programa.',
      ] },
      { dicas: [
        'Monte uma tabela de sensores comuns e o tipo de sinal de cada um.',
        'Explique que um mesmo tipo de sensor pode existir nas versões digital e analógica.',
        'Oriente a conferir a placa ou o manual do sensor antes de ligar.',
      ] },
    ],
    armadilhas: [
      'Ligar sensor analógico em entrada digital',
      'Sensor 0–10 V em cartão configurado para corrente',
      'Cabo analógico longo sem blindagem junto da força',
    ],
    quiz: [
      { pergunta: 'Qual destes normalmente entrega sinal digital?', certa: 'Sensor indutivo de presença', erradas: ['Transmissor de pressão', 'Termopar'] },
      { pergunta: 'Qual a vantagem do 4–20 mA sobre o 0–10 V em cabo longo?', certa: 'Sofre menos com queda de tensão e ruído', erradas: ['Dispensa fonte de alimentação', 'Tem mais estados que o digital'] },
      { pergunta: 'O que o cartão analógico entrega ao programa?', certa: 'Um número proporcional ao sinal', erradas: ['Apenas ligado ou desligado', 'A tensão em volts sem conversão'] },
    ],
    termos: [
      { termo: 'Sinal digital', definicao: 'Sinal com apenas dois estados, ligado e desligado.' },
      { termo: 'Sinal analógico', definicao: 'Sinal que varia de forma contínua e representa uma grandeza, como pressão ou temperatura.' },
      { termo: 'Transmissor', definicao: 'Instrumento que converte a medição do sensor num sinal padrão, como 4–20 mA.' },
    ],
  },

  'malha-aberta-e-malha-fechada': {
    resumo: [
      'Malha aberta executa sem conferir o resultado.',
      'Malha fechada mede, compara e corrige sozinha.',
      'Sensor, controlador e atuador formam a malha.',
      'Correção forte demais ou atrasada faz a malha oscilar.',
    ],
    secoes: [
      { dicas: [
        'Compare o forno de casa com botão de gás e o forno industrial com controlador de temperatura.',
        'Dê exemplos de malha aberta na planta: esteira temporizada, dosagem por tempo.',
        'Explique quando a malha aberta é suficiente e mais barata.',
      ] },
      { dicas: [
        'Desenhe o caminho: sensor mede, controlador compara com o valor desejado, atuador corrige.',
        'Defina valor desejado, variável de processo e erro.',
        'Dê um exemplo com nome de equipamento real: termopar, controlador, resistência.',
      ] },
      { dicas: [
        'Explique a oscilação com o exemplo do chuveiro que demora a responder.',
        'Mostre como atraso do processo e ganho alto se somam.',
        'Aponte que o PID, visto na trilha de CLP, é a ferramenta para domar isso.',
      ] },
    ],
    armadilhas: [
      'Culpar o controlador por sensor mal instalado',
      'Aumentar o ganho para ganhar velocidade e causar oscilação',
      'Chamar de malha fechada um sistema sem realimentação',
    ],
    quiz: [
      { pergunta: 'O que diferencia a malha fechada da aberta?', certa: 'A medição do resultado realimenta a correção', erradas: ['O uso de um CLP no lugar de relés', 'A presença de um motor elétrico'] },
      { pergunta: 'Na malha de temperatura de um forno, qual é o atuador?', certa: 'A resistência de aquecimento', erradas: ['O termopar', 'O valor desejado'] },
      { pergunta: 'O que costuma causar oscilação numa malha fechada?', certa: 'Correção forte demais para um processo lento', erradas: ['Sensor com leitura precisa', 'Valor desejado fixo'] },
    ],
    termos: [
      { termo: 'Realimentação', definicao: 'Uso da medição do resultado para ajustar a ação do controle.' },
      { termo: 'Valor desejado', definicao: 'O valor que o processo deve atingir, também chamado de setpoint.' },
      { termo: 'Variável de processo', definicao: 'A grandeza medida que o controle tenta manter no valor desejado.' },
    ],
  },

  'pneumatica-basica': {
    resumo: [
      'O caminho do ar do compressor até o cilindro.',
      'Válvulas se descrevem por vias e posições.',
      'Cilindro de simples ação volta por mola, o de dupla ação volta por ar.',
    ],
    secoes: [
      { dicas: [
        'Explique o papel do compressor, do reservatório e da linha de distribuição.',
        'Mostre com uma imagem a unidade de tratamento: filtro, regulador e, quando houver, lubrificador.',
        'Conte por que a água no ar comprimido é inimiga de válvula e cilindro.',
      ] },
      { dicas: [
        'Explique a notação de vias e posições, como 3/2 e 5/2.',
        'Mostre o símbolo da válvula e como ler os quadrados e as setas.',
        'Explique os tipos de acionamento: manual, mola, piloto e solenoide.',
      ] },
      { dicas: [
        'Compare os dois cilindros com uma tabela: retorno, consumo de ar, força.',
        'Mostre qual válvula costuma comandar cada tipo de cilindro.',
        'Explique a válvula reguladora de fluxo para ajustar a velocidade.',
      ] },
    ],
    armadilhas: [
      'Ar sem tratamento chegando à válvula',
      'Pressão regulada acima do que o equipamento suporta',
      'Mexer no circuito sem despressurizar a linha',
    ],
    quiz: [
      { pergunta: 'O que significa a válvula 5/2?', certa: 'Cinco vias e duas posições', erradas: ['Cinco posições e duas vias', 'Cinco bar e dois cilindros'] },
      { pergunta: 'Como retorna o cilindro de simples ação?', certa: 'Por mola', erradas: ['Por ar na outra câmara', 'Por gravidade sempre'] },
      { pergunta: 'Para que serve o regulador na unidade de tratamento?', certa: 'Manter a pressão de trabalho estável', erradas: ['Retirar o óleo do ar', 'Aumentar a vazão do compressor'] },
    ],
    termos: [
      { termo: 'Vias', definicao: 'As conexões de ar de uma válvula, como entrada, saídas e escapes.' },
      { termo: 'Posições', definicao: 'Os estados que a válvula pode assumir, cada um representado por um quadrado no símbolo.' },
      { termo: 'Unidade de tratamento', definicao: 'Conjunto de filtro, regulador e lubrificador que prepara o ar para o circuito.' },
    ],
  },

  'eletropneumatica-na-bancada': {
    resumo: [
      'A válvula solenoide transforma o sinal elétrico em comando de ar.',
      'O sensor de fim de curso informa onde o cilindro está.',
      'Avanço e retorno com sensores formam o primeiro ciclo automático.',
    ],
    secoes: [
      { dicas: [
        'Mostre com uma foto a bobina da válvula e o conector com LED, quando houver.',
        'Explique a diferença entre válvula de simples solenoide com mola e de duplo solenoide.',
        'Conte como a saída do CLP aciona a bobina e por que a tensão da bobina precisa bater.',
      ] },
      { dicas: [
        'Explique o sensor magnético preso ao corpo do cilindro e o êmbolo com ímã.',
        'Mostre como ajustar a posição do sensor e conferir pelo LED.',
        'Compare com a chave fim de curso mecânica.',
      ] },
      { dicas: [
        'Liste os passos: botão de partida, avança até o sensor de fim, retorna até o sensor de início.',
        'Explique o que acontece com a válvula de mola e com a de duplo solenoide se faltar energia.',
        'Oriente a testar primeiro com pressão baixa e as mãos longe do curso do cilindro.',
      ] },
    ],
    armadilhas: [
      'Sensor magnético em cilindro sem ímã no êmbolo',
      'Esquecer o comportamento da válvula na falta de energia',
      'Energizar as duas bobinas ao mesmo tempo',
      'Testar o ciclo com pressão cheia e mão no caminho',
    ],
    quiz: [
      { pergunta: 'O que faz a válvula de duplo solenoide quando a energia cai?', certa: 'Mantém a última posição', erradas: ['Volta pela mola', 'Libera todo o ar da linha'] },
      { pergunta: 'O que o sensor magnético do cilindro detecta?', certa: 'O ímã do êmbolo', erradas: ['A pressão da câmara', 'A corrente da bobina'] },
      { pergunta: 'Qual sinal encerra o avanço num ciclo simples?', certa: 'O sensor de fim de curso avançado', erradas: ['O botão de emergência', 'O regulador de pressão'] },
    ],
    termos: [
      { termo: 'Válvula solenoide', definicao: 'Válvula pneumática cuja posição é mudada por uma bobina elétrica.' },
      { termo: 'Sensor magnético', definicao: 'Sensor fixado no corpo do cilindro que detecta o ímã do êmbolo.' },
      { termo: 'Ciclo automático', definicao: 'Sequência de movimentos que a máquina repete sozinha a partir de um comando de partida.' },
    ],
  },

  /* ---------------- CLP do zero */
  'o-que-um-clp-faz-que-um-rele-nao-faz': {
    resumo: [
      'A mesma lógica de relés pode morar num programa.',
      'O CLP trabalha em ciclo: lê entradas, executa, escreve saídas.',
      'Mudar a lógica sem refiar é o grande ganho.',
      'Para uma lógica simples e fixa, o relé ainda pode bastar.',
    ],
    secoes: [
      { dicas: [
        'Mostre lado a lado o diagrama da partida com relés e o programa equivalente.',
        'Explique que botões e bobinas continuam ligados por fio e só a lógica muda de lugar.',
        'Conte o que acontece com o painel quando a lógica cresce em relés.',
      ] },
      { dicas: [
        'Explique as três etapas da varredura com um desenho simples.',
        'Conte por que a entrada é lida uma vez por ciclo e o que isso significa para pulso muito curto.',
        'Explique o watchdog e por que um laço longo derruba o CLP.',
      ] },
      { dicas: [
        'Dê um exemplo de mudança de lógica feita só no programa.',
        'Mostre como o CLP ajuda a diagnosticar pelo estado das entradas e saídas.',
        'Fale do registro de falhas e contadores que o relé não oferece.',
      ] },
      { dicas: [
        'Liste casos em que o relé é a escolha certa: lógica mínima, fixa, sem necessidade de diagnóstico.',
        'Explique que funções de segurança seguem regras próprias e não se resolvem com um CLP comum.',
        'Conte o custo real de cada opção, incluindo quem vai manter.',
      ] },
    ],
    armadilhas: [
      'Achar que o CLP dispensa a fiação de campo',
      'Colocar a emergência só no programa',
      'Esperar que o CLP leia pulso mais rápido que a varredura',
    ],
    quiz: [
      { pergunta: 'Qual a ordem do ciclo de varredura?', certa: 'Ler entradas, executar programa, escrever saídas', erradas: ['Escrever saídas, ler entradas, executar programa', 'Executar programa, ler entradas, escrever saídas'] },
      { pergunta: 'Qual o maior ganho de levar a lógica para o CLP?', certa: 'Alterar a lógica sem refazer a fiação', erradas: ['Eliminar os sensores de campo', 'Dispensar a proteção do motor'] },
      { pergunta: 'Quando um relé ainda pode bastar?', certa: 'Numa lógica simples e que não muda', erradas: ['Numa máquina com receitas', 'Quando se precisa de registro de falhas'] },
    ],
    termos: [
      { termo: 'CLP', definicao: 'Controlador lógico programável, um computador industrial que executa a lógica da máquina.' },
      { termo: 'Ciclo de varredura', definicao: 'A repetição contínua de ler entradas, executar o programa e atualizar as saídas.' },
      { termo: 'Watchdog', definicao: 'Vigia interno que para o CLP se um ciclo de varredura demora mais que o limite.' },
    ],
  },

  'entradas-e-saidas-digitais-sem-queimar-nada': {
    resumo: [
      'O sensor PNP fornece positivo, o NPN fornece o negativo.',
      'O comum define se a entrada espera PNP ou NPN.',
      'Saída a relé é versátil, saída a transistor é rápida e só CC.',
      'Medir antes de energizar evita queimar cartão e sensor.',
    ],
    secoes: [
      { dicas: [
        'Explique o que o sensor PNP e o NPN entregam no fio de sinal quando acionados.',
        'Mostre com uma imagem as três cores de fio usuais e oriente a conferir o manual do sensor.',
        'Relacione PNP com entrada do tipo sink e NPN com entrada do tipo source, deixando claro que a nomenclatura varia entre fabricantes.',
      ] },
      { dicas: [
        'Explique o borne comum da entrada: em qual potencial ele fica para cada tipo de sensor.',
        'Mostre o comum da saída e como ele alimenta um grupo de saídas.',
        'Conte o que acontece quando se mistura sensor PNP e NPN no mesmo grupo.',
      ] },
      { dicas: [
        'Compare numa tabela: tensão que comanda, corrente, velocidade, vida útil.',
        'Explique por que a saída a relé aceita CA e CC e a transistor normalmente só CC.',
        'Fale do diodo em paralelo com bobina CC e do relé de interface para cargas maiores.',
      ] },
      { dicas: [
        'Liste as medições: tensão da fonte, polaridade no comum, sinal do sensor acionado e solto.',
        'Explique como conferir que a carga não passa da corrente do ponto de saída.',
        'Alerte sobre ligar com o painel desenergizado e testar ponto a ponto.',
      ] },
    ],
    armadilhas: [
      'Sensor NPN em entrada preparada para PNP',
      'Carga acima da corrente da saída a transistor',
      'Bobina CC sem diodo de roda livre',
      'Misturar comuns de grupos diferentes',
    ],
    quiz: [
      { pergunta: 'O que o sensor PNP entrega no fio de sinal quando aciona?', certa: 'O positivo da alimentação', erradas: ['O negativo da alimentação', 'Um sinal de 4–20 mA'] },
      { pergunta: 'Qual saída normalmente aciona uma carga em 220 V CA?', certa: 'Saída a relé', erradas: ['Saída a transistor', 'Entrada digital'] },
      { pergunta: 'Qual a vantagem da saída a transistor?', certa: 'Chaveia mais rápido e sem desgaste mecânico', erradas: ['Aceita CA e CC igualmente', 'Suporta qualquer corrente'] },
    ],
    termos: [
      { termo: 'PNP', definicao: 'Sensor que, acionado, liga o fio de sinal ao positivo da alimentação.' },
      { termo: 'NPN', definicao: 'Sensor que, acionado, liga o fio de sinal ao negativo da alimentação.' },
      { termo: 'Borne comum', definicao: 'Terminal compartilhado por um grupo de entradas ou saídas, que fecha o circuito delas.' },
      { termo: 'Relé de interface', definicao: 'Relé intermediário que isola a saída do CLP de uma carga maior ou de outra tensão.' },
    ],
  },

  'ladder-do-zero-selo-e-intertravamento': {
    resumo: [
      'Contato aberto, contato fechado e bobina montam qualquer linha.',
      'O selo mantém o motor ligado depois de soltar o botão.',
      'O intertravamento impede ligar os dois sentidos ao mesmo tempo.',
      'Simular antes evita descobrir o erro na máquina.',
    ],
    secoes: [
      { dicas: [
        'Mostre com uma imagem o contato aberto, o fechado e a bobina em Ladder.',
        'Explique que o contato no programa lê o estado do bit, não o tipo do contato físico.',
        'Conte o caso do botão desliga físico NF e como ele aparece no programa.',
      ] },
      { dicas: [
        'Monte a linha do selo passo a passo: botão liga, contato da própria saída em paralelo, desliga em série.',
        'Explique o que acontece em cada varredura quando se aperta e solta o botão.',
        'Mostre onde entra o contato do relé térmico.',
      ] },
      { dicas: [
        'Monte o intertravamento com o contato fechado de cada sentido na linha do outro.',
        'Explique por que também vale o intertravamento elétrico nos contatores.',
        'Conte o que acontece se inverter o sentido sem esperar o motor parar.',
      ] },
      { dicas: [
        'Mostre como forçar entradas no simulador e ver as linhas mudarem.',
        'Liste os testes: liga, desliga, térmico, os dois sentidos juntos.',
        'Explique que o simulador não substitui o teste de campo, só antecipa os erros.',
      ] },
    ],
    armadilhas: [
      'Botão desliga NF programado como contato fechado',
      'Intertravamento só no programa, sem contato elétrico',
      'Usar a mesma bobina em duas linhas',
    ],
    quiz: [
      { pergunta: 'Onde fica o contato de selo na linha?', certa: 'Em paralelo com o botão liga', erradas: ['Em série com o botão desliga', 'Em paralelo com a bobina'] },
      { pergunta: 'Para que serve o intertravamento na reversão?', certa: 'Impedir que os dois sentidos liguem juntos', erradas: ['Manter o motor ligado sozinho', 'Proteger o motor de sobrecarga'] },
      { pergunta: 'Um botão físico NF, sem acionar, deixa o bit de entrada em que estado?', certa: 'Ligado', erradas: ['Desligado', 'Indefinido'] },
    ],
    termos: [
      { termo: 'Ladder', definicao: 'Linguagem gráfica de programação de CLP que imita o diagrama de relés.' },
      { termo: 'Autorretenção', definicao: 'Lógica em que a saída mantém a si mesma ligada depois que o comando de partida some.' },
      { termo: 'Intertravamento', definicao: 'Condição que impede duas ações incompatíveis de acontecerem ao mesmo tempo.' },
    ],
  },

  'temporizadores-e-contadores-na-pratica': {
    resumo: [
      'TON atrasa o ligar, TOF atrasa o desligar.',
      'O contador soma pulsos e precisa de reset.',
      'Uma esteira que conta caixas junta os dois recursos.',
      'A base de tempo define a resolução real do temporizador.',
    ],
    secoes: [
      { dicas: [
        'Desenhe o gráfico de tempo de entrada e saída do TON e do TOF.',
        'Explique o que acontece se a entrada cair antes do tempo acabar.',
        'Dê um exemplo prático de cada um: partida atrasada e ventilação após desligar.',
      ] },
      { dicas: [
        'Explique que o contador soma na borda de subida e não enquanto o sinal está ligado.',
        'Mostre o valor de preset e o bit de contagem atingida.',
        'Explique quem dá o reset e em que momento.',
      ] },
      { dicas: [
        'Liste os passos: sensor detecta a caixa, contador soma, ao atingir o lote a esteira para.',
        'Mostre onde entra um temporizador para filtrar o sinal do sensor.',
        'Explique como o operador reinicia o lote.',
      ] },
      { dicas: [
        'Explique o que é a base de tempo e como ela muda o valor programado.',
        'Conte por que um tempo menor que o ciclo de varredura fica impreciso.',
        'Oriente a conferir no manual se o valor é em milissegundos ou em décimos.',
      ] },
    ],
    armadilhas: [
      'Contador sem reset que nunca volta a zero',
      'Temporizador com base de tempo errada',
      'Contagem dupla por sensor oscilando',
      'Usar o mesmo temporizador em dois lugares',
    ],
    quiz: [
      { pergunta: 'Qual temporizador atrasa o desligamento da saída?', certa: 'TOF', erradas: ['TON', 'Contador crescente'] },
      { pergunta: 'Quando o contador crescente soma um?', certa: 'Na borda de subida da entrada', erradas: ['Enquanto a entrada está ligada', 'A cada ciclo de varredura'] },
      { pergunta: 'O que acontece com o TON se a entrada cair antes do tempo?', certa: 'O tempo zera e a saída não liga', erradas: ['A saída liga imediatamente', 'O tempo fica parado esperando'] },
    ],
    termos: [
      { termo: 'TON', definicao: 'Temporizador com retardo na energização: a saída liga só depois do tempo programado.' },
      { termo: 'TOF', definicao: 'Temporizador com retardo no desligamento: a saída continua ligada pelo tempo programado.' },
      { termo: 'Preset', definicao: 'O valor programado que o temporizador ou contador precisa atingir.' },
      { termo: 'Borda de subida', definicao: 'O instante em que um sinal passa de desligado para ligado.' },
    ],
  },

  'entrada-analogica-4-20-ma': {
    resumo: [
      'O 4 mA como zero permite distinguir zero de fio rompido.',
      'Uma regra de três leva o valor bruto à unidade de engenharia.',
      'Corrente abaixo de 4 mA indica sensor ou cabo com defeito.',
      'Um filtro simples acalma a leitura que oscila.',
    ],
    secoes: [
      { dicas: [
        'Explique o zero vivo: com 4 mA o transmissor ainda tem corrente para funcionar e indicar zero.',
        'Mostre por que 0 mA passa a significar defeito, não medição zero.',
        'Diferencie transmissor a dois fios e a quatro fios.',
      ] },
      { dicas: [
        'Explique que cada cartão tem sua faixa de valor bruto e que ela está no manual.',
        'Mostre a fórmula da escala linear com mínimo e máximo do sensor.',
        'Resolva um exemplo com um transmissor de pressão de faixa definida.',
      ] },
      { dicas: [
        'Mostre como comparar o valor bruto com o limite abaixo de 4 mA para gerar alarme.',
        'Explique o que fazer com a lógica quando o sinal está inválido.',
        'Oriente a medir a corrente em série com o multímetro para confirmar.',
      ] },
      { dicas: [
        'Mostre em código um filtro de média móvel ou de primeira ordem.',
        'Explique o custo do filtro: a leitura fica mais lenta para mudar.',
        'Conte que ruído constante costuma ser problema de cabo, blindagem ou aterramento, não de programa.',
      ] },
    ],
    armadilhas: [
      'Usar a faixa de valor bruto de outro cartão',
      'Tratar sinal abaixo de 4 mA como zero válido',
      'Filtro tão forte que atrasa o controle',
      'Blindagem aterrada nas duas pontas sem critério',
    ],
    quiz: [
      { pergunta: 'Por que a faixa começa em 4 mA e não em 0?', certa: 'Para diferenciar medição zero de fio rompido', erradas: ['Para aumentar a precisão do cartão', 'Para dispensar a fonte de 24 V'] },
      { pergunta: 'Um transmissor de 0 a 10 bar envia 12 mA. Qual a pressão?', certa: '5 bar', erradas: ['6 bar', '7,5 bar'] },
      { pergunta: 'Qual o efeito colateral de um filtro forte na leitura?', certa: 'A leitura demora mais a acompanhar o processo', erradas: ['A leitura perde a unidade de engenharia', 'O cartão deixa de detectar fio rompido'] },
    ],
    termos: [
      { termo: 'Zero vivo', definicao: 'Uso de 4 mA como início da faixa, para que ausência de corrente indique defeito.' },
      { termo: 'Valor bruto', definicao: 'O número inteiro que o cartão analógico entrega antes de qualquer escala.' },
      { termo: 'Unidade de engenharia', definicao: 'O valor já convertido para a grandeza real, como bar, graus Celsius ou metros.' },
    ],
  },

  'comparadores-e-matematica-no-clp': {
    resumo: [
      'Inteiro e real têm limites e comportamentos diferentes.',
      'Comparar faixas pede cuidado com o valor exato do limite.',
      'Receita é um conjunto de valores que o operador escolhe na IHM.',
      'Arredondar e converter unidade no lugar certo evita erro acumulado.',
    ],
    secoes: [
      { dicas: [
        'Monte uma tabela com os tipos de dado mais usados e sua faixa de valores.',
        'Explique o estouro com um exemplo de inteiro de 16 bits passando do limite.',
        'Mostre por que misturar inteiro e real numa conta exige conversão explícita.',
      ] },
      { dicas: [
        'Mostre como decidir entre maior e maior ou igual num limite de faixa.',
        'Explique por que comparar igualdade exata com número real é arriscado.',
        'Dê um exemplo de faixa com histerese para não ficar ligando e desligando.',
      ] },
      { dicas: [
        'Explique a estrutura de uma receita: nome, valores, limites.',
        'Mostre como o operador escolhe a receita na IHM e o CLP carrega os valores.',
        'Fale de validar o valor digitado antes de usar.',
      ] },
      { dicas: [
        'Explique quando arredondar e quando truncar.',
        'Mostre a conversão de unidade num só lugar do programa.',
        'Conte o erro de exibir na IHM uma unidade diferente da usada na conta.',
      ] },
    ],
    armadilhas: [
      'Estouro de inteiro numa conta intermediária',
      'Comparar igualdade exata com número real',
      'Receita aceitando valor fora do limite',
      'Unidade diferente entre IHM e programa',
    ],
    quiz: [
      { pergunta: 'Por que comparar igualdade exata entre números reais é arriscado?', certa: 'Pequenos erros de arredondamento impedem a igualdade', erradas: ['O CLP não tem comparador para reais', 'Número real não pode ser negativo'] },
      { pergunta: 'O que acontece no estouro de um inteiro?', certa: 'O valor passa do limite e fica errado', erradas: ['O valor vira real sozinho', 'O CLP arredonda para o limite sempre'] },
      { pergunta: 'Para que serve a histerese numa comparação de faixa?', certa: 'Evitar liga e desliga repetido perto do limite', erradas: ['Aumentar a precisão do sensor', 'Converter a unidade de engenharia'] },
    ],
    termos: [
      { termo: 'Estouro', definicao: 'Quando o resultado de uma conta passa do maior valor que o tipo de dado consegue guardar.' },
      { termo: 'Número real', definicao: 'Tipo de dado com casas decimais, também chamado de ponto flutuante.' },
      { termo: 'Histerese', definicao: 'Diferença entre o ponto de ligar e o de desligar, para evitar oscilação perto do limite.' },
      { termo: 'Receita', definicao: 'Conjunto de parâmetros de produção que o operador seleciona de uma vez.' },
    ],
  },

  'sub-rotinas-e-blocos-de-funcao': {
    resumo: [
      'Copiar e colar lógica multiplica os erros.',
      'Um bloco de função tem entradas, saídas e memória própria.',
      'Cada instância do bloco controla um motor diferente.',
      'Pastas e nomes organizados deixam o projeto navegável.',
    ],
    secoes: [
      { dicas: [
        'Conte o cenário de dez motores com lógica copiada e uma correção que precisa ser feita dez vezes.',
        'Mostre como um erro esquecido numa das cópias aparece só em campo.',
        'Diferencie sub-rotina simples de bloco com memória.',
      ] },
      { dicas: [
        'Desenhe a interface do bloco de motor: comando, retorno, falha, saída.',
        'Explique a memória interna que guarda estado e temporizadores de cada instância.',
        'Mostre em código ou Ladder o conteúdo mínimo do bloco.',
      ] },
      { dicas: [
        'Mostre a chamada do mesmo bloco para três motores com dados diferentes.',
        'Explique o que é o bloco de dados da instância, quando o CLP usa esse conceito.',
        'Conte como uma correção no bloco chega a todos os motores de uma vez.',
      ] },
      { dicas: [
        'Mostre com uma árvore uma estrutura de pastas por área ou função da máquina.',
        'Explique padrões de nome para blocos e instâncias.',
        'Fale de separar lógica de máquina, comunicação e alarmes.',
      ] },
    ],
    armadilhas: [
      'Usar variável global dentro do bloco',
      'Mesma instância chamada para dois motores',
      'Alterar o bloco sem testar todas as instâncias',
    ],
    quiz: [
      { pergunta: 'O que diferencia a instância de um bloco de função?', certa: 'Cada uma tem sua própria memória', erradas: ['Cada uma tem código diferente', 'Cada uma roda em outro CLP'] },
      { pergunta: 'Qual o principal ganho de usar um bloco para dez motores?', certa: 'Corrigir num lugar e valer para todos', erradas: ['Dispensar o teste de campo', 'Reduzir o número de saídas'] },
      { pergunta: 'Por que evitar variável global dentro do bloco?', certa: 'As instâncias passam a interferir umas nas outras', erradas: ['O bloco deixa de compilar', 'O CLP não aceita variável global'] },
    ],
    termos: [
      { termo: 'Bloco de função', definicao: 'Trecho de programa reutilizável com entradas, saídas e memória própria.' },
      { termo: 'Instância', definicao: 'Uma cópia de uso do bloco, com os dados de um equipamento específico.' },
      { termo: 'Sub-rotina', definicao: 'Trecho de programa chamado a partir de outro, geralmente sem memória própria.' },
    ],
  },

  'sequenciamento-com-etapas-grafcet': {
    resumo: [
      'A máquina se descreve em etapas, transições e ações.',
      'O desenho vira programa de forma direta e legível.',
      'Parada no meio e retomada precisam ser pensadas antes.',
      'Sequência sem estrutura vira lógica difícil de manter.',
    ],
    secoes: [
      { dicas: [
        'Desenhe uma sequência curta com etapa inicial, etapas, transições e ações.',
        'Explique que só a etapa ativa executa suas ações.',
        'Mostre como a transição combina a etapa anterior com uma condição.',
      ] },
      { dicas: [
        'Mostre um método de conversão: um bit ou um número de etapa por passo.',
        'Explique a separação entre lógica de transição e lógica de ações.',
        'Dê um exemplo com cilindro avançando e voltando.',
      ] },
      { dicas: [
        'Explique o que acontece quando o operador aperta parada no meio do ciclo.',
        'Mostre como voltar para a posição inicial com segurança.',
        'Fale da diferença entre parada de ciclo e parada de emergência.',
      ] },
      { dicas: [
        'Conte um caso de sequência feita com selos soltos e o problema que gerou.',
        'Compare a manutenção de um programa em etapas com um programa sem estrutura.',
        'Liste quando o Grafcet é excesso para a máquina.',
      ] },
    ],
    armadilhas: [
      'Duas etapas ativas sem que o desenho preveja',
      'Ação ligada fora da etapa que a comanda',
      'Retomada sem conferir a posição real da máquina',
    ],
    quiz: [
      { pergunta: 'O que faz uma transição disparar?', certa: 'Etapa anterior ativa e condição verdadeira', erradas: ['Apenas a condição verdadeira', 'Apenas o tempo da etapa'] },
      { pergunta: 'Quando uma ação de etapa é executada?', certa: 'Enquanto a etapa está ativa', erradas: ['Sempre que a máquina está ligada', 'Somente na etapa inicial'] },
      { pergunta: 'Qual a vantagem de desenhar antes de programar?', certa: 'A sequência fica clara antes de virar código', erradas: ['O programa dispensa teste', 'O CLP roda mais rápido'] },
    ],
    termos: [
      { termo: 'Grafcet', definicao: 'Representação gráfica de sequências em etapas e transições, padronizada internacionalmente.' },
      { termo: 'Etapa', definicao: 'Um estado da máquina, durante o qual certas ações ficam ativas.' },
      { termo: 'Transição', definicao: 'A condição que faz a sequência passar de uma etapa para a seguinte.' },
    ],
  },

  'controle-pid-sintonia-na-pratica': {
    resumo: [
      'P reage ao erro, I elimina o erro que sobra, D freia a mudança.',
      'Sintonizar em campo pede método e mudança de um termo por vez.',
      'Anti-windup evita que o integral acumule com a saída saturada.',
      'Muitos problemas de malha estão no processo, não no PID.',
    ],
    secoes: [
      { dicas: [
        'Mostre com uma imagem curvas de resposta com P baixo, P alto, com e sem integral.',
        'Explique o erro em regime que sobra com só o proporcional.',
        'Conte por que o derivativo sofre com ruído e é pouco usado em muitas malhas.',
      ] },
      { dicas: [
        'Descreva um método de campo: começar com integral fraco, subir o P até oscilar pouco, depois ajustar o I.',
        'Explique a importância de registrar a curva antes e depois de cada mudança.',
        'Oriente a combinar com a operação o momento do teste.',
      ] },
      { dicas: [
        'Explique a saturação: a saída chega a 100% e o erro continua.',
        'Mostre o que o integral faz nesse período e o sobressinal que vem depois.',
        'Explique que muitos blocos de PID já trazem anti-windup e onde conferir no manual.',
      ] },
      { dicas: [
        'Liste causas de processo: válvula agarrando, sensor mal posicionado, atuador subdimensionado.',
        'Mostre como testar a malha em manual para separar o problema.',
        'Conte um caso em que a sintonia não resolveu e o processo sim.',
      ] },
    ],
    armadilhas: [
      'Mudar os três termos ao mesmo tempo',
      'Derivativo alto com sinal ruidoso',
      'Esquecer o anti-windup em malha que satura',
      'Sintonizar em cima de uma válvula agarrando',
    ],
    quiz: [
      { pergunta: 'Qual termo elimina o erro que sobra em regime?', certa: 'O integral', erradas: ['O proporcional', 'O derivativo'] },
      { pergunta: 'O que o anti-windup evita?', certa: 'Acúmulo do integral com a saída saturada', erradas: ['Ruído na leitura do sensor', 'Queda de tensão no atuador'] },
      { pergunta: 'Qual o risco de um derivativo alto?', certa: 'Amplificar o ruído da medição', erradas: ['Eliminar o erro em regime', 'Deixar a malha mais lenta sempre'] },
    ],
    termos: [
      { termo: 'PID', definicao: 'Algoritmo de controle que combina ação proporcional, integral e derivativa sobre o erro.' },
      { termo: 'Sobressinal', definicao: 'Quanto a variável passa do valor desejado antes de estabilizar.' },
      { termo: 'Saturação', definicao: 'Quando a saída do controlador chega ao limite e não consegue corrigir mais.' },
      { termo: 'Anti-windup', definicao: 'Recurso que limita o integral enquanto a saída está saturada.' },
    ],
  },

  'do-simulador-a-maquina': {
    resumo: [
      'Forçar e simular com critério pega erros no escritório.',
      'Uma lista de teste por função cobre a máquina inteira.',
      'Teste de campo vai do sem carga para o com carga.',
      'O registro do teste protege quem entregou.',
    ],
    secoes: [
      { dicas: [
        'Explique a diferença entre simular entradas no software e forçar saídas no CLP real.',
        'Alerte que forçar uma saída movimenta a máquina de verdade.',
        'Oriente a retirar todos os forçamentos antes de entregar e a conferir isso.',
      ] },
      { dicas: [
        'Mostre como dividir a máquina em funções e escrever o teste de cada uma.',
        'Inclua testes de falha: sensor que não chega, térmico, emergência.',
        'Use um checklist com resultado esperado e resultado obtido.',
      ] },
      { dicas: [
        'Liste a ordem: conferir entradas uma a uma, depois saídas, depois movimentos sem produto.',
        'Explique quando passar para o teste com carga e quem precisa estar junto.',
        'Fale do bloqueio de energias e do isolamento da área durante o teste.',
      ] },
      { dicas: [
        'Mostre um modelo simples de registro: item, data, resultado, responsável.',
        'Explique por que guardar a versão do programa testada junto do registro.',
        'Conte como o registro ajuda na conversa com o cliente depois.',
      ] },
    ],
    armadilhas: [
      'Forçamento esquecido no CLP entregue',
      'Testar só o caminho feliz e nenhuma falha',
      'Primeiro movimento com pessoa dentro da área',
      'Versão testada diferente da versão carregada',
    ],
    quiz: [
      { pergunta: 'Qual o risco de forçar uma saída no CLP real?', certa: 'A máquina se movimenta de verdade', erradas: ['O programa é apagado', 'A entrada correspondente queima'] },
      { pergunta: 'O que deve acontecer antes do teste com carga?', certa: 'Teste de entradas, saídas e movimentos sem carga', erradas: ['Entrega da documentação ao cliente', 'Retirada da proteção da máquina'] },
      { pergunta: 'Por que registrar a versão do programa testada?', certa: 'Para saber que o que roda é o que foi testado', erradas: ['Para liberar a licença do software', 'Para acelerar a varredura'] },
    ],
    termos: [
      { termo: 'Forçamento', definicao: 'Recurso que fixa o estado de uma entrada ou saída independente da lógica.' },
      { termo: 'Comissionamento', definicao: 'Conjunto de testes e ajustes que colocam a máquina em funcionamento no local.' },
      { termo: 'Teste a frio', definicao: 'Teste de ligações e lógica sem movimentar carga ou produto.' },
    ],
  },

  /* ---------------- CLP avulsas */
  'texto-estruturado-para-quem-sabe-ladder': {
    resumo: [
      'A mesma lógica pode ser escrita em Ladder ou em ST.',
      'IF e CASE resolvem decisão, laço exige cuidado com a varredura.',
      'ST brilha em conta e dados, Ladder em lógica de contatos.',
    ],
    secoes: [
      { dicas: [
        'Mostre em código a partida com selo em Ladder e em ST lado a lado.',
        'Explique a atribuição e os operadores AND, OR e NOT.',
        'Conte que a norma IEC 61131-3 define as duas linguagens.',
      ] },
      { dicas: [
        'Mostre um IF com ELSIF e um CASE para número de etapa.',
        'Explique por que um laço WHILE que espera um sinal trava a varredura.',
        'Oriente a limitar laços a um número fixo de repetições.',
      ] },
      { dicas: [
        'Liste casos para ST: contas, tratamento de vetores, textos.',
        'Liste casos para Ladder: intertravamento, diagnóstico visual pelo técnico de manutenção.',
        'Fale de combinar as duas no mesmo projeto.',
      ] },
    ],
    armadilhas: [
      'Laço esperando sinal dentro da varredura',
      'Esquecer que a variável mantém o valor entre ciclos',
      'Lógica em ST que a manutenção não consegue ler',
    ],
    quiz: [
      { pergunta: 'Qual norma define Ladder e ST?', certa: 'IEC 61131-3', erradas: ['IEC 60204-1', 'NBR 5410'] },
      { pergunta: 'Por que um WHILE esperando sinal é perigoso?', certa: 'Trava a varredura e o CLP para', erradas: ['Consome memória de entrada', 'Apaga os temporizadores'] },
      { pergunta: 'Em que ST costuma ser melhor que Ladder?', certa: 'Contas e tratamento de dados', erradas: ['Intertravamento simples', 'Diagnóstico visual de contatos'] },
    ],
    termos: [
      { termo: 'Texto estruturado', definicao: 'Linguagem textual de CLP, parecida com Pascal, definida na IEC 61131-3.' },
      { termo: 'CASE', definicao: 'Estrutura que escolhe um trecho de código conforme o valor de uma variável.' },
      { termo: 'IEC 61131-3', definicao: 'Norma internacional que define as linguagens de programação de CLP.' },
    ],
  },

  'documentar-programa-de-clp': {
    resumo: [
      'Nome de tag que diz o que o sinal é e onde está.',
      'Comentário que explica o porquê da lógica.',
      'Estrutura de projeto que se navega sem guia.',
      'Uma folha de entrega que acompanha a máquina.',
    ],
    secoes: [
      { dicas: [
        'Mostre uma tabela com tags ruins e as mesmas tags bem nomeadas.',
        'Proponha um padrão: equipamento, função, tipo de sinal.',
        'Explique como alinhar o nome da tag com a identificação do diagrama elétrico.',
      ] },
      { dicas: [
        'Dê exemplos de comentário que só repete a lógica e de comentário que explica a razão.',
        'Explique onde comentar: início de bloco, linha com condição não óbvia, valores fixos.',
        'Conte o caso de um tempo ou valor mágico sem explicação.',
      ] },
      { dicas: [
        'Mostre com uma árvore a estrutura por área ou função da máquina.',
        'Explique onde ficam alarmes, comunicação e lógica de máquina.',
        'Fale de manter a mesma estrutura entre projetos da empresa.',
      ] },
      { dicas: [
        'Liste o que entra na folha: versão do programa, mapa de entradas e saídas, senhas de acesso guardadas com o cliente, contato.',
        'Mostre um checklist de entrega da documentação.',
        'Explique onde a folha fica: no painel e com o responsável do cliente.',
      ] },
    ],
    armadilhas: [
      'Tag com nome genérico ou só endereço',
      'Comentário desatualizado depois de uma alteração',
      'Mapa de entradas e saídas diferente do painel',
    ],
    quiz: [
      { pergunta: 'O que um bom comentário explica?', certa: 'Por que a lógica foi feita assim', erradas: ['O que cada contato faz, linha a linha', 'O nome do programador'] },
      { pergunta: 'Com o que o nome de tag deve estar alinhado?', certa: 'A identificação do diagrama elétrico', erradas: ['O modelo do CLP', 'A data da instalação'] },
      { pergunta: 'Qual item não pode faltar na folha de entrega?', certa: 'A versão do programa instalado', erradas: ['O tempo de varredura médio', 'A lista de softwares do notebook'] },
    ],
    termos: [
      { termo: 'Tag', definicao: 'Nome simbólico dado a uma variável ou sinal no programa.' },
      { termo: 'Mapa de entradas e saídas', definicao: 'Lista que relaciona cada ponto do CLP ao sinal e ao componente de campo.' },
      { termo: 'Valor mágico', definicao: 'Número fixo no programa sem nome nem comentário que explique de onde veio.' },
    ],
  },

  'backup-e-versao-de-programa-de-clp': {
    resumo: [
      'Guardar o programa num lugar combinado e com nome padronizado.',
      'Comparar a versão da máquina com o arquivo antes de alterar.',
      'Registrar cada alteração em uma linha.',
    ],
    secoes: [
      { dicas: [
        'Mostre com uma árvore a estrutura de pastas por cliente, máquina e data.',
        'Proponha um padrão de nome com máquina, data e versão.',
        'Explique por que guardar em mais de um lugar, e não só no notebook.',
      ] },
      { dicas: [
        'Liste os passos: conectar, ler o programa do CLP, comparar com o arquivo guardado.',
        'Explique a função de comparação dos softwares de programação e o que ela mostra.',
        'Conte o risco de carregar um arquivo antigo por cima de uma alteração feita em campo.',
      ] },
      { dicas: [
        'Mostre um modelo de linha: data, quem, o que mudou, por quê.',
        'Explique onde o registro fica: junto do arquivo ou no próprio projeto.',
        'Conte como o registro ajuda o próximo técnico a entender a máquina.',
      ] },
    ],
    armadilhas: [
      'Backup só no notebook do técnico',
      'Carregar o arquivo sem comparar com o CLP',
      'Nome de arquivo como final ou final2',
      'Programa sem comentários lido de volta do CLP',
    ],
    quiz: [
      { pergunta: 'O que fazer antes de alterar o programa de uma máquina?', certa: 'Ler o programa do CLP e comparar com o arquivo', erradas: ['Carregar o último arquivo do notebook', 'Apagar a memória do CLP'] },
      { pergunta: 'Por que o nome do arquivo deve ter data e versão?', certa: 'Para saber qual é o mais recente sem abrir', erradas: ['Para o software aceitar o arquivo', 'Para reduzir o tamanho do arquivo'] },
      { pergunta: 'O que o registro de alteração deve dizer?', certa: 'Data, autor, o que mudou e por quê', erradas: ['Só o nome do arquivo novo', 'Só o modelo do CLP'] },
    ],
    termos: [
      { termo: 'Backup', definicao: 'Cópia de segurança do programa guardada fora do CLP.' },
      { termo: 'Upload do CLP', definicao: 'Leitura do programa que está no CLP para o computador.' },
      { termo: 'Registro de alteração', definicao: 'Anotação curta de cada mudança feita no programa, com data e autor.' },
    ],
  },
};
