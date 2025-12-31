import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { User as AppUser, UserRole, Message, Question, Poll, PollOption, Room, Session as EventSession, Project, ProjectGuest, ProjectGuestWithProject, Survey, SurveyField, UserActivity } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// AUTH FUNCTIONS
// =============================================

export const signUp = async (email: string, password: string, name: string, username?: string, company?: string, title?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, username, company, title }
    }
  });

  if (error) throw error;
  return data;
};

// Check if username is available
export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return !data;
};

// Get profile by username (for public channel page)
export const getProfileByUsername = async (username: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
};

// Get public projects for a user (for public channel page)
export const getPublicProjectsByUserId = async (userId: string): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    isOnDemand: p.is_on_demand,
    isPublic: p.is_public ?? true,
    createdAt: new Date(p.created_at).getTime(),
    startedAt: p.started_at ? new Date(p.started_at).getTime() : undefined,
    endedAt: p.ended_at ? new Date(p.ended_at).getTime() : undefined,
    youtubeVideoId: p.youtube_video_id,
    thumbnail: p.thumbnail,
    viewers: p.viewers,
    rtmpStreamKey: p.rtmp_stream_key,
    ownerId: p.owner_id
  }));
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  // Update profile status
  if (data.user) {
    await supabase
      .from('profiles')
      .update({ status: 'ONLINE', last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);
  }

  return data;
};

export const signOut = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from('profiles')
      .update({ status: 'OFFLINE' })
      .eq('id', user.id);
  }

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async (): Promise<AppUser | null> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    username: profile.username,
    role: profile.role as UserRole,
    avatar: profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`,
    company: profile.company,
    title: profile.title,
    status: profile.status
  };
};

export const getSession = async (): Promise<Session | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
};

export const signInWithGoogle = async (redirectPath?: string) => {
  // Use production URL in production, or current origin for local dev
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = isLocalhost ? window.location.origin : 'https://livevideo.com.br';
  const redirectTo = `${baseUrl}${redirectPath || '/'}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });

  if (error) throw error;
  return data;
};

// =============================================
// PROFILE FUNCTIONS
// =============================================

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
};

export const updateProfile = async (userId: string, updates: Partial<{
  name: string;
  username: string;
  avatar: string;
  company: string;
  title: string;
}>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// =============================================
// EVENT FUNCTIONS
// =============================================

export const getEvents = async (options?: { status?: string; upcoming?: boolean }) => {
  let query = supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: true });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.upcoming) {
    query = query.gte('start_time', new Date().toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const getEvent = async (idOrSlug: string) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_sessions (*),
      streams (*)
    `)
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .single();

  if (error) throw error;
  return data;
};

export const getLiveEvent = async () => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_sessions (*),
      streams (*)
    `)
    .eq('status', 'LIVE')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// =============================================
// SESSION FUNCTIONS
// =============================================

export const getEventSessions = async (eventId: string): Promise<EventSession[]> => {
  const { data, error } = await supabase
    .from('event_sessions')
    .select('*')
    .eq('event_id', eventId)
    .order('start_time', { ascending: true });

  if (error) throw error;

  return data.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    speaker: s.speaker,
    startTime: s.start_time,
    endTime: s.end_time,
    status: new Date(s.start_time) <= new Date() && new Date(s.end_time) >= new Date() ? 'LIVE' :
      new Date(s.start_time) > new Date() ? 'UPCOMING' : 'ENDED',
    viewers: 0
  }));
};

// =============================================
// STREAM FUNCTIONS
// =============================================

export const getStream = async (streamId: string) => {
  const { data, error } = await supabase
    .from('streams')
    .select('*')
    .eq('id', streamId)
    .single();

  if (error) throw error;
  return data;
};

export const getActiveStream = async (eventId: string) => {
  const { data, error } = await supabase
    .from('streams')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'LIVE')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// =============================================
// CHAT FUNCTIONS
// =============================================

export const getMessages = async (sessionId: string, limit = 50): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      profiles:user_id (id, name, role, avatar)
    `)
    .eq('session_id', sessionId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return data.map(m => ({
    id: m.id,
    userId: m.user_id,
    userName: m.profiles.name,
    userRole: m.profiles.role as UserRole,
    text: m.text,
    timestamp: new Date(m.created_at).getTime(),
    isPinned: m.is_pinned
  }));
};

export const sendMessage = async (sessionId: string, text: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      text
    })
    .select(`
      *,
      profiles:user_id (id, name, role, avatar)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const subscribeToMessages = (sessionId: string, callback: (message: any) => void) => {
  return supabase
    .channel(`messages:${sessionId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `session_id=eq.${sessionId}`
    }, async (payload) => {
      // Fetch the full message with profile
      const { data } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id (id, name, role, avatar)
        `)
        .eq('id', payload.new.id)
        .single();

      if (data) {
        callback({
          id: data.id,
          userId: data.user_id,
          userName: data.profiles.name,
          userRole: data.profiles.role as UserRole,
          text: data.text,
          timestamp: new Date(data.created_at).getTime(),
          isPinned: data.is_pinned
        });
      }
    })
    .subscribe();
};

