-- =============================================
-- Live Video Streaming Platform - Supabase Schema
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('ATTENDEE', 'SPEAKER', 'MODERATOR', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ONLINE', 'AWAY', 'OFFLINE');
CREATE TYPE event_status AS ENUM ('DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');
CREATE TYPE stream_source AS ENUM ('RTMP', 'HLS', 'YOUTUBE', 'WEBRTC');
CREATE TYPE stream_status AS ENUM ('IDLE', 'CONNECTING', 'LIVE', 'ENDED', 'ERROR');
CREATE TYPE recording_status AS ENUM ('PROCESSING', 'READY', 'ERROR');

-- =============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- =============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT,
    company TEXT,
    title TEXT,
    role user_role DEFAULT 'ATTENDEE',
    status user_status DEFAULT 'OFFLINE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- EVENTS TABLE
-- =============================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    thumbnail TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    status event_status DEFAULT 'DRAFT',
    is_public BOOLEAN DEFAULT true,
    requires_auth BOOLEAN DEFAULT true,
    max_attendees INTEGER,
    primary_color TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public events are viewable by everyone" ON events
    FOR SELECT USING (is_public = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage events" ON events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR'))
    );

-- =============================================
-- EVENT USERS (Attendees)
-- =============================================

CREATE TABLE event_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role DEFAULT 'ATTENDEE',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    watch_time INTEGER DEFAULT 0, -- in seconds
    engagement_score INTEGER DEFAULT 0,
    UNIQUE(event_id, user_id)
);

ALTER TABLE event_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view event attendees" ON event_users
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join events" ON event_users
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance" ON event_users
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- EVENT SESSIONS
-- =============================================

CREATE TABLE event_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    speaker TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sessions are viewable by authenticated users" ON event_sessions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage sessions" ON event_sessions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR'))
    );

-- =============================================
-- STREAMS
-- =============================================

CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    session_id UUID REFERENCES event_sessions(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id),
    name TEXT NOT NULL,
    stream_key TEXT UNIQUE NOT NULL,
    playback_url TEXT,
    rtmp_url TEXT,
    hls_url TEXT,
    youtube_id TEXT,
    source stream_source DEFAULT 'RTMP',
    status stream_status DEFAULT 'IDLE',
    is_recording BOOLEAN DEFAULT false,
    qualities TEXT[] DEFAULT ARRAY['1080p', '720p', '480p', '360p'],
    peak_viewers INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streams are viewable by authenticated users" ON streams
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage streams" ON streams
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR'))
    );

-- =============================================
-- MESSAGES (Chat)
-- =============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages are viewable by authenticated users" ON messages
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_deleted = false);

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages" ON messages
    FOR UPDATE USING (auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR')));

-- =============================================
-- QUESTIONS (Q&A)
-- =============================================

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    is_answered BOOLEAN DEFAULT false,
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    answered_at TIMESTAMPTZ
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questions are viewable by authenticated users" ON questions
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_hidden = false);

CREATE POLICY "Users can submit questions" ON questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions" ON questions
    FOR UPDATE USING (auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR', 'SPEAKER')));

-- =============================================
-- POLLS
-- =============================================

CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    show_results BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Polls are viewable by authenticated users" ON polls
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage polls" ON polls
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR'))
    );

-- =============================================
-- POLL OPTIONS
-- =============================================

CREATE TABLE poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    "order" INTEGER DEFAULT 0
);

ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Poll options are viewable by authenticated users" ON poll_options
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- POLL VOTES
-- =============================================

CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view poll votes" ON poll_votes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can vote" ON poll_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- ROOMS (Breakout Rooms)
-- =============================================

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    speaker TEXT,
    topic TEXT,
    thumbnail TEXT,
    is_main_stage BOOLEAN DEFAULT false,
    max_participants INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms are viewable by authenticated users" ON rooms
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- VIEWER ANALYTICS
-- =============================================

CREATE TABLE viewer_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    viewer_count INTEGER NOT NULL,
    bandwidth BIGINT
);

ALTER TABLE viewer_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics viewable by admins" ON viewer_analytics
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'MODERATOR'))
    );

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'ATTENDEE')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_event_sessions_updated_at BEFORE UPDATE ON event_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment question upvotes
CREATE OR REPLACE FUNCTION increment_upvotes(question_id UUID)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE questions SET upvotes = upvotes + 1 WHERE id = question_id
    RETURNING upvotes INTO new_count;
    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_streams_stream_key ON streams(stream_key);
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_questions_session_id ON questions(session_id);
CREATE INDEX idx_questions_upvotes ON questions(upvotes DESC);
CREATE INDEX idx_polls_session_id ON polls(session_id);
CREATE INDEX idx_viewer_analytics_stream_id ON viewer_analytics(stream_id);
CREATE INDEX idx_viewer_analytics_timestamp ON viewer_analytics(timestamp);

-- =============================================
-- REALTIME SUBSCRIPTIONS
-- =============================================

-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE questions;
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE streams;
