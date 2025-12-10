// backend/controllers/extraController.js
const User = require('../models/User');
const Chat = require('../models/Chat');
const Post = require('../models/Post');
const cloud = require('../utils/cloudinary');
const Saved = require('../models/Saved');

const mongoose = require('mongoose');

exports.aiAvatar = async (req, res) => {
  const up = await cloud.uploads(req.file.path, 'avatars');
  req.user.avatar = up.secure_url;
  await req.user.save();
  res.json({ url: up.secure_url });
};

exports.voice = async (req, res) => {
  const chat = await Chat.findById(req.params.chatId);
  const up = await cloud.uploads(req.file.path, 'voice');
  chat.messages.push({ sender: req.user._id, audio: up.secure_url });
  await chat.save();
  res.json(chat);
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
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

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

// Get saved posts for a user 
exports.getSavedByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user id' });
    const record = await Saved.findOne({ user: userId }).populate({
      path: 'posts',
      // Ensure post content/user details are populated for the frontend to render the PostCard
      populate: { path: 'user', select: 'name avatar' } 
    });
    return res.json(record?.posts || []);
  } catch (err) {
    console.error('getSavedByUser err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// simple reels placeholder (returns posts with videos)
exports.getReels = async (req, res) => {
  try {
    const reels = await Post.find({ videos: { $exists: true, $ne: [] } }).sort({ createdAt: -1 }).limit(50).populate('user', 'name avatar');
    return res.json(reels);
  } catch (err) {
    console.error('getReels err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// simple shop placeholder (returns small demo)
exports.getShopItems = async (req, res) => {
  try {
    // placeholder static demo items
    const items = [
      { id: 'p1', title: 'Sponsored pack', price: 499, currency: 'INR' },
      { id: 'p2', title: 'Creator badge', price: 199, currency: 'INR' },
    ];
    return res.json(items);
  } catch (err) {
    console.error('getShopItems err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};