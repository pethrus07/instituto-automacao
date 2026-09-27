/** Guias das trilhas Predial, Segurança, Robótica, Educação e Negócio — roteiro editorial do Instituto (ver ./tipos.ts). */
import type { Guia } from './tipos';

export const GUIAS_D: Record<string, Guia> = {
  /* ------------------------------------------------------------ educação */

  'roteiro-de-estudos-em-automacao': {
    resumo: [
      'A base de elétrica e comandos que vem antes de qualquer CLP.',
      'Uma ordem de estudo que evita pular etapa, com tempo estimado.',
      'Sinais concretos de que você está pronto para o próximo degrau.',
    ],
    secoes: [
      { dicas: [
        'Liste o que não dá para pular: tensão, corrente, lei de Ohm, leitura de diagrama e comandos elétricos.',
        'Explique por que quem pula comandos elétricos sofre depois no Ladder.',
        'Conte qual lacuna de base você mais vê em quem está começando.',
      ] },
      { dicas: [
        'Monte a sequência: elétrica, comandos, sensores, CLP, IHM, redes, dados e IA.',
        'Dê um tempo estimado por etapa para quem estuda algumas horas por semana, deixando claro que é referência.',
        'Mostre onde entra a prática em cada etapa, não só a teoria.',
      ] },
      { dicas: [
        'Proponha um teste prático por etapa, como montar uma partida direta ou ler um diagrama sem ajuda.',
        'Explique a diferença entre ter visto o assunto e conseguir fazer sozinho.',
        'Diga o que fazer quando a etapa seguinte parece difícil demais.',
      ] },
    ],
    armadilhas: [
      'Começar pelo CLP sem saber comandos elétricos',
      'Colecionar cursos sem praticar nenhum',
      'Pular direto para IA e dados',
    ],
    quiz: [
      { pergunta: 'O que deve vir antes de programar CLP?', certa: 'Elétrica básica e comandos elétricos', erradas: ['Redes industriais e protocolos', 'Programação em Python e dados'] },
      { pergunta: 'Qual é um bom sinal de que a etapa foi concluída?', certa: 'Fazer o exercício prático sozinho', erradas: ['Ter assistido todas as aulas', 'Ter o certificado do curso'] },
      { pergunta: 'Por que seguir uma ordem de estudo?', certa: 'Cada assunto se apoia no anterior', erradas: ['Os cursos só aceitam nessa ordem', 'A ordem reduz o custo do material'] },
    ],
    termos: [
      { termo: 'Comandos elétricos', definicao: 'Circuitos com contatores, relés e botões que ligam e protegem motores, a base lógica do Ladder.' },
      { termo: 'Diagrama elétrico', definicao: 'Desenho que mostra como os componentes de um painel estão ligados, com símbolos padronizados.' },
    ],
  },

  'bancada-de-estudos-barata': {
    resumo: [
      'O mínimo para treinar: fonte, CLP pequeno, botões e sinaleiros.',
      'Como comprar equipamento usado sem levar problema para casa.',
      'O que parece útil na loja e fica parado na bancada.',
    ],
    secoes: [
      { dicas: [
        'Liste a bancada mínima: fonte 24 Vcc, CLP compacto, botoeiras, sinaleiros e bornes.',
        'Explique por que trabalhar em 24 Vcc é mais seguro para treinar.',
        'Mostre com uma foto uma bancada simples montada em trilho DIN numa placa.',
      ] },
      { dicas: [
        'Conte o que testar antes de pagar um CLP usado: liga, comunica, entradas e saídas respondem.',
        'Explique como conferir se o software de programação daquele modelo é acessível.',
        'Diga onde costuma haver usado confiável e onde desconfiar.',
      ] },
      { dicas: [
        'Cite itens que parecem essenciais e quase não são usados no começo.',
        'Explique por que um inversor ou uma IHM pode esperar a segunda fase.',
        'Conte algo que você comprou e se arrependeu.',
      ] },
    ],
    armadilhas: [
      'Ligar a bancada em 220 V sem proteção',
      'Comprar CLP sem acesso ao software',
      'Gastar tudo em IHM antes do básico',
    ],
    quiz: [
      { pergunta: 'Qual tensão é mais indicada para treinar comandos na bancada?', certa: '24 Vcc de uma fonte industrial', erradas: ['220 Vca direto da tomada', '380 Vca trifásico'] },
      { pergunta: 'O que conferir antes de comprar um CLP usado?', certa: 'Se entradas, saídas e comunicação funcionam', erradas: ['Se a caixa original está junto', 'Se a cor combina com a bancada'] },
      { pergunta: 'O que pode ficar para uma segunda fase?', certa: 'IHM e inversor de frequência', erradas: ['Fonte e botoeiras', 'Bornes e fios'] },
    ],
    termos: [
      { termo: 'Trilho DIN', definicao: 'Perfil metálico padronizado onde se encaixam CLP, bornes, disjuntores e fontes no painel.' },
      { termo: 'Sinaleiro', definicao: 'Lâmpada de painel que indica um estado, como ligado, falha ou em operação.' },
    ],
  },

  'simuladores-gratuitos-de-automacao': {
    resumo: [
      'Quais simuladores gratuitos permitem treinar Ladder sem equipamento.',
      'Um primeiro exercício completo, do programa ao teste.',
      'O que o simulador não ensina e só a bancada mostra.',
    ],
    secoes: [
      { dicas: [
        'Compare os simuladores que você usou pelo que é grátis de fato e pelo que exige licença.',
        'Diga quais linguagens da IEC 61131-3 cada um aceita.',
        'Mostre com uma captura de tela a cara de cada um.',
      ] },
      { dicas: [
        'Escolha um exercício clássico, como partida e parada com selo.',
        'Mostre passo a passo: criar o projeto, escrever a lógica, rodar e forçar entradas.',
        'Explique como conferir que o resultado está certo.',
      ] },
      { dicas: [
        'Explique o que o simulador esconde: ruído, fio solto, tempo de resposta real.',
        'Conte um erro que só apareceu quando o programa foi para o CLP de verdade.',
        'Diga quando é hora de sair do simulador para a bancada.',
      ] },
    ],
    armadilhas: [
      'Achar que funcionou no simulador então funciona na máquina',
      'Baixar versão pirata de software de fabricante',
      'Treinar só lógica e nunca ligação elétrica',
    ],
    quiz: [
      { pergunta: 'Qual exercício é um bom começo no simulador?', certa: 'Partida e parada com contato de selo', erradas: ['Controle PID de temperatura', 'Comunicação Profinet entre CLPs'] },
      { pergunta: 'O que o simulador normalmente não mostra?', certa: 'Ruído elétrico e mau contato', erradas: ['A lógica do programa', 'O estado das variáveis'] },
      { pergunta: 'Qual norma define as linguagens de CLP como Ladder?', certa: 'IEC 61131-3', erradas: ['NR-12', 'ISO 9001'] },
    ],
    termos: [
      { termo: 'IEC 61131-3', definicao: 'Norma que define as linguagens de programação de CLP, como Ladder, texto estruturado e blocos de função.' },
      { termo: 'Forçar entrada', definicao: 'Mudar o estado de uma entrada pelo software para testar a lógica sem acionar o sensor real.' },
      { termo: 'Contato de selo', definicao: 'Contato que mantém a saída ligada depois que o botão de partida é solto.' },
    ],
  },

  'tecnico-tecnologo-ou-engenharia': {
    resumo: [
      'O que técnico, tecnólogo e engenharia ensinam de verdade.',
      'Como cada formação aparece nas vagas de automação.',
      'Onde cada profissional registra e o que pode assinar.',
    ],
    secoes: [
      { dicas: [
        'Compare as três pela profundidade: prática de campo, aplicação e fundamento teórico.',
        'Mostre em uma tabela a duração típica e o perfil de cada curso.',
        'Conte o que você viu de diferença no dia a dia entre profissionais de cada formação.',
      ] },
      { dicas: [
        'Mostre exemplos de vagas reais e qual formação cada uma pede.',
        'Explique quando a experiência pesa mais que o diploma.',
        'Diga como cada formação costuma evoluir de cargo.',
      ] },
      { dicas: [
        'Explique que técnicos industriais registram no CRT e engenheiros e tecnólogos no CREA.',
        'Explique o que é atribuição profissional e por que ela limita o que se pode assinar.',
        'Oriente o leitor a consultar o conselho da própria modalidade antes de decidir.',
      ] },
    ],
    armadilhas: [
      'Escolher só pelo tempo de curso',
      'Achar que diploma substitui experiência',
      'Assinar projeto fora da própria atribuição',
    ],
    quiz: [
      { pergunta: 'Em que conselho se registra o técnico industrial?', certa: 'No Conselho Regional dos Técnicos Industriais', erradas: ['No Conselho Regional de Administração', 'No Conselho de Arquitetura e Urbanismo'] },
      { pergunta: 'O que a atribuição profissional define?', certa: 'O que o profissional pode assinar', erradas: ['O salário mínimo da categoria', 'A carga horária semanal'] },
      { pergunta: 'Qual formação tem mais fundamento teórico?', certa: 'A engenharia', erradas: ['O curso técnico', 'O curso livre'] },
    ],
    termos: [
      { termo: 'Atribuição profissional', definicao: 'Conjunto de atividades que o conselho reconhece que um profissional pode exercer e assinar.' },
      { termo: 'ART', definicao: 'Anotação de Responsabilidade Técnica: registro que vincula o profissional do CREA a um serviço ou projeto.' },
    ],
  },

  'certificacoes-e-cursos-que-valem': {
    resumo: [
      'A diferença entre curso de fabricante, de instituição e curso livre.',
      'O que o recrutador de automação realmente olha no currículo.',
      'Quando um portfólio com projetos vale mais que certificado.',
    ],
    secoes: [
      { dicas: [
        'Explique o que cada tipo entrega: curso de fabricante, curso de instituição reconhecida e curso livre.',
        'Diga como avaliar um curso: carga prática, equipamento real, avaliação.',
        'Conte qual curso abriu porta para você e por quê.',
      ] },
      { dicas: [
        'Conte o que um recrutador ou gestor de manutenção pergunta na entrevista.',
        'Explique por que a NR-10 aparece como exigência em tantas vagas.',
        'Mostre como descrever um curso no currículo pelo que você sabe fazer.',
      ] },
      { dicas: [
        'Defenda com exemplo quando um projeto documentado convence mais que o certificado.',
        'Diga o que um projeto de portfólio precisa ter para ser levado a sério.',
        'Explique por que os dois juntos valem mais que cada um sozinho.',
      ] },
    ],
    armadilhas: [
      'Encher o currículo de cursos de poucas horas',
      'Curso só de teoria sem equipamento',
      'Certificado sem conseguir explicar o que aprendeu',
    ],
    quiz: [
      { pergunta: 'O que mais indica a qualidade de um curso de automação?', certa: 'Prática em equipamento real e avaliação', erradas: ['A quantidade de horas em vídeo', 'O preço mais alto do mercado'] },
      { pergunta: 'Qual treinamento de segurança aparece em muitas vagas elétricas?', certa: 'NR-10', erradas: ['NR-17', 'ISO 14001'] },
      { pergunta: 'Como descrever um curso no currículo?', certa: 'Pelo que você sabe fazer com ele', erradas: ['Só pelo nome da escola', 'Só pela data de conclusão'] },
    ],
    termos: [
      { termo: 'Curso livre', definicao: 'Curso sem regulação do MEC, que não dá grau de formação mas pode ensinar uma habilidade específica.' },
      { termo: 'Portfólio', definicao: 'Coleção de projetos que você fez, com foto, descrição e resultado, para mostrar o que sabe.' },
    ],
  },

  'ensinar-automacao-com-pouco-laboratorio': {
    resumo: [
      'Como dar aula prática com poucos kits e muitos alunos.',
      'Aulas que combinam simulador, bancada e trabalho em grupo.',
      'O que um professor faria diferente depois da experiência.',
    ],
    secoes: [
      { dicas: [
        'Descreva a turma: quantos alunos, nível e objetivo do curso.',
        'Liste o laboratório que havia: quantos kits, que CLP, que software.',
        'Conte qual era a maior limitação no começo.',
      ] },
      { dicas: [
        'Conte como organizou o rodízio entre simulador e bancada.',
        'Descreva uma aula que funcionou, com o exercício e o resultado.',
        'Explique como dividiu os papéis no grupo para ninguém ficar só olhando.',
      ] },
      { dicas: [
        'Diga o que mudaria no planejamento ou na avaliação.',
        'Conte que item compraria primeiro se tivesse verba.',
        'Dê um conselho para quem vai começar com o mesmo cenário.',
      ] },
    ],
    armadilhas: [
      'Grupo grande demais em um kit só',
      'Aula de simulador sem ligação com a bancada',
      'Avaliar só a prova teórica',
    ],
    quiz: [
      { pergunta: 'Como aproveitar poucos kits numa turma grande?', certa: 'Rodízio entre simulador e bancada', erradas: ['Só aulas expositivas', 'Um kit por turma, só o professor usa'] },
      { pergunta: 'Por que dividir papéis no grupo?', certa: 'Para todos praticarem de verdade', erradas: ['Para reduzir o tempo de aula', 'Para dispensar a avaliação'] },
      { pergunta: 'Qual o papel do simulador nesse cenário?', certa: 'Preparar a lógica antes da bancada', erradas: ['Substituir toda a parte elétrica', 'Servir só como prova final'] },
    ],
    termos: [
      { termo: 'Kit didático', definicao: 'Bancada pronta para ensino, com CLP, botões, sinaleiros e às vezes sensores e motor.' },
      { termo: 'Rodízio', definicao: 'Organização em que os grupos se revezam entre atividades para todos passarem pelo equipamento.' },
    ],
  },

  'tcc-em-automacao-como-escolher-o-tema': {
    resumo: [
      'Como partir de um problema real e recortar até caber.',
      'Por que o acesso a dado ou equipamento decide o tema.',
      'Um cronograma que termina dentro do semestre.',
    ],
    secoes: [
      { dicas: [
        'Mostre como transformar um tema amplo em uma pergunta que se responde.',
        'Dê um exemplo de tema grande demais e a versão recortada.',
        'Explique por que um problema real, de estágio ou trabalho, rende mais.',
      ] },
      { dicas: [
        'Explique por que confirmar o acesso ao equipamento antes de fechar o tema.',
        'Diga o que fazer se o dado da empresa não pode sair de lá.',
        'Mostre como um simulador ou bancada pode servir de plano B.',
      ] },
      { dicas: [
        'Monte um cronograma por etapas: revisão, montagem, teste, escrita.',
        'Explique por que deixar folga para compra e para falha de teste.',
        'Conte o que costuma atrasar um TCC de automação.',
      ] },
    ],
    armadilhas: [
      'Tema grande demais para um semestre',
      'Depender de equipamento que ninguém garantiu',
      'Deixar a escrita para o fim',
    ],
    quiz: [
      { pergunta: 'O que confirmar antes de fechar o tema?', certa: 'O acesso ao dado ou equipamento', erradas: ['A cor da capa do trabalho', 'O número de páginas final'] },
      { pergunta: 'O que fazer com um tema amplo demais?', certa: 'Recortar até virar uma pergunta', erradas: ['Somar mais objetivos', 'Trocar só o título'] },
      { pergunta: 'Por que deixar folga no cronograma?', certa: 'Compra e teste costumam atrasar', erradas: ['Para entregar antes do prazo', 'Porque a banca exige'] },
    ],
    termos: [
      { termo: 'Recorte', definicao: 'Delimitação do tema a uma parte específica que dá para estudar no tempo disponível.' },
      { termo: 'Plano B', definicao: 'Caminho alternativo, como simulador ou bancada, caso o acesso ao equipamento real falhe.' },
    ],
  },

  'arduino-e-esp32-como-porta-de-entrada': {
    resumo: [
      'O que Arduino e ESP32 ensinam bem sobre automação.',
      'Por que a indústria continua usando CLP.',
      'Como levar a ideia do protótipo para um painel de verdade.',
    ],
    secoes: [
      { dicas: [
        'Liste o que se aprende bem: entradas e saídas, lógica, sensores, comunicação.',
        'Mostre um projeto simples que ensina o conceito de ciclo de leitura e escrita.',
        'Explique o ganho de aprender programando em texto.',
      ] },
      { dicas: [
        'Explique o que o CLP tem: entradas e saídas industriais, robustez, diagnóstico, suporte.',
        'Fale de manutenção: outro técnico precisa entender e trocar o equipamento.',
        'Compare o comportamento diante de ruído e surto de tensão.',
      ] },
      { dicas: [
        'Mostre como passar a lógica do protótipo para Ladder ou texto estruturado.',
        'Explique quando um controlador industrial baseado em microcontrolador pode fazer sentido.',
        'Diga o que nunca colocar num painel de máquina em produção.',
      ] },
    ],
    armadilhas: [
      'Ligar sensor de 24 V direto no pino',
      'Pôr Arduino em máquina de produção',
      'Esquecer do técnico que vai dar manutenção',
    ],
    quiz: [
      { pergunta: 'Por que não ligar sensor industrial de 24 V direto no ESP32?', certa: 'O pino trabalha com tensão bem menor', erradas: ['O sensor não tem saída digital', 'O ESP32 só aceita sinal analógico'] },
      { pergunta: 'O que o CLP oferece que a placa de estudo não oferece?', certa: 'Robustez industrial e suporte', erradas: ['Linguagem de programação', 'Entradas digitais'] },
      { pergunta: 'O que o Arduino ensina bem?', certa: 'Lógica, entradas e saídas e sensores', erradas: ['Normas de segurança de máquina', 'Certificação de painel'] },
    ],
    termos: [
      { termo: 'Microcontrolador', definicao: 'Chip com processador, memória e pinos de entrada e saída num só componente.' },
      { termo: 'Isolação óptica', definicao: 'Separação elétrica feita por luz entre o sinal de campo e o circuito, protegendo a eletrônica.' },
    ],
  },

  /* ------------------------------------------------------------- predial */

  'o-que-se-automatiza-num-predio': {
    resumo: [
      'Os sistemas de um prédio: luz, clima, acesso, energia e água.',
      'O que se mede para falar de conforto, segurança e economia.',
      'Onde a automação residencial difere da comercial.',
    ],
    secoes: [
      { dicas: [
        'Liste os sistemas: iluminação, climatização, acesso, CFTV, incêndio, energia, bombas.',
        'Mostre com um desenho simples como eles se ligam a uma supervisão.',
        'Explique qual sistema costuma ser automatizado primeiro e por quê.',
      ] },
      { dicas: [
        'Diga o que se mede em cada objetivo: temperatura, consumo, eventos de acesso.',
        'Explique por que sem medição não há como provar economia.',
        'Dê um exemplo de indicador simples que o síndico ou gestor entende.',
      ] },
      { dicas: [
        'Compare escala, tipo de cliente e tecnologia usada em cada caso.',
        'Explique quem opera o sistema em cada um e o que isso muda no projeto.',
        'Conte um erro de levar solução residencial para prédio comercial.',
      ] },
    ],
    armadilhas: [
      'Automatizar sem medir antes',
      'Sistemas de marcas diferentes que não conversam',
      'Projeto sem pensar em quem vai operar',
    ],
    quiz: [
      { pergunta: 'Por que medir antes de automatizar?', certa: 'Para comprovar a economia depois', erradas: ['Porque a norma proíbe sem medir', 'Para escolher a cor dos sensores'] },
      { pergunta: 'Qual destes é um sistema típico de prédio?', certa: 'Controle de acesso', erradas: ['Controle de esteira', 'Dosagem de reator'] },
      { pergunta: 'O que diferencia muito o predial comercial do residencial?', certa: 'A escala e quem opera o sistema', erradas: ['O uso de energia elétrica', 'A existência de iluminação'] },
    ],
    termos: [
      { termo: 'BMS', definicao: 'Building Management System: sistema que supervisiona e comanda os sistemas de um prédio num só lugar.' },
      { termo: 'Supervisório', definicao: 'Software que mostra o estado dos equipamentos, registra alarmes e permite comandar à distância.' },
    ],
  },

  'iluminacao-presenca-cenas-e-economia': {
    resumo: [
      'Onde instalar o sensor de presença e que tempo configurar.',
      'Como montar cenas e usar dimerização sem complicar.',
      'Como calcular a economia com dado antes e depois.',
    ],
    secoes: [
      { dicas: [
        'Explique a diferença entre sensor infravermelho passivo e sensor por micro-ondas.',
        'Mostre com uma planta onde o sensor enxerga e onde fica cego.',
        'Diga como escolher o tempo de desligamento para cada ambiente.',
      ] },
      { dicas: [
        'Explique o que é uma cena e dê exemplos para sala, auditório ou loja.',
        'Diga como conferir se a luminária e o driver aceitam dimerização.',
        'Conte como deixar o comando manual sempre disponível.',
      ] },
      { dicas: [
        'Mostre a conta: potência instalada vezes horas economizadas vezes tarifa.',
        'Explique como medir as horas ligadas antes e depois.',
        'Diga por que a economia estimada costuma ser diferente da medida.',
      ] },
    ],
    armadilhas: [
      'Sensor atrás de divisória ou móvel',
      'Tempo curto que apaga com gente parada',
      'Dimerizar driver que não aceita',
    ],
    quiz: [
      { pergunta: 'O que o sensor infravermelho passivo detecta?', certa: 'Variação de calor pelo movimento', erradas: ['O som do ambiente', 'A luz do dia na sala'] },
      { pergunta: 'Qual é a base da conta de economia?', certa: 'Potência, horas economizadas e tarifa', erradas: ['Número de lâmpadas e cor', 'Tensão da rede e bitola'] },
      { pergunta: 'O que conferir antes de dimerizar?', certa: 'Se o driver aceita dimerização', erradas: ['Se a lâmpada é branca', 'Se o disjuntor é bipolar'] },
    ],
    termos: [
      { termo: 'PIR', definicao: 'Sensor infravermelho passivo, que percebe a mudança de calor causada por uma pessoa em movimento.' },
      { termo: 'Dimerização', definicao: 'Controle da intensidade da luz, de apagado a totalmente aceso, em vez de só liga e desliga.' },
      { termo: 'Cena', definicao: 'Combinação salva de luzes e intensidades acionada por um único comando.' },
    ],
  },

  'climatizacao-ar-condicionado-e-ventilacao': {
    resumo: [
      'As formas de o ar-condicionado receber comando externo.',
      'Como usar horário, ocupação e setpoint para economizar.',
      'Como evitar o ar ligado com a janela aberta.',
    ],
    secoes: [
      { dicas: [
        'Liste as formas: infravermelho, contato seco, interface do fabricante, Modbus ou BACnet.',
        'Explique por que o infravermelho não confirma se o comando chegou.',
        'Diga como descobrir que interface um modelo aceita antes de comprar.',
      ] },
      { dicas: [
        'Mostre como montar uma agenda por horário de uso do ambiente.',
        'Explique o ganho de ligar pela ocupação real, com sensor.',
        'Discuta limites de setpoint para evitar que regulem no mínimo.',
      ] },
      { dicas: [
        'Explique o uso de sensor magnético de janela para bloquear ou desligar o ar.',
        'Diga como tratar o retardo para não desligar a cada abertura rápida.',
        'Conte outros desperdícios comuns, como ar ligado em sala vazia.',
      ] },
    ],
    armadilhas: [
      'Comando por infravermelho sem retorno de estado',
      'Setpoint liberado sem limite',
      'Ignorar a renovação de ar',
    ],
    quiz: [
      { pergunta: 'Qual a limitação do comando por infravermelho?', certa: 'Não confirma se o aparelho obedeceu', erradas: ['Só funciona à noite', 'Precisa de cabo de rede'] },
      { pergunta: 'Como evitar ar ligado com janela aberta?', certa: 'Sensor na janela que bloqueia o ar', erradas: ['Aumentar o setpoint no máximo', 'Trocar o filtro do aparelho'] },
      { pergunta: 'O que é o setpoint?', certa: 'A temperatura desejada no ambiente', erradas: ['A potência do compressor', 'O horário de desligar'] },
    ],
    termos: [
      { termo: 'Setpoint', definicao: 'Valor desejado que o controle tenta manter, como a temperatura da sala.' },
      { termo: 'Contato seco', definicao: 'Contato livre de tensão, que só abre ou fecha, usado para dar ou receber um sinal simples.' },
    ],
  },

  'controle-de-acesso-e-portoes': {
    resumo: [
      'O papel do leitor, da controladora e da fechadura no acesso.',
      'Os sensores do portão e a proteção contra esmagamento.',
      'Como guardar o registro de quem entrou e quando.',
    ],
    secoes: [
      { dicas: [
        'Explique o caminho do sinal: credencial, leitor, controladora, fechadura.',
        'Compare fechadura eletromagnética e eletroímã de fechadura, e o que acontece na falta de energia.',
        'Mostre com uma foto a ligação típica de uma controladora.',
      ] },
      { dicas: [
        'Liste os sensores: fim de curso, fotocélula e borda sensível.',
        'Explique por que o portão precisa parar ou reverter ao encontrar obstáculo.',
        'Diga como testar a proteção periodicamente sem arriscar ninguém.',
      ] },
      { dicas: [
        'Explique o que registrar: credencial, porta, data e hora, acesso negado.',
        'Discuta a guarda desses dados e a LGPD.',
        'Diga como sincronizar o relógio da controladora.',
      ] },
    ],
    armadilhas: [
      'Fechadura que prende na falta de energia em rota de fuga',
      'Portão sem fotocélula ou com ela desalinhada',
      'Registro com relógio errado',
    ],
    quiz: [
      { pergunta: 'O que a fotocélula do portão faz?', certa: 'Detecta obstáculo na passagem', erradas: ['Mede a velocidade do motor', 'Acende a luz da garagem'] },
      { pergunta: 'Quem decide se a porta abre?', certa: 'A controladora de acesso', erradas: ['A própria fechadura', 'O botão de saída'] },
      { pergunta: 'Qual lei trata dos dados pessoais do registro de acesso?', certa: 'LGPD', erradas: ['NR-12', 'Código de Trânsito'] },
    ],
    termos: [
      { termo: 'Controladora de acesso', definicao: 'Equipamento que recebe a credencial lida, decide se libera e aciona a fechadura.' },
      { termo: 'Borda sensível', definicao: 'Perfil na folha do portão que detecta contato e manda o portão parar ou voltar.' },
      { termo: 'Fail-safe', definicao: 'Fechadura que abre quando falta energia, usada onde a saída livre é prioridade.' },
    ],
  },

  'integracao-predial-bacnet-e-knx': {
    resumo: [
      'Onde BACnet, KNX e Modbus aparecem num prédio.',
      'Quando um gateway é a única saída entre sistemas.',
      'Como especificar a integração já no projeto.',
    ],
    secoes: [
      { dicas: [
        'Explique para que cada um é mais usado: BACnet em climatização e supervisão, KNX em luz e ambiente, Modbus em medidores e equipamentos.',
        'Diga os meios físicos comuns de cada um, como BACnet/IP e MS/TP, e o par trançado do KNX.',
        'Mostre um diagrama de um prédio com os três convivendo.',
      ] },
      { dicas: [
        'Explique o que um gateway faz: traduz pontos de um protocolo para outro.',
        'Diga o que se perde com gateway: tempo, pontos limitados, diagnóstico.',
        'Conte um caso em que o gateway resolveu e um em que atrapalhou.',
      ] },
      { dicas: [
        'Mostre como exigir na especificação o protocolo, a lista de pontos e a documentação.',
        'Explique o que é a lista de pontos e por que ela precisa estar no contrato.',
        'Diga como testar a integração na entrega.',
      ] },
    ],
    armadilhas: [
      'Comprar equipamento sem saber o protocolo',
      'Gateway sem lista de pontos definida',
      'Supor que todo BACnet conversa com todo BACnet',
    ],
    quiz: [
      { pergunta: 'Onde o KNX é mais comum?', certa: 'Iluminação e controle de ambiente', erradas: ['Robótica de solda', 'Controle de caldeiras industriais'] },
      { pergunta: 'O que um gateway faz?', certa: 'Traduz dados entre protocolos', erradas: ['Aumenta a velocidade da rede', 'Substitui o supervisório'] },
      { pergunta: 'O que deve constar na especificação da integração?', certa: 'Protocolo e lista de pontos', erradas: ['Só a marca do painel', 'Só a cor dos cabos'] },
    ],
    termos: [
      { termo: 'BACnet', definicao: 'Protocolo aberto de automação predial, muito usado em climatização e supervisão.' },
      { termo: 'KNX', definicao: 'Padrão aberto de automação de ambientes, usado para luz, persianas e clima.' },
      { termo: 'Lista de pontos', definicao: 'Relação dos dados que um sistema troca com outro, com nome, tipo e endereço de cada um.' },
    ],
  },

  'home-assistant-para-quem-vem-da-industria': {
    resumo: [
      'Por que escolher o Home Assistant e que problema resolver.',
      'Como foi a instalação e os primeiros dispositivos.',
      'O que se parece e o que difere da automação industrial.',
    ],
    secoes: [
      { dicas: [
        'Conte o que você queria resolver em casa.',
        'Explique por que escolheu uma plataforma local e aberta.',
        'Diga que alternativas considerou.',
      ] },
      { dicas: [
        'Conte em que hardware instalou e como foi.',
        'Liste os primeiros dispositivos e os protocolos, como Wi-Fi, Zigbee ou MQTT.',
        'Mostre com uma captura de tela a primeira automação que funcionou.',
      ] },
      { dicas: [
        'Compare com o CLP: gatilho, condição e ação versus ciclo de varredura.',
        'Fale de confiabilidade: o que acontece quando o servidor cai.',
        'Diga que hábito da indústria ajudou, como documentar e ter backup.',
      ] },
    ],
    armadilhas: [
      'Depender da nuvem do fabricante',
      'Automação crítica sem modo manual',
      'Não fazer backup da configuração',
    ],
    quiz: [
      { pergunta: 'Como é estruturada uma automação no Home Assistant?', certa: 'Gatilho, condição e ação', erradas: ['Entrada, CPU e saída', 'Rung, bobina e contato'] },
      { pergunta: 'Por que manter o comando manual?', certa: 'Para funcionar se o servidor cair', erradas: ['Porque a lei exige', 'Para economizar energia'] },
      { pergunta: 'Qual vantagem de uma plataforma local?', certa: 'Não depende da internet para funcionar', erradas: ['Dispensa qualquer configuração', 'Aceita só uma marca'] },
    ],
    termos: [
      { termo: 'Zigbee', definicao: 'Protocolo sem fio de baixo consumo usado por sensores e lâmpadas inteligentes em malha.' },
      { termo: 'MQTT', definicao: 'Protocolo leve de mensagens em que dispositivos publicam e assinam tópicos num broker.' },
    ],
  },

  /* ----------------------------------------------------------- segurança */

  'nr-12-em-linguagem-de-chao-de-fabrica': {
    resumo: [
      'O que a NR-12 cobre e a quem ela se aplica.',
      'Por que a apreciação de risco vem antes de qualquer proteção.',
      'A diferença entre proteção fixa, móvel e dispositivo de segurança.',
    ],
    secoes: [
      { dicas: [
        'Explique que a NR-12 trata da segurança no trabalho com máquinas e equipamentos, em todas as fases de uso.',
        'Diga que ela vale para máquinas novas e usadas, e para quem fabrica e quem usa.',
        'Evite citar item por número; foque no que a norma pede na prática.',
      ] },
      { dicas: [
        'Explique o que é identificar perigo, estimar e avaliar o risco.',
        'Cite a ABNT NBR ISO 12100 como referência de método.',
        'Mostre como o resultado da apreciação define as proteções.',
      ] },
      { dicas: [
        'Explique proteção fixa, que só sai com ferramenta, e móvel, que é intertravada.',
        'Dê exemplos de dispositivos: chave de intertravamento, cortina de luz, tapete, comando bimanual.',
        'Mostre com uma foto uma proteção móvel com chave de segurança.',
      ] },
    ],
    armadilhas: [
      'Instalar proteção sem apreciação de risco',
      'Proteção móvel sem intertravamento',
      'Chave de segurança burlada com imã ou fita',
    ],
    quiz: [
      { pergunta: 'O que vem antes de escolher as proteções?', certa: 'A apreciação de risco', erradas: ['A compra do CLP', 'A pintura da máquina'] },
      { pergunta: 'Como se remove uma proteção fixa?', certa: 'Só com uso de ferramenta', erradas: ['Com a mão, sem esforço', 'Pelo botão da IHM'] },
      { pergunta: 'Qual é um dispositivo de segurança?', certa: 'Cortina de luz', erradas: ['Sinaleiro verde', 'Botão de partida'] },
    ],
    termos: [
      { termo: 'Apreciação de risco', definicao: 'Processo de identificar perigos, estimar e avaliar riscos de uma máquina para decidir como reduzi-los.' },
      { termo: 'Intertravamento', definicao: 'Ligação entre a proteção móvel e o comando que impede o movimento perigoso com ela aberta.' },
      { termo: 'Cortina de luz', definicao: 'Conjunto de feixes de luz que para a máquina quando alguém interrompe a passagem.' },
    ],
  },

  'emergencia-rele-de-seguranca-e-categoria': {
    resumo: [
      'Por que a parada de emergência é diferente da parada comum.',
      'Como o relé de segurança garante redundância e monitoramento.',
      'O que são categoria e nível de desempenho, o PL.',
    ],
    secoes: [
      { dicas: [
        'Explique que a emergência é função complementar e não substitui as proteções.',
        'Diga por que ela não deve depender só de um CLP comum.',
        'Explique a diferença entre parada de categoria 0 e 1.',
      ] },
      { dicas: [
        'Explique a ligação em dois canais e por que um contato só não basta.',
        'Mostre como o relé monitora os contatores pelo contato de realimentação.',
        'Explique o rearme manual e por que a máquina não pode partir sozinha.',
      ] },
      { dicas: [
        'Apresente as categorias B, 1, 2, 3 e 4 e o PL de a até e da ISO 13849-1.',
        'Explique que o PL requerido sai da apreciação de risco.',
        'Diga por que componente de segurança sozinho não garante a categoria do circuito.',
      ] },
    ],
    armadilhas: [
      'Emergência só como entrada do CLP comum',
      'Um canal só com contator sem monitoramento',
      'Rearme que liga a máquina direto',
    ],
    quiz: [
      { pergunta: 'Por que o relé de segurança usa dois canais?', certa: 'Para uma falha não anular a parada', erradas: ['Para dobrar a velocidade da parada', 'Para economizar fiação'] },
      { pergunta: 'O que o rearme deve fazer?', certa: 'Liberar sem dar partida na máquina', erradas: ['Ligar a máquina direto', 'Apagar os alarmes do CLP'] },
      { pergunta: 'De onde vem o PL requerido?', certa: 'Da apreciação de risco', erradas: ['Do catálogo do relé', 'Da potência do motor'] },
    ],
    termos: [
      { termo: 'Relé de segurança', definicao: 'Módulo que supervisiona dispositivos de segurança com redundância e corta o circuito ao detectar falha.' },
      { termo: 'PL', definicao: 'Performance Level: nível de desempenho de uma função de segurança, de a até e, pela ISO 13849-1.' },
      { termo: 'Realimentação', definicao: 'Contato do contator lido pelo relé para confirmar que ele realmente abriu.' },
    ],
  },

  'bloqueio-e-etiquetagem-loto': {
    resumo: [
      'Por que bloquear todas as energias, não só a elétrica.',
      'O procedimento de bloqueio em ordem, passo a passo.',
      'Como devolver a máquina à operação com segurança.',
    ],
    secoes: [
      { dicas: [
        'Liste as energias: elétrica, pneumática, hidráulica, mecânica, térmica e gravidade.',
        'Explique energia residual: capacitor carregado, pressão presa, carga suspensa.',
        'Mostre com uma foto os pontos de bloqueio de uma máquina real.',
      ] },
      { dicas: [
        'Descreva a sequência: avisar, desligar, isolar, bloquear, etiquetar, dissipar e testar.',
        'Explique por que cada pessoa usa o próprio cadeado.',
        'Diga como testar a ausência de energia antes de começar.',
      ] },
      { dicas: [
        'Descreva a liberação: conferir ferramentas, recolocar proteções, avisar a equipe.',
        'Explique que só quem colocou o cadeado o retira.',
        'Diga como registrar o bloqueio e a liberação.',
      ] },
    ],
    armadilhas: [
      'Bloquear só a elétrica e esquecer o ar',
      'Um cadeado para a equipe toda',
      'Não testar a ausência de energia',
    ],
    quiz: [
      { pergunta: 'Qual passo vem depois de bloquear e etiquetar?', certa: 'Dissipar e testar a ausência de energia', erradas: ['Começar a manutenção direto', 'Religar para conferir'] },
      { pergunta: 'Quem retira o cadeado de bloqueio?', certa: 'Quem o colocou', erradas: ['Qualquer operador do turno', 'O primeiro que terminar'] },
      { pergunta: 'Qual é um exemplo de energia residual?', certa: 'Ar comprimido preso na linha', erradas: ['A luz do galpão', 'O sinal da rede Wi-Fi'] },
    ],
    termos: [
      { termo: 'LOTO', definicao: 'Lockout Tagout: bloqueio com cadeado e etiquetagem das fontes de energia antes da intervenção.' },
      { termo: 'Energia residual', definicao: 'Energia que continua armazenada na máquina mesmo desligada, como pressão, mola ou capacitor.' },
    ],
  },

  'nr-10-para-quem-mexe-em-painel': {
    resumo: [
      'Quem precisa de treinamento NR-10 e de que tipo.',
      'O que são zona de risco e zona controlada.',
      'A documentação que o painel e a instalação precisam ter.',
    ],
    secoes: [
      { dicas: [
        'Explique a diferença entre profissional qualificado, habilitado, capacitado e autorizado.',
        'Diga que há o curso básico e o complementar para o sistema elétrico de potência.',
        'Explique que a autorização é dada pela empresa, não só pelo certificado.',
      ] },
      { dicas: [
        'Explique zona de risco e zona controlada em torno de partes energizadas.',
        'Diga quem pode entrar em cada uma.',
        'Mostre com um desenho as zonas em volta de um barramento.',
      ] },
      { dicas: [
        'Explique o prontuário das instalações elétricas e o que costuma conter.',
        'Fale do diagrama unifilar atualizado e da identificação dos circuitos.',
        'Diga por que diagrama desatualizado é risco real.',
      ] },
    ],
    armadilhas: [
      'Achar que certificado é autorização',
      'Diagrama do painel desatualizado',
      'Trabalhar energizado sem necessidade',
    ],
    quiz: [
      { pergunta: 'Quem autoriza o trabalhador a atuar em eletricidade?', certa: 'A empresa, formalmente', erradas: ['A escola do curso', 'O próprio trabalhador'] },
      { pergunta: 'O que a NR-10 trata?', certa: 'Segurança em instalações e serviços com eletricidade', erradas: ['Ergonomia no posto de trabalho', 'Segurança em máquinas e equipamentos'] },
      { pergunta: 'Qual documento mostra os circuitos da instalação?', certa: 'Diagrama unifilar atualizado', erradas: ['Nota fiscal do painel', 'Manual do CLP'] },
    ],
    termos: [
      { termo: 'Zona de risco', definicao: 'Entorno de parte energizada onde só entram profissionais autorizados, com técnicas e ferramentas adequadas.' },
      { termo: 'Diagrama unifilar', definicao: 'Desenho que representa a instalação elétrica com uma linha por circuito, mostrando proteções e cargas.' },
      { termo: 'SEP', definicao: 'Sistema Elétrico de Potência: geração, transmissão e distribuição de energia, com treinamento complementar próprio.' },
    ],
  },

  /* ------------------------------------------------------------ robótica */

  'robo-industrial-ou-cobot': {
    resumo: [
      'O que colaborativo quer dizer de verdade.',
      'Como velocidade, carga e alcance decidem a escolha.',
      'Por que o custo é da célula inteira, não só do robô.',
    ],
    secoes: [
      { dicas: [
        'Explique que colaborativa é a aplicação, avaliada por risco, e não só o robô.',
        'Cite as referências ISO 10218 e ISO/TS 15066 para robôs e aplicações colaborativas.',
        'Diga por que uma ferramenta afiada pode tirar o caráter colaborativo da célula.',
      ] },
      { dicas: [
        'Compare as limitações do cobot em velocidade e carga com as do robô industrial.',
        'Explique como o tempo de ciclo exigido orienta a escolha.',
        'Diga como considerar o peso da garra e do produto na carga.',
      ] },
      { dicas: [
        'Liste o que entra: garra, base, proteções, integração, programação e treinamento.',
        'Explique quando o robô industrial com cerca sai mais barato no total.',
        'Mostre em uma tabela o custo da célula dos dois lados.',
      ] },
    ],
    armadilhas: [
      'Achar que cobot dispensa análise de risco',
      'Esquecer o peso da garra na carga',
      'Orçar só o braço',
    ],
    quiz: [
      { pergunta: 'O que torna uma célula colaborativa?', certa: 'A aplicação avaliada por risco', erradas: ['A cor do robô', 'O robô ser pequeno'] },
      { pergunta: 'O que entra no cálculo de carga do robô?', certa: 'Peso do produto e da garra', erradas: ['Só o peso do produto', 'Só o peso da base'] },
      { pergunta: 'Quando o robô industrial costuma vencer?', certa: 'Ciclo rápido e carga alta', erradas: ['Tarefa lenta com pessoas ao lado', 'Pouco espaço sem proteção'] },
    ],
    termos: [
      { termo: 'Cobot', definicao: 'Robô projetado para aplicações em que pode dividir espaço com pessoas, com limites de força e velocidade.' },
      { termo: 'Efetuador', definicao: 'Ferramenta na ponta do robô, como garra, ventosa ou tocha de solda.' },
      { termo: 'Alcance', definicao: 'Distância máxima que o robô atinge a partir da base.' },
    ],
  },

  'integrar-robo-com-clp': {
    resumo: [
      'O conjunto mínimo de sinais entre robô e CLP.',
      'Como montar o handshake para ninguém esperar para sempre.',
      'Como parar e retomar o ciclo com segurança.',
    ],
    secoes: [
      { dicas: [
        'Liste os sinais do robô: pronto, em ciclo, fim de ciclo, falha.',
        'Liste os sinais do CLP: iniciar, parar, reset e número do programa.',
        'Mostre em uma tabela cada sinal, direção e significado.',
      ] },
      { dicas: [
        'Explique o handshake: pedido, confirmação e retorno a zero.',
        'Mostre com um diagrama de tempo quem espera quem.',
        'Explique por que usar tempo máximo de espera com alarme.',
      ] },
      { dicas: [
        'Explique que a parada de segurança vai pelo circuito de segurança, não pelos sinais comuns.',
        'Diga como retomar depois de uma parada no meio do ciclo.',
        'Conte como tratar o robô fora da posição de repouso.',
      ] },
    ],
    armadilhas: [
      'Sinal de pulso que o CLP não enxerga',
      'Handshake sem tempo máximo',
      'Parada de segurança pelo sinal comum',
    ],
    quiz: [
      { pergunta: 'Para que serve o handshake?', certa: 'Confirmar que cada lado recebeu o pedido', erradas: ['Aumentar a velocidade do robô', 'Dispensar o circuito de segurança'] },
      { pergunta: 'Por onde deve passar a parada de segurança?', certa: 'Pelo circuito de segurança dedicado', erradas: ['Por uma saída comum do CLP', 'Pela rede de dados da IHM'] },
      { pergunta: 'O que fazer quando o robô não responde a tempo?', certa: 'Gerar alarme por tempo máximo', erradas: ['Esperar indefinidamente', 'Reiniciar o CLP'] },
    ],
    termos: [
      { termo: 'Handshake', definicao: 'Troca de sinais em que um lado pede, o outro confirma e ambos voltam ao estado inicial.' },
      { termo: 'Posição de repouso', definicao: 'Posição segura e conhecida do robô, de onde ele pode iniciar um ciclo.' },
      { termo: 'Watchdog', definicao: 'Temporizador que gera falha quando uma resposta esperada não chega no tempo.' },
    ],
  },

  'visao-de-maquina-quando-uma-camera-resolve': {
    resumo: [
      'Os quatro problemas típicos: presença, medida, leitura e posição.',
      'Por que a iluminação decide metade do projeto.',
      'Quando basta um sensor de visão e quando precisa de sistema.',
    ],
    secoes: [
      { dicas: [
        'Dê um exemplo de cada: tampa presente, diâmetro, código lido, posição para o robô pegar.',
        'Explique por que medida exige calibração e resolução adequada.',
        'Diga que problema costuma ser pedido e não é para câmera.',
      ] },
      { dicas: [
        'Compare iluminação frontal, de fundo e difusa, com o que cada uma revela.',
        'Explique por que luz ambiente e reflexo derrubam a inspeção.',
        'Mostre com duas fotos o mesmo produto com luz certa e errada.',
      ] },
      { dicas: [
        'Explique o sensor de visão: tudo integrado, tarefas simples, configuração rápida.',
        'Explique o sistema de visão: mais flexível, mais ferramentas, mais programação.',
        'Diga como decidir pelo número de inspeções e variação do produto.',
      ] },
    ],
    armadilhas: [
      'Escolher a câmera antes da iluminação',
      'Testar só com amostras boas',
      'Esquecer a variação de cor e posição do produto',
    ],
    quiz: [
      { pergunta: 'O que mais costuma decidir se a inspeção funciona?', certa: 'A iluminação', erradas: ['A marca do cabo', 'A cor do painel'] },
      { pergunta: 'Qual tarefa exige calibração da câmera?', certa: 'Medir dimensão', erradas: ['Verificar presença', 'Detectar cor dominante'] },
      { pergunta: 'Quando basta um sensor de visão?', certa: 'Em inspeções simples e repetidas', erradas: ['Em muitas variações de produto', 'Em guiar robô com itens variados'] },
    ],
    termos: [
      { termo: 'Backlight', definicao: 'Iluminação por trás do objeto, que destaca o contorno em silhueta.' },
      { termo: 'Calibração', definicao: 'Ajuste que relaciona pixels da imagem a medidas reais, como milímetros.' },
    ],
  },

  /* ------------------------------------------------------------- negócio */

  'orcar-projeto-de-automacao': {
    resumo: [
      'Os quatro blocos do orçamento: material, engenharia, montagem e partida.',
      'As horas que ninguém lembra e que comem a margem.',
      'Como tratar risco e margem de forma explícita.',
    ],
    secoes: [
      { dicas: [
        'Explique cada bloco e o que costuma entrar nele.',
        'Mostre como levantar o material a partir da lista de entradas e saídas.',
        'Diga por que a partida em campo merece linha própria.',
      ] },
      { dicas: [
        'Liste as horas invisíveis: reunião, documentação, teste em bancada, deslocamento, espera no cliente.',
        'Conte um projeto em que essas horas comeram o lucro.',
        'Explique como registrar horas reais para orçar melhor o próximo.',
      ] },
      { dicas: [
        'Explique a diferença entre contingência para risco e margem de lucro.',
        'Diga como identificar risco: cliente novo, máquina sem documentação, prazo curto.',
        'Explique o efeito de impostos e prazo de pagamento no preço.',
      ] },
      { dicas: [
        'Mostre a estrutura da planilha: blocos, horas por função, custo-hora e totais.',
        'Explique que os valores do exemplo são ilustrativos e o leitor usa os dele.',
        'Mostre com uma captura de tela a planilha preenchida.',
      ] },
    ],
    armadilhas: [
      'Orçar só o material',
      'Esquecer deslocamento e estadia',
      'Misturar contingência com lucro',
    ],
    quiz: [
      { pergunta: 'Qual destas é uma hora invisível?', certa: 'Documentação do projeto', erradas: ['Compra do CLP', 'Preço do painel'] },
      { pergunta: 'Para que serve a contingência?', certa: 'Cobrir riscos previstos do projeto', erradas: ['Aumentar o lucro garantido', 'Pagar o material principal'] },
      { pergunta: 'Como orçar melhor o próximo projeto?', certa: 'Registrar as horas reais gastas', erradas: ['Copiar o preço do concorrente', 'Reduzir a margem sempre'] },
    ],
    termos: [
      { termo: 'Contingência', definicao: 'Reserva no orçamento para cobrir riscos identificados, separada da margem de lucro.' },
      { termo: 'Custo-hora', definicao: 'Quanto custa uma hora de trabalho, incluindo salário, encargos e despesas fixas.' },
      { termo: 'Comissionamento', definicao: 'Etapa de testar e colocar o sistema em operação no local do cliente.' },
    ],
  },

  'proposta-tecnica-que-o-cliente-entende': {
    resumo: [
      'Como escrever escopo e fora de escopo sem ambiguidade.',
      'O critério de aceite que encerra o projeto.',
      'Como amarrar o prazo ao que depende do cliente.',
    ],
    secoes: [
      { dicas: [
        'Mostre como listar o que será entregue em itens verificáveis.',
        'Explique por que o fora de escopo evita discussão no fim.',
        'Dê exemplos comuns de fora de escopo: obra civil, rede do cliente, licenças.',
      ] },
      { dicas: [
        'Explique o que é critério de aceite e dê um exemplo mensurável.',
        'Diga como registrar o aceite, com teste e assinatura.',
        'Conte um projeto que não fechava por falta desse critério.',
      ] },
      { dicas: [
        'Liste o que costuma depender do cliente: parada da máquina, acesso, informação, aprovação.',
        'Mostre como escrever o prazo contado a partir dessas entregas.',
        'Explique como registrar atraso causado pelo cliente.',
      ] },
    ],
    armadilhas: [
      'Escopo em linguagem vaga',
      'Proposta sem critério de aceite',
      'Prazo fixo que ignora a parada da máquina',
    ],
    quiz: [
      { pergunta: 'Para que serve o fora de escopo?', certa: 'Deixar claro o que não será entregue', erradas: ['Aumentar o valor da proposta', 'Substituir o critério de aceite'] },
      { pergunta: 'Como deve ser o critério de aceite?', certa: 'Mensurável e verificável em teste', erradas: ['Subjetivo e aberto', 'Definido só no fim'] },
      { pergunta: 'De onde contar o prazo?', certa: 'Das entregas que dependem do cliente', erradas: ['Da data da primeira reunião', 'Da data do orçamento'] },
    ],
    termos: [
      { termo: 'Escopo', definicao: 'Descrição do que será entregue no projeto, em itens que se possam verificar.' },
      { termo: 'Critério de aceite', definicao: 'Condição objetiva que, quando atendida, confirma que a entrega está concluída.' },
    ],
  },

  'vender-retrofit-com-antes-e-depois': {
    resumo: [
      'Como documentar a máquina antes do retrofit.',
      'O que foi feito, contado de forma clara.',
      'O número que mudou e como apresentá-lo ao cliente.',
    ],
    secoes: [
      { dicas: [
        'Descreva a máquina e o problema: paradas, falta de componentes de reposição, falhas.',
        'Conte que dado você coletou antes, e por quanto tempo.',
        'Mostre com uma foto o painel antes.',
      ] },
      { dicas: [
        'Liste o que foi trocado e o que foi mantido.',
        'Explique como a troca foi feita para parar a máquina o mínimo possível.',
        'Mostre com uma foto o painel depois.',
      ] },
      { dicas: [
        'Diga qual indicador mudou: tempo parado, refugo, consumo, tempo de ciclo.',
        'Mostre o antes e depois medidos no mesmo critério.',
        'Explique como separou o efeito do retrofit de outras mudanças.',
      ] },
      { dicas: [
        'Conte como apresentou: para quem, em que formato, com que número na frente.',
        'Explique como traduziu o ganho em dinheiro para o cliente.',
        'Diga o que o cliente perguntou e o que você responderia melhor.',
      ] },
    ],
    armadilhas: [
      'Não medir antes de começar',
      'Comparar períodos diferentes',
      'Apresentar só a parte técnica',
    ],
    quiz: [
      { pergunta: 'O que é indispensável para provar o ganho do retrofit?', certa: 'Medir o antes com o mesmo critério', erradas: ['Fotos bonitas do painel novo', 'Lista de componentes trocados'] },
      { pergunta: 'Que indicador costuma convencer?', certa: 'Tempo de máquina parada', erradas: ['Quantidade de fios trocados', 'Marca do CLP novo'] },
      { pergunta: 'Como apresentar o ganho ao gestor?', certa: 'Traduzido em dinheiro ou produção', erradas: ['Só com o diagrama elétrico', 'Só com o código do CLP'] },
    ],
    termos: [
      { termo: 'Retrofit', definicao: 'Modernização de uma máquina existente trocando comando, controle ou acionamento, sem trocar a máquina inteira.' },
      { termo: 'Obsolescência', definicao: 'Situação em que um componente deixa de ser fabricado e fica difícil de repor.' },
    ],
  },

  'do-tecnico-ao-integrador': {
    resumo: [
      'O momento em que o técnico passou a responder pelo projeto.',
      'O que precisou aprender fora da parte técnica.',
      'O que faria diferente na transição.',
    ],
    secoes: [
      { dicas: [
        'Conte a situação em que você deixou de só executar.',
        'Diga o que motivou a mudança: oportunidade, cliente, necessidade.',
        'Explique qual foi a primeira responsabilidade nova.',
      ] },
      { dicas: [
        'Liste o que aprendeu: orçar, negociar, contrato, cobrança, gestão de equipe.',
        'Conte um erro caro que ensinou uma dessas coisas.',
        'Diga onde buscou esse conhecimento.',
      ] },
      { dicas: [
        'Diga o que faria mais cedo e o que evitaria.',
        'Conte que conselho daria a um técnico nessa passagem.',
        'Fale da relação entre trabalho técnico e administrativo hoje.',
      ] },
    ],
    armadilhas: [
      'Cobrar só as horas de campo',
      'Começar sem contrato escrito',
      'Querer fazer tudo sozinho',
    ],
    quiz: [
      { pergunta: 'O que muda ao virar integrador?', certa: 'Responder pelo projeto inteiro', erradas: ['Só trabalhar em bancada', 'Deixar de ter clientes'] },
      { pergunta: 'Qual habilidade não técnica é essencial?', certa: 'Orçar e negociar', erradas: ['Soldar componentes', 'Programar em Ladder'] },
      { pergunta: 'Por que ter contrato escrito?', certa: 'Para definir escopo e pagamento', erradas: ['Para dispensar o orçamento', 'Para evitar o teste final'] },
    ],
    termos: [
      { termo: 'Integrador', definicao: 'Empresa ou profissional que projeta, monta e entrega a solução de automação completa.' },
      { termo: 'Fluxo de caixa', definicao: 'Controle de quando o dinheiro entra e sai, que mostra se há como pagar as contas do mês.' },
    ],
  },

  'portfolio-de-quem-trabalha-com-automacao': {
    resumo: [
      'O que mostrar e o que proteger do cliente no portfólio.',
      'A combinação de foto, número e descrição que convence.',
      'Onde publicar para ser encontrado.',
    ],
    secoes: [
      { dicas: [
        'Explique o que não mostrar: nome, logotipo, produto e processo do cliente sem autorização.',
        'Diga como pedir autorização e o que fazer quando há contrato de sigilo.',
        'Mostre como descrever um projeto de forma genérica sem perder valor.',
      ] },
      { dicas: [
        'Mostre a estrutura: problema, solução, resultado medido.',
        'Dê dicas de foto: painel organizado, fundo limpo, sem dado sensível na tela.',
        'Explique como usar um número mesmo sem expor o cliente.',
      ] },
      { dicas: [
        'Compare opções como perfil profissional, site próprio e repositório de código.',
        'Explique por que um lugar bem cuidado vale mais que vários abandonados.',
        'Diga como manter o portfólio atualizado sem esforço grande.',
      ] },
    ],
    armadilhas: [
      'Foto com logotipo ou tela do cliente',
      'Projeto sem resultado descrito',
      'Portfólio parado há anos',
    ],
    quiz: [
      { pergunta: 'O que não publicar sem autorização?', certa: 'O nome e o processo do cliente', erradas: ['A descrição genérica da solução', 'A sua participação no projeto'] },
      { pergunta: 'Qual estrutura descreve bem um projeto?', certa: 'Problema, solução e resultado', erradas: ['Data, local e preço', 'Marca, modelo e cor'] },
      { pergunta: 'Por que manter um único lugar bem cuidado?', certa: 'Passa mais confiança que vários abandonados', erradas: ['Custa mais caro ter vários', 'É exigido por lei'] },
    ],
    termos: [
      { termo: 'Acordo de confidencialidade', definicao: 'Contrato que proíbe divulgar informações do cliente, também chamado NDA.' },
      { termo: 'Estudo de caso', definicao: 'Descrição de um projeto com problema, solução e resultado, usada para mostrar competência.' },
    ],
  },
};
