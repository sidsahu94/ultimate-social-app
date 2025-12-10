// backend/controllers/storiesController.js
const Story = require('../models/Story');
const User = require('../models/User');
const cloudinaryUtil = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

/**
 * Create story (multipart single file)
 * Expects file saved by multer on req.file
 */
exports.createStory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No media uploaded' });

    const uploadResult = await cloudinaryUtil.uploads(req.file.path);
    const story = new Story({
      user: req.user._id,
      media: uploadResult.secure_url,
      type: req.file.mimetype && req.file.mimetype.includes('video') ? 'video' : 'image',
      viewers: [],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await story.save();

    // Clean up local file (best-effort)
    try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }

    res.status(201).json(story);
  } catch (err) {
    console.error('createStory err', err);
    // Attempt cleanup if multer file exists
    try { if (req?.file?.path) fs.unlinkSync(req.file.path); } catch (e) {}
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Get all active (non-expired) stories visible to the requesting user.
 *
 * Logic:
 * 1. Fetch stories where privacy/type is 'public'
 * 2. OR type === 'close_friends' AND the requesting user is in that creator's closeFriends list
 * 3. OR it's the requesting user's own story
 *
 * We do an initial DB filter using $or (to reduce data transfer), then do strict server-side filtering
 * using the populated closeFriends field to ensure security.
 */
exports.getStories = async (req, res) => {
  try {
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Authentication required' });

    // Refresh user from DB to obtain an up-to-date following list (safe)
    const me = await User.findById(req.user._id).select('following _id');
    if (!me) return res.status(401).json({ message: 'User not found' });

    // Build a lightweight match: public stories, close_friends stories from people I follow, or my own stories
    const followingIds = (me.following || []).map(id => id);
    const now = Date.now();

    const stories = await Story.find({
      expiresAt: { $gt: now },
      $or: [
        { type: 'public' },
        { type: 'close_friends', user: { $in: followingIds } },
        { user: me._id }
      ]
    })
      .populate('user', 'name avatar closeFriends')
      .sort({ createdAt: -1 });

    // Strict server-side filtering to ensure only legitimately visible stories are returned
    const filtered = stories.filter(s => {
      // If the story belongs to me -> always visible
      if (s.user && s.user._id && s.user._id.equals(me._id)) return true;

      // Public stories are visible
      if (s.type === 'public') return true;

      // Close friends: ensure creator has me in their closeFriends array
      if (s.type === 'close_friends') {
        const closeList = s.user && Array.isArray(s.user.closeFriends) ? s.user.closeFriends : [];
        // closeList may contain ObjectIds -> compare as strings or use equals
        return closeList.some(cf => {
          try {
            if (typeof cf.equals === 'function') return cf.equals(me._id);
            return String(cf) === String(me._id);
          } catch (e) {
            return String(cf) === String(me._id);
          }
        });
      }

      // otherwise not visible
      return false;
    });

    return res.json(filtered);
  } catch (err) {
    console.error('getStories err', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Mark story viewed by current user
 * POST /stories/:id/view
 */
exports.markViewed = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const uid = req.user._id.toString();
    if (!story.viewers.map(String).includes(uid)) {
      story.viewers.push(req.user._id);
      await story.save();
    }
    res.json({ message: 'Viewed' });
  } catch (err) {
    console.error('markViewed err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
