import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Play, Loader2, CheckCircle } from 'lucide-react';
import { updatePassword, supabase } from '../services/supabaseService';

interface ResetPasswordPageProps {
  lang: Language;
  setLang: (l: Language) => void;
  onResetComplete: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ lang, setLang, onResetComplete }) => {
  const t = TRANSLATIONS[lang].login;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Check if this is a password recovery session
      if (session?.user) {
        setIsValidSession(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };

    checkSession();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!newPassword.trim()) {
      setError(t.passwordRequired);
      return;
    }
    if (newPassword.length < 6) {
      setError(t.passwordMinLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.passwordsDoNotMatch);
      return;
    }

    try {
      setLoading(true);
      await updatePassword(newPassword);
      setSuccess(true);

      // Redirect to app after 2 seconds
      setTimeout(() => {
        onResetComplete();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      setLoading(false);
    }
  };

  if (!isValidSession && !error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

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

      <div className="z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 mb-4 transform hover:scale-105 transition-transform duration-500">
            <Play className="w-8 h-8 fill-white ml-1" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">LIVE VIDEO <span className="text-slate-500 font-light">by On+Av</span></h1>
        </div>

        {/* Reset Password Card */}
        <div className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
          {success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{lang === 'pt' ? 'Sucesso!' : 'Success!'}</h2>
              <p className="text-slate-400 mb-6">{t.passwordResetSuccess}</p>
              <div className="text-slate-500 text-sm">
                {lang === 'pt' ? 'Redirecionando...' : 'Redirecting...'}
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">{t.resetPassword}</h2>
              <p className="text-slate-400 mb-6 text-center text-sm">
                {lang === 'pt' ? 'Digite sua nova senha' : 'Enter your new password'}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {isValidSession && (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">{t.newPassword}</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">{t.confirmPassword}</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : null}
                    {t.resetPassword}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 text-slate-600 text-xs font-mono z-10">
        v2.5.0-Enterprise • Secure Connection
      </div>
    </div>
  );
};
