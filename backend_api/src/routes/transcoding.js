import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
    getTranscodingProfiles,
    startMultiProfileTranscoding,
    stopTranscodingJob,
    getActiveJobCount,
    generateMasterPlaylist
} from '../services/transcodingService.js';

const router = express.Router();

/**
 * GET /api/transcoding/profiles
 * List all transcoding profiles
 */
router.get('/profiles', requireAuth, async (req, res) => {
    try {
        const onlyDefaults = req.query.defaults === 'true';
        const profiles = await getTranscodingProfiles(onlyDefaults);
        res.json(profiles);
    } catch (err) {
        console.error('Error in GET /transcoding/profiles:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/transcoding/profiles
 * Create a new transcoding profile (admin only)
 */
router.post('/profiles', requireAdmin, async (req, res) => {
    try {
        const {
            name,
            width,
            height,
            video_bitrate,
            audio_bitrate = '128k',
            framerate = 30,
            preset = 'veryfast',
            is_default = false
        } = req.body;

        if (!name || !width || !height || !video_bitrate) {
            return res.status(400).json({
                error: 'Missing required fields: name, width, height, video_bitrate'
            });
        }

        const { data, error } = await supabase
            .from('transcoding_profiles')
            .insert({
                name,
                width,
                height,
                video_bitrate,
                audio_bitrate,
                framerate,
                preset,
                is_default
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);

    } catch (err) {
        console.error('Error in POST /transcoding/profiles:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/transcoding/profiles/:id
 * Update a transcoding profile
 */
router.put('/profiles/:id', requireAdmin, async (req, res) => {
    try {
        const updates = req.body;
        delete updates.id; // Don't allow updating ID
        delete updates.created_at;

        const { data, error } = await supabase
            .from('transcoding_profiles')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Transcoding profile not found' });
        }

        res.json(data);

    } catch (err) {
        console.error('Error in PUT /transcoding/profiles/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/transcoding/profiles/:id
 * Delete a transcoding profile
 */
router.delete('/profiles/:id', requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('transcoding_profiles')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Transcoding profile deleted successfully' });

    } catch (err) {
        console.error('Error in DELETE /transcoding/profiles/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/transcoding/jobs
 * Start transcoding for a stream with all default profiles
 */
router.post('/jobs', requireAdmin, async (req, res) => {
    try {
        const { streamId, inputUrl } = req.body;

        if (!streamId || !inputUrl) {
            return res.status(400).json({
                error: 'Missing required fields: streamId, inputUrl'
            });
        }

        // Verify stream exists
        const { data: stream, error: streamError } = await supabase
            .from('streams')
            .select('id, event_id')
            .eq('id', streamId)
            .single();

        if (streamError || !stream) {
            return res.status(404).json({ error: 'Stream not found' });
        }

        // Start transcoding with all default profiles
        const jobs = await startMultiProfileTranscoding(streamId, inputUrl);

        res.status(201).json({
            message: 'Transcoding jobs started',
            streamId,
            jobs,
            activeJobCount: getActiveJobCount()
        });

    } catch (err) {
        console.error('Error in POST /transcoding/jobs:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/transcoding/jobs/single
 * Start a single transcoding job with a specific profile
 */
router.post('/jobs/single', requireAdmin, async (req, res) => {
    try {
        const { streamId, inputUrl, profileId } = req.body;

        if (!streamId || !inputUrl || !profileId) {
            return res.status(400).json({
                error: 'Missing required fields: streamId, inputUrl, profileId'
            });
        }

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('transcoding_profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ error: 'Transcoding profile not found' });
        }

        // Create job
        const { data: job, error: jobError } = await supabase
            .from('transcoding_jobs')
            .insert({
                stream_id: streamId,
                profile_id: profileId,
                input_url: inputUrl,
                status: 'PENDING'
            })
            .select()
            .single();

        if (jobError) throw jobError;

        // Start transcoding (non-blocking)
        const { startTranscodingJob } = await import('../services/transcodingService.js');
        startTranscodingJob(job.id, inputUrl, profile, streamId)
            .catch(err => console.error('Transcoding job failed:', err));

        res.status(201).json({
            message: 'Transcoding job started',
            job: {
                ...job,
                profile: profile.name
            }
        });

    } catch (err) {
        console.error('Error in POST /transcoding/jobs/single:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/transcoding/jobs/stream/:streamId
 * Get all transcoding jobs for a stream
 */
router.get('/jobs/stream/:streamId', requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transcoding_jobs')
            .select(`
                *,
                transcoding_profiles (name, width, height)
            `)
            .eq('stream_id', req.params.streamId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data || []);

    } catch (err) {
        console.error('Error in GET /transcoding/jobs/stream/:streamId:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/transcoding/jobs/:id
 * Get a specific transcoding job
 */
router.get('/jobs/:id', requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transcoding_jobs')
            .select(`
                *,
                transcoding_profiles (*)
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Transcoding job not found' });
        }

        res.json(data);

    } catch (err) {
        console.error('Error in GET /transcoding/jobs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/transcoding/jobs/:id
 * Stop and delete a transcoding job
 */
router.delete('/jobs/:id', requireAdmin, async (req, res) => {
    try {
        // Try to stop the job if it's running
        stopTranscodingJob(req.params.id);

        const { error } = await supabase
            .from('transcoding_jobs')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'Transcoding job stopped and deleted' });

    } catch (err) {
        console.error('Error in DELETE /transcoding/jobs/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/transcoding/master-playlist/:streamId
 * Generate master HLS playlist for adaptive streaming
 */
router.post('/master-playlist/:streamId', requireAdmin, async (req, res) => {
    try {
        const masterUrl = await generateMasterPlaylist(req.params.streamId);

        res.json({
            message: 'Master playlist generated',
            masterPlaylistUrl: masterUrl
        });

    } catch (err) {
        console.error('Error in POST /transcoding/master-playlist:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/transcoding/status
 * Get transcoding service status
 */
router.get('/status', requireAdmin, (req, res) => {
    res.json({
        activeJobs: getActiveJobCount(),
        status: 'running'
    });
});

export default router;
