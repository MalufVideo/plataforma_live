import React, { useState } from 'react';
import { StreamSource, Poll, Session, Survey, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Settings, RefreshCw, BarChart3, Users, AlertTriangle, ClipboardList, Eye, ArrowLeft, Activity, MonitorPlay, Mic2, Layers, Wifi, Globe } from 'lucide-react';

interface AdminConsoleProps {
  session: Session;
  currentSource: StreamSource;
  setSource: (s: StreamSource) => void;
  updatePoll: (p: Poll) => void;
  updateSurvey: (s: Survey) => void;
  lang: Language;
  onLogout: () => void;
}

const MiniChart = ({ color }: { color: string }) => (
    <div className="flex items-end gap-0.5 h-8 w-full mt-2">
        {[40, 60, 45, 70, 85, 65, 90, 80, 70, 60, 50, 65, 75, 80].map((h, i) => (
            <div key={i} className={`flex-1 rounded-t-sm opacity-80 ${color}`} style={{ height: `${h}%` }}></div>
        ))}
    </div>
);

export const AdminConsole: React.FC<AdminConsoleProps> = ({ session, currentSource, setSource, updatePoll, updateSurvey, lang, onLogout }) => {
    const t = TRANSLATIONS[lang].admin;

    return (
        <div className="min-h-screen bg-[#0b0c15] text-slate-200 font-mono flex flex-col">
            {/* Technical Header */}
            <header className="h-14 bg-[#14151f] border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-slate-700 mx-2"></div>
                    <h1 className="text-sm font-bold text-slate-100 tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        {t.title}
                    </h1>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">REGION</span>
                        <span className="text-emerald-500 font-bold">US-EAST-1</span>
                    </div>
                    <div className="flex items-center gap-3 bg-red-950/20 border border-red-900/50 px-3 py-1 rounded">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <span className="font-bold text-red-500 text-xs">{t.onAir} 00:24:15</span>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-y-auto">
                
                {/* Column 1: Source & Signal (Left) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    
                    {/* Source Monitor */}
                    <div className="bg-[#14151f] rounded border border-slate-800 p-1">
                        <div className="bg-black aspect-video relative flex items-center justify-center overflow-hidden">
                             {/* Mock Video Feed */}
                             <img src="https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=1200&q=80" className="opacity-50 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                             <div className="absolute top-4 left-4 flex gap-2">
                                <span className="bg-black/70 text-emerald-500 text-[10px] font-bold px-2 py-0.5 border border-emerald-900/50">PGM</span>
                                <span className="bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 border border-slate-700">1080p60</span>
                             </div>
                        </div>
                        <div className="p-3 grid grid-cols-4 gap-2">
                             {[
                                { id: StreamSource.CUSTOM_RTMP, label: 'CAM 1', type: 'RTMP' },
                                { id: StreamSource.HLS, label: 'CAM 2', type: 'SRT' },
                                { id: StreamSource.YOUTUBE, label: 'BKUP', type: 'YT' },
                                { id: 'black', label: 'BLACK', type: 'GEN' }
                             ].map((src) => (
                                 <button
                                    key={src.id}
                                    onClick={() => src.id !== 'black' && setSource(src.id as StreamSource)}
                                    className={`h-12 border rounded flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                                        currentSource === src.id 
                                        ? 'bg-red-900/20 border-red-600 text-red-500 shadow-[0_0_10px_rgba(220,38,38,0.2)]' 
                                        : 'bg-[#0b0c15] border-slate-800 text-slate-500 hover:border-slate-600'
                                    }`}
                                 >
                                     <span className="text-xs font-bold z-10">{src.label}</span>
                                     <span className="text-[8px] opacity-50 z-10">{src.type}</span>
                                     {currentSource === src.id && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full"></div>}
                                 </button>
                             ))}
                        </div>
                    </div>

                    {/* Technical Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#14151f] p-4 rounded border border-slate-800">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">{t.bitrate}</span>
                                <Activity className="w-3 h-3 text-emerald-500" />
                            </div>
                            <span className="text-xl font-mono text-emerald-400">4,500</span>
                            <span className="text-xs text-slate-500 ml-1">Kbps</span>
                            <MiniChart color="bg-emerald-600" />
                        </div>
                        <div className="bg-[#14151f] p-4 rounded border border-slate-800">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">{t.fps}</span>
                                <MonitorPlay className="w-3 h-3 text-blue-500" />
                            </div>
                            <span className="text-xl font-mono text-white">59.94</span>
                            <MiniChart color="bg-blue-600" />
                        </div>
                        <div className="bg-[#14151f] p-4 rounded border border-slate-800">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase">{t.dropped}</span>
                                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                            </div>
                            <span className="text-xl font-mono text-slate-400">0.01%</span>
                            <MiniChart color="bg-yellow-600" />
                        </div>
                    </div>
                </div>

                {/* Column 2: Operations (Right) */}
                <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col">
                    
                    {/* Audience Stats */}
                    <div className="bg-[#14151f] rounded border border-slate-800 p-5">
                         <div className="flex items-center gap-2 mb-4 text-slate-400">
                            <Globe className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">{t.activeViewers}</span>
                         </div>
                         <div className="text-4xl font-mono font-light text-white mb-2">{session.viewers.toLocaleString()}</div>
                         <div className="flex gap-1 h-1.5 w-full bg-slate-900 rounded overflow-hidden">
                             <div className="w-[70%] bg-indigo-500"></div>
                             <div className="w-[20%] bg-purple-500"></div>
                             <div className="w-[10%] bg-slate-700"></div>
                         </div>
                         <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Desktop</span>
                             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Mobile</span>
                             <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div> TV</span>
                         </div>
                    </div>

                    {/* Stream Controls */}
                    <div className="bg-[#14151f] rounded border border-slate-800 p-5 flex-1">
                        <div className="flex items-center gap-2 mb-6 text-indigo-400">
                            <Settings className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Stream Controls</span>
                        </div>

                        <div className="space-y-4 text-center text-slate-500 py-8">
                            <Activity className="w-12 h-12 mx-auto opacity-30" />
                            <p className="text-sm">Advanced controls will be available here</p>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="mt-auto border-t border-slate-800 pt-6">
                        <button className="w-full bg-red-600/10 hover:bg-red-600/20 border border-red-900 text-red-500 hover:text-red-400 py-3 rounded text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2">
                            <Wifi className="w-4 h-4" />
                            {t.endEvent}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};