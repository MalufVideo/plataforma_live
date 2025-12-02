const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get all events
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, upcoming } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    
    // Filter by status
    if (status) {
      where.status = status;
    }

    // Only show public events to non-authenticated users
    if (!req.user || !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      where.isPublic = true;
    }

    // Filter upcoming events
    if (upcoming === 'true') {
      where.startTime = { gte: new Date() };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          _count: {
            select: { users: true, streams: true, sessions: true }
          }
        },
        orderBy: { startTime: 'asc' }
      }),
      prisma.event.count({ where })
    ]);

    res.json({
      events,
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

// Get event by ID or slug
router.get('/:identifier', optionalAuth, async (req, res, next) => {
  try {
    const { identifier } = req.params;

    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier }
        ]
      },
      include: {
        sessions: {
          include: {
            stream: {
              select: {
                id: true,
                status: true,
                playbackUrl: true,
                hlsUrl: true
              }
            }
          },
          orderBy: { startTime: 'asc' }
        },
        _count: {
          select: { users: true }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check access for private events
    if (!event.isPublic && (!req.user || !['ADMIN', 'MODERATOR'].includes(req.user.role))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ event });
  } catch (error) {
    next(error);
  }
});

// Create event (admin only)
router.post('/', authenticate, authorize('ADMIN'), [
  body('title').trim().notEmpty(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      startTime,
      endTime,
      timezone,
      isPublic,
      requiresAuth,
      maxAttendees,
      primaryColor,
      logoUrl,
      thumbnail
    } = req.body;

    // Generate unique slug
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${nanoid(6)}`;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        slug,
        thumbnail,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        timezone: timezone || 'America/Sao_Paulo',
        isPublic: isPublic !== false,
        requiresAuth: requiresAuth !== false,
        maxAttendees,
        primaryColor,
        logoUrl,
        status: 'DRAFT'
      }
    });

    logger.info(`Event created: ${event.title} (${event.slug})`);

    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
});

// Update event
router.put('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;

    // Convert dates if provided
    if (updateData.startTime) {
      updateData.startTime = new Date(updateData.startTime);
    }
    if (updateData.endTime) {
      updateData.endTime = new Date(updateData.endTime);
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData
    });

    logger.info(`Event updated: ${event.title}`);

    res.json({ event });
  } catch (error) {
    next(error);
  }
});

// Update event status
router.patch('/:id/status', authenticate, authorize('ADMIN'), [
  body('status').isIn(['DRAFT', 'SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED'])
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: { status }
    });

    // Emit status change via WebSocket
    const io = req.app.get('io');
    io.to(`event:${id}`).emit('event:status', { eventId: id, status });

    logger.info(`Event status updated: ${event.title} -> ${status}`);

    res.json({ event });
  } catch (error) {
    next(error);
  }
});

// Delete event
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({ where: { id } });

    logger.info(`Event deleted: ${id}`);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Join event
router.post('/:id/join', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check max attendees
    if (event.maxAttendees && event._count.users >= event.maxAttendees) {
      return res.status(403).json({ error: 'Event is full' });
    }

    // Create or update event user
    const eventUser = await prisma.eventUser.upsert({
      where: {
        eventId_userId: { eventId: id, userId: req.user.id }
      },
      create: {
        eventId: id,
        userId: req.user.id,
        role: req.user.role
      },
      update: {
        leftAt: null
      }
    });

    // Emit join event via WebSocket
    const io = req.app.get('io');
    io.to(`event:${id}`).emit('user:joined', {
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role
    });

    logger.info(`User ${req.user.email} joined event ${event.title}`);

    res.json({ eventUser });
  } catch (error) {
    next(error);
  }
});

// Leave event
router.post('/:id/leave', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.eventUser.update({
      where: {
        eventId_userId: { eventId: id, userId: req.user.id }
      },
      data: { leftAt: new Date() }
    });

    // Emit leave event via WebSocket
    const io = req.app.get('io');
    io.to(`event:${id}`).emit('user:left', {
      userId: req.user.id,
      userName: req.user.name
    });

    res.json({ message: 'Left event successfully' });
  } catch (error) {
    next(error);
  }
});

// Get event attendees
router.get('/:id/attendees', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, online } = req.query;
    const skip = (page - 1) * limit;

    const where = { eventId: id };
    if (online === 'true') {
      where.leftAt = null;
    }

    const [attendees, total] = await Promise.all([
      prisma.eventUser.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              company: true,
              title: true,
              status: true
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.eventUser.count({ where })
    ]);

    res.json({
      attendees: attendees.map(a => ({
        ...a.user,
        role: a.role,
        joinedAt: a.joinedAt,
        watchTime: a.watchTime,
        engagementScore: a.engagementScore
      })),
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

// Create event session
router.post('/:id/sessions', authenticate, authorize('ADMIN'), [
  body('title').trim().notEmpty(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601()
], async (req, res, next) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, speaker, startTime, endTime } = req.body;

    const session = await prisma.eventSession.create({
      data: {
        eventId: id,
        title,
        description,
        speaker,
        startTime: new Date(startTime),
        endTime: new Date(endTime)
      }
    });

    logger.info(`Session created: ${session.title} for event ${id}`);

    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
