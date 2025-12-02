const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get polls for a session
router.get('/session/:sessionId', authenticate, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { active } = req.query;

    const where = { sessionId };
    if (active === 'true') {
      where.isActive = true;
    }

    const polls = await prisma.poll.findMany({
      where,
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          },
          orderBy: { order: 'asc' }
        },
        _count: { select: { votes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check if user has voted on each poll
    const pollsWithVoteStatus = await Promise.all(
      polls.map(async (poll) => {
        const userVote = await prisma.pollVote.findUnique({
          where: {
            pollId_userId: { pollId: poll.id, userId: req.user.id }
          }
        });

        return {
          ...poll,
          hasVoted: !!userVote,
          userVoteOptionId: userVote?.optionId,
          options: poll.options.map(opt => ({
            id: opt.id,
            text: opt.text,
            votes: poll.showResults || !poll.isActive ? opt._count.votes : undefined
          })),
          totalVotes: poll._count.votes
        };
      })
    );

    res.json({ polls: pollsWithVoteStatus });
  } catch (error) {
    next(error);
  }
});

// Get single poll
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            _count: { select: { votes: true } }
          },
          orderBy: { order: 'asc' }
        },
        _count: { select: { votes: true } }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const userVote = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: { pollId: id, userId: req.user.id }
      }
    });

    res.json({
      poll: {
        ...poll,
        hasVoted: !!userVote,
        userVoteOptionId: userVote?.optionId,
        options: poll.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          votes: poll.showResults || !poll.isActive ? opt._count.votes : undefined
        })),
        totalVotes: poll._count.votes
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create poll
router.post('/', authenticate, authorize('ADMIN', 'MODERATOR'), [
  body('sessionId').notEmpty(),
  body('question').trim().notEmpty(),
  body('options').isArray({ min: 2, max: 10 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, question, options, showResults } = req.body;

    const poll = await prisma.poll.create({
      data: {
        sessionId,
        question,
        showResults: showResults || false,
        options: {
          create: options.map((text, index) => ({
            text,
            order: index
          }))
        }
      },
      include: {
        options: { orderBy: { order: 'asc' } }
      }
    });

    // Emit new poll via WebSocket
    const io = req.app.get('io');
    io.to(`session:${sessionId}`).emit('poll:new', {
      id: poll.id,
      question: poll.question,
      options: poll.options.map(o => ({ id: o.id, text: o.text })),
      isActive: poll.isActive
    });

    logger.info(`Poll created: ${poll.question}`);

    res.status(201).json({ poll });
  } catch (error) {
    next(error);
  }
});

// Vote on poll
router.post('/:id/vote', authenticate, [
  body('optionId').notEmpty()
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { optionId } = req.body;

    // Check if poll exists and is active
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: { options: true }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (!poll.isActive) {
      return res.status(400).json({ error: 'Poll is closed' });
    }

    // Check if option belongs to poll
    const option = poll.options.find(o => o.id === optionId);
    if (!option) {
      return res.status(400).json({ error: 'Invalid option' });
    }

    // Check if user already voted
    const existingVote = await prisma.pollVote.findUnique({
      where: {
        pollId_userId: { pollId: id, userId: req.user.id }
      }
    });

    if (existingVote) {
      return res.status(400).json({ error: 'Already voted' });
    }

    // Create vote
    await prisma.pollVote.create({
      data: {
        pollId: id,
        optionId,
        userId: req.user.id
      }
    });

    // Get updated vote counts
    const updatedPoll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
          orderBy: { order: 'asc' }
        },
        _count: { select: { votes: true } }
      }
    });

    // Emit vote update via WebSocket
    const io = req.app.get('io');
    io.to(`session:${poll.sessionId}`).emit('poll:vote', {
      pollId: id,
      totalVotes: updatedPoll._count.votes,
      options: updatedPoll.options.map(o => ({
        id: o.id,
        votes: o._count.votes
      }))
    });

    res.json({
      message: 'Vote recorded',
      totalVotes: updatedPoll._count.votes
    });
  } catch (error) {
    next(error);
  }
});

// Close poll
router.patch('/:id/close', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const poll = await prisma.poll.update({
      where: { id },
      data: {
        isActive: false,
        showResults: true,
        closedAt: new Date()
      },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
          orderBy: { order: 'asc' }
        },
        _count: { select: { votes: true } }
      }
    });

    // Emit poll closed via WebSocket
    const io = req.app.get('io');
    io.to(`session:${poll.sessionId}`).emit('poll:closed', {
      pollId: id,
      results: poll.options.map(o => ({
        id: o.id,
        text: o.text,
        votes: o._count.votes
      })),
      totalVotes: poll._count.votes
    });

    logger.info(`Poll closed: ${poll.question}`);

    res.json({ poll });
  } catch (error) {
    next(error);
  }
});

// Toggle results visibility
router.patch('/:id/results', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { showResults } = req.body;

    const poll = await prisma.poll.update({
      where: { id },
      data: { showResults }
    });

    // Emit visibility change via WebSocket
    const io = req.app.get('io');
    io.to(`session:${poll.sessionId}`).emit('poll:results-visibility', {
      pollId: id,
      showResults
    });

    res.json({ poll });
  } catch (error) {
    next(error);
  }
});

// Delete poll
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const poll = await prisma.poll.delete({
      where: { id }
    });

    // Emit poll deleted via WebSocket
    const io = req.app.get('io');
    io.to(`session:${poll.sessionId}`).emit('poll:deleted', { pollId: id });

    logger.info(`Poll deleted: ${id}`);

    res.json({ message: 'Poll deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
