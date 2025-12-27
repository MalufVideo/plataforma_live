import React from 'react';
import { LayoutDashboard, Radio, Calendar, Users, Settings, BarChart3, LogOut, Grid, Globe, Play } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
  setLang: (l: Language) => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, lang, setLang, onLogout }) => {
  const t = TRANSLATIONS[lang].nav;

  const navItems = [
    { id: 'stage', label: t.stage, icon: Radio },
    { id: 'rooms', label: t.rooms, icon: Grid },
    { id: 'agenda', label: t.agenda, icon: Calendar },
    { id: 'networking', label: t.networking, icon: Users },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-50 md:hidden px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${activeTab === item.id
                ? 'text-indigo-400'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium truncate w-16 text-center">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col h-full w-20 lg:w-64 bg-slate-900 border-r border-slate-800 text-slate-400 transition-all duration-300">
        <div className="h-16 flex items-center justify-between px-3 lg:px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center justify-center lg:justify-start w-full">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-indigo-500/30">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <div className="hidden lg:flex flex-col ml-3">
              <span className="font-bold text-white tracking-wider text-sm leading-none">LIVE VIDEO</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-widest mt-0.5">by On+Av</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center p-3 rounded-lg transition-colors ${activeTab === item.id
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20'
                  : 'hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block ml-3 font-medium truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
            className="flex items-center w-full p-2 text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <Globe className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:flex ml-3 font-medium items-center justify-between w-full">
              <span>{lang === 'pt' ? 'Português' : 'English'}</span>
              <span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded">{lang.toUpperCase()}</span>
            </span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center w-full p-2 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:block ml-3 font-medium">{t.signout}</span>
          </button>
        </div>
      </div>
    </>
  );
};