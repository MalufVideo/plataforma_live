import React, { useState } from 'react';
import { UserRole, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { User, Shield, Play, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../services/supabaseService';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
  lang: Language;
  setLang: (l: Language) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, lang, setLang }) => {
  const t = TRANSLATIONS[lang].login;
  const [loading, setLoading] = useState<'attendee' | 'admin' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async (role: UserRole) => {
    try {
      setLoading(role === UserRole.ATTENDEE ? 'attendee' : 'admin');
      setError(null);

      // Store the intended role in localStorage before OAuth redirect
      localStorage.setItem('intended_role', role);

      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(null);
    }
  };

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
          <h1 className="text-3xl font-bold text-white tracking-tight">LIVE VIDEO <span className="text-slate-500 font-light">by On+Av</span></h1>
        </div>

        <h2 className="text-xl text-slate-400 mb-8 font-light tracking-wide">{t.title}</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm max-w-md text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Attendee Card */}
          <button
            onClick={() => handleGoogleLogin(UserRole.ATTENDEE)}
            disabled={loading !== null}
            className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500 p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/20 text-left flex flex-col items-center md:items-start disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white text-indigo-400 transition-colors">
              {loading === 'attendee' ? <Loader2 className="w-6 h-6 animate-spin" /> : <User className="w-6 h-6" />}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{t.attendee}</h3>
            <p className="text-sm text-slate-400">{t.attendeeDesc}</p>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Entrar com Google
            </div>

            <div className="mt-4 flex items-center text-xs font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              {t.enter} &rarr;
            </div>
          </button>

          {/* Producer Card */}
          <button
            onClick={() => handleGoogleLogin(UserRole.ADMIN)}
            disabled={loading !== null}
            className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500 p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20 text-left flex flex-col items-center md:items-start disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white text-emerald-400 transition-colors">
              {loading === 'admin' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{t.producer}</h3>
            <p className="text-sm text-slate-400">{t.producerDesc}</p>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
              Entrar com Google
            </div>

            <div className="mt-4 flex items-center text-xs font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
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