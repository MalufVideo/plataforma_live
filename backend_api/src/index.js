import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
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

// Import WebSocket handlers
import { setupSocketHandlers } from './websocket/handlers.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
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

// WebSocket Setup
setupSocketHandlers(io);

// Start Server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
