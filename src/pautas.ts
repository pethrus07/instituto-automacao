/**
 * O PLANO EDITORIAL — as pautas que o Instituto quer ver escritas.
 *
 * Reunião de 24/09/2026. O sócio convidou gente para escrever, e todos
 * toparam — e travaram: "dar para eles um negócio de pensar num tema, o cara
 * fica meio travado, começa a girar mil temas na cabeça dele". A saída que ele
 * propôs, e que este arquivo é:
 *
 *   · o Instituto decide PARA ONDE vai, em trilhas (predial, rede, CLP…);
 *   · cada trilha desmembra em séries com começo, meio e fim — de 3, de 5,
 *     de 10 — "e o cara fala: eu vou participar de um negócio que é cinco
 *     tópicos, e se eu gostar eu pego o próximo";
 *   · e há o artigo AVULSO, para quem quer zero compromisso;
 *   · cada pauta já vem com o descritivo — o objetivo, o que cobrir, os
 *     blocos que costumam servir — "50% do caminho andado", para o texto
 *     caber em 20 a 30 minutos de quem sabe o assunto.
 *
 * O autor abre a pauta em /escrever, clica em "Escrever esta pauta" e o
 * editor já nasce com o esqueleto montado a partir daqui.
 *
 * ⚠️ Isto é dado editorial, versionado no git como o resto do conteúdo. A
 * pauta que já foi publicada não se marca à mão: o artigo diz `pauta: slug` no
 * frontmatter e o site deriva o estado (ver `estadoDaPauta`). Só a RESERVA —
 * alguém disse "essa é minha" — se escreve aqui, em `reservada`.
 *
 * O catálogo inicial (66 pautas) foi proposto em 27/09/2026 para o Pedro e o
 * sócio cortarem, trocarem e completarem. Não é lista fechada: pauta nova é
 * uma entrada a mais neste arquivo.
 */
import type { TipoBloco } from './ui/markdown';

export type Nivel = 'iniciante' | 'intermediario' | 'avancado';
export type FormatoArtigo = 'guia' | 'conceito' | 'experiencia';

/** O que o editor pode sugerir: os blocos do dialeto e os recursos de linha (tabela, código, imagem). */
export type Sugestao = TipoBloco | 'tabela' | 'codigo' | 'terminal' | 'imagem';

export type Trilha = { slug: string; titulo: string; descricao: string };

export type Serie = {
  slug: string;
  trilha: string;
  titulo: string;
  /** o compromisso, dito com todas as letras: 3, 5 ou 10 artigos */
  partes: 3 | 5 | 10;
  descricao: string;
};

export type Pauta = {
  slug: string;
  trilha: string;
  /** ausente = avulsa */
  serie?: string;
  /** a posição na série, a partir de 1 */
  parte?: number;
  titulo: string;
  formato: FormatoArtigo;
  nivel: Nivel;
  /** uma frase: o que o leitor sai sabendo fazer ou entender */
  objetivo: string;
  /** o esqueleto — cada item vira um subtítulo no editor */
  cobrir: string[];
  /** os blocos que costumam servir aqui; o editor os traz prontos para preencher */
  blocos: Sugestao[];
  /** quem já pegou a pauta, se alguém pegou */
  reservada?: string;
};

export const ROTULO_NIVEL: Record<Nivel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export const ROTULO_FORMATO_ARTIGO: Record<FormatoArtigo, string> = {
  guia: 'Guia passo a passo',
  conceito: 'Conceito',
  experiencia: 'O que eu fiz',
};

export const EXPLICA_FORMATO_ARTIGO: Record<FormatoArtigo, string> = {
  guia: 'Como se faz: o leitor segue e chega num resultado. Passos, fotos do que aparece na tela, armadilhas.',
  conceito: 'Como funciona: o leitor entende o porquê. Comparações, uma fórmula, uma curiosidade.',
  experiencia: 'Um caso seu: o problema, o que você tentou, o que deu certo. Antes e depois, com números se houver.',
};

/* ------------------------------------------------------------- trilhas */

export const TRILHAS: readonly Trilha[] = [
  { slug: 'clp', titulo: 'CLP e programação', descricao: 'Do primeiro contato ao programa que outra pessoa consegue manter.' },
  { slug: 'redes-industriais', titulo: 'Redes e protocolos industriais', descricao: 'Modbus, RS-485, Profinet, CANopen, OPC UA — como as máquinas conversam.' },
  { slug: 'acionamentos', titulo: 'Inversores, servos e motores', descricao: 'Fazer o motor girar certo: partida, parametrização, comando pela rede.' },
  { slug: 'instrumentacao', titulo: 'Sensores e instrumentação', descricao: 'Medir direito: escolher, ligar, calibrar e confiar no sinal.' },
  { slug: 'ihm-dados', titulo: 'IHM, supervisório e dados', descricao: 'Da máquina à tela do operador e ao celular do gestor.' },
  { slug: 'predial', titulo: 'Automação predial e residencial', descricao: 'Iluminação, clima, acesso e integração em prédio e casa.' },
  { slug: 'rede-ti', titulo: 'Rede e TI para automação', descricao: 'Cabo, IP, switch e segurança — a parte de TI que quem monta painel precisa.' },
  { slug: 'seguranca', titulo: 'Segurança de máquinas e elétrica', descricao: 'NR-10, NR-12 e o que protege gente antes de proteger máquina.' },
  { slug: 'robotica', titulo: 'Robótica e visão', descricao: 'Robô industrial, cobot e câmera na célula de produção.' },
  { slug: 'negocio', titulo: 'Carreira e negócio', descricao: 'Orçar, propor, vender e crescer trabalhando com automação.' },
];

/* ------------------------------------------------------------- séries */

