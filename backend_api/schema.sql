-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'ATTENDEE', -- ATTENDEE, SPEAKER, MODERATOR, ADMIN
  avatar TEXT,
  company TEXT,
  title TEXT,
  status TEXT DEFAULT 'OFFLINE', -- ONLINE, AWAY, OFFLINE
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'DRAFT', -- DRAFT, LIVE, ENDED
  is_on_demand BOOLEAN DEFAULT FALSE,
  youtube_video_id TEXT,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  viewers INTEGER DEFAULT 0
);

-- Events
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE,
  status TEXT DEFAULT 'UPCOMING', -- UPCOMING, LIVE, ENDED
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Sessions
CREATE TABLE event_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  speaker TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Streams
CREATE TABLE streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- YOUTUBE, CUSTOM_RTMP, HLS
  source_url TEXT,
  status TEXT DEFAULT 'OFFLINE', -- OFFLINE, LIVE
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms (Breakout Rooms)
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  speaker TEXT,
  topic TEXT,
  thumbnail TEXT,
  is_main_stage BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages (Chat)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions (Q&A)
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_answered BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Polls
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll Options
CREATE TABLE poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL
);

-- Poll Votes
CREATE TABLE poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- One vote per user per poll
);

-- Surveys
CREATE TABLE surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Survey Fields
CREATE TABLE survey_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT NOT NULL, -- RATING, TEXT, CHOICE
  options TEXT[] -- Array of strings for choices
);

-- Survey Responses
CREATE TABLE survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  responses JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(survey_id, user_id)
);

-- Event Users (Attendance)
CREATE TABLE event_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  watch_time INTEGER DEFAULT 0, -- Seconds
  engagement_score INTEGER DEFAULT 0,
  UNIQUE(event_id, user_id)
);


-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on auth.user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', 'ATTENDEE');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Increment Upvotes Function (Atomic)
CREATE OR REPLACE FUNCTION increment_upvotes(question_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE questions SET upvotes = upvotes + 1 WHERE id = question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_users ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, Owner write
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: Public read, Admin write
CREATE POLICY "Public projects are viewable by everyone" ON projects FOR SELECT USING (true);
CREATE POLICY "Admins can insert projects" ON projects FOR INSERT WITH CHECK ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );
CREATE POLICY "Admins can update projects" ON projects FOR UPDATE USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );
CREATE POLICY "Admins can delete projects" ON projects FOR DELETE USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );

-- Events/Sessions/Streams/Rooms: Public read, Admin write
-- (Repeating pattern for content tables)
CREATE POLICY "Public events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON events FOR ALL USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );

CREATE POLICY "Public sessions are viewable by everyone" ON event_sessions FOR SELECT USING (true);
CREATE POLICY "Admins can manage sessions" ON event_sessions FOR ALL USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );

-- Messages: Viewable by everyone, Insert by authenticated
CREATE POLICY "Messages viewable by everyone" ON messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Only moderators can update/delete (omitted for brevity, use similar check as Admin)

-- Questions: Viewable by everyone, Insert by authenticated
CREATE POLICY "Questions viewable by everyone" ON questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert questions" ON questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Polls: Public read, Admin write
CREATE POLICY "Polls viewable by everyone" ON polls FOR SELECT USING (true);
CREATE POLICY "Admins can manage polls" ON polls FOR ALL USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );

-- Poll Votes: Insert by authenticated, View by everyone
CREATE POLICY "Votes viewable by everyone" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON poll_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_messages_session ON messages(session_id, created_at);
CREATE INDEX idx_questions_session ON questions(session_id, upvotes DESC);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_profiles_role ON profiles(role);
