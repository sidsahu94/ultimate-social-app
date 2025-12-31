// backend/controllers/usersController.js
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Story = require('../models/Story');
const FollowRequest = require('../models/FollowRequest');
const GameScore = require('../models/GameScore');
const Product = require('../models/Product');
const cloudinaryUtil = require('../utils/cloudinary');
const createNotification = require('../utils/notify'); // 🔥 Import Notification Utility
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

    // 🔥 FIX: Privacy/Block Check
    // If I am logged in, check if I am blocked by them OR if I blocked them
    if (req.user) {
        const me = await User.findById(req.user._id).select('blockedUsers');
        
        // Case 1: They blocked me (Hide profile completely)
        // (Assuming 'user' model has blockedUsers populated or we check raw array)
        const targetUserDoc = await User.findById(targetId).select('blockedUsers');
        if (targetUserDoc?.blockedUsers?.includes(req.user._id)) {
            return res.status(404).json({ message: 'User not found' }); // Standard practice: simulate 404
        }

        // Case 2: I blocked them (Show limited view or "You blocked this user")
        if (me.blockedUsers.includes(targetId)) {
            user.isBlockedByMe = true;
        }
    }

    // Logic for "isFollowing" and "isMe"
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

// PUT /users/:id (profile update)
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
          deleteOldFile(currentUser.coverPhoto); 
          updates.coverPhoto = coverUrl;
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (e) {
    console.error('updateProfile error', e);
    res.status(500).json({ message: 'Update failed' });
  }
};

// GET /users/search?q=...
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
    console.error('searchUsers error', e);
    res.status(500).json({ message: 'Search error' });
  }
};

// POST/PUT /users/:id/follow - toggle follow with Persistent Notification
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
      // Unfollow Logic
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
          // Notify target of request
          await createNotification(req, {
            toUser: target._id,
            type: 'system', // or specific 'request' type
            message: `${me.name} requested to follow you.`,
            data: { link: '/requests' } // Deep link to requests page
          });
      }
      return res.json({ requested: true, following: false });
    }

    // Follow Logic
    me.following.push(target._id);
    target.followers.push(me._id);
    await me.save();
    await target.save();

    // 🔥 FIX: Persistent Notification (DB + Socket)
    await createNotification(req, {
      toUser: target._id,
      type: 'follow',
      message: `${me.name} started following you`,
      data: { 
        link: `/profile/${me._id}` 
      }
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

    // 🔥 FIX: Allow setting password if none exists (Google Users)
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
    console.error('updatePassword error', e);
    res.status(500).json({ message: 'Error' });
  }
};

// GET /users/:id/followers (Paginated)
exports.getFollowers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    
    // 🔥 FIX: Pagination via populate options
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

// GET /users/:id/following (Paginated)
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

// Follow request handlers
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
    
    // Notify requester
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

// 🔥 DELETE ACCOUNT (Deep Clean)
exports.deleteMe = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Content Cleanup
    await Post.deleteMany({ user: userId });
    await Comment.deleteMany({ user: userId });
    await Story.deleteMany({ user: userId });
    
    // 2. Gamification & Market Cleanup
    await GameScore.deleteMany({ user: userId });
    await Product.deleteMany({ owner: userId }); 

    // 3. Social Cleanup (Pull ID from other users' arrays)
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    );

    // 4. Remove Likes/Reactions on other posts
    await Post.updateMany({ likes: userId }, { $pull: { likes: userId } });

    // 5. Notifications
    await Notification.deleteMany({ $or: [{ user: userId }, { actor: userId }] });

    // 6. Delete Account
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account and all associated data deleted successfully' });
  } catch (e) {
    console.error('deleteMe error', e);
    res.status(500).json({ message: 'Server error during account deletion' });
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
      // Unfollow mutuals on block
      me.following = me.following.filter(id => String(id) !== String(targetId));
      me.followers = me.followers.filter(id => String(id) !== String(targetId));
    }
    
    await me.save();
    res.json({ success: true, blocked: !isBlocked });
  } catch (e) {
    res.status(500).json({ message: 'Error' });
  }
};

// Aliases
exports.approveRequest = exports.acceptFollowRequest;
exports.rejectRequest = exports.declineFollowRequest;