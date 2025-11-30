import React, { useState, useEffect, useRef } from 'react';
import { EngagementType, Message, Question, Poll, Survey, User, UserRole, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { MessageSquare, HelpCircle, BarChart2, Users, Send, ThumbsUp, CheckCircle, Sparkles, ClipboardList } from 'lucide-react';
import { summarizeChat } from '../services/geminiService';

interface EngagementPanelProps {
  currentUser: User;
  messages: Message[];
  questions: Question[];
  poll: Poll;
  survey?: Survey;
  onSendMessage: (text: string) => void;
  onVotePoll: (optionId: string) => void;
  onUpvoteQuestion: (qId: string) => void;
  viewers: number;
  lang: Language;
}

export const EngagementPanel: React.FC<EngagementPanelProps> = ({
  currentUser,
  messages,
  questions,
  poll,
  survey,
  onSendMessage,
  onVotePoll,
  onUpvoteQuestion,
  viewers,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<EngagementType>(EngagementType.CHAT);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // AI State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Survey State
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  const t = TRANSLATIONS[lang].engagement;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === EngagementType.CHAT) {
      scrollToBottom();
    }
  }, [messages, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleAiSummary = async () => {
    setIsSummarizing(true);
    const summary = await summarizeChat(messages, lang);
    setAiSummary(summary);
    setIsSummarizing(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 w-full lg:w-96 shadow-2xl lg:shadow-none">
      {/* Tabs */}
      <div className="flex items-center justify-between p-2 border-b border-slate-800 bg-slate-900/50">
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg w-full">
            {[
                { id: EngagementType.CHAT, icon: MessageSquare, label: t.chat },
                { id: EngagementType.QA, icon: HelpCircle, label: t.qa },
                { id: EngagementType.POLLS, icon: BarChart2, label: t.polls },
                { id: EngagementType.SURVEY, icon: ClipboardList, label: t.survey },
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center py-2 px-2 rounded-md text-sm font-medium transition-all ${
                        activeTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                    }`}
                    title={tab.label}
                >
                    <tab.icon className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:block">{tab.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto relative bg-slate-900">
        
        {/* CHAT TAB */}
        {activeTab === EngagementType.CHAT && (
          <div className="flex flex-col h-full">
            <div className="p-3 bg-indigo-900/20 border-b border-indigo-900/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300">{t.liveChat}</span>
                {currentUser.role === UserRole.ADMIN && (
                    <button 
                        onClick={handleAiSummary}
                        disabled={isSummarizing}
                        className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors"
                    >
                        <Sparkles className="w-3 h-3" />
                        {isSummarizing ? t.analyzing : t.aiSummary}
                    </button>
                )}
            </div>

            {aiSummary && (
                <div className="m-3 p-3 bg-slate-800 rounded-lg border border-indigo-500/30">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {t.aiSummary}
                        </span>
                        <button onClick={() => setAiSummary(null)} className="text-slate-500 hover:text-white text-xs">✕</button>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap">{aiSummary}</p>
                </div>
            )}

            <div className="flex-1 p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.isPinned ? 'bg-indigo-900/20 p-2 rounded-lg border border-indigo-500/20' : ''}`}>
                   <img src={`https://ui-avatars.com/api/?name=${msg.userName}&background=random`} alt={msg.userName} className="w-8 h-8 rounded-full flex-shrink-0" />
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-slate-200 truncate">{msg.userName}</span>
                        {msg.userRole === UserRole.MODERATOR && <span className="text-[10px] bg-indigo-500 px-1.5 rounded text-white font-bold">MOD</span>}
                        {msg.userRole === UserRole.ADMIN && <span className="text-[10px] bg-emerald-600 px-1.5 rounded text-white font-bold">HOST</span>}
                        <span className="text-xs text-slate-500 ml-auto flex-shrink-0">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-sm text-slate-300 break-words leading-relaxed">{msg.text}</p>
                   </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800">
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.typeMessage}
                  className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-full py-2.5 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button type="submit" className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Q&A TAB */}
        {activeTab === EngagementType.QA && (
          <div className="p-4 space-y-4">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-300">{t.topQuestions}</h3>
                <button className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full">{t.askQuestion}</button>
             </div>
             {questions.map((q) => (
                <div key={q.id} className={`p-4 rounded-xl border ${q.isAnswered ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-800 border-slate-600'} transition-all`}>
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center gap-1">
                            <button 
                                onClick={() => onUpvoteQuestion(q.id)}
                                className="flex flex-col items-center p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-indigo-400 transition-colors"
                            >
                                <ThumbsUp className="w-4 h-4 mb-1" />
                                <span className="text-xs font-bold">{q.upvotes}</span>
                            </button>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-slate-200 font-medium mb-2">{q.text}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-500">{q.userName} • {new Date(q.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                {q.isAnswered && (
                                    <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        <CheckCircle className="w-3 h-3" /> {t.answered}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
             ))}
          </div>
        )}

        {/* POLLS TAB */}
        {activeTab === EngagementType.POLLS && (
            <div className="p-6">
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</span>
                        <h3 className="font-bold text-slate-100">{t.currentPoll}</h3>
                    </div>
                    <p className="text-lg font-medium text-white mb-6">{poll.question}</p>
                    
                    <div className="space-y-3">
                        {poll.options.map((opt) => {
                            const percent = Math.round((opt.votes / poll.totalVotes) * 100) || 0;
                            return (
                                <button 
                                    key={opt.id}
                                    onClick={() => onVotePoll(opt.id)}
                                    className="w-full relative group overflow-hidden rounded-lg bg-slate-900 border border-slate-600 hover:border-indigo-500 transition-all p-3 text-left"
                                >
                                    {/* Progress Bar Background */}
                                    <div 
                                        className="absolute inset-0 bg-indigo-600/20 transition-all duration-1000 ease-out"
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                    
                                    <div className="relative z-10 flex justify-between items-center">
                                        <span className="text-sm font-medium text-slate-200 group-hover:text-white">{opt.text}</span>
                                        <span className="text-sm font-bold text-indigo-400">{percent}%</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-4">{poll.totalVotes} {t.votes}</p>
                </div>
            </div>
        )}

        {/* SURVEY TAB */}
        {activeTab === EngagementType.SURVEY && (
            <div className="p-6">
                {!survey || !survey.isActive ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <ClipboardList className="w-12 h-12 mb-4 opacity-50" />
                        <p>{t.noSurvey}</p>
                    </div>
                ) : surveySubmitted ? (
                    <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-xl p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{t.thankYou}</h3>
                        <p className="text-slate-400">{t.feedbackRecorded}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white mb-1">{survey.title}</h3>
                            <p className="text-sm text-slate-400">Please take a moment to share your feedback.</p>
                        </div>
                        
                        {survey.fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <label className="block text-sm font-medium text-slate-200">{field.question}</label>
                                {field.type === 'RATING' && (
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(rating => (
                                            <button key={rating} className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 transition-colors flex items-center justify-center text-slate-300 hover:text-white font-bold">
                                                {rating}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {field.type === 'TEXT' && (
                                    <textarea 
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        rows={3}
                                        placeholder="Your answer..."
                                    ></textarea>
                                )}
                            </div>
                        ))}

                        <button 
                            onClick={() => setSurveySubmitted(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all transform hover:scale-[1.02]"
                        >
                            {t.submitFeedback}
                        </button>
                    </div>
                )}
            </div>
        )}

      </div>
      
      {/* Footer / Attendees Mini View */}
      <div className="p-3 border-t border-slate-800 bg-slate-900">
           <div className="flex items-center gap-3 text-xs text-slate-500">
                <Users className="w-4 h-4" />
                <span>{viewers.toLocaleString()} Online</span>
                <span className="hidden md:inline w-1 h-1 bg-slate-700 rounded-full"></span>
                <span className="hidden md:inline text-emerald-500">{t.connection}</span>
           </div>
      </div>
    </div>
  );
};