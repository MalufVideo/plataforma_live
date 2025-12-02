const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase } = require('../lib/supabase');
const { nanoid } = require('nanoid');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get all streams
router.get('/', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { eventId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('streams')
      .select(`
        *,
        events:event_id (id, title),
        event_sessions:session_id (id, title),
        profiles:created_by (id, name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (eventId) query = query.eq('event_id', eventId);
    if (status) query = query.eq('status', status);

    const { data: streams, count, error } = await query;

    if (error) throw error;

    res.json({
      streams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get stream by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: stream, error } = await supabase
      .from('streams')
      .select(`
        *,
        events:event_id (*),
        event_sessions:session_id (*),
        profiles:created_by (id, name)
      `)
      .eq('id', id)
      .single();

    if (error || !stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Hide stream key for non-admins
    if (!['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      delete stream.stream_key;
      delete stream.rtmp_url;
    }

    res.json({ stream });
  } catch (error) {
    next(error);
  }
});

// Create stream
router.post('/', authenticate, authorize('ADMIN', 'MODERATOR'), [
  body('eventId').notEmpty(),
  body('name').trim().notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, sessionId, name, source, qualities } = req.body;

    // Generate unique stream key
    const streamKey = `live_${nanoid(24)}`;
    
    // Build RTMP URL
    const rtmpHost = process.env.RTMP_HOST || 'localhost';
    const rtmpUrl = `rtmp://${rtmpHost}:1935/live/${streamKey}`;
    
    // Build HLS URL
    const hlsHost = process.env.HLS_HOST || 'localhost:8080';
    const hlsUrl = `http://${hlsHost}/hls/${streamKey}/master.m3u8`;

    const { data: stream, error } = await supabase
      .from('streams')
      .insert({
        event_id: eventId,
        session_id: sessionId,
        created_by: req.user.id,
        name,
        stream_key: streamKey,
        rtmp_url: rtmpUrl,
        hls_url: hlsUrl,
        playback_url: hlsUrl,
        source: source || 'RTMP',
        qualities: qualities || ['1080p', '720p', '480p', '360p'],
        status: 'IDLE'
      })
      .select()
      .single();

    if (error) throw error;

    logger.info(`Stream created: ${stream.name} (${stream.stream_key})`);

    res.status(201).json({ stream });
  } catch (error) {
    next(error);
  }
});

// Update stream
router.put('/:id', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, source, qualities, youtubeId } = req.body;

    const { data: stream, error } = await supabase
      .from('streams')
      .update({
        ...(name && { name }),
        ...(source && { source }),
        ...(qualities && { qualities }),
        ...(youtubeId && { youtube_id: youtubeId })
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info(`Stream updated: ${stream.name}`);

    res.json({ stream });
  } catch (error) {
    next(error);
  }
});

// Delete stream
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('streams')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logger.info(`Stream deleted: ${id}`);

    res.json({ message: 'Stream deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Regenerate stream key
router.post('/:id/regenerate-key', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const newStreamKey = `live_${nanoid(24)}`;
    const rtmpHost = process.env.RTMP_HOST || 'localhost';
    const hlsHost = process.env.HLS_HOST || 'localhost:8080';

    const { data: stream, error } = await supabase
      .from('streams')
      .update({
        stream_key: newStreamKey,
        rtmp_url: `rtmp://${rtmpHost}:1935/live/${newStreamKey}`,
        hls_url: `http://${hlsHost}/hls/${newStreamKey}/master.m3u8`,
        playback_url: `http://${hlsHost}/hls/${newStreamKey}/master.m3u8`
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info(`Stream key regenerated: ${stream.name}`);

    res.json({ stream });
  } catch (error) {
    next(error);
  }
});

// Start/stop recording
router.post('/:id/recording', authenticate, authorize('ADMIN', 'MODERATOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'start' or 'stop'

    const { data: stream, error } = await supabase
      .from('streams')
      .update({ is_recording: action === 'start' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info(`Recording ${action}ed for stream: ${stream.name}`);

    res.json({ stream });
  } catch (error) {
    next(error);
  }
});

// ============================================
// RTMP Authentication Callbacks (called by Nginx)
// ============================================

// Validate stream key on publish
router.get('/auth/publish', async (req, res, next) => {
  try {
    const { name, app } = req.query; // name = stream key, app = application name

    logger.info(`RTMP publish auth request: app=${app}, name=${name}`);

    if (!name) {
      logger.warn('RTMP publish denied: no stream key');
      return res.status(403).send('Forbidden');
    }

    // Find stream by key
    const { data: stream, error } = await supabase
      .from('streams')
      .select('*, events:event_id (*)')
      .eq('stream_key', name)
      .single();

    if (error || !stream) {
      logger.warn(`RTMP publish denied: invalid stream key ${name}`);
      return res.status(403).send('Invalid stream key');
    }

    // Check if event is active
    if (stream.events.status === 'CANCELLED' || stream.events.status === 'ENDED') {
      logger.warn(`RTMP publish denied: event not active for ${name}`);
      return res.status(403).send('Event not active');
    }

    // Update stream status
    await supabase
      .from('streams')
      .update({
        status: 'LIVE',
        started_at: new Date().toISOString()
      })
      .eq('id', stream.id);

    // Update event status if needed
    if (stream.events.status !== 'LIVE') {
      await supabase
        .from('events')
        .update({ status: 'LIVE' })
        .eq('id', stream.event_id);
    }

    logger.info(`RTMP publish authorized: ${stream.name}`);

    // Return 2xx to allow publish
    res.status(200).send('OK');
  } catch (error) {
    logger.error('RTMP publish auth error:', error);
    res.status(500).send('Internal error');
  }
});

// Handle publish done (stream ended)
router.get('/auth/publish-done', async (req, res, next) => {
  try {
    const { name } = req.query;

    logger.info(`RTMP publish done: ${name}`);

    if (!name) {
      return res.status(200).send('OK');
    }

    const { data: stream } = await supabase
      .from('streams')
      .select('id, name')
      .eq('stream_key', name)
      .single();

    if (stream) {
      await supabase
        .from('streams')
        .update({
          status: 'ENDED',
          ended_at: new Date().toISOString()
        })
        .eq('id', stream.id);

      logger.info(`Stream ended: ${stream.name}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('RTMP publish-done error:', error);
    res.status(200).send('OK'); // Always return OK to not block nginx
  }
});

// Validate playback (optional, for protected streams)
router.get('/auth/play', async (req, res, next) => {
  try {
    const { name, token } = req.query;

    // For now, allow all playback
    // TODO: Implement token-based playback authentication if needed

    res.status(200).send('OK');
  } catch (error) {
    logger.error('RTMP play auth error:', error);
    res.status(200).send('OK');
  }
});

// Get stream statistics
router.get('/:id/stats', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: stream, error } = await supabase
      .from('streams')
      .select('id, name, status, peak_viewers, total_views, started_at, ended_at')
      .eq('id', id)
      .single();

    if (error || !stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Get recent viewer analytics
    const { data: analytics } = await supabase
      .from('viewer_analytics')
      .select('*')
      .eq('stream_id', id)
      .order('timestamp', { ascending: false })
      .limit(60);

    res.json({
      stream,
      analytics: (analytics || []).reverse()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
