const Reel = require('../models/Reel');
const fs = require('fs');
const path = require('path');
const cloudinaryUtil = require('../utils/cloudinary');

// ---------------- SAFE UPLOAD ----------------
const safeUpload = async (filePath) => {
  try {
    const r = await cloudinaryUtil.uploads(
      filePath,
      'social_reels',
      { resource_type: 'video' }
    );
    return r.secure_url;
  } catch (e) {
    console.error('Reel upload error', e);
    return `/uploads/${path.basename(filePath)}`;
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
};

// ---------------- UPLOAD REEL ----------------
exports.uploadReel = async (req, res) => {
  try {
    if (!req.files?.length && !req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const file = req.files ? req.files[0] : req.file;
    const url = await safeUpload(file.path);

    const reel = new Reel({
      user: req.user._id,
      videoUrl: url,
      caption: req.body.caption || '',
      tags: [],
    });

    await reel.save();
    await reel.populate('user', 'name avatar');

    res.status(201).json(reel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------- FEED ----------------
exports.feed = async (req, res) => {
  try {
    const reels = await Reel.find()
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    const reelsWithMeta = reels.map((r) => ({
      ...r.toObject(),
      isLikedByMe: req.user
        ? r.likes.some((u) => u.toString() === req.user._id.toString())
        : false,
    }));

    res.json(reelsWithMeta);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- LIKE / UNLIKE REEL ----------------
exports.likeReel = async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const uid = req.user._id.toString();
    const index = reel.likes.findIndex(
      (u) => u.toString() === uid
    );

    if (index === -1) {
      reel.likes.push(req.user._id);
    } else {
      reel.likes.splice(index, 1);
    }

    await reel.save();
    res.json({ success: true, likes: reel.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
// ... existing imports

// ---------------- INCREMENT VIEW ----------------
exports.viewReel = async (req, res) => {
  try {
    const { id } = req.params;
    // $inc is atomic and efficient
    await Reel.findByIdAndUpdate(id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) {
    // Fail silently for analytics
    res.status(200).json({ success: false }); 
  }
};