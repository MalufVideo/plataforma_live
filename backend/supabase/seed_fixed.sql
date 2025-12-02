-- =============================================
-- Live Video Streaming Platform - Seed Data (Fixed UUIDs)
-- Run this AFTER schema.sql
-- =============================================

-- Drop the foreign key constraint to allow standalone profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- =============================================
-- CREATE DEMO PROFILES
-- =============================================

INSERT INTO profiles (id, email, name, avatar, company, title, role, status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@livevideo.com.br', 'Admin User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'Live Video', 'System Administrator', 'ADMIN', 'ONLINE'),
    ('22222222-2222-2222-2222-222222222222', 'moderator@livevideo.com.br', 'Maria Santos', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria', 'Live Video', 'Event Moderator', 'MODERATOR', 'ONLINE'),
    ('33333333-3333-3333-3333-333333333333', 'speaker@livevideo.com.br', 'Dr. João Silva', 'https://api.dicebear.com/7.x/avataaars/svg?seed=joao', 'TechCorp Brasil', 'CTO', 'SPEAKER', 'ONLINE'),
    ('44444444-4444-4444-4444-444444444444', 'alex@techcorp.com', 'Alex Rivera', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex', 'TechCorp Global', 'CTO', 'ATTENDEE', 'ONLINE'),
    ('55555555-5555-5555-5555-555555555555', 'sarah@startup.io', 'Sarah L.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah', 'Startup.io', 'Product Manager', 'ATTENDEE', 'ONLINE'),
    ('66666666-6666-6666-6666-666666666666', 'mike@events.pro', 'Mike T.', 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', 'Events Pro', 'Event Coordinator', 'ATTENDEE', 'AWAY'),
    ('77777777-7777-7777-7777-777777777777', 'guest@example.com', 'Guest 402', 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest', NULL, NULL, 'ATTENDEE', 'ONLINE')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- =============================================
-- CREATE EVENTS
-- =============================================

INSERT INTO events (id, title, description, slug, thumbnail, start_time, end_time, timezone, status, is_public, requires_auth, max_attendees, primary_color, logo_url) VALUES
    (
        'e1111111-1111-1111-1111-111111111111',
        'Tech Summit Brasil 2024',
        'O maior evento de tecnologia do Brasil.',
        'tech-summit-brasil-2024',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        NOW() - INTERVAL '1 hour',
        NOW() + INTERVAL '8 hours',
        'America/Sao_Paulo',
        'LIVE',
        true,
        true,
        5000,
        '#6366f1',
        'https://api.dicebear.com/7.x/shapes/svg?seed=techsummit'
    ),
    (
        'e2222222-2222-2222-2222-222222222222',
        'Workshop: Desenvolvimento Web Moderno',
        'Aprenda as últimas tecnologias de desenvolvimento web.',
        'workshop-dev-web-2024',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        NOW() + INTERVAL '2 days',
        NOW() + INTERVAL '2 days' + INTERVAL '4 hours',
        'America/Sao_Paulo',
        'SCHEDULED',
        true,
        true,
        200,
        '#10b981',
        NULL
    )
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CREATE EVENT SESSIONS
-- =============================================

INSERT INTO event_sessions (id, event_id, title, description, speaker, start_time, end_time) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Opening Keynote: O Futuro da Tecnologia', 'Uma visão inspiradora sobre as tendências tecnológicas.', 'Dr. João Silva', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '1 hour'),
    ('a2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'AI & Machine Learning na Prática', 'Casos reais de implementação de IA.', 'Maria Santos', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours'),
    ('a3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'Painel: Startups & Inovação', 'Fundadores compartilham suas experiências.', 'Painel de Especialistas', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CREATE STREAMS
-- =============================================

INSERT INTO streams (id, event_id, session_id, created_by, name, stream_key, playback_url, rtmp_url, hls_url, source, status, qualities, peak_viewers, total_views, started_at) VALUES
    ('b1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Main Stage Stream', 'live_techsummit_main_2024', 'http://localhost:8080/hls/live_techsummit_main_2024/master.m3u8', 'rtmp://localhost:1935/live/live_techsummit_main_2024', 'http://localhost:8080/hls/live_techsummit_main_2024/master.m3u8', 'RTMP', 'LIVE', ARRAY['1080p', '720p', '480p', '360p'], 1247, 3500, NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CREATE BREAKOUT ROOMS
-- =============================================

INSERT INTO rooms (id, event_id, name, speaker, topic, thumbnail, is_main_stage, max_participants) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Main Stage', 'Dr. João Silva', 'Opening Keynote', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400', true, NULL),
    ('c2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'Workshop Room A', 'Ana Costa', 'React & Next.js Avançado', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400', false, 50),
    ('c3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'Workshop Room B', 'Carlos Mendes', 'DevOps & Cloud Native', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400', false, 50),
    ('c4444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111', 'Networking Lounge', NULL, 'Networking & Coffee Break', 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400', false, 100)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- ADD EVENT ATTENDEES
-- =============================================

INSERT INTO event_users (event_id, user_id, role, joined_at, watch_time, engagement_score) VALUES
    ('e1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'ATTENDEE', NOW() - INTERVAL '45 minutes', 2700, 85),
    ('e1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'ATTENDEE', NOW() - INTERVAL '30 minutes', 1800, 72),
    ('e1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'ATTENDEE', NOW() - INTERVAL '20 minutes', 1200, 45),
    ('e1111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'ATTENDEE', NOW() - INTERVAL '10 minutes', 600, 30),
    ('e1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'SPEAKER', NOW() - INTERVAL '1 hour', 3600, 100),
    ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'MODERATOR', NOW() - INTERVAL '1 hour', 3600, 95)
ON CONFLICT (event_id, user_id) DO NOTHING;

-- =============================================
-- CREATE CHAT MESSAGES
-- =============================================

INSERT INTO messages (session_id, user_id, text, is_pinned, created_at) VALUES
    ('a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Olá a todos! Animado para o evento! 🎉', false, NOW() - INTERVAL '40 minutes'),
    ('a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Ótima apresentação até agora!', false, NOW() - INTERVAL '35 minutes'),
    ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '📢 Bem-vindos ao Tech Summit Brasil 2024!', true, NOW() - INTERVAL '30 minutes'),
    ('a1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'O áudio está perfeito aqui!', false, NOW() - INTERVAL '25 minutes'),
    ('a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Concordo com o ponto sobre IA generativa', false, NOW() - INTERVAL '20 minutes'),
    ('a1111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Os slides estarão disponíveis depois?', false, NOW() - INTERVAL '15 minutes'),
    ('a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Excelente pergunta!', false, NOW() - INTERVAL '10 minutes'),
    ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '✅ Sim, os slides serão enviados por email.', true, NOW() - INTERVAL '8 minutes'),
    ('a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Wow! Essa demo foi incrível! 🚀', false, NOW() - INTERVAL '5 minutes'),
    ('a1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'Alguém mais está tendo problemas com o vídeo?', false, NOW() - INTERVAL '2 minutes');

-- =============================================
-- CREATE QUESTIONS
-- =============================================

INSERT INTO questions (id, session_id, user_id, text, upvotes, is_answered, created_at) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Como vocês veem a adoção de IA generativa em empresas tradicionais nos próximos 2 anos?', 24, false, NOW() - INTERVAL '30 minutes'),
    ('d2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'Quais são os principais desafios de segurança ao implementar soluções de IA?', 18, true, NOW() - INTERVAL '25 minutes'),
    ('d3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'Existe alguma recomendação de framework para começar com machine learning?', 12, false, NOW() - INTERVAL '20 minutes'),
    ('d4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Como medir o ROI de projetos de transformação digital?', 8, false, NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CREATE POLLS
-- =============================================

INSERT INTO polls (id, session_id, question, is_active, show_results, created_at) VALUES
    ('f1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Qual tecnologia você considera mais impactante para 2024?', true, true, NOW() - INTERVAL '20 minutes'),
    ('f2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Você já implementou IA em algum projeto?', false, true, NOW() - INTERVAL '40 minutes')
ON CONFLICT (id) DO NOTHING;

-- Poll Options
INSERT INTO poll_options (id, poll_id, text, "order") VALUES
    ('01111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'Inteligência Artificial Generativa', 0),
    ('02222222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111111', 'Web3 & Blockchain', 1),
    ('03333333-3333-3333-3333-333333333333', 'f1111111-1111-1111-1111-111111111111', 'Edge Computing', 2),
    ('04444444-4444-4444-4444-444444444444', 'f1111111-1111-1111-1111-111111111111', 'Quantum Computing', 3),
    ('05555555-5555-5555-5555-555555555555', 'f2222222-2222-2222-2222-222222222222', 'Sim, em produção', 0),
    ('06666666-6666-6666-6666-666666666666', 'f2222222-2222-2222-2222-222222222222', 'Sim, em fase de testes', 1),
    ('07777777-7777-7777-7777-777777777777', 'f2222222-2222-2222-2222-222222222222', 'Ainda não, mas planejando', 2),
    ('08888888-8888-8888-8888-888888888888', 'f2222222-2222-2222-2222-222222222222', 'Não tenho planos', 3)
ON CONFLICT (id) DO NOTHING;

-- Poll Votes
INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES
    ('f1111111-1111-1111-1111-111111111111', '01111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444'),
    ('f1111111-1111-1111-1111-111111111111', '01111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555'),
    ('f1111111-1111-1111-1111-111111111111', '02222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666'),
    ('f1111111-1111-1111-1111-111111111111', '03333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777777'),
    ('f2222222-2222-2222-2222-222222222222', '05555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444'),
    ('f2222222-2222-2222-2222-222222222222', '06666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555')
ON CONFLICT (poll_id, user_id) DO NOTHING;

-- =============================================
-- VIEWER ANALYTICS
-- =============================================

INSERT INTO viewer_analytics (stream_id, timestamp, viewer_count, bandwidth) VALUES
    ('b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '60 minutes', 150, 1500000000),
    ('b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '50 minutes', 580, 5800000000),
    ('b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '40 minutes', 920, 9200000000),
    ('b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '30 minutes', 1150, 11500000000),
    ('b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '20 minutes', 1247, 12470000000),
    ('b1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '10 minutes', 1220, 12200000000),
    ('b1111111-1111-1111-1111-111111111111', NOW(), 1247, 12470000000);

SELECT 'Seed data inserted successfully!' as status;
