import { supabase } from '../config/database.js';

export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const requireAdmin = async (req, res, next) => {
    try {
        // First run authentication
        await requireAuth(req, res, async () => {
            // Then check role from profiles
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', req.user.id)
                .single();

            if (!profile || profile.role !== 'ADMIN') {
                return res.status(403).json({ error: 'Access denied: Admins only' });
            }

            next();
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
