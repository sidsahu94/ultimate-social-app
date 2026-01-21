// backend/controllers/usersController.js
const User = require('../models/User');
const Post = require('../models/Post');
const FollowRequest = require('../models/FollowRequest');
const Notification = require('../models/Notification');
const cloudinaryUtil = require('../utils/cloudinary');
const createNotification = require('../utils/notify');
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

// --- Helper: Upload Handler (Cloudinary -> Local Fallback) ---
const handleUpload = async (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    const file = files[fieldName][0];
    try {
      const res = await cloudinaryUtil.uploads(file.path);
      try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
      return res.secure_url;
    } catch (e) {
      // If cloudinary fails, return local path relative to server root
      return `/uploads/${path.basename(file.path)}`;
    }
  }
  return null;
};

// =================================================================
// 1. READ OPERATIONS
// =================================================================

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('-password');
    res.json({
        success: true,
        data: me
    });
  } catch (e) {
    console.error('getMe error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const targetId = req.params.id;
    // Use lean() for performance, exclude password
    let user = await User.findById(targetId).select('-password').lean();
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Privacy & Block Checks
    if (req.user) {
        const me = await User.findById(req.user._id).select('blockedUsers following role');
        
        // Case 1: They blocked me (Hide profile completely)
        const targetUserDoc = await User.findById(targetId).select('blockedUsers');
        if (targetUserDoc?.blockedUsers?.map(String).includes(String(req.user._id))) {
            return res.status(404).json({ success: false, message: 'User not found' }); 
        }

        // Case 2: I blocked them
        if (me.blockedUsers.map(String).includes(String(targetId))) {
            user.isBlockedByMe = true;
        }

        // Check Following Status
        user.isFollowing = me.following.map(String).includes(String(user._id));
        user.isMe = String(me._id) === String(user._id);

        // Case 3: Private Profile Restriction
        // If Private AND Not Following AND Not Me AND Not Admin
        if (user.privateProfile && !user.isFollowing && !user.isMe && req.user.role !== 'admin') {
             // Return restricted view
             return res.json({
                 success: true,
                 data: {
                     _id: user._id,
                     name: user.name,
                     avatar: user.avatar,
                     isVerified: user.isVerified,
                     isPrivateRestricted: true,
                     privateProfile: true,
                     followersCount: (user.followers || []).length,
                     followingCount: (user.following || []).length,
                     isFollowing: false,
                     isMe: false
                 }
             });
        }
    } else {
        user.isFollowing = false;
        user.isMe = false;
    }

    // Add Counts
    user.followersCount = (user.followers || []).length;
    user.followingCount = (user.following || []).length;

    res.json({
      success: true,
      data: user
    });
  } catch (e) {
    console.error('getUserById error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/search
exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: { users: [] } });

    // Safe Regex
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i'); 
    
    const users = await User.find({
      $or: [
        { name: { $regex: regex } },
        { email: { $regex: regex } }
      ],
      isDeleted: { $ne: true }
    })
    .select('name avatar email isVerified role')
    .limit(20);

    res.json({ success: true, data: { users } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Search error' });
  }
};

// =================================================================
// 2. PROFILE UPDATES
// =================================================================

// PUT /api/users/:id
exports.updateProfile = async (req, res) => {
  try {
    // Only allow updating own profile unless admin
    if (req.user._id.toString() !== req.params.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.website !== undefined) updates.website = req.body.website;
    if (req.body.location !== undefined) updates.location = req.body.location;

    // Handle Social Links (Parsing from form data keys like 'socialLinks[twitter]')
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

    // Handle File Uploads
    if (req.files) {
      const avatarUrl = await handleUpload(req.files, 'avatar');
      if (avatarUrl) updates.avatar = avatarUrl;

      const coverUrl = await handleUpload(req.files, 'coverPhoto');
      if (coverUrl) updates.coverPhoto = coverUrl;
    }

    // Handle Delete Avatar Flag
    if (req.body.deleteAvatar === 'true') {
        updates.avatar = ''; 
    }

    // Recalculate Completion Score
    const currentUser = await User.findById(req.params.id);
    const merged = { ...currentUser.toObject(), ...updates };
    updates.profileCompletion = calculateCompletion(merged);

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    
    res.json({ success: true, data: user });
  } catch (e) {
    console.error('updateProfile error', e);
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

// PUT /api/users/status
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body; 
        if (!status) return res.status(400).json({ success: false, message: 'Status required' });
        
        const user = await User.findByIdAndUpdate(
            req.user._id, 
            { userStatus: status }, 
            { new: true }
        ).select('userStatus');
        
        res.json({ success: true, data: user });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};

// PUT /api/users/settings/notifications
exports.updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        const user = await User.findById(req.user._id);
        
        // Merge settings
        if (settings.likes !== undefined || settings.comments !== undefined || settings.follows !== undefined) {
             user.notificationSettings = { ...user.notificationSettings, ...settings };
        }

        // Security Settings (2FA)
        if (req.body.is2FAEnabled !== undefined) {
            user.is2FAEnabled = req.body.is2FAEnabled;
        }

        await user.save();
        
        res.json({
            success: true,
            data: {
                notificationSettings: user.notificationSettings,
                is2FAEnabled: user.is2FAEnabled
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error updating settings' });
    }
};

// PUT /api/users/pin
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
        res.json({ success: true, data: { pinnedPost: user.pinnedPost } });
    } catch (e) {
        res.status(500).json({ success: false, message: "Failed to pin post" });
    }
};

// PUT /api/users/password (Change Password)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    // If user has a password (oauth users might not), check it
    if (user.password) {
        if (!currentPassword) return res.status(400).json({ success: false, message: 'Current password required' });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be 6+ chars' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    
    res.json({ success: true, message: 'Password updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update alias for routes using old name
exports.updatePassword = exports.changePassword;

// =================================================================
// 3. SOCIAL GRAPH (Follow/Block)
// =================================================================

// POST/PUT /users/:id/follow
exports.followToggle = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user._id;

    if (!targetId) return res.status(400).json({ message: "Invalid User ID" });
    if (String(targetId) === String(myId)) return res.status(400).json({ message: "Cannot follow yourself" });

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    // Check if already following using an atomic query
    const isFollowing = await User.exists({ _id: myId, following: targetId });

    if (isFollowing) {
      // UNFOLLOW: Atomic Pull
      await Promise.all([
        User.findByIdAndUpdate(myId, { $pull: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $pull: { followers: myId } })
      ]);
      
      return res.json({ following: false });
    } else {
      // FOLLOW: Atomic AddToSet (Prevents duplicates)
      await Promise.all([
        User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } }),
        User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } })
      ]);

      // Send Notification (Fire & Forget to prevent blocking response)
      createNotification(req, {
        toUser: targetId,
        type: 'follow',
        message: `${req.user.name} started following you`,
        data: { link: `/profile/${myId}` }
      }).catch(err => console.error("Notification failed:", err.message));

      return res.json({ following: true });
    }

  } catch (e) {
    console.error('followToggle Critical Error:', e);
    res.status(500).json({ message: 'Server error processing follow request' });
  }
};

