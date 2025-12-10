// backend/routes/chatExtras.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');

// mark messages as read in a chat
router.post('/:chatId/read', protect, async (req, res) => {
  try {
    const { messageIds } = req.body; // array of message ids
    const chatId = req.params.chatId;
    if (!mongoose.Types.ObjectId.isValid(chatId)) return res.status(400).json({ message: 'Invalid chat id' });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // only participants can mark read
    const uid = req.user._id.toString();
    if (!chat.participants.map(p => p.toString()).includes(uid)) return res.status(403).json({ message: 'Not allowed' });

    // for each message, add reader if not present
    chat.messages = (chat.messages || []).map(m => {
      if (messageIds && Array.isArray(messageIds) && !messageIds.includes(String(m._id))) return m;
      m.readBy = m.readBy || [];
      if (!m.readBy.map(String).includes(uid)) m.readBy.push(req.user._id);
      return m;
    });

    await chat.save();

    // emit socket notification to other participants would be handled client-side via socket event
    return res.json({ ok: true });
  } catch (err) {
    console.error('chat mark read err', err);
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;