export const SERIES: readonly Serie[] = [
  { slug: 'clp-do-zero', trilha: 'clp', titulo: 'CLP do zero', partes: 10, descricao: 'Do relé ao PID: a série inteira de quem nunca programou até quem entrega a máquina testada.' },
  { slug: 'modbus-de-ponta-a-ponta', trilha: 'redes-industriais', titulo: 'Modbus de ponta a ponta', partes: 5, descricao: 'O protocolo mais usado da indústria, do cabo ao valor na tela — e o que fazer quando a leitura não vem.' },
  { slug: 'protocolos-lado-a-lado', trilha: 'redes-industriais', titulo: 'Protocolos lado a lado', partes: 3, descricao: 'Quando cada rede faz sentido, para quem já sabe Modbus.' },
  { slug: 'inversor-na-pratica', trilha: 'acionamentos', titulo: 'Inversor de frequência na prática', partes: 5, descricao: 'Do conceito ao backup de parâmetros: o inversor que você configura, comanda pela rede e troca sem perder nada.' },
  { slug: 'sensores-do-chao', trilha: 'instrumentacao', titulo: 'Sensores do chão de fábrica', partes: 3, descricao: 'Os três sensores que mais aparecem, e como escolher cada um.' },
  { slug: 'da-maquina-ao-celular', trilha: 'ihm-dados', titulo: 'Da máquina ao celular', partes: 5, descricao: 'A tela do operador, o alarme que serve e o painel do líder que acompanha seis máquinas de uma vez.' },
  { slug: 'predial-do-1-ao-5', trilha: 'predial', titulo: 'Automação predial do 1 ao 5', partes: 5, descricao: 'O prédio inteiro, uma camada por artigo.' },
  { slug: 'rede-para-automacao', trilha: 'rede-ti', titulo: 'Rede para automação', partes: 5, descricao: 'Do cabo à VLAN: a rede da máquina feita por quem entende de máquina.' },
  { slug: 'seguranca-antes-de-ligar', trilha: 'seguranca', titulo: 'Segurança antes de ligar', partes: 3, descricao: 'Norma, dispositivo e procedimento — nessa ordem.' },
  { slug: 'primeiro-robo', trilha: 'robotica', titulo: 'O primeiro robô na célula', partes: 3, descricao: 'Escolher, integrar e dar olhos ao robô.' },
  { slug: 'automacao-como-negocio', trilha: 'negocio', titulo: 'Automação como negócio', partes: 3, descricao: 'O orçamento que não dá prejuízo, a proposta que o cliente entende e o retrofit que se vende sozinho.' },
];

/* ------------------------------------------------------------- pautas */

const GUIA: Sugestao[] = ['resumo', 'aprender', 'roteiro', 'passos', 'imagem', 'armadilhas', 'quiz'];
const CONCEITO: Sugestao[] = ['resumo', 'aprender', 'tabela', 'curiosidade', 'quiz'];
const EXPERIENCIA: Sugestao[] = ['resumo', 'antesdepois', 'armadilhas', 'notadoautor', 'quiz'];

