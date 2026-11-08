// backend/routes/calls.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createRoom, joinRoom, getIceServers } = require('../controllers/callsController');

router.post('/room', protect, createRoom);
router.post('/room/:roomId/join', protect, joinRoom);
router.get('/credentials', protect, getIceServers);

module.exports = router;
