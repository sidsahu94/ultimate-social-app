// backend/controllers/usersController.js
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Story = require('../models/Story');
const Notification = require('../models/Notification');
const GameScore = require('../models/GameScore');
const Product = require('../models/Product');
const FollowRequest = require('../models/FollowRequest');
const cloudinaryUtil = require('../utils/cloudinary');
const createNotification = require('../utils/notify'); // Helper
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// --- Helper: Calculate Profile Completion ---
const calculateCompletion = (user) => {
    let score = 20; // Base score for signing up
    if (user.avatar) score += 20;
    if (user.bio) score += 20;
    if (user.location) score += 10;
    if (user.website) score += 10;
    if (user.coverPhoto) score += 20;
    return Math.min(score, 100);
};

// Helper: upload handler (cloudinary fallback -> local file)
const handleUpload = async (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    const file = files[fieldName][0];
    try {
      const res = await cloudinaryUtil.uploads(file.path);
      try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
      return res.secure_url;
    } catch (e) {
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
    const targetId = req.params.id;
    const user = await User.findById(targetId).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Privacy/Block Check
    if (req.user) {
        const me = await User.findById(req.user._id).select('blockedUsers');
        
        // Case 1: They blocked me (Hide profile completely)
        const targetUserDoc = await User.findById(targetId).select('blockedUsers');
        if (targetUserDoc?.blockedUsers?.includes(req.user._id)) {
            return res.status(404).json({ message: 'User not found' }); 
        }

        // Case 2: I blocked them
        if (me.blockedUsers.includes(targetId)) {
            user.isBlockedByMe = true;
        }
    }

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

// PUT /users/:id (Profile Update)
exports.updateProfile = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const deleteOldFile = (oldUrl) => {
        if (oldUrl && oldUrl.startsWith('/uploads')) {
            try {
                const p = path.join(__dirname, '..', oldUrl); 
                if (fs.existsSync(p)) fs.unlinkSync(p);
            } catch(e) { console.warn('Cleanup failed:', e.message); }
        }
    };

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.website !== undefined) updates.website = req.body.website;
    if (req.body.location !== undefined) updates.location = req.body.location;

    if (req.body['socialLinks[twitter]'] || req.body['socialLinks[instagram]'] || req.body['socialLinks[linkedin]']) {
      updates.socialLinks = {
        twitter: req.body['socialLinks[twitter]'] || '',
        instagram: req.body['socialLinks[instagram]'] || '',
        linkedin: req.body['socialLinks[linkedin]'] || ''
      };
    }

    if (req.body.isPrivate !== undefined) {
      updates.privateProfile = (req.body.isPrivate === 'true' || req.body.isPrivate === true);
    }

    const currentUser = await User.findById(req.params.id);

    // Handle Delete Avatar Flag
    if (req.body.deleteAvatar === 'true') {
        if (currentUser.avatar) deleteOldFile(currentUser.avatar);
        updates.avatar = ''; 
    }

    if (req.files) {
      const avatarUrl = await handleUpload(req.files, 'avatar');
      if (avatarUrl) {
          if (currentUser.avatar && req.body.deleteAvatar !== 'true') deleteOldFile(currentUser.avatar); 
          updates.avatar = avatarUrl;
      }

      const coverUrl = await handleUpload(req.files, 'coverPhoto');
      if (coverUrl) {
          if (currentUser.coverPhoto) deleteOldFile(currentUser.coverPhoto); 
          updates.coverPhoto = coverUrl;
      }
    }

    // 🔥 Recalculate Completion Score
    const merged = { ...currentUser.toObject(), ...updates };
    updates.profileCompletion = calculateCompletion(merged);

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (e) {
    console.error('updateProfile error', e);
    res.status(500).json({ message: 'Update failed' });
  }
};

// PUT /users/status (Update User Status like "Working", "Online")
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body; 
        if (!status) return res.status(400).json({ message: 'Status required' });
        
        const user = await User.findByIdAndUpdate(
            req.user._id, 
            { userStatus: status }, 
            { new: true }
        ).select('userStatus');
        
        res.json(user);
    } catch (e) {
        res.status(500).json({ message: 'Error updating status' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        const user = await User.findById(req.user._id);
        
        // 1. Notification Settings
        if (settings.likes !== undefined || settings.comments !== undefined || settings.follows !== undefined) {
             user.notificationSettings = { ...user.notificationSettings, ...settings };
        }

        // 🔥 2. Security Settings (2FA)
        if (req.body.is2FAEnabled !== undefined) {
            user.is2FAEnabled = req.body.is2FAEnabled;
        }

        await user.save();
        
        // Return combined settings
        res.json({
            notificationSettings: user.notificationSettings,
            is2FAEnabled: user.is2FAEnabled
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error updating settings' });
    }
};
// PUT /users/pin (Pin a post)
exports.pinPost = async (req, res) => {
    try {
        const { postId } = req.body;
        const user = await User.findById(req.user._id);
        
        if (user.pinnedPost && String(user.pinnedPost) === String(postId)) {
            user.pinnedPost = null; // Unpin
        } else {
            user.pinnedPost = postId; // Pin
        }
        
        await user.save();
        res.json({ pinnedPost: user.pinnedPost });
    } catch (e) {
        res.status(500).json({ message: "Failed to pin post" });
    }
};

// GET /users/search
exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ users: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); 
    const users = await User.find({
      $or: [
        { name: { $regex: regex } },
        { email: { $regex: regex } }
      ]
    }).select('name avatar email isVerified').limit(20);

    res.json({ users });
  } catch (e) {
    res.status(500).json({ message: 'Search error' });
  }
};

