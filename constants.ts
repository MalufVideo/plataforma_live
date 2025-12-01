import { User, UserRole, Session, StreamSource, Poll, Message, Question, Room, Survey, Language } from './types';

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
    rooms: {
      title: 'Sessões ao Vivo & Breakouts',
      subtitle: 'Escolha uma trilha para entrar nas sessões interativas.',
      join: 'Entrar na Sessão'
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
    rooms: {
      title: 'Live Sessions & Breakouts',
      subtitle: 'Choose a track to join live interactive sessions.',
      join: 'Join Session'
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
  title: 'Keynote: O Futuro do Streaming Corporativo',
  description: 'Junte-se a nós para um mergulho profundo na arquitetura de baixa latência, integração de IA e o futuro dos eventos híbridos. Esta sessão aborda a escalabilidade do WebRTC vs HLS e como proteger seu conteúdo corporativo.',
  speaker: 'Sarah Connor',
  startTime: '10:00',
  endTime: '11:00',
  status: 'LIVE',
  viewers: 12450
};

export const MOCK_ROOMS: Room[] = [
  { id: 'r1', name: 'Palco Principal', speaker: 'Sarah Connor', topic: 'Keynote', viewers: 12450, thumbnail: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80', isMainStage: true },
  { id: 'r2', name: 'Sala A: Segurança', speaker: 'James T.', topic: 'Streaming Zero Trust', viewers: 450, thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80' },
  { id: 'r3', name: 'Sala B: Engajamento', speaker: 'Emily R.', topic: 'Estratégias de Gamificação', viewers: 890, thumbnail: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=800&q=80' },
  { id: 'r4', name: 'Workshop: React 19', speaker: 'Dan A.', topic: 'Sessão de Live Coding', viewers: 1200, thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80' },
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