const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const router = express.Router();

// Initialize passport
router.use(passport.initialize());
router.use(passport.session());

// Twitch OAuth login
router.get('/twitch', passport.authenticate('twitch', { scope: ['user:read:email'] }));

// Twitch OAuth callback
router.get('/twitch/callback', 
  passport.authenticate('twitch', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { 
          id: req.user.id, 
          twitchId: req.user.twitch_id,
          username: req.user.username 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Redirect to frontend with token
      const frontendURL = process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' 
        : 'http://localhost:3000';
      
      res.redirect(`${frontendURL}/dashboard?token=${token}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${frontendURL}/login?error=auth_failed`);
    }
  }
);

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['access_token', 'refresh_token'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.preferences = { ...user.preferences, ...req.body };
    await user.save();
    
    res.json({ message: 'Preferences updated successfully', preferences: user.preferences });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

module.exports = router;
