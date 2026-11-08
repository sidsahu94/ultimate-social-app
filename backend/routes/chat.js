const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

router.post('/', protect, chatController.createChat);
router.post('/group', protect, chatController.createGroupChat);

router.get('/', protect, chatController.getChats);

router.get('/:chatId', protect, chatController.getChatById);
router.get('/:chatId/messages', protect, chatController.getMessages);
router.get('/:chatId/search', protect, chatController.searchMessages);

router.post('/:chatId/message', protect, chatController.sendMessage);
router.put('/:chatId/message/:messageId', protect, chatController.updateMessage);
router.delete('/:chatId/message/:messageId', protect, chatController.deleteMessage);
router.post('/message/:messageId/vote', protect, chatController.votePoll);

router.post('/:chatId/read', protect, chatController.markAsRead);
router.put('/:chatId/details', protect, chatController.updateGroupDetails);
router.put('/:chatId/members', protect, chatController.manageMembers);
router.post('/:chatId/leave', protect, chatController.leaveGroup);
router.put('/:chatId/pin/:messageId', protect, chatController.togglePin);
router.put('/:chatId/ephemeral', protect, chatController.toggleEphemeral);
router.delete('/:chatId', protect, chatController.deleteChat);

// legacy aliases
router.put('/rename', protect, chatController.renameGroup);
router.put('/groupadd', protect, chatController.addToGroup);
router.put('/groupremove', protect, chatController.removeFromGroup);
router.get('/message/:chatId', protect, chatController.allMessages);

module.exports = router;