const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const appsController = require('../controllers/appsController');
const { gameLimiter } = require('../middleware/rateLimit'); // 🔥 Imported

// Events
router.get('/events', protect, appsController.getEvents);
router.post('/events', protect, appsController.createEvent);
router.post('/events/:id/join', protect, appsController.joinEvent);
router.delete('/events/:id', protect, appsController.deleteEvent);

// Wallet
router.get('/wallet', protect, appsController.getWallet);

// Games
router.get('/games/:gameId/leaderboard', protect, appsController.getLeaderboard);

// Apply gameLimiter to score submission (prevents farming)
router.post('/games/score', protect, gameLimiter, appsController.submitScore);

// Analytics
router.get('/analytics', protect, appsController.getAnalytics);

module.exports = router;