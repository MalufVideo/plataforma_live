import React, { useState, useEffect } from 'react';
import {
  Server, Cpu, HardDrive, Activity, Zap, CheckCircle,
  AlertTriangle, XCircle, RefreshCw, Settings, Play,
  Pause, RotateCcw, Terminal, Monitor, Layers
} from 'lucide-react';

interface TranscodingTabProps {
  isPremium: boolean;
}

interface TranscodeProfile {
  id: string;
  name: string;
  resolution: string;
  bitrate: string;
  fps: number;
  codec: string;
  status: 'active' | 'standby' | 'error';
  viewers: number;
}

const TRANSCODE_PROFILES: TranscodeProfile[] = [
  { id: '1080p', name: 'Source', resolution: '1920x1080', bitrate: '6000 Kbps', fps: 60, codec: 'H.264 High', status: 'active', viewers: 5420 },
  { id: '720p', name: 'HD', resolution: '1280x720', bitrate: '3500 Kbps', fps: 30, codec: 'H.264 Main', status: 'active', viewers: 4280 },
  { id: '480p', name: 'SD', resolution: '854x480', bitrate: '1500 Kbps', fps: 30, codec: 'H.264 Main', status: 'active', viewers: 1890 },
  { id: '360p', name: 'Low', resolution: '640x360', bitrate: '800 Kbps', fps: 30, codec: 'H.264 Baseline', status: 'active', viewers: 620 },
  { id: 'audio', name: 'Audio Only', resolution: 'N/A', bitrate: '128 Kbps', fps: 0, codec: 'AAC', status: 'standby', viewers: 45 },
];

const NGINX_STATS = {
  uptime: '14d 6h 32m',
  connections: 12450,
  bandwidth: '18.5 Gbps',
  requestsPerSec: 4520,
};

const FFMPEG_STATS = {
  version: '6.1.1',
  cpuUsage: 42,
  memoryUsage: 68,
  gpuAccel: 'NVENC',
  inputFps: 59.94,
  outputFps: 59.88,
  droppedFrames: 12,
  encodingSpeed: '1.02x',
};

const ServerStatusBadge: React.FC<{ status: 'online' | 'warning' | 'offline' }> = ({ status }) => {
  const config = {
    online: { color: 'bg-emerald-500', text: 'Online', icon: CheckCircle },
    warning: { color: 'bg-yellow-500', text: 'Warning', icon: AlertTriangle },
    offline: { color: 'bg-red-500', text: 'Offline', icon: XCircle },
  };
  const { color, text, icon: Icon } = config[status];

  return (
    <span className={`flex items-center gap-1 text-xs ${color.replace('bg-', 'text-')} bg-${status === 'online' ? 'emerald' : status === 'warning' ? 'yellow' : 'red'}-500/10 px-2 py-1 rounded-full`}>
      <Icon className="w-3 h-3" />
      {text}
    </span>
  );
};

const CircularProgress: React.FC<{ value: number; size?: number; color: string; label: string }> = ({
  value, size = 80, color, label
}) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-mono text-white">{value}%</span>
        <span className="text-[9px] text-slate-500">{label}</span>
      </div>
    </div>
  );
};

