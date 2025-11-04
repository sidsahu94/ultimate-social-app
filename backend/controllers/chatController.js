// backend/controllers/chatController.js
const Chat = require('../models/Chat');
const User = require('../models/User');

/**
 * Create a new chat (group or 1-to-1)
 * Body: { participants: [userId1, userId2, ...] }
 */
exports.createChat = async (req, res) => {
  try {
    const { participants } = req.body;
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'participants array required' });
    }

    // Ensure current user is included
    if (!participants.includes(req.user._id.toString())) participants.push(req.user._id);

    const chat = new Chat({ participants });
    await chat.save();
    const populated = await Chat.findById(chat._id).populate('participants', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    console.error('createChat err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Get all chats for current user
 */
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'name avatar')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error('getChats err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Send a message in a chat (REST fallback; real-time via socket.io also used)
 * Body: { content, media }
 */
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, media } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const message = {
      sender: req.user._id,
      content: content || '',
      media: media || null,
      createdAt: Date.now(),
    };

    chat.messages.push(message);
    chat.updatedAt = Date.now();
    await chat.save();

    // populate the last message sender for response
    const populated = await Chat.findById(chatId).populate('participants', 'name avatar').populate('messages.sender', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    console.error('sendMessage err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Get single chat by id with messages
 */
exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId || req.params.id)
      .populate('participants', 'name avatar')
      .populate('messages.sender', 'name avatar');

    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // verify that requesting user is part of the chat
    const uid = req.user._id.toString();
    if (!chat.participants.map(p => p._id.toString()).includes(uid) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    res.json(chat);
  } catch (err) {
    console.error('getChatById err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
