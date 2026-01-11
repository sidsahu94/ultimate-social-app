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

    // Upload to Cloudinary
    const uploadResult = await cloudinaryUtil.uploads(req.file.path);
    
    const story = new Story({
      user: req.user._id,
      media: uploadResult.secure_url,
      type: req.file.mimetype.includes('video') ? 'video' : 'image',
      caption: req.body.caption || '', 
      color: req.body.color || '#ffffff',
      privacy: req.body.privacy || 'public', // 'public' or 'close_friends'
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
    });

    await story.save();

    // Cleanup local file
    try { fs.unlinkSync(req.file.path); } catch (e) {}

    res.status(201).json(story);
  } catch (err) {
    console.error('createStory err', err);
    // Cleanup on error
    if (req.file) try { fs.unlinkSync(req.file.path); } catch (e) {}
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GET STORIES FEED (Smart Filter) ---
exports.getStories = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    // 1. Get List of users I follow
    const me = await User.findById(currentUserId).select('following');
    const followingIds = me.following.map(id => id);
    
    const now = Date.now();

    // 2. Fetch Active Stories (Self + Following)
    // We populate 'closeFriends' to validate permissions
    const stories = await Story.find({
      expiresAt: { $gt: now },
      $or: [
        { user: currentUserId }, // My stories
        { user: { $in: followingIds } } // Friend stories
      ]
    })
    .populate('user', 'name avatar closeFriends')
    .sort({ createdAt: 1 }); // Oldest first (Instagram style) or -1 for Newest

    // 3. Filter "Close Friends" Stories
    // I can see the story IF:
    // a) It is public
    // b) It is mine
    // c) It is 'close_friends' AND I am in the author's 'closeFriends' list
    const visibleStories = stories.filter(story => {
        if (story.user._id.toString() === currentUserId) return true; // Mine
        if (story.privacy === 'public') return true; // Public
        
        // Check Close Friends permission
        if (story.privacy === 'close_friends') {
            const authorCloseFriends = story.user.closeFriends || [];
            return authorCloseFriends.map(String).includes(currentUserId);
        }
        return false;
    });

    // Clean up response (remove the heavy closeFriends array from output)
    const sanitizedStories = visibleStories.map(s => {
        const doc = s.toObject();
        delete doc.user.closeFriends; 
        return doc;
    });

    res.json(sanitizedStories);
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

// --- DELETE STORY ---
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });

    // Check ownership
    if (String(story.user) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized' });
    }

    await Story.findByIdAndDelete(req.params.id);
    res.json({ message: 'Story deleted' });
  } catch (err) {
    console.error('deleteStory err', err);
    res.status(500).json({ message: 'Server error' });
  }
};