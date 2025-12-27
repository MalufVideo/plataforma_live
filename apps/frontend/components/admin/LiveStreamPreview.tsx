import React, { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import { Play, Square, Volume2, VolumeX, Maximize2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface LiveStreamPreviewProps {
  streamKey: string;
  isStreaming?: boolean;
}

// HTTP-FLV server URL - update this to match your backend
const FLV_SERVER_URL = import.meta.env.VITE_FLV_SERVER_URL || 'https://flv.livevideo.com.br';

export const LiveStreamPreview: React.FC<LiveStreamPreviewProps> = ({
  streamKey,
  isStreaming = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<flvjs.Player | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ bitrate: 0, fps: 0 });

  const streamUrl = `${FLV_SERVER_URL}/live/${streamKey}.flv`;

  const initPlayer = () => {
    if (!videoRef.current || !flvjs.isSupported()) {
      setError('FLV playback not supported in this browser');
      return;
    }

    // Destroy existing player if any
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    setError(null);
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
        console.error('[FLV Player] Error:', errType, errDetail);
        if (errDetail === 'NetworkError' || errDetail === 'HttpStatusCodeInvalid') {
          setError('Stream not available. Make sure you are streaming to the server.');
        } else {
          setError(`Playback error: ${errDetail}`);
        }
        setIsConnected(false);
      });

      player.on(flvjs.Events.LOADING_COMPLETE, () => {
        console.log('[FLV Player] Loading complete');
      });

      player.on(flvjs.Events.METADATA_ARRIVED, () => {
        console.log('[FLV Player] Metadata arrived');
        setIsConnected(true);
        setError(null);
      });

      player.on(flvjs.Events.STATISTICS_INFO, (info) => {
        if (info.speed) {
          setStats(prev => ({
            ...prev,
            bitrate: Math.round(info.speed * 8 / 1000) // Convert to kbps
          }));
        }
      });

      playerRef.current = player;
      player.load();

      // Auto-play muted
      videoRef.current.muted = true;
      player.play();
      setIsPlaying(true);
      setIsMuted(true);

    } catch (err) {
      console.error('[FLV Player] Init error:', err);
      setError('Failed to initialize player');
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

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayer();
    } else {
      initPlayer();
    }
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
    return () => {
      stopPlayer();
    };
  }, []);

  // Auto-reconnect when stream key changes
  useEffect(() => {
    if (isPlaying && streamKey) {
      stopPlayer();
      setTimeout(initPlayer, 500);
    }
  }, [streamKey]);

  if (!flvjs.isSupported()) {
    return (
      <div className="bg-slate-900 rounded-lg p-4 text-center">
        <p className="text-red-400 text-sm">FLV playback is not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden">
      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          muted={isMuted}
        />

        {/* Overlay when not playing */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Play className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 text-sm mb-2">Live Stream Preview</p>
            <p className="text-slate-500 text-xs mb-4">Click play to connect to stream</p>
            <button
              onClick={togglePlay}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" /> Connect to Stream
            </button>
          </div>
        )}

        {/* Error overlay */}
        {error && isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <WifiOff className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={initPlayer}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {/* Connection status badge */}
        {isPlaying && !error && (
          <div className="absolute top-3 left-3">
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3" />
                  LIVE
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Connecting...
                </>
              )}
            </span>
          </div>
        )}

        {/* Stats badge */}
        {isPlaying && isConnected && stats.bitrate > 0 && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-black/60 rounded text-xs text-white font-mono">
              {stats.bitrate} kbps
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className={`p-2 rounded-lg transition-colors ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleMute}
            disabled={!isPlaying}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={initPlayer}
            disabled={!isPlaying}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-colors"
            title="Refresh stream"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {streamUrl.length > 50 ? '...' + streamUrl.slice(-40) : streamUrl}
          </span>

          <button
            onClick={toggleFullscreen}
            disabled={!isPlaying}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
