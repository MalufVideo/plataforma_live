const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const prisma = new PrismaClient();

// Get event analytics
router.get('/event/:eventId', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const [
      event,
      totalAttendees,
      onlineAttendees,
      totalMessages,
      totalQuestions,
      totalPollVotes,
      streams
    ] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        include: {
          sessions: {
            include: {
              _count: {
                select: { messages: true, questions: true, polls: true }
              }
            }
          }
        }
      }),
      prisma.eventUser.count({ where: { eventId } }),
      prisma.eventUser.count({ where: { eventId, leftAt: null } }),
      prisma.message.count({
        where: { session: { eventId } }
      }),
      prisma.question.count({
        where: { session: { eventId } }
      }),
      prisma.pollVote.count({
        where: { poll: { session: { eventId } } }
      }),
      prisma.stream.findMany({
        where: { eventId },
        select: {
          id: true,
          name: true,
          status: true,
          peakViewers: true,
          totalViews: true,
          startedAt: true,
          endedAt: true
        }
      })
    ]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Calculate average watch time
    const watchTimeData = await prisma.eventUser.aggregate({
      where: { eventId },
      _avg: { watchTime: true },
      _sum: { watchTime: true }
    });

    // Calculate engagement score
    const engagementData = await prisma.eventUser.aggregate({
      where: { eventId },
      _avg: { engagementScore: true }
    });

    res.json({
      event: {
        id: event.id,
        title: event.title,
        status: event.status,
        startTime: event.startTime,
        endTime: event.endTime
      },
      attendance: {
        total: totalAttendees,
        online: onlineAttendees,
        peak: Math.max(...streams.map(s => s.peakViewers), 0)
      },
      engagement: {
        messages: totalMessages,
        questions: totalQuestions,
        pollVotes: totalPollVotes,
        averageScore: Math.round(engagementData._avg?.engagementScore || 0)
      },
      watchTime: {
        average: Math.round((watchTimeData._avg?.watchTime || 0) / 60), // in minutes
        total: Math.round((watchTimeData._sum?.watchTime || 0) / 60)
      },
      sessions: event.sessions.map(s => ({
        id: s.id,
        title: s.title,
        messages: s._count.messages,
        questions: s._count.questions,
        polls: s._count.polls
      })),
      streams
    });
  } catch (error) {
    next(error);
  }
});

// Get stream analytics
router.get('/stream/:streamId', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { streamId } = req.params;
    const { period = '1h' } = req.query;

    // Calculate time range
    const now = new Date();
    let startTime;
    switch (period) {
      case '15m':
        startTime = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
    }

    const [stream, viewerData] = await Promise.all([
      prisma.stream.findUnique({
        where: { id: streamId },
        select: {
          id: true,
          name: true,
          status: true,
          peakViewers: true,
          totalViews: true,
          startedAt: true,
          endedAt: true
        }
      }),
      prisma.viewerAnalytics.findMany({
        where: {
          streamId,
          timestamp: { gte: startTime }
        },
        orderBy: { timestamp: 'asc' }
      })
    ]);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    res.json({
      stream,
      viewerHistory: viewerData.map(v => ({
        timestamp: v.timestamp,
        viewers: v.viewerCount,
        bandwidth: v.bandwidth ? Number(v.bandwidth) : null
      })),
      currentViewers: viewerData.length > 0 
        ? viewerData[viewerData.length - 1].viewerCount 
        : 0
    });
  } catch (error) {
    next(error);
  }
});

// Get user engagement analytics
router.get('/users/:eventId', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50, sortBy = 'engagementScore' } = req.query;
    const skip = (page - 1) * limit;

    const orderBy = {};
    orderBy[sortBy] = 'desc';

    const [users, total] = await Promise.all([
      prisma.eventUser.findMany({
        where: { eventId },
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true
            }
          }
        },
        orderBy
      }),
      prisma.eventUser.count({ where: { eventId } })
    ]);

    // Get activity counts for each user
    const usersWithActivity = await Promise.all(
      users.map(async (eu) => {
        const [messages, questions, pollVotes] = await Promise.all([
          prisma.message.count({
            where: { userId: eu.userId, session: { eventId } }
          }),
          prisma.question.count({
            where: { userId: eu.userId, session: { eventId } }
          }),
          prisma.pollVote.count({
            where: { userId: eu.userId, poll: { session: { eventId } } }
          })
        ]);

        return {
          ...eu.user,
          joinedAt: eu.joinedAt,
          leftAt: eu.leftAt,
          watchTime: Math.round(eu.watchTime / 60), // in minutes
          engagementScore: eu.engagementScore,
          activity: { messages, questions, pollVotes }
        };
      })
    );

    res.json({
      users: usersWithActivity,
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

// Record viewer count (called periodically by the system)
router.post('/viewers', async (req, res, next) => {
  try {
    const { streamId, viewerCount, bandwidth } = req.body;

    // Validate internal request (should come from nginx stats or internal service)
    const internalKey = req.headers['x-internal-key'];
    if (internalKey !== process.env.INTERNAL_API_KEY) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.viewerAnalytics.create({
      data: {
        streamId,
        viewerCount,
        bandwidth: bandwidth ? BigInt(bandwidth) : null
      }
    });

    // Update peak viewers if needed
    await prisma.stream.update({
      where: { id: streamId },
      data: {
        peakViewers: {
          set: prisma.raw(`GREATEST("peakViewers", ${viewerCount})`)
        },
        totalViews: { increment: 1 }
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get dashboard summary
router.get('/dashboard', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersThisWeek,
      totalEvents,
      liveEvents,
      upcomingEvents,
      activeStreams
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: thisWeek } } }),
      prisma.event.count(),
      prisma.event.count({ where: { status: 'LIVE' } }),
      prisma.event.count({ where: { status: 'SCHEDULED', startTime: { gte: now } } }),
      prisma.stream.count({ where: { status: 'LIVE' } })
    ]);

    res.json({
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek
      },
      events: {
        total: totalEvents,
        live: liveEvents,
        upcoming: upcomingEvents
      },
      streams: {
        active: activeStreams
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