export const TranscodingTab: React.FC<TranscodingTabProps> = ({ isPremium }) => {
  const [cpuUsage, setCpuUsage] = useState(FFMPEG_STATS.cpuUsage);
  const [memUsage, setMemUsage] = useState(FFMPEG_STATS.memoryUsage);
  const [logs, setLogs] = useState<string[]>([
    '[2024-01-15 14:32:15] Stream connected: rtmp://ingest.onav.live/live/sk_live_***',
    '[2024-01-15 14:32:16] Input: 1920x1080 @ 59.94fps, H.264 High Profile',
    '[2024-01-15 14:32:16] Starting transcoder: 1080p, 720p, 480p, 360p',
    '[2024-01-15 14:32:17] NVENC hardware acceleration enabled',
    '[2024-01-15 14:32:18] All output streams active',
    '[2024-01-15 14:45:22] Keyframe interval: 2.0s (stable)',
  ]);

  useEffect(() => {
    if (!isPremium) return;

    const interval = setInterval(() => {
      setCpuUsage(prev => Math.max(20, Math.min(80, prev + Math.floor(Math.random() * 10) - 5)));
      setMemUsage(prev => Math.max(40, Math.min(90, prev + Math.floor(Math.random() * 6) - 3)));
    }, 3000);

    return () => clearInterval(interval);
  }, [isPremium]);

  if (!isPremium) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Server className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Premium Transcoding Infrastructure</h3>
          <p className="text-slate-400 mb-6">
            Access our Nginx RTMP + FFmpeg transcoding pipeline with hardware acceleration,
            adaptive bitrate streaming, and real-time monitoring.
          </p>
          <ul className="text-left text-sm text-slate-500 space-y-2 mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-500" /> NVENC/QuickSync GPU acceleration
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-500" /> Adaptive bitrate (ABR) streaming
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-500" /> Multiple quality renditions
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-500" /> Real-time transcoding logs
            </li>
          </ul>
          <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-lg font-bold">
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Server Status Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Nginx RTMP</span>
            <ServerStatusBadge status="online" />
          </div>
          <div className="text-xs text-slate-400">
            Uptime: <span className="text-white font-mono">{NGINX_STATS.uptime}</span>
          </div>
        </div>

        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase">FFmpeg</span>
            <ServerStatusBadge status="online" />
          </div>
          <div className="text-xs text-slate-400">
            Version: <span className="text-white font-mono">{FFMPEG_STATS.version}</span>
          </div>
        </div>

        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase">GPU Accel</span>
            <span className="flex items-center gap-1 text-xs text-emerald-500">
              <Zap className="w-3 h-3" /> Active
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Engine: <span className="text-white font-mono">{FFMPEG_STATS.gpuAccel}</span>
          </div>
        </div>

        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase">CDN Edge</span>
            <ServerStatusBadge status="online" />
          </div>
          <div className="text-xs text-slate-400">
            Nodes: <span className="text-white font-mono">24 active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Transcoding Profiles */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-[#14151f] rounded-lg border border-amber-500/30 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">Transcode Profiles</span>
                <span className="text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                  PREMIUM
                </span>
              </div>
              <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                <Settings className="w-3 h-3" /> Configure
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50">
                  <tr className="text-left text-[10px] text-slate-500 uppercase">
                    <th className="px-4 py-3">Profile</th>
                    <th className="px-4 py-3">Resolution</th>
                    <th className="px-4 py-3">Bitrate</th>
                    <th className="px-4 py-3">FPS</th>
                    <th className="px-4 py-3">Codec</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Viewers</th>
                  </tr>
                </thead>
                <tbody>
                  {TRANSCODE_PROFILES.map((profile) => (
                    <tr key={profile.id} className="border-t border-slate-800 hover:bg-slate-900/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-slate-500" />
                          <span className="font-medium text-white">{profile.name}</span>
                          <span className="text-[10px] text-slate-600">{profile.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">{profile.resolution}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{profile.bitrate}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{profile.fps || '-'}</td>
                      <td className="px-4 py-3 text-slate-400">{profile.codec}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs ${profile.status === 'active' ? 'text-emerald-500' :
                            profile.status === 'standby' ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${profile.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                              profile.status === 'standby' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                          {profile.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-white">{profile.viewers.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-[#14151f] rounded-lg border border-amber-500/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white">Resource Usage</span>
            </div>
            <div className="flex justify-around">
              <CircularProgress value={cpuUsage} color="#6366f1" label="CPU" />
              <CircularProgress value={memUsage} color="#8b5cf6" label="RAM" />
            </div>
          </div>

          <div className="bg-[#14151f] rounded-lg border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Stream Health</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Input FPS</span>
                <span className="font-mono text-emerald-400">{FFMPEG_STATS.inputFps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Output FPS</span>
                <span className="font-mono text-emerald-400">{FFMPEG_STATS.outputFps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dropped Frames</span>
                <span className="font-mono text-yellow-400">{FFMPEG_STATS.droppedFrames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Encoding Speed</span>
                <span className="font-mono text-white">{FFMPEG_STATS.encodingSpeed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Logs */}
      <div className="bg-[#14151f] rounded-lg border border-slate-800 overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-white">Transcoder Logs</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1 text-slate-500 hover:text-white transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button className="p-1 text-slate-500 hover:text-white transition-colors">
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="bg-black p-4 font-mono text-xs h-40 overflow-y-auto">
          {logs.map((log, i) => (
            <div key={i} className="text-slate-400 hover:text-slate-200 py-0.5">
              {log}
            </div>
          ))}
          <div className="text-emerald-500 animate-pulse">▋</div>
        </div>
      </div>
    </div>
  );
};
