import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/session/:sessionId', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('polls')
            .select('*, poll_options(*)')
            .eq('session_id', req.params.sessionId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/session/:sessionId/active', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('polls')
            .select('*, poll_options(*)')
            .eq('session_id', req.params.sessionId)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', requireAdmin, async (req, res) => {
    try {
        const { sessionId, question, options } = req.body;

        // Create poll
        const { data: poll, error: pollError } = await supabase
            .from('polls')
            .insert({ session_id: sessionId, question })
            .select()
            .single();

        if (pollError) throw pollError;

        // Create options
        const optionsData = options.map(opt => ({
            poll_id: poll.id,
            text: opt
        }));

        const { error: optError } = await supabase
            .from('poll_options')
            .insert(optionsData);

        if (optError) throw optError;

        res.json(poll);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/vote', requireAuth, async (req, res) => {
    try {
        const { pollId, optionId } = req.body;
        const { data, error } = await supabase
            .from('poll_votes')
            .insert({
                poll_id: pollId,
                option_id: optionId,
                user_id: req.user.id
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') return res.status(409).json({ error: 'Already voted' });
            throw error;
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id/activate', requireAdmin, async (req, res) => {
    try {
        const { isActive } = req.body;
        const { error } = await supabase
            .from('polls')
            .update({ is_active: isActive })
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Success' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
