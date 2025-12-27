# RTMP Server Configuration Guide

## ✅ What Was Fixed

### 1. **Stream Key Validation** (Critical Fix)
- **Before**: Validated against `rtmp_ingest_configs` table (wrong table)
- **After**: Now validates against `projects` table using `rtmp_stream_key` field
- **Impact**: Stream keys generated in frontend will now work correctly

### 2. **Project Status Updates**
- When stream starts: Updates project `status` to `LIVE` and sets `started_at` timestamp
- When stream ends: Updates project `status` to `ENDED` and sets `ended_at` timestamp
- Real-time WebSocket notifications sent to all connected clients

### 3. **Docker Configuration**
- **Node.js**: Upgraded from v18 to v20 (fixes Supabase warnings)
- **ffmpeg**: Now installed in Docker container for video transcoding
- **Ports**: Properly exposed (3000, 1936, 8001)

### 4. **Frontend RTMP URL**
- Updated to: `rtmp://ingest.livevideo.com.br:1936/live`
- Matches actual backend port configuration

---

## 🔧 Coolify Environment Variables Required

In your Coolify backend app, configure these environment variables:

```bash
# Supabase Configuration
SUPABASE_URL=https://supabasekong-mo0gsg800wo4csgw4w04gggs.72.60.142.28.sslip.io
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NDYzNzMyMCwiZXhwIjo0OTIwMzEwOTIwLCJyb2xlIjoiYW5vbiJ9.CqUFsTjOYVzcSNZBWCrVBsMTlWDJz5RTU_s24lm604w
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Server Configuration
PORT=3000
CORS_ORIGIN=https://livevideo.com.br

# RTMP Server Configuration
RTMP_PORT=1936
RTMP_HTTP_PORT=8001

# Transcoding Configuration
FFMPEG_PATH=/usr/bin/ffmpeg
HLS_OUTPUT_DIR=/tmp/hls
```

---

## 🚢 Coolify Port Mappings

Configure these port mappings in Coolify:

| Container Port | Host Port | Protocol | Description |
|---------------|-----------|----------|-------------|
| 3000 | 8000 | TCP | API Server |
| 1936 | 1936 | TCP | RTMP Ingestion |
| 8001 | 8001 | TCP | HLS/HTTP-FLV Playback |

---

## 🧪 How to Test RTMP Streaming

### 1. **Create a Project in Frontend**
- Login as ADMIN at `https://livevideo.com.br` (or Vercel URL)
- Go to Projects tab
- Click "New Project"
- Create a project and note the auto-generated stream key

### 2. **Get Stream Credentials**
- Click the 🔑 key icon on your project card
- Copy the **RTMP URL**: `rtmp://ingest.livevideo.com.br:1936/live`
- Copy the **Stream Key**: (unique 32-character key)

### 3. **Configure OBS Studio**
1. Open OBS Studio
2. Go to **Settings** → **Stream**
3. Select **Custom** as Service
4. **Server**: `rtmp://ingest.livevideo.com.br:1936/live`
5. **Stream Key**: `<paste your project's stream key>`
6. Click **OK**

### 4. **Start Streaming**
1. Click **Start Streaming** in OBS
2. Backend will validate your stream key
3. Project status updates to **LIVE** in database
4. WebSocket notification sent to all clients

### 5. **Expected Backend Logs**
```
[RTMP] Pre-publish: id=xyz, StreamPath=/live/YOUR_STREAM_KEY
[RTMP] Stream authorized for project: abc123-project-id
[RTMP] Stream started: id=xyz, StreamPath=/live/YOUR_STREAM_KEY
[RTMP] Project stream status updated to LIVE for key YOUR_STREAM_KEY
[RTMP] Notified clients: project abc123-project-id is LIVE
```

### 6. **Stop Streaming**
- Click **Stop Streaming** in OBS
- Project status updates to **ENDED**
- `ended_at` timestamp recorded

---

## 🔐 Security Features

### Stream Key Validation
- ✅ Every incoming RTMP stream must provide valid stream key
- ✅ Stream key validated against `projects` table in real-time
- ✅ Invalid streams are rejected before publishing
- ✅ Only project owner's stream key works for that project

### Database Updates
- ✅ Project status automatically syncs with stream state
- ✅ Timestamps recorded for analytics
- ✅ Real-time notifications via WebSocket

---

## 📊 Database Schema Reference

### Projects Table
```sql
projects (
  id UUID PRIMARY KEY,
  name TEXT,
  status TEXT CHECK (status IN ('DRAFT', 'LIVE', 'ENDED')),
  rtmp_stream_key TEXT UNIQUE,  -- Auto-generated 32-char key
  owner_id UUID,                 -- ADMIN who created project
  started_at TIMESTAMPTZ,        -- When stream started
  ended_at TIMESTAMPTZ,          -- When stream ended
  ...
)
```

---

## 🚀 Deployment Steps

1. **Commit Changes**
   ```bash
   cd D:\web\plataforma_live
   git add .
   git commit -m "feat: fix RTMP stream key validation and upgrade Node.js"
   git push
   ```

2. **Deploy Backend (Coolify)**
   - Go to Coolify dashboard
   - Navigate to your backend app
   - Configure environment variables (see above)
   - Configure port mappings (see above)
   - Click **Deploy/Rebuild**
   - Wait for deployment to complete

3. **Verify Deployment**
   - Check logs for: `[RTMP] Server started on rtmp://localhost:1936/live`
   - Should NOT see ffmpeg error anymore
   - All 3 ports should be listening

4. **Deploy Frontend (Vercel)**
   - Vercel should auto-deploy on git push
   - Or manually trigger deployment

5. **Test End-to-End**
   - Create project → Get stream key → Stream with OBS → Verify status updates

---

## 🐛 Troubleshooting

### Stream Key Rejected
- ✅ Verify stream key in database: `SELECT * FROM projects WHERE rtmp_stream_key = 'YOUR_KEY';`
- ✅ Check backend logs for validation errors
- ✅ Ensure project exists and belongs to authenticated user

### ffmpeg Error
- ✅ Rebuild Docker container with updated Dockerfile
- ✅ Verify inside container: `docker exec -it <container> ffmpeg -version`

### Port Not Accessible
- ✅ Check Coolify port mappings
- ✅ Verify firewall allows port 1936
- ✅ Test: `telnet ingest.livevideo.com.br 1936`

### Stream Connects but No Status Update
- ✅ Check Supabase permissions (RLS policies)
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` in environment variables
- ✅ Check backend logs for database errors

---

## 📞 Support

For issues, check:
1. Backend logs in Coolify
2. Frontend console in browser DevTools
3. Supabase logs/query inspector
4. OBS Studio logs

---

**Last Updated**: December 27, 2025
**Version**: 2.0
