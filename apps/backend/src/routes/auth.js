import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
    const { email, password, MOname, company, title } = req.body;

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name: req.body.name, company, title } // Accessing name correctly
            }
        });

        if (error) return res.status(400).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ error: error.message });

        // Update profile status
        if (data.user) {
            await supabase
                .from('profiles')
                .update({ status: 'ONLINE', last_login_at: new Date().toISOString() })
                .eq('id', data.user.id);
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/signout', requireAuth, async (req, res) => {
    try {
        await supabase.from('profiles').update({ status: 'OFFLINE' }).eq('id', req.user.id);
        const { error } = await supabase.auth.signOut();
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Signed out successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) return res.status(404).json({ error: 'Profile not found' });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
