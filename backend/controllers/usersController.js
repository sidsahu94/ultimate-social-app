// backend/controllers/usersController.js
const User = require('../models/User');
const cloudinaryUtil = require('../utils/cloudinary');
const path = require('path');

/**
 * Safe cloudinary wrapper used in multiple places.
 * Returns { url, error } where url is either cloud url or local fallback.
 */
const safeUploadToCloudinary = async (filePath) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('CLOUDINARY env not configured');
    }
    const res = await cloudinaryUtil.uploads(filePath);
    return { url: res.secure_url };
  } catch (err) {
    const localUrl = `/uploads/${path.basename(filePath)}`;
    console.error('Cloudinary upload failed, using local file. Error:', err.message || err);
    return { url: localUrl, error: err };
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    res.json(req.user);
  } catch (err) {
    console.error('getMe err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/:id  (returns user plus flags isMe and isFollowing)
exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // compute flags
    const result = { ...user };
    result.isMe = req.user && req.user._id.toString() === user._id.toString();
    result.isFollowing = false;
    if (req.user) {
      // if user.followers is an array of ObjectIds (strings after .lean)
      const followers = (user.followers || []).map(String);
      result.isFollowing = followers.includes(req.user._id.toString());
    }

    res.json(result);
  } catch (err) {
    console.error('getUserById err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    // only allow updating own profile unless admin
    if (req.user._id.toString() !== req.params.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.website !== undefined) updates.website = req.body.website;
    if (req.body.location !== undefined) updates.location = req.body.location;

    if (req.files) {
      if (req.files.avatar && req.files.avatar.length) {
        const a = req.files.avatar[0];
        const up = await safeUploadToCloudinary(a.path);
        updates.avatar = up.url;
      }
      if (req.files.coverPhoto && req.files.coverPhoto.length) {
        const c = req.files.coverPhoto[0];
        const upc = await safeUploadToCloudinary(c.path);
        updates.coverPhoto = upc.url;
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('updateProfile err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.followToggle = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (req.user._id.toString() === targetId.toString()) {
      return res.status(400).json({ message: "Can't follow yourself" });
    }

    const me = await User.findById(req.user._id);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const already = me.following.map(String).includes(targetId.toString());
    if (already) {
      me.following = me.following.filter(id => id.toString() !== targetId.toString());
      target.followers = target.followers.filter(id => id.toString() !== me._id.toString());
    } else {
      me.following.push(targetId);
      target.followers.push(me._id);
    }

    await me.save();
    await target.save();

    // Return concise follower/following counts and new follow state
    res.json({
      success: true,
      me: { _id: me._id, followingCount: me.following.length },
      target: { _id: target._id, followersCount: target.followers.length },
    });
  } catch (err) {
    console.error('followToggle err', err);
    res.status(500).json({ message: 'Server error' });
  }
};
