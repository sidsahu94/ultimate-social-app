// backend/controllers/extraController.js
const User = require('../models/User');
const Chat = require('../models/Chat');
const Post = require('../models/Post');
const Message = require('../models/Message');
const cloud = require('../utils/cloudinary');
const Saved = require('../models/Saved');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

exports.aiAvatar = async (req, res) => {
  const up = await cloud.uploads(req.file.path, 'avatars');
  req.user.avatar = up.secure_url;
  await req.user.save();
  res.json({ url: up.secure_url });
};

exports.voice = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify membership authorization
    const isParticipant = (chat.participants || []).some(p => String(p) === String(req.user._id));
    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Forbidden: You are not a participant in this conversation." });
    }

    let audioUrl = req.body?.url;
    if (!audioUrl && req.file) {
      try {
        const up = await cloud.uploads(req.file.path, 'voice');
        audioUrl = up.secure_url || up.url;
      } catch (uploadErr) {
        audioUrl = `/uploads/${req.file.filename}`;
      } finally {
        if (req.file.path && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch (_) {}
        }
      }
    }

    if (!audioUrl) {
      return res.status(400).json({ message: "Audio file or URL is required" });
    }

    // 1. Create a proper Message document
    const newMessage = await Message.create({
      chat: chatId,
      sender: req.user._id,
      audio: audioUrl,
      type: 'voice',
      content: '🎤 Voice Message'
    });

    await newMessage.populate('sender', 'name username avatar');

    // 2. Update Chat's lastMessage
    chat.lastMessage = newMessage._id;
    chat.updatedAt = Date.now();
    await chat.save();

    // 3. Emit real-time socket events to conversation room
    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(String(chatId)).emit('receiveMessage', newMessage);
      io.to(String(chatId)).emit('message:new', newMessage);
    }

    res.status(201).json({ 
      success: true, 
      message: "Voice message sent",
      data: newMessage 
    });

  } catch (error) {
    console.error("Voice message error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.insights = async (req, res) => {
  res.json({
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    views: [5, 8, 9, 20, 15],
  });
};

// Toggle save/bookmark
exports.toggleSave = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ message: 'Invalid post id' });
    
    let record = await Saved.findOne({ user: userId });
    if (!record) {
      record = new Saved({ user: userId, posts: [] });
    }

    const already = record.posts.map(String).includes(String(postId));
    if (already) {
      record.posts = record.posts.filter(p => String(p) !== String(postId));
    } else {
      record.posts.push(postId);
    }
    await record.save();
    return res.json({ saved: !already, count: record.posts.length });
  } catch (err) {
    console.error('toggleSave err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 🔥 UPDATED: Get saved posts for a user with Pagination
exports.getSavedByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page || 0);
    const limit = parseInt(req.query.limit || 12); // Fetch 12 at a time

    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user id' });
    
    // Slice projection for pagination
    const record = await Saved.findOne({ user: userId })
      .populate({
        path: 'posts',
        match: req.query.cursor ? { createdAt: { $lt: new Date(req.query.cursor) } } : {},
        options: { sort: { createdAt: -1 }, limit: limit },
        populate: { path: 'user', select: 'name avatar' }
      });

    const validPosts = (record?.posts || []).filter(post => post !== null);

    return res.json(validPosts);
  } catch (err) {
    console.error('getSavedByUser err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Simple reels placeholder
exports.getReels = async (req, res) => {
  try {
    const reels = await Post.find({ videos: { $exists: true, $ne: [] } }).sort({ createdAt: -1 }).limit(50).populate('user', 'name avatar');
    return res.json(reels);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Simple shop placeholder
exports.getShopItems = async (req, res) => {
  try {
    const items = [
      { id: 'p1', title: 'Sponsored pack', price: 499, currency: 'INR' },
      { id: 'p2', title: 'Creator badge', price: 199, currency: 'INR' },
    ];
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const up = await cloud.uploads(req.file.path, 'general');
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.json({ url: up.secure_url });
      }
    } catch (cloudErr) {
      console.warn('Cloudinary upload fallback to disk:', cloudErr.message);
    }
    const localUrl = `/uploads/${path.basename(req.file.path)}`;
    res.json({ url: localUrl });
  } catch (e) {
    console.error('Upload failed:', e);
    res.status(500).json({ message: 'Upload failed' });
  }
};