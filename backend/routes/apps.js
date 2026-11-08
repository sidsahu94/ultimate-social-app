// backend/routes/apps.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const appsController = require('../controllers/appsController');
const { gameLimiter } = require('../middleware/rateLimit');

// Optional authentication middleware: attaches user if token exists, but does not block guests
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

// Events (Publicly viewable, creation & joining protected)
router.get('/events', optionalAuth, appsController.getEvents);
router.post('/events', protect, appsController.createEvent);
router.post('/events/:id/join', protect, appsController.joinEvent);
router.delete('/events/:id', protect, appsController.deleteEvent);

// Wallet
router.get('/wallet', protect, appsController.getWallet);

// Games (Leaderboards publicly viewable, score submission protected)
router.get('/games', optionalAuth, (req, res) => res.json({ success: true, data: [{ id: 'snake', name: 'Cyber Snake', icon: '🐍' }, { id: '2048', name: '2048 Elite', icon: '🔢' }, { id: 'quiz', name: 'Trivia Royale', icon: '❓' }] }));
router.get('/games/:gameId/leaderboard', optionalAuth, appsController.getLeaderboard);
router.post('/games/score', protect, gameLimiter, appsController.submitScore);

// Analytics
router.get('/analytics', protect, appsController.getAnalytics);

module.exports = router;
