import React, { useState, useEffect } from 'react';
import { Project, ProjectGuest, Language, InvitationStatus } from '../../types';
import {
  ArrowLeft, UserPlus, Users, Trash2, Mail, CheckCircle, Clock, XCircle,
  X, AlertTriangle, Upload, Download
} from 'lucide-react';
import {
  getProjectGuests,
  inviteProjectGuest,
  bulkInviteProjectGuests,
  deleteProjectGuest
} from '../../services/supabaseService';

interface ProjectGuestManagementProps {
  projectId: string;
  project: Project | null;
  onBack: () => void;
  lang: Language;
}

const TRANSLATIONS = {
  pt: {
    title: 'Gerenciar Convidados',
    backToProjects: 'Voltar aos Projetos',
    inviteGuest: 'Convidar Convidado',
    bulkInvite: 'Convite em Massa',
    email: 'Email',
    name: 'Nome',
    status: 'Status',
    invitedAt: 'Convidado em',
    actions: 'Ações',
    noGuests: 'Nenhum convidado ainda',
    noGuestsDesc: 'Convide pessoas para participar deste projeto.',
    invite: 'Convidar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    confirmDelete: 'Tem certeza que deseja remover este convidado?',
    emailPlaceholder: 'email@exemplo.com',
    namePlaceholder: 'Nome do convidado',
    bulkPlaceholder: 'email@exemplo.com,Nome\nemail2@exemplo.com,Nome 2',
    bulkHelp: 'Um convidado por linha no formato: email,nome',
    pending: 'Pendente',
    confirmed: 'Confirmado',
    declined: 'Recusado',
    cancelled: 'Cancelado',
    totalGuests: 'Total de Convidados',
    confirmedCount: 'Confirmados',
    pendingCount: 'Pendentes',
    declinedCount: 'Recusados',
    inviteSuccess: 'Convidado adicionado com sucesso!',
    inviteError: 'Erro ao convidar. O email pode já estar registrado.',
    deleteSuccess: 'Convidado removido com sucesso!',
    deleteError: 'Erro ao remover convidado.',
    loading: 'Carregando...',
    exportCsv: 'Exportar CSV'
  },
  en: {
    title: 'Manage Guests',
    backToProjects: 'Back to Projects',
    inviteGuest: 'Invite Guest',
    bulkInvite: 'Bulk Invite',
    email: 'Email',
    name: 'Name',
    status: 'Status',
    invitedAt: 'Invited At',
    actions: 'Actions',
    noGuests: 'No guests yet',
    noGuestsDesc: 'Invite people to participate in this project.',
    invite: 'Invite',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to remove this guest?',
    emailPlaceholder: 'email@example.com',
    namePlaceholder: 'Guest name',
    bulkPlaceholder: 'email@example.com,Name\nemail2@example.com,Name 2',
    bulkHelp: 'One guest per line in format: email,name',
    pending: 'Pending',
    confirmed: 'Confirmed',
    declined: 'Declined',
    cancelled: 'Cancelled',
    totalGuests: 'Total Guests',
    confirmedCount: 'Confirmed',
    pendingCount: 'Pending',
    declinedCount: 'Declined',
    inviteSuccess: 'Guest added successfully!',
    inviteError: 'Error inviting. Email may already be registered.',
    deleteSuccess: 'Guest removed successfully!',
    deleteError: 'Error removing guest.',
    loading: 'Loading...',
    exportCsv: 'Export CSV'
  }
};

