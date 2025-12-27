import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    try {
        let query = supabase.from('events').select('*').order('start_time', { ascending: true });

        if (req.query.status) {
            query = query.eq('status', req.query.status);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/live', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*, event_sessions(*), streams(*)')
            .eq('status', 'LIVE')
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
        res.json(data || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:idOrSlug', requireAuth, async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const { data, error } = await supabase
            .from('events')
            .select('*, event_sessions(*), streams(*)')
            .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
            .single();

        if (error) return res.status(404).json({ error: 'Event not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