// =============================================
// QUESTIONS FUNCTIONS
// =============================================

export const getQuestions = async (sessionId: string): Promise<Question[]> => {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      profiles:user_id (id, name)
    `)
    .eq('session_id', sessionId)
    .eq('is_hidden', false)
    .order('upvotes', { ascending: false });

  if (error) throw error;

  return data.map(q => ({
    id: q.id,
    userId: q.user_id,
    userName: q.profiles.name,
    text: q.text,
    upvotes: q.upvotes,
    isAnswered: q.is_answered,
    timestamp: new Date(q.created_at).getTime()
  }));
};

export const submitQuestion = async (sessionId: string, text: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('questions')
    .insert({
      session_id: sessionId,
      user_id: user.id,
      text
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const upvoteQuestion = async (questionId: string) => {
  const { data, error } = await supabase.rpc('increment_upvotes', {
    question_id: questionId
  });

  if (error) throw error;
  return data;
};

export const subscribeToQuestions = (sessionId: string, callback: (questions: Question[]) => void) => {
  return supabase
    .channel(`questions:${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'questions',
      filter: `session_id=eq.${sessionId}`
    }, async () => {
      const questions = await getQuestions(sessionId);
      callback(questions);
    })
    .subscribe();
};

// =============================================
// POLLS FUNCTIONS
// =============================================

export const getPolls = async (sessionId: string): Promise<Poll[]> => {
  const { data, error } = await supabase
    .from('polls')
    .select(`
      *,
      poll_options (*)
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get vote counts for each option
  const pollsWithVotes = await Promise.all(data.map(async (poll) => {
    const { data: votes } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', poll.id);

    const voteCounts: Record<string, number> = {};
    (votes || []).forEach(v => {
      voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1;
    });

    return {
      id: poll.id,
      question: poll.question,
      options: poll.poll_options.map((o: any) => ({
        id: o.id,
        text: o.text,
        votes: voteCounts[o.id] || 0
      })),
      isActive: poll.is_active,
      totalVotes: votes?.length || 0
    };
  }));

  return pollsWithVotes;
};

export const getActivePoll = async (sessionId: string): Promise<Poll | null> => {
  const polls = await getPolls(sessionId);
  return polls.find(p => p.isActive) || null;
};

export const votePoll = async (pollId: string, optionId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('poll_votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const subscribeToPolls = (sessionId: string, callback: (polls: Poll[]) => void) => {
  return supabase
    .channel(`polls:${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'polls',
      filter: `session_id=eq.${sessionId}`
    }, async () => {
      const polls = await getPolls(sessionId);
      callback(polls);
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'poll_votes'
    }, async () => {
      const polls = await getPolls(sessionId);
      callback(polls);
    })
    .subscribe();
};

// =============================================
// SURVEY FUNCTIONS
// =============================================

export const getSurveys = async (sessionId: string): Promise<Survey[]> => {
  const { data, error } = await supabase
    .from('surveys')
    .select(`
      *,
      survey_fields (*)
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(s => ({
    id: s.id,
    title: s.title,
    isActive: s.is_active,
    fields: (s.survey_fields || []).map((f: any) => ({
      id: f.id,
      question: f.question,
      type: f.type,
      options: f.options
    }))
  }));
};

export const getActiveSurvey = async (sessionId: string): Promise<Survey | null> => {
  const surveys = await getSurveys(sessionId);
  return surveys.find(s => s.isActive) || null;
};

export const createSurvey = async (sessionId: string, title: string, fields: Omit<SurveyField, 'id'>[]): Promise<Survey> => {
  // Deactivate any existing active surveys first
  await supabase
    .from('surveys')
    .update({ is_active: false })
    .eq('session_id', sessionId)
    .eq('is_active', true);

  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .insert({
      session_id: sessionId,
      title,
      is_active: true
    })
    .select()
    .single();

  if (surveyError) throw surveyError;

  const surveyFields = fields.map(f => ({
    survey_id: survey.id,
    question: f.question,
    type: f.type,
    options: f.options
  }));

  const { data: fieldsData, error: fieldsError } = await supabase
    .from('survey_fields')
    .insert(surveyFields)
    .select();

  if (fieldsError) throw fieldsError;

  return {
    id: survey.id,
    title: survey.title,
    isActive: survey.is_active,
    fields: (fieldsData || []).map((f: any) => ({
      id: f.id,
      question: f.question,
      type: f.type,
      options: f.options
    }))
  };
};

export const submitSurveyResponse = async (surveyId: string, responses: Record<string, any>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('survey_responses')
    .insert({
      survey_id: surveyId,
      user_id: user.id,
      responses
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const subscribeToSurveys = (sessionId: string, callback: (surveys: Survey[]) => void) => {
  return supabase
    .channel(`surveys:${sessionId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'surveys',
      filter: `session_id=eq.${sessionId}`
    }, async () => {
      const surveys = await getSurveys(sessionId);
      callback(surveys);
    })
    .subscribe();
};

