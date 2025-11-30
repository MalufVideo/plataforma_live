import React, { useState } from 'react';
import { StreamSource, Poll, Session, Survey, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Settings, BarChart3, Users, AlertTriangle, Eye } from 'lucide-react';

interface AdminConsoleProps {
  session: Session;
  currentSource: StreamSource;
  setSource: (s: StreamSource) => void;
  updatePoll: (p: Poll) => void;
  updateSurvey: (s: Survey) => void;
  lang: Language;
}

// Mock Charts using plain SVG/Divs for simplicity in this demo, but assuming Recharts in full build
const MiniChart = ({ color }: { color: string }) => (
    <div className="flex items-end gap-1 h-12 w-full">
        {[40, 60, 45, 70, 85, 65, 90, 80].map((h, i) => (
            <div key={i} className={`flex-1 rounded-t-sm opacity-80 ${color}`} style={{ height: `${h}%` }}></div>
        ))}
    </div>
);

export const AdminConsole: React.FC<AdminConsoleProps> = ({ session, currentSource, setSource, updatePoll, updateSurvey, lang }) => {
    const t = TRANSLATIONS[lang].admin;

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto bg-slate-950 text-slate-200 pb-20 md:pb-6">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white mb-1">{t.title}</h1>
                    <p className="text-sm text-slate-400">Session ID: {session.id} • {session.title}</p>
                </div>
                <div className="flex items-center gap-3 bg-red-950/30 border border-red-900/50 px-4 py-2 rounded-lg w-full md:w-auto justify-center md:justify-start">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="font-mono font-bold text-red-500">{t.onAir} - 00:24:15</span>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6">
                
                {/* Source Control */}
                <div className="col-span-12 lg:col-span-8 bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> {t.streamHealth}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                            <span className="text-xs text-slate-500 block mb-1">{t.bitrate}</span>
                            <span className="text-xl font-mono text-emerald-400">4,500 Kbps</span>
                            <MiniChart color="bg-emerald-600" />
                        </div>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                            <span className="text-xs text-slate-500 block mb-1">{t.fps}</span>
                            <span className="text-xl font-mono text-white">59.94</span>
                            <MiniChart color="bg-blue-600" />
                        </div>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                            <span className="text-xs text-slate-500 block mb-1">{t.dropped}</span>
                            <span className="text-xl font-mono text-slate-400">0.01%</span>
                            <MiniChart color="bg-yellow-600" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm font-medium mb-2">Active Ingest Source</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: StreamSource.CUSTOM_RTMP, label: 'Custom / RTMP', sub: 'Primary - OBS/vMix' },
                                { id: StreamSource.YOUTUBE, label: 'YouTube Embed', sub: 'Backup Stream' },
                                { id: StreamSource.HLS, label: 'Cloud CDN (HLS)', sub: 'Akamai / AWS' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSource(opt.id)}
                                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                        currentSource === opt.id 
                                        ? 'border-indigo-500 bg-indigo-900/20' 
                                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-bold ${currentSource === opt.id ? 'text-white' : 'text-slate-400'}`}>{opt.label}</span>
                                        {currentSource === opt.id && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>}
                                    </div>
                                    <span className="text-xs text-slate-500">{opt.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Engagement Control */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Presence / Stats */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                             <Eye className="w-4 h-4" /> Presence & Engagement
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <Users className="text-indigo-500 w-5 h-5" />
                                    <span>{t.activeViewers}</span>
                                </div>
                                <span className="font-mono text-xl text-white">{session.viewers.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="text-purple-500 w-5 h-5" />
                                    <span>{t.registered}</span>
                                </div>
                                <span className="font-mono text-xl text-slate-400">15,400</span>
                            </div>
                            
                            {/* Simple Presence Heatmap Visualization */}
                            <div className="pt-2">
                                <span className="text-xs text-slate-500 block mb-2">Global Audience Heatmap</span>
                                <div className="flex gap-0.5 h-2">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <div key={i} className={`flex-1 rounded-sm ${i > 5 && i < 15 ? 'bg-indigo-500' : 'bg-slate-700'}`} style={{ opacity: Math.random() * 0.5 + 0.5 }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Emergency */}
                    <div className="bg-red-950/10 rounded-xl border border-red-900/30 p-6">
                        <h2 className="text-sm font-semibold text-red-500 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> {t.dangerZone}
                        </h2>
                        <div className="flex gap-2">
                             <button className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 py-2 rounded text-sm transition-colors">
                                 {t.restart}
                             </button>
                             <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm transition-colors font-bold">
                                 {t.endEvent}
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};