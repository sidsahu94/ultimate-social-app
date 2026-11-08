// backend/routes/calls.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createRoom, joinRoom } = require('../controllers/callsController');

router.post('/room', protect, createRoom);
router.post('/room/:roomId/join', protect, joinRoom);

module.exports = router;
