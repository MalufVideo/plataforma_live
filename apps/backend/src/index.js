import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import projectRoutes from './routes/projects.js';
import eventRoutes from './routes/events.js';
import sessionRoutes from './routes/sessions.js';
import streamRoutes from './routes/streams.js';
import messageRoutes from './routes/messages.js';
import questionRoutes from './routes/questions.js';
import pollRoutes from './routes/polls.js';
import roomRoutes from './routes/rooms.js';
import surveyRoutes from './routes/surveys.js';
import rtmpRoutes from './routes/rtmp.js';
import transcodingRoutes from './routes/transcoding.js';

// Import WebSocket handlers
import { setupSocketHandlers } from './websocket/handlers.js';

// Import RTMP Server
import { startRtmpServer } from './services/rtmpServer.js';

dotenv.config();

// Allowed CORS origins
const ALLOWED_ORIGINS = [
    'https://www.livevideo.com.br',
    'https://livevideo.com.br',
    'https://plataforma-live-frontend.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
];

const corsOptions = {
    origin: (origin, callback) => {
        // Normalize origin by removing trailing slash
        const normalizedOrigin = origin ? origin.replace(/\/$/, '') : null;
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!normalizedOrigin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(normalizedOrigin)) {
            callback(null, true);
        } else {
            console.log('[CORS] Blocked origin:', origin);
            callback(null, true); // Allow anyway for now, log for debugging
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
};


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: corsOptions
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/rtmp', rtmpRoutes);
app.use('/api/transcoding', transcodingRoutes);

// FLV Proxy - streams from /flv/* to internal Node Media Server
const FLV_INTERNAL_PORT = 8002;
const proxyHandler = (req, res) => {
    const options = {
        hostname: 'localhost',
        port: FLV_INTERNAL_PORT,
        path: req.baseUrl === '/live' ? `/live${req.url}` : req.url, // Ensure path is correct for NMS
        method: req.method,
        headers: {
            ...req.headers,
            host: `localhost:${FLV_INTERNAL_PORT}`
        }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        // Copy headers from NMS response
        Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
        });
        res.writeHead(proxyRes.statusCode);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error('[FLV Proxy] Error:', err.message);
        if (!res.headersSent) {
            res.status(502).json({ error: 'Stream unavailable' });
        }
    });

    req.pipe(proxyReq);
};

app.use('/flv', proxyHandler);
app.use('/live', proxyHandler);


// WebSocket Setup
setupSocketHandlers(io);

// Start RTMP Server (passing io for WebSocket notifications)
startRtmpServer(io);

// Start Server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
