import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { VideoPlayer } from './components/VideoPlayer';
import { EngagementPanel } from './components/EngagementPanel';
import { AdminConsole } from './pages/AdminConsole';
import { BreakoutRooms } from './pages/BreakoutRooms';
import { StreamSource, UserRole, Message, Question, Poll, Survey, Language, PlayerSize, HtmlContent } from './types';
import { CURRENT_USER, MOCK_SESSION, INITIAL_MESSAGES, INITIAL_QUESTIONS, INITIAL_POLL, INITIAL_SURVEY, TRANSLATIONS } from './constants';
import { MessageSquare, X, Monitor } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('stage'); // stage, rooms, agenda, networking, admin
  const [source, setSource] = useState<StreamSource>(StreamSource.CUSTOM_RTMP);
  const [lang, setLang] = useState<Language>('pt');

  // Player size control (admin feature)
  const [playerSize, setPlayerSize] = useState<PlayerSize>(PlayerSize.FULL);
  const [htmlContent, setHtmlContent] = useState<HtmlContent | null>(null);

  // Mobile specific state
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Simulated Real-time Data State
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [poll, setPoll] = useState<Poll>(INITIAL_POLL);
  const [survey, setSurvey] = useState<Survey>(INITIAL_SURVEY);
  const [viewers, setViewers] = useState(MOCK_SESSION.viewers);

  // Simulated WebSocket Effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate viewer count fluctuation
      setViewers(prev => prev + Math.floor(Math.random() * 10) - 4);
      
      // Simulate incoming chat messages rarely
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
  }, []);

  const handleSendMessage = (text: string) => {
    const newMsg: Message = {
        id: `m-${Date.now()}`,
        userId: CURRENT_USER.id,
        userName: CURRENT_USER.name,
        userRole: CURRENT_USER.role,
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
      // In a real app, this would switch the session context
      console.log(`Joining Room: ${roomId}`);
      setActiveTab('stage');
      // Simulate source switch for demo
      setSource(roomId === 'r1' ? StreamSource.CUSTOM_RTMP : StreamSource.HLS);
  };

  const t = TRANSLATIONS[lang].stage;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} role={CURRENT_USER.role} lang={lang} setLang={setLang} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden mb-16 md:mb-0">
        {activeTab === 'admin' ? (
           <AdminConsole
              session={MOCK_SESSION}
              currentSource={source}
              setSource={setSource}
              updatePoll={setPoll}
              updateSurvey={setSurvey}
              lang={lang}
              playerSize={playerSize}
              setPlayerSize={setPlayerSize}
              htmlContent={htmlContent}
              setHtmlContent={setHtmlContent}
           />
        ) : activeTab === 'rooms' ? (
           <BreakoutRooms onJoinRoom={handleJoinRoom} lang={lang} />
        ) : (
          /* Main Stage Layout (used for Stage and specific rooms) */
          <div className="flex flex-1 overflow-hidden flex-col lg:flex-row relative">
            {/* Center Stage */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-black custom-scrollbar">
               {activeTab === 'stage' ? (
                   <>
                     {/* Video and HTML Content Container */}
                     <div className={`sticky top-0 z-20 w-full bg-black shadow-lg ${
                       playerSize !== PlayerSize.FULL ? 'flex flex-col lg:flex-row gap-4 p-4' : ''
                     }`}>
                        {/* Video Player Container */}
                        <div className={`bg-black ${
                          playerSize === PlayerSize.FULL ? 'w-full' :
                          playerSize === PlayerSize.MEDIUM ? 'w-full lg:w-2/3' :
                          'w-full lg:w-1/2'
                        }`}>
                           <VideoPlayer source={source} isLive={MOCK_SESSION.status === 'LIVE'} role={CURRENT_USER.role} lang={lang} />
                        </div>

                        {/* HTML Content Display Area */}
                        {playerSize !== PlayerSize.FULL && htmlContent && (
                           <div className={`${
                             playerSize === PlayerSize.MEDIUM ? 'w-full lg:w-1/3' :
                             'w-full lg:w-1/2'
                           } min-h-[300px] lg:min-h-[400px]`}>
                              <div
                                className="w-full h-full"
                                dangerouslySetInnerHTML={{ __html: htmlContent.html }}
                              />
                           </div>
                        )}

                        {/* Placeholder when no content is loaded */}
                        {playerSize !== PlayerSize.FULL && !htmlContent && (
                           <div className={`${
                             playerSize === PlayerSize.MEDIUM ? 'w-full lg:w-1/3' :
                             'w-full lg:w-1/2'
                           } min-h-[300px] lg:min-h-[400px] flex items-center justify-center bg-slate-900 rounded-lg border-2 border-dashed border-slate-700`}>
                              <div className="text-center text-slate-500 p-8">
                                 <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                 <p className="font-medium">{t.noHtmlContent}</p>
                                 <p className="text-sm mt-2">{t.loadContentFromAdmin}</p>
                              </div>
                           </div>
                        )}
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

            {/* Right Engagement Panel (Desktop: Fixed, Mobile: Overlay) */}
            <div className={`
                fixed lg:relative inset-0 lg:inset-auto z-30 lg:z-auto bg-slate-900 lg:bg-transparent lg:w-96
                transition-transform duration-300 transform 
                ${activeTab === 'stage' ? '' : 'hidden'}
                ${showMobileChat ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
            `}>
               {/* Mobile Header for Chat */}
               <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
                  <span className="font-bold text-white">Interação</span>
                  <button onClick={() => setShowMobileChat(false)} className="text-slate-400">
                    <X className="w-6 h-6" />
                  </button>
               </div>
               
               <EngagementPanel 
                  currentUser={CURRENT_USER}
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