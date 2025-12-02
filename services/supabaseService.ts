import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { User as AppUser, UserRole, Message, Question, Poll, PollOption, Room, Session as EventSession } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://supabasekong-mo0gsg800wo4csgw4w04gggs.72.60.142.28.sslip.io';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDYzNzMyMCwiZXhwIjo0OTIwMzEwOTIwLCJyb2xlIjoiYW5vbiJ9.CqUFsTjOYVzcSNZBWCrVBsMTlWDJz5RTU_s24lm604w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// AUTH FUNCTIONS
// =============================================

export const signUp = async (email: string, password: string, name: string, company?: string, title?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, company, title }
    }
  });
  
  if (error) throw error;
  return data;
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
