// backend/routes/games.js
const express = require('express');
const router = express.Router();
const appsController = require('../controllers/appsController');
const { protect } = require('../middleware/authMiddleware');
const { gameLimiter } = require('../middleware/rateLimit');

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

const GAMES_LIST = [
  { id: 'snake', name: 'Cyber Snake', color: 'from-[#0F766E] to-[#00F2FE]', icon: '🐍', plays: 1420 },
  { id: '2048', name: '2048 Elite', color: 'from-[#D4AF37] to-[#F4D49A]', icon: '🔢', plays: 980 },
  { id: 'quiz', name: 'Trivia Royale', color: 'from-[#1D4ED8] to-[#052E24]', icon: '❓', plays: 640 },
];

router.get('/', optionalAuth, (req, res) => {
  res.json({ success: true, data: GAMES_LIST });
});

router.get('/list', optionalAuth, (req, res) => {
  res.json({ success: true, data: GAMES_LIST });
});

router.get('/:gameId/leaderboard', optionalAuth, appsController.getLeaderboard);
router.post('/score', protect, gameLimiter, appsController.submitScore);

module.exports = router;
