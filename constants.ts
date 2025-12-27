import { User, UserRole, Session, StreamSource, Poll, Message, Question, Room, Survey, Language, UserActivity, Project } from './types';

export const TRANSLATIONS = {
  pt: {
    login: {
      title: 'Selecione seu Perfil de Acesso',
      attendee: 'Participante',
      attendeeDesc: 'Entrar no evento ao vivo',
      producer: 'Produtor / Admin',
      producerDesc: 'Acessar sala de controle',
      enter: 'Entrar',
      welcome: 'Bem-vindo ao'
    },
    nav: {
      stage: 'Palco Principal',
      rooms: 'Salas',
      agenda: 'Agenda',
      networking: 'Networking',
      admin: 'Controle',
      analytics: 'Analytics',
      settings: 'Config',
      signout: 'Sair',
      producer: 'Ferramentas de Produção'
    },
    stage: {
      live: 'AO VIVO',
      viewers: 'Espectadores',
      about: 'Sobre a Sessão',
      track: 'Trilha',
      level: 'Nível',
      addToCalendar: 'Adicionar à Agenda',
      share: 'Compartilhar'
    },
    engagement: {
      chat: 'Chat',
      qa: 'Q&A',
      polls: 'Enquetes',
      survey: 'Pesquisa',
      liveChat: 'Chat ao Vivo',
      aiSummary: 'Resumo IA',
      analyzing: 'Analisando...',
      typeMessage: 'Digite sua mensagem...',
      topQuestions: 'Principais Perguntas',
      askQuestion: 'Fazer Pergunta',
      answered: 'Respondida',
      currentPoll: 'Enquete Atual',
      votes: 'votos',
      submitFeedback: 'Enviar Feedback',
      thankYou: 'Obrigado!',
      feedbackRecorded: 'Seu feedback foi registrado.',
      noSurvey: 'Nenhuma pesquisa ativa no momento.',
      connection: 'Conexão Excelente'
    },
    admin: {
      title: 'MCR - Master Control Room',
      onAir: 'NO AR',
      streamHealth: 'Sinal & Fonte',
      activeViewers: 'Audiência Real-Time',
      registered: 'Inscritos',
      aiDirector: 'Diretor IA',
      createPoll: 'Lançar Enquete',
      createSurvey: 'Lançar Pesquisa',
      drafting: 'Gerando...',
      dangerZone: 'Zona Crítica',
      restart: 'Reiniciar Sinal',
      endEvent: 'Encerrar Transmissão',
      bitrate: 'Bitrate',
      fps: 'FPS',
      dropped: 'Perda de Quadros',
      back: 'Voltar ao Login'
    },
    reports: {
      title: 'Relatórios de Usuários',
      export: 'Exportar CSV',
      searchPlaceholder: 'Buscar por nome, email ou ID...',
      columns: {
        user: 'Usuário',
        role: 'Perfil',
        session: 'Sessão',
        engagement: 'Engajamento',
        location: 'Localização',
        actions: 'Ações'
      },
      details: {
        techInfo: 'Informações Técnicas',
        activityLog: 'Histórico de Atividades',
        questions: 'Perguntas Realizadas',
        browser: 'Navegador',
        device: 'Dispositivo',
        ip: 'Endereço IP',
        connection: 'Conexão',
        login: 'Entrada',
        logout: 'Saída',
        duration: 'Duração'
      }
    },
    rooms: {
      title: 'Sessões ao Vivo & Breakouts',
      subtitle: 'Escolha uma trilha para entrar nas sessões interativas.',
      join: 'Entrar na Sessão'
    },
    projects: {
      title: 'Gerenciar Projetos',
      createNew: 'Novo Projeto',
      selectProject: 'Selecionar Projeto',
      deleteProject: 'Excluir Projeto',
      projectName: 'Nome do Projeto',
      projectDescription: 'Descrição',
      status: 'Status',
      draft: 'Rascunho',
      live: 'Ao Vivo',
      ended: 'Encerrado',
      onDemand: 'Sob Demanda',
      onDemandDesc: 'Disponível para visualização após término',
      enableOnDemand: 'Ativar On-Demand',
      disableOnDemand: 'Desativar On-Demand',
      currentProject: 'Projeto Atual',
      noProjects: 'Nenhum projeto criado',
      confirmDelete: 'Tem certeza que deseja excluir este projeto?',
      create: 'Criar',
      cancel: 'Cancelar',
      save: 'Salvar',
      viewers: 'Visualizações',
      createdAt: 'Criado em'
    }
  },
  en: {
    login: {
      title: 'Select Access Profile',
      attendee: 'Attendee',
      attendeeDesc: 'Enter live event experience',
      producer: 'Producer / Admin',
      producerDesc: 'Access master control room',
      enter: 'Enter',
      welcome: 'Welcome to'
    },
    nav: {
      stage: 'Main Stage',
      rooms: 'Breakout Rooms',
      agenda: 'Agenda',
      networking: 'Networking',
      admin: 'Control Room',
      analytics: 'Analytics',
      settings: 'Settings',
      signout: 'Sign Out',
      producer: 'Producer Tools'
    },
    stage: {
      live: 'LIVE',
      viewers: 'Viewers',
      about: 'About This Session',
      track: 'Track',
      level: 'Level',
      addToCalendar: 'Add to Calendar',
      share: 'Share'
    },
    engagement: {
      chat: 'Chat',
      qa: 'Q&A',
      polls: 'Polls',
      survey: 'Survey',
      liveChat: 'Live Chat',
      aiSummary: 'AI Summary',
      analyzing: 'Analyzing...',
      typeMessage: 'Type a message...',
      topQuestions: 'Top Questions',
      askQuestion: 'Ask Question',
      answered: 'Answered',
      currentPoll: 'Current Poll',
      votes: 'votes',
      submitFeedback: 'Submit Feedback',
      thankYou: 'Thank You!',
      feedbackRecorded: 'Your feedback has been recorded.',
      noSurvey: 'No active surveys at this moment.',
      connection: 'Excellent Connection'
    },
    admin: {
      title: 'MCR - Master Control Room',
      onAir: 'ON AIR',
      streamHealth: 'Signal & Source',
      activeViewers: 'Real-Time Audience',
      registered: 'Registered',
      aiDirector: 'AI Director',
      createPoll: 'Launch Poll',
      createSurvey: 'Launch Survey',
      drafting: 'Drafting...',
      dangerZone: 'Critical Zone',
      restart: 'Restart Signal',
      endEvent: 'Cut Transmission',
      bitrate: 'Bitrate',
      fps: 'FPS',
      dropped: 'Dropped Frames',
      back: 'Back to Login'
    },
    reports: {
      title: 'User Reports',
      export: 'Export CSV',
      searchPlaceholder: 'Search by name, email or ID...',
      columns: {
        user: 'User',
        role: 'Role',
        session: 'Session',
        engagement: 'Engagement',
        location: 'Location',
        actions: 'Actions'
      },
      details: {
        techInfo: 'Technical Info',
        activityLog: 'Activity Log',
        questions: 'Questions Asked',
        browser: 'Browser',
        device: 'Device',
        ip: 'IP Address',
        connection: 'Connection',
        login: 'Login',
        logout: 'Logout',
        duration: 'Duration'
      }
    },
    rooms: {
      title: 'Live Sessions & Breakouts',
      subtitle: 'Choose a track to join live interactive sessions.',
      join: 'Join Session'
    },
    projects: {
      title: 'Manage Projects',
      createNew: 'New Project',
      selectProject: 'Select Project',
      deleteProject: 'Delete Project',
      projectName: 'Project Name',
      projectDescription: 'Description',
      status: 'Status',
      draft: 'Draft',
      live: 'Live',
      ended: 'Ended',
      onDemand: 'On Demand',
      onDemandDesc: 'Available for viewing after event ends',
      enableOnDemand: 'Enable On-Demand',
      disableOnDemand: 'Disable On-Demand',
      currentProject: 'Current Project',
      noProjects: 'No projects created',
      confirmDelete: 'Are you sure you want to delete this project?',
      create: 'Create',
      cancel: 'Cancel',
      save: 'Save',
      viewers: 'Views',
      createdAt: 'Created at'
    }
  }
};

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'Alex Rivera',
  role: UserRole.ATTENDEE,
  avatar: 'https://picsum.photos/200',
  company: 'TechCorp Global',
  title: 'CTO',
  status: 'ONLINE'
};

