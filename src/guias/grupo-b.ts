/** Guias das trilhas Redes, Acionamentos e Instrumentação — roteiro editorial do Instituto (ver ./tipos.ts). */
import type { Guia } from './tipos';

export const GUIAS_B: Record<string, Guia> = {
  /* ---------------- Modbus de ponta a ponta */
  'modbus-em-dez-minutos': {
    resumo: [
      'Numa rede Modbus, só o mestre pergunta; o escravo apenas responde.',
      'Os dados ficam em quatro áreas: coils, discrete inputs, input e holding registers.',
      'Meia dúzia de códigos de função resolve quase todo o trabalho do dia a dia.',
      'RTU e TCP carregam o mesmo protocolo em meios físicos diferentes.',
    ],
    secoes: [
      { dicas: [
        'Explique o ciclo pergunta e resposta com um exemplo real: o CLP pedindo a temperatura a um controlador.',
        'Conte por que dois escravos nunca falam ao mesmo tempo numa rede RTU.',
        'Mencione os nomes atuais, cliente e servidor, sem abandonar mestre e escravo, que ainda são os do chão de fábrica.',
      ] },
      { dicas: [
        'Monte uma tabela com as quatro áreas: tipo de dado, se é leitura ou escrita, e um exemplo de cada.',
        'Explique a diferença entre bit (coil, discrete input) e registrador de 16 bits.',
        'Mostre por que um holding register serve tanto para ler quanto para escrever um setpoint.',
      ] },
      { dicas: [
        'Liste as funções 01, 02, 03, 04, 05, 06 e 16 com o que cada uma faz.',
        'Conte qual delas você mais usa na prática e por quê.',
        'Avise que nem todo equipamento implementa todas as funções, e onde o manual diz quais aceita.',
      ] },
      { dicas: [
        'Explique que RTU vai pela serial, normalmente RS-485, e TCP vai pela Ethernet.',
        'Mostre o que muda no quadro: CRC no RTU, cabeçalho MBAP no TCP.',
        'Conte quando faz sentido um e quando faz sentido o outro na mesma planta.',
      ] },
    ],
    armadilhas: [
      'Confundir input register com holding register',
      'Achar que o escravo pode mandar dado sem ser perguntado',
      'Usar função de escrita onde só a leitura é aceita',
    ],
    quiz: [
      { pergunta: 'Numa rede Modbus RTU, quem inicia a comunicação?', certa: 'Sempre o mestre', erradas: ['Qualquer escravo com dado novo', 'O escravo de menor endereço'] },
      { pergunta: 'Qual área guarda registradores de 16 bits que podem ser lidos e escritos?', certa: 'Holding registers', erradas: ['Input registers', 'Discrete inputs'] },
      { pergunta: 'Qual código de função lê holding registers?', certa: 'Função 03', erradas: ['Função 05', 'Função 02'] },
    ],
    termos: [
      { termo: 'Registrador', definicao: 'Posição de memória de 16 bits no equipamento, acessada pelo endereço dela no mapa Modbus.' },
      { termo: 'Coil', definicao: 'Um bit que pode ser lido e escrito, normalmente ligado a uma saída ou a um comando liga e desliga.' },
      { termo: 'Código de função', definicao: 'Número no início da mensagem que diz ao escravo o que fazer: ler, escrever, qual área.' },
    ],
  },

  'rs-485-sem-misterio': {
    resumo: [
      'RS-485 pede par trançado blindado e um só caminho, em barramento.',
      'Terminação e polarização existem para o sinal chegar limpo nas pontas.',
      'Todos os equipamentos da rede precisam da mesma velocidade e paridade.',
      'Cada escravo precisa de um endereço único.',
    ],
    secoes: [
      { dicas: [
        'Explique por que o par trançado cancela ruído e por que o sinal é diferencial.',
        'Mostre com uma foto um cabo adequado e um cabo de rede ou de comando improvisado.',
        'Conte onde ligar a blindagem e por que não aterrar nas duas pontas sem critério.',
        'Lembre do fio de referência comum, que muita instalação esquece.',
      ] },
      { dicas: [
        'Desenhe o barramento: um cabo que entra e sai de cada equipamento, sem ramais longos.',
        'Explique o que acontece com o sinal numa ligação em estrela.',
        'Conte como resolver quando o layout da planta pede estrela: repetidor ou hub RS-485.',
      ] },
      { dicas: [
        'Explique que o resistor de terminação, tipicamente de 120 ohms, vai só nas duas pontas do barramento.',
        'Mostre o que é a polarização e por que a rede em repouso precisa de um estado definido.',
        'Conte como descobrir se o equipamento já tem terminação e polarização internas por chave ou jumper.',
      ] },
      { dicas: [
        'Explique que baud rate, paridade e bits de parada precisam ser iguais em todos os nós.',
        'Mostre como anotar o ID de cada escravo antes de energizar a rede.',
        'Conte o sintoma de dois equipamentos com o mesmo ID.',
      ] },
    ],
    armadilhas: [
      'Terminação em todos os equipamentos, não só nas pontas',
      'Fios A e B invertidos',
      'Ligação em estrela com ramais longos',
      'Dois escravos com o mesmo endereço',
    ],
    quiz: [
      { pergunta: 'Onde vai o resistor de terminação num barramento RS-485?', certa: 'Nas duas pontas do barramento', erradas: ['Em cada equipamento da rede', 'Só junto ao mestre'] },
      { pergunta: 'Qual topologia o RS-485 pede?', certa: 'Barramento, um nó após o outro', erradas: ['Estrela, com o mestre no centro', 'Anel, fechando no mestre'] },
      { pergunta: 'O que acontece se um escravo estiver com paridade diferente?', certa: 'Ele não entende as mensagens', erradas: ['Ele responde mais devagar', 'Ele assume a paridade do mestre'] },
    ],
    termos: [
      { termo: 'Sinal diferencial', definicao: 'O dado é a diferença de tensão entre dois fios, o que torna o sinal mais imune a ruído.' },
      { termo: 'Terminação', definicao: 'Resistor nas pontas do cabo que evita que o sinal reflita e volte embaralhado.' },
      { termo: 'Polarização', definicao: 'Resistores que mantêm a linha num estado conhecido quando ninguém está transmitindo.' },
    ],
  },

  'lendo-o-mapa-de-memoria-do-manual': {
    resumo: [
      'O endereço do manual pode começar em 0 ou em 1, e isso muda a leitura.',
      'Muitos valores vêm multiplicados por 10 ou 100 e precisam de escala.',
      'Valores de 32 bits ocupam dois registradores, numa ordem que varia.',
      'Uma tabela de pontos própria evita refazer a pesquisa no manual.',
    ],
    secoes: [
      { dicas: [
        'Mostre um trecho de manual com endereço 40001 e explique a convenção de prefixo.',
        'Explique a diferença entre endereço de protocolo e número do registrador.',
        'Conte como descobrir, com um teste, se o seu software soma ou não um ao endereço.',
      ] },
      { dicas: [
        'Mostre um registrador que devolve 253 e o manual dizendo que a resolução é 0,1.',
        'Explique onde o manual costuma indicar a escala: coluna de unidade, resolução ou fator.',
        'Conte como tratar valor negativo em registrador com sinal.',
      ] },
      { dicas: [
        'Explique por que um float ou um inteiro de 32 bits ocupa dois registradores.',
        'Mostre a mesma leitura dando número absurdo e número certo só trocando a ordem das palavras.',
        'Conte como descobrir a ordem certa quando o manual não diz.',
      ] },
      { dicas: [
        'Mostre o modelo da sua tabela: nome, endereço, função, tipo, escala, unidade.',
        'Explique por que conferir cada ponto com o display do equipamento antes de fechar a tabela.',
        'Sugira onde guardar a tabela para o próximo técnico achar.',
      ] },
    ],
    armadilhas: [
      'Ler o registrador vizinho por causa do deslocamento de um',
      'Esquecer a escala e mostrar 253 °C',
      'Ordem das palavras invertida em valor de 32 bits',
      'Tratar registrador com sinal como sem sinal',
    ],
    quiz: [
      { pergunta: 'O registrador devolve 253 e a resolução é 0,1. Qual é o valor?', certa: '25,3', erradas: ['2,53', '2530'] },
      { pergunta: 'Quantos registradores Modbus ocupa um valor de 32 bits?', certa: 'Dois registradores', erradas: ['Um registrador', 'Quatro registradores'] },
      { pergunta: 'A leitura de 32 bits dá um número absurdo. O que testar primeiro?', certa: 'Inverter a ordem das palavras', erradas: ['Trocar o baud rate', 'Mudar o ID do escravo'] },
    ],
    termos: [
      { termo: 'Mapa de memória', definicao: 'Tabela do manual que lista cada registrador, o endereço, o tipo de dado e o que ele representa.' },
      { termo: 'Escala', definicao: 'Fator que converte o número inteiro lido no valor de engenharia, como dividir por 10.' },
      { termo: 'Word swap', definicao: 'Troca da ordem dos dois registradores de 16 bits que formam um valor de 32 bits.' },
    ],
  },

  'modbus-tcp-do-ip-ao-primeiro-valor': {
    resumo: [
      'Para ler por Modbus TCP você precisa do IP, da porta 502 e do unit ID.',
      'Um cliente Modbus gratuito confirma a comunicação antes de qualquer programa.',
      'O valor lido só vale depois de conferido com o display do equipamento.',
      'Escrever é mudar a máquina: teste com cuidado e com autorização.',
    ],
    secoes: [
      { dicas: [
        'Explique como pôr o computador na mesma faixa de IP do equipamento.',
        'Conte que 502 é a porta padrão e que alguns equipamentos permitem mudar.',
        'Explique quando o unit ID importa, como atrás de um gateway para serial.',
        'Mostre como testar a conexão básica com ping antes de abrir o cliente Modbus.',
      ] },
      { dicas: [
        'Indique um ou dois clientes gratuitos que você usa e onde baixar.',
        'Mostre com prints a tela de conexão preenchida.',
        'Avise para baixar de fonte confiável e não instalar no computador da produção sem autorização.',
      ] },
      { dicas: [
        'Mostre a leitura de um registrador conhecido, como uma temperatura ou uma tensão.',
        'Compare o valor lido com o display e explique a escala aplicada.',
        'Conte o que fazer quando o valor não bate: endereço, função ou ordem de bytes.',
      ] },
      { dicas: [
        'Explique por que escrever num registrador pode ligar, parar ou mudar a máquina.',
        'Mostre como escolher um registrador inofensivo para o primeiro teste de escrita.',
        'Conte quem precisa estar ciente antes de escrever num equipamento em produção.',
      ] },
    ],
    armadilhas: [
      'Computador em outra faixa de IP',
      'Firewall do computador bloqueando a conexão',
      'Escrever no registrador errado com a máquina em operação',
    ],
    quiz: [
      { pergunta: 'Qual é a porta padrão do Modbus TCP?', certa: 'Porta 502', erradas: ['Porta 80', 'Porta 102'] },
      { pergunta: 'Por que testar com um cliente gratuito antes de programar?', certa: 'Para confirmar que a comunicação funciona', erradas: ['Para gravar o programa no equipamento', 'Para aumentar a velocidade da rede'] },
      { pergunta: 'Como validar um valor lido pela rede?', certa: 'Comparando com o display do equipamento', erradas: ['Lendo o mesmo registrador duas vezes', 'Conferindo o tempo de resposta'] },
    ],
    termos: [
      { termo: 'Unit ID', definicao: 'Número que identifica o escravo dentro da mensagem Modbus TCP, essencial atrás de gateways.' },
      { termo: 'Cliente Modbus', definicao: 'Programa ou equipamento que faz as perguntas na rede, o papel do antigo mestre.' },
      { termo: 'Máscara de sub-rede', definicao: 'Configuração que define quais IPs estão na mesma rede local e se enxergam diretamente.' },
    ],
  },

  'diagnostico-modbus-leitura-zero-ou-errada': {
    resumo: [
      'Sem resposta quase sempre é físico, ID ou configuração de porta.',
      'Resposta de exceção é o equipamento dizendo o que não gostou.',
      'Valor errado costuma ser endereço, escala ou ordem de bytes.',
      'Falha intermitente aponta para ruído, tempo de espera ou colisão.',
    ],
    secoes: [
      { dicas: [
        'Monte o roteiro na ordem: cabo, alimentação, A e B, terminação, ID, baud rate e paridade.',
        'Explique como o LED de TX e RX do conversor ajuda a separar mestre calado de escravo calado.',
        'Conte como isolar um escravo da rede para testar sozinho.',
      ] },
      { dicas: [
        'Monte uma tabela com os códigos de exceção 01, 02, 03 e 04 e o que cada um diz.',
        'Explique que exceção é boa notícia: a comunicação física funciona.',
        'Mostre como aparece uma exceção no cliente Modbus que você usa.',
      ] },
      { dicas: [
        'Mostre como testar o deslocamento de um no endereço.',
        'Explique como a escala faltando engana: o número parece certo, só que dez vezes maior.',
        'Conte como identificar ordem de bytes errada num valor de 32 bits.',
      ] },
      { dicas: [
        'Explique como o ruído de um inversor próximo derruba a comunicação.',
        'Conte como ajustar o tempo de espera e o intervalo entre perguntas.',
        'Explique o que é colisão e por que dois mestres na mesma rede serial não funcionam.',
      ] },
    ],
    armadilhas: [
      'Trocar equipamento antes de conferir o cabo',
      'Tempo de espera curto demais para equipamento lento',
      'Dois mestres na mesma rede serial',
      'Cabo de comunicação no mesmo eletroduto da potência',
    ],
    quiz: [
      { pergunta: 'O que indica a exceção 02 no Modbus?', certa: 'Endereço de dado inválido', erradas: ['Função não suportada', 'Falha no equipamento'] },
      { pergunta: 'Se o escravo responde com exceção, o que já se sabe?', certa: 'A comunicação física funciona', erradas: ['O cabo está com defeito', 'O ID está duplicado'] },
      { pergunta: 'A leitura falha só às vezes. Qual a causa mais provável?', certa: 'Ruído ou tempo de espera curto', erradas: ['Endereço errado no mapa', 'Função de leitura errada'] },
    ],
    termos: [
      { termo: 'Exceção', definicao: 'Resposta do escravo avisando que recebeu a mensagem mas não pode atendê-la, com um código do motivo.' },
      { termo: 'Timeout', definicao: 'Tempo máximo que o mestre espera pela resposta antes de considerar a pergunta perdida.' },
      { termo: 'CRC', definicao: 'Código de verificação no fim da mensagem RTU que detecta se algum bit chegou corrompido.' },
    ],
  },

  /* ---------------- Protocolos lado a lado */
  'profinet-ethernet-ip-modbus-tcp': {
    resumo: [
      'Os três usam Ethernet, mas organizam a troca de dados de formas diferentes.',
      'Tempo real e determinismo são o que separa uma rede de controle de uma de leitura.',
      'A escolha costuma vir do fabricante do CLP que a planta já usa.',
    ],
    secoes: [
      { dicas: [
        'Monte uma tabela comparando modelo de troca, configuração e ferramentas de cada um.',
        'Explique que Modbus TCP é pergunta e resposta, enquanto Profinet e EtherNet/IP trocam dados ciclicamente.',
        'Conte o papel do arquivo de descrição do equipamento, GSDML no Profinet e EDS no EtherNet/IP.',
      ] },
      { dicas: [
        'Explique a diferença entre ser rápido e ser determinístico, com um exemplo de máquina.',
        'Conte quando o tempo de ciclo importa, como em eixos sincronizados, e quando não importa.',
        'Evite números de desempenho sem fonte; se citar, diga de qual equipamento veio.',
      ] },
      { dicas: [
        'Conte, pela sua experiência, onde você encontra cada protocolo nas plantas brasileiras.',
        'Explique a ligação entre o fabricante do CLP e o protocolo que domina a planta.',
        'Mostre quando faz sentido manter dois protocolos convivendo.',
      ] },
    ],
    armadilhas: [
      'Achar que Ethernet igual é rede igual',
      'Misturar rede de controle com a rede administrativa',
      'Escolher protocolo sem olhar o que o CLP suporta',
    ],
    quiz: [
      { pergunta: 'Como o Modbus TCP troca dados?', certa: 'Por pergunta e resposta', erradas: ['Por troca cíclica configurada', 'Por difusão para todos os nós'] },
      { pergunta: 'Qual arquivo descreve um equipamento Profinet?', certa: 'O arquivo GSDML', erradas: ['O arquivo EDS', 'O arquivo CSV'] },
      { pergunta: 'O que significa uma rede ser determinística?', certa: 'O tempo de entrega é previsível', erradas: ['Ela nunca perde pacote', 'Ela usa o cabo mais rápido'] },
    ],
    termos: [
      { termo: 'Determinismo', definicao: 'Garantia de que o dado chega dentro de um tempo conhecido, ciclo após ciclo.' },
      { termo: 'Troca cíclica', definicao: 'Envio automático de dados em intervalos fixos, sem que alguém precise perguntar a cada vez.' },
      { termo: 'Arquivo de descrição', definicao: 'Arquivo do fabricante que ensina a ferramenta do CLP quais dados e parâmetros o equipamento tem.' },
    ],
  },

  'canopen-para-quem-vem-do-modbus': {
    resumo: [
      'No CAN, qualquer nó pode transmitir e a prioridade decide quem fala.',
      'O dicionário de objetos faz o papel do mapa de registradores.',
      'PDO leva dado de processo rápido; SDO lê e escreve parâmetros.',
      'CANopen aparece muito em drives, servos e máquinas móveis.',
    ],
    secoes: [
      { dicas: [
        'Explique como a arbitragem por identificador resolve quem transmite sem colisão destrutiva.',
        'Compare com o Modbus, onde o escravo só fala quando perguntado.',
        'Conte o papel do mestre NMT, que gerencia estados, mas não pergunta cada dado.',
      ] },
      { dicas: [
        'Explique índice e subíndice comparando com endereço de registrador.',
        'Monte uma tabela lado a lado: registrador Modbus e objeto CANopen.',
        'Mencione o arquivo EDS, que descreve o dicionário do equipamento.',
      ] },
      { dicas: [
        'Explique o PDO como dado de processo enviado sem pedido, e o SDO como acesso confirmado.',
        'Dê um exemplo: velocidade real por PDO, rampa de aceleração por SDO.',
        'Conte o que é o mapeamento de PDO e por que ele precisa ser configurado.',
      ] },
      { dicas: [
        'Liste as aplicações onde você encontra CANopen.',
        'Explique o que são os perfis de dispositivo e por que eles padronizam drives de marcas diferentes.',
        'Conte cuidados de instalação: terminação e velocidade igual em todos os nós.',
      ] },
    ],
    armadilhas: [
      'Esquecer a terminação nas pontas do barramento CAN',
      'Node ID duplicado',
      'PDO sem mapeamento configurado',
    ],
    quiz: [
      { pergunta: 'No CAN, como se resolve quem transmite quando dois nós falam juntos?', certa: 'Pela prioridade do identificador', erradas: ['Pelo mestre, que pergunta um a um', 'Pelo nó de menor distância'] },
      { pergunta: 'Qual serviço CANopen é usado para ler e escrever parâmetros?', certa: 'SDO', erradas: ['PDO', 'Heartbeat'] },
      { pergunta: 'O que faz o papel do mapa de registradores no CANopen?', certa: 'O dicionário de objetos', erradas: ['A tabela de PDOs', 'O arquivo de rede do CLP'] },
    ],
    termos: [
      { termo: 'Dicionário de objetos', definicao: 'Lista de todos os dados e parâmetros do equipamento, cada um num índice e subíndice.' },
      { termo: 'PDO', definicao: 'Mensagem de dado de processo, enviada de forma cíclica ou por evento, sem confirmação.' },
      { termo: 'SDO', definicao: 'Acesso confirmado a qualquer objeto do dicionário, usado para configurar parâmetros.' },
    ],
  },

  'opc-ua-o-que-e-e-quando-vale': {
    resumo: [
      'OPC UA entrega o dado com nome, tipo e unidade, não só um número.',
      'Autenticação e criptografia fazem parte do padrão.',
      'Ele pede mais recurso e configuração do que um Modbus.',
      'Vale quando vários sistemas precisam entender o mesmo dado.',
    ],
    secoes: [
      { dicas: [
        'Compare a leitura de um registrador 40001 com a leitura de um nó chamado Temperatura em °C.',
        'Explique o espaço de endereços em árvore e como navegar por ele num cliente.',
        'Mostre um exemplo de leitura com um trecho de código ou a tela de um cliente gratuito.',
      ] },
      { dicas: [
        'Explique certificados, modos de segurança e usuário e senha em linguagem simples.',
        'Conte por que desligar a segurança para fazer funcionar é o erro mais comum.',
        'Mostre o passo de confiar no certificado entre cliente e servidor.',
      ] },
      { dicas: [
        'Liste o que o OPC UA custa: licença, processamento, curva de aprendizado.',
        'Conte um caso em que Modbus resolveu melhor e mais barato.',
        'Explique quando o OPC UA compensa: integração com MES, nuvem ou vários fornecedores.',
      ] },
    ],
    armadilhas: [
      'Rodar em produção com a segurança desligada',
      'Certificado expirado derrubando a conexão',
      'Usar OPC UA onde um Modbus simples bastava',
    ],
    quiz: [
      { pergunta: 'O que o OPC UA entrega além do valor?', certa: 'Nome, tipo e unidade do dado', erradas: ['Só o endereço do registrador', 'O programa do CLP inteiro'] },
      { pergunta: 'Como o OPC UA trata a segurança?', certa: 'Ela faz parte do próprio padrão', erradas: ['Depende de uma VPN obrigatória', 'Ele não tem segurança própria'] },
      { pergunta: 'Quando o Modbus ainda costuma ser a melhor escolha?', certa: 'Em leitura simples de poucos pontos', erradas: ['Em integração com vários sistemas', 'Quando o dado precisa de contexto'] },
    ],
    termos: [
      { termo: 'Modelo de informação', definicao: 'A forma como o servidor organiza os dados em objetos com nome, tipo e relação entre si.' },
      { termo: 'Nó', definicao: 'Cada item do espaço de endereços do OPC UA: uma variável, um objeto ou um método.' },
      { termo: 'Certificado', definicao: 'Arquivo que identifica cliente e servidor e permite a conexão cifrada entre eles.' },
    ],
  },

  'conversor-rs485-para-modbus-tcp': {
    resumo: [
      'Um conversor serial para Ethernet põe equipamento antigo na rede.',
      'O programa do equipamento não precisa ser alterado.',
      'A configuração do conversor precisa espelhar a porta serial do equipamento.',
      'O primeiro equipamento vira modelo para os próximos.',
    ],
    secoes: [
      { dicas: [
        'Conte qual era o equipamento, o que ele fazia e por que precisava ir para a rede.',
        'Explique o que era feito antes: leitura manual, anotação, planilha.',
        'Conte por que trocar o equipamento não era opção.',
      ] },
      { dicas: [
        'Explique o critério de escolha do conversor: modo gateway Modbus, isolação, alimentação, trilho DIN.',
        'Mostre com prints a configuração da porta serial e do IP.',
        'Explique a diferença entre modo gateway Modbus e modo transparente.',
      ] },
      { dicas: [
        'Mostre a tela do cliente Modbus com o primeiro valor lido.',
        'Conte o que deu errado antes de funcionar e como resolveu.',
        'Compare o valor lido com o display do equipamento.',
      ] },
      { dicas: [
        'Liste o que ficou documentado: IP, ID, tabela de pontos, foto da instalação.',
        'Conte quanto tempo levou e quanto levaria o segundo equipamento.',
        'Diga o que faria diferente da próxima vez.',
      ] },
    ],
    armadilhas: [
      'Conversor em modo transparente quando se esperava gateway',
      'Unit ID do TCP diferente do ID do escravo serial',
      'Terminação esquecida no lado RS-485',
    ],
    quiz: [
      { pergunta: 'O que o conversor RS-485 para Modbus TCP evita?', certa: 'Trocar ou reprogramar o equipamento', erradas: ['Configurar o IP da rede', 'Usar cabo de rede na planta'] },
      { pergunta: 'O que precisa bater entre o conversor e o equipamento serial?', certa: 'Baud rate, paridade e bits de parada', erradas: ['O IP e a máscara de rede', 'A versão de firmware dos dois'] },
      { pergunta: 'No modo gateway, o que identifica o escravo serial?', certa: 'O unit ID da mensagem TCP', erradas: ['A porta TCP usada', 'O endereço MAC do conversor'] },
    ],
    termos: [
      { termo: 'Gateway Modbus', definicao: 'Equipamento que recebe Modbus TCP na Ethernet e repassa como Modbus RTU na serial.' },
      { termo: 'Modo transparente', definicao: 'O conversor só repassa os bytes da serial pela rede, sem traduzir o protocolo.' },
      { termo: 'Isolação galvânica', definicao: 'Separação elétrica entre os lados do conversor, que protege contra surtos e laços de terra.' },
    ],
  },

  /* ---------------- Inversor na prática */
  'como-um-inversor-controla-a-velocidade': {
    resumo: [
      'A velocidade do motor de indução acompanha a frequência da alimentação.',
      'O inversor retifica a rede, filtra no barramento CC e gera nova frequência.',
      'O controle V/f é simples; o vetorial segura melhor o torque.',
      'Em baixa frequência o motor perde torque e ventilação.',
    ],
    secoes: [
      { dicas: [
        'Mostre a fórmula da velocidade síncrona: 120 vezes a frequência dividido pelo número de polos.',
        'Faça a conta para um motor de 4 polos a 60 Hz e explique o escorregamento.',
        'Explique por que mudar a frequência muda a velocidade.',
      ] },
      { dicas: [
        'Desenhe os três blocos: retificador, barramento CC com capacitores e ponte de IGBTs.',
        'Explique o PWM sem matemática: pulsos que o motor enxerga como senoide.',
        'Avise que os capacitores seguem carregados depois de desligar.',
      ] },
      { dicas: [
        'Explique por que o V/f mantém a proporção entre tensão e frequência.',
        'Conte o que o controle vetorial faz de diferente e quando vale a pena.',
        'Dê exemplos: ventilador e bomba no V/f, esteira com carga pesada no vetorial.',
      ] },
      { dicas: [
        'Explique a perda de torque em baixa frequência e o papel do reforço de torque.',
        'Conte por que o motor autoventilado esquenta rodando devagar por muito tempo.',
        'Diga quando considerar ventilação forçada.',
      ] },
    ],
    armadilhas: [
      'Mexer no inversor logo após desligar, com o barramento carregado',
      'Motor autoventilado rodando horas em baixa rotação',
      'Usar V/f em aplicação que precisa de torque em baixa velocidade',
    ],
    quiz: [
      { pergunta: 'Qual a velocidade síncrona de um motor de 4 polos a 60 Hz?', certa: '1800 rpm', erradas: ['3600 rpm', '1200 rpm'] },
      { pergunta: 'O que fica entre o retificador e a ponte de saída do inversor?', certa: 'O barramento CC com capacitores', erradas: ['Um transformador abaixador', 'Um contator de partida'] },
      { pergunta: 'Por que o motor esquenta em baixa rotação por muito tempo?', certa: 'A ventoinha do eixo gira devagar', erradas: ['A frequência da rede aumenta', 'O inversor dobra a tensão'] },
    ],
    termos: [
      { termo: 'Velocidade síncrona', definicao: 'Velocidade do campo girante do motor, definida pela frequência e pelo número de polos.' },
      { termo: 'Escorregamento', definicao: 'Diferença entre a velocidade síncrona e a velocidade real do eixo do motor de indução.' },
      { termo: 'PWM', definicao: 'Modulação que liga e desliga a tensão muito rápido para formar, em média, uma onda senoidal.' },
    ],
  },

  'os-dez-parametros-de-toda-partida': {
    resumo: [
      'Os dados de placa do motor são os primeiros parâmetros a entrar.',
      'Rampas curtas demais disparam falha; longas demais atrapalham o processo.',
      'É preciso dizer ao inversor de onde vêm o comando e a velocidade.',
      'Limites e proteções evitam que o motor ou a máquina se danifiquem.',
    ],
    secoes: [
      { dicas: [
        'Mostre uma foto de placa de motor e indique tensão, corrente, frequência, rotação e potência.',
        'Explique por que a corrente nominal da placa é a base da proteção térmica.',
        'Conte o que é o autoajuste e quando rodar.',
      ] },
      { dicas: [
        'Explique o que é a rampa de aceleração e a de desaceleração, em segundos.',
        'Conte o que acontece com uma desaceleração curta demais numa carga de alta inércia.',
        'Mencione o resistor de frenagem como saída para parar rápido.',
      ] },
      { dicas: [
        'Explique a diferença entre fonte do comando, partir e parar, e fonte da referência, velocidade.',
        'Liste as opções comuns: teclado, borne, entrada analógica, rede.',
        'Mostre como mudar de local para remoto sem surpresa.',
      ] },
      { dicas: [
        'Liste frequência mínima e máxima, limite de corrente e sobrecarga do motor.',
        'Explique o que cada proteção evita.',
        'Mostre uma tabela de referência genérica, lembrando que o código do parâmetro muda por marca.',
      ] },
    ],
    armadilhas: [
      'Deixar a corrente do motor no valor de fábrica',
      'Desaceleração curta demais disparando sobretensão',
      'Frequência máxima acima do que a máquina aguenta',
    ],
    quiz: [
      { pergunta: 'Qual dado da placa do motor protege contra sobrecarga?', certa: 'A corrente nominal', erradas: ['A rotação nominal', 'O fator de serviço'] },
      { pergunta: 'Desaceleração curta demais em carga pesada costuma causar qual falha?', certa: 'Sobretensão no barramento CC', erradas: ['Subtensão na entrada', 'Falha de comunicação'] },
      { pergunta: 'O que define a fonte da referência?', certa: 'De onde vem o valor da velocidade', erradas: ['De onde vem o comando de partir', 'Qual é a tensão da rede'] },
    ],
    termos: [
      { termo: 'Rampa', definicao: 'Tempo que o inversor leva para ir de zero à frequência máxima, ou de volta a zero.' },
      { termo: 'Referência', definicao: 'O valor de velocidade que o inversor deve seguir, vindo do teclado, de um borne ou da rede.' },
      { termo: 'Resistor de frenagem', definicao: 'Resistor que dissipa a energia devolvida pelo motor ao frear, evitando sobretensão.' },
    ],
  },

  'configurar-um-inversor-em-vinte-minutos': {
    resumo: [
      'Conhecer a aplicação antes de mexer no inversor encurta a configuração.',
      'Restaurar o padrão de fábrica parte de um estado conhecido.',
      'Cada parâmetro alterado fica registrado com a foto do display.',
      'O primeiro giro é feito em baixa velocidade e com a parada testada.',
    ],
    secoes: [
      { dicas: [
        'Diga o modelo do inversor, o motor e o que a máquina faz.',
        'Mostre a foto do inversor instalado no painel e da placa do motor.',
        'Conte como o motor será comandado: teclado, bornes ou rede.',
      ] },
      { dicas: [
        'Mostre, tela a tela, como entrar no menu de parâmetros.',
        'Explique como restaurar o padrão de fábrica e quando isso não é recomendado.',
        'Avise para anotar a parametrização existente antes de restaurar.',
      ] },
      { dicas: [
        'Mostre a foto do display em cada parâmetro alterado, com o valor escolhido.',
        'Explique em uma frase por que cada valor foi escolhido.',
        'Monte ao final a lista resumida de tudo que foi alterado.',
      ] },
      { dicas: [
        'Descreva o primeiro giro em baixa frequência, conferindo o sentido de rotação.',
        'Mostre o teste da parada normal e da emergência.',
        'Conte o que observar na primeira hora: corrente, temperatura, ruído.',
      ] },
    ],
    armadilhas: [
      'Restaurar o padrão de fábrica sem guardar a configuração antiga',
      'Motor girando no sentido errado no primeiro teste',
      'Emergência que não passa pela entrada de segurança',
    ],
    quiz: [
      { pergunta: 'Por que restaurar o padrão de fábrica antes de configurar?', certa: 'Para partir de um estado conhecido', erradas: ['Para atualizar o firmware', 'Para liberar mais parâmetros'] },
      { pergunta: 'O que fazer antes de restaurar o padrão num inversor em uso?', certa: 'Anotar os parâmetros existentes', erradas: ['Trocar o motor da máquina', 'Desligar o disjuntor geral'] },
      { pergunta: 'Como fazer o primeiro giro do motor?', certa: 'Em baixa velocidade, conferindo o sentido', erradas: ['Na velocidade máxima, com carga', 'Com as rampas zeradas'] },
    ],
    termos: [
      { termo: 'Padrão de fábrica', definicao: 'Conjunto de valores com que o inversor sai do fabricante, recuperável por um parâmetro.' },
      { termo: 'Modo local e remoto', definicao: 'Chave lógica que define se o inversor obedece ao teclado ou aos bornes e à rede.' },
      { termo: 'Sentido de rotação', definicao: 'Direção em que o eixo gira, invertida pelo inversor ou pela troca de duas fases do motor.' },
    ],
  },

  'comandar-o-inversor-pela-rede': {
    resumo: [
      'Pela rede, o comando vai numa palavra de controle e o estado volta noutra.',
      'A velocidade vai num registrador, com escala definida pelo fabricante.',
      'O inversor precisa saber o que fazer quando a comunicação cai.',
      'Todo teste de comando pela rede começa com a máquina em vazio.',
    ],
    secoes: [
      { dicas: [
        'Explique a palavra de controle bit a bit: habilitar, partir, sentido, resetar falha.',
        'Mostre a palavra de status: pronto, girando, em falha, na velocidade.',
        'Monte uma tabela com os bits, lembrando que o significado muda por marca e perfil.',
      ] },
      { dicas: [
        'Explique como a referência é escrita: em Hz, em rpm ou em porcentagem da máxima.',
        'Mostre a conta da escala com o valor do manual.',
        'Conte como configurar o inversor para aceitar referência pela rede.',
      ] },
      { dicas: [
        'Explique o parâmetro de tempo de falha de comunicação.',
        'Liste as reações possíveis: parar por rampa, parar por inércia, manter a velocidade.',
        'Conte qual escolher conforme o risco da máquina.',
      ] },
      { dicas: [
        'Descreva o teste com o motor desacoplado ou a máquina sem produto.',
        'Mostre a sequência: habilitar, partir, mudar velocidade, parar, derrubar o cabo.',
        'Explique por que a emergência nunca depende da rede.',
      ] },
    ],
    armadilhas: [
      'Emergência dependendo só da rede',
      'Falha de comunicação configurada para manter a velocidade',
      'Escala da referência errada acelerando o motor além do previsto',
    ],
    quiz: [
      { pergunta: 'Onde vai o comando de partir o inversor pela rede?', certa: 'Na palavra de controle', erradas: ['Na palavra de status', 'No registrador de corrente'] },
      { pergunta: 'O que a palavra de status informa?', certa: 'O estado atual do inversor', erradas: ['A velocidade desejada', 'O endereço do inversor'] },
      { pergunta: 'Por que a emergência não deve depender da rede?', certa: 'A rede pode cair na hora errada', erradas: ['A rede é lenta para comandos', 'O inversor ignora comandos de parada'] },
    ],
    termos: [
      { termo: 'Palavra de controle', definicao: 'Registrador em que cada bit é um comando para o inversor, como habilitar ou partir.' },
      { termo: 'Palavra de status', definicao: 'Registrador em que cada bit mostra o estado do inversor, como pronto ou em falha.' },
      { termo: 'Watchdog de comunicação', definicao: 'Tempo que o inversor espera sem mensagem antes de considerar a rede perdida e reagir.' },
    ],
  },

  'backup-de-parametros-do-inversor': {
    resumo: [
      'A parametrização mora no inversor e vai embora com ele se não houver cópia.',
      'Dá para copiar pelo teclado, pelo software do fabricante ou pela rede.',
      'Comparar dois inversores parâmetro a parâmetro mostra o que mudou.',
      'Backup sem nome claro e lugar fixo é backup perdido.',
    ],
    secoes: [
      { dicas: [
        'Conte um caso de inversor queimado em que ninguém sabia a configuração.',
        'Explique quanto tempo de máquina parada isso custa.',
        'Mostre por que o padrão de fábrica do inversor novo quase nunca serve.',
      ] },
      { dicas: [
        'Explique a cópia pelo teclado removível ou memória, quando o modelo tem.',
        'Mostre a cópia pelo software do fabricante, com prints.',
        'Conte quando dá para ler os parâmetros pela rede e guardar no supervisório.',
      ] },
      { dicas: [
        'Mostre a função de comparação do software, se houver, ou uma planilha simples.',
        'Explique como achar o parâmetro que alguém mudou sem registrar.',
        'Conte o cuidado com versão de firmware diferente entre os dois.',
      ] },
      { dicas: [
        'Sugira um padrão de nome: máquina, tag do inversor, data.',
        'Explique onde guardar: servidor, pasta da manutenção, cópia fora da planta.',
        'Conte como manter atualizado quando alguém muda um parâmetro.',
      ] },
    ],
    armadilhas: [
      'Backup feito uma vez e nunca atualizado',
      'Arquivo salvo só no notebook de um técnico',
      'Restaurar em inversor com firmware diferente sem conferir',
    ],
    quiz: [
      { pergunta: 'Por que a configuração se perde quando o inversor queima?', certa: 'Ela fica gravada no próprio inversor', erradas: ['O motor apaga os parâmetros', 'A rede sobrescreve os valores'] },
      { pergunta: 'Qual o cuidado ao restaurar em outro inversor?', certa: 'Conferir modelo e versão de firmware', erradas: ['Trocar o cabo do motor', 'Aumentar as rampas em dobro'] },
      { pergunta: 'O que torna um backup realmente útil?', certa: 'Nome claro, lugar fixo e atualização', erradas: ['Ser feito só na instalação', 'Ficar no notebook do técnico'] },
    ],
    termos: [
      { termo: 'Parametrização', definicao: 'O conjunto de valores configurados no inversor para aquela máquina e aquele motor.' },
      { termo: 'Firmware', definicao: 'O programa interno do inversor, cuja versão pode mudar a lista e o significado dos parâmetros.' },
      { termo: 'Upload e download', definicao: 'Ler os parâmetros do inversor para o computador e gravar do computador para o inversor.' },
    ],
  },

  'servo-passo-ou-inversor': {
    resumo: [
      'Inversor controla bem a velocidade; servo controla posição com precisão.',
      'O motor de passo posiciona barato, mas pode perder passo sem avisar.',
      'Malha fechada corrige o erro; malha aberta confia que obedeceu.',
      'O custo certo inclui instalação, ajuste e parada de máquina.',
    ],
    secoes: [
      { dicas: [
        'Monte uma tabela: velocidade, posição, torque em baixa rotação e dinâmica de cada um.',
        'Dê um exemplo de aplicação típica para cada: bomba, eixo de corte, dosador.',
        'Explique onde as fronteiras se misturam, como inversor com encoder.',
      ] },
      { dicas: [
        'Explique malha aberta e malha fechada com o exemplo do motor de passo.',
        'Conte o que acontece quando o passo perde posição por sobrecarga.',
        'Mostre como o encoder do servo fecha a malha.',
      ] },
      { dicas: [
        'Liste o que entra no custo total: acionamento, motor, cabos, ajuste, manutenção.',
        'Conte um caso em que a opção mais barata saiu mais cara.',
        'Explique quando o servo se paga pela produtividade.',
      ] },
    ],
    armadilhas: [
      'Motor de passo perdendo posição sem ninguém perceber',
      'Servo comprado para um trabalho que o inversor fazia',
      'Comparar só o preço do equipamento',
    ],
    quiz: [
      { pergunta: 'Qual acionamento controla posição com realimentação?', certa: 'O servoacionamento', erradas: ['O inversor em V/f', 'O motor de passo comum'] },
      { pergunta: 'Qual o risco típico do motor de passo em malha aberta?', certa: 'Perder passo sem avisar', erradas: ['Girar acima da velocidade', 'Consumir corrente zero'] },
      { pergunta: 'Para uma bomba com velocidade variável, qual a escolha usual?', certa: 'Inversor de frequência', erradas: ['Servo com encoder absoluto', 'Motor de passo'] },
    ],
    termos: [
      { termo: 'Malha fechada', definicao: 'Controle que mede o resultado, compara com o pedido e corrige a diferença.' },
      { termo: 'Malha aberta', definicao: 'Controle que manda o comando e confia que foi cumprido, sem medir o resultado.' },
      { termo: 'Perda de passo', definicao: 'Quando o motor de passo deixa de acompanhar os pulsos e a posição real diverge da esperada.' },
    ],
  },

  'formas-de-partida-de-motor': {
    resumo: [
      'Na partida direta o motor puxa várias vezes a corrente nominal.',
      'Estrela-triângulo reduz a corrente, mas também o torque de partida.',
      'Soft-starter suaviza a partida; o inversor controla também a velocidade.',
      'A escolha depende da carga, da rede e do custo.',
    ],
    secoes: [
      { dicas: [
        'Explique por que o motor parado se comporta quase como um curto na partida.',
        'Conte o que a corrente alta faz: queda de tensão, luz piscando, disjuntor desarmando.',
        'Cite que a concessionária pode limitar a partida direta acima de certa potência, sem inventar o valor.',
      ] },
      { dicas: [
        'Mostre o esquema de cada forma: direta, estrela-triângulo, soft-starter e inversor.',
        'Explique por que a estrela-triângulo reduz a corrente e o torque a cerca de um terço.',
        'Conte o requisito do motor para estrela-triângulo: seis terminais e tensão certa em triângulo.',
        'Explique a diferença entre soft-starter, que só atua na partida e parada, e inversor.',
      ] },
      { dicas: [
        'Monte uma tabela comparando corrente, torque, custo e controle de velocidade.',
        'Dê um exemplo de carga para cada linha da tabela.',
        'Explique quando o inversor compensa mesmo sem precisar variar velocidade.',
      ] },
    ],
    armadilhas: [
      'Estrela-triângulo em carga que precisa de torque alto na partida',
      'Tempo de comutação estrela para triângulo mal ajustado',
      'Soft-starter usado como se variasse velocidade',
    ],
    quiz: [
      { pergunta: 'Quanto a estrela-triângulo reduz a corrente de partida?', certa: 'A cerca de um terço', erradas: ['À metade exata', 'A um décimo'] },
      { pergunta: 'O que a soft-starter não faz?', certa: 'Variar a velocidade em regime', erradas: ['Suavizar a partida', 'Reduzir o pico de corrente'] },
      { pergunta: 'Qual o efeito da corrente alta de partida na instalação?', certa: 'Queda de tensão na rede', erradas: ['Aumento da frequência', 'Redução da potência do motor'] },
    ],
    termos: [
      { termo: 'Corrente de partida', definicao: 'Pico de corrente que o motor consome ao sair do repouso, bem acima da nominal.' },
      { termo: 'Soft-starter', definicao: 'Chave eletrônica que eleva a tensão aos poucos para suavizar a partida e a parada do motor.' },
      { termo: 'Torque de partida', definicao: 'Força de giro que o motor entrega no instante em que sai do repouso.' },
    ],
  },

  'ajuste-de-ganho-de-servo': {
    resumo: [
      'A relação de inércia entre carga e motor define o quanto o ajuste é difícil.',
      'O autoajuste resolve boa parte dos casos, mas não todos.',
      'O ajuste manual segue uma ordem: velocidade, posição, filtros.',
      'O gráfico de erro de seguimento mostra se o ajuste melhorou.',
    ],
    secoes: [
      { dicas: [
        'Explique a relação de inércia entre carga e rotor em linguagem simples.',
        'Conte como a redução mecânica muda a inércia vista pelo motor.',
        'Mostre como o drive estima ou pede a inércia.',
      ] },
      { dicas: [
        'Explique o que o autoajuste faz: movimenta o eixo e mede a resposta.',
        'Conte quando ele falha: folga mecânica, correia elástica, carga que muda.',
        'Avise sobre o curso livre e a segurança durante o autoajuste.',
      ] },
      { dicas: [
        'Descreva os três passos: ganho da malha de velocidade, ganho da malha de posição, filtros.',
        'Explique como subir o ganho até vibrar e recuar com margem.',
        'Conte como usar o filtro de ressonância quando há vibração em frequência fixa.',
      ] },
      { dicas: [
        'Mostre um gráfico de erro de seguimento antes e depois do ajuste.',
        'Explique o que é sobressinal e tempo de acomodação no gráfico.',
        'Conte qual ferramenta do drive você usa para capturar o gráfico.',
      ] },
    ],
    armadilhas: [
      'Culpar o ganho quando o problema é folga mecânica',
      'Autoajuste com o eixo sem curso livre',
      'Ganho alto demais que vibra só com a carga',
    ],
    quiz: [
      { pergunta: 'O que o erro de seguimento mede?', certa: 'A diferença entre posição pedida e real', erradas: ['A corrente máxima do motor', 'A temperatura do drive'] },
      { pergunta: 'Qual malha costuma ser ajustada primeiro?', certa: 'A malha de velocidade', erradas: ['A malha de posição', 'A malha de temperatura'] },
      { pergunta: 'Quando o autoajuste costuma falhar?', certa: 'Com folga ou elasticidade mecânica', erradas: ['Com motor de baixa inércia', 'Com cabo de encoder blindado'] },
    ],
    termos: [
      { termo: 'Relação de inércia', definicao: 'Quantas vezes a inércia da carga, vista no eixo do motor, é maior que a do próprio rotor.' },
      { termo: 'Erro de seguimento', definicao: 'Diferença, a cada instante, entre a posição que o controle pediu e a que o eixo está.' },
      { termo: 'Ressonância mecânica', definicao: 'Vibração que aparece numa frequência própria da mecânica e é amplificada pelo controle.' },
    ],
  },

  /* ---------------- Sensores do chão */
  'indutivo-capacitivo-ou-optico': {
    resumo: [
      'Indutivo detecta metal; capacitivo detecta quase qualquer material; óptico usa luz.',
      'A distância sensora do catálogo vale para um alvo padrão de aço.',
      'Outros metais pedem um fator de correção que reduz a distância.',
      'Sujeira, luz ambiente e metal próximo mudam a escolha.',
    ],
    secoes: [
      { dicas: [
        'Explique o princípio de cada um sem eletrônica: campo magnético, campo elétrico, feixe de luz.',
        'Monte uma tabela com material detectado, distância típica e aplicação.',
        'Mostre com fotos os três tipos instalados.',
        'Explique as variantes do óptico: barreira, difuso e retrorreflexivo.',
      ] },
      { dicas: [
        'Explique que a distância sensora nominal é medida com alvo padrão de aço.',
        'Mostre como o fator de correção reduz a distância para alumínio, latão e cobre.',
        'Conte por que trabalhar com folga abaixo da distância nominal.',
      ] },
      { dicas: [
        'Conte como poeira e respingo afetam o óptico e o capacitivo.',
        'Explique a diferença entre sensor faceado e não faceado ao embutir em metal.',
        'Mostre o ajuste de sensibilidade do capacitivo e cuidados com umidade.',
      ] },
    ],
    armadilhas: [
      'Usar a distância nominal do catálogo para alvo de alumínio',
      'Sensor não faceado embutido em suporte metálico',
      'Capacitivo disparando com umidade ou acúmulo de produto',
      'Óptico difuso cegado por superfície brilhante',
    ],
    quiz: [
      { pergunta: 'Qual sensor detecta apenas metais?', certa: 'O indutivo', erradas: ['O capacitivo', 'O óptico difuso'] },
      { pergunta: 'Para qual alvo vale a distância sensora nominal?', certa: 'Alvo padrão de aço', erradas: ['Qualquer metal', 'Alvo de plástico'] },
      { pergunta: 'Qual sensor serve para ver nível de grão num silo pela parede?', certa: 'O capacitivo', erradas: ['O indutivo', 'O óptico de barreira'] },
    ],
    termos: [
      { termo: 'Distância sensora', definicao: 'Distância em que o sensor detecta o alvo padrão, informada no catálogo.' },
      { termo: 'Fator de correção', definicao: 'Multiplicador que reduz a distância sensora quando o alvo é de outro material que não o aço.' },
      { termo: 'Sensor faceado', definicao: 'Sensor que pode ser embutido rente ao metal sem detectar o próprio suporte.' },
    ],
  },

  'encoder-incremental-e-absoluto': {
    resumo: [
      'O incremental gera pulsos nos canais A e B, e o Z marca uma volta.',
      'A defasagem entre A e B mostra o sentido de giro.',
      'O absoluto informa a posição mesmo depois de faltar energia.',
      'Cabo blindado e sinal diferencial evitam pulsos perdidos.',
    ],
    secoes: [
      { dicas: [
        'Desenhe os sinais A e B defasados de 90 graus e o pulso Z.',
        'Explique como a ordem de A e B indica o sentido.',
        'Conte para que serve o Z: referência de zero.',
      ] },
      { dicas: [
        'Explique a resolução em pulsos por volta.',
        'Mostre a conta: pulsos contados, pulsos por volta, mecânica, e a posição em milímetros.',
        'Explique a contagem em quadratura, que multiplica a resolução por quatro.',
      ] },
      { dicas: [
        'Explique por que o incremental precisa de referenciamento ao ligar.',
        'Diferencie o absoluto monovolta do multivolta.',
        'Cite as interfaces comuns, como SSI e redes industriais, sem entrar em detalhes de marca.',
      ] },
      { dicas: [
        'Explique a saída diferencial e a saída push-pull ou coletor aberto.',
        'Conte como a entrada rápida do CLP limita a frequência de pulsos.',
        'Mostre os cuidados de cabo: blindagem, trajeto separado da potência.',
      ] },
    ],
    armadilhas: [
      'Frequência de pulsos acima do que a entrada do CLP lê',
      'Cabo de encoder junto com cabo de motor',
      'Máquina que perde a referência a cada queda de energia',
    ],
    quiz: [
      { pergunta: 'Como o encoder incremental indica o sentido de giro?', certa: 'Pela defasagem entre A e B', erradas: ['Pela largura do pulso Z', 'Pela tensão do canal A'] },
      { pergunta: 'Qual encoder mantém a posição após falta de energia?', certa: 'O absoluto', erradas: ['O incremental', 'O incremental com canal Z'] },
      { pergunta: 'Na contagem em quadratura, a resolução fica multiplicada por quanto?', certa: 'Por quatro', erradas: ['Por dois', 'Por oito'] },
    ],
    termos: [
      { termo: 'Pulsos por volta', definicao: 'Quantos pulsos o encoder gera em cada volta completa do eixo; define a resolução.' },
      { termo: 'Quadratura', definicao: 'Dois sinais defasados de 90 graus, cujas bordas permitem contar e saber o sentido.' },
      { termo: 'Multivolta', definicao: 'Encoder absoluto que conta também o número de voltas, além da posição dentro de cada volta.' },
    ],
  },

  'termopar-pt100-ou-termistor': {
    resumo: [
      'O termopar gera tensão; o PT100 e o termistor mudam de resistência.',
      'O PT100 a 3 ou 4 fios compensa a resistência do cabo.',
      'Termopar alcança temperaturas mais altas; PT100 tende a ser mais preciso.',
      'Termistor é barato e sensível, mas numa faixa estreita.',
    ],
    secoes: [
      { dicas: [
        'Explique o efeito termoelétrico do termopar e a junta fria.',
        'Explique que o PT100 tem 100 ohms a 0 °C e sobe com a temperatura.',
        'Diferencie termistor NTC e PTC.',
      ] },
      { dicas: [
        'Mostre as três ligações com desenho.',
        'Explique por que a 2 fios o cabo soma erro à leitura.',
        'Conte quando a 4 fios se justifica.',
      ] },
      { dicas: [
        'Monte uma tabela com faixa, precisão, custo e aplicação típica de cada um.',
        'Cite faixas de forma genérica e indique a norma ou o catálogo como fonte.',
        'Dê exemplos reais: forno, câmara fria, motor.',
      ] },
    ],
    armadilhas: [
      'Termopar emendado com fio comum em vez de cabo de compensação',
      'PT100 ligado a 2 fios em cabo longo',
      'Tipo de termopar configurado errado no transmissor',
    ],
    quiz: [
      { pergunta: 'Qual a resistência de um PT100 a 0 °C?', certa: '100 ohms', erradas: ['1000 ohms', '10 ohms'] },
      { pergunta: 'Por que ligar o PT100 a 3 fios?', certa: 'Para compensar a resistência do cabo', erradas: ['Para dobrar a faixa de medida', 'Para dispensar o transmissor'] },
      { pergunta: 'Qual sensor gera uma pequena tensão com a temperatura?', certa: 'O termopar', erradas: ['O PT100', 'O termistor NTC'] },
    ],
    termos: [
      { termo: 'Junta fria', definicao: 'Ponto onde o termopar se liga ao instrumento, cuja temperatura precisa ser compensada.' },
      { termo: 'Cabo de compensação', definicao: 'Cabo próprio para estender o termopar sem criar novas juntas que distorcem a leitura.' },
      { termo: 'NTC', definicao: 'Termistor cuja resistência cai quando a temperatura sobe.' },
    ],
  },

  'calibracao-quando-e-como': {
    resumo: [
      'Calibrar é comparar com um padrão; ajustar é corrigir o instrumento.',
      'A periodicidade sai do risco e do histórico, não de um prazo fixo.',
      'O certificado precisa mostrar rastreabilidade, incerteza e resultado.',
    ],
    secoes: [
      { dicas: [
        'Explique a diferença entre calibração, ajuste e verificação com um exemplo de manômetro.',
        'Conte por que calibrar não muda o instrumento.',
        'Mostre quando o ajuste pede uma nova calibração depois.',
      ] },
      { dicas: [
        'Explique como classificar os instrumentos por impacto em qualidade, segurança e processo.',
        'Conte como o histórico de desvios encurta ou alonga o intervalo.',
        'Monte uma tabela simples de instrumentos, criticidade e intervalo.',
      ] },
      { dicas: [
        'Liste o que conferir: identificação, padrão usado, rastreabilidade, incerteza, pontos medidos.',
        'Explique a diferença entre laboratório acreditado e não acreditado.',
        'Mostre como comparar o erro encontrado com a tolerância do processo.',
        'Monte um checklist de recebimento do certificado.',
      ] },
    ],
    armadilhas: [
      'Arquivar o certificado sem ler o resultado',
      'Intervalo de calibração igual para todos os instrumentos',
      'Confundir ajuste com calibração',
    ],
    quiz: [
      { pergunta: 'O que é calibrar um instrumento?', certa: 'Comparar suas leituras com um padrão', erradas: ['Corrigir o erro do instrumento', 'Trocar o instrumento por um novo'] },
      { pergunta: 'O que deve definir a periodicidade de calibração?', certa: 'O risco e o histórico do instrumento', erradas: ['Sempre um ano para todos', 'A data da compra do instrumento'] },
      { pergunta: 'O que garante a rastreabilidade no certificado?', certa: 'A ligação do padrão a referências oficiais', erradas: ['A assinatura do operador', 'O número de série do instrumento'] },
    ],
    termos: [
      { termo: 'Rastreabilidade', definicao: 'Cadeia de calibrações que liga o padrão usado até uma referência nacional ou internacional.' },
      { termo: 'Incerteza de medição', definicao: 'Faixa de dúvida associada ao resultado, informada no certificado de calibração.' },
      { termo: 'Laboratório acreditado', definicao: 'Laboratório com competência reconhecida formalmente para aquele tipo de calibração.' },
    ],
  },

  'sinal-analogico-com-ruido': {
    resumo: [
      'Ruído entra por acoplamento com cabos de potência e laços de terra.',
      'A blindagem aterrada de um lado só evita corrente circulando nela.',
      'Separar sinal de potência resolve mais do que qualquer filtro.',
      'O filtro no CLP esconde o sintoma e atrasa a leitura.',
    ],
    secoes: [
      { dicas: [
        'Explique acoplamento capacitivo e indutivo com o exemplo do cabo do motor ao lado.',
        'Explique o laço de terra quando há dois pontos de aterramento em potenciais diferentes.',
        'Mostre uma tendência de leitura pulando e o que ela sugere.',
      ] },
      { dicas: [
        'Explique por que aterrar a blindagem nas duas pontas pode criar corrente nela.',
        'Diga em qual ponta aterrar e por quê, lembrando das exceções que o fabricante indicar.',
        'Mostre com uma foto a blindagem bem terminada no painel.',
      ] },
      { dicas: [
        'Explique a separação física: eletrocalhas distintas, cruzamentos em ângulo reto.',
        'Conte por que o sinal em corrente, 4 a 20 mA, sofre menos que o sinal em tensão.',
        'Mostre o antes e depois de uma instalação corrigida.',
      ] },
      { dicas: [
        'Explique o filtro digital ou a média móvel no CLP.',
        'Conte o custo: resposta mais lenta e defeito real escondido.',
        'Diga quando o filtro é aceitável, depois de resolver a causa física.',
      ] },
    ],
    armadilhas: [
      'Blindagem aterrada nas duas pontas criando laço de terra',
      'Cabo de sinal na mesma eletrocalha do cabo de motor',
      'Filtro pesado no CLP escondendo o problema real',
      'Blindagem cortada rente e sem ligação no painel',
    ],
    quiz: [
      { pergunta: 'Por que aterrar a blindagem de um lado só?', certa: 'Para evitar corrente circulando nela', erradas: ['Para aumentar o sinal medido', 'Para dispensar o cabo trançado'] },
      { pergunta: 'Qual sinal analógico é mais imune a ruído em cabo longo?', certa: 'Corrente de 4 a 20 mA', erradas: ['Tensão de 0 a 10 V', 'Tensão de 0 a 5 V'] },
      { pergunta: 'Qual o custo de um filtro forte no CLP?', certa: 'Leitura mais lenta e defeito escondido', erradas: ['Mais consumo de energia', 'Perda da calibração do sensor'] },
    ],
    termos: [
      { termo: 'Laço de terra', definicao: 'Circuito formado quando dois pontos de terra com potenciais diferentes fazem corrente circular no cabo.' },
      { termo: 'Blindagem', definicao: 'Malha ou fita metálica em volta dos condutores que intercepta o ruído e o leva para a terra.' },
      { termo: 'Acoplamento', definicao: 'Transferência indesejada de energia de um cabo para outro próximo, por campo elétrico ou magnético.' },
    ],
  },
};
