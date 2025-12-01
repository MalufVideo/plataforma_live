import React, { useState } from 'react';
import { StreamSource, Poll, Session, Survey, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Settings, RefreshCw, BarChart3, Users, AlertTriangle, ClipboardList, Eye, ArrowLeft, Activity, MonitorPlay, Mic2, Layers, Wifi, Globe } from 'lucide-react';
import { suggestPollQuestion, generateSurvey } from '../services/geminiService';

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
    const [aiLoading, setAiLoading] = useState(false);
    const [surveyLoading, setSurveyLoading] = useState(false);
    
    const t = TRANSLATIONS[lang].admin;

    const handleGeneratePoll = async () => {
        setAiLoading(true);
        const context = "We are discussing the trade-offs between low latency streaming protocols like WebRTC and scalability of HLS CDNs.";
        const result = await suggestPollQuestion(context, lang);
        try {
            const parsed = JSON.parse(result);
            if (parsed.question && parsed.options) {
                updatePoll({
                    id: `p-${Date.now()}`,
                    question: parsed.question,
                    options: parsed.options.map((t: string, i: number) => ({ id: `o${i}`, text: t, votes: 0 })),
                    isActive: true,
                    totalVotes: 0
                });
            }
        } catch (e) {
            console.error("Failed to parse AI poll");
        }
        setAiLoading(false);
    };

    const handleGenerateSurvey = async () => {
        setSurveyLoading(true);
        const result = await generateSurvey(session.title, lang);
        try {
            const parsed = JSON.parse(result);
            if (parsed.title && parsed.fields) {
                updateSurvey({
                    id: `srv-${Date.now()}`,
                    title: parsed.title,
                    fields: parsed.fields,
                    isActive: true
                });
            }
        } catch (e) {
            console.error("Failed to parse AI survey");
        }
        setSurveyLoading(false);
    };

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

                    {/* AI Director Tools */}
                    <div className="bg-[#14151f] rounded border border-slate-800 p-5 flex-1">
                        <div className="flex items-center gap-2 mb-6 text-indigo-400">
                            <Mic2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">{t.aiDirector}</span>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={handleGeneratePoll}
                                disabled={aiLoading}
                                className="w-full group bg-indigo-900/10 hover:bg-indigo-900/30 border border-indigo-500/30 hover:border-indigo-400 text-indigo-300 rounded p-4 text-left transition-all"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-sm">{t.createPoll}</span>
                                    <BarChart3 className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                                </div>
                                <p className="text-[10px] opacity-70">Analyze audio transcript & suggest engagement.</p>
                            </button>

                            <button 
                                onClick={handleGenerateSurvey}
                                disabled={surveyLoading}
                                className="w-full group bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700 hover:border-slate-500 text-slate-300 rounded p-4 text-left transition-all"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-sm">{t.createSurvey}</span>
                                    <ClipboardList className={`w-4 h-4 ${surveyLoading ? 'animate-spin' : ''}`} />
                                </div>
                                <p className="text-[10px] opacity-70">Generate session feedback form.</p>
                            </button>
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