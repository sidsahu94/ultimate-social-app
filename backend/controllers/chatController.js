// backend/controllers/chatController.js
const Chat = require('../models/Chat');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const cloudinaryUtil = require('../utils/cloudinary');

const safeUploadToCloudinary = async (filePath) => {
  try {
    const res = await cloudinaryUtil.uploads(filePath, 'ultimate_social/chat');
    return { url: res.secure_url };
  } catch (err) {
    const localUrl = `/uploads/${path.basename(filePath)}`;
    return { url: localUrl };
  }
};

// Create chat (group or 1-to-1)
exports.createChat = async (req, res) => {
  try {
    const { participants = [], name = '', isGroup = false } = req.body;
    const unique = new Set(participants.map(String));
    unique.add(req.user._id.toString());

    const chat = new Chat({ participants: Array.from(unique), name, isGroup });
    await chat.save();
    const populated = await Chat.findById(chat._id).populate('participants','name avatar badgeVerified');
    res.status(201).json(populated);
  } catch (err) {
    console.error('createChat err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants','name avatar badgeVerified')
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error('getChats err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content = '', media = null } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message:'Chat not found' });

    // Ensure in participants
    if (!chat.participants.map(String).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const message = {
      sender: req.user._id,
      content: content,
      media: media,
      createdAt: Date.now()
    };

    chat.messages.push(message);
    chat.updatedAt = Date.now();

    // unread counters for others
    for (const u of chat.participants.map(String)) {
      if (u !== req.user._id.toString()) {
        const prev = Number(chat.unread.get(u) || 0);
        chat.unread.set(u, prev + 1);
      }
    }

    await chat.save();

    const populated = await Chat.findById(chatId)
      .populate('participants','name avatar')
      .populate('messages.sender','name avatar');

    // socket emission handled from server.js via io.to(room).emit etc. (see server section)
    res.status(201).json(populated);
  } catch (err) {
    console.error('sendMessage err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId || req.params.id)
      .populate('participants','name avatar')
      .populate('messages.sender','name avatar');

    if (!chat) return res.status(404).json({ message:'Chat not found' });

    const uid = req.user._id.toString();
    if (!chat.participants.map(p => p._id.toString()).includes(uid) && req.user.role !== 'admin') {
      return res.status(403).json({ message:'Not allowed' });
    }

    // mark unread zero for me
    chat.unread.set(uid, 0);
    await chat.save();

    res.json(chat);
  } catch (err) {
    console.error('getChatById err', err);
    res.status(500).json({ message:'Server error', error: err.message });
  }
};

// React to a message
exports.reactMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { emoji } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message:'Chat not found' });

    const msg = chat.messages.id(messageId);
    if (!msg) return res.status(404).json({ message:'Message not found' });

    // toggle reaction from me with this emoji
    const mine = (msg.reactions || []).find(r => r.by?.toString() === req.user._id.toString());
    if (mine && mine.emoji === emoji) {
      msg.reactions = msg.reactions.filter(r => r.by.toString() !== req.user._id.toString());
    } else {
      msg.reactions = (msg.reactions || []).filter(r => r.by.toString() !== req.user._id.toString());
      msg.reactions.push({ by: req.user._id, emoji });
    }

    await chat.save();

    const populated = await Chat.findById(chatId).populate('messages.sender','name avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message:'Server error' });
  }
};

// Mark message(s) read
exports.markRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message:'Chat not found' });

    const uid = req.user._id.toString();

    for (const m of chat.messages) {
      if (!m.seenBy.map(String).includes(uid)) m.seenBy.push(req.user._id);
    }
    chat.unread.set(uid, 0);
    await chat.save();
    res.json({ success:true });
  } catch (err) {
    res.status(500).json({ message:'Server error' });
  }
};
