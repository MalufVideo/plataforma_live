import React, { useState, useEffect, useCallback } from 'react';
import {
  Server, Cpu, HardDrive, Activity, Zap, CheckCircle,
  AlertTriangle, XCircle, RefreshCw, Settings, Play,
  Pause, RotateCcw, Terminal, Monitor, Layers, Plus,
  Trash2, Edit2, X, Save
} from 'lucide-react';
import {
  getTranscodingProfiles,
  getTranscodingStatus,
  createTranscodingProfile,
  updateTranscodingProfile,
  deleteTranscodingProfile,
  TranscodingProfile,
  TranscodingStatus
} from '../../services/supabaseService';

interface TranscodingTabProps {
  isPremium: boolean;
}

interface DisplayProfile {
  id: string;
  name: string;
  resolution: string;
  bitrate: string;
  fps: number;
  codec: string;
  status: 'active' | 'standby' | 'error';
  isDefault: boolean;
}

interface EditingProfile {
  id?: string;
  name: string;
  width: number;
  height: number;
  video_bitrate: string;
  audio_bitrate: string;
  framerate: number;
  preset: string;
  is_default: boolean;
}

const PRESETS = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'];

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

const ProfileModal: React.FC<{
  profile: EditingProfile | null;
  onSave: (profile: EditingProfile) => void;
  onClose: () => void;
  isNew: boolean;
}> = ({ profile, onSave, onClose, isNew }) => {
  const [form, setForm] = useState<EditingProfile>(profile || {
    name: '',
    width: 1280,
    height: 720,
    video_bitrate: '2500k',
    audio_bitrate: '128k',
    framerate: 30,
    preset: 'veryfast',
    is_default: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#14151f] rounded-xl border border-slate-700 w-full max-w-md mx-4">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {isNew ? 'Add Transcoding Profile' : 'Edit Profile'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Profile Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., 720p, HD, Source"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Width</label>
              <input
                type="number"
                value={form.width}
                onChange={e => setForm({ ...form, width: parseInt(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Height</label>
              <input
                type="number"
                value={form.height}
                onChange={e => setForm({ ...form, height: parseInt(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Video Bitrate</label>
              <input
                type="text"
                value={form.video_bitrate}
                onChange={e => setForm({ ...form, video_bitrate: e.target.value })}
                placeholder="e.g., 2500k"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Audio Bitrate</label>
              <input
                type="text"
                value={form.audio_bitrate}
                onChange={e => setForm({ ...form, audio_bitrate: e.target.value })}
                placeholder="e.g., 128k"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Framerate (FPS)</label>
              <input
                type="number"
                value={form.framerate}
                onChange={e => setForm({ ...form, framerate: parseInt(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Preset</label>
              <select
                value={form.preset}
                onChange={e => setForm({ ...form, preset: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                {PRESETS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={form.is_default}
              onChange={e => setForm({ ...form, is_default: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900"
            />
            <label htmlFor="is_default" className="text-sm text-slate-300">
              Use as default profile
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isNew ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const TranscodingTab: React.FC<TranscodingTabProps> = ({ isPremium }) => {
  const [profiles, setProfiles] = useState<DisplayProfile[]>([]);
  const [status, setStatus] = useState<TranscodingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memUsage, setMemUsage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<EditingProfile | null>(null);
  const [isNewProfile, setIsNewProfile] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [profilesData, statusData] = await Promise.all([
        getTranscodingProfiles(),
        getTranscodingStatus()
      ]);

      // Transform profiles for display
      const displayProfiles: DisplayProfile[] = profilesData.map(p => ({
        id: p.id,
        name: p.name,
        resolution: `${p.width}x${p.height}`,
        bitrate: p.video_bitrate.includes('k') ? p.video_bitrate.replace('k', ' Kbps') : `${p.video_bitrate} Kbps`,
        fps: p.framerate,
        codec: 'H.264',
        status: statusData.activeJobs > 0 ? 'active' : 'standby',
        isDefault: p.is_default
      }));

      setProfiles(displayProfiles);
      setStatus(statusData);

      // Simulate resource usage based on active jobs
      const baseUsage = statusData.activeJobs * 15;
      setCpuUsage(Math.min(85, baseUsage + Math.floor(Math.random() * 10)));
      setMemUsage(Math.min(90, baseUsage + 20 + Math.floor(Math.random() * 10)));

      // Add log entry
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setLogs(prev => {
        const newLog = `[${timestamp}] Status: ${statusData.status}, Active Jobs: ${statusData.activeJobs}`;
        const updatedLogs = [newLog, ...prev].slice(0, 50);
        return updatedLogs;
      });

    } catch (err: any) {
      console.error('Error fetching transcoding data:', err);
      setError(err.message || 'Failed to fetch transcoding data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPremium) return;

    fetchData();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [isPremium, fetchData]);

  const handleAddProfile = () => {
    setEditingProfile(null);
    setIsNewProfile(true);
    setShowModal(true);
  };

  const handleEditProfile = (profile: DisplayProfile) => {
    // Find original profile data
    getTranscodingProfiles().then(allProfiles => {
      const original = allProfiles.find(p => p.id === profile.id);
      if (original) {
        setEditingProfile({
          id: original.id,
          name: original.name,
          width: original.width,
          height: original.height,
          video_bitrate: original.video_bitrate,
          audio_bitrate: original.audio_bitrate,
          framerate: original.framerate,
          preset: original.preset,
          is_default: original.is_default
        });
        setIsNewProfile(false);
        setShowModal(true);
      }
    });
  };

  const handleSaveProfile = async (profile: EditingProfile) => {
    try {
      if (isNewProfile) {
        await createTranscodingProfile({
          name: profile.name,
          width: profile.width,
          height: profile.height,
          video_bitrate: profile.video_bitrate,
          audio_bitrate: profile.audio_bitrate,
          framerate: profile.framerate,
          preset: profile.preset,
          is_default: profile.is_default
        });
      } else if (profile.id) {
        await updateTranscodingProfile(profile.id, {
          name: profile.name,
          width: profile.width,
          height: profile.height,
          video_bitrate: profile.video_bitrate,
          audio_bitrate: profile.audio_bitrate,
          framerate: profile.framerate,
          preset: profile.preset,
          is_default: profile.is_default
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert(err.message || 'Failed to save profile');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      await deleteTranscodingProfile(profileId);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      alert(err.message || 'Failed to delete profile');
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading transcoding data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-400">{error}</span>
          <button
            onClick={fetchData}
            className="ml-auto text-red-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Server Status Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Nginx RTMP</span>
            <ServerStatusBadge status={status?.status === 'running' ? 'online' : 'offline'} />
          </div>
          <div className="text-xs text-slate-400">
            Status: <span className="text-white font-mono">{status?.status || 'Unknown'}</span>
          </div>
        </div>

        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase">FFmpeg</span>
            <ServerStatusBadge status="online" />
          </div>
          <div className="text-xs text-slate-400">
            Version: <span className="text-white font-mono">6.1.1</span>
          </div>
        </div>

        <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Active Jobs</span>
            <span className="flex items-center gap-1 text-xs text-emerald-500">
              <Zap className="w-3 h-3" /> {status?.activeJobs || 0}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Profiles: <span className="text-white font-mono">{profiles.length} configured</span>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors p-2"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button
                  onClick={handleAddProfile}
                  className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Profile
                </button>
              </div>
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
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No transcoding profiles configured. Click "Add Profile" to create one.
                      </td>
                    </tr>
                  ) : (
                    profiles.map((profile) => (
                      <tr key={profile.id} className="border-t border-slate-800 hover:bg-slate-900/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-slate-500" />
                            <span className="font-medium text-white">{profile.name}</span>
                            {profile.isDefault && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                                DEFAULT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">{profile.resolution}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">{profile.bitrate}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">{profile.fps || '-'}</td>
                        <td className="px-4 py-3 text-slate-400">{profile.codec}</td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 text-xs ${
                            profile.status === 'active' ? 'text-emerald-500' :
                            profile.status === 'standby' ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              profile.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                              profile.status === 'standby' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            {profile.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditProfile(profile)}
                              className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProfile(profile.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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
                <span className="text-slate-400">Active Jobs</span>
                <span className="font-mono text-emerald-400">{status?.activeJobs || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Profiles</span>
                <span className="font-mono text-white">{profiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Default Profiles</span>
                <span className="font-mono text-white">{profiles.filter(p => p.isDefault).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service Status</span>
                <span className="font-mono text-emerald-400">{status?.status || 'Unknown'}</span>
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
            <button
              onClick={fetchData}
              className="p-1 text-slate-500 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="bg-black p-4 font-mono text-xs h-40 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-slate-500">No logs yet. Waiting for transcoding activity...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-slate-400 hover:text-slate-200 py-0.5">
                {log}
              </div>
            ))
          )}
          <div className="text-emerald-500 animate-pulse">▋</div>
        </div>
      </div>

      {/* Profile Modal */}
      {showModal && (
        <ProfileModal
          profile={editingProfile}
          onSave={handleSaveProfile}
          onClose={() => setShowModal(false)}
          isNew={isNewProfile}
        />
      )}
    </div>
  );
};