export const ProjectGuestManagement: React.FC<ProjectGuestManagementProps> = ({
  projectId,
  project,
  onBack,
  lang
}) => {
  const t = TRANSLATIONS[lang];
  const [guests, setGuests] = useState<ProjectGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '' });
  const [bulkText, setBulkText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load guests
  useEffect(() => {
    loadGuests();
  }, [projectId]);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const data = await getProjectGuests(projectId);
      setGuests(data);
    } catch (err) {
      console.error('Error loading guests:', err);
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const stats = {
    total: guests.length,
    confirmed: guests.filter(g => g.invitationStatus === 'CONFIRMED').length,
    pending: guests.filter(g => g.invitationStatus === 'PENDING').length,
    declined: guests.filter(g => g.invitationStatus === 'DECLINED').length
  };

  // Invite single guest
  const handleInvite = async () => {
    if (!inviteForm.email.trim()) return;

    try {
      setError(null);
      await inviteProjectGuest(projectId, inviteForm.email.trim(), inviteForm.name.trim() || undefined);
      setSuccess(t.inviteSuccess);
      setInviteForm({ email: '', name: '' });
      setShowInviteModal(false);
      loadGuests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t.inviteError);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Bulk invite
  const handleBulkInvite = async () => {
    if (!bulkText.trim()) return;

    try {
      setError(null);
      const lines = bulkText.trim().split('\n');
      const guestsToInvite = lines.map(line => {
        const [email, name] = line.split(',').map(s => s.trim());
        return { email, name };
      }).filter(g => g.email);

      if (guestsToInvite.length === 0) return;

      await bulkInviteProjectGuests(projectId, guestsToInvite);
      setSuccess(`${guestsToInvite.length} ${t.inviteSuccess}`);
      setBulkText('');
      setShowBulkModal(false);
      loadGuests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t.inviteError);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Delete guest
  const handleDelete = async (guestId: string) => {
    try {
      setError(null);
      await deleteProjectGuest(guestId);
      setSuccess(t.deleteSuccess);
      setShowDeleteConfirm(null);
      loadGuests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t.deleteError);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Email', 'Name', 'Status', 'Invited At'];
    const rows = guests.map(g => [
      g.guestEmail,
      g.guestName || '',
      g.invitationStatus,
      new Date(g.invitedAt).toISOString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'DECLINED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'CANCELLED': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: InvitationStatus) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle className="w-3 h-3" />;
      case 'PENDING': return <Clock className="w-3 h-3" />;
      case 'DECLINED': return <XCircle className="w-3 h-3" />;
      case 'CANCELLED': return <X className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (status: InvitationStatus) => {
    switch (status) {
      case 'CONFIRMED': return t.confirmed;
      case 'PENDING': return t.pending;
      case 'DECLINED': return t.declined;
      case 'CANCELLED': return t.cancelled;
      default: return status;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {t.backToProjects}
          </button>
          <div className="h-6 w-px bg-slate-700"></div>
          <div>
            <h2 className="text-2xl font-bold text-white">{t.title}</h2>
            {project && (
              <p className="text-sm text-slate-400 mt-1">{project.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {t.exportCsv}
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            {t.bulkInvite}
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {t.inviteGuest}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300">{success}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">{t.totalGuests}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
              <p className="text-xs text-slate-400">{t.confirmedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-slate-400">{t.pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.declined}</p>
              <p className="text-xs text-slate-400">{t.declinedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guest List */}
      {guests.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">{t.noGuests}</h3>
          <p className="text-slate-500 mb-6">{t.noGuestsDesc}</p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            {t.inviteGuest}
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-bold text-slate-400 px-4 py-3">{t.email}</th>
                <th className="text-left text-xs font-bold text-slate-400 px-4 py-3">{t.name}</th>
                <th className="text-left text-xs font-bold text-slate-400 px-4 py-3">{t.status}</th>
                <th className="text-left text-xs font-bold text-slate-400 px-4 py-3">{t.invitedAt}</th>
                <th className="text-right text-xs font-bold text-slate-400 px-4 py-3">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {guests.map(guest => (
                <tr key={guest.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-white text-sm">{guest.guestEmail}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-300 text-sm">{guest.guestName || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(guest.invitationStatus)}`}>
                      {getStatusIcon(guest.invitationStatus)}
                      {getStatusLabel(guest.invitationStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-400 text-sm">{formatDate(guest.invitedAt)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setShowDeleteConfirm(guest.id)}
                      className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                {t.inviteGuest}
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t.email} *
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  placeholder={t.emailPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t.name}
                </label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={e => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  placeholder={t.namePlaceholder}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteForm.email.trim()}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {t.invite}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Invite Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                {t.bulkInvite}
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t.bulkHelp}
                </label>
                <textarea
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
                  rows={8}
                  placeholder={t.bulkPlaceholder}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleBulkInvite}
                disabled={!bulkText.trim()}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                {t.invite}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t.delete}</h3>
              <p className="text-slate-400 mb-6">{t.confirmDelete}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  {t.delete}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
