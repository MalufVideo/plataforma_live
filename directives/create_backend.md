# Create Plataforma Live Backend

> Directive for creating the Node.js backend API and Supabase database schema for the Plataforma Live streaming platform.

## Goal

Create a production-ready Node.js/Express backend with WebSocket support for deployment on Coolify VPS, plus a complete SQL schema file for setting up a Supabase database.

## Context

**Plataforma Live** is a live streaming event platform with the following features:
- User authentication (sign-up, sign-in, sign-out)
- Multi-project support (DRAFT/LIVE/ENDED states, on-demand viewing)
- Live events with sessions and streams
- Real-time chat messaging
- Q&A with upvoting
- Polls with voting
- Surveys
- Breakout rooms
- User activity tracking and engagement scores

The frontend is built with React/Vite and uses `@supabase/supabase-js` for database operations. The backend should provide REST API endpoints and WebSocket connections for real-time features.

---

## Inputs Required

### Environment Variables
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
```

### Reference Files (Frontend)
- `types.ts` - All TypeScript interfaces and enums
- `services/supabaseService.ts` - All database operations to replicate
- `services/geminiService.ts` - AI features (optional for backend)

---

## Output Deliverables

### 1. Backend Folder Structure
Reorganize or create the backend in `apps/backend`:

```
plataforma_live/
├── apps/
│   ├── backend/
│   │   ├── Dockerfile
├── docker-compose.yml            # Local dev + deployment config
├── package.json                  # Dependencies
├── .env.example                  # Environment template
├── src/
│   ├── index.js                  # Main entry point
│   ├── config/
│   │   └── database.js           # Supabase client initialization
│   ├── middleware/
│   │   └── auth.js               # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js               # POST /signup, /signin, /signout, GET /me
│   │   ├── profiles.js           # GET /:id, PATCH /:id
│   │   ├── projects.js           # CRUD for projects
│   │   ├── events.js             # GET /, GET /:id, GET /live
│   │   ├── sessions.js           # GET /event/:eventId
│   │   ├── streams.js            # GET /:id, GET /event/:eventId/active
│   │   ├── messages.js           # GET /session/:sessionId, POST /
│   │   ├── questions.js          # GET /session/:sessionId, POST /, PATCH /:id/upvote
│   │   ├── polls.js              # GET /session/:sessionId, POST /vote
│   │   ├── rooms.js              # GET /event/:eventId
│   │   └── surveys.js            # GET /session/:sessionId, POST /response
│   └── websocket/
│       └── handlers.js           # Socket.IO event handlers
└── schema.sql                    # Complete database schema
```

### 2. SQL Schema File (schema.sql)

Must include all tables derived from the frontend types:

#### Tables to Create

| Table | Description | Key Fields |
|-------|-------------|------------|
| `profiles` | User profiles (extends auth.users) | id, name, role, avatar, company, title, status, last_login_at |
| `projects` | Project containers | id, name, description, status, is_on_demand, youtube_video_id, thumbnail, created_at |
| `events` | Live events | id, project_id, title, description, slug, status, start_time, end_time |
| `event_sessions` | Sessions within events | id, event_id, title, description, speaker, start_time, end_time |
| `streams` | Stream configurations | id, event_id, source_type (YOUTUBE/RTMP/HLS), source_url, status |
| `rooms` | Breakout rooms | id, event_id, name, speaker, topic, thumbnail, is_main_stage |
| `messages` | Chat messages | id, session_id, user_id, text, is_pinned, is_deleted, created_at |
| `questions` | Q&A questions | id, session_id, user_id, text, upvotes, is_answered, is_hidden |
| `polls` | Poll questions | id, session_id, question, is_active |
| `poll_options` | Poll answer options | id, poll_id, text |
| `poll_votes` | User votes on polls | id, poll_id, option_id, user_id (unique per poll) |
| `surveys` | Survey definitions | id, session_id, title, is_active |
| `survey_fields` | Survey questions | id, survey_id, question, type (RATING/TEXT/CHOICE), options |
| `survey_responses` | User responses | id, survey_id, user_id, responses (JSONB) |
| `event_users` | Event attendance | id, event_id, user_id, joined_at, left_at, watch_time, engagement_score |

#### Required Database Features

1. **Row Level Security (RLS) Policies**
   - Users can read their own profile, update only their own
   - Messages/Questions visible to all event attendees
   - Votes: users can only vote once per poll
   - Admin role can manage all resources

2. **Indexes**
   - `messages(session_id, created_at)`
   - `questions(session_id, upvotes DESC)`
   - `poll_votes(poll_id, user_id)` UNIQUE
   - `events(status)` for finding live events
   - `profiles(role)` for admin lookups

3. **Functions**
   ```sql
   CREATE OR REPLACE FUNCTION increment_upvotes(question_id UUID)
   RETURNS void AS $$
   BEGIN
     UPDATE questions SET upvotes = upvotes + 1 WHERE id = question_id;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

4. **Triggers**
   - Auto-create profile when auth.user is created
   - Update `updated_at` timestamps automatically

---

## API Endpoint Specifications

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /signup | Register new user | No |
| POST | /signin | Login with email/password | No |
| POST | /signout | Logout current user | Yes |
| GET | /me | Get current user profile | Yes |

