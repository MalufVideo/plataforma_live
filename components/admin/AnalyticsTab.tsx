import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Clock, Eye, 
  Play, Pause, MousePointer, MessageSquare, ThumbsUp, Share2,
  Monitor, Smartphone, Tv, Globe, Wifi, Zap, Activity,
  ChevronDown, Download, Calendar, Filter
} from 'lucide-react';

interface AnalyticsTabProps {
  isPremium: boolean;
  viewers: number;
}

const ENGAGEMENT_DATA = [
  { time: '14:00', viewers: 8500, chatMessages: 120, reactions: 450 },
  { time: '14:05', viewers: 9200, chatMessages: 180, reactions: 520 },
  { time: '14:10', viewers: 10100, chatMessages: 250, reactions: 680 },
  { time: '14:15', viewers: 11500, chatMessages: 320, reactions: 890 },
  { time: '14:20', viewers: 12200, chatMessages: 280, reactions: 750 },
  { time: '14:25', viewers: 12450, chatMessages: 350, reactions: 920 },
  { time: '14:30', viewers: 12800, chatMessages: 420, reactions: 1100 },
];

const QUALITY_DISTRIBUTION = [
  { quality: '1080p', percentage: 45, color: 'bg-emerald-500' },
  { quality: '720p', percentage: 35, color: 'bg-blue-500' },
  { quality: '480p', percentage: 15, color: 'bg-purple-500' },
  { quality: '360p', percentage: 5, color: 'bg-slate-500' },
];

const BROWSER_DATA = [
  { name: 'Chrome', percentage: 58, color: '#4285F4' },
  { name: 'Safari', percentage: 22, color: '#000000' },
  { name: 'Firefox', percentage: 12, color: '#FF7139' },
  { name: 'Edge', percentage: 6, color: '#0078D7' },
  { name: 'Other', percentage: 2, color: '#6B7280' },
];

const OS_DATA = [
  { name: 'Windows', percentage: 48 },
  { name: 'macOS', percentage: 28 },
  { name: 'iOS', percentage: 12 },
  { name: 'Android', percentage: 8 },
  { name: 'Linux', percentage: 4 },
];

const BANDWIDTH_STATS = {
  totalBandwidth: '2.4 TB',
  peakBandwidth: '18.5 Gbps',
  avgBitrate: '4.2 Mbps',
  cdnHitRate: '99.2%',
};

