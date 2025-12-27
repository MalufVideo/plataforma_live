export const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join a specific session room
        socket.on('join_session', ({ sessionId }) => {
            socket.join(`session:${sessionId}`);
            console.log(`Socket ${socket.id} joined session ${sessionId}`);

            // Update viewer count (simplified simulation)
            const roomSize = io.sockets.adapter.rooms.get(`session:${sessionId}`)?.size || 0;
            io.to(`session:${sessionId}`).emit('viewer_count', { count: roomSize });
        });

        socket.on('leave_session', ({ sessionId }) => {
            socket.leave(`session:${sessionId}`);
            const roomSize = io.sockets.adapter.rooms.get(`session:${sessionId}`)?.size || 0;
            io.to(`session:${sessionId}`).emit('viewer_count', { count: roomSize });
        });

        // Chat
        socket.on('send_message', (message) => {
            // In a real app, you'd save to DB here or via API before emitting
            // For now, we assume the API handles saving and broadcasting via Supabase Realtime
            // But if we want pure socket broadcasting:
            io.to(`session:${message.sessionId}`).emit('new_message', message);
        });

        // Real-time Engagement Events (triggered by API calls usually)
        // These listeners are for client-side events if not using REST API

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};
