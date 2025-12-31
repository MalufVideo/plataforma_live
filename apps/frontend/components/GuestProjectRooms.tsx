import React, { useState, useEffect } from 'react';
import { ProjectGuestWithProject, Language } from '../types';
import { getMyProjectInvitations, updateProjectGuestStatus } from '../services/supabaseService';
import {
  Play, Users, Radio, CheckCircle, Clock, Eye, ArrowRight,
  RefreshCw, AlertTriangle, Check, X
} from 'lucide-react';

interface GuestProjectRoomsProps {
  lang: Language;
  onJoinRoom: (projectId: string) => void;
}

const TRANSLATIONS = {
  pt: {
    title: 'Minhas Salas',
    subtitle: 'Projetos aos quais você foi convidado',
    noRooms: 'Nenhuma sala disponível',
    noRoomsDesc: 'Você não foi convidado para nenhum projeto ainda.',
    loading: 'Carregando salas...',
    joinRoom: 'Entrar na Sala',
    live: 'AO VIVO',
    ended: 'Encerrado',
    draft: 'Em breve',
    viewers: 'espectadores',
    pending: 'Pendente',
    confirmed: 'Confirmado',
    confirmInvite: 'Confirmar presença',
    declineInvite: 'Recusar',
    onDemand: 'Sob Demanda',
    refresh: 'Atualizar'
  },
  en: {
    title: 'My Rooms',
    subtitle: 'Projects you have been invited to',
    noRooms: 'No rooms available',
    noRoomsDesc: 'You have not been invited to any projects yet.',
    loading: 'Loading rooms...',
    joinRoom: 'Join Room',
    live: 'LIVE',
    ended: 'Ended',
    draft: 'Coming soon',
    viewers: 'viewers',
    pending: 'Pending',
    confirmed: 'Confirmed',
    confirmInvite: 'Confirm attendance',
    declineInvite: 'Decline',
    onDemand: 'On Demand',
    refresh: 'Refresh'
  }
};

export const GuestProjectRooms: React.FC<GuestProjectRoomsProps> = ({ lang, onJoinRoom }) => {
  const t = TRANSLATIONS[lang];
  const [invitations, setInvitations] = useState<ProjectGuestWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyProjectInvitations();
      setInvitations(data);
    } catch (err) {
      console.error('Error loading invitations:', err);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const handleConfirmInvitation = async (invitationId: string) => {
    try {
      await updateProjectGuestStatus(invitationId, 'CONFIRMED');
      loadInvitations(); // Refresh the list
    } catch (err) {
      console.error('Error confirming invitation:', err);
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await updateProjectGuestStatus(invitationId, 'DECLINED');
      loadInvitations(); // Refresh the list
    } catch (err) {
      console.error('Error declining invitation:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-red-500';
      case 'ENDED': return 'bg-slate-500';
      case 'DRAFT': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'LIVE': return t.live;
      case 'ENDED': return t.ended;
      case 'DRAFT': return t.draft;
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>{t.loading}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <span>{error}</span>
          <button
            onClick={loadInvitations}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-sm text-slate-400 mt-1">{t.subtitle}</p>
        </div>
        <button
          onClick={loadInvitations}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t.refresh}
        </button>
      </div>

      {/* Rooms Grid */}
      {invitations.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">{t.noRooms}</h3>
          <p className="text-slate-500">{t.noRoomsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invitations.map(invitation => {
            const project = invitation.project;
            if (!project) return null;

            const isLive = project.status === 'LIVE';
            const canWatch = isLive || (project.status === 'ENDED' && project.isOnDemand);
            const isPending = invitation.invitationStatus === 'PENDING';

            return (
              <div
                key={invitation.id}
                className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative h-40 bg-slate-800">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                      <Play className="w-16 h-16 text-slate-700" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(project.status)}`}>
                      {isLive && <Radio className="w-3 h-3 animate-pulse" />}
                      {project.status === 'ENDED' && project.isOnDemand && <Eye className="w-3 h-3" />}
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  {/* Invitation Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                      isPending
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {isPending ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      {isPending ? t.pending : t.confirmed}
                    </span>
                  </div>

                  {/* Viewers (if live) */}
                  {isLive && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 text-white backdrop-blur-sm">
                        <Users className="w-3 h-3" />
                        {project.viewers.toLocaleString()} {t.viewers}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1 truncate">{project.name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4 h-10">{project.description}</p>

                  {/* Actions */}
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleConfirmInvitation(invitation.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        {t.confirmInvite}
                      </button>
                      <button
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        className="flex items-center justify-center p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                        title={t.declineInvite}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : canWatch ? (
                    <button
                      onClick={() => onJoinRoom(project.id)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      {t.joinRoom}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 bg-slate-700 text-slate-400 px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                    >
                      <Clock className="w-4 h-4" />
                      {t.draft}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
