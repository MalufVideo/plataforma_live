import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/event/:eventId', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('event_sessions')
            .select('*')
            .eq('event_id', req.params.eventId)
            .order('start_time', { ascending: true });

        if (error) throw error;

        // Map status based on time
        const sessions = data.map(s => {
            const now = new Date();
            const start = new Date(s.start_time);
            const end = new Date(s.end_time);
            let status = 'UPCOMING';
            if (now >= start && now <= end) status = 'LIVE';
            if (now > end) status = 'ENDED';

            return { ...s, status };
        });

        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
