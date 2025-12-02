const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get questions for a session
router.get('/session/:sessionId', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { answered, sortBy = 'upvotes' } = req.query;

    const where = {
      sessionId,
      isHidden: false
    };

    if (answered === 'true') {
      where.isAnswered = true;
    } else if (answered === 'false') {
      where.isAnswered = false;
    }

    const orderBy = sortBy === 'recent' 
      ? { createdAt: 'desc' }
      : { upvotes: 'desc' };

    const questions = await prisma.question.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            company: true
          }
        }
      },
      orderBy
    });

    res.json({ questions });
  } catch (error) {
    next(error);
  }
});

// Submit question
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
      where: { id: sessionId }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const question = await prisma.question.create({
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
            company: true
          }
        }
      }
    });

    // Emit new question via WebSocket
    const io = req.app.get('io');
    io.to(`session:${sessionId}`).emit('question:new', {
      id: question.id,
      userId: question.user.id,
      userName: question.user.name,
      userAvatar: question.user.avatar,
      userCompany: question.user.company,
      text: question.text,
      upvotes: 0,
      isAnswered: false,
      timestamp: question.createdAt.getTime()
    });

    logger.info(`Question submitted: ${question.id}`);

    res.status(201).json({ question });
  } catch (error) {
    next(error);
  }
});

// Upvote question
router.post('/:id/upvote', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Use a transaction to safely increment
    const question = await prisma.$transaction(async (tx) => {
      const q = await tx.question.findUnique({ where: { id } });
      if (!q) throw new Error('Question not found');

      return tx.question.update({
        where: { id },
        data: { upvotes: { increment: 1 } }
      });
    });

    // Emit upvote via WebSocket
    const io = req.app.get('io');
    io.to(`session:${question.sessionId}`).emit('question:upvote', {
      questionId: id,
      upvotes: question.upvotes
    });

    res.json({ upvotes: question.upvotes });
  } catch (error) {
    if (error.message === 'Question not found') {
      return res.status(404).json({ error: 'Question not found' });
    }
    next(error);
  }
});

// Mark question as answered
router.patch('/:id/answer', authenticate, authorize('ADMIN', 'MODERATOR', 'SPEAKER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isAnswered } = req.body;

    const question = await prisma.question.update({
      where: { id },
      data: {
        isAnswered: isAnswered !== false,
        answeredAt: isAnswered !== false ? new Date() : null
      }
    });

    // Emit answer status via WebSocket
    const io = req.app.get('io');
    io.to(`session:${question.sessionId}`).emit('question:answered', {
      questionId: id,
      isAnswered: question.isAnswered
    });

    logger.info(`Question ${isAnswered ? 'answered' : 'unmarked'}: ${id}`);

    res.json({ question });
  } catch (error) {
    next(error);
  }
});

// Hide question (moderator+)
router.patch('/:id/hide', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isHidden } = req.body;

    const question = await prisma.question.update({
      where: { id },
      data: { isHidden: isHidden !== false }
    });

    // Emit hide status via WebSocket
    const io = req.app.get('io');
    io.to(`session:${question.sessionId}`).emit('question:hidden', {
      questionId: id,
      isHidden: question.isHidden
    });

    logger.info(`Question ${isHidden ? 'hidden' : 'unhidden'}: ${id}`);

    res.json({ question });
  } catch (error) {
    next(error);
  }
});

// Delete question (own or moderator+)
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check permission
    if (question.userId !== req.user.id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.question.delete({ where: { id } });

    // Emit delete via WebSocket
    const io = req.app.get('io');
    io.to(`session:${question.sessionId}`).emit('question:deleted', {
      questionId: id
    });

    logger.info(`Question deleted: ${id}`);

    res.json({ message: 'Question deleted' });
  } catch (error) {
    next(error);
  }
});

// Get top questions (for display)
router.get('/session/:sessionId/top', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { limit = 5 } = req.query;

    const questions = await prisma.question.findMany({
      where: {
        sessionId,
        isHidden: false,
        isAnswered: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: { upvotes: 'desc' },
      take: parseInt(limit)
    });

    res.json({ questions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
