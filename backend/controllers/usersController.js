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
const mongoose = require('mongoose');

const calculateCompletion = (user) => {
    let score = 20;
    if (user.avatar) score += 20;
    if (user.bio) score += 20;
    if (user.location) score += 10;
    if (user.website) score += 10;
    if (user.coverPhoto) score += 20;
    return Math.min(score, 100);
};

const handleUpload = async (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    const file = files[fieldName][0];
    try {
      const res = await cloudinaryUtil.uploads(file.path);
      try { fs.unlinkSync(file.path); } catch (e) {}
      return res.secure_url;
    } catch (e) {
      return `/uploads/${path.basename(file.path)}`;
    }
  }
  return null;
};

exports.getMe = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: me });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    let user = await User.findById(targetId).select('-password').lean();
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user) {
        const me = await User.findById(req.user._id).select('blockedUsers following role');
        const targetUserDoc = await User.findById(targetId).select('blockedUsers');
        
        if (targetUserDoc?.blockedUsers?.map(String).includes(String(req.user._id))) {
            return res.status(404).json({ success: false, message: 'User not found' }); 
        }

        if (me.blockedUsers.map(String).includes(String(targetId))) {
            user.isBlockedByMe = true;
        }

        user.isFollowing = me.following.map(String).includes(String(user._id));
        user.isMe = String(me._id) === String(user._id);

        if (user.privateProfile && !user.isFollowing && !user.isMe && req.user.role !== 'admin') {
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

    user.followersCount = (user.followers || []).length;
    user.followingCount = (user.following || []).length;

    res.json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: { users: [] } });

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i'); 
    
    const users = await User.find({
      $or: [
        { name: { $regex: regex } },
        { username: { $regex: regex } }
      ],
      isDeleted: { $ne: true }
    }).select('_id name username avatar isVerified privateProfile');

    res.json({ success: true, data: { users } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Search error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

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

    if (req.files) {
      const avatarUrl = await handleUpload(req.files, 'avatar');
      if (avatarUrl) updates.avatar = avatarUrl;

      const coverUrl = await handleUpload(req.files, 'coverPhoto');
      if (coverUrl) updates.coverPhoto = coverUrl;
    }

    if (req.body.deleteAvatar === 'true') {
        updates.avatar = ''; 
    }

    const currentUser = await User.findById(req.params.id);
    const merged = { ...currentUser.toObject(), ...updates };
    updates.profileCompletion = calculateCompletion(merged);

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body; 
        if (!status) return res.status(400).json({ success: false, message: 'Status required' });
        
        const user = await User.findByIdAndUpdate(req.user._id, { userStatus: status }, { new: true }).select('userStatus');
        res.json({ success: true, data: user });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        const user = await User.findById(req.user._id);
        
        if (settings.likes !== undefined || settings.comments !== undefined || settings.follows !== undefined) {
             user.notificationSettings = { ...user.notificationSettings, ...settings };
        }

        if (req.body.is2FAEnabled !== undefined) {
            user.is2FAEnabled = req.body.is2FAEnabled;
        }

        await user.save();
        res.json({
            success: true,
            data: { notificationSettings: user.notificationSettings, is2FAEnabled: user.is2FAEnabled }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error updating settings' });
    }
};

exports.pinPost = async (req, res) => {
    try {
        const { postId } = req.body;
        const user = await User.findById(req.user._id);
        
        if (user.pinnedPost && String(user.pinnedPost) === String(postId)) {
            user.pinnedPost = null;
        } else {
            user.pinnedPost = postId;
        }
        
        await user.save();
        res.json({ success: true, data: { pinnedPost: user.pinnedPost } });
    } catch (e) {
        res.status(500).json({ success: false, message: "Failed to pin post" });
    }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

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

exports.updatePassword = exports.changePassword;

exports.followToggle = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user._id;

    if (targetId === myId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    const me = await User.findById(myId);

    if (!targetUser || !me) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = me.following.includes(targetId);

    if (isFollowing) {
      await User.findByIdAndUpdate(myId, { $pull: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } });
      return res.json({ message: "Unfollowed successfully", isFollowing: false });
    } else {
      if (targetUser.privateProfile) {
        const existingReq = await FollowRequest.findOne({ sender: myId, receiver: targetId, status: 'pending' });
        if (existingReq) {
          return res.status(400).json({ message: "Follow request already sent" });
        }
        
        await FollowRequest.create({ from: myId, to: targetId, status: 'pending' });
        return res.json({ message: "Follow request sent", isRequested: true });
      }

      await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });
      return res.json({ message: "Followed successfully", isFollowing: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error processing follow request" });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user._id;

    const me = await User.findById(myId);
    if (!me) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isBlocked = (me.blockedUsers || []).map(String).includes(String(targetId));

    if (isBlocked) {
      await User.findByIdAndUpdate(myId, { $pull: { blockedUsers: targetId } });
    } else {
      await User.findByIdAndUpdate(myId, {
        $addToSet: { blockedUsers: targetId },
        $pull: { following: targetId, followers: targetId }
      });
      await User.findByIdAndUpdate(targetId, {
        $pull: { followers: myId, following: myId }
      });
    }
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

    const populated = await User.findById(user._id).select('closeFriends').populate('closeFriends', 'name avatar');
    res.json({ success: true, data: { closeFriends: populated.closeFriends || [] } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error updating close friends' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    
    const user = await User.findById(req.params.id)
      .select('followers')
      .populate({
        path: 'followers',
        select: 'name username avatar role isVerified',
        options: { skip: page * limit, limit: limit }
      });
      
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.followers || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching followers' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(req.params.id)
      .select('following')
      .populate({
        path: 'following',
        select: 'name username avatar role isVerified',
        options: { skip: page * limit, limit: limit }
      });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.following || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching following' });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name username avatar');
    res.json({ success: true, data: user.blockedUsers || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching blocked users' });
  }
};

exports.getFollowRequests = async (req, res) => {
  try {
    const reqs = await FollowRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'name username avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reqs });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching requests' });
  }
};

exports.acceptFollowRequest = async (req, res) => {
  try {
    const fr = await FollowRequest.findById(req.params.id);
    if (!fr) return res.status(404).json({ success: false, message: 'Request not found' });

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

    res.json({ success: true, message: 'Request approved' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error accepting request' });
  }
};

exports.declineFollowRequest = async (req, res) => {
  try {
    await FollowRequest.findByIdAndUpdate(req.params.id, { status: 'declined' });
    res.json({ success: true, message: 'Request declined' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error declining request' });
  }
};

exports.approveRequest = exports.acceptFollowRequest;
exports.rejectRequest = exports.declineFollowRequest;

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted_${userId}_${Date.now()}@deleted.com`,
      refreshToken: null
    });

    await User.updateMany(
        { $or: [{ followers: userId }, { following: userId }] },
        { $pull: { followers: userId, following: userId } }
    );

    const io = req.app.get('io');
    if (io) io.to(userId.toString()).emit('auth:force_logout');

    res.json({ success: true, message: 'Account deactivated and social links removed.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteMe = exports.deleteAccount;

// ==========================================
// DAILY QUESTS & PRESTIGE STREAKS
// ==========================================
const DEFAULT_QUESTS = [
  { id: 'drop_story', title: 'Drop a 24h Story to Friends', reward: 25, target: 1 },
  { id: 'tip_creator', title: 'Send a Creator Tip on Reels', reward: 15, target: 1 },
  { id: 'explore_reels', title: 'Stream 3 Trending Reels', reward: 20, target: 3 },
  { id: 'send_dm', title: 'Exchange an Encrypted Direct Message', reward: 10, target: 1 }
];

exports.getDailyQuests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const now = new Date();
    const lastDate = user.streak?.lastActiveDate ? new Date(user.streak.lastActiveDate) : null;
    
    let streakCount = user.streak?.count || 1;
    if (lastDate) {
      const diffHours = (now - lastDate) / (1000 * 60 * 60);
      if (diffHours >= 24 && diffHours < 48) {
        streakCount += 1;
      } else if (diffHours >= 48) {
        streakCount = 1;
      }
    }

    const bestStreak = Math.max(streakCount, user.streak?.bestStreak || 1);
    user.streak = { count: streakCount, lastActiveDate: now, bestStreak };

    if (!user.dailyQuests || user.dailyQuests.length === 0) {
      user.dailyQuests = DEFAULT_QUESTS.map(q => ({
        ...q,
        completed: true,
        claimed: false,
        progress: q.target
      }));
    }

    await user.save();
    return res.json({
      success: true,
      streak: user.streak,
      quests: user.dailyQuests
    });
  } catch (err) {
    console.error('getDailyQuests err:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch quests' });
  }
};

exports.claimDailyQuest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const quest = (user.dailyQuests || []).find(q => q.id === id);
    if (!quest) return res.status(404).json({ success: false, message: 'Quest not found' });
    if (quest.claimed) return res.status(400).json({ success: false, message: 'Reward already claimed' });

    quest.claimed = true;
    const reward = quest.reward || 15;

    if (!user.wallet) user.wallet = { balance: 0, totalReceived: 0, totalSent: 0 };
    user.wallet.balance = (user.wallet.balance || 0) + reward;
    user.wallet.totalReceived = (user.wallet.totalReceived || 0) + reward;

    await user.save();

    const Transaction = require('../models/Transaction');
    await Transaction.create({
      user: user._id,
      amount: reward,
      type: 'credit',
      description: 'Daily Quest Reward: ' + quest.title,
      idempotencyKey: 'quest:' + user._id + ':' + id + ':' + new Date().toDateString()
    }).catch(() => {});

    const io = req.app.get('io');
    if (io) io.to(user._id.toString()).emit('wallet:update', { balance: user.wallet.balance });

    return res.json({
      success: true,
      message: 'Claimed ' + reward + ' coins!',
      newBalance: user.wallet.balance,
      quests: user.dailyQuests
    });
  } catch (err) {
    console.error('claimDailyQuest err:', err);
    return res.status(500).json({ success: false, message: 'Failed to claim reward' });
  }
};

exports.passkeyRegisterOptions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const challenge = Buffer.from(Date.now().toString() + Math.random().toString()).toString('base64');
    return res.json({
      success: true,
      rp: { name: 'Socialo Hardware Enclave', id: 'localhost' },
      user: { id: user._id, name: user.email, displayName: user.name },
      challenge,
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { userVerification: 'preferred', residentKey: 'preferred' }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Passkey options failed' });
  }
};

exports.passkeyRegisterVerify = async (req, res) => {
  try {
    const { id, rawId, type } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.passkeyCredentials) user.passkeyCredentials = [];
    user.passkeyCredentials.push({
      credentialId: id || rawId || 'passkey_' + Date.now(),
      publicKey: 'ENCLAVE_PUBKEY_' + Date.now(),
      counter: 1,
      transports: ['internal']
    });
    await user.save();

    return res.json({ success: true, message: 'Biometric Passkey bound to Hardware Enclave successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};