export const PAUTAS: readonly Pauta[] = [
  /* ---------------- CLP do zero (10) */
  {
    slug: 'o-que-um-clp-faz-que-um-rele-nao-faz', trilha: 'clp', serie: 'clp-do-zero', parte: 1,
    titulo: 'O que um CLP faz que um relé não faz', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Entender por que a lógica saiu do painel de relés e foi para o programa — e quando o relé ainda é a resposta certa.',
    cobrir: ['A mesma partida feita com relés e com CLP', 'Ciclo de varredura: ler entradas, executar, escrever saídas', 'O que se ganha: mudar sem refiar, diagnosticar, registrar', 'Quando um relé ainda basta'],
    blocos: ['resumo', 'aprender', 'proscontras', 'curiosidade', 'quiz'],
  },
  {
    slug: 'entradas-e-saidas-digitais-sem-queimar-nada', trilha: 'clp', serie: 'clp-do-zero', parte: 2,
    titulo: 'Entradas e saídas digitais: ligar sensor e bobina sem queimar nada', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Ligar um sensor PNP ou NPN numa entrada e uma bobina numa saída, sabendo o que é o comum e por que ele importa.',
    cobrir: ['PNP e NPN: qual sinal cada um entrega', 'O borne comum da entrada e da saída', 'Saída a relé × saída a transistor', 'Testar com o multímetro antes de energizar'],
    blocos: ['resumo', 'aprender', 'tabela', 'imagem', 'perigo', 'armadilhas', 'quiz'],
  },
  {
    slug: 'ladder-do-zero-selo-e-intertravamento', trilha: 'clp', serie: 'clp-do-zero', parte: 3,
    titulo: 'Ladder do zero: selo, intertravamento e partida direta', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Escrever a primeira lógica em Ladder que liga, mantém e desliga um motor com segurança.',
    cobrir: ['Contato aberto, fechado e bobina', 'O selo (autorretenção) linha por linha', 'Intertravamento entre dois sentidos de giro', 'Simular antes de carregar na máquina'],
    blocos: ['resumo', 'aprender', 'imagem', 'passos', 'dica', 'armadilhas', 'quiz'],
  },
  {
    slug: 'temporizadores-e-contadores-na-pratica', trilha: 'clp', serie: 'clp-do-zero', parte: 4,
    titulo: 'Temporizadores e contadores na prática', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Usar TON, TOF e contador para resolver tempo e contagem sem gambiarra.',
    cobrir: ['TON e TOF: a diferença pelo gráfico de tempo', 'Contador crescente e o reset', 'Um exemplo real: esteira que conta caixas', 'Base de tempo e o erro que ela esconde'],
    blocos: ['resumo', 'aprender', 'tabela', 'passos', 'atencao', 'quiz'],
  },
  {
    slug: 'entrada-analogica-4-20-ma', trilha: 'clp', serie: 'clp-do-zero', parte: 5,
    titulo: 'Entrada analógica 4–20 mA: da corrente ao valor de engenharia', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Converter a leitura crua do cartão analógico no valor em °C, bar ou metros — e saber quando o sensor está com defeito.',
    cobrir: ['Por que 4 e não 0 mA', 'A escala: do valor bruto do cartão à unidade de engenharia', 'Detectar fio rompido (abaixo de 4 mA)', 'Filtro simples para leitura que oscila'],
    blocos: ['resumo', 'aprender', 'formula', 'codigo', 'dica', 'armadilhas', 'quiz'],
  },
  {
    slug: 'comparadores-e-matematica-no-clp', trilha: 'clp', serie: 'clp-do-zero', parte: 6,
    titulo: 'Comparadores e matemática no CLP: receita e escala', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Usar comparação e conta para montar uma receita de produção que o operador troca na IHM.',
    cobrir: ['Tipos de dado: inteiro, real e o estouro', 'Comparar faixas sem cair no limite errado', 'Receita: um conjunto de valores escolhido pelo operador', 'Arredondamento e unidade'],
    blocos: ['resumo', 'aprender', 'tabela', 'codigo', 'armadilhas', 'quiz'],
  },
  {
    slug: 'sub-rotinas-e-blocos-de-funcao', trilha: 'clp', serie: 'clp-do-zero', parte: 7,
    titulo: 'Sub-rotinas e blocos de função: parar de repetir código', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Transformar a lógica de um motor num bloco reutilizável e usar o mesmo bloco em dez motores.',
    cobrir: ['O problema do copiar e colar', 'Entradas, saídas e memória do bloco', 'Instâncias: um bloco, vários motores', 'Organizar o projeto em pastas'],
    blocos: ['resumo', 'aprender', 'arvore', 'codigo', 'dica', 'quiz'],
  },
  {
    slug: 'sequenciamento-com-etapas-grafcet', trilha: 'clp', serie: 'clp-do-zero', parte: 8,
    titulo: 'Sequenciamento com etapas: pensar a máquina em Grafcet', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Desenhar a sequência da máquina em etapas e transições antes de escrever uma linha de programa.',
    cobrir: ['Etapa, transição e ação', 'Do desenho para o programa', 'Parada no meio do ciclo e retomada', 'Por que sequência em Ladder solto vira espaguete'],
    blocos: ['resumo', 'aprender', 'roteiro', 'imagem', 'proscontras', 'quiz'],
  },
  {
    slug: 'controle-pid-sintonia-na-pratica', trilha: 'clp', serie: 'clp-do-zero', parte: 9,
    titulo: 'Controle PID na prática: sintonia sem fórmula mágica', formato: 'guia', nivel: 'avancado',
    objetivo: 'Sintonizar uma malha de temperatura ou pressão com método, sabendo o que cada termo faz.',
    cobrir: ['P, I e D pelo efeito na curva', 'Um método de sintonia em campo', 'Saturação e anti-windup', 'Quando o problema não é o PID, é o processo'],
    blocos: ['resumo', 'aprender', 'formula', 'imagem', 'armadilhas', 'quiz'],
  },
  {
    slug: 'do-simulador-a-maquina', trilha: 'clp', serie: 'clp-do-zero', parte: 10,
    titulo: 'Do simulador à máquina: testar o programa antes de ligar', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Montar um roteiro de teste que pega o erro no escritório e não no cliente.',
    cobrir: ['Simular entradas e forçar saídas com critério', 'Lista de teste por função da máquina', 'Teste de campo sem carga, depois com carga', 'Registrar o que foi testado'],
    blocos: ['resumo', 'aprender', 'passos', 'checklist', 'perigo', 'quiz'],
  },
  /* ---------------- CLP avulsas */
  {
    slug: 'texto-estruturado-para-quem-sabe-ladder', trilha: 'clp',
    titulo: 'Texto estruturado (ST) para quem só sabe Ladder', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Ler e escrever lógica em ST traduzindo o que já se sabe fazer em Ladder.',
    cobrir: ['A mesma lógica nas duas linguagens', 'IF, CASE e laço sem travar a varredura', 'Quando ST é melhor e quando Ladder é melhor'],
    blocos: ['resumo', 'codigo', 'proscontras', 'atencao', 'quiz'],
  },
  {
    slug: 'documentar-programa-de-clp', trilha: 'clp',
    titulo: 'Como documentar um programa de CLP que outra pessoa consiga manter', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Deixar tag, comentário e estrutura de pastas num padrão que o técnico da madrugada entende.',
    cobrir: ['Nome de tag que diz o que é', 'Comentário que explica o porquê, não o quê', 'Estrutura do projeto', 'A folha que vai junto com a máquina'],
    blocos: ['resumo', 'arvore', 'tabela', 'checklist', 'quiz'],
  },
  {
    slug: 'backup-e-versao-de-programa-de-clp', trilha: 'clp',
    titulo: 'Backup e versão de programa de CLP', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Nunca mais perder a versão que está rodando na máquina.',
    cobrir: ['Onde guardar e com que nome', 'Comparar a versão da máquina com a do arquivo', 'Registro de alteração em uma linha'],
    blocos: ['resumo', 'passos', 'arvore', 'dica', 'quiz'],
  },

  /* ---------------- Modbus de ponta a ponta (5) */
  {
    slug: 'modbus-em-dez-minutos', trilha: 'redes-industriais', serie: 'modbus-de-ponta-a-ponta', parte: 1,
    titulo: 'Modbus em dez minutos: mestre, escravo e registradores', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Saber o que acontece numa leitura Modbus e o que são coils, discrete inputs, input e holding registers.',
    cobrir: ['Pergunta e resposta: quem pede, quem responde', 'As quatro áreas de dado', 'Os códigos de função que você vai usar de verdade', 'RTU e TCP: o mesmo protocolo, dois meios'],
    blocos: ['resumo', 'aprender', 'tabela', 'curiosidade', 'quiz'],
  },
  {
    slug: 'rs-485-sem-misterio', trilha: 'redes-industriais', serie: 'modbus-de-ponta-a-ponta', parte: 2,
    titulo: 'RS-485 sem mistério: cabo, terminação e polarização', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Montar um barramento RS-485 que funciona na primeira vez.',
    cobrir: ['Par trançado e blindagem', 'Topologia em barramento, não em estrela', 'Resistor de terminação e polarização', 'Baud rate, paridade e ID'],
    blocos: ['resumo', 'aprender', 'imagem', 'passos', 'armadilhas', 'quiz'],
  },
  {
    slug: 'lendo-o-mapa-de-memoria-do-manual', trilha: 'redes-industriais', serie: 'modbus-de-ponta-a-ponta', parte: 3,
    titulo: 'Lendo o mapa de memória de um manual', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Achar no manual o registrador certo, com o endereço, a escala e o tipo de dado corretos.',
    cobrir: ['Endereço que começa em 0 ou em 1', 'Escala: o valor 253 que é 25,3 °C', 'Valor de 32 bits em dois registradores (e a ordem dos bytes)', 'Montar a sua tabela de pontos'],
    blocos: ['resumo', 'aprender', 'tabela', 'formula', 'armadilhas', 'quiz'],
  },
  {
    slug: 'modbus-tcp-do-ip-ao-primeiro-valor', trilha: 'redes-industriais', serie: 'modbus-de-ponta-a-ponta', parte: 4,
    titulo: 'Modbus TCP: do IP ao primeiro valor lido', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Ler um registrador de um equipamento pela rede com um programa gratuito, antes de escrever qualquer aplicação.',
    cobrir: ['IP, porta 502 e unit ID', 'Um cliente Modbus gratuito para teste', 'Ler, conferir com o display do equipamento', 'Escrever com cuidado'],
    blocos: ['resumo', 'aprender', 'passos', 'terminal', 'perigo', 'quiz'],
  },
  {
    slug: 'diagnostico-modbus-leitura-zero-ou-errada', trilha: 'redes-industriais', serie: 'modbus-de-ponta-a-ponta', parte: 5,
    titulo: 'Diagnóstico Modbus: quando a leitura volta zero, errada ou não volta', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Seguir um roteiro de diagnóstico que acha o defeito em minutos, do físico ao dado.',
    cobrir: ['Não responde: físico, ID, parâmetros de porta', 'Responde com exceção: o que cada código diz', 'Responde errado: endereço, escala, ordem de bytes', 'Responde às vezes: ruído, tempo de espera, colisão'],
    blocos: ['resumo', 'roteiro', 'tabela', 'armadilhas', 'quiz'],
  },
  /* ---------------- Protocolos lado a lado (3) */
  {
    slug: 'profinet-ethernet-ip-modbus-tcp', trilha: 'redes-industriais', serie: 'protocolos-lado-a-lado', parte: 1,
    titulo: 'Profinet, EtherNet/IP e Modbus TCP: o mesmo cabo, três conversas', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Saber por que três protocolos usam Ethernet e quando cada um é a escolha certa.',
    cobrir: ['O que muda entre eles além do nome', 'Tempo real, determinismo e o que isso quer dizer', 'Quem usa cada um no Brasil'],
    blocos: ['resumo', 'tabela', 'proscontras', 'quiz'],
  },
  {
    slug: 'canopen-para-quem-vem-do-modbus', trilha: 'redes-industriais', serie: 'protocolos-lado-a-lado', parte: 2,
    titulo: 'CANopen para quem vem do Modbus', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Entender o dicionário de objetos, PDO e SDO comparando com o que já se conhece do Modbus.',
    cobrir: ['Barramento CAN: por que não tem mestre perguntando', 'Dicionário de objetos × mapa de registradores', 'PDO e SDO', 'Onde o CANopen aparece: drives e servos'],
    blocos: ['resumo', 'aprender', 'tabela', 'curiosidade', 'quiz'],
  },
  {
    slug: 'opc-ua-o-que-e-e-quando-vale', trilha: 'redes-industriais', serie: 'protocolos-lado-a-lado', parte: 3,
    titulo: 'OPC UA: o que é e quando vale a pena', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Separar o que o OPC UA resolve do que é marketing, com um exemplo de leitura.',
    cobrir: ['Modelo de informação: o dado com nome e unidade', 'Segurança embutida', 'Custo e peso: quando Modbus ainda ganha'],
    blocos: ['resumo', 'proscontras', 'codigo', 'quiz'],
  },
  {
    slug: 'conversor-rs485-para-modbus-tcp', trilha: 'redes-industriais',
    titulo: 'Conversor RS-485 → Modbus TCP: modernizar equipamento antigo sem trocar', formato: 'experiencia', nivel: 'intermediario',
    objetivo: 'Pôr na rede um equipamento que só fala serial, com um conversor e sem mexer no programa dele.',
    cobrir: ['O equipamento, o problema e a ideia', 'Escolha e configuração do conversor', 'O primeiro valor lido pela rede', 'O que ficou pronto para os próximos'],
    blocos: EXPERIENCIA,
  },

  /* ---------------- Inversor na prática (5) */
  {
    slug: 'como-um-inversor-controla-a-velocidade', trilha: 'acionamentos', serie: 'inversor-na-pratica', parte: 1,
    titulo: 'Como um inversor controla a velocidade de um motor', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Entender frequência, tensão e a relação V/f sem precisar de eletrônica de potência.',
    cobrir: ['Velocidade do motor e frequência da rede', 'Retificar, filtrar, inverter', 'Controle escalar (V/f) e vetorial', 'O que acontece abaixo de 10 Hz'],
    blocos: ['resumo', 'aprender', 'formula', 'curiosidade', 'quiz'],
  },
  {
    slug: 'os-dez-parametros-de-toda-partida', trilha: 'acionamentos', serie: 'inversor-na-pratica', parte: 2,
    titulo: 'Os dez parâmetros que toda partida com inversor precisa', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Configurar o mínimo que faz um motor partir, parar e se proteger — em qualquer marca.',
    cobrir: ['Dados de placa do motor', 'Rampas de aceleração e desaceleração', 'Fonte do comando e da referência', 'Limites e proteções'],
    blocos: ['resumo', 'aprender', 'tabela', 'passos', 'armadilhas', 'quiz'],
  },
  {
    slug: 'configurar-um-inversor-em-vinte-minutos', trilha: 'acionamentos', serie: 'inversor-na-pratica', parte: 3,
    titulo: 'Como configurar um inversor em 20 minutos, com fotos do painel', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Seguir, tela a tela, a configuração de um inversor real — o artigo que dá para escrever tirando foto enquanto faz.',
    cobrir: ['O inversor e a aplicação', 'Entrar no menu e restaurar o padrão de fábrica', 'Cada parâmetro alterado, com a foto do display', 'O primeiro giro e o teste de parada'],
    blocos: ['resumo', 'roteiro', 'imagem', 'passos', 'atencao', 'checklist', 'quiz'],
  },
  {
    slug: 'comandar-o-inversor-pela-rede', trilha: 'acionamentos', serie: 'inversor-na-pratica', parte: 4,
    titulo: 'Comando pela rede: partir e mudar a velocidade por Modbus', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Trocar o botão e o potenciômetro por palavra de comando e referência pela rede.',
    cobrir: ['Palavra de controle e palavra de status', 'Referência de velocidade em registrador', 'O que fazer quando a rede cai (falha de comunicação)', 'Teste com a máquina em vazio'],
    blocos: ['resumo', 'aprender', 'tabela', 'perigo', 'armadilhas', 'quiz'],
  },
  {
    slug: 'backup-de-parametros-do-inversor', trilha: 'acionamentos', serie: 'inversor-na-pratica', parte: 5,
    titulo: 'Backup de parâmetros: trocar um inversor sem perder a configuração', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Guardar a parametrização de cada inversor da planta e restaurar num equipamento novo em minutos.',
    cobrir: ['Por que a parametrização some quando o inversor queima', 'Copiar pelo teclado, pelo software ou pela rede', 'Comparar dois inversores parâmetro a parâmetro', 'Onde guardar e como nomear'],
    blocos: ['resumo', 'aprender', 'passos', 'tabela', 'dica', 'quiz'],
  },
  {
    slug: 'servo-passo-ou-inversor', trilha: 'acionamentos',
    titulo: 'Servo, motor de passo ou inversor: qual usar', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Escolher o acionamento pela aplicação — posição, velocidade, custo — e não pelo hábito.',
    cobrir: ['O que cada um controla bem', 'Malha aberta e malha fechada', 'Custo total, não só o do equipamento'],
    blocos: ['resumo', 'tabela', 'proscontras', 'quiz'],
  },
  {
    slug: 'formas-de-partida-de-motor', trilha: 'acionamentos',
    titulo: 'Partida direta, estrela-triângulo, soft-starter e inversor', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Comparar as quatro formas de partir um motor pela corrente, pelo custo e pela aplicação.',
    cobrir: ['Corrente de partida e o que ela faz com a rede', 'Cada forma de partida, com o esquema', 'Tabela de escolha'],
    blocos: ['resumo', 'aprender', 'tabela', 'imagem', 'quiz'],
  },
  {
    slug: 'ajuste-de-ganho-de-servo', trilha: 'acionamentos',
    titulo: 'Ajuste de ganho de servo sem sofrimento', formato: 'guia', nivel: 'avancado',
    objetivo: 'Tirar a vibração e o erro de seguimento de um eixo com um método repetível.',
    cobrir: ['Inércia da carga e por que ela manda', 'Autoajuste: quando confiar', 'Ajuste manual em três passos', 'Ler o gráfico de erro de seguimento'],
    blocos: ['resumo', 'passos', 'imagem', 'armadilhas', 'quiz'],
  },

  /* ---------------- Sensores do chão (3) */
  {
    slug: 'indutivo-capacitivo-ou-optico', trilha: 'instrumentacao', serie: 'sensores-do-chao', parte: 1,
    titulo: 'Indutivo, capacitivo ou óptico: qual sensor e onde', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Escolher o sensor de presença pelo material, pela distância e pelo ambiente.',
    cobrir: ['O que cada um detecta', 'Distância sensora e fator de correção', 'Sujeira, luz e metal por perto'],
    blocos: ['resumo', 'tabela', 'imagem', 'armadilhas', 'quiz'],
  },
  {
    slug: 'encoder-incremental-e-absoluto', trilha: 'instrumentacao', serie: 'sensores-do-chao', parte: 2,
    titulo: 'Encoder incremental e absoluto', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Saber medir posição e velocidade com encoder, e por que o absoluto não perde a posição quando a energia cai.',
    cobrir: ['Canais A, B e Z', 'Resolução e a conta da posição', 'Absoluto: monovolta e multivolta', 'Ligação e ruído'],
    blocos: ['resumo', 'aprender', 'formula', 'proscontras', 'quiz'],
  },
  {
    slug: 'termopar-pt100-ou-termistor', trilha: 'instrumentacao', serie: 'sensores-do-chao', parte: 3,
    titulo: 'Termopar, PT100 ou termistor', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Escolher o sensor de temperatura pela faixa, pela precisão e pelo custo.',
    cobrir: ['Como cada um mede', 'PT100 a 2, 3 e 4 fios', 'Faixa e precisão, lado a lado'],
    blocos: ['resumo', 'tabela', 'curiosidade', 'quiz'],
  },
  {
    slug: 'calibracao-quando-e-como', trilha: 'instrumentacao',
    titulo: 'Calibração: o que é, quando fazer e como registrar', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Montar a rotina de calibração de uma planta pequena, com registro que passa em auditoria.',
    cobrir: ['Calibrar, ajustar e verificar não são a mesma coisa', 'Periodicidade pelo risco', 'O certificado e o que conferir nele'],
    blocos: ['resumo', 'passos', 'tabela', 'checklist', 'quiz'],
  },
  {
    slug: 'sinal-analogico-com-ruido', trilha: 'instrumentacao',
    titulo: 'Sinal analógico com ruído: aterramento e blindagem', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Acabar com a leitura que pula sem trocar o sensor.',
    cobrir: ['De onde vem o ruído', 'Blindagem aterrada de um lado só', 'Separar cabo de sinal de cabo de potência', 'Filtro no CLP como último recurso'],
    blocos: ['resumo', 'imagem', 'armadilhas', 'antesdepois', 'quiz'],
  },

  /* ---------------- Da máquina ao celular (5) */
  {
    slug: 'ihm-supervisorio-e-dashboard', trilha: 'ihm-dados', serie: 'da-maquina-ao-celular', parte: 1,
    titulo: 'IHM, supervisório e dashboard: o que é cada um', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Separar a tela que opera a máquina da que supervisiona a planta e da que informa o gestor.',
    cobrir: ['Quem usa cada tela e para quê', 'Onde o dado mora em cada caso', 'Por que misturar os três dá errado'],
    blocos: ['resumo', 'tabela', 'curiosidade', 'quiz'],
  },
  {
    slug: 'tela-de-operacao-que-o-operador-entende', trilha: 'ihm-dados', serie: 'da-maquina-ao-celular', parte: 2,
    titulo: 'Montar uma tela de operação que o operador entende', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Desenhar a tela pela tarefa do operador: menos cor, menos botão, mais leitura.',
    cobrir: ['Cor só para estado anormal', 'O que fica na primeira tela e o que vai para o menu', 'Botão que não se aperta sem querer', 'Antes e depois de uma tela real'],
    blocos: ['resumo', 'antesdepois', 'checklist', 'armadilhas', 'quiz'],
  },
  {
    slug: 'alarmes-que-servem', trilha: 'ihm-dados', serie: 'da-maquina-ao-celular', parte: 3,
    titulo: 'Alarmes que servem: prioridade, histórico e reconhecimento', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Reduzir a enxurrada de alarmes aos que pedem ação, com prioridade e registro.',
    cobrir: ['Alarme, evento e aviso', 'Prioridade pela consequência', 'Histórico que ajuda a achar a causa', 'Alarme que ninguém lê é alarme a menos'],
    blocos: ['resumo', 'tabela', 'dica', 'armadilhas', 'quiz'],
  },
  {
    slug: 'mqtt-para-quem-vem-do-chao-de-fabrica', trilha: 'ihm-dados', serie: 'da-maquina-ao-celular', parte: 4,
    titulo: 'MQTT para quem vem do chão de fábrica', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Entender publicador, assinante e broker comparando com mestre e escravo do Modbus.',
    cobrir: ['Quem pergunta e quem avisa', 'Tópicos e como organizá-los', 'QoS e mensagem retida', 'Onde o MQTT entra numa planta'],
    blocos: ['resumo', 'aprender', 'tabela', 'codigo', 'quiz'],
  },
  {
    slug: 'tela-de-lider-varias-maquinas', trilha: 'ihm-dados', serie: 'da-maquina-ao-celular', parte: 5,
    titulo: 'Tela de líder: acompanhar várias máquinas num lugar só', formato: 'experiencia', nivel: 'intermediario',
    objetivo: 'Montar a tela que mostra um ou dois números de cada máquina — e o que o líder faz com ela.',
    cobrir: ['Que dado de cada máquina importa ao líder', 'De onde veio cada dado', 'A tela montada', 'O que mudou na rotina'],
    blocos: EXPERIENCIA,
  },
  {
    slug: 'oee-a-conta-e-as-armadilhas', trilha: 'ihm-dados',
    titulo: 'OEE: a conta, os dados e as armadilhas', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Calcular o OEE certo e saber por que o número de duas fábricas não se compara.',
    cobrir: ['Disponibilidade, desempenho e qualidade', 'De onde vem cada dado', 'As três maneiras mais comuns de inflar o OEE'],
    blocos: ['resumo', 'aprender', 'formula', 'armadilhas', 'quiz'],
  },
  {
    slug: 'coletar-dados-de-maquina-antiga', trilha: 'ihm-dados',
    titulo: 'Coletar dados de máquina antiga sem mexer no programa', formato: 'experiencia', nivel: 'intermediario',
    objetivo: 'Tirar produção e parada de uma máquina sem rede, sem alterar o que já funciona.',
    cobrir: ['A máquina e o que se queria saber', 'Onde se pegou o sinal', 'O dado chegando', 'O que aprendi'],
    blocos: EXPERIENCIA,
  },

  /* ---------------- Predial do 1 ao 5 (5) */
  {
    slug: 'o-que-se-automatiza-num-predio', trilha: 'predial', serie: 'predial-do-1-ao-5', parte: 1,
    titulo: 'O que se automatiza num prédio, e por quê', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Ver o prédio como sistemas — luz, clima, acesso, energia — e o que cada um ganha automatizado.',
    cobrir: ['Os sistemas de um prédio', 'Conforto, segurança e economia: o que se mede', 'Residencial × comercial'],
    blocos: ['resumo', 'aprender', 'tabela', 'curiosidade', 'quiz'],
  },
  {
    slug: 'iluminacao-presenca-cenas-e-economia', trilha: 'predial', serie: 'predial-do-1-ao-5', parte: 2,
    titulo: 'Iluminação: sensor de presença, cenas e economia medida', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Automatizar a luz de um ambiente e medir quanto se economizou.',
    cobrir: ['Sensor de presença: onde pôr e que tempo usar', 'Cenas e dimerização', 'A conta da economia'],
    blocos: ['resumo', 'passos', 'formula', 'armadilhas', 'quiz'],
  },
  {
    slug: 'climatizacao-ar-condicionado-e-ventilacao', trilha: 'predial', serie: 'predial-do-1-ao-5', parte: 3,
    titulo: 'Climatização: controlar ar-condicionado e ventilação', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Integrar o ar-condicionado ao sistema do prédio e evitar os desperdícios mais comuns.',
    cobrir: ['Como o ar-condicionado aceita comando', 'Horário, ocupação e setpoint', 'Janela aberta, ar ligado'],
    blocos: ['resumo', 'aprender', 'tabela', 'dica', 'quiz'],
  },
  {
    slug: 'controle-de-acesso-e-portoes', trilha: 'predial', serie: 'predial-do-1-ao-5', parte: 4,
    titulo: 'Controle de acesso e portões', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Entender e montar o acesso de um condomínio: leitor, fechadura, portão e registro.',
    cobrir: ['Leitor, controladora e fechadura', 'Portão: sensores e segurança anti-esmagamento', 'Registro de quem entrou'],
    blocos: ['resumo', 'imagem', 'perigo', 'checklist', 'quiz'],
  },
  {
    slug: 'integracao-predial-bacnet-e-knx', trilha: 'predial', serie: 'predial-do-1-ao-5', parte: 5,
    titulo: 'Integração: BACnet, KNX e o que conversa com o quê', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Saber quais protocolos o prédio usa e como fazer sistemas de marcas diferentes conversarem.',
    cobrir: ['BACnet, KNX e Modbus no prédio', 'Gateway: quando é inevitável', 'Especificar a integração no projeto'],
    blocos: ['resumo', 'tabela', 'proscontras', 'quiz'],
  },
  {
    slug: 'home-assistant-para-quem-vem-da-industria', trilha: 'predial',
    titulo: 'Home Assistant para quem vem da indústria', formato: 'experiencia', nivel: 'intermediario',
    objetivo: 'Montar a automação de casa com a cabeça de quem faz automação industrial.',
    cobrir: ['Por que escolhi e o que queria resolver', 'A instalação e os primeiros dispositivos', 'O que é igual e o que é diferente da indústria'],
    blocos: EXPERIENCIA,
  },

  /* ---------------- Rede para automação (5) */
  {
    slug: 'cabo-de-rede-cat5e-cat6-cat6a', trilha: 'rede-ti', serie: 'rede-para-automacao', parte: 1,
    titulo: 'Cabo de rede: Cat5e, Cat6 e Cat6A — a diferença que importa', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Escolher o cabo pela distância, pela velocidade e pelo ambiente, e não pelo que sobrou no almoxarifado.',
    cobrir: ['O que muda de uma categoria para outra', 'Blindado ou não blindado', 'Cabo industrial: óleo, dobra e vibração', 'Os 100 metros'],
    blocos: ['resumo', 'aprender', 'tabela', 'curiosidade', 'quiz'],
  },
  {
    slug: 'crimpar-e-testar-cabo', trilha: 'rede-ti', serie: 'rede-para-automacao', parte: 2,
    titulo: 'Crimpar e testar um cabo sem retrabalho', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Fazer o cabo certo na primeira vez e provar que está certo.',
    cobrir: ['Padrão T568A e T568B', 'O passo a passo com fotos', 'Testador: o que ele prova e o que não prova'],
    blocos: ['resumo', 'passos', 'imagem', 'armadilhas', 'quiz'],
  },
  {
    slug: 'ip-mascara-e-gateway-para-quem-monta-painel', trilha: 'rede-ti', serie: 'rede-para-automacao', parte: 3,
    titulo: 'IP, máscara e gateway para quem monta painel', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Endereçar os equipamentos de uma máquina sem conflito e sem depender do TI.',
    cobrir: ['Endereço e máscara: quem fala com quem', 'Gateway: quando precisa', 'Plano de endereços da máquina'],
    blocos: ['resumo', 'aprender', 'tabela', 'terminal', 'quiz'],
  },
  {
    slug: 'switch-gerenciavel-ou-nao', trilha: 'rede-ti', serie: 'rede-para-automacao', parte: 4,
    titulo: 'Switch gerenciável ou não gerenciável na rede da máquina', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Decidir quando o switch barato basta e quando ele derruba a rede da fábrica.',
    cobrir: ['O que um switch gerenciável faz a mais', 'Tempestade de broadcast e laço', 'Switch industrial: temperatura e trilho'],
    blocos: ['resumo', 'proscontras', 'armadilhas', 'quiz'],
  },
  {
    slug: 'separar-rede-da-fabrica-e-do-escritorio', trilha: 'rede-ti', serie: 'rede-para-automacao', parte: 5,
    titulo: 'Separar a rede da fábrica da rede do escritório', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Isolar as máquinas da rede administrativa com VLAN e regra de acesso.',
    cobrir: ['Por que separar', 'VLAN em linguagem simples', 'O que pode passar de uma rede para a outra'],
    blocos: ['resumo', 'aprender', 'passos', 'perigo', 'quiz'],
  },
  {
    slug: 'acesso-remoto-a-maquina-com-seguranca', trilha: 'rede-ti',
    titulo: 'Acesso remoto a máquina com segurança', formato: 'guia', nivel: 'avancado',
    objetivo: 'Dar suporte remoto a um cliente sem abrir a rede dele para a internet.',
    cobrir: ['Os jeitos errados que são os mais comuns', 'VPN e acesso sob demanda', 'Registro e fim do acesso'],
    blocos: ['resumo', 'proscontras', 'perigo', 'checklist', 'quiz'],
  },

  /* ---------------- Segurança antes de ligar (3) */
  {
    slug: 'nr-12-em-linguagem-de-chao-de-fabrica', trilha: 'seguranca', serie: 'seguranca-antes-de-ligar', parte: 1,
    titulo: 'NR-12 em linguagem de chão de fábrica', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Saber o que a NR-12 pede de uma máquina e o que isso muda no projeto de automação.',
    cobrir: ['O que a norma cobre', 'Apreciação de risco', 'Proteção fixa, móvel e dispositivo de segurança'],
    blocos: ['resumo', 'aprender', 'checklist', 'atencao', 'quiz'],
  },
  {
    slug: 'emergencia-rele-de-seguranca-e-categoria', trilha: 'seguranca', serie: 'seguranca-antes-de-ligar', parte: 2,
    titulo: 'Botão de emergência, relé de segurança e categoria', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Entender por que a emergência não passa pelo CLP comum e o que é categoria de segurança.',
    cobrir: ['Emergência não é parada comum', 'Relé de segurança: redundância e monitoramento', 'Categoria e nível de desempenho'],
    blocos: ['resumo', 'tabela', 'perigo', 'quiz'],
  },
  {
    slug: 'bloqueio-e-etiquetagem-loto', trilha: 'seguranca', serie: 'seguranca-antes-de-ligar', parte: 3,
    titulo: 'Bloqueio e etiquetagem (LOTO) na manutenção', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Aplicar o bloqueio de energias antes de mexer na máquina, passo a passo.',
    cobrir: ['Todas as energias, não só a elétrica', 'O procedimento em ordem', 'Liberar a máquina de volta'],
    blocos: ['resumo', 'passos', 'perigo', 'checklist', 'quiz'],
  },
  {
    slug: 'nr-10-para-quem-mexe-em-painel', trilha: 'seguranca',
    titulo: 'NR-10: o que quem mexe em painel precisa saber', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Saber o que a NR-10 exige de quem trabalha com eletricidade e o que muda na rotina.',
    cobrir: ['Quem precisa de treinamento', 'Zona de risco e zona controlada', 'Documentação do painel'],
    blocos: ['resumo', 'checklist', 'perigo', 'quiz'],
  },

  /* ---------------- O primeiro robô (3) */
  {
    slug: 'robo-industrial-ou-cobot', trilha: 'robotica', serie: 'primeiro-robo', parte: 1,
    titulo: 'Robô industrial ou cobot: qual para a sua célula', formato: 'conceito', nivel: 'iniciante',
    objetivo: 'Escolher entre robô industrial e colaborativo pela tarefa, pelo espaço e pela segurança.',
    cobrir: ['O que "colaborativo" quer dizer de verdade', 'Velocidade, carga e alcance', 'Custo da célula, não do robô'],
    blocos: ['resumo', 'tabela', 'proscontras', 'quiz'],
  },
  {
    slug: 'integrar-robo-com-clp', trilha: 'robotica', serie: 'primeiro-robo', parte: 2,
    titulo: 'Integrar um robô com o CLP: os sinais mínimos', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Fazer o CLP e o robô conversarem com um conjunto mínimo e seguro de sinais.',
    cobrir: ['Pronto, em ciclo, fim de ciclo, falha', 'Handshake: quem espera quem', 'Parada e retomada seguras'],
    blocos: ['resumo', 'tabela', 'roteiro', 'armadilhas', 'quiz'],
  },
  {
    slug: 'visao-de-maquina-quando-uma-camera-resolve', trilha: 'robotica', serie: 'primeiro-robo', parte: 3,
    titulo: 'Visão de máquina: quando uma câmera resolve', formato: 'conceito', nivel: 'intermediario',
    objetivo: 'Saber que problema de inspeção uma câmera resolve e o que decide se ela vai funcionar.',
    cobrir: ['Presença, medida, leitura e posição', 'Iluminação: metade do projeto', 'Sensor de visão × sistema de visão'],
    blocos: ['resumo', 'aprender', 'antesdepois', 'dica', 'quiz'],
  },

  /* ---------------- Automação como negócio (3) */
  {
    slug: 'orcar-projeto-de-automacao', trilha: 'negocio', serie: 'automacao-como-negocio', parte: 1,
    titulo: 'Como orçar um projeto de automação sem perder dinheiro', formato: 'guia', nivel: 'intermediario',
    objetivo: 'Montar um orçamento que cobre as horas que ninguém lembra: teste, documentação, partida, deslocamento.',
    cobrir: ['Material, engenharia, montagem e partida', 'As horas invisíveis', 'Risco e margem', 'Uma planilha de exemplo'],
    blocos: ['resumo', 'tabela', 'formula', 'armadilhas', 'quiz'],
  },
  {
    slug: 'proposta-tecnica-que-o-cliente-entende', trilha: 'negocio', serie: 'automacao-como-negocio', parte: 2,
    titulo: 'Proposta técnica que o cliente entende', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Escrever uma proposta que diz o que será entregue, o que não será, e quando.',
    cobrir: ['Escopo e fora de escopo', 'Critério de aceite', 'Prazo que depende do cliente'],
    blocos: ['resumo', 'checklist', 'armadilhas', 'quiz'],
  },
  {
    slug: 'vender-retrofit-com-antes-e-depois', trilha: 'negocio', serie: 'automacao-como-negocio', parte: 3,
    titulo: 'Como vender um retrofit: o antes e depois que convence', formato: 'experiencia', nivel: 'intermediario',
    objetivo: 'Mostrar o valor de modernizar uma máquina com dado do próprio cliente.',
    cobrir: ['A máquina antes', 'O que foi feito', 'O número que mudou', 'Como apresentei ao cliente'],
    blocos: EXPERIENCIA,
  },
  {
    slug: 'do-tecnico-ao-integrador', trilha: 'negocio',
    titulo: 'Do técnico ao integrador: o que muda', formato: 'experiencia', nivel: 'iniciante',
    objetivo: 'Contar a passagem de quem executa para quem responde pelo projeto inteiro.',
    cobrir: ['O ponto de virada', 'O que precisei aprender que não era técnico', 'O que faria diferente'],
    blocos: ['resumo', 'margem', 'armadilhas', 'notadoautor', 'quiz'],
  },
  {
    slug: 'portfolio-de-quem-trabalha-com-automacao', trilha: 'negocio',
    titulo: 'O portfólio de quem trabalha com automação', formato: 'guia', nivel: 'iniciante',
    objetivo: 'Montar um portfólio mostrando máquina e resultado sem expor o cliente.',
    cobrir: ['O que mostrar e o que não mostrar', 'Foto, número e descrição', 'Onde publicar'],
    blocos: ['resumo', 'checklist', 'imagem', 'dica', 'quiz'],
  },
];

