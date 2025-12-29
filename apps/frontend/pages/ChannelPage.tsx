import React, { useEffect, useState } from 'react';
import { Play, Radio, Clock, Eye, Users, Share2, ArrowLeft } from 'lucide-react';
import { getProfileByUsername, getPublicProjectsByUserId } from '../services/supabaseService';
import { Project, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface ChannelPageProps {
  username: string;
  lang: Language;
  onSelectProject: (projectId: string) => void;
  onBack: () => void;
}

interface ChannelProfile {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  company?: string;
}

export const ChannelPage: React.FC<ChannelPageProps> = ({ username, lang, onSelectProject, onBack }) => {
  const [profile, setProfile] = useState<ChannelProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const loadChannel = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile by username
        const profileData = await getProfileByUsername(username);
        if (!profileData) {
          setError(lang === 'pt' ? 'Canal não encontrado' : 'Channel not found');
          return;
        }

        setProfile({
          id: profileData.id,
          name: profileData.name,
          username: profileData.username,
          avatar: profileData.avatar,
          company: profileData.company
        });

        // Fetch public projects for this user
        const userProjects = await getPublicProjectsByUserId(profileData.id);
        setProjects(userProjects);
      } catch (err) {
        console.error('Failed to load channel:', err);
        setError(lang === 'pt' ? 'Erro ao carregar canal' : 'Failed to load channel');
      } finally {
        setLoading(false);
      }
    };

    loadChannel();
  }, [username, lang]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.name || 'Live Video Channel',
          text: lang === 'pt' ? 'Assista às transmissões ao vivo!' : 'Watch live broadcasts!',
          url
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      alert(lang === 'pt' ? 'Link copiado!' : 'Link copied!');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded-full text-xs font-bold animate-pulse">
            <Radio className="w-3 h-3" />
            {t.stage.live}
          </span>
        );
      case 'ENDED':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-600 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            {t.projects.ended}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-600 rounded-full text-xs font-medium">
            {t.projects.draft}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <Users className="w-16 h-16 text-slate-600 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{lang === 'pt' ? 'Canal Não Encontrado' : 'Channel Not Found'}</h1>
        <p className="text-slate-400 mb-6">{error || (lang === 'pt' ? 'Este canal não existe.' : 'This channel does not exist.')}</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'pt' ? 'Voltar' : 'Go Back'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">LIVE VIDEO</h1>
                <p className="text-xs text-slate-500">by On+Av</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            {t.stage.share}
          </button>
        </div>
      </header>

      {/* Channel Profile Banner */}
      <div className="bg-gradient-to-b from-indigo-900/30 to-slate-950 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-indigo-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold border-4 border-indigo-500">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-3xl font-bold">{profile.name}</h2>
              <p className="text-slate-400">@{profile.username}</p>
              {profile.company && (
                <p className="text-slate-500 mt-1">{profile.company}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Radio className="w-5 h-5 text-indigo-500" />
          {lang === 'pt' ? 'Transmissões' : 'Broadcasts'}
          <span className="text-slate-500 font-normal text-base">({projects.length})</span>
        </h3>

        {projects.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-xl border border-slate-800">
            <Radio className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {lang === 'pt' ? 'Nenhuma transmissão disponível no momento.' : 'No broadcasts available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden cursor-pointer hover:border-indigo-500 transition-all hover:shadow-lg hover:shadow-indigo-500/10 group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-800">
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
                    {getStatusBadge(project.status)}
                  </div>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>

                  {/* Viewers Badge */}
                  {project.status === 'LIVE' && (
                    <div className="absolute bottom-3 right-3">
                      <span className="flex items-center gap-1.5 px-2 py-1 bg-black/70 rounded-full text-xs">
                        <Eye className="w-3 h-3" />
                        {project.viewers.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h4 className="font-bold text-white mb-1 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </h4>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {project.description}
                  </p>

                  {/* On-Demand Badge */}
                  {project.status === 'ENDED' && project.isOnDemand && (
                    <div className="mt-3">
                      <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
                        {t.projects.onDemand}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 text-center text-slate-600 text-sm border-t border-slate-800">
        Powered by LIVE VIDEO Platform
      </footer>
    </div>
  );
};

export default ChannelPage;
