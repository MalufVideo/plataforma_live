const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { JWT_SECRET } = require('../middleware/auth');

const prisma = new PrismaClient();

// Track connected users
const connectedUsers = new Map();

const initializeSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      
      const session = await prisma.userSession.findFirst({
        where: { 
          token,
          expiresAt: { gt: new Date() }
        },
        include: { user: true }
      });

      if (!session) {
        return next(new Error('Invalid or expired token'));
      }

      socket.user = session.user;
      next();
    } catch (error) {
      logger.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    logger.info(`User connected: ${socket.user.name} (${socket.id})`);

    // Track connected user
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);

    // Update user status
    prisma.user.update({
      where: { id: userId },
      data: { status: 'ONLINE' }
    }).catch(err => logger.error('Failed to update user status:', err));

    // Join event room
    socket.on('event:join', async (eventId) => {
      socket.join(`event:${eventId}`);
      logger.info(`${socket.user.name} joined event: ${eventId}`);

      // Notify others
      socket.to(`event:${eventId}`).emit('user:joined', {
        userId: socket.user.id,
        userName: socket.user.name,
        userAvatar: socket.user.avatar,
        role: socket.user.role
      });

      // Send current viewer count
      const room = io.sockets.adapter.rooms.get(`event:${eventId}`);
      io.to(`event:${eventId}`).emit('viewers:count', {
        count: room ? room.size : 0
      });
    });

    // Leave event room
    socket.on('event:leave', (eventId) => {
      socket.leave(`event:${eventId}`);
      logger.info(`${socket.user.name} left event: ${eventId}`);

      socket.to(`event:${eventId}`).emit('user:left', {
        userId: socket.user.id,
        userName: socket.user.name
      });

      // Update viewer count
      const room = io.sockets.adapter.rooms.get(`event:${eventId}`);
      io.to(`event:${eventId}`).emit('viewers:count', {
        count: room ? room.size : 0
      });
    });

    // Join session room (for chat, Q&A, polls)
    socket.on('session:join', (sessionId) => {
      socket.join(`session:${sessionId}`);
      logger.info(`${socket.user.name} joined session: ${sessionId}`);
    });

    // Leave session room
    socket.on('session:leave', (sessionId) => {
      socket.leave(`session:${sessionId}`);
    });

    // Real-time chat message (alternative to REST API)
    socket.on('chat:send', async (data) => {
      try {
        const { sessionId, text } = data;

        if (!text || text.trim().length === 0) return;
        if (text.length > 500) return;

        const message = await prisma.message.create({
          data: {
            sessionId,
            userId: socket.user.id,
            text: text.trim()
          }
        });

        io.to(`session:${sessionId}`).emit('chat:message', {
          id: message.id,
          userId: socket.user.id,
          userName: socket.user.name,
          userRole: socket.user.role,
          userAvatar: socket.user.avatar,
          text: message.text,
          timestamp: message.createdAt.getTime(),
          isPinned: false
        });
      } catch (error) {
        logger.error('Chat send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('chat:typing', (sessionId) => {
      socket.to(`session:${sessionId}`).emit('chat:typing', {
        userId: socket.user.id,
        userName: socket.user.name
      });
    });

    // Question upvote
    socket.on('question:upvote', async (questionId) => {
      try {
        const question = await prisma.question.update({
          where: { id: questionId },
          data: { upvotes: { increment: 1 } }
        });

        io.to(`session:${question.sessionId}`).emit('question:upvote', {
          questionId,
          upvotes: question.upvotes
        });
      } catch (error) {
        logger.error('Question upvote error:', error);
      }
    });

    // Poll vote
    socket.on('poll:vote', async (data) => {
      try {
        const { pollId, optionId } = data;

        // Check if already voted
        const existingVote = await prisma.pollVote.findUnique({
          where: {
            pollId_userId: { pollId, userId: socket.user.id }
          }
        });

        if (existingVote) {
          socket.emit('error', { message: 'Already voted' });
          return;
        }

        // Create vote
        await prisma.pollVote.create({
          data: {
            pollId,
            optionId,
            userId: socket.user.id
          }
        });

        // Get updated counts
        const poll = await prisma.poll.findUnique({
          where: { id: pollId },
          include: {
            options: {
              include: { _count: { select: { votes: true } } }
            },
            _count: { select: { votes: true } }
          }
        });

        io.to(`session:${poll.sessionId}`).emit('poll:vote', {
          pollId,
          totalVotes: poll._count.votes,
          options: poll.options.map(o => ({
            id: o.id,
            votes: o._count.votes
          }))
        });
      } catch (error) {
        logger.error('Poll vote error:', error);
        socket.emit('error', { message: 'Failed to vote' });
      }
    });

    // User status update
    socket.on('status:update', async (status) => {
      if (!['ONLINE', 'AWAY'].includes(status)) return;

      await prisma.user.update({
        where: { id: socket.user.id },
        data: { status }
      });

      // Broadcast to all rooms user is in
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.to(room).emit('user:status', {
            userId: socket.user.id,
            status
          });
        }
      });
    });

    // Watch time tracking
    let watchTimeInterval;
    socket.on('stream:watching', (streamId) => {
      // Clear any existing interval
      if (watchTimeInterval) clearInterval(watchTimeInterval);

      // Track watch time every 30 seconds
      watchTimeInterval = setInterval(async () => {
        try {
          // Find the event for this stream
          const stream = await prisma.stream.findUnique({
            where: { id: streamId },
            select: { eventId: true }
          });

          if (stream) {
            await prisma.eventUser.updateMany({
              where: {
                eventId: stream.eventId,
                userId: socket.user.id
              },
              data: {
                watchTime: { increment: 30 }
              }
            });
          }
        } catch (error) {
          logger.error('Watch time tracking error:', error);
        }
      }, 30000);
    });

    socket.on('stream:stopped', () => {
      if (watchTimeInterval) {
        clearInterval(watchTimeInterval);
        watchTimeInterval = null;
      }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${socket.user.name} (${socket.id})`);

      // Clear watch time interval
      if (watchTimeInterval) {
        clearInterval(watchTimeInterval);
      }

      // Remove from connected users
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
          
          // Update user status to offline
          await prisma.user.update({
            where: { id: userId },
            data: { status: 'OFFLINE' }
          }).catch(err => logger.error('Failed to update user status:', err));
        }
      }

      // Notify rooms about user leaving
      socket.rooms.forEach(room => {
        if (room !== socket.id && room.startsWith('event:')) {
          const eventId = room.replace('event:', '');
          io.to(room).emit('user:left', {
            userId: socket.user.id,
            userName: socket.user.name
          });

          // Update viewer count
          const roomObj = io.sockets.adapter.rooms.get(room);
          io.to(room).emit('viewers:count', {
            count: roomObj ? roomObj.size : 0
          });
        }
      });
    });
  });

  // Periodic viewer count broadcast
  setInterval(() => {
    io.sockets.adapter.rooms.forEach((sockets, room) => {
      if (room.startsWith('event:')) {
        io.to(room).emit('viewers:count', { count: sockets.size });
      }
    });
  }, 10000);

  logger.info('Socket.IO initialized');
};

module.exports = { initializeSocket, connectedUsers };
