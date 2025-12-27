import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) return res.status(404).json({ error: 'Profile not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/:id', requireAuth, async (req, res) => {
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'Cannot update other users profiles' });
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
