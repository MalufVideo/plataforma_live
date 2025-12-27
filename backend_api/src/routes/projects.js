import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

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
        const { data, error } = await supabase
            .from('projects')
            .insert(req.body)
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
        const { data, error } = await supabase
            .from('projects')
            .update(req.body)
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