// POST /api/users/:id/block
exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const me = await User.findById(req.user._id);
    
    const isBlocked = me.blockedUsers.map(String).includes(String(targetId));
    
    if (isBlocked) {
      // Unblock
      me.blockedUsers = me.blockedUsers.filter(id => String(id) !== String(targetId));
    } else {
      // Block
      me.blockedUsers.push(targetId);
      // Force Unfollow mutuals
      me.following = me.following.filter(id => String(id) !== String(targetId));
      me.followers = me.followers.filter(id => String(id) !== String(targetId));
    }
    
    await me.save();
    res.json({ success: true, data: { blocked: !isBlocked } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error blocking user' });
  }
};

exports.updateCloseFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const ids = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    user.closeFriends = ids;
    await user.save();

    // Return full objects for UI
    const populated = await User.findById(user._id).select('closeFriends').populate('closeFriends', 'name avatar');
    res.json({ success: true, data: { closeFriends: populated.closeFriends || [] } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error updating close friends' });
  }
};

// =================================================================
// 4. LISTS & REQUESTS
// =================================================================

// GET /api/users/:id/followers
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
      
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.followers || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching followers' });
  }
};

// GET /api/users/:id/following
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

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.following || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching following' });
  }
};

// GET /api/users/blocked
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name avatar');
    res.json({ success: true, data: user.blockedUsers || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching blocked users' });
  }
};

// GET /api/users/follow-requests
exports.getFollowRequests = async (req, res) => {
  try {
    const reqs = await FollowRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reqs });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching requests' });
  }
};

// POST /api/users/requests/:id/approve
exports.acceptFollowRequest = async (req, res) => {
  try {
    const fr = await FollowRequest.findById(req.params.id);
    if (!fr) return res.status(404).json({ success: false, message: 'Request not found' });

    const me = await User.findById(req.user._id);
    const them = await User.findById(fr.from);

    // Mutual Link
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

    res.json({ success: true, message: 'Request approved' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error accepting request' });
  }
};

// POST /api/users/requests/:id/reject
exports.declineFollowRequest = async (req, res) => {
  try {
    await FollowRequest.findByIdAndUpdate(req.params.id, { status: 'declined' });
    res.json({ success: true, message: 'Request declined' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error declining request' });
  }
};

// Aliases for legacy routing
exports.approveRequest = exports.acceptFollowRequest;
exports.rejectRequest = exports.declineFollowRequest;

// =================================================================
// 5. ACCOUNT DELETION
// =================================================================

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Soft Delete User
    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted_${userId}_${Date.now()}@deleted.com`, // Free up email
      refreshToken: null // Force logout
    });

    // 2. 🔥 CLEANUP SOCIAL GRAPH
    // Remove this user from everyone's followers/following lists
    await User.updateMany(
        { $or: [{ followers: userId }, { following: userId }] },
        { $pull: { followers: userId, following: userId } }
    );

    // 3. Force Logout socket event
    const io = req.app.get('io');
    if (io) io.to(userId.toString()).emit('auth:force_logout');

    res.json({ success: true, message: 'Account deactivated and social links removed.' });
  } catch (e) {
    console.error('deleteAccount error', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Alias
exports.deleteMe = exports.deleteAccount;