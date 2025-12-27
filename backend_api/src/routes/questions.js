import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/session/:sessionId', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select(`
        *,
        profiles:user_id (id, name)
      `)
            .eq('session_id', req.params.sessionId)
            .eq('is_hidden', false)
            .order('upvotes', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', requireAuth, async (req, res) => {
    try {
        const { sessionId, text } = req.body;
        const { data, error } = await supabase
            .from('questions')
            .insert({
                session_id: sessionId,
                user_id: req.user.id,
                text
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/upvote', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('increment_upvotes', {
            question_id: req.params.id
        });

        if (error) throw error;
        res.json({ message: 'Upvoted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/answer', requireAuth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('questions')
            .update({ is_answered: true })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Marked as answered' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
