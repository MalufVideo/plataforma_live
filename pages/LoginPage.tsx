import React from 'react';
import { UserRole, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { User, Shield, Play } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
  lang: Language;
  setLang: (l: Language) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, lang, setLang }) => {
  const t = TRANSLATIONS[lang].login;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 pointer-events-none"></div>
      
      {/* Language Switcher (Top Right) */}
      <div className="absolute top-6 right-6 z-10">
         <button 
           onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
           className="text-xs font-bold text-slate-400 border border-slate-700 rounded px-3 py-1 hover:text-white hover:border-slate-500 transition-all"
         >
           {lang === 'pt' ? 'PT / EN' : 'EN / PT'}
         </button>
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
           <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 mb-4 transform hover:scale-105 transition-transform duration-500">
               <Play className="w-8 h-8 fill-white ml-1" />
           </div>
           <h1 className="text-3xl font-bold text-white tracking-tight">LIVE VIDEO <span className="text-slate-500 font-light">STREAMFORGE</span></h1>
        </div>

        <h2 className="text-xl text-slate-400 mb-8 font-light tracking-wide">{t.title}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
           {/* Attendee Card */}
           <button 
             onClick={() => onLogin(UserRole.ATTENDEE)}
             className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500 p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/20 text-left flex flex-col items-center md:items-start"
           >
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white text-indigo-400 transition-colors">
                  <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t.attendee}</h3>
              <p className="text-sm text-slate-400">{t.attendeeDesc}</p>
              
              <div className="mt-6 flex items-center text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                  {t.enter} &rarr;
              </div>
           </button>

           {/* Producer Card */}
           <button 
             onClick={() => onLogin(UserRole.ADMIN)}
             className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500 p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20 text-left flex flex-col items-center md:items-start"
           >
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white text-emerald-400 transition-colors">
                  <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t.producer}</h3>
              <p className="text-sm text-slate-400">{t.producerDesc}</p>

              <div className="mt-6 flex items-center text-xs font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                  {t.enter} &rarr;
              </div>
           </button>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-slate-600 text-xs font-mono">
        v2.5.0-Enterprise • Secure Connection
      </div>
    </div>
  );
};