// =============================================
// ROOMS FUNCTIONS
// =============================================

export const getRooms = async (eventId: string): Promise<Room[]> => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('event_id', eventId)
    .order('is_main_stage', { ascending: false });

  if (error) throw error;

  return data.map(r => ({
    id: r.id,
    name: r.name,
    speaker: r.speaker || '',
    topic: r.topic || '',
    viewers: 0, // Would need real-time tracking
    thumbnail: r.thumbnail || '',
    isMainStage: r.is_main_stage
  }));
};

export const getAllRooms = async (): Promise<Room[]> => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .order('is_main_stage', { ascending: false });

  if (error) throw error;

  return (data || []).map(r => ({
    id: r.id,
    name: r.name,
    speaker: r.speaker || '',
    topic: r.topic || '',
    viewers: 0,
    thumbnail: r.thumbnail || '',
    isMainStage: r.is_main_stage
  }));
};

// =============================================
// REALTIME SUBSCRIPTIONS
// =============================================

export const subscribeToStream = (streamId: string, callback: (stream: any) => void) => {
  return supabase
    .channel(`stream:${streamId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'streams',
      filter: `id=eq.${streamId}`
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
};

// =============================================
// ATTENDEES
// =============================================

export const getEventAttendees = async (eventId: string) => {
  const { data, error } = await supabase
    .from('event_users')
    .select(`
      *,
      profiles:user_id (*)
    `)
    .eq('event_id', eventId)
    .is('left_at', null);

  if (error) throw error;

  return data.map(eu => ({
    ...eu.profiles,
    joinedAt: eu.joined_at,
    watchTime: eu.watch_time,
    engagementScore: eu.engagement_score
  }));
};

export const joinEvent = async (eventId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('event_users')
    .upsert({
      event_id: eventId,
      user_id: user.id,
      joined_at: new Date().toISOString(),
      left_at: null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const leaveEvent = async (eventId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('event_users')
    .update({ left_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', user.id);

  if (error) throw error;
};

// =============================================
// USER ACTIVITY FUNCTIONS (for Reports)
// =============================================

export const getUserActivities = async (eventId?: string): Promise<UserActivity[]> => {
  // Get all event_users with their profiles
  let query = supabase
    .from('event_users')
    .select(`
      *,
      profiles:user_id (id, name, email, role, avatar, company, title, status, last_login_at)
    `)
    .order('joined_at', { ascending: false });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data: eventUsers, error: eventUsersError } = await query;
  if (eventUsersError) throw eventUsersError;

  // Get question counts per user
  const { data: questionCounts } = await supabase
    .from('questions')
    .select('user_id');

  // Get poll vote counts per user
  const { data: pollVoteCounts } = await supabase
    .from('poll_votes')
    .select('user_id');

  // Aggregate counts
  const questionsByUser: Record<string, number> = {};
  const pollsByUser: Record<string, number> = {};

  (questionCounts || []).forEach(q => {
    questionsByUser[q.user_id] = (questionsByUser[q.user_id] || 0) + 1;
  });

  (pollVoteCounts || []).forEach(p => {
    pollsByUser[p.user_id] = (pollsByUser[p.user_id] || 0) + 1;
  });

  return (eventUsers || []).map(eu => {
    const profile = eu.profiles;
    const joinedAt = new Date(eu.joined_at).getTime();
    const leftAt = eu.left_at ? new Date(eu.left_at).getTime() : undefined;
    const sessionDuration = leftAt
      ? Math.round((leftAt - joinedAt) / 60000)
      : Math.round((Date.now() - joinedAt) / 60000);

    return {
      userId: profile?.id || eu.user_id,
      userName: profile?.name || 'Unknown User',
      email: profile?.email || '',
      role: profile?.role as UserRole || UserRole.ATTENDEE,
      loginTime: joinedAt,
      logoutTime: leftAt,
      sessionDuration,
      ipAddress: 'N/A', // Would need server-side logging
      location: 'N/A', // Would need geolocation service
      device: 'N/A', // Would need user-agent parsing
      browser: 'N/A',
      connectionType: 'N/A',
      questionsAsked: questionsByUser[eu.user_id] || 0,
      pollsAnswered: pollsByUser[eu.user_id] || 0,
      engagementScore: eu.engagement_score || 0,
      history: [] // Would need separate activity logging table
    };
  });
};

export const getOnlineUsers = async (): Promise<UserActivity[]> => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'ONLINE');

  if (error) throw error;

  return (profiles || []).map(p => ({
    userId: p.id,
    userName: p.name,
    email: p.email,
    role: p.role as UserRole,
    loginTime: p.last_login_at ? new Date(p.last_login_at).getTime() : Date.now(),
    sessionDuration: p.last_login_at
      ? Math.round((Date.now() - new Date(p.last_login_at).getTime()) / 60000)
      : 0,
    ipAddress: 'N/A',
    location: 'N/A',
    device: 'N/A',
    browser: 'N/A',
    connectionType: 'N/A',
    questionsAsked: 0,
    pollsAnswered: 0,
    engagementScore: 0,
    history: []
  }));
};

// =============================================
// ADMIN: USER MANAGEMENT FUNCTIONS
// =============================================

export interface ProfileWithStats {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  company?: string;
  title?: string;
  status: string;
  created_at: string;
  last_login_at?: string;
}

export const getAllUsers = async (): Promise<ProfileWithStats[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateUserRole = async (userId: string, role: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;
};

export const deleteUser = async (userId: string): Promise<void> => {
  // First delete from profiles (cascade should handle related tables)
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) throw profileError;
};

export const getUserStats = async () => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('role, status, created_at');

  if (error) throw error;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalUsers = profiles?.length || 0;
  const onlineUsers = profiles?.filter(p => p.status === 'ONLINE').length || 0;
  const newUsersToday = profiles?.filter(p => new Date(p.created_at) >= today).length || 0;
  const newUsersThisWeek = profiles?.filter(p => new Date(p.created_at) >= thisWeek).length || 0;
  const newUsersThisMonth = profiles?.filter(p => new Date(p.created_at) >= thisMonth).length || 0;

  const roleDistribution = {
    ATTENDEE: profiles?.filter(p => p.role === 'ATTENDEE').length || 0,
    ADMIN: profiles?.filter(p => p.role === 'ADMIN').length || 0,
    MASTER_ADMIN: profiles?.filter(p => p.role === 'MASTER_ADMIN').length || 0,
    SPEAKER: profiles?.filter(p => p.role === 'SPEAKER').length || 0,
    MODERATOR: profiles?.filter(p => p.role === 'MODERATOR').length || 0,
  };

  return {
    totalUsers,
    onlineUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    roleDistribution,
  };
};

// =============================================
// ADMIN: PLATFORM METRICS
// =============================================

export const getPlatformMetrics = async () => {
  // Get event stats
  const { data: events } = await supabase
    .from('events')
    .select('id, status, created_at');

  // Get message count
  const { count: messageCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true });

  // Get question count
  const { count: questionCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });

  // Get poll count
  const { count: pollCount } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true });

  const liveEvents = events?.filter(e => e.status === 'LIVE').length || 0;
  const totalEvents = events?.length || 0;

  return {
    totalEvents,
    liveEvents,
    totalMessages: messageCount || 0,
    totalQuestions: questionCount || 0,
    totalPolls: pollCount || 0,
  };
};

// =============================================
// PROJECTS FUNCTIONS
// =============================================

// Generate a unique RTMP stream key
const generateStreamKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

export const getProjects = async (): Promise<Project[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  // If not MASTER_ADMIN, only show user's own projects
  if (profile?.role !== 'MASTER_ADMIN') {
    query = query.eq('owner_id', user.id);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    isOnDemand: p.is_on_demand,
    isPublic: p.is_public ?? true,
    createdAt: new Date(p.created_at).getTime(),
    startedAt: p.started_at ? new Date(p.started_at).getTime() : undefined,
    endedAt: p.ended_at ? new Date(p.ended_at).getTime() : undefined,
    youtubeVideoId: p.youtube_video_id,
    thumbnail: p.thumbnail,
    viewers: p.viewers,
    rtmpStreamKey: p.rtmp_stream_key,
    ownerId: p.owner_id
  }));
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    status: data.status,
    isOnDemand: data.is_on_demand,
    isPublic: data.is_public ?? true,
    createdAt: new Date(data.created_at).getTime(),
    startedAt: data.started_at ? new Date(data.started_at).getTime() : undefined,
    endedAt: data.ended_at ? new Date(data.ended_at).getTime() : undefined,
    youtubeVideoId: data.youtube_video_id,
    thumbnail: data.thumbnail,
    viewers: data.viewers,
    rtmpStreamKey: data.rtmp_stream_key,
    ownerId: data.owner_id
  };
};

export const createProject = async (
  projectData: Omit<Project, 'id' | 'createdAt' | 'viewers' | 'rtmpStreamKey' | 'ownerId'>
): Promise<Project> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const streamKey = generateStreamKey();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      is_on_demand: projectData.isOnDemand,
      is_public: projectData.isPublic ?? true,
      youtube_video_id: projectData.youtubeVideoId,
      thumbnail: projectData.thumbnail,
      rtmp_stream_key: streamKey,
      owner_id: user.id,
      viewers: 0
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    status: data.status,
    isOnDemand: data.is_on_demand,
    isPublic: data.is_public ?? true,
    createdAt: new Date(data.created_at).getTime(),
    startedAt: data.started_at ? new Date(data.started_at).getTime() : undefined,
    endedAt: data.ended_at ? new Date(data.ended_at).getTime() : undefined,
    youtubeVideoId: data.youtube_video_id,
    thumbnail: data.thumbnail,
    viewers: data.viewers,
    rtmpStreamKey: data.rtmp_stream_key,
    ownerId: data.owner_id
  };
};

export const updateProject = async (
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'createdAt' | 'rtmpStreamKey' | 'ownerId'>>
): Promise<Project> => {
  const dbUpdates: any = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.isOnDemand !== undefined) dbUpdates.is_on_demand = updates.isOnDemand;
  if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;
  if (updates.youtubeVideoId !== undefined) dbUpdates.youtube_video_id = updates.youtubeVideoId;
  if (updates.thumbnail !== undefined) dbUpdates.thumbnail = updates.thumbnail;
  if (updates.viewers !== undefined) dbUpdates.viewers = updates.viewers;
  if (updates.startedAt !== undefined) dbUpdates.started_at = new Date(updates.startedAt).toISOString();
  if (updates.endedAt !== undefined) dbUpdates.ended_at = new Date(updates.endedAt).toISOString();

  const { data, error } = await supabase
    .from('projects')
    .update(dbUpdates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    status: data.status,
    isOnDemand: data.is_on_demand,
    isPublic: data.is_public ?? true,
    createdAt: new Date(data.created_at).getTime(),
    startedAt: data.started_at ? new Date(data.started_at).getTime() : undefined,
    endedAt: data.ended_at ? new Date(data.ended_at).getTime() : undefined,
    youtubeVideoId: data.youtube_video_id,
    thumbnail: data.thumbnail,
    viewers: data.viewers,
    rtmpStreamKey: data.rtmp_stream_key,
    ownerId: data.owner_id
  };
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
};

export const toggleProjectOnDemand = async (projectId: string): Promise<Project> => {
  // First get current state
  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  return updateProject(projectId, { isOnDemand: !project.isOnDemand });
};

export const toggleProjectPublic = async (projectId: string): Promise<Project> => {
  // First get current state
  const project = await getProject(projectId);
  if (!project) throw new Error('Project not found');

  return updateProject(projectId, { isPublic: !project.isPublic });
};

export const endStream = async (projectId: string): Promise<Project> => {
  return updateProject(projectId, {
    status: 'ENDED',
    endedAt: Date.now()
  });
};

export const goLive = async (projectId: string): Promise<Project> => {
  return updateProject(projectId, {
    status: 'LIVE',
    startedAt: Date.now()
  });
};

// =============================================
// PASSWORD RESET FUNCTIONS
// =============================================

export const resetPasswordForEmail = async (email: string) => {
  // Use production URL in production, or current origin for local dev
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const redirectUrl = isLocalhost
    ? `${window.location.origin}/reset-password`
    : 'https://livevideo.com.br/reset-password';

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  });

  if (error) throw error;
  return data;
};

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return data;
};

// =============================================
// PARTY MANAGEMENT FUNCTIONS
// =============================================

export const getMyParties = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((p: any) => ({
    id: p.id,
    hostId: p.host_id,
    title: p.title,
    description: p.description,
    partyDate: p.party_date ? new Date(p.party_date).getTime() : undefined,
    location: p.location,
    maxGuests: p.max_guests,
    status: p.status,
    createdAt: new Date(p.created_at).getTime(),
    updatedAt: new Date(p.updated_at).getTime()
  }));
};

export const getParty = async (partyId: string) => {
  const { data, error } = await supabase
    .from('parties')
    .select('*')
    .eq('id', partyId)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    hostId: data.host_id,
    title: data.title,
    description: data.description,
    partyDate: data.party_date ? new Date(data.party_date).getTime() : undefined,
    location: data.location,
    maxGuests: data.max_guests,
    status: data.status,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime()
  };
};

export const createParty = async (party: Omit<any, 'id' | 'hostId' | 'createdAt' | 'updatedAt'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('parties')
    .insert({
      host_id: user.id,
      title: party.title,
      description: party.description,
      party_date: party.partyDate ? new Date(party.partyDate).toISOString() : null,
      location: party.location,
      max_guests: party.maxGuests,
      status: party.status || 'DRAFT'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    hostId: data.host_id,
    title: data.title,
    description: data.description,
    partyDate: data.party_date ? new Date(data.party_date).getTime() : undefined,
    location: data.location,
    maxGuests: data.max_guests,
    status: data.status,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime()
  };
};

export const updateParty = async (partyId: string, updates: Partial<any>) => {
  const dbUpdates: any = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.partyDate !== undefined) dbUpdates.party_date = updates.partyDate ? new Date(updates.partyDate).toISOString() : null;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.maxGuests !== undefined) dbUpdates.max_guests = updates.maxGuests;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { data, error } = await supabase
    .from('parties')
    .update(dbUpdates)
    .eq('id', partyId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    hostId: data.host_id,
    title: data.title,
    description: data.description,
    partyDate: data.party_date ? new Date(data.party_date).getTime() : undefined,
    location: data.location,
    maxGuests: data.max_guests,
    status: data.status,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime()
  };
};

export const deleteParty = async (partyId: string) => {
  const { error } = await supabase
    .from('parties')
    .delete()
    .eq('id', partyId);

  if (error) throw error;
};

// =============================================
// PARTY INVITATION FUNCTIONS
// =============================================

export const getPartyInvitations = async (partyId: string) => {
  const { data, error } = await supabase
    .from('party_invitations')
    .select('*')
    .eq('party_id', partyId)
    .order('invited_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((inv: any) => ({
    id: inv.id,
    partyId: inv.party_id,
    guestEmail: inv.guest_email,
    guestName: inv.guest_name,
    guestUserId: inv.guest_user_id,
    invitationStatus: inv.invitation_status,
    invitedAt: new Date(inv.invited_at).getTime(),
    respondedAt: inv.responded_at ? new Date(inv.responded_at).getTime() : undefined,
    attended: inv.attended,
    notes: inv.notes,
    reminderSentAt: inv.reminder_sent_at ? new Date(inv.reminder_sent_at).getTime() : undefined
  }));
};

export const inviteGuest = async (partyId: string, guestEmail: string, guestName?: string) => {
  const { data, error } = await supabase
    .from('party_invitations')
    .insert({
      party_id: partyId,
      guest_email: guestEmail,
      guest_name: guestName,
      invitation_status: 'PENDING'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    partyId: data.party_id,
    guestEmail: data.guest_email,
    guestName: data.guest_name,
    guestUserId: data.guest_user_id,
    invitationStatus: data.invitation_status,
    invitedAt: new Date(data.invited_at).getTime(),
    respondedAt: data.responded_at ? new Date(data.responded_at).getTime() : undefined,
    attended: data.attended,
    notes: data.notes,
    reminderSentAt: data.reminder_sent_at ? new Date(data.reminder_sent_at).getTime() : undefined
  };
};

export const bulkInviteGuests = async (partyId: string, guests: { email: string; name?: string }[]) => {
  const invitations = guests.map(g => ({
    party_id: partyId,
    guest_email: g.email,
    guest_name: g.name,
    invitation_status: 'PENDING'
  }));

  const { data, error } = await supabase
    .from('party_invitations')
    .insert(invitations)
    .select();

  if (error) throw error;

  return data;
};

export const updateInvitationStatus = async (invitationId: string, status: string) => {
  const { data, error } = await supabase
    .from('party_invitations')
    .update({
      invitation_status: status,
      responded_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const deleteInvitation = async (invitationId: string) => {
  const { error } = await supabase
    .from('party_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) throw error;
};

export const sendReminderToGuest = async (invitationId: string) => {
  const { data, error } = await supabase
    .from('party_invitations')
    .update({
      reminder_sent_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const getMyInvitations = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  if (!profile) throw new Error('Profile not found');

  const { data, error } = await supabase
    .from('party_invitations')
    .select(`
      *,
      parties (*)
    `)
    .or(`guest_email.eq.${profile.email},guest_user_id.eq.${user.id}`)
    .order('invited_at', { ascending: false });

  if (error) throw error;

  return data;
};

// =============================================
// PROJECT GUEST MANAGEMENT FUNCTIONS
// =============================================

export const getProjectGuests = async (projectId: string): Promise<ProjectGuest[]> => {
  const { data, error } = await supabase
    .from('project_guests')
    .select('*')
    .eq('project_id', projectId)
    .order('invited_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((g: any) => ({
    id: g.id,
    projectId: g.project_id,
    guestEmail: g.guest_email,
    guestName: g.guest_name,
    guestUserId: g.guest_user_id,
    invitationStatus: g.invitation_status,
    invitedAt: new Date(g.invited_at).getTime(),
    respondedAt: g.responded_at ? new Date(g.responded_at).getTime() : undefined,
    notes: g.notes,
    createdAt: new Date(g.created_at).getTime(),
    updatedAt: new Date(g.updated_at).getTime()
  }));
};

export const inviteProjectGuest = async (
  projectId: string,
  guestEmail: string,
  guestName?: string
): Promise<ProjectGuest> => {
  const { data, error } = await supabase
    .from('project_guests')
    .insert({
      project_id: projectId,
      guest_email: guestEmail,
      guest_name: guestName,
      invitation_status: 'PENDING'
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    projectId: data.project_id,
    guestEmail: data.guest_email,
    guestName: data.guest_name,
    guestUserId: data.guest_user_id,
    invitationStatus: data.invitation_status,
    invitedAt: new Date(data.invited_at).getTime(),
    respondedAt: data.responded_at ? new Date(data.responded_at).getTime() : undefined,
    notes: data.notes,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime()
  };
};

export const bulkInviteProjectGuests = async (
  projectId: string,
  guests: { email: string; name?: string }[]
): Promise<ProjectGuest[]> => {
  const invitations = guests.map(g => ({
    project_id: projectId,
    guest_email: g.email,
    guest_name: g.name,
    invitation_status: 'PENDING'
  }));

  const { data, error } = await supabase
    .from('project_guests')
    .insert(invitations)
    .select();

  if (error) throw error;

  return (data || []).map((g: any) => ({
    id: g.id,
    projectId: g.project_id,
    guestEmail: g.guest_email,
    guestName: g.guest_name,
    guestUserId: g.guest_user_id,
    invitationStatus: g.invitation_status,
    invitedAt: new Date(g.invited_at).getTime(),
    respondedAt: g.responded_at ? new Date(g.responded_at).getTime() : undefined,
    notes: g.notes,
    createdAt: new Date(g.created_at).getTime(),
    updatedAt: new Date(g.updated_at).getTime()
  }));
};

export const updateProjectGuestStatus = async (
  guestId: string,
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED'
): Promise<ProjectGuest> => {
  const { data, error } = await supabase
    .from('project_guests')
    .update({
      invitation_status: status,
      responded_at: new Date().toISOString()
    })
    .eq('id', guestId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    projectId: data.project_id,
    guestEmail: data.guest_email,
    guestName: data.guest_name,
    guestUserId: data.guest_user_id,
    invitationStatus: data.invitation_status,
    invitedAt: new Date(data.invited_at).getTime(),
    respondedAt: data.responded_at ? new Date(data.responded_at).getTime() : undefined,
    notes: data.notes,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime()
  };
};

export const deleteProjectGuest = async (guestId: string): Promise<void> => {
  const { error } = await supabase
    .from('project_guests')
    .delete()
    .eq('id', guestId);

  if (error) throw error;
};

// Get all project invitations for the current user (for guest rooms view)
export const getMyProjectInvitations = async (): Promise<ProjectGuestWithProject[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get user's email from auth
  const userEmail = user.email;
  if (!userEmail) throw new Error('User email not found');

  const { data, error } = await supabase
    .from('project_guests')
    .select(`
      *,
      projects (*)
    `)
    .or(`guest_email.eq.${userEmail},guest_user_id.eq.${user.id}`)
    .in('invitation_status', ['PENDING', 'CONFIRMED'])
    .order('invited_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((g: any) => ({
    id: g.id,
    projectId: g.project_id,
    guestEmail: g.guest_email,
    guestName: g.guest_name,
    guestUserId: g.guest_user_id,
    invitationStatus: g.invitation_status,
    invitedAt: new Date(g.invited_at).getTime(),
    respondedAt: g.responded_at ? new Date(g.responded_at).getTime() : undefined,
    notes: g.notes,
    createdAt: new Date(g.created_at).getTime(),
    updatedAt: new Date(g.updated_at).getTime(),
    project: g.projects ? {
      id: g.projects.id,
      name: g.projects.name,
      description: g.projects.description,
      status: g.projects.status,
      isOnDemand: g.projects.is_on_demand,
      isPublic: g.projects.is_public ?? true,
      createdAt: new Date(g.projects.created_at).getTime(),
      startedAt: g.projects.started_at ? new Date(g.projects.started_at).getTime() : undefined,
      endedAt: g.projects.ended_at ? new Date(g.projects.ended_at).getTime() : undefined,
      youtubeVideoId: g.projects.youtube_video_id,
      thumbnail: g.projects.thumbnail,
      viewers: g.projects.viewers,
      rtmpStreamKey: g.projects.rtmp_stream_key,
      ownerId: g.projects.owner_id
    } : null
  }));
};

// =============================================
// TRANSCODING FUNCTIONS
// =============================================

const API_URL = import.meta.env.VITE_API_URL || 'https://api.livevideo.com.br';

// Helper to get auth headers for backend API calls
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
};

export interface TranscodingProfile {
  id: string;
  name: string;
  width: number;
  height: number;
  video_bitrate: string;
  audio_bitrate: string;
  framerate: number;
  preset: string;
  is_default: boolean;
  created_at: string;
}

export interface TranscodingJob {
  id: string;
  stream_id: string;
  profile_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  input_url: string;
  output_url?: string;
  hls_playlist_url?: string;
  progress: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  transcoding_profiles?: TranscodingProfile;
}

export interface TranscodingStatus {
  activeJobs: number;
  status: string;
}

// Get all transcoding profiles
export const getTranscodingProfiles = async (onlyDefaults = false): Promise<TranscodingProfile[]> => {
  const headers = await getAuthHeaders();
  const url = `${API_URL}/api/transcoding/profiles${onlyDefaults ? '?defaults=true' : ''}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transcoding profiles');
  }

  return response.json();
};

