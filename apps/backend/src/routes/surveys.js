import express from 'express';
import { supabase } from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/session/:sessionId', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('surveys')
            .select('*, survey_fields(*)')
            .eq('session_id', req.params.sessionId);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', requireAdmin, async (req, res) => {
    try {
        const { sessionId, title, fields } = req.body;

        // Create survey
        const { data: survey, error: sErr } = await supabase
            .from('surveys')
            .insert({ session_id: sessionId, title })
            .select()
            .single();

        if (sErr) throw sErr;

        // Create fields
        const fieldsData = fields.map(f => ({
            survey_id: survey.id,
            question: f.question,
            type: f.type,
            options: f.options
        }));

        const { error: fErr } = await supabase.from('survey_fields').insert(fieldsData);
        if (fErr) throw fErr;

        res.json(survey);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/response', requireAuth, async (req, res) => {
    try {
        const { surveyId, responses } = req.body;

        const { data, error } = await supabase
            .from('survey_responses')
            .insert({
                survey_id: surveyId,
                user_id: req.user.id,
                responses // JSONB
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
