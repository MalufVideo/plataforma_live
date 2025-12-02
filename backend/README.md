# Live Video Streaming Platform - Backend

A complete Docker-based backend for live video streaming with adaptive bitrate support, user management, and real-time engagement features.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Container                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Nginx RTMP    │  │    Node.js      │  │   FFmpeg     │ │
│  │   (Port 1935)   │  │    API          │  │  Transcoder  │ │
│  │                 │  │   (Port 3000)   │  │              │ │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┘ │
│           │                    │                             │
│           └────────────────────┴─────────────────────────────│
│                              │                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              HTTP Server (Port 8080)                     │ │
│  │   /hls/*  - HLS Streaming                               │ │
│  │   /api/*  - REST API                                    │ │
│  │   /ws     - WebSocket                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │     Redis       │
│   (Port 5432)   │  │   (Port 6379)   │
└─────────────────┘  └─────────────────┘
```

## Features

### Streaming
- **RTMP Ingest** - Receive streams from OBS, vMix, or any RTMP encoder
- **Adaptive Bitrate** - Automatic transcoding to 1080p, 720p, 480p, 360p
- **HLS Output** - Apple HLS for wide compatibility
- **Low Latency Mode** - Optional 1-second fragment mode
- **Recording** - Optional stream recording to MP4

### User Management
- JWT-based authentication
- Role-based access control (Admin, Moderator, Speaker, Attendee)
- Session management with device tracking
- Bulk user import

### Event Management
- Create and schedule events
- Multiple sessions per event
- Attendee tracking and limits
- Event branding (colors, logos)

### Stream Management
- Unique stream keys per stream
- Stream key regeneration
- Multi-destination relay (YouTube, Twitch)
- Stream statistics and analytics

### Engagement
- Real-time chat with WebSocket
- Q&A with upvoting
- Live polls with results
- Pinned messages
- Typing indicators

### Analytics
- Viewer counts and peak viewers
- Watch time tracking
- Engagement scores
- User activity reports

## Quick Start

### Prerequisites
- Docker & Docker Compose
- 4GB+ RAM recommended for transcoding

### Deployment with Coolify

1. **Create a new service** in Coolify
2. **Select Docker Compose** as the deployment method
3. **Point to this repository** or upload the files
4. **Set environment variables**:

```env
DB_PASSWORD=your-secure-password
JWT_SECRET=your-32-character-minimum-secret
RTMP_HOST=your-domain.com
HLS_HOST=your-domain.com:8080
CORS_ORIGIN=https://your-frontend.com
INTERNAL_API_KEY=your-internal-key
```

5. **Deploy!**

### Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f streaming

# Run migrations
docker-compose run --rm migrate

# Stop services
docker-compose down
```

## Streaming Guide

### OBS Studio Configuration

1. Go to **Settings > Stream**
2. Set **Service** to "Custom..."
3. Set **Server** to: `rtmp://your-server:1935/live`
4. Set **Stream Key** to your generated stream key

### Playback URL

After starting a stream, the HLS playback URL will be:
```
http://your-server:8080/hls/{stream_key}/master.m3u8
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users (admin)
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/role` - Update role (admin)

### Events
- `GET /api/events` - List events
- `GET /api/events/:id` - Get event
- `POST /api/events` - Create event (admin)
- `PUT /api/events/:id` - Update event (admin)
- `POST /api/events/:id/join` - Join event
- `GET /api/events/:id/attendees` - List attendees

### Streams
- `GET /api/streams` - List streams
- `POST /api/streams` - Create stream (admin)
- `POST /api/streams/:id/regenerate-key` - Regenerate key

### Chat
- `GET /api/chat/session/:id` - Get messages
- `POST /api/chat/session/:id` - Send message
- `PATCH /api/chat/:id/pin` - Pin message

### Polls
- `GET /api/polls/session/:id` - Get polls
- `POST /api/polls` - Create poll
- `POST /api/polls/:id/vote` - Vote

### Questions
- `GET /api/questions/session/:id` - Get questions
- `POST /api/questions/session/:id` - Submit question
- `POST /api/questions/:id/upvote` - Upvote

## WebSocket Events

Connect to `/ws` with authentication token.

### Client Events
- `event:join` - Join event room
- `session:join` - Join session room
- `chat:send` - Send chat message
- `poll:vote` - Vote on poll
- `question:upvote` - Upvote question

### Server Events
- `chat:message` - New chat message
- `poll:new` - New poll created
- `poll:vote` - Poll vote update
- `question:new` - New question
- `viewers:count` - Viewer count update

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Required |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `PORT` | API port | `3000` |
| `RTMP_HOST` | RTMP server hostname | `localhost` |
| `HLS_HOST` | HLS server hostname | `localhost:8080` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` |
| `INTERNAL_API_KEY` | Key for nginx callbacks | Required |

## Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 1935 | TCP | RTMP ingest |
| 8080 | TCP | HTTP (HLS, API, WebSocket) |
| 3000 | TCP | API direct access (optional) |

## Scaling Considerations

For high-traffic deployments:

1. **Separate transcoding** - Run FFmpeg on dedicated servers
2. **CDN integration** - Use CloudFlare or AWS CloudFront for HLS delivery
3. **Database scaling** - Use managed PostgreSQL (RDS, Supabase)
4. **Redis cluster** - For high-volume real-time features
5. **Load balancing** - Multiple API instances behind a load balancer

## License

MIT License
