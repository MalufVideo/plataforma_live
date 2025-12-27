import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/event/:eventId', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('event_id', req.params.eventId)
            .order('is_main_stage', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
