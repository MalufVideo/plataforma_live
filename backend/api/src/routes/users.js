const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all users (admin only)
router.get('/', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          company: true,
          title: true,
          status: true,
          createdAt: true,
          lastLoginAt: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Users can only view their own profile unless admin
    if (req.user.id !== id && !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        company: true,
        title: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            messages: true,
            questions: true,
            pollVotes: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/:id', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('company').optional().trim(),
  body('title').optional().trim(),
  body('avatar').optional().isURL()
], async (req, res, next) => {
  try {
    const { id } = req.params;

    // Users can only update their own profile unless admin
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, company, title, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(company !== undefined && { company }),
        ...(title !== undefined && { title }),
        ...(avatar && { avatar })
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        company: true,
        title: true,
        status: true
      }
    });

    logger.info(`User updated: ${user.email}`);

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user role (admin only)
router.patch('/:id/role', authenticate, authorize('ADMIN'), [
  body('role').isIn(['ATTENDEE', 'SPEAKER', 'MODERATOR', 'ADMIN'])
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    logger.info(`User role updated: ${user.email} -> ${role}`);

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await prisma.user.delete({
      where: { id }
    });

    logger.info(`User deleted: ${user.email}`);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get user activity/engagement for an event
router.get('/:id/activity/:eventId', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { id, eventId } = req.params;

    const [eventUser, messages, questions, pollVotes] = await Promise.all([
      prisma.eventUser.findUnique({
        where: {
          eventId_userId: { eventId, userId: id }
        }
      }),
      prisma.message.count({
        where: {
          userId: id,
          session: { eventId }
        }
      }),
      prisma.question.count({
        where: {
          userId: id,
          session: { eventId }
        }
      }),
      prisma.pollVote.count({
        where: {
          userId: id,
          poll: { session: { eventId } }
        }
      })
    ]);

    res.json({
      userId: id,
      eventId,
      joinedAt: eventUser?.joinedAt,
      leftAt: eventUser?.leftAt,
      watchTime: eventUser?.watchTime || 0,
      engagementScore: eventUser?.engagementScore || 0,
      stats: {
        messages,
        questions,
        pollVotes
      }
    });
  } catch (error) {
    next(error);
  }
});

// Bulk create users (admin only)
router.post('/bulk', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Users array is required' });
    }

    const results = {
      created: [],
      failed: []
    };

    for (const userData of users) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password || 'changeme123', 12);
        
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role || 'ATTENDEE',
            company: userData.company,
            title: userData.title
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        });
        
        results.created.push(user);
      } catch (error) {
        results.failed.push({
          email: userData.email,
          error: error.message
        });
      }
    }

    logger.info(`Bulk user creation: ${results.created.length} created, ${results.failed.length} failed`);

    res.json(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
