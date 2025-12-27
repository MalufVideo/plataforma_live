import React, { useState } from 'react';
import { UserRole, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { User, Shield, Play, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { signInWithGoogle, signIn, signUp } from '../services/supabaseService';

interface LoginPageProps {
  onLogin: (role: UserRole) => void;
  lang: Language;
  setLang: (l: Language) => void;
}

type AuthMode = 'select' | 'email';
type AuthAction = 'signin' | 'signup';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, lang, setLang }) => {
  const t = TRANSLATIONS[lang].login;
  const [loading, setLoading] = useState<'attendee' | 'admin' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auth mode: 'select' = role cards with OAuth, 'email' = email form
  const [authMode, setAuthMode] = useState<AuthMode>('select');
  const [authAction, setAuthAction] = useState<AuthAction>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ATTENDEE);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async (role: UserRole) => {
    try {
      setLoading(role === UserRole.ATTENDEE ? 'attendee' : 'admin');
      setError(null);
      localStorage.setItem('intended_role', role);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(null);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!email.trim()) {
      setError(t.emailRequired);
      return;
    }
    if (!password.trim()) {
      setError(t.passwordRequired);
      return;
    }
    if (password.length < 6) {
      setError(t.passwordMinLength);
      return;
    }

    try {
      setLoading('email');

      if (authAction === 'signup') {
        await signUp(email, password, name || email.split('@')[0]);
        setSuccess(t.signUpSuccess);
        setLoading(null);
      } else {
        // Store intended role before sign in
        localStorage.setItem('intended_role', selectedRole);
        await signIn(email, password);
        // Auth state change will be handled by App.tsx
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(null);
    }
  };

  const switchToEmail = (role: UserRole) => {
    setSelectedRole(role);
    setAuthMode('email');
    setError(null);
    setSuccess(null);
  };

  const GoogleIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

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

        {authMode === 'select' ? (
          <>
            <h2 className="text-xl text-slate-400 mb-8 font-light tracking-wide">{t.title}</h2>

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm max-w-md text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              {/* Attendee Card */}
              <div className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500 p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/20 text-left flex flex-col items-center md:items-start">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white text-indigo-400 transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{t.attendee}</h3>
                <p className="text-sm text-slate-400 mb-4">{t.attendeeDesc}</p>

                {/* Auth buttons */}
                <div className="w-full space-y-2 mt-auto">
                  <button
                    onClick={() => switchToEmail(UserRole.ATTENDEE)}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    {t.useEmail}
                  </button>
                  <button
                    onClick={() => handleGoogleLogin(UserRole.ATTENDEE)}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {loading === 'attendee' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                    {t.useGoogle}
                  </button>
                </div>
              </div>

              {/* Producer Card */}
              <div className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500 p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20 text-left flex flex-col items-center md:items-start">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white text-emerald-400 transition-colors">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{t.producer}</h3>
                <p className="text-sm text-slate-400 mb-4">{t.producerDesc}</p>

                {/* Auth buttons */}
                <div className="w-full space-y-2 mt-auto">
                  <button
                    onClick={() => switchToEmail(UserRole.ADMIN)}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Mail className="w-4 h-4" />
                    {t.useEmail}
                  </button>
                  <button
                    onClick={() => handleGoogleLogin(UserRole.ADMIN)}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {loading === 'admin' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                    {t.useGoogle}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Email Auth Form */
          <div className="w-full max-w-md">
            {/* Back button */}
            <button
              onClick={() => {
                setAuthMode('select');
                setError(null);
                setSuccess(null);
              }}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {lang === 'pt' ? 'Voltar' : 'Back'}
            </button>

            {/* Role indicator */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 ${
              selectedRole === UserRole.ADMIN
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-indigo-500/20 text-indigo-400'
            }`}>
              {selectedRole === UserRole.ADMIN ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {selectedRole === UserRole.ADMIN ? t.producer : t.attendee}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {authAction === 'signin' ? t.signIn : t.signUp}
            </h2>
            <p className="text-slate-400 mb-6">
              {authAction === 'signin'
                ? (lang === 'pt' ? 'Entre com seu email e senha' : 'Sign in with your email and password')
                : (lang === 'pt' ? 'Crie sua conta para começar' : 'Create your account to get started')
              }
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authAction === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">{t.name}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder={lang === 'pt' ? 'Seu nome' : 'Your name'}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t.email}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="email@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">{t.password}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="••••••••"
                  autoComplete={authAction === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>

              <button
                type="submit"
                disabled={loading === 'email'}
                className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  selectedRole === UserRole.ADMIN
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {loading === 'email' && <Loader2 className="w-4 h-4 animate-spin" />}
                {authAction === 'signin' ? t.signIn : t.signUp}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-950 text-slate-500">{t.orContinueWith}</span>
              </div>
            </div>

            {/* Google button */}
            <button
              onClick={() => handleGoogleLogin(selectedRole)}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'attendee' || loading === 'admin' ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
              Google
            </button>

            {/* Toggle signin/signup */}
            <p className="mt-6 text-center text-slate-400 text-sm">
              {authAction === 'signin' ? t.noAccount : t.hasAccount}{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthAction(authAction === 'signin' ? 'signup' : 'signin');
                  setError(null);
                  setSuccess(null);
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {authAction === 'signin' ? t.createAccount : t.loginHere}
              </button>
            </p>
          </div>
        )}
      </div>

      <div className="absolute bottom-6 text-slate-600 text-xs font-mono">
        v2.5.0-Enterprise • Secure Connection
      </div>
    </div>
  );
};
