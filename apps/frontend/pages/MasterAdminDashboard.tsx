import React, { useState, useEffect } from 'react';
import { Language, User, UserRole } from '../types';
import { TRANSLATIONS } from '../constants';
import {
  Users,
  Server,
  Activity,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  Shield,
  Crown,
  UserCheck,
  UserX,
  TrendingUp,
  DollarSign,
  Calendar,
  MessageSquare,
  HelpCircle,
  BarChart3,
  Settings,
  LogOut,
  RefreshCw,
  Search,
  ChevronDown,
  Play,
  Trash2,
  Edit,
  Check,
  X,
  AlertTriangle,
  Globe,
  Clock,
  Zap,
} from 'lucide-react';
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getUserStats,
  getPlatformMetrics,
  ProfileWithStats,
} from '../services/supabaseService';

interface MasterAdminDashboardProps {
  currentUser: User;
  lang: Language;
  onLogout: () => void;
}

type TabType = 'overview' | 'users' | 'server' | 'analytics' | 'settings';

export const MasterAdminDashboard: React.FC<MasterAdminDashboardProps> = ({
  currentUser,
  lang,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [users, setUsers] = useState<ProfileWithStats[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [platformMetrics, setPlatformMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // Simulated server metrics (in production, fetch from your backend API)
  const [serverMetrics] = useState({
    cpu: 23,
    memory: 45,
    disk: 62,
    network: 156,
    uptime: '45d 12h 34m',
    requests: 12450,
    responseTime: 45,
    errorRate: 0.02,
  });

  // Simulated VPS metrics
  const [vpsMetrics] = useState({
    provider: 'Coolify / VPS',
    region: 'South America (Brazil)',
    plan: 'Enterprise',
    vcpus: 4,
    ram: '8 GB',
    storage: '160 GB SSD',
    bandwidth: '4 TB/mo',
    bandwidthUsed: '1.2 TB',
    monthlyCost: 80,
    status: 'healthy',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData, metricsData] = await Promise.all([
        getAllUsers(),
        getUserStats(),
        getPlatformMetrics(),
      ]);
      setUsers(usersData);
      setUserStats(statsData);
      setPlatformMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUserId(null);
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'MASTER_ADMIN': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'ADMIN': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'SPEAKER': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'MODERATOR': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'MASTER_ADMIN': return <Crown className="w-3 h-3" />;
      case 'ADMIN': return <Shield className="w-3 h-3" />;
      default: return null;
    }
  };

  const StatCard = ({ icon: Icon, label, value, subValue, color }: any) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-slate-400 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
    </div>
  );

  const MetricBar = ({ label, value, max, color }: any) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Master Admin Console</h1>
                <p className="text-xs text-slate-500">Platform Owner Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={loadData}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
                <div className="text-right">
                  <div className="text-sm font-medium">{currentUser.name}</div>
                  <div className="text-xs text-purple-400 flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Master Admin
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <nav className="flex gap-1 mb-6 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'server', label: 'Server & VPS', icon: Server },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Users"
                value={userStats?.totalUsers || 0}
                subValue={`${userStats?.onlineUsers || 0} online now`}
                color="bg-indigo-500/20 text-indigo-400"
              />
              <StatCard
                icon={Activity}
                label="Live Events"
                value={platformMetrics?.liveEvents || 0}
                subValue={`${platformMetrics?.totalEvents || 0} total events`}
                color="bg-emerald-500/20 text-emerald-400"
              />
              <StatCard
                icon={MessageSquare}
                label="Messages"
                value={platformMetrics?.totalMessages || 0}
                subValue="Total chat messages"
                color="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                icon={Server}
                label="Server Health"
                value={`${100 - serverMetrics.errorRate}%`}
                subValue={`Uptime: ${serverMetrics.uptime}`}
                color="bg-purple-500/20 text-purple-400"
              />
            </div>

            {/* Quick Metrics */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* User Growth */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  User Growth
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-slate-400">Today</span>
                    <span className="text-emerald-400 font-bold">+{userStats?.newUsersToday || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-slate-400">This Week</span>
                    <span className="text-emerald-400 font-bold">+{userStats?.newUsersThisWeek || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-slate-400">This Month</span>
                    <span className="text-emerald-400 font-bold">+{userStats?.newUsersThisMonth || 0}</span>
                  </div>
                </div>
              </div>

              {/* Role Distribution */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-400" />
                  Role Distribution
                </h3>
                <div className="space-y-3">
                  {userStats?.roleDistribution && Object.entries(userStats.roleDistribution).map(([role, count]: [string, any]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs border ${getRoleBadgeColor(role)}`}>
                          {role.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Server Quick View */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                Server Resources
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <MetricBar label="CPU" value={serverMetrics.cpu} max={100} color="bg-blue-500" />
                <MetricBar label="Memory" value={serverMetrics.memory} max={100} color="bg-purple-500" />
                <MetricBar label="Disk" value={serverMetrics.disk} max={100} color="bg-amber-500" />
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Network</span>
                    <span className="text-white font-medium">{serverMetrics.network} Mbps</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 w-3/4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="text-sm text-slate-400">
                {filteredUsers.length} users
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.name || 'No name'}</div>
                            <div className="text-sm text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                            >
                              <option value="ATTENDEE">Attendee</option>
                              <option value="ADMIN">Producer</option>
                              <option value="SPEAKER">Speaker</option>
                              <option value="MODERATOR">Moderator</option>
                              <option value="MASTER_ADMIN">Master Admin</option>
                            </select>
                            <button
                              onClick={() => handleUpdateRole(user.id, selectedRole)}
                              className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${getRoleBadgeColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            {user.role?.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs ${
                          user.status === 'ONLINE' ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            user.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`} />
                          {user.status || 'OFFLINE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingUserId(user.id);
                              setSelectedRole(user.role);
                            }}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit role"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user.role !== 'MASTER_ADMIN' && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Server Tab */}
        {activeTab === 'server' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Server Metrics */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  Server Resources
                </h3>
                <div className="space-y-6">
                  <MetricBar label="CPU Usage" value={serverMetrics.cpu} max={100} color="bg-blue-500" />
                  <MetricBar label="Memory Usage" value={serverMetrics.memory} max={100} color="bg-purple-500" />
                  <MetricBar label="Disk Usage" value={serverMetrics.disk} max={100} color="bg-amber-500" />
                </div>

                <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">Uptime</div>
                    <div className="text-lg font-bold text-emerald-400">{serverMetrics.uptime}</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">Error Rate</div>
                    <div className="text-lg font-bold text-emerald-400">{serverMetrics.errorRate}%</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">Requests/day</div>
                    <div className="text-lg font-bold text-white">{serverMetrics.requests.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400 mb-1">Avg Response</div>
                    <div className="text-lg font-bold text-white">{serverMetrics.responseTime}ms</div>
                  </div>
                </div>
              </div>

              {/* VPS Info */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-purple-400" />
                  VPS Configuration
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Provider</span>
                    <span className="text-white font-medium">{vpsMetrics.provider}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Region</span>
                    <span className="text-white font-medium flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-500" />
                      {vpsMetrics.region}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Plan</span>
                    <span className="text-purple-400 font-medium">{vpsMetrics.plan}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">vCPUs</span>
                    <span className="text-white font-medium">{vpsMetrics.vcpus} cores</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">RAM</span>
                    <span className="text-white font-medium">{vpsMetrics.ram}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Storage</span>
                    <span className="text-white font-medium">{vpsMetrics.storage}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-800">
                    <span className="text-slate-400">Bandwidth</span>
                    <span className="text-white font-medium">{vpsMetrics.bandwidthUsed} / {vpsMetrics.bandwidth}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Monthly Cost</span>
                    <span className="text-emerald-400 font-bold">${vpsMetrics.monthlyCost}/mo</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Server Status</span>
                  </div>
                  <span className="text-emerald-400 font-bold uppercase">{vpsMetrics.status}</span>
                </div>
              </div>
            </div>

            {/* Services Status */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                Services Status
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { name: 'API Server', status: 'healthy', port: 3000 },
                  { name: 'RTMP Server', status: 'healthy', port: 1936 },
                  { name: 'HLS Server', status: 'healthy', port: 8001 },
                  { name: 'WebSocket', status: 'healthy', port: 3000 },
                  { name: 'PostgreSQL', status: 'healthy', port: 5432 },
                  { name: 'Supabase Auth', status: 'healthy', port: 9999 },
                  { name: 'Storage (S3)', status: 'healthy', port: 5000 },
                  { name: 'Redis Cache', status: 'warning', port: 6379 },
                ].map(service => (
                  <div
                    key={service.name}
                    className={`p-4 rounded-lg border ${
                      service.status === 'healthy'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : service.status === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{service.name}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        service.status === 'healthy'
                          ? 'bg-emerald-400'
                          : service.status === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                      }`} />
                    </div>
                    <div className="text-xs text-slate-400">Port: {service.port}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Signups"
                value={userStats?.totalUsers || 0}
                color="bg-indigo-500/20 text-indigo-400"
              />
              <StatCard
                icon={DollarSign}
                label="Est. Revenue"
                value="$0"
                subValue="Free tier active"
                color="bg-emerald-500/20 text-emerald-400"
              />
              <StatCard
                icon={Calendar}
                label="Events Created"
                value={platformMetrics?.totalEvents || 0}
                color="bg-blue-500/20 text-blue-400"
              />
              <StatCard
                icon={HelpCircle}
                label="Questions Asked"
                value={platformMetrics?.totalQuestions || 0}
                color="bg-purple-500/20 text-purple-400"
              />
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Platform Activity</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-slate-800/50 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{platformMetrics?.totalMessages || 0}</div>
                  <div className="text-sm text-slate-400">Chat Messages</div>
                </div>
                <div className="text-center p-6 bg-slate-800/50 rounded-xl">
                  <HelpCircle className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{platformMetrics?.totalQuestions || 0}</div>
                  <div className="text-sm text-slate-400">Q&A Questions</div>
                </div>
                <div className="text-center p-6 bg-slate-800/50 rounded-xl">
                  <BarChart3 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white">{platformMetrics?.totalPolls || 0}</div>
                  <div className="text-sm text-slate-400">Polls Created</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Future Revenue Tiers (Coming Soon)
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Free', price: '$0', users: '< 50 viewers', features: ['1 concurrent event', 'Basic analytics'] },
                  { name: 'Pro', price: '$49/mo', users: '< 500 viewers', features: ['5 concurrent events', 'Advanced analytics', 'Custom branding'] },
                  { name: 'Enterprise', price: 'Custom', users: 'Unlimited', features: ['Unlimited events', 'White-label', 'Priority support'] },
                ].map(tier => (
                  <div key={tier.name} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <h4 className="font-bold text-white mb-1">{tier.name}</h4>
                    <div className="text-2xl font-bold text-purple-400 mb-2">{tier.price}</div>
                    <div className="text-xs text-slate-400 mb-3">{tier.users}</div>
                    <ul className="text-sm space-y-1">
                      {tier.features.map(f => (
                        <li key={f} className="text-slate-400 flex items-center gap-2">
                          <Check className="w-3 h-3 text-emerald-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Platform Settings</h3>
              <p className="text-slate-400">Platform-wide settings and configuration options will be available here.</p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Email Confirmation</div>
                    <div className="text-sm text-slate-400">Require email verification for new signups</div>
                  </div>
                  <button className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm">
                    Configure in Supabase
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">OAuth Providers</div>
                    <div className="text-sm text-slate-400">Manage Google, GitHub, and other OAuth integrations</div>
                  </div>
                  <button className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm">
                    Configure in Supabase
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Streaming Configuration</div>
                    <div className="text-sm text-slate-400">RTMP and HLS server settings</div>
                  </div>
                  <span className="text-emerald-400 text-sm">Active</span>
                </div>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4 text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Export All Data</div>
                    <div className="text-sm text-slate-400">Download all platform data as JSON</div>
                  </div>
                  <button className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors">
                    Export
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <div className="font-medium text-white">Reset Platform</div>
                    <div className="text-sm text-slate-400">Delete all events, messages, and reset to defaults</div>
                  </div>
                  <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
