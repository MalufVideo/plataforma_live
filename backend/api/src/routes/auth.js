const express = require('express');
const { body, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Register new user (Supabase handles this, but we provide an API endpoint)
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, company, title } = req.body;

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          company,
          title
        }
      }
    });

    if (error) {
      logger.error('Supabase signup error:', error);
      return res.status(400).json({ error: error.message });
    }

    // Profile is created automatically via trigger
    logger.info(`User registered: ${email}`);

    res.status(201).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name
      },
      session: data.session
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      logger.error('Supabase login error:', error);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Update last login and status
    await supabase
      .from('profiles')
      .update({ 
        last_login_at: new Date().toISOString(),
        status: 'ONLINE'
      })
      .eq('id', data.user.id);

    logger.info(`User logged in: ${email}`);

    res.json({
      user: profile,
      session: data.session
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Supabase logout error:', error);
    }

    // Update user status
    await supabase
      .from('profiles')
      .update({ status: 'OFFLINE' })
      .eq('id', req.user.id);

    logger.info(`User logged out: ${req.user.email}`);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      avatar: req.user.avatar,
      company: req.user.company,
      title: req.user.title,
      status: req.user.status
    }
  });
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    res.json({ session: data.session });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/profile', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('company').optional().trim(),
  body('title').optional().trim(),
  body('avatar').optional()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, company, title, avatar } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...(name && { name }),
        ...(company !== undefined && { company }),
        ...(title !== undefined && { title }),
        ...(avatar !== undefined && { avatar })
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    logger.info(`Profile updated: ${req.user.email}`);

    res.json({ user: data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
