require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { authenticateToken } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const logger = require('../utils/logger');
const passport = require('passport');
const XeroStrategy = require('passport-xero-oauth2').Strategy;

const router = express.Router();

// Demo user data (replace with database in production)
const demoUser = {
  id: '1',
  email: 'demo@example.com',
  password: '$2a$10$8K1p/a0dUZRfTMUSbM6tKeSGCnhI0z1kO5QrJ2YfJYl2JU7S5KJ/6', // demo123
  name: 'Demo User'
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Login endpoint
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info(`Login attempt for email: ${email}`);

    // In production, query database
    if (email !== demoUser.email) {
      logger.warn(`Login failed - user not found: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For demo purposes, also allow plain text password comparison
    let isValidPassword = false;

    // Try bcrypt comparison first
    try {
      isValidPassword = await bcrypt.compare(password, demoUser.password);
    } catch (bcryptError) {
      logger.warn('Bcrypt comparison failed, trying plain text for demo');
    }

    // Fallback to plain text for demo (remove in production)
    if (!isValidPassword && password === 'demo123') {
      isValidPassword = true;
      logger.info('Demo login using plain text password');
    }

    if (!isValidPassword) {
      logger.warn(`Login failed - invalid password for: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: demoUser.id, email: demoUser.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    logger.info(`Login successful for: ${email}`);

    res.json({
      token,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    id: demoUser.id,
    email: demoUser.email,
    name: demoUser.name
  });
});

// Xero OAuth2 config (use env vars in production)
const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID || '118A2DE28C17464EB5AEEE033FDD7DB3';
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET || 'V7j5pSnZcHP49b8sZvvYmOz11ppmOOZyMgAvuagWua-ZDJRC';
const XERO_CALLBACK_URL = process.env.XERO_CALLBACK_URL || 'http://localhost:3000/api/auth/xero/callback';

// Xero OAuth2 strategy
passport.use(new XeroStrategy({
  clientID: XERO_CLIENT_ID || '118A2DE28C17464EB5AEEE033FDD7DB3',
  clientSecret: XERO_CLIENT_SECRET || 'V7j5pSnZcHP49b8sZvvYmOz11ppmOOZyMgAvuagWua-ZDJRC',
  callbackURL: XERO_CALLBACK_URL || 'http://localhost:3000/api/auth/xero/callback',
  scope: 'openid profile email accounting.transactions offline_access',
  state: true
}, (accessToken, refreshToken, params, profile, done) => {
  // Save tokens and profile as needed
  const user = {
    profile,
    accessToken,
    refreshToken,
    idToken: params.id_token,
    expires_in: params.expires_in
  };
  return done(null, user);
}));

// Xero OAuth2 login route
router.get('/xero', passport.authenticate('xero'));

// Xero OAuth2 callback route
router.get('/xero/callback',
  passport.authenticate('xero', { failureRedirect: '/login', session: true }),
  (req, res) => {
    // Generate JWT for the Xero user
    const jwt = require('jsonwebtoken');
    const user = req.user && req.user.profile;
    if (!user) {
      return res.redirect((process.env.FRONTEND_URL || 'http://localhost:5173') + '/login?error=oauth');
    }
    const token = jwt.sign(
      {
        userId: user.id || user.user_id || user.sub || user.email || 'xero-user',
        email: user.email,
        name: user.displayName || user.given_name || user.name || 'Xero User',
        xero: true
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );
    // Redirect to frontend with token in URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?token=${token}`);
  }
);

// Xero logout
router.get('/xero/logout', (req, res) => {
  req.logout(() => {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173/login');
  });
});

// Endpoint to get current Xero user info
router.get('/xero/me', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({ user: req.user.profile, tokens: { accessToken: req.user.accessToken, refreshToken: req.user.refreshToken } });
  } else {
    res.status(401).json({ error: 'Not authenticated with Xero' });
  }
});

module.exports = router;
