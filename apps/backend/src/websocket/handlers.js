import { supabase } from '../config/database.js';

// Validate JWT token from Supabase
async function validateToken(token) {
    if (!token) return null;

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return null;
        return user;
    } catch (err) {
        console.error('[WebSocket] Token validation error:', err);
        return null;
    }
}

// Validate UUID format
function isValidUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export const setupSocketHandlers = (io) => {
    // Socket.io middleware for authentication
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (token) {
            const user = await validateToken(token);
            if (user) {
                socket.user = user;
                console.log(`[WebSocket] Authenticated user: ${user.id}`);
            }
        }

        // Allow connection but mark as unauthenticated if no valid token
        // Some features may still work for anonymous users (viewing)
        next();
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id, socket.user ? `(authenticated: ${socket.user.id})` : '(anonymous)');

        // Join a specific session room
        socket.on('join_session', ({ sessionId }) => {
            // Validate sessionId format to prevent injection
            if (!sessionId || !isValidUUID(sessionId)) {
                socket.emit('error', { message: 'Invalid session ID' });
                return;
            }

            socket.join(`session:${sessionId}`);
            console.log(`Socket ${socket.id} joined session ${sessionId}`);

            // Update viewer count (simplified simulation)
            const roomSize = io.sockets.adapter.rooms.get(`session:${sessionId}`)?.size || 0;
            io.to(`session:${sessionId}`).emit('viewer_count', { count: roomSize });
        });

        socket.on('leave_session', ({ sessionId }) => {
            if (!sessionId || !isValidUUID(sessionId)) return;

            socket.leave(`session:${sessionId}`);
            const roomSize = io.sockets.adapter.rooms.get(`session:${sessionId}`)?.size || 0;
            io.to(`session:${sessionId}`).emit('viewer_count', { count: roomSize });
        });

        // Chat - requires authentication
        socket.on('send_message', (message) => {
            // Require authentication for sending messages
            if (!socket.user) {
                socket.emit('error', { message: 'Authentication required to send messages' });
                return;
            }

            // Validate message data
            if (!message || !message.sessionId || !isValidUUID(message.sessionId)) {
                socket.emit('error', { message: 'Invalid message data' });
                return;
            }

            if (!message.text || typeof message.text !== 'string' || message.text.trim().length === 0) {
                socket.emit('error', { message: 'Message text is required' });
                return;
            }

            // Limit message length
            if (message.text.length > 2000) {
                socket.emit('error', { message: 'Message too long (max 2000 characters)' });
                return;
            }

            // Sanitize and broadcast
            const sanitizedMessage = {
                ...message,
                text: message.text.trim(),
                userId: socket.user.id,
                timestamp: Date.now()
            };

            io.to(`session:${message.sessionId}`).emit('new_message', sanitizedMessage);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
