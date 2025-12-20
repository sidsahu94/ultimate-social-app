// backend/controllers/usersController.js
const User = require('../models/User');
const FollowRequest = require('../models/FollowRequest');
const cloudinaryUtil = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Helper: upload handler (cloudinary fallback -> local file)
const handleUpload = async (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    const file = files[fieldName][0];
    try {
      const res = await cloudinaryUtil.uploads(file.path);
      // remove local temp file
      try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
      return res.secure_url;
    } catch (e) {
      // fallback to local uploads path
      return `/uploads/${path.basename(file.path)}`;
    }
  }
  return null;
};

// GET /users/me
exports.getMe = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('-password');
    res.json(me);
  } catch (e) {
    console.error('getMe error', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const me = req.user ? await User.findById(req.user._id) : null;
    const isFollowing = me ? (me.following || []).map(String).includes(String(user._id)) : false;
    const isMe = me ? String(me._id) === String(user._id) : false;

    res.json({
      ...user,
      isFollowing,
      isMe,
      followersCount: (user.followers || []).length,
      followingCount: (user.following || []).length,
    });
  } catch (e) {
    console.error('getUserById error', e);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /users/:id (profile update) - robust file handling + social links
exports.updateProfile = async (req, res) => {
  try {
    // permission check: only owner or admin
    if (req.user._id.toString() !== req.params.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.website !== undefined) updates.website = req.body.website;
    if (req.body.location !== undefined) updates.location = req.body.location;

    // Social links support (form-data flattened keys)
    if (req.body['socialLinks[twitter]'] || req.body['socialLinks[instagram]'] || req.body['socialLinks[linkedin]']) {
      updates.socialLinks = {
        twitter: req.body['socialLinks[twitter]'] || '',
        instagram: req.body['socialLinks[instagram]'] || '',
        linkedin: req.body['socialLinks[linkedin]'] || ''
      };
    }

    // Private profile boolean (handle strings from form-data)
    if (req.body.isPrivate !== undefined) {
      updates.privateProfile = (req.body.isPrivate === 'true' || req.body.isPrivate === true);
    }

    // Files (avatar, coverPhoto)
    if (req.files) {
      const avatarUrl = await handleUpload(req.files, 'avatar');
      if (avatarUrl) updates.avatar = avatarUrl;

      const coverUrl = await handleUpload(req.files, 'coverPhoto');
      if (coverUrl) updates.coverPhoto = coverUrl;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (e) {
    console.error('updateProfile error', e);
    res.status(500).json({ message: 'Update failed' });
  }
};

// GET /users/search?q=...
// Robust Regex search fallback (prevents "bad format" from text index)
exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ users: [] });

    // Use safe regex
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // escape user input
    const users = await User.find({
      $or: [
        { name: { $regex: regex } },
        { email: { $regex: regex } }
      ]
    }).select('name avatar email isVerified').limit(20);

    res.json({ users });
  } catch (e) {
    console.error('searchUsers error', e);
    res.status(500).json({ message: 'Search error' });
  }
};

// POST/PUT /users/:id/follow - toggle follow
exports.followToggle = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const me = await User.findById(req.user._id);
    // ensure arrays
    me.following = me.following || [];
    target.followers = target.followers || [];

    const already = me.following.map(String).includes(String(target._id));
    if (already) {
      me.following = me.following.filter(id => String(id) !== String(target._id));
      target.followers = target.followers.filter(id => String(id) !== String(me._id));
      await me.save();
      await target.save();
      return res.json({ following: false });
    }

    // If target is private, create a follow request instead (optional)
    if (target.privateProfile) {
      const existing = await FollowRequest.findOne({ from: me._id, to: target._id, status: 'pending' });
      if (!existing) await FollowRequest.create({ from: me._id, to: target._id });
      return res.json({ requested: true, following: false });
    }

    me.following.push(target._id);
    target.followers.push(me._id);
    await me.save();
    await target.save();

    // optional: emit notification via io
    const io = req.app.get('io');
    if (io) {
      io.to(String(target._id)).emit('notification', {
        type: 'follow',
        message: `${me.name} followed you`,
        actor: { _id: me._id, name: me.name, avatar: me.avatar }
      });
    }

    res.json({ following: true });
  } catch (e) {
    console.error('followToggle error', e);
    res.status(500).json({ message: 'Error' });
  }
};

// PUT /users/close-friends - update array of IDs
exports.updateCloseFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ids = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    user.closeFriends = ids;
    await user.save();

    // populate minimal user info for client convenience
    const populated = await User.findById(user._id).select('closeFriends').populate('closeFriends', 'name avatar');
    res.json({ success: true, closeFriends: populated.closeFriends || [] });
  } catch (e) {
    console.error('updateCloseFriends error', e);
    res.status(500).json({ message: 'Error updating close friends' });
  }
};

// PUT /users/password
exports.updatePassword = async (req, res) => {
  try {
    const { current, new: newPass } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.password) {
      return res.status(400).json({ message: 'Password change not applicable for this account' });
    }

    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect password' });

    user.password = await bcrypt.hash(newPass, 12);
    await user.save();

    res.json({ message: 'Password updated' });
  } catch (e) {
    console.error('updatePassword error', e);
    res.status(500).json({ message: 'Error' });
  }
};

// GET lists (followers/following)
exports.getFollowers = async (req, res) => {
  try {
    const u = await User.findById(req.params.id).populate('followers', 'name avatar');
    res.json(u?.followers || []);
  } catch (e) {
    console.error('getFollowers error', e);
    res.status(500).json({ message: 'Error' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const u = await User.findById(req.params.id).populate('following', 'name avatar');
    res.json(u?.following || []);
  } catch (e) {
    console.error('getFollowing error', e);
    res.status(500).json({ message: 'Error' });
  }
};

// Follow request handlers
exports.getFollowRequests = async (req, res) => {
  try {
    const reqs = await FollowRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reqs);
  } catch (e) {
    console.error('getFollowRequests error', e);
    res.status(500).json({ message: 'Error' });
  }
};

exports.acceptFollowRequest = async (req, res) => {
  try {
    const fr = await FollowRequest.findById(req.params.id);
    if (!fr) return res.status(404).json({ message: 'Not found' });

    const me = await User.findById(req.user._id);
    const them = await User.findById(fr.from);

    if (!me.followers.map(String).includes(String(them._id))) me.followers.push(them._id);
    if (!them.following.map(String).includes(String(me._id))) them.following.push(me._id);

    fr.status = 'accepted';
    await Promise.all([fr.save(), me.save(), them.save()]);
    res.json({ ok: true });
  } catch (e) {
    console.error('acceptFollowRequest error', e);
    res.status(500).json({ message: 'Error' });
  }
};

exports.declineFollowRequest = async (req, res) => {
  try {
    await FollowRequest.findByIdAndUpdate(req.params.id, { status: 'declined' });
    res.json({ ok: true });
  } catch (e) {
    console.error('declineFollowRequest error', e);
    res.status(500).json({ message: 'Error' });
  }
};

// aliases
exports.approveRequest = exports.acceptFollowRequest;
exports.rejectRequest = exports.declineFollowRequest;
