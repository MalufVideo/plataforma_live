import React, { useState } from 'react';
import { Project, Language } from '../../types';
import { TRANSLATIONS } from '../../constants';
import {
  FolderPlus, Trash2, CheckCircle, Radio, FileEdit, Play, Eye,
  ToggleLeft, ToggleRight, X, Calendar, Users, Plus, AlertTriangle, Copy, Key
} from 'lucide-react';

interface ProjectsTabProps {
  projects: Project[];
  currentProjectId: string | null;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'viewers'>) => void;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onToggleOnDemand: (projectId: string) => void;
  lang: Language;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  currentProjectId,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
  onToggleOnDemand,
  lang
}) => {
  const t = TRANSLATIONS[lang].projects;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showStreamingDetails, setShowStreamingDetails] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    youtubeVideoId: '',
    thumbnail: ''
  });

  const handleCreate = () => {
    if (!newProject.name.trim()) return;
    onCreateProject({
      name: newProject.name,
      description: newProject.description,
      status: 'DRAFT',
      isOnDemand: false,
      youtubeVideoId: newProject.youtubeVideoId || undefined,
      thumbnail: newProject.thumbnail || 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80'
    });
    setNewProject({ name: '', description: '', youtubeVideoId: '', thumbnail: '' });
    setShowCreateModal(false);
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentProject = projects.find(p => p.id === currentProjectId);

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const rtmpUrl = 'rtmp://ingest.livevideo.com.br:1936/live';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{t.title}</h2>
          {currentProject && (
            <p className="text-sm text-slate-400 mt-1">
              {t.currentProject}: <span className="text-indigo-400 font-medium">{currentProject.name}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.createNew}
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <FolderPlus className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">{t.noProjects}</h3>
          <p className="text-slate-500 mb-6">{lang === 'pt' ? 'Crie seu primeiro projeto para começar' : 'Create your first project to get started'}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t.createNew}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(project => (
            <div
              key={project.id}
              className={`bg-slate-900/50 border rounded-xl overflow-hidden transition-all hover:border-slate-600 ${
                currentProjectId === project.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-800'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative h-36 bg-slate-800">
                {project.thumbnail ? (
                  <img
                    src={project.thumbnail}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-12 h-12 text-slate-600" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(project.status)}`}>
                    {project.status === 'LIVE' && <Radio className="w-3 h-3 animate-pulse" />}
                    {project.status === 'ENDED' && <CheckCircle className="w-3 h-3" />}
                    {project.status === 'DRAFT' && <FileEdit className="w-3 h-3" />}
                    {getStatusLabel(project.status)}
                  </span>
                </div>

                {/* On-Demand Badge */}
                {project.status === 'ENDED' && project.isOnDemand && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
                      <Eye className="w-3 h-3" />
                      {t.onDemand}
                    </span>
                  </div>
                )}

                {/* Current Project Indicator */}
                {currentProjectId === project.id && (
                  <div className="absolute bottom-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white">
                      <CheckCircle className="w-3 h-3" />
                      {t.currentProject}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-white mb-1 truncate">{project.name}</h3>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3 h-10">{project.description}</p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(project.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {project.viewers.toLocaleString()} {t.viewers}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* RTMP Key Button */}
                  <button
                    onClick={() => setShowStreamingDetails(project.id)}
                    className="flex items-center justify-center p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                    title={t.streamingDetails}
                  >
                    <Key className="w-4 h-4" />
                  </button>

                  {/* Select Button */}
                  {currentProjectId !== project.id && (
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t.selectProject}
                    </button>
                  )}

                  {/* On-Demand Toggle (only for ENDED projects) */}
                  {project.status === 'ENDED' && (
                    <button
                      onClick={() => onToggleOnDemand(project.id)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        project.isOnDemand
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}
                      title={project.isOnDemand ? t.disableOnDemand : t.enableOnDemand}
                    >
                      {project.isOnDemand ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => setShowDeleteConfirm(project.id)}
                    className="flex items-center justify-center p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                    title={t.deleteProject}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">{t.createNew}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t.projectName} *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder={lang === 'pt' ? 'Ex: Conferência Tech 2024' : 'Ex: Tech Conference 2024'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t.projectDescription}
                </label>
                <textarea
                  value={newProject.description}
                  onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  rows={3}
                  placeholder={lang === 'pt' ? 'Descrição do projeto...' : 'Project description...'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  YouTube Video ID ({lang === 'pt' ? 'Opcional' : 'Optional'})
                </label>
                <input
                  type="text"
                  value={newProject.youtubeVideoId}
                  onChange={e => setNewProject(prev => ({ ...prev, youtubeVideoId: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="Ex: dQw4w9WgXcQ"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newProject.name.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streaming Details Modal */}
      {showStreamingDetails && (() => {
        const project = projects.find(p => p.id === showStreamingDetails);
        if (!project) return null;

        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  {t.streamingDetails}
                </h3>
                <button
                  onClick={() => setShowStreamingDetails(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-white mb-3">{project.name}</h4>
                  <p className="text-sm text-slate-400 mb-4">
                    {lang === 'pt'
                      ? 'Use estas credenciais no seu software de transmissão (OBS, vMix, etc.) para fazer stream ao vivo deste projeto.'
                      : 'Use these credentials in your streaming software (OBS, vMix, etc.) to broadcast to this project.'}
                  </p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">{t.rtmpUrl}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={rtmpUrl}
                        readOnly
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono"
                      />
                      <button
                        onClick={() => handleCopyKey(rtmpUrl)}
                        className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2">{t.rtmpStreamKey}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={project.rtmpStreamKey}
                        readOnly
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono"
                      />
                      <button
                        onClick={() => handleCopyKey(project.rtmpStreamKey)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedKey ? t.keyCopied : t.copyKey}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-xs text-amber-300">
                    <strong>{lang === 'pt' ? 'Importante:' : 'Important:'}</strong>{' '}
                    {lang === 'pt'
                      ? 'Mantenha sua chave RTMP em segurança. Qualquer pessoa com acesso a esta chave pode transmitir para seu projeto.'
                      : 'Keep your RTMP stream key secure. Anyone with this key can broadcast to your project.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
                <button
                  onClick={() => setShowStreamingDetails(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  {lang === 'pt' ? 'Fechar' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t.deleteProject}</h3>
              <p className="text-slate-400 mb-6">{t.confirmDelete}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => {
                    onDeleteProject(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-2" />
                  {t.deleteProject}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
