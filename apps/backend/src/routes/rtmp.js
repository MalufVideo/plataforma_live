import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const RTMP_PORT = process.env.RTMP_PORT || 1935;
const RTMP_HOST = process.env.RTMP_HOST || 'localhost';

/**
 * Generate a secure stream key
 */
function generateStreamKey() {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * GET /api/rtmp/server-info
 * Get RTMP server connection info
 */
router.get('/server-info', requireAuth, (req, res) => {
    res.json({
        rtmpUrl: `rtmp://${RTMP_HOST}:${RTMP_PORT}/live`,
        instructions: {
            vMix: {
                destination: `rtmp://${RTMP_HOST}:${RTMP_PORT}/live`,
                streamKeyFormat: 'Use your project stream key',
                settings: 'Use H.264 codec, AAC audio, 30fps recommended'
            },
            obs: {
                server: `rtmp://${RTMP_HOST}:${RTMP_PORT}/live`,
                streamKey: 'Use your project stream key',
                settings: 'Use x264 encoder, 4500 Kbps for 1080p'
            }
        }
    });
});

/**
 * POST /api/rtmp/ingest
 * Create a new RTMP ingest configuration for a project
 */
router.post('/ingest', requireAdmin, async (req, res) => {
    try {
        const { projectId, name } = req.body;

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID is required' });
        }

        // Check if project exists
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, name')
            .eq('id', projectId)
            .single();

        if (projectError || !project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if ingest config already exists for this project
        const { data: existing } = await supabase
            .from('rtmp_ingest_configs')
            .select('id')
            .eq('project_id', projectId)
            .single();

        if (existing) {
            return res.status(409).json({
                error: 'RTMP ingest configuration already exists for this project',
                existingId: existing.id
            });
        }

        // Generate stream key and create config
        const streamKey = generateStreamKey();
        const rtmpUrl = `rtmp://${RTMP_HOST}:${RTMP_PORT}/live`;

        const { data: ingestConfig, error } = await supabase
            .from('rtmp_ingest_configs')
            .insert({
                project_id: projectId,
                stream_key: streamKey,
                rtmp_url: rtmpUrl,
                name: name || `${project.name} Stream`,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating RTMP ingest config:', error);
            return res.status(500).json({ error: 'Failed to create RTMP ingest configuration' });
        }

        res.status(201).json({
            ...ingestConfig,
            fullRtmpUrl: `${rtmpUrl}/${streamKey}`,
            instructions: {
                step1: 'Open vMix or OBS',
                step2: `Set stream URL to: ${rtmpUrl}`,
                step3: `Set stream key to: ${streamKey}`,
                step4: 'Start streaming!'
            }
        });

    } catch (err) {
        console.error('Error in POST /rtmp/ingest:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/rtmp/ingest/:projectId
 * Get RTMP ingest configuration for a project
 */
router.get('/ingest/:projectId', requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rtmp_ingest_configs')
            .select('*')
            .eq('project_id', req.params.projectId)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (!data) {
            return res.status(404).json({ error: 'No RTMP ingest configuration found for this project' });
        }

        res.json({
            ...data,
            fullRtmpUrl: `${data.rtmp_url}/${data.stream_key}`
        });

    } catch (err) {
        console.error('Error in GET /rtmp/ingest/:projectId:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * DELETE /api/rtmp/ingest/:id
 * Delete an RTMP ingest configuration
 */
router.delete('/ingest/:id', requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('rtmp_ingest_configs')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'RTMP ingest configuration deleted successfully' });

    } catch (err) {
        console.error('Error in DELETE /rtmp/ingest/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/rtmp/ingest/:id/regenerate-key
 * Regenerate stream key for an ingest configuration
 */
router.put('/ingest/:id/regenerate-key', requireAdmin, async (req, res) => {
    try {
        const newStreamKey = generateStreamKey();

        const { data, error } = await supabase
            .from('rtmp_ingest_configs')
            .update({
                stream_key: newStreamKey,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'RTMP ingest configuration not found' });
        }

        res.json({
            ...data,
            fullRtmpUrl: `${data.rtmp_url}/${data.stream_key}`,
            message: 'Stream key regenerated successfully'
        });

    } catch (err) {
        console.error('Error in PUT /rtmp/ingest/:id/regenerate-key:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/rtmp/ingest/:id/toggle
 * Enable or disable an RTMP ingest configuration
 */
router.put('/ingest/:id/toggle', requireAdmin, async (req, res) => {
    try {
        const { isActive } = req.body;

        const { data, error } = await supabase
            .from('rtmp_ingest_configs')
            .update({
                is_active: isActive,
                updated_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'RTMP ingest configuration not found' });
        }

        res.json(data);

    } catch (err) {
        console.error('Error in PUT /rtmp/ingest/:id/toggle:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/rtmp/validate
 * Validate a stream key (called by RTMP server internally)
 * This endpoint should be protected or internal-only in production
 */
router.post('/validate', async (req, res) => {
    try {
        const { streamKey } = req.body;

        if (!streamKey) {
            return res.status(400).json({ valid: false, error: 'Stream key is required' });
        }

        const { data, error } = await supabase
            .from('rtmp_ingest_configs')
            .select('id, project_id, is_active')
            .eq('stream_key', streamKey)
            .single();

        if (error || !data) {
            return res.json({ valid: false, error: 'Invalid stream key' });
        }

        if (!data.is_active) {
            return res.json({ valid: false, error: 'Stream key is disabled' });
        }

        res.json({
            valid: true,
            projectId: data.project_id,
            configId: data.id
        });

    } catch (err) {
        console.error('Error in POST /rtmp/validate:', err);
        res.status(500).json({ valid: false, error: err.message });
    }
});

export default router;
