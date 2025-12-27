import React, { useEffect, useRef, useState } from 'react';
import { StreamSource, UserRole, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Maximize, Volume2, VolumeX, Radio, Settings2, PenTool, Eraser, Activity } from 'lucide-react';

interface VideoPlayerProps {
  source: StreamSource;
  youtubeVideoId?: string;
  isLive: boolean;
  role: UserRole;
  lang: Language;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, youtubeVideoId, isLive, role, lang }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.66); // Volume from 0 to 1
  const [showControls, setShowControls] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const t = TRANSLATIONS[lang].stage;

  const startDrawing = (e: React.MouseEvent) => {
    if (!drawingMode || !canvasRef.current) return;
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingMode || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, clickX / rect.width));
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasRef.current.offsetWidth;
      canvasRef.current.height = canvasRef.current.offsetHeight;
    }
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  return (
    <div
      className="relative w-full aspect-video bg-black rounded-none lg:rounded-xl overflow-hidden shadow-2xl group border-y lg:border border-slate-800"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {source === StreamSource.YOUTUBE && youtubeVideoId ? (
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=0&controls=1&modestbranding=1`}
            title="Live Stream"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full object-cover"
          ></iframe>
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
            {/* Demo video for testing volume controls */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              loop
              muted={isMuted}
              playsInline
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-slate-900/40 z-0"></div>

            <div className="z-10 flex flex-col items-center">
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-slate-900/50 backdrop-blur-md border border-slate-700 flex items-center justify-center mb-4 shadow-xl">
                <Activity className="w-6 h-6 md:w-10 md:h-10 text-emerald-500 animate-pulse" />
              </div>
              <h3 className="text-lg md:text-2xl font-bold text-white tracking-tight mb-2 drop-shadow-lg">Enterprise Secure Stream</h3>
              <div className="flex items-center gap-3 text-xs md:text-sm font-mono text-emerald-400 bg-black/40 px-3 py-1 rounded-full border border-emerald-500/30">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                {t.live} | 1080p | 60fps
              </div>
            </div>
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full z-10 ${drawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      <div className="absolute top-4 left-4 z-20 flex gap-2">
        {isLive && (
          <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse shadow-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span> {t.live}
          </span>
        )}
        <span className="bg-black/50 backdrop-blur-md text-white/80 text-xs px-2 py-1 rounded border border-white/10 font-mono">
          {source === StreamSource.YOUTUBE ? 'YT' : 'RTMP'}
        </span>
      </div>

      {role === UserRole.ADMIN && (
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
          <button
            onClick={() => setDrawingMode(!drawingMode)}
            className={`p-2 rounded-full backdrop-blur-md transition-all shadow-lg ${drawingMode ? 'bg-indigo-600 text-white ring-2 ring-white/50' : 'bg-black/60 text-white/70 hover:bg-black/80'}`}
            title="Toggle Telestrator (Draw on screen)"
          >
            <PenTool className="w-5 h-5" />
          </button>
          {drawingMode && (
            <button
              onClick={clearCanvas}
              className="p-2 rounded-full bg-red-600/90 text-white hover:bg-red-600 backdrop-blur-md shadow-lg"
              title="Clear Drawings"
            >
              <Eraser className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-6 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={toggleMute}
              className="text-white hover:text-indigo-400 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
            </button>

            <div className="hidden md:flex flex-col gap-1">
              <div
                className="h-1.5 w-32 bg-slate-600 rounded-full cursor-pointer group/vol overflow-hidden"
                onClick={handleVolumeChange}
              >
                <div
                  className="h-full bg-indigo-500 rounded-full group-hover/vol:bg-indigo-400 relative transition-all"
                  style={{ width: `${volume * 100}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover/vol:opacity-100"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-white/90 text-xs md:text-sm font-mono tracking-wide">00:14:23</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">HD</span>
              <span className="text-xs font-bold text-white">1080p</span>
            </div>
            <button className="text-white hover:text-indigo-400 transition-colors p-2 hover:bg-white/10 rounded-full">
              <Settings2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button className="text-white hover:text-indigo-400 transition-colors p-2 hover:bg-white/10 rounded-full">
              <Maximize className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};