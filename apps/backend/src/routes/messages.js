import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth, requireModeratorOrAbove } from '../middleware/auth.js';

const router = express.Router();

// Validate UUID format
function isValidUUID(str) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

router.get('/session/:sessionId', requireAuth, async (req, res) => {
    try {
        if (!isValidUUID(req.params.sessionId)) {
            return res.status(400).json({ error: 'Invalid session ID format' });
        }

        const limit = Math.min(parseInt(req.query.limit) || 50, 200); // Cap at 200
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

        // Validate input
        if (!sessionId || !isValidUUID(sessionId)) {
            return res.status(400).json({ error: 'Invalid session ID' });
        }

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Message text is required' });
        }

        if (text.length > 2000) {
            return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
        }

        const { data, error } = await supabase
            .from('messages')
            .insert({
                session_id: sessionId,
                user_id: req.user.id,
                text: text.trim()
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

// Pin/Unpin - requires Moderator, Admin, or Master Admin role
router.patch('/:id/pin', requireModeratorOrAbove, async (req, res) => {
    try {
        if (!isValidUUID(req.params.id)) {
            return res.status(400).json({ error: 'Invalid message ID format' });
        }

        const { isPinned } = req.body;
        if (typeof isPinned !== 'boolean') {
            return res.status(400).json({ error: 'isPinned must be a boolean' });
        }

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

// Delete message - owner can delete their own, moderators+ can delete any
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        if (!isValidUUID(req.params.id)) {
            return res.status(400).json({ error: 'Invalid message ID format' });
        }

        // Get user's role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', req.user.id)
            .single();

        const moderatorRoles = ['MODERATOR', 'ADMIN', 'MASTER_ADMIN'];
        const isModeratorOrAbove = profile && moderatorRoles.includes(profile.role);

        // Get the message to check ownership
        const { data: message } = await supabase
            .from('messages')
            .select('user_id')
            .eq('id', req.params.id)
            .single();

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Check if user owns the message or is a moderator+
        if (message.user_id !== req.user.id && !isModeratorOrAbove) {
            return res.status(403).json({ error: 'Access denied: You can only delete your own messages' });
        }

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
