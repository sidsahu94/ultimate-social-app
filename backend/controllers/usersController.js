const User = require('../models/User');
const FollowRequest = require('../models/FollowRequest');
const cloudinaryUtil = require('../utils/cloudinary');
const path = require('path');
const bcrypt = require('bcryptjs'); // Added for password update

// Helper for local vs cloud uploads
const safeUploadToCloudinary = async (filePath) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('Cloudinary not config');
    const res = await cloudinaryUtil.uploads(filePath);
    return { url: res.secure_url };
  } catch (err) {
    const localUrl = `/uploads/${path.basename(filePath)}`;
    return { url: localUrl, error: err };
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    // Return current user data (without password)
    const me = await User.findById(req.user._id).select('-password');
    res.json(me);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const meId = req.user?._id?.toString();
    const followers = (user.followers || []).map(String);
    const following = (user.following || []).map(String);

    let followRequests = [];
    // If it's me and I'm private, show my pending requests
    if (meId && meId === String(user._id) && user.privateProfile) {
      const pending = await FollowRequest.find({ to: user._id, status: 'pending' })
        .populate('from', 'name avatar')
        .sort({ createdAt: -1 });
      followRequests = pending.map((r) => ({ _id: r._id, from: r.from, createdAt: r.createdAt }));
    }

    res.json({
      ...user,
      followersCount: followers.length,
      followingCount: following.length,
      isMe: meId === String(user._id),
      isFollowing: meId ? followers.includes(meId) : false,
      followRequests,
    });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.website !== undefined) updates.website = req.body.website;
    if (req.body.location !== undefined) updates.location = req.body.location;
    
    // Handle Boolean for Private Profile
    if (req.body.isPrivate !== undefined) {
      updates.privateProfile = req.body.isPrivate === 'true' || req.body.isPrivate === true;
    }

    if (req.files) {
      if (req.files.avatar?.length) {
        const up = await safeUploadToCloudinary(req.files.avatar[0].path);
        updates.avatar = up.url;
      }
      if (req.files.coverPhoto?.length) {
        const up = await safeUploadToCloudinary(req.files.coverPhoto[0].path);
        updates.coverPhoto = up.url;
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- NEW: Password Update for Settings Page ---
exports.updatePassword = async (req, res) => {
  try {
    const { current, new: newPass } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user.password) {
        // User might have signed up via Google only
        // Allow setting password if they don't have one (optional logic), or require Google auth
        return res.status(400).json({ message: 'You use Google Login. Password change not applicable.' });
    }

    // Verify current
    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

    // Update
    user.password = await bcrypt.hash(newPass, 12);
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.followToggle = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (req.user._id.toString() === targetId) return res.status(400).json({ message: "Can't follow yourself" });

    const me = await User.findById(req.user._id);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const already = me.following.includes(targetId);

    // Unfollow
    if (already) {
      me.following = me.following.filter(id => String(id) !== String(targetId));
      target.followers = target.followers.filter(id => String(id) !== String(me._id));
      await me.save();
      await target.save();
      return res.json({ success: true, following: false });
    }

    // Private Profile -> Request
    if (target.privateProfile) {
      const existing = await FollowRequest.findOne({ from: me._id, to: target._id, status: 'pending' });
      if (!existing) await FollowRequest.create({ from: me._id, to: target._id });
      return res.json({ success: true, requested: true, following: false });
    }

    // Public Follow
    me.following.push(targetId);
    target.followers.push(me._id);
    await me.save();
    await target.save();

    // Create Notification
    const io = req.app.get('io');
    if (io) {
        // We emit a simpler event or use the notification utility if imported
        io.to(String(target._id)).emit('notification', {
            type: 'follow',
            message: `${me.name} followed you`,
            actor: me
        });
    }

    res.json({ success: true, following: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', 'name email avatar');
    res.json(user?.followers || []);
  } catch { res.status(500).json({ message: 'Error' }); }
};

exports.listFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'name email avatar');
    res.json(user?.following || []);
  } catch { res.status(500).json({ message: 'Error' }); }
};

exports.getFollowRequests = async (req, res) => {
  try {
    const reqs = await FollowRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reqs);
  } catch { res.status(500).json({ message: 'Error' }); }
};

exports.acceptFollowRequest = async (req, res) => {
  try {
    // Logic to move from Request -> Follower (similar to followToggle but confirming)
    const fr = await FollowRequest.findById(req.params.id);
    if (!fr) return res.status(404).json({ message: 'Not found' });
    
    const me = await User.findById(req.user._id);
    const them = await User.findById(fr.from);

    if (!me.followers.includes(them._id)) me.followers.push(them._id);
    if (!them.following.includes(me._id)) them.following.push(me._id);

    fr.status = 'accepted';
    await Promise.all([fr.save(), me.save(), them.save()]);
    
    res.json({ ok: true });
  } catch { res.status(500).json({ message: 'Error' }); }
};

exports.declineFollowRequest = async (req, res) => {
  try {
    await FollowRequest.findByIdAndUpdate(req.params.id, { status: 'declined' });
    res.json({ ok: true });
  } catch { res.status(500).json({ message: 'Error' }); }
};

// Aliases
exports.approveRequest = exports.acceptFollowRequest;
exports.rejectRequest = exports.declineFollowRequest;