**Request/Response Examples:**

```javascript
// POST /api/auth/signup
// Request:
{ "email": "user@example.com", "password": "secure123", "name": "John Doe", "company": "TechCorp" }
// Response:
{ "user": { "id": "uuid", "email": "..." }, "session": { "access_token": "..." } }

// POST /api/auth/signin
// Request:
{ "email": "user@example.com", "password": "secure123" }
// Response:
{ "user": {...}, "session": {...} }
```

### Profile Routes (`/api/profiles`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /:id | Get user profile by ID | Yes |
| PATCH | /:id | Update profile (own only) | Yes |

### Project Routes (`/api/projects`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | / | List all projects | Yes (Admin) |
| GET | /:id | Get project by ID | Yes |
| POST | / | Create new project | Yes (Admin) |
| PATCH | /:id | Update project | Yes (Admin) |
| DELETE | /:id | Delete project | Yes (Admin) |

### Event Routes (`/api/events`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | / | List events (optional status filter) | Yes |
| GET | /live | Get currently live event | Yes |
| GET | /:idOrSlug | Get event by ID or slug | Yes |

### Session Routes (`/api/sessions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /event/:eventId | Get sessions for event | Yes |

### Stream Routes (`/api/streams`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /:id | Get stream by ID | Yes |
| GET | /event/:eventId/active | Get active stream for event | Yes |

### Message Routes (`/api/messages`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /session/:sessionId | Get messages (limit param) | Yes |
| POST | / | Send new message | Yes |
| PATCH | /:id/pin | Toggle pin status | Yes (Moderator+) |
| DELETE | /:id | Soft delete message | Yes (Moderator+) |

### Question Routes (`/api/questions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /session/:sessionId | Get questions sorted by upvotes | Yes |
| POST | / | Submit new question | Yes |
| PATCH | /:id/upvote | Upvote a question | Yes |
| PATCH | /:id/answer | Mark as answered | Yes (Moderator+) |

### Poll Routes (`/api/polls`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /session/:sessionId | Get all polls for session | Yes |
| GET | /session/:sessionId/active | Get active poll | Yes |
| POST | / | Create new poll | Yes (Admin) |
| POST | /vote | Vote on poll option | Yes |
| PATCH | /:id/activate | Activate/deactivate poll | Yes (Admin) |

### Room Routes (`/api/rooms`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /event/:eventId | Get rooms for event | Yes |

### Survey Routes (`/api/surveys`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /session/:sessionId | Get surveys for session | Yes |
| POST | / | Create survey | Yes (Admin) |
| POST | /response | Submit survey response | Yes |

---

## WebSocket Events (Socket.IO)

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_session` | `{ sessionId: string }` | Join a session's real-time channel |
| `leave_session` | `{ sessionId: string }` | Leave a session's channel |
| `send_message` | `{ sessionId: string, text: string }` | Send chat message |
| `upvote_question` | `{ questionId: string }` | Upvote a question |
| `vote_poll` | `{ pollId: string, optionId: string }` | Vote on poll |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `Message` object | New chat message received |
| `message_pinned` | `{ messageId: string, isPinned: boolean }` | Message pin toggled |
| `questions_updated` | `Question[]` | Questions list updated |
| `poll_updated` | `Poll` object | Poll votes updated |
| `viewer_count` | `{ count: number }` | Current viewer count |
| `stream_status` | `{ status: string }` | Stream status changed |

---

## Docker Configuration

### Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - CORS_ORIGIN=${CORS_ORIGIN}
    restart: unless-stopped
```

---

## Security Requirements

1. **Helmet.js** - Set security headers
2. **Rate Limiting** - 100 requests/15min for auth, 1000/15min for other routes
3. **CORS** - Only allow configured origins
4. **JWT Verification** - Validate Supabase JWT on protected routes
5. **Input Validation** - Sanitize all user inputs
6. **Service Role Key** - Only use on backend, never expose to client

---

## Edge Cases & Error Handling

1. **Duplicate Votes** - Return 409 Conflict if user already voted
2. **Rate Limits** - Return 429 Too Many Requests with retry-after header
3. **Not Found** - Return 404 with descriptive message
4. **Unauthorized** - Return 401 for missing/invalid token
5. **Forbidden** - Return 403 for insufficient permissions
6. **Validation Errors** - Return 400 with field-specific errors

---

## Testing Checklist

- [ ] All routes return correct status codes
- [ ] JWT authentication works correctly
- [ ] RLS policies block unauthorized access
- [ ] WebSocket connections authenticate properly
- [ ] Rate limiting activates at threshold
- [ ] Docker build succeeds
- [ ] Health check endpoint responds

---

## Execution Scripts Needed

Create these scripts in `execution/`:

1. `generate_backend_files.py` - Generates all backend source files
2. `generate_sql_schema.py` - Generates the complete SQL schema
3. `validate_schema.py` - Validates SQL syntax

---

## Notes

- The backend uses Supabase Service Role Key which bypasses RLS
- Implement authorization checks in route handlers
- Use Supabase Realtime for WebSocket subscriptions where possible
- Consider adding Redis for session caching in production
