import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { VideoPlayer } from './components/VideoPlayer';
import { EngagementPanel } from './components/EngagementPanel';
import { AdminConsole } from './pages/AdminConsole';
import { MasterAdminDashboard } from './pages/MasterAdminDashboard';
import { BreakoutRooms } from './pages/BreakoutRooms';
import { LoginPage } from './pages/LoginPage';
import { ChannelPage } from './pages/ChannelPage';
import { PublicViewer } from './pages/PublicViewer';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { StreamSource, UserRole, Message, Question, Poll, Survey, Language, User, Project } from './types';
import { MOCK_SESSION, INITIAL_MESSAGES, INITIAL_QUESTIONS, INITIAL_POLL, INITIAL_SURVEY, TRANSLATIONS, MOCK_PROJECTS } from './constants';
import { MessageSquare, X } from 'lucide-react';
import { getCurrentUser, onAuthStateChange, signOut, getProjects, createProject, deleteProject, toggleProjectOnDemand } from './services/supabaseService';

const App: React.FC = () => {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App State
  const [activeTab, setActiveTab] = useState('stage');
  const [source, setSource] = useState<StreamSource>(StreamSource.YOUTUBE);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string>('cu4xksmv7ho');
  const [lang, setLang] = useState<Language>('pt');
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Data State
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [poll, setPoll] = useState<Poll>(INITIAL_POLL);
  const [survey, setSurvey] = useState<Survey>(INITIAL_SURVEY);
  const [viewers, setViewers] = useState(MOCK_SESSION.viewers);

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Routing State (for public channel/project pages)
  const [routeType, setRouteType] = useState<'app' | 'channel' | 'watch' | 'reset-password'>('app');
  const [routeUsername, setRouteUsername] = useState<string | null>(null);
  const [routeProjectId, setRouteProjectId] = useState<string | null>(null);

  // Parse URL on mount and handle routing
  useEffect(() => {
    const parseRoute = () => {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);

      // Check for /reset-password pattern
      if (path === '/reset-password') {
        setRouteType('reset-password');
        return;
      }

      // Check for /watch?id=projectId pattern
      if (path === '/watch' && searchParams.get('id')) {
        setRouteType('watch');
        setRouteProjectId(searchParams.get('id'));
        return;
      }

      // Check for /{username} pattern (not reserved paths)
      const reservedPaths = ['/', '/login', '/admin', '/watch', '/reset-password'];
      if (path.length > 1 && !reservedPaths.includes(path)) {
        const username = path.slice(1).split('/')[0]; // Get first segment after /
        if (username && /^[a-zA-Z0-9_-]+$/.test(username)) {
          setRouteType('channel');
          setRouteUsername(username.toLowerCase());
          return;
        }
      }

      setRouteType('app');
    };

    parseRoute();

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', parseRoute);
    return () => window.removeEventListener('popstate', parseRoute);
  }, []);

  // Navigate to channel page
  const navigateToChannel = (username: string) => {
    window.history.pushState({}, '', `/${username}`);
    setRouteType('channel');
    setRouteUsername(username);
  };

  // Navigate to watch page
  const navigateToWatch = (projectId: string) => {
    window.history.pushState({}, '', `/watch?id=${projectId}`);
    setRouteType('watch');
    setRouteProjectId(projectId);
  };

  // Navigate back to app
  const navigateToApp = () => {
    window.history.pushState({}, '', '/');
    setRouteType('app');
    setRouteUsername(null);
    setRouteProjectId(null);
  };

  // Load projects when user is authenticated
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) {
        setProjects([]);
        setCurrentProjectId(null);
        setProjectsLoading(false);
        return;
      }

      try {
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);
        if (fetchedProjects.length > 0 && !currentProjectId) {
          setCurrentProjectId(fetchedProjects[0].id);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setProjectsLoading(false);
      }
    };

    loadProjects();
  }, [user]);

  // Check auth state on mount and listen for changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const appUser = await getCurrentUser();
        if (appUser) {
          setUser(appUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (authUser) => {
      if (authUser) {
        const appUser = await getCurrentUser();
        if (appUser) {
          setUser(appUser);
        }
      } else {
        setUser(null);
      }
    });

    // Refresh user profile every 30 seconds to pick up role changes
    const refreshInterval = setInterval(async () => {
      try {
        const appUser = await getCurrentUser();
        if (appUser) {
          setUser(appUser);
        }
      } catch (error) {
        console.error('User refresh failed:', error);
      }
    }, 30000); // 30 seconds

    // Also refresh on window focus
    const handleFocus = async () => {
      try {
        const appUser = await getCurrentUser();
        if (appUser) {
          setUser(appUser);
        }
      } catch (error) {
        console.error('User refresh on focus failed:', error);
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      subscription?.unsubscribe();
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setActiveTab('stage');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSendMessage = (text: string) => {
    if (!user) return;
    const newMsg: Message = {
      id: `m-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleVotePoll = (optionId: string) => {
    setPoll(prev => ({
      ...prev,
      totalVotes: prev.totalVotes + 1,
      options: prev.options.map(opt =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      )
    }));
  };

  const handleUpvoteQuestion = (qId: string) => {
    setQuestions(prev => prev.map(q =>
      q.id === qId ? { ...q, upvotes: q.upvotes + 1 } : q
    ).sort((a, b) => b.upvotes - a.upvotes));
  };

  const handleJoinRoom = (roomId: string) => {
    console.log(`Joining Room: ${roomId}`);
    setActiveTab('stage');
    setSource(roomId === 'r1' ? StreamSource.CUSTOM_RTMP : StreamSource.HLS);
  };

  // Project Management Handlers
  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'viewers' | 'rtmpStreamKey' | 'ownerId'>) => {
    try {
      const newProject = await createProject(projectData);
      setProjects(prev => [newProject, ...prev]);
      setCurrentProjectId(newProject.id);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleSelectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProjectId(projectId);
      if (project.youtubeVideoId) {
        setYoutubeVideoId(project.youtubeVideoId);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (currentProjectId === projectId) {
        const remaining = projects.filter(p => p.id !== projectId);
        setCurrentProjectId(remaining[0]?.id || null);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleToggleOnDemand = async (projectId: string) => {
    try {
      const updatedProject = await toggleProjectOnDemand(projectId);
      setProjects(prev => prev.map(p =>
        p.id === projectId ? updatedProject : p
      ));
    } catch (error) {
      console.error('Failed to toggle on-demand:', error);
      alert('Failed to update project. Please try again.');
    }
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p =>
      p.id === updatedProject.id ? updatedProject : p
    ));
  };

  const t = TRANSLATIONS[lang].stage;

  // Handle public routes first (no auth required)
  if (routeType === 'reset-password') {
    return (
      <ResetPasswordPage
        lang={lang}
        setLang={setLang}
        onResetComplete={navigateToApp}
      />
    );
  }

  if (routeType === 'channel' && routeUsername) {
    return (
      <ChannelPage
        username={routeUsername}
        lang={lang}
        onSelectProject={navigateToWatch}
        onBack={navigateToApp}
      />
    );
  }

  if (routeType === 'watch' && routeProjectId) {
    return <PublicViewer projectId={routeProjectId} />;
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage lang={lang} setLang={setLang} />;
  }

  // Show Master Admin Dashboard for MASTER_ADMIN role
  if (user.role === UserRole.MASTER_ADMIN) {
    return (
      <MasterAdminDashboard
        currentUser={user}
        lang={lang}
        onLogout={handleLogout}
      />
    );
  }

  // Show Producer/Admin Console for ADMIN role
  if (user.role === UserRole.ADMIN) {
    return (
      <AdminConsole
        session={MOCK_SESSION}
        currentSource={source}
        setSource={setSource}
        setYoutubeVideoId={setYoutubeVideoId}
        updatePoll={setPoll}
        updateSurvey={setSurvey}
        messages={messages}
        questions={questions}
        lang={lang}
        onLogout={handleLogout}
        projects={projects}
        currentProjectId={currentProjectId}
        onCreateProject={handleCreateProject}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
        onToggleOnDemand={handleToggleOnDemand}
        onUpdateProject={handleUpdateProject}
      />
    );
  }

  // Show attendee view for ATTENDEE, SPEAKER, MODERATOR roles
  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} setLang={setLang} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col relative overflow-hidden mb-16 md:mb-0">
        {activeTab === 'rooms' ? (
          <BreakoutRooms onJoinRoom={handleJoinRoom} lang={lang} />
        ) : (
          <div className="flex flex-1 overflow-hidden flex-col lg:flex-row relative">
            <div className="flex-1 flex flex-col overflow-y-auto bg-black custom-scrollbar">
              {activeTab === 'stage' ? (
                <>
                  <div className="sticky top-0 z-20 w-full bg-black shadow-lg">
                    <VideoPlayer
                      source={source}
                      youtubeVideoId={youtubeVideoId}
                      isLive={MOCK_SESSION.status === 'LIVE'}
                      role={user.role}
                      lang={lang}
                    />
                  </div>

                  <div className="px-4 md:px-6 pb-20 md:pb-8 max-w-6xl mx-auto w-full pt-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                      <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white mb-2">{MOCK_SESSION.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-400">
                          <span className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
                            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">SC</div>
                            {MOCK_SESSION.speaker}
                          </span>
                          <span>{MOCK_SESSION.startTime} - {MOCK_SESSION.endTime}</span>
                          <span className="text-emerald-500 font-bold">• {t.live}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex-1 md:flex-none justify-center">
                          {t.addToCalendar}
                        </button>
                        <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex-1 md:flex-none justify-center">
                          {t.share}
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-800">
                      <h3 className="font-bold text-white mb-2">{t.about}</h3>
                      <p className="text-slate-400 leading-relaxed text-sm md:text-base">{MOCK_SESSION.description}</p>

                      <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">{t.track}</span>
                          <span className="text-sm text-white bg-slate-800 px-2 py-1 rounded">Enterprise Tech</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">{t.level}</span>
                          <span className="text-sm text-white bg-slate-800 px-2 py-1 rounded">Advanced</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <p>View for {activeTab} coming soon...</p>
                </div>
              )}
            </div>

            {activeTab === 'stage' && (
              <button
                onClick={() => setShowMobileChat(!showMobileChat)}
                className="lg:hidden fixed bottom-20 right-4 z-40 bg-indigo-600 text-white p-3 rounded-full shadow-2xl shadow-indigo-900/50"
              >
                {showMobileChat ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
              </button>
            )}

            <div className={`
                fixed lg:relative inset-0 lg:inset-auto z-30 lg:z-auto bg-slate-900 lg:bg-transparent lg:w-96
                transition-transform duration-300 transform
                ${activeTab === 'stage' ? '' : 'hidden'}
                ${showMobileChat ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
            `}>
              <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
                <span className="font-bold text-white">Interação</span>
                <button onClick={() => setShowMobileChat(false)} className="text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <EngagementPanel
                currentUser={user}
                messages={messages}
                questions={questions}
                poll={poll}
                survey={survey}
                onSendMessage={handleSendMessage}
                onVotePoll={handleVotePoll}
                onUpvoteQuestion={handleUpvoteQuestion}
                viewers={viewers}
                lang={lang}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
