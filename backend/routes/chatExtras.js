// backend/routes/chatExtras.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');

// mark messages as read in a chat
router.post('/:chatId/read', protect, async (req, res) => {
  try {
    const { messageIds } = req.body; // optional: array of specific message ids
    const chatId = req.params.chatId;
    if (!mongoose.Types.ObjectId.isValid(chatId)) return res.status(400).json({ message: 'Invalid chat id' });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // only participants can mark read
    const uid = req.user._id.toString();
    if (!chat.participants.map(p => p.toString()).includes(uid)) return res.status(403).json({ message: 'Not allowed' });

    // for each message, add reader if not present
    let updatedCount = 0;
    chat.messages = (chat.messages || []).map(m => {
      // If messageIds provided, only mark those. Otherwise mark ALL.
      if (messageIds && Array.isArray(messageIds) && !messageIds.includes(String(m._id))) return m;
      
      // Don't mark my own messages as read by me (logic redundancy check)
      if (String(m.sender) === uid) return m;

      m.readBy = m.readBy || [];
      if (!m.readBy.map(String).includes(uid)) {
        m.readBy.push(req.user._id);
        updatedCount++;
      }
      return m;
    });

    // Reset unread count for this user in the map
    if (chat.unread) {
        chat.unread.set(uid, 0);
    }

    if (updatedCount > 0) {
        await chat.save();

        // 🔥 FIX: Emit Real-Time Event
        const io = req.app.get('io') || global.io;
        if (io) {
            // Notify others in this chat room that 'uid' has read messages
            // We assume users join a room named after the chatId (logic added in ChatBox frontend)
            chat.participants.forEach(p => {
                if(String(p) !== uid) {
                    io.to(String(p)).emit('message:read', { chatId, userId: uid });
                }
            });
        }
    }

    return res.json({ ok: true, updated: updatedCount });
  } catch (err) {
    console.error('chat mark read err', err);
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;