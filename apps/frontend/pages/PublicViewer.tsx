import React, { useEffect, useRef, useState } from 'react';
import flvjs from 'flv.js';
import {
  Play, Square, Volume2, VolumeX, Maximize2, RefreshCw,
  Wifi, WifiOff, Users, Radio, Share2, ExternalLink
} from 'lucide-react';

interface PublicViewerProps {
  projectId: string;
}

// Server URLs
const FLV_SERVER_URL = import.meta.env.VITE_FLV_SERVER_URL || 'https://flv.livevideo.com.br';
const API_URL = import.meta.env.VITE_API_URL || 'https://api.livevideo.com.br';

interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'LIVE' | 'ENDED';
  rtmpStreamKey: string;
  viewers: number;
  thumbnail?: string;
}

export const PublicViewer: React.FC<PublicViewerProps> = ({ projectId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<flvjs.Player | null>(null);

  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [stats, setStats] = useState({ bitrate: 0 });
  const [viewerCount, setViewerCount] = useState(0);

  // Fetch project info
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        // For now, we'll use Supabase directly. In production, use API endpoint
        const { supabase } = await import('../services/supabaseService');

        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('id, name, description, status, rtmp_stream_key, viewers, thumbnail')
          .eq('id', projectId)
          .single();

        if (fetchError || !data) {
          setError('Stream not found');
          return;
        }

        setProject({
          id: data.id,
          name: data.name,
          description: data.description,
          status: data.status,
          rtmpStreamKey: data.rtmp_stream_key,
          viewers: data.viewers || 0,
          thumbnail: data.thumbnail
        });

        setViewerCount(data.viewers || 0);
      } catch (err) {
        console.error('Failed to fetch project:', err);
        setError('Failed to load stream');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const streamUrl = project ? `${FLV_SERVER_URL}/live/${project.rtmpStreamKey}.flv` : '';

  const initPlayer = () => {
    if (!videoRef.current || !flvjs.isSupported() || !project) {
      setPlaybackError('Video playback not supported');
      return;
    }

    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    setPlaybackError(null);
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
        enableWorker: false,  // Disabled - causes errors in production builds
        enableStashBuffer: false,
        stashInitialSize: 128,
        lazyLoad: false,
        autoCleanupSourceBuffer: true
      });

      player.attachMediaElement(videoRef.current);

      player.on(flvjs.Events.ERROR, (errType, errDetail) => {
        console.error('[Player] Error:', errType, errDetail);
        if (errDetail === 'NetworkError' || errDetail === 'HttpStatusCodeInvalid') {
          setPlaybackError('Stream is not available. Please wait for the broadcast to start.');
        } else {
          setPlaybackError(`Playback error: ${errDetail}`);
        }
        setIsConnected(false);
      });

      player.on(flvjs.Events.METADATA_ARRIVED, () => {
        setIsConnected(true);
        setPlaybackError(null);
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
      setPlaybackError('Failed to initialize player');
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: project?.name || 'Live Stream',
          text: project?.description || 'Watch this live stream!',
          url
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  useEffect(() => {
    return () => {
      stopPlayer();
    };
  }, []);

  // Auto-play when project loads and is LIVE
  useEffect(() => {
    if (project?.status === 'LIVE' && !isPlaying) {
      initPlayer();
    }
  }, [project]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <WifiOff className="w-16 h-16 text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Stream Not Found</h1>
        <p className="text-slate-400">{error || 'This stream does not exist or has been removed.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">LIVE VIDEO</h1>
              <p className="text-xs text-slate-500">by On+Av</p>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        {/* Video Player */}
        <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              playsInline
              muted={isMuted}
              poster={project.thumbnail}
            />

            {/* Status Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {project.status === 'LIVE' && isConnected ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 rounded-full text-sm font-bold animate-pulse">
                  <Radio className="w-4 h-4" />
                  LIVE
                </span>
              ) : project.status === 'LIVE' ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 rounded-full text-sm font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-600 rounded-full text-sm font-bold">
                  {project.status === 'ENDED' ? 'ENDED' : 'OFFLINE'}
                </span>
              )}

              {/* Viewer Count */}
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 rounded-full text-sm">
                <Users className="w-4 h-4" />
                {viewerCount.toLocaleString()}
              </span>
            </div>

            {/* Bitrate Badge */}
            {isConnected && stats.bitrate > 0 && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1.5 bg-black/60 rounded-full text-xs font-mono">
                  {stats.bitrate} kbps
                </span>
              </div>
            )}

            {/* Play Overlay */}
            {!isPlaying && project.status !== 'ENDED' && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 cursor-pointer"
                onClick={togglePlay}
              >
                <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mb-4 hover:bg-indigo-500 transition-colors">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
                <p className="text-lg font-medium">Click to Watch</p>
              </div>
            )}

            {/* Error Overlay */}
            {playbackError && isPlaying && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                <WifiOff className="w-12 h-12 text-amber-400 mb-4" />
                <p className="text-amber-400 text-center px-4 mb-4">{playbackError}</p>
                <button
                  onClick={initPlayer}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            )}

            {/* Ended Overlay */}
            {project.status === 'ENDED' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Square className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-xl font-bold mb-2">Stream Ended</p>
                <p className="text-slate-400">This broadcast has ended.</p>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="bg-slate-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                disabled={project.status === 'ENDED'}
                className={`p-2.5 rounded-lg transition-colors ${
                  isPlaying
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleMute}
                disabled={!isPlaying}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                onClick={initPlayer}
                disabled={!isPlaying}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-colors"
                title="Refresh stream"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={toggleFullscreen}
              disabled={!isPlaying}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg transition-colors"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stream Info */}
        <div className="mt-6 bg-slate-900 rounded-xl p-6 border border-slate-800">
          <h2 className="text-2xl font-bold mb-2">{project.name}</h2>
          <p className="text-slate-400 leading-relaxed">{project.description}</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-slate-600 text-sm">
        Powered by LIVE VIDEO Platform
      </footer>
    </div>
  );
};

export default PublicViewer;
