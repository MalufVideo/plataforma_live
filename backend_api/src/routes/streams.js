import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('streams')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) return res.status(404).json({ error: 'Stream not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/event/:eventId/active', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('streams')
            .select('*')
            .eq('event_id', req.params.eventId)
            .eq('status', 'LIVE')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
