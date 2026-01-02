// backend/controllers/storiesController.js
const Story = require('../models/Story');
const User = require('../models/User');
const cloudinaryUtil = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

// --- UPLOAD STORY ---
exports.createStory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No media uploaded' });

    const uploadResult = await cloudinaryUtil.uploads(req.file.path);
    
    const story = new Story({
      user: req.user._id,
      media: uploadResult.secure_url,
      type: req.file.mimetype.includes('video') ? 'video' : 'image',
      caption: req.body.caption || '', // Optional caption support
      color: req.body.color || '#ffffff', // Optional color
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h Expiry
    });

    await story.save();

    // Cleanup local file
    try { fs.unlinkSync(req.file.path); } catch (e) {}

    res.status(201).json(story);
  } catch (err) {
    console.error('createStory err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GET STORIES FEED (Following + Self) ---
exports.getStories = async (req, res) => {
  try {
    // 1. Get List of users I follow
    const me = await User.findById(req.user._id).select('following');
    const followingIds = me.following.map(id => id);
    
    // 2. Fetch Active Stories (Self + Following)
    const now = Date.now();

    const stories = await Story.find({
      expiresAt: { $gt: now },
      $or: [
        { user: req.user._id }, // My stories
        { user: { $in: followingIds } } // Friend stories
      ]
    })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

    res.json(stories);
  } catch (err) {
    console.error('getStories err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- MARK VIEWED ---
exports.markViewed = async (req, res) => {
  try {
    const { id } = req.params;
    await Story.findByIdAndUpdate(id, { $addToSet: { viewers: req.user._id } });
    res.json({ message: 'Viewed' });
  } catch (err) {
    res.status(500).json({ message: 'Error marking viewed' });
  }
};