// POST/PUT /users/:id/follow
exports.followToggle = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const me = await User.findById(req.user._id);
    
    // Ensure arrays exist
    me.following = me.following || [];
    target.followers = target.followers || [];

    const already = me.following.map(String).includes(String(target._id));
    
    if (already) {
      // Unfollow
      me.following = me.following.filter(id => String(id) !== String(target._id));
      target.followers = target.followers.filter(id => String(id) !== String(me._id));
      await me.save();
      await target.save();
      return res.json({ following: false });
    }

    // Private Profile Logic
    if (target.privateProfile) {
      const existing = await FollowRequest.findOne({ from: me._id, to: target._id, status: 'pending' });
      if (!existing) {
          await FollowRequest.create({ from: me._id, to: target._id });
          await createNotification(req, {
            toUser: target._id,
            type: 'system',
            message: `${me.name} requested to follow you.`,
            data: { link: '/requests' }
          });
      }
      return res.json({ requested: true, following: false });
    }

    // Follow
    me.following.push(target._id);
    target.followers.push(me._id);
    await me.save();
    await target.save();

    await createNotification(req, {
      toUser: target._id,
      type: 'follow',
      message: `${me.name} started following you`,
      data: { link: `/profile/${me._id}` }
    });

    res.json({ following: true });
  } catch (e) {
    console.error('followToggle error', e);
    res.status(500).json({ message: 'Error' });
  }
};

// PUT /users/close-friends
exports.updateCloseFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ids = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    user.closeFriends = ids;
    await user.save();

    const populated = await User.findById(user._id).select('closeFriends').populate('closeFriends', 'name avatar');
    res.json({ success: true, closeFriends: populated.closeFriends || [] });
  } catch (e) {
    res.status(500).json({ message: 'Error updating close friends' });
  }
};

// PUT /users/password
exports.updatePassword = async (req, res) => {
  try {
    const { current, new: newPass } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.password) {
        if (!current) return res.status(400).json({ message: 'Current password required' });
        const isMatch = await bcrypt.compare(current, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });
    }

    if (!newPass || newPass.length < 6) {
        return res.status(400).json({ message: 'New password must be 6+ chars' });
    }

    user.password = await bcrypt.hash(newPass, 12);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
};

// GET /users/:id/followers
exports.getFollowers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    
    const user = await User.findById(req.params.id)
      .select('followers')
      .populate({
        path: 'followers',
        select: 'name avatar role isVerified',
        options: { skip: page * limit, limit: limit }
      });
      
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.followers || []);
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
};

// GET /users/:id/following
exports.getFollowing = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(req.params.id)
      .select('following')
      .populate({
        path: 'following',
        select: 'name avatar role isVerified',
        options: { skip: page * limit, limit: limit }
      });

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.following || []);
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
};

// Follow Requests
exports.getFollowRequests = async (req, res) => {
  try {
    const reqs = await FollowRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reqs);
  } catch (e) {
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
    
    await createNotification(req, {
        toUser: them._id,
        type: 'system',
        message: `${me.name} accepted your follow request.`,
        data: { link: `/profile/${me._id}` }
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
};

exports.declineFollowRequest = async (req, res) => {
  try {
    await FollowRequest.findByIdAndUpdate(req.params.id, { status: 'declined' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
};

// 🔥 DELETE ACCOUNT (Soft Delete)
exports.deleteMe = async (req, res) => {
  try {
    const userId = req.user._id;

    // Soft Delete
    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
      refreshToken: null // Force logout
    });

    // Force Logout socket event
    const io = req.app.get('io');
    if (io) io.to(userId.toString()).emit('auth:force_logout');

    res.json({ message: 'Account deactivated. You can restore it within 30 days.' });
  } catch (e) {
    console.error('deleteMe error', e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const me = await User.findById(req.user._id);
    
    const isBlocked = me.blockedUsers.includes(targetId);
    if (isBlocked) {
      me.blockedUsers = me.blockedUsers.filter(id => String(id) !== String(targetId));
    } else {
      me.blockedUsers.push(targetId);
      // Unfollow mutuals
      me.following = me.following.filter(id => String(id) !== String(targetId));
      me.followers = me.followers.filter(id => String(id) !== String(targetId));
    }
    
    await me.save();
    res.json({ success: true, blocked: !isBlocked });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
};
// ... existing imports

// 🔥 NEW: Get list of blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name avatar');
    res.json(user.blockedUsers || []);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching blocked users' });
  }
};


// 🔥 NEW: Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // Check current
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    // Update
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    
    res.json({ message: 'Password updated' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔥 NEW: Delete Account (Soft Delete)
exports.deleteAccount = async (req, res) => {
  try {
    // Soft delete: keep data for legal reasons or recovery, but hide from app
    await User.findByIdAndUpdate(req.user._id, { 
        isDeleted: true, 
        email: `deleted_${req.user._id}_${Date.now()}@deleted.com` // Free up email
    });
    
    res.json({ message: 'Account deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getBlockedUsers = exports.getBlockedUsers;

// Aliases
exports.approveRequest = exports.acceptFollowRequest;
exports.rejectRequest = exports.declineFollowRequest;
