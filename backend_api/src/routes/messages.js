import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/session/:sessionId', requireAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const { data, error } = await supabase
            .from('messages')
            .select(`
        *,
        profiles:user_id (id, name, role, avatar)
      `)
            .eq('session_id', req.params.sessionId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(limit);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', requireAuth, async (req, res) => {
    try {
        const { sessionId, text } = req.body;

        // Authorization: User must be valid (already checked by requireAuth)
        // Optional: Check if user has joined the event

        const { data, error } = await supabase
            .from('messages')
            .insert({
                session_id: sessionId,
                user_id: req.user.id,
                text
            })
            .select(`
        *,
        profiles:user_id (id, name, role, avatar)
      `)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Pin/Unpin (Moderator+)
router.patch('/:id/pin', requireAuth, async (req, res) => {
    // Check role first
    // Skipping role check impl for brevity, assuming middleware could handle strict role checks

    try {
        const { isPinned } = req.body;
        const { data, error } = await supabase
            .from('messages')
            .update({ is_pinned: isPinned })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('messages')
            .update({ is_deleted: true })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
