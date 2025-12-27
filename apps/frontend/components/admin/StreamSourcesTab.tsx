import React, { useState, useEffect, useRef } from 'react';
import {
  Radio, Server, Copy, Check, Eye, EyeOff,
  Play, Square, RefreshCw, AlertTriangle, CheckCircle,
  Zap, Share2, ExternalLink, Users, Clock, Activity,
  Settings, ChevronDown, Wifi, WifiOff, Volume2, VolumeX, Maximize2
} from 'lucide-react';
import flvjs from 'flv.js';
import { StreamSource, Project } from '../../types';

interface StreamSourcesTabProps {
  currentSource: StreamSource;
  setSource: (s: StreamSource) => void;
  setYoutubeVideoId: (id: string) => void;
  isPremium: boolean;
  currentProject?: Project | null;
}

// Server URLs
const FLV_SERVER_URL = import.meta.env.VITE_FLV_SERVER_URL || 'http://72.60.142.28:8001';

export const StreamSourcesTab: React.FC<StreamSourcesTabProps> = ({
  currentSource,
  setSource,
  setYoutubeVideoId,
  isPremium,
  currentProject
}) => {
  // Video player refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<flvjs.Player | null>(null);

  // Stream state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [stats, setStats] = useState({ bitrate: 0 });
  const [streamDuration, setStreamDuration] = useState(0);

  // UI state
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // RTMP credentials
  const rtmpServerUrl = 'rtmp://ingest.livevideo.com.br:1936/live';
  const rtmpStreamKey = currentProject?.rtmpStreamKey || '';
  const streamUrl = currentProject ? `${FLV_SERVER_URL}/live/${currentProject.rtmpStreamKey}.flv` : '';
  const shareUrl = currentProject ? `${window.location.origin}/watch/${currentProject.id}` : '';

  // Stream duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected && currentProject?.status === 'LIVE') {
      interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, currentProject?.status]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Initialize FLV player
  const initPlayer = () => {
    if (!videoRef.current || !flvjs.isSupported() || !currentProject) {
      setStreamError('Video playback not supported or no project selected');
      return;
    }

    // Destroy existing player
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    setStreamError(null);
    setIsConnected(false);

    try {
      const player = flvjs.createPlayer({
        type: 'flv',
        url: streamUrl,
        isLive: true,
        hasAudio: true,
        hasVideo: true,
        cors: true
      }, {
        enableWorker: true,
        enableStashBuffer: false,
        stashInitialSize: 128,
        lazyLoad: false,
        autoCleanupSourceBuffer: true
      });

      player.attachMediaElement(videoRef.current);

      player.on(flvjs.Events.ERROR, (errType, errDetail) => {
        console.error('[Player] Error:', errType, errDetail);
        if (errDetail === 'NetworkError' || errDetail === 'HttpStatusCodeInvalid') {
          setStreamError('Waiting for stream... Start broadcasting from OBS or your encoder.');
        } else {
          setStreamError(`Connection error: ${errDetail}`);
        }
        setIsConnected(false);
      });

      player.on(flvjs.Events.METADATA_ARRIVED, () => {
        setIsConnected(true);
        setStreamError(null);
        setStreamDuration(0);
      });

      player.on(flvjs.Events.STATISTICS_INFO, (info) => {
        if (info.speed) {
          setStats({ bitrate: Math.round(info.speed * 8 / 1000) });
        }
      });

      playerRef.current = player;
      player.load();

      videoRef.current.muted = true;
      player.play();
      setIsPlaying(true);
      setIsMuted(true);

    } catch (err) {
      console.error('[Player] Init error:', err);
      setStreamError('Failed to initialize player');
    }
  };

  const stopPlayer = () => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.unload();
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setIsPlaying(false);
    setIsConnected(false);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPlayer();
  }, []);

  // Auto-connect when project changes
  useEffect(() => {
    if (currentProject && !isPlaying) {
      initPlayer();
    }
  }, [currentProject?.id]);

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

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedShareUrl(true);
    setTimeout(() => setCopiedShareUrl(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share && currentProject) {
      try {
        await navigator.share({
          title: currentProject.name,
          text: currentProject.description || 'Watch live!',
          url: shareUrl
        });
      } catch (err) {
        handleCopyShareUrl();
      }
    } else {
      handleCopyShareUrl();
    }
  };

  // No project selected state
  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Radio className="w-10 h-10 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">No Project Selected</h2>
          <p className="text-slate-400 mb-6">
            Go to the Projects tab to create or select a project before you can start streaming.
          </p>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 text-left">
            <h4 className="text-sm font-bold text-white mb-2">Quick Start Guide:</h4>
            <ol className="text-sm text-slate-400 space-y-2">
              <li>1. Go to <span className="text-indigo-400">Projects</span> tab</li>
              <li>2. Create a new project or select existing one</li>
              <li>3. Return here to see your stream preview</li>
              <li>4. Copy RTMP credentials to OBS/encoder</li>
              <li>5. Start streaming!</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Layout - YouTube Studio Style */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Video Preview */}
        <div className="col-span-12 xl:col-span-8">
          {/* Video Player Container */}
          <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
            {/* Video Element */}
            <div className="relative aspect-video bg-slate-950">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                playsInline
                muted={isMuted}
              />

              {/* Live Badge & Stats Overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-3">
                {isConnected ? (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-red-600 rounded-lg text-sm font-bold text-white animate-pulse">
                    <Radio className="w-4 h-4" />
                    LIVE
                  </span>
                ) : isPlaying ? (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 rounded-lg text-sm font-bold text-white">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-lg text-sm font-bold text-white">
                    <WifiOff className="w-4 h-4" />
                    Offline
                  </span>
                )}

                {isConnected && (
                  <>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 rounded-lg text-sm text-white">
                      <Clock className="w-4 h-4" />
                      {formatDuration(streamDuration)}
                    </span>
                    {stats.bitrate > 0 && (
                      <span className="px-3 py-1.5 bg-black/60 rounded-lg text-sm text-white font-mono">
                        {stats.bitrate} kbps
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Waiting for Stream Overlay */}
              {!isConnected && isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                  <h3 className="text-xl font-bold text-white mb-2">Waiting for Stream</h3>
                  <p className="text-slate-400 text-center max-w-md px-4">
                    {streamError || 'Start broadcasting from OBS, vMix, or your encoder using the credentials below.'}
                  </p>
                </div>
              )}

              {/* Not Playing Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                  <button
                    onClick={initPlayer}
                    className="w-20 h-20 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center mb-4 transition-all hover:scale-105"
                  >
                    <Play className="w-10 h-10 text-white ml-1" />
                  </button>
                  <p className="text-slate-400">Click to connect to stream preview</p>
                </div>
              )}
            </div>

            {/* Player Controls Bar */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isPlaying ? (
                  <button
                    onClick={stopPlayer}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    Stop Preview
                  </button>
                ) : (
                  <button
                    onClick={initPlayer}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Preview
                  </button>
                )}

                <button
                  onClick={toggleMute}
                  disabled={!isPlaying}
                  className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                <button
                  onClick={initPlayer}
                  disabled={!isPlaying}
                  className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 font-mono hidden md:block">
                  {currentProject.name}
                </span>
                <button
                  onClick={toggleFullscreen}
                  disabled={!isPlaying}
                  className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-colors"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stream Info Cards */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs uppercase font-bold">Viewers</span>
              </div>
              <p className="text-2xl font-bold text-white">{currentProject.viewers.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs uppercase font-bold">Stream Health</span>
              </div>
              <p className={`text-2xl font-bold ${isConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isConnected ? 'Excellent' : 'Offline'}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-xs uppercase font-bold">Bitrate</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {isConnected && stats.bitrate > 0 ? `${stats.bitrate} kbps` : '-- kbps'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Settings & Share */}
        <div className="col-span-12 xl:col-span-4 space-y-4">
          {/* Share Section */}
          <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-900/10 border border-emerald-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Share Your Stream</h3>
                <p className="text-xs text-emerald-300/70">Public viewing link</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono truncate"
                />
                <button
                  onClick={handleCopyShareUrl}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {copiedShareUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </a>
              </div>
            </div>
          </div>

          {/* Stream Settings */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Stream Settings</h3>
                  <p className="text-xs text-slate-500">RTMP credentials for OBS</p>
                </div>
              </div>
              <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3" /> Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" /> Waiting
                  </>
                )}
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Server URL */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Server URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rtmpServerUrl}
                    readOnly
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Stream Key */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stream Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showStreamKey ? 'text' : 'password'}
                      value={rtmpStreamKey}
                      readOnly
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono pr-10"
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
                    className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Keep your stream key private
                </p>
              </div>

              {/* Quick OBS Setup Guide */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    OBS Setup Guide
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
                </button>

                {showSettings && (
                  <div className="mt-3 space-y-3 text-xs">
                    <div className="bg-slate-900 rounded-lg p-3">
                      <p className="text-slate-400 mb-2">Recommended Settings:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-slate-500">Codec:</span> <span className="text-white">H.264</span></div>
                        <div><span className="text-slate-500">Bitrate:</span> <span className="text-white">4500-6000 kbps</span></div>
                        <div><span className="text-slate-500">Resolution:</span> <span className="text-white">1920x1080</span></div>
                        <div><span className="text-slate-500">Keyframe:</span> <span className="text-white">2 seconds</span></div>
                        <div><span className="text-slate-500">Audio:</span> <span className="text-white">AAC 128kbps</span></div>
                        <div><span className="text-slate-500">FPS:</span> <span className="text-white">30 or 60</span></div>
                      </div>
                    </div>
                    <ol className="text-slate-400 space-y-1 pl-4 list-decimal">
                      <li>Open OBS → Settings → Stream</li>
                      <li>Service: Custom</li>
                      <li>Paste Server URL above</li>
                      <li>Paste Stream Key above</li>
                      <li>Click "Start Streaming"</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project Status Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Current Project</span>
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                currentProject.status === 'LIVE' ? 'bg-red-500 text-white' :
                currentProject.status === 'DRAFT' ? 'bg-amber-500 text-white' :
                'bg-slate-600 text-white'
              }`}>
                {currentProject.status}
              </span>
            </div>
            <h4 className="text-white font-bold mb-1">{currentProject.name}</h4>
            <p className="text-xs text-slate-500 line-clamp-2">{currentProject.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
