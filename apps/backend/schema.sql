-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  username TEXT UNIQUE, -- Unique handle for public profile URL (e.g., livevideo.com.br/username)
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
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'DRAFT', -- DRAFT, LIVE, ENDED
  is_on_demand BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  youtube_video_id TEXT,
  thumbnail TEXT,
  rtmp_stream_key TEXT UNIQUE NOT NULL,
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


-- RTMP Ingest Configuration (for vMix/OBS streams)
CREATE TABLE rtmp_ingest_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  stream_key TEXT UNIQUE NOT NULL,
  rtmp_url TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcoding Profiles (720p, 1080p, 480p, etc.)
CREATE TABLE transcoding_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,              -- e.g., '1080p', '720p', '480p'
  width INTEGER NOT NULL,          -- e.g., 1920, 1280, 854
  height INTEGER NOT NULL,         -- e.g., 1080, 720, 480
  video_bitrate TEXT NOT NULL,     -- e.g., '4500k', '2500k', '1000k'
  audio_bitrate TEXT DEFAULT '128k',
  framerate INTEGER DEFAULT 30,
  preset TEXT DEFAULT 'veryfast',  -- FFmpeg preset
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transcoding Jobs
CREATE TABLE transcoding_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES transcoding_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'PENDING',   -- PENDING, PROCESSING, COMPLETED, FAILED
  input_url TEXT NOT NULL,
  output_url TEXT,
  hls_playlist_url TEXT,
  progress INTEGER DEFAULT 0,      -- 0-100 percentage
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default transcoding profiles
INSERT INTO transcoding_profiles (name, width, height, video_bitrate, audio_bitrate, framerate, preset, is_default) VALUES
  ('1080p', 1920, 1080, '4500k', '192k', 30, 'veryfast', true),
  ('720p', 1280, 720, '2500k', '128k', 30, 'veryfast', true),
  ('480p', 854, 480, '1000k', '96k', 30, 'veryfast', true),
  ('360p', 640, 360, '600k', '64k', 30, 'veryfast', false);

-- =============================================
-- PARTY MANAGEMENT
-- =============================================

-- Parties
CREATE TABLE parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  party_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  max_guests INTEGER,
  status TEXT DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, CANCELLED, COMPLETED
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Party Invitations
CREATE TABLE party_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE NOT NULL,
  guest_email TEXT NOT NULL,
  guest_name TEXT,
  guest_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invitation_status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, DECLINED, CANCELLED
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  attended BOOLEAN DEFAULT FALSE,
  notes TEXT,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(party_id, guest_email)
);

-- =============================================
-- PROJECT GUEST MANAGEMENT
-- =============================================

-- Project Guests (invitations to projects as rooms)
CREATE TABLE project_guests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  guest_email TEXT NOT NULL,
  guest_name TEXT,
  guest_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invitation_status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, DECLINED, CANCELLED
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, guest_email)
);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on auth.user creation
-- This function handles both email/password signups AND OAuth signups (Google, etc.)
-- Email/password signup provides: name, username in raw_user_meta_data
-- Google OAuth provides: full_name, name, email, avatar_url, picture in raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_name TEXT;
  user_avatar TEXT;
  user_username TEXT;
BEGIN
  -- Get name: prefer 'name', then 'full_name' (Google OAuth)
  user_name := COALESCE(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );

  -- Get avatar: check for avatar_url or picture (Google OAuth)
  user_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  -- Get username from metadata (only set during email/password signup)
  user_username := new.raw_user_meta_data->>'username';

  INSERT INTO public.profiles (id, email, name, username, avatar, role)
  VALUES (
    new.id,
    new.email,
    user_name,
    user_username,
    user_avatar,
    'ATTENDEE'
  );

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

-- Update timestamp for project_guests
CREATE OR REPLACE FUNCTION update_project_guests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_guests_updated_at
  BEFORE UPDATE ON project_guests
  FOR EACH ROW
  EXECUTE FUNCTION update_project_guests_updated_at();

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
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_guests ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, Owner write
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: Public read, Owner/Admin write
CREATE POLICY "Public projects are viewable by everyone" ON projects FOR SELECT USING (is_public = true OR owner_id = auth.uid());
CREATE POLICY "Admins can insert projects" ON projects FOR INSERT WITH CHECK ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );
CREATE POLICY "Project owners can update their projects" ON projects FOR UPDATE USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Project owners can delete their projects" ON projects FOR DELETE USING (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));

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

