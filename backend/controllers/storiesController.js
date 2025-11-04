// backend/controllers/storiesController.js
const Story = require('../models/Story');
const cloudinaryUtil = require('../utils/cloudinary');

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
      type: req.file.mimetype.includes('video') ? 'video' : 'image',
      viewers: [],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await story.save();
    res.status(201).json(story);
  } catch (err) {
    console.error('createStory err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Get all active (non-expired) stories
 */
exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find({ expiresAt: { $gt: Date.now() } })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(stories);
  } catch (err) {
    console.error('getStories err', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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
