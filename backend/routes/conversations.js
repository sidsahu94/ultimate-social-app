// backend/routes/conversations.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

// return list of chats (same as GET /api/chat)
router.get('/', protect, chatController.getChats);

module.exports = router;
