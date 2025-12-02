import React, { useState } from 'react';
import { UserActivity, Language } from '../../types';
import { TRANSLATIONS, MOCK_USER_ACTIVITIES } from '../../constants';
import {
    Search, Download, MapPin, Monitor, Clock,
    MessageSquare, BarChart2, ChevronRight, X,
    Globe, Wifi, Shield
} from 'lucide-react';

interface ReportsTabProps {
    lang: Language;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ lang }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
    const t = TRANSLATIONS[lang].reports;

    const filteredUsers = MOCK_USER_ACTIVITIES.filter(user =>
        user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = () => {
        // Generate CSV content
        const headers = ['User ID', 'Name', 'Email', 'Role', 'Login Time', 'Duration (min)', 'IP', 'Location', 'Device', 'Browser', 'Engagement Score'];
        const rows = filteredUsers.map(u => [
            u.userId,
            u.userName,
            u.email,
            u.role,
            new Date(u.loginTime).toLocaleString(),
            u.sessionDuration,
            u.ipAddress,
            u.location,
            u.device,
            u.browser,
            u.engagementScore
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `user_reports_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex h-full gap-6">
            {/* User List Section */}
            <div className={`flex-1 flex flex-col bg-[#14151f] rounded-xl border border-slate-800 overflow-hidden transition-all ${selectedUser ? 'w-1/2' : 'w-full'}`}>
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#1a1b26]">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-indigo-400" />
                        {t.title}
                    </h2>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {t.export}
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/50 text-slate-400 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-medium">{t.columns.user}</th>
                                <th className="p-4 font-medium hidden md:table-cell">{t.columns.role}</th>
                                <th className="p-4 font-medium hidden lg:table-cell">{t.columns.session}</th>
                                <th className="p-4 font-medium text-center">{t.columns.engagement}</th>
                                <th className="p-4 font-medium text-right">{t.columns.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.map((user) => (
                                <tr
                                    key={user.userId}
                                    onClick={() => setSelectedUser(user)}
                                    className={`cursor-pointer transition-colors hover:bg-slate-800/50 ${selectedUser?.userId === user.userId ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''}`}
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                                {user.userName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{user.userName}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-medium border border-slate-700">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 hidden lg:table-cell text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            {user.sessionDuration} min
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center gap-1 font-bold text-sm">
                                            <span className={`${user.engagementScore > 70 ? 'text-emerald-400' : user.engagementScore > 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {user.engagementScore}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <ChevronRight className="w-4 h-4 text-slate-600 inline-block" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Panel */}
            {selectedUser && (
                <div className="w-[400px] bg-[#14151f] rounded-xl border border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-[#1a1b26]">
                        <h3 className="font-bold text-white">User Details</h3>
                        <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Profile Header */}
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg shadow-indigo-500/20">
                                {selectedUser.userName.substring(0, 2).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold text-white">{selectedUser.userName}</h2>
                            <p className="text-slate-400 text-sm">{selectedUser.email}</p>
                            <div className="flex justify-center gap-2 mt-3">
                                <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs font-medium border border-slate-700">
                                    {selectedUser.role}
                                </span>
                                <span className="bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded text-xs font-medium border border-emerald-900/50 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                    ONLINE
                                </span>
                            </div>
                        </div>

                        {/* Tech Info Grid */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                <Shield className="w-3 h-3" /> {t.details.techInfo}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</div>
                                    <div className="text-sm text-white font-medium truncate" title={selectedUser.location}>{selectedUser.location}</div>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> IP Address</div>
                                    <div className="text-sm text-white font-medium font-mono">{selectedUser.ipAddress}</div>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Monitor className="w-3 h-3" /> Device</div>
                                    <div className="text-sm text-white font-medium truncate" title={selectedUser.device}>{selectedUser.device}</div>
                                </div>
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                                    <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Wifi className="w-3 h-3" /> Connection</div>
                                    <div className="text-sm text-white font-medium truncate" title={selectedUser.connectionType}>{selectedUser.connectionType}</div>
                                </div>
                            </div>
                        </div>

                        {/* Activity Timeline */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                <Clock className="w-3 h-3" /> {t.details.activityLog}
                            </h4>
                            <div className="space-y-4 relative pl-4 border-l border-slate-800">
                                {selectedUser.history.map((event, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-700 border-2 border-[#14151f]"></div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 font-mono mb-0.5">
                                                {new Date(event.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className="text-sm text-white font-medium">
                                                {event.action.replace('_', ' ')}
                                            </span>
                                            {event.details && (
                                                <span className="text-xs text-slate-400 mt-0.5 bg-slate-900/50 p-1.5 rounded border border-slate-800/50">
                                                    {event.details}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Engagement Stats */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                <MessageSquare className="w-3 h-3" /> Engagement
                            </h4>
                            <div className="flex gap-4">
                                <div className="flex-1 bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                                    <div className="text-2xl font-bold text-white">{selectedUser.questionsAsked}</div>
                                    <div className="text-xs text-slate-500">Questions</div>
                                </div>
                                <div className="flex-1 bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                                    <div className="text-2xl font-bold text-white">{selectedUser.pollsAnswered}</div>
                                    <div className="text-xs text-slate-500">Polls</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};
