import React, { useState, useEffect } from 'react';
import { StreamSource, Poll, Session, Survey, Language, Message, Question } from '../types';
import { TRANSLATIONS, INITIAL_POLL, INITIAL_SURVEY } from '../constants';
import {
  ArrowLeft, Activity, LayoutDashboard, Radio, BarChart3,
  Server, MessageSquare, Settings, Crown, Wifi, Play
} from 'lucide-react';
import { DashboardTab } from '../components/admin/DashboardTab';
import { StreamSourcesTab } from '../components/admin/StreamSourcesTab';
import { AnalyticsTab } from '../components/admin/AnalyticsTab';
import { TranscodingTab } from '../components/admin/TranscodingTab';
import { EngagementTab } from '../components/admin/EngagementTab';
import { ReportsTab } from '../components/admin/ReportsTab';

interface AdminConsoleProps {
  session: Session;
  currentSource: StreamSource;
  setSource: (s: StreamSource) => void;
  setYoutubeVideoId: (id: string) => void;
  updatePoll: (p: Poll) => void;
  updateSurvey: (s: Survey) => void;
  messages: Message[];
  questions: Question[];
  lang: Language;
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'sources' | 'analytics' | 'reports' | 'transcoding' | 'engagement' | 'settings';

const TAB_CONFIG: { id: AdminTab; label: string; icon: React.ElementType; premium?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sources', label: 'Stream Sources', icon: Radio },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reports', label: 'Relatórios', icon: Activity },
  { id: 'transcoding', label: 'Transcoding', icon: Server, premium: true },
  { id: 'engagement', label: 'Engagement', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  session,
  currentSource,
  setSource,
  setYoutubeVideoId,
  updatePoll,
  updateSurvey,
  messages,
  questions,
  lang,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isPremium, setIsPremium] = useState(true); // Toggle for demo
  const [elapsedTime, setElapsedTime] = useState(0);
  const [poll, setPoll] = useState<Poll>(INITIAL_POLL);
  const [survey, setSurvey] = useState<Survey>(INITIAL_SURVEY);

  const t = TRANSLATIONS[lang].admin;

  // Timer for stream duration
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleUpdatePoll = (newPoll: Poll) => {
    setPoll(newPoll);
    updatePoll(newPoll);
  };

  const handleUpdateSurvey = (newSurvey: Survey) => {
    setSurvey(newSurvey);
    updateSurvey(newSurvey);
  };

  return (
    <div className="min-h-screen bg-[#0b0c15] text-slate-200 flex flex-col">
      {/* Top Header */}
      <header className="h-14 bg-[#14151f] border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                {t.title}
                {isPremium && (
                  <span className="flex items-center gap-1 text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                    <Crown className="w-3 h-3" /> PREMIUM
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-slate-500">{session.title}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Premium Toggle (for demo) */}
          <button
            onClick={() => setIsPremium(!isPremium)}
            className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all ${isPremium
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
          >
            {isPremium ? 'Premium Active' : 'Enable Premium'}
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">REGION</span>
            <span className="text-emerald-500 font-bold font-mono">US-EAST-1</span>
          </div>

          <div className="flex items-center gap-3 bg-red-950/30 border border-red-900/50 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="font-bold text-red-500 text-xs font-mono">{t.onAir} {formatTime(elapsedTime)}</span>
          </div>

          <button className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
            <Wifi className="w-3 h-3" />
            {t.endEvent}
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-[#14151f] border-b border-slate-800 px-4">
        <nav className="flex gap-1">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === tab.id
                  ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                  : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden md:inline">{tab.label}</span>
              {tab.premium && (
                <span className="text-[8px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded font-bold">
                  PRO
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <DashboardTab viewers={session.viewers} isPremium={isPremium} />
        )}

        {activeTab === 'sources' && (
          <StreamSourcesTab
            currentSource={currentSource}
            setSource={setSource}
            setYoutubeVideoId={setYoutubeVideoId}
            isPremium={isPremium}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab isPremium={isPremium} viewers={session.viewers} />
        )}

        {activeTab === 'reports' && (
          <ReportsTab lang={lang} />
        )}

        {activeTab === 'transcoding' && (
          <TranscodingTab isPremium={isPremium} />
        )}

        {activeTab === 'engagement' && (
          <EngagementTab
            poll={poll}
            survey={survey}
            updatePoll={handleUpdatePoll}
            updateSurvey={handleUpdateSurvey}
            messages={messages}
            questions={questions}
            lang={lang}
          />
        )}

        {activeTab === 'settings' && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Settings className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Settings</h3>
              <p className="text-slate-500">Event configuration coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};