/* ------------------------------------------------------------- consultas */

export const pautaPorSlug = (slug: string) => PAUTAS.find((p) => p.slug === slug) ?? null;
export const seriePorSlug = (slug: string) => SERIES.find((s) => s.slug === slug) ?? null;
export const trilhaPorSlug = (slug: string) => TRILHAS.find((t) => t.slug === slug) ?? null;
export const pautasDaSerie = (serie: string) => PAUTAS.filter((p) => p.serie === serie).sort((a, b) => (a.parte ?? 0) - (b.parte ?? 0));
export const avulsasDaTrilha = (trilha: string) => PAUTAS.filter((p) => p.trilha === trilha && !p.serie);
export const seriesDaTrilha = (trilha: string) => SERIES.filter((s) => s.trilha === trilha);

/**
 * O estado da pauta, derivado: publicada se algum artigo diz `pauta: <slug>`,
 * reservada se alguém pegou, livre se não. Recebe a lista de slugs de pauta dos
 * artigos publicados, para este arquivo não depender do conteúdo compilado.
 */
export function estadoDaPauta(p: Pauta, publicadas: ReadonlySet<string>): 'publicada' | 'reservada' | 'livre' {
  if (publicadas.has(p.slug)) return 'publicada';
  if (p.reservada) return 'reservada';
  return 'livre';
}
