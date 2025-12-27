import React, { useState } from 'react';
import {
  Youtube, Radio, Server, Shield, Copy, Check, Eye, EyeOff,
  Play, Square, RefreshCw, AlertTriangle, CheckCircle, Lock,
  Zap, Settings, Link2, Unlink
} from 'lucide-react';
import { StreamSource, Project } from '../../types';
import { LiveStreamPreview } from './LiveStreamPreview';

interface StreamSourcesTabProps {
  currentSource: StreamSource;
  setSource: (s: StreamSource) => void;
  setYoutubeVideoId: (id: string) => void;
  isPremium: boolean;
  currentProject?: Project | null;
}

export const StreamSourcesTab: React.FC<StreamSourcesTabProps> = ({
  currentSource,
  setSource,
  setYoutubeVideoId,
  isPremium,
  currentProject
}) => {
  // YouTube Source State
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeVideoIdLocal, setYoutubeVideoIdLocal] = useState('');
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const [hideYoutubeBranding, setHideYoutubeBranding] = useState(true);
  const [disableYoutubeControls, setDisableYoutubeControls] = useState(true);
  const [preventUrlCopy, setPreventUrlCopy] = useState(true);

  // RTMP Source State
  const [rtmpConnected, setRtmpConnected] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // RTMP credentials - use current project's stream key
  const rtmpServerUrl = 'rtmp://ingest.livevideo.com.br:1936/live';
  const rtmpStreamKey = currentProject?.rtmpStreamKey || 'No project selected - create a project first';
  const rtmpBackupUrl = 'rtmp://backup.livevideo.com.br:1936/live';

  const extractYoutubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleYoutubeConnect = () => {
    const videoId = extractYoutubeId(youtubeUrl);
    if (videoId) {
      setYoutubeVideoIdLocal(videoId);
      setYoutubeVideoId(videoId);
      setYoutubeConnected(true);
      setSource(StreamSource.YOUTUBE);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(rtmpStreamKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(rtmpServerUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Source Selection Header */}
      <div className="flex items-center gap-4 p-4 bg-[#14151f] rounded-lg border border-slate-800">
        <span className="text-sm text-slate-400">Active Source:</span>
        <div className="flex gap-2">
          {[
            { id: StreamSource.YOUTUBE, label: 'YouTube', icon: Youtube, color: 'red' },
            { id: StreamSource.CUSTOM_RTMP, label: 'RTMP Direct', icon: Radio, color: 'indigo', premium: true },
            { id: StreamSource.HLS, label: 'HLS/CDN', icon: Server, color: 'emerald' },
          ].map((src) => (
            <button
              key={src.id}
              onClick={() => setSource(src.id)}
              disabled={src.premium && !isPremium}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${currentSource === src.id
                ? `bg-${src.color}-900/30 border-${src.color}-500 text-${src.color}-400`
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                } ${src.premium && !isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <src.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{src.label}</span>
              {src.premium && (
                <span className="text-[8px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded font-bold">
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* YouTube Source Panel */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">YouTube Live Source</h3>
                  <p className="text-[10px] text-slate-500">Embed any YouTube live stream</p>
                </div>
              </div>
              {youtubeConnected && (
                <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* URL Input */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">YouTube Live URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or youtube.com/live/..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={handleYoutubeConnect}
                    disabled={!youtubeUrl}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </div>

              {/* Preview */}
              {youtubeConnected && youtubeVideoIdLocal && (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoIdLocal}?autoplay=0&controls=${disableYoutubeControls ? 0 : 1}&modestbranding=${hideYoutubeBranding ? 1 : 0}&rel=0&showinfo=0&iv_load_policy=3&disablekb=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  {/* Overlay to prevent interaction */}
                  {preventUrlCopy && (
                    <div className="absolute inset-0 bg-transparent" onContextMenu={(e) => e.preventDefault()} />
                  )}
                </div>
              )}

              {/* Branding Controls */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Branding & Security</h4>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">Hide YouTube Branding</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${hideYoutubeBranding ? 'bg-red-600' : 'bg-slate-700'}`}>
                    <div
                      className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${hideYoutubeBranding ? 'translate-x-5' : 'translate-x-0.5'}`}
                      onClick={() => setHideYoutubeBranding(!hideYoutubeBranding)}
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <Square className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">Disable Player Controls</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${disableYoutubeControls ? 'bg-red-600' : 'bg-slate-700'}`}>
                    <div
                      className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${disableYoutubeControls ? 'translate-x-5' : 'translate-x-0.5'}`}
                      onClick={() => setDisableYoutubeControls(!disableYoutubeControls)}
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-300">Prevent URL Copy/Share</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${preventUrlCopy ? 'bg-red-600' : 'bg-slate-700'}`}>
                    <div
                      className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${preventUrlCopy ? 'translate-x-5' : 'translate-x-0.5'}`}
                      onClick={() => setPreventUrlCopy(!preventUrlCopy)}
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RTMP Direct Ingest Panel - Premium */}
        <div className="col-span-12 lg:col-span-6">
          <div className={`bg-[#14151f] rounded-lg border overflow-hidden ${isPremium ? 'border-amber-500/30' : 'border-slate-800'}`}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-900/20 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">RTMP Direct Ingest</h3>
                    <span className="text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                      PREMIUM
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Nginx + FFmpeg • Ultra-low latency</p>
                </div>
              </div>
              {isPremium && rtmpConnected && (
                <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                  <Zap className="w-3 h-3" /> Receiving
                </span>
              )}
            </div>

            {isPremium ? (
              <div className="p-4 space-y-4">
                {/* Current Project Indicator */}
                {currentProject ? (
                  <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-indigo-400 uppercase font-bold">Streaming to Project</span>
                        <p className="text-sm text-white font-medium">{currentProject.name}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        currentProject.status === 'LIVE' ? 'bg-red-500 text-white' :
                        currentProject.status === 'DRAFT' ? 'bg-amber-500 text-white' :
                        'bg-slate-500 text-white'
                      }`}>
                        {currentProject.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">No project selected. Go to Projects tab to create or select a project first.</span>
                    </div>
                  </div>
                )}

                {/* Server Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] text-slate-500 uppercase">Primary Server</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-emerald-400">Online • 12ms</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-4 h-4 text-blue-500" />
                      <span className="text-[10px] text-slate-500 uppercase">Backup Server</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-blue-400">Standby • 18ms</span>
                    </div>
                  </div>
                </div>

                {/* RTMP Credentials */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Server URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={rtmpServerUrl}
                        readOnly
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                      />
                      <button
                        onClick={handleCopyUrl}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      >
                        {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-2">Stream Key</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type={showStreamKey ? 'text' : 'password'}
                          value={rtmpStreamKey}
                          readOnly
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono pr-10"
                        />
                        <button
                          onClick={() => setShowStreamKey(!showStreamKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          {showStreamKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        onClick={handleCopyKey}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      >
                        {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Never share your stream key
                    </p>
                  </div>
                </div>

                {/* Live Stream Preview */}
                {currentProject && (
                  <div className="pt-3 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Live Preview</h4>
                    <LiveStreamPreview
                      streamKey={currentProject.rtmpStreamKey}
                      isStreaming={currentProject.status === 'LIVE'}
                    />
                  </div>
                )}

                {/* Encoder Settings */}
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Recommended Encoder Settings</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900/50 rounded p-2">
                      <span className="text-slate-500">Codec:</span>
                      <span className="text-white ml-2">H.264 / x264</span>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <span className="text-slate-500">Bitrate:</span>
                      <span className="text-white ml-2">4500-6000 Kbps</span>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <span className="text-slate-500">Resolution:</span>
                      <span className="text-white ml-2">1920x1080</span>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <span className="text-slate-500">Keyframe:</span>
                      <span className="text-white ml-2">2 seconds</span>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <span className="text-slate-500">Audio:</span>
                      <span className="text-white ml-2">AAC 128 Kbps</span>
                    </div>
                    <div className="bg-slate-900/50 rounded p-2">
                      <span className="text-slate-500">FPS:</span>
                      <span className="text-white ml-2">30 or 60</span>
                    </div>
                  </div>
                </div>

                {/* Connection Test */}
                <button
                  onClick={() => setRtmpConnected(!rtmpConnected)}
                  className={`w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${rtmpConnected
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                    }`}
                >
                  {rtmpConnected ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Stream Connected
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" /> Test Connection
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-slate-600" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Premium Feature</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Direct RTMP ingest bypasses YouTube servers for ultra-low latency streaming with your own hardware encoder.
                </p>
                <ul className="text-left text-xs text-slate-500 space-y-2 mb-6 max-w-xs mx-auto">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-amber-500" /> Nginx RTMP + FFmpeg transcoding
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-amber-500" /> Sub-second latency
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-amber-500" /> Adaptive bitrate streaming
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-amber-500" /> Full analytics & geo data
                  </li>
                </ul>
                <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all">
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
