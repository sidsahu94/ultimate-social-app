const Reel = require('../models/Reel');
const fs = require('fs');
const path = require('path');
const cloudinaryUtil = require('../utils/cloudinary');

// Enhanced Safe Upload
const safeUpload = async (filePath) => {
  try {
    // Ensure resource_type is video
    const r = await cloudinaryUtil.uploads(filePath, 'social_reels', { resource_type: 'video' });
    return r.secure_url;
  } catch (e) {
    console.error("Reel upload error", e);
    // Fallback for local dev if cloudinary fails
    return `/uploads/${path.basename(filePath)}`;
  } finally { 
    try { fs.unlinkSync(filePath); } catch(e){} 
  }
};

exports.uploadReel = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
        // Handle case where multer might put it in req.file or req.files based on config
        if (!req.file) return res.status(400).json({ message: 'No video file provided' });
    }
    
    // Handle Multer single vs array
    const file = req.files ? req.files[0] : req.file;

    const url = await safeUpload(file.path);
    
    const reel = new Reel({ 
        user: req.user._id, 
        videoUrl: url, 
        caption: req.body.caption || '',
        tags: [] // Parse tags if needed
    });
    
    await reel.save();
    await reel.populate('user', 'name avatar');
    
    res.status(201).json(reel);
  } catch (err) { 
    console.error(err);
    res.status(500).json({ message: err.message }); 
  }
};

exports.feed = async (req, res) => {
  try {
    // Randomize feed or cursor pagination for "TikTok" feel
    const reels = await Reel.find()
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(20);
    
    // Check if liked by me (basic check)
    const reelsWithMeta = reels.map(r => ({
        ...r.toObject(),
        isLikedByMe: r.likes.includes(req.user?._id)
    }));

    res.json(reelsWithMeta);
  } catch (err) { 
      res.status(500).json({ message: err.message }); 
  }
};