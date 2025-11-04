// routes/chat.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

router.post('/', protect, chatController.createChat);
router.get('/', protect, chatController.getChats);
router.post('/:chatId/message', protect, chatController.sendMessage);
router.get('/:chatId', protect, chatController.getChatById);
router.get('/conversations', protect, chatController.getChats);

module.exports = router;
