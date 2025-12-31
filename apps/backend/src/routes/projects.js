import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Allowed fields for project creation/update
const ALLOWED_PROJECT_FIELDS = [
    'name', 'description', 'status', 'is_on_demand', 'is_public',
    'youtube_video_id', 'thumbnail', 'owner_id', 'rtmp_stream_key',
    'started_at', 'ended_at', 'viewers'
];

// Sanitize project input to only include allowed fields
function sanitizeProjectInput(body, allowedFields = ALLOWED_PROJECT_FIELDS) {
    const sanitized = {};
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            sanitized[field] = body[field];
        }
    }
    return sanitized;
}

// Validate required fields for project creation
function validateProjectCreate(body) {
    const errors = [];
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        errors.push('name is required and must be a non-empty string');
    }
    if (body.name && body.name.length > 255) {
        errors.push('name must be 255 characters or less');
    }
    if (body.description && body.description.length > 5000) {
        errors.push('description must be 5000 characters or less');
    }
    if (body.status && !['DRAFT', 'LIVE', 'ENDED'].includes(body.status)) {
        errors.push('status must be DRAFT, LIVE, or ENDED');
    }
    return errors;
}

// Get all projects via admin only
router.get('/', requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create
router.post('/', requireAdmin, async (req, res) => {
    try {
        // Validate input
        const validationErrors = validateProjectCreate(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: validationErrors });
        }

        // Sanitize input - only allow specific fields
        const sanitizedBody = sanitizeProjectInput(req.body);

        // Set owner_id to current user if not specified
        if (!sanitizedBody.owner_id) {
            sanitizedBody.owner_id = req.user.id;
        }

        const { data, error } = await supabase
            .from('projects')
            .insert(sanitizedBody)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) return res.status(404).json({ error: 'Project not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update
router.patch('/:id', requireAdmin, async (req, res) => {
    try {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(req.params.id)) {
            return res.status(400).json({ error: 'Invalid project ID format' });
        }

        // Sanitize input - only allow specific fields, exclude fields that shouldn't be updated
        const updateAllowedFields = ALLOWED_PROJECT_FIELDS.filter(f => f !== 'owner_id');
        const sanitizedBody = sanitizeProjectInput(req.body, updateAllowedFields);

        if (Object.keys(sanitizedBody).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const { data, error } = await supabase
            .from('projects')
            .update(sanitizedBody)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
