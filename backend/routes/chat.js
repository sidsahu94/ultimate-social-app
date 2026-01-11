// routes/chat.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');
const { chatLimiter } = require('../middleware/rateLimit');

// Standard Chat Management
router.post('/', protect, chatController.createChat);
router.get('/', protect, chatController.getChats);
router.get('/:chatId', protect, chatController.getChatById);

// Messaging
// 🔥 Uses chatLimiter to prevent spam
router.post('/:chatId/message', protect, chatLimiter, chatController.sendMessage);

// 🔥 NEW: Edit Message
router.put('/:chatId/message/:messageId', protect, chatController.editMessage);

// 🔥 NEW: Pin Message
router.put('/:chatId/pin/:messageId', protect, chatController.togglePinMessage);

// 🔥 NEW: Search in Chat
router.get('/:chatId/search', protect, chatController.searchChat);

// Extras / Management
router.delete('/:chatId', protect, chatController.deleteChat);
router.post('/:id/leave', protect, chatController.leaveChat);
router.get('/:chatId/messages', protect, chatController.getMessages); 
router.get('/meta/unread', protect, chatController.getUnreadCount);
router.delete('/:chatId/messages/:messageId', protect, chatController.unsendMessage);
router.post('/:chatId/messages/:messageId/react', protect, chatController.reactMessage);
// 🔥 NEW: Poll Voting Route
router.post('/message/:messageId/vote', protect, chatController.votePoll);
// Mark Read
// Note: Frontend currently uses /chat/extras/:chatId/read, but keeping this for consistency if needed
router.post('/:chatId/read', protect, chatController.markRead);
router.put('/:chatId/members', protect, chatController.updateGroupMember);
router.put('/:chatId/details', protect, chatController.updateGroupDetails);

module.exports = router;