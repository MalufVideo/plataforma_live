import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { VideoPlayer } from './components/VideoPlayer';
import { EngagementPanel } from './components/EngagementPanel';
import { AdminConsole } from './pages/AdminConsole';
import { BreakoutRooms } from './pages/BreakoutRooms';
import { LoginPage } from './pages/LoginPage';
import { StreamSource, UserRole, Message, Question, Poll, Survey, Language, User } from './types';
import { CURRENT_USER, MOCK_SESSION, INITIAL_MESSAGES, INITIAL_QUESTIONS, INITIAL_POLL, INITIAL_SURVEY, TRANSLATIONS } from './constants';
import { MessageSquare, X } from 'lucide-react';

const App: React.FC = () => {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  
  // App State
  const [activeTab, setActiveTab] = useState('stage'); // stage, rooms, agenda, networking
  const [source, setSource] = useState<StreamSource>(StreamSource.CUSTOM_RTMP);
  const [lang, setLang] = useState<Language>('pt');
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Data State
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [poll, setPoll] = useState<Poll>(INITIAL_POLL);
  const [survey, setSurvey] = useState<Survey>(INITIAL_SURVEY);
  const [viewers, setViewers] = useState(MOCK_SESSION.viewers);

  // Simulated WebSocket Effect
  useEffect(() => {
    if (!user) return; // Only run when logged in

    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 10) - 4);
      if (Math.random() > 0.95) {
        const newMsg: Message = {
            id: `m-${Date.now()}`,
            userId: 'u-random',
            userName: ['Sarah L.', 'Mike T.', 'Guest 402', 'Events Pro'][Math.floor(Math.random() * 4)],
            userRole: UserRole.ATTENDEE,
            text: ['Great point!', 'Is the slide deck available?', 'Audio is clear now.', 'Wow!'][Math.floor(Math.random() * 4)],
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, newMsg]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (role: UserRole) => {
    setUser({ ...CURRENT_USER, role });
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('stage');
    setSource(StreamSource.CUSTOM_RTMP);
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
      ).sort((a,b) => b.upvotes - a.upvotes));
  };
  
  const handleJoinRoom = (roomId: string) => {
      console.log(`Joining Room: ${roomId}`);
      setActiveTab('stage');
      setSource(roomId === 'r1' ? StreamSource.CUSTOM_RTMP : StreamSource.HLS);
  };

  const t = TRANSLATIONS[lang].stage;

  // 1. Not Logged In -> Login Screen
  if (!user) {
    return <LoginPage onLogin={handleLogin} lang={lang} setLang={setLang} />;
  }

  // 2. Logged in as Admin -> Admin Console Layout
  if (user.role === UserRole.ADMIN) {
    return (
        <AdminConsole 
            session={MOCK_SESSION}
            currentSource={source}
            setSource={setSource}
            updatePoll={setPoll}
            updateSurvey={setSurvey}
            lang={lang}
            onLogout={handleLogout}
        />
    );
  }

  // 3. Logged in as Attendee -> Standard App Layout
  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} setLang={setLang} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden mb-16 md:mb-0">
        {activeTab === 'rooms' ? (
           <BreakoutRooms onJoinRoom={handleJoinRoom} lang={lang} />
        ) : (
          /* Main Stage Layout */
          <div className="flex flex-1 overflow-hidden flex-col lg:flex-row relative">
            {/* Center Stage */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-black custom-scrollbar">
               {activeTab === 'stage' ? (
                   <>
                     {/* Sticky Video Container */}
                     <div className="sticky top-0 z-20 w-full bg-black shadow-lg">
                        <VideoPlayer source={source} isLive={MOCK_SESSION.status === 'LIVE'} role={user.role} lang={lang} />
                     </div>
                     
                     {/* Session Info */}
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

            {/* Mobile Chat Toggle Button */}
            {activeTab === 'stage' && (
              <button 
                onClick={() => setShowMobileChat(!showMobileChat)}
                className="lg:hidden fixed bottom-20 right-4 z-40 bg-indigo-600 text-white p-3 rounded-full shadow-2xl shadow-indigo-900/50"
              >
                {showMobileChat ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
              </button>
            )}

            {/* Right Engagement Panel */}
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