const LineChart: React.FC<{ data: typeof ENGAGEMENT_DATA; dataKey: keyof typeof ENGAGEMENT_DATA[0]; color: string; height?: number }> = ({ 
  data, dataKey, color, height = 120 
}) => {
  const values = data.map(d => d[dataKey] as number);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#1e293b" strokeWidth="0.5" />
        ))}
        
        {/* Area fill */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={`url(#gradient-${color})`}
          opacity="0.3"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Dots */}
        {values.map((v, i) => {
          const x = (i / (values.length - 1)) * 100;
          const y = 100 - ((v - min) / range) * 80 - 10;
          return (
            <circle key={i} cx={x} cy={y} r="1.5" fill={color} />
          );
        })}

        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-slate-600 -mb-4">
        {data.filter((_, i) => i % 2 === 0).map((d, i) => (
          <span key={i}>{d.time}</span>
        ))}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  iconColor: string;
  subtitle?: string;
}> = ({ title, value, change, icon: Icon, iconColor, subtitle }) => (
  <div className="bg-[#14151f] p-4 rounded-lg border border-slate-800">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] text-slate-500 font-bold uppercase">{title}</span>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <div className="text-2xl font-mono text-white">{value}</div>
    {change !== undefined && (
      <div className={`flex items-center gap-1 mt-1 text-xs ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
        {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{Math.abs(change)}% vs last event</span>
      </div>
    )}
    {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
  </div>
);

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ isPremium, viewers }) => {
  const [timeRange, setTimeRange] = useState('live');
  const [liveData, setLiveData] = useState(ENGAGEMENT_DATA);

  useEffect(() => {
    if (timeRange !== 'live') return;
    
    const interval = setInterval(() => {
      setLiveData(prev => {
        const newData = [...prev.slice(1)];
        const lastTime = prev[prev.length - 1].time;
        const [hours, mins] = lastTime.split(':').map(Number);
        const newMins = (mins + 5) % 60;
        const newHours = mins + 5 >= 60 ? hours + 1 : hours;
        
        newData.push({
          time: `${newHours}:${newMins.toString().padStart(2, '0')}`,
          viewers: prev[prev.length - 1].viewers + Math.floor(Math.random() * 500) - 200,
          chatMessages: Math.floor(Math.random() * 200) + 200,
          reactions: Math.floor(Math.random() * 500) + 500,
        });
        return newData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeRange('live')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              timeRange === 'live' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>
              Live
            </span>
          </button>
          <button
            onClick={() => setTimeRange('1h')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              timeRange === '1h' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            1 Hour
          </button>
          <button
            onClick={() => setTimeRange('session')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              timeRange === 'session' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Full Session
          </button>
        </div>
        
        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors">
          <Download className="w-3 h-3" />
          Export Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Views"
          value="24,892"
          change={18}
          icon={Eye}
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Unique Viewers"
          value="18,432"
          change={12}
          icon={Users}
          iconColor="text-purple-500"
        />
        <MetricCard
          title="Avg Watch Time"
          value="14:23"
          change={8}
          icon={Clock}
          iconColor="text-emerald-500"
        />
        <MetricCard
          title="Engagement Rate"
          value="67.4%"
          change={-3}
          icon={MousePointer}
          iconColor="text-pink-500"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-12 gap-6">
        {/* Viewership Chart */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">Viewership Over Time</span>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Viewers
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Chat
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-pink-500"></div> Reactions
                </span>
              </div>
            </div>
            <LineChart data={liveData} dataKey="viewers" color="#6366f1" height={150} />
          </div>
        </div>

        {/* Engagement Breakdown */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-[#14151f] rounded-lg border border-slate-800 p-4 h-full">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Engagement</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">Chat Messages</span>
                </div>
                <span className="text-lg font-mono text-white">4,521</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-pink-400" />
                  <span className="text-sm text-slate-300">Reactions</span>
                </div>
                <span className="text-lg font-mono text-white">12,847</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-slate-300">Shares</span>
                </div>
                <span className="text-lg font-mono text-white">892</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">Poll Votes</span>
                </div>
                <span className="text-lg font-mono text-white">3,456</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Analytics - Premium */}
      {isPremium ? (
        <div className="grid grid-cols-12 gap-6">
          {/* Quality Distribution */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-[#14151f] rounded-lg border border-amber-500/30 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Quality Distribution</span>
                </div>
                <span className="text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                  PREMIUM
                </span>
              </div>
              <div className="space-y-3">
                {QUALITY_DISTRIBUTION.map((q, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">{q.quality}</span>
                      <span className="text-white font-mono">{q.percentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${q.color} rounded-full transition-all duration-1000`}
                        style={{ width: `${q.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Browser Stats */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-[#14151f] rounded-lg border border-amber-500/30 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Browser Stats</span>
                </div>
                <span className="text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                  PREMIUM
                </span>
              </div>
              <div className="space-y-2">
                {BROWSER_DATA.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="text-sm text-slate-300 flex-1">{b.name}</span>
                    <span className="text-sm font-mono text-white">{b.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bandwidth Stats */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-[#14151f] rounded-lg border border-amber-500/30 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">CDN & Bandwidth</span>
                </div>
                <span className="text-[9px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-bold">
                  PREMIUM
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-[10px] text-slate-500 mb-1">Total Bandwidth</div>
                  <div className="text-lg font-mono text-white">{BANDWIDTH_STATS.totalBandwidth}</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-[10px] text-slate-500 mb-1">Peak Bandwidth</div>
                  <div className="text-lg font-mono text-white">{BANDWIDTH_STATS.peakBandwidth}</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-[10px] text-slate-500 mb-1">Avg Bitrate</div>
                  <div className="text-lg font-mono text-white">{BANDWIDTH_STATS.avgBitrate}</div>
                </div>
                <div className="bg-slate-900/50 rounded p-2">
                  <div className="text-[10px] text-slate-500 mb-1">CDN Hit Rate</div>
                  <div className="text-lg font-mono text-emerald-400">{BANDWIDTH_STATS.cdnHitRate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#14151f] rounded-lg border border-slate-800 p-8 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-slate-600" />
          </div>
          <h4 className="text-lg font-bold text-white mb-2">Premium Analytics</h4>
          <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">
            Unlock detailed quality distribution, browser stats, CDN metrics, and bandwidth analytics with Premium.
          </p>
          <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-bold text-sm">
            Upgrade to Premium
          </button>
        </div>
      )}
    </div>
  );
};
