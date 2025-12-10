// routes/chat.js
// routes/chat.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');
const { markRead } = require('../controllers/chatController'); // Ensure markRead is imported

router.post('/', protect, chatController.createChat);
router.get('/', protect, chatController.getChats);
router.post('/:chatId/message', protect, chatController.sendMessage);
router.get('/:chatId', protect, chatController.getChatById);

// reactions, read receipts
router.post('/:chatId/messages/:messageId/react', protect, chatController.reactMessage);

// Using a dedicated endpoint for markRead based on frontend usage, though the frontend uses a subroute:
// Frontend uses POST /chat/extras/:chatId/read which is handled by a separate route file.
// If you intended to use /chat/:chatId/read, uncomment the line below:
// router.post('/:chatId/read', protect, markRead);

module.exports = router;