const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get messages for a session
router.get('/session/:sessionId', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50, before, after } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      sessionId,
      isDeleted: false
    };

    // Pagination by timestamp
    if (before) {
      where.createdAt = { lt: new Date(parseInt(before)) };
    }
    if (after) {
      where.createdAt = { gt: new Date(parseInt(after)) };
    }

    const messages = await prisma.message.findMany({
      where,
      skip: before || after ? 0 : skip,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: after ? 'asc' : 'desc' }
    });

    // Reverse if fetching older messages
    if (!after) {
      messages.reverse();
    }

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

// Send message
router.post('/session/:sessionId', authenticate, [
  body('text').trim().notEmpty().isLength({ max: 500 })
], async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;

    // Check if session exists
    const session = await prisma.eventSession.findUnique({
      where: { id: sessionId },
      include: { event: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const message = await prisma.message.create({
      data: {
        sessionId,
        userId: req.user.id,
        text
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      }
    });

    // Emit message via WebSocket
    const io = req.app.get('io');
    io.to(`session:${sessionId}`).emit('chat:message', {
      id: message.id,
      userId: message.user.id,
      userName: message.user.name,
      userRole: message.user.role,
      userAvatar: message.user.avatar,
      text: message.text,
      timestamp: message.createdAt.getTime(),
      isPinned: message.isPinned
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

// Pin/unpin message (moderator+)
router.patch('/:id/pin', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;

    const message = await prisma.message.update({
      where: { id },
      data: { isPinned },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    // Emit pin event via WebSocket
    const io = req.app.get('io');
    io.to(`session:${message.sessionId}`).emit('chat:pin', {
      messageId: id,
      isPinned,
      pinnedBy: req.user.name
    });

    logger.info(`Message ${isPinned ? 'pinned' : 'unpinned'}: ${id}`);

    res.json({ message });
  } catch (error) {
    next(error);
  }
});

// Delete message (moderator+ or own message)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await prisma.message.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check permission
    if (message.userId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Soft delete
    await prisma.message.update({
      where: { id },
      data: { isDeleted: true }
    });

    // Emit delete event via WebSocket
    const io = req.app.get('io');
    io.to(`session:${message.sessionId}`).emit('chat:delete', {
      messageId: id,
      deletedBy: req.user.name
    });

    logger.info(`Message deleted: ${id}`);

    res.json({ message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
});

// Get pinned messages for a session
router.get('/session/:sessionId/pinned', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        sessionId,
        isPinned: true,
        isDeleted: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

// Clear all messages in a session (admin only)
router.delete('/session/:sessionId/clear', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    await prisma.message.updateMany({
      where: { sessionId },
      data: { isDeleted: true }
    });

    // Emit clear event via WebSocket
    const io = req.app.get('io');
    io.to(`session:${sessionId}`).emit('chat:clear', {
      clearedBy: req.user.name
    });

    logger.info(`Chat cleared for session: ${sessionId}`);

    res.json({ message: 'Chat cleared' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
