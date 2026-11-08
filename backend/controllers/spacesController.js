// backend/controllers/spacesController.js
const Space = require('../models/Space');
const User = require('../models/User');

const spacePopulate = [
  { path: 'host', select: 'name username avatar isVerified role' },
  { path: 'speakers', select: 'name username avatar isVerified role' },
  { path: 'listeners', select: 'name username avatar isVerified' },
  { path: 'handRaises', select: 'name username avatar' },
];

exports.getActiveSpaces = async (req, res) => {
  try {
    const spaces = await Space.find({ isActive: true })
      .sort({ startedAt: -1 })
      .populate(spacePopulate)
      .limit(20)
      .lean();

    res.json({ success: true, count: spaces.length, data: spaces });
  } catch (err) {
    console.error('getActiveSpaces error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch spaces' });
  }
};

exports.createSpace = async (req, res) => {
  try {
    const { title, topic } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Space title is required' });
    }

    const space = await Space.create({
      title: title.trim(),
      topic: (topic || 'Creator Conversation').trim(),
      host: req.user._id,
      speakers: [req.user._id],
      listeners: [],
      handRaises: [],
      isActive: true,
      startedAt: new Date(),
    });

    const populated = await Space.findById(space._id).populate(spacePopulate);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('createSpace error:', err);
    res.status(500).json({ success: false, message: 'Failed to create space' });
  }
};

exports.getSpaceById = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id).populate(spacePopulate);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Space not found' });
    }
    res.json({ success: true, data: space });
  } catch (err) {
    console.error('getSpaceById error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.endSpace = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Space not found' });
    }

    if (String(space.host) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the host can end this space' });
    }

    space.isActive = false;
    space.endedAt = new Date();
    await space.save();

    res.json({ success: true, message: 'Space ended successfully' });
  } catch (err) {
    console.error('endSpace error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