// Create a new transcoding profile
export const createTranscodingProfile = async (profile: Omit<TranscodingProfile, 'id' | 'created_at'>): Promise<TranscodingProfile> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/transcoding/profiles`, {
    method: 'POST',
    headers,
    body: JSON.stringify(profile)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create transcoding profile');
  }

  return response.json();
};

// Update a transcoding profile
export const updateTranscodingProfile = async (id: string, updates: Partial<TranscodingProfile>): Promise<TranscodingProfile> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/transcoding/profiles/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update transcoding profile');
  }

  return response.json();
};

// Delete a transcoding profile
export const deleteTranscodingProfile = async (id: string): Promise<void> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/transcoding/profiles/${id}`, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete transcoding profile');
  }
};

// Get transcoding status
export const getTranscodingStatus = async (): Promise<TranscodingStatus> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/transcoding/status`, { headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transcoding status');
  }

  return response.json();
};

// Get transcoding jobs for a stream
export const getTranscodingJobsForStream = async (streamId: string): Promise<TranscodingJob[]> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/transcoding/jobs/stream/${streamId}`, { headers });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transcoding jobs');
  }

  return response.json();
};

// Start transcoding with all default profiles
export const startTranscoding = async (streamId: string, inputUrl: string): Promise<any> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/transcoding/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ streamId, inputUrl })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start transcoding');
  }

  return response.json();
};

// Stop a transcoding job
export const stopTranscodingJobApi = async (jobId: string): Promise<void> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/transcoding/jobs/${jobId}`, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to stop transcoding job');
  }
};

// Generate master HLS playlist
export const generateMasterPlaylistApi = async (streamId: string): Promise<{ masterPlaylistUrl: string }> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/transcoding/master-playlist/${streamId}`, {
    method: 'POST',
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate master playlist');
  }

  return response.json();
};
