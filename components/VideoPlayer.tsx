import React, { useEffect, useRef, useState } from 'react';
import { StreamSource, UserRole, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Maximize, Volume2, VolumeX, Radio, Settings2, PenTool, Eraser, Activity } from 'lucide-react';

interface VideoPlayerProps {
  source: StreamSource;
  isLive: boolean;
  role: UserRole;
  lang: Language;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ source, isLive, role, lang }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const t = TRANSLATIONS[lang].stage;

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent) => {
    if (!drawingMode || !canvasRef.current) return;
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#ef4444'; // Red pen
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
    // In a real app, we would emit the drawing path via WebSocket here
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Adjust canvas size
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasRef.current.offsetWidth;
      canvasRef.current.height = canvasRef.current.offsetHeight;
    }
  }, []);

  return (
    <div 
      className="relative w-full aspect-video bg-black rounded-none lg:rounded-xl overflow-hidden shadow-2xl group border-y lg:border border-slate-800"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Content Layer */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {source === StreamSource.YOUTUBE ? (
           <iframe 
             width="100%" 
             height="100%" 
             src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&controls=0&modestbranding=1" 
             title="Live Stream" 
             frameBorder="0" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
             allowFullScreen
             className="pointer-events-none w-full h-full object-cover"
           ></iframe>
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
             {/* Simulated Corporate Stream Feed */}
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-slate-900/80 z-0"></div>
             <img src="https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=1600&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
             
             <div className="z-10 flex flex-col items-center animate-pulse">
                <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-slate-900/50 backdrop-blur-md border border-slate-700 flex items-center justify-center mb-4 shadow-xl">
                    <Activity className="w-6 h-6 md:w-10 md:h-10 text-emerald-500" />
                </div>
                <h3 className="text-lg md:text-2xl font-bold text-white tracking-tight mb-2">Enterprise Secure Stream</h3>
                <div className="flex items-center gap-3 text-xs md:text-sm font-mono text-emerald-400 bg-black/40 px-3 py-1 rounded-full border border-emerald-500/30">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                    {t.live} | 1080p | 60fps
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Drawing Layer */}
      <canvas 
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full z-10 ${drawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      {/* Overlays / Watermark */}
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

      {/* Admin Drawing Tools */}
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

      {/* Controls Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-6 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:text-indigo-400 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5 md:w-6 md:h-6" /> : <Volume2 className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            
            <div className="hidden md:flex flex-col gap-1">
                <div className="h-1.5 w-32 bg-slate-600 rounded-full cursor-pointer group/vol overflow-hidden">
                    <div className="h-full w-2/3 bg-indigo-500 rounded-full group-hover/vol:bg-indigo-400 relative">
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