-- Parties: Host can view/edit their own, everyone can view published
CREATE POLICY "Users can view their own parties" ON parties FOR SELECT USING (host_id = auth.uid() OR status = 'PUBLISHED');
CREATE POLICY "Users can create parties" ON parties FOR INSERT WITH CHECK (host_id = auth.uid());
CREATE POLICY "Hosts can update their parties" ON parties FOR UPDATE USING (host_id = auth.uid());
CREATE POLICY "Hosts can delete their parties" ON parties FOR DELETE USING (host_id = auth.uid());

-- Party Invitations: Hosts can manage, guests can view/respond to their own
CREATE POLICY "Hosts can view party invitations" ON party_invitations FOR SELECT USING (
  party_id IN (SELECT id FROM parties WHERE host_id = auth.uid())
);
CREATE POLICY "Guests can view their invitations" ON party_invitations FOR SELECT USING (
  guest_user_id = auth.uid() OR
  guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "Hosts can manage invitations" ON party_invitations FOR INSERT WITH CHECK (
  party_id IN (SELECT id FROM parties WHERE host_id = auth.uid())
);
CREATE POLICY "Guests can RSVP" ON party_invitations FOR UPDATE USING (
  guest_user_id = auth.uid() OR
  guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "Hosts can delete invitations" ON party_invitations FOR DELETE USING (
  party_id IN (SELECT id FROM parties WHERE host_id = auth.uid())
);

-- Project Guests: Project owners can manage, guests can view/respond to their own
CREATE POLICY "Project owners can view their project guests" ON project_guests FOR SELECT USING (
  project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
);
CREATE POLICY "Guests can view their own invitations" ON project_guests FOR SELECT USING (
  guest_user_id = auth.uid() OR
  guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "Project owners can add guests to their projects" ON project_guests FOR INSERT WITH CHECK (
  project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
);
CREATE POLICY "Project owners can update their project guests" ON project_guests FOR UPDATE USING (
  project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
);
CREATE POLICY "Guests can RSVP to their invitations" ON project_guests FOR UPDATE USING (
  guest_user_id = auth.uid() OR
  guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
) WITH CHECK (
  guest_user_id = auth.uid() OR
  guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "Project owners can delete their project guests" ON project_guests FOR DELETE USING (
  project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
);

-- RTMP Ingest Configs: Admin only
CREATE POLICY "RTMP configs viewable by admins" ON rtmp_ingest_configs FOR SELECT USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );
CREATE POLICY "Admins can manage RTMP configs" ON rtmp_ingest_configs FOR ALL USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );

-- Transcoding Profiles: Public read, Admin write
CREATE POLICY "Transcoding profiles viewable by everyone" ON transcoding_profiles FOR SELECT USING (true);
CREATE POLICY "Admins can manage transcoding profiles" ON transcoding_profiles FOR ALL USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );

-- Transcoding Jobs: Admin only
CREATE POLICY "Transcoding jobs viewable by admins" ON transcoding_jobs FOR SELECT USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );
CREATE POLICY "Admins can manage transcoding jobs" ON transcoding_jobs FOR ALL USING ( EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN') );

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_messages_session ON messages(session_id, created_at);
CREATE INDEX idx_questions_session ON questions(session_id, upvotes DESC);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE UNIQUE INDEX idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;
CREATE INDEX idx_rtmp_stream_key ON rtmp_ingest_configs(stream_key);
CREATE INDEX idx_transcoding_jobs_stream ON transcoding_jobs(stream_id, status);
CREATE INDEX idx_transcoding_jobs_status ON transcoding_jobs(status);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_parties_host ON parties(host_id);
CREATE INDEX idx_parties_status ON parties(status);
CREATE INDEX idx_party_invitations_party ON party_invitations(party_id);
CREATE INDEX idx_party_invitations_guest_email ON party_invitations(guest_email);
CREATE INDEX idx_party_invitations_guest_user ON party_invitations(guest_user_id);
CREATE INDEX idx_project_guests_project ON project_guests(project_id);
CREATE INDEX idx_project_guests_guest_email ON project_guests(guest_email);
CREATE INDEX idx_project_guests_guest_user ON project_guests(guest_user_id);
