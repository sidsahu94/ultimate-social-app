const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const appsController = require('../controllers/appsController');

// Events
router.get('/events', protect, appsController.getEvents);
router.post('/events', protect, appsController.createEvent);
router.post('/events/:id/join', protect, appsController.joinEvent);

// Wallet
router.get('/wallet', protect, appsController.getWallet);

// Games
router.get('/games/:gameId/leaderboard', protect, appsController.getLeaderboard);
router.post('/games/score', protect, appsController.submitScore);

// Analytics
router.get('/analytics', protect, appsController.getAnalytics);
router.delete('/events/:id', protect, appsController.deleteEvent);
module.exports = router;