import React, { useState } from 'react';
import { StreamSource, Poll, Session, Survey, Language, PlayerSize, HtmlContent } from '../types';
import { TRANSLATIONS } from '../constants';
import { Settings, BarChart3, Users, AlertTriangle, Eye, Maximize2, Monitor, Minimize2 } from 'lucide-react';

interface AdminConsoleProps {
  session: Session;
  currentSource: StreamSource;
  setSource: (s: StreamSource) => void;
  updatePoll: (p: Poll) => void;
  updateSurvey: (s: Survey) => void;
  lang: Language;
  playerSize: PlayerSize;
  setPlayerSize: (size: PlayerSize) => void;
  htmlContent: HtmlContent | null;
  setHtmlContent: (content: HtmlContent | null) => void;
}

// Mock Charts using plain SVG/Divs for simplicity in this demo, but assuming Recharts in full build
const MiniChart = ({ color }: { color: string }) => (
    <div className="flex items-end gap-1 h-12 w-full">
        {[40, 60, 45, 70, 85, 65, 90, 80].map((h, i) => (
            <div key={i} className={`flex-1 rounded-t-sm opacity-80 ${color}`} style={{ height: `${h}%` }}></div>
        ))}
    </div>
);

export const AdminConsole: React.FC<AdminConsoleProps> = ({
    session,
    currentSource,
    setSource,
    updatePoll,
    updateSurvey,
    lang,
    playerSize,
    setPlayerSize,
    htmlContent,
    setHtmlContent
}) => {
    const t = TRANSLATIONS[lang].admin;
    const [customHtml, setCustomHtml] = useState('');

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

                {/* Player Size Control */}
                <div className="col-span-12 bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Monitor className="w-4 h-4" /> {t.playerSizeControl}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[
                            { id: PlayerSize.FULL, label: t.fullSize, sub: t.fullSizeDesc, icon: Maximize2 },
                            { id: PlayerSize.MEDIUM, label: t.mediumSize, sub: t.mediumSizeDesc, icon: Monitor },
                            { id: PlayerSize.SMALL, label: t.smallSize, sub: t.smallSizeDesc, icon: Minimize2 },
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setPlayerSize(opt.id)}
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                    playerSize === opt.id
                                    ? 'border-indigo-500 bg-indigo-900/20'
                                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <opt.icon className={`w-5 h-5 ${playerSize === opt.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                                        <span className={`font-bold ${playerSize === opt.id ? 'text-white' : 'text-slate-400'}`}>{opt.label}</span>
                                    </div>
                                    {playerSize === opt.id && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>}
                                </div>
                                <span className="text-xs text-slate-500">{opt.sub}</span>
                            </button>
                        ))}
                    </div>

                    {playerSize !== PlayerSize.FULL && (
                        <div className="mt-6 pt-6 border-t border-slate-800">
                            <h3 className="text-sm font-medium mb-3">{t.htmlContentArea}</h3>

                            {/* Sample HTML Content Buttons */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <button
                                    onClick={() => setHtmlContent({
                                        id: 'survey-example',
                                        title: t.sampleSurvey,
                                        html: `
                                            <div class="bg-slate-900 p-6 rounded-lg h-full flex flex-col">
                                                <h3 class="text-xl font-bold text-white mb-4">📊 ${t.quickFeedback}</h3>
                                                <p class="text-slate-300 mb-6">${t.surveyQuestion}</p>
                                                <div class="space-y-3 flex-1">
                                                    <button class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-medium transition-colors">⭐⭐⭐⭐⭐ ${t.excellent}</button>
                                                    <button class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors">⭐⭐⭐⭐ ${t.good}</button>
                                                    <button class="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded-lg font-medium transition-colors">⭐⭐⭐ ${t.average}</button>
                                                    <button class="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-lg font-medium transition-colors">⭐⭐ ${t.poor}</button>
                                                </div>
                                            </div>
                                        `,
                                        isActive: true
                                    })}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    {t.loadSurvey}
                                </button>
                                <button
                                    onClick={() => setHtmlContent({
                                        id: 'ad-example',
                                        title: t.sampleAd,
                                        html: `
                                            <div class="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-lg h-full flex flex-col items-center justify-center text-center">
                                                <h2 class="text-3xl font-bold text-white mb-4">🚀 ${t.adTitle}</h2>
                                                <p class="text-indigo-100 text-lg mb-6">${t.adDescription}</p>
                                                <button class="bg-white text-indigo-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-indigo-50 transition-colors">
                                                    ${t.learnMore} →
                                                </button>
                                            </div>
                                        `,
                                        isActive: true
                                    })}
                                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    {t.loadAd}
                                </button>
                                <button
                                    onClick={() => setHtmlContent(null)}
                                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    {t.clearContent}
                                </button>
                            </div>

                            {/* Custom HTML Input */}
                            <div className="mt-4">
                                <label className="text-xs text-slate-400 block mb-2">{t.customHtml}</label>
                                <textarea
                                    value={customHtml}
                                    onChange={(e) => setCustomHtml(e.target.value)}
                                    placeholder={t.htmlPlaceholder}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white font-mono h-32 resize-none focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                    onClick={() => {
                                        if (customHtml.trim()) {
                                            setHtmlContent({
                                                id: 'custom-' + Date.now(),
                                                title: 'Custom HTML',
                                                html: customHtml,
                                                isActive: true
                                            });
                                        }
                                    }}
                                    className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    {t.loadCustomHtml}
                                </button>
                            </div>

                            {htmlContent && (
                                <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-emerald-400">✓ {t.activeContent}: {htmlContent.title}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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