export const MOCK_SESSION: Session = {
  id: 's1',
  title: 'TEST: Live Streaming Video Test',
  description: 'Testing live streaming functionality with YouTube video source (https://www.youtube.com/watch?v=VGPlvmMjPtE). This session is configured to simulate a live event stream before backend setup is complete.',
  speaker: 'Test Stream',
  startTime: '10:00',
  endTime: '11:00',
  status: 'LIVE',
  viewers: 12450
};

export const MOCK_ROOMS: Room[] = [
  { id: 'r1', name: 'Palco Principal', speaker: 'Test Stream', topic: 'Live Streaming Video Test', viewers: 12450, thumbnail: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80', isMainStage: true },
  { id: 'r2', name: 'Sala A: Segurança', speaker: 'James T.', topic: 'Streaming Zero Trust', viewers: 450, thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80' },
  { id: 'r3', name: 'Sala B: Engajamento', speaker: 'Emily R.', topic: 'Estratégias de Gamificação', viewers: 890, thumbnail: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&q=80' },
  { id: 'r4', name: 'Workshop: React 19', speaker: 'Dan A.', topic: 'Sessão de Live Coding', viewers: 1200, thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80' },
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Live Streaming Test Event',
    description: 'Testing live streaming functionality with YouTube video source.',
    status: 'LIVE',
    isOnDemand: false,
    createdAt: Date.now() - 86400000,
    startedAt: Date.now() - 3600000,
    youtubeVideoId: 'cu4xksmv7ho',
    thumbnail: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80',
    viewers: 12450
  },
  {
    id: 'proj-2',
    name: 'Tech Conference 2024',
    description: 'Annual technology conference with keynotes and workshops.',
    status: 'ENDED',
    isOnDemand: true,
    createdAt: Date.now() - 604800000,
    startedAt: Date.now() - 604800000 + 3600000,
    endedAt: Date.now() - 604800000 + 10800000,
    youtubeVideoId: 'dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    viewers: 8500
  },
  {
    id: 'proj-3',
    name: 'Product Launch Event',
    description: 'New product reveal and demo session.',
    status: 'ENDED',
    isOnDemand: false,
    createdAt: Date.now() - 1209600000,
    startedAt: Date.now() - 1209600000 + 7200000,
    endedAt: Date.now() - 1209600000 + 14400000,
    youtubeVideoId: 'jNQXAC9IVRw',
    thumbnail: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80',
    viewers: 5200
  },
  {
    id: 'proj-4',
    name: 'Upcoming Webinar',
    description: 'Draft event for future webinar.',
    status: 'DRAFT',
    isOnDemand: false,
    createdAt: Date.now() - 172800000,
    thumbnail: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80',
    viewers: 0
  }
];

export const INITIAL_SURVEY: Survey = {
  id: 'srv1',
  title: 'Feedback da Sessão',
  isActive: true,
  fields: [
    { id: 'f1', question: 'Como você avalia a qualidade do vídeo?', type: 'RATING' },
    { id: 'f2', question: 'Qual foi o principal aprendizado para você?', type: 'TEXT' }
  ]
};

export const INITIAL_MESSAGES: Message[] = [
  { id: 'm1', userId: 'u2', userName: 'João Silva', userRole: UserRole.ATTENDEE, text: 'O áudio está ótimo! Olá de São Paulo.', timestamp: Date.now() - 60000 },
  { id: 'm2', userId: 'u3', userName: 'Maria Santos', userRole: UserRole.ATTENDEE, text: 'Ansiosa pela revelação do produto.', timestamp: Date.now() - 45000 },
  { id: 'm3', userId: 'u4', userName: 'Bot Moderador', userRole: UserRole.MODERATOR, text: 'Bem-vindos a todos! Por favor, usem a aba de Q&A para perguntas.', timestamp: Date.now() - 30000, isPinned: true },
];

export const INITIAL_QUESTIONS: Question[] = [
  { id: 'q1', userId: 'u5', userName: 'Miguel Chen', text: 'Essa plataforma suporta hospedagem on-premise?', upvotes: 45, isAnswered: false, timestamp: Date.now() - 120000 },
  { id: 'q2', userId: 'u6', userName: 'Sara Jonas', text: 'Como funciona a sumarização por IA com a LGPD?', upvotes: 23, isAnswered: true, timestamp: Date.now() - 300000 },
];

export const INITIAL_POLL: Poll = {
  id: 'p1',
  question: 'Qual recurso é mais crítico para seus eventos?',
  isActive: true,
  totalVotes: 850,
  options: [
    { id: 'opt1', text: 'Baixa Latência (<500ms)', votes: 300 },
    { id: 'opt2', text: 'Analytics com IA', votes: 150 },
    { id: 'opt3', text: 'Ferramentas de Engajamento', votes: 400 },
  ]
};

export const MOCK_USER_ACTIVITIES: UserActivity[] = [
  {
    userId: 'u1',
    userName: 'Alex Rivera',
    email: 'alex.rivera@techcorp.com',
    role: UserRole.ATTENDEE,
    loginTime: Date.now() - 3600000,
    sessionDuration: 60,
    ipAddress: '192.168.1.1',
    location: 'São Paulo, BR',
    device: 'MacBook Pro',
    browser: 'Chrome 120.0',
    connectionType: 'Fiber 500Mbps',
    questionsAsked: 2,
    pollsAnswered: 1,
    engagementScore: 85,
    history: [
      { timestamp: Date.now() - 3600000, action: 'LOGIN', details: 'Via Email' },
      { timestamp: Date.now() - 3000000, action: 'JOIN_ROOM', details: 'Main Stage' },
      { timestamp: Date.now() - 2500000, action: 'VOTE_POLL', details: 'Poll #1' },
      { timestamp: Date.now() - 1000000, action: 'ASK_QUESTION', details: 'About API limits' }
    ]
  },
  {
    userId: 'u2',
    userName: 'João Silva',
    email: 'joao.silva@email.com',
    role: UserRole.ATTENDEE,
    loginTime: Date.now() - 1800000,
    sessionDuration: 30,
    ipAddress: '200.100.50.25',
    location: 'Rio de Janeiro, BR',
    device: 'iPhone 15',
    browser: 'Safari Mobile',
    connectionType: '5G',
    questionsAsked: 0,
    pollsAnswered: 1,
    engagementScore: 60,
    history: [
      { timestamp: Date.now() - 1800000, action: 'LOGIN', details: 'Via Social' },
      { timestamp: Date.now() - 1700000, action: 'JOIN_ROOM', details: 'Main Stage' },
      { timestamp: Date.now() - 500000, action: 'CHAT_MESSAGE', details: 'Hello everyone!' }
    ]
  },
  {
    userId: 'u3',
    userName: 'Maria Santos',
    email: 'maria.s@enterprise.com',
    role: UserRole.ATTENDEE,
    loginTime: Date.now() - 7200000,
    logoutTime: Date.now() - 100000,
    sessionDuration: 118,
    ipAddress: '177.20.10.5',
    location: 'Curitiba, BR',
    device: 'Windows 11 PC',
    browser: 'Edge',
    connectionType: 'Cable',
    questionsAsked: 5,
    pollsAnswered: 3,
    engagementScore: 95,
    history: [
      { timestamp: Date.now() - 7200000, action: 'LOGIN' },
      { timestamp: Date.now() - 7000000, action: 'JOIN_ROOM', details: 'Workshop React' },
      { timestamp: Date.now() - 3600000, action: 'SWITCH_ROOM', details: 'Main Stage' },
      { timestamp: Date.now() - 100000, action: 'LOGOUT' }
    ]
  },
  {
    userId: 'u5',
    userName: 'Miguel Chen',
    email: 'mchen@startup.io',
    role: UserRole.ATTENDEE,
    loginTime: Date.now() - 900000,
    sessionDuration: 15,
    ipAddress: '189.30.20.1',
    location: 'Belo Horizonte, BR',
    device: 'Linux Desktop',
    browser: 'Firefox',
    connectionType: 'Fiber',
    questionsAsked: 1,
    pollsAnswered: 0,
    engagementScore: 40,
    history: [
      { timestamp: Date.now() - 900000, action: 'LOGIN' },
      { timestamp: Date.now() - 850000, action: 'JOIN_ROOM', details: 'Main Stage' },
      { timestamp: Date.now() - 120000, action: 'ASK_QUESTION', details: 'On-premise support?' }
    ]
  }
];