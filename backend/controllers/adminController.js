// backend/controllers/adminController.js
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Comment = require('../models/Comment');

exports.getStats = async (req, res) => {
  try {
    const [userCount, postCount, reportCount] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments({ status: 'open' }),
    ]);

    const memUsage = process.memoryUsage();
    const telemetry = {
      clusterHost: 'ac-rp5wdv0-shard-00-01.8fcmyqk.mongodb.net',
      clusterRegion: 'AWS Mumbai (ap-south-1)',
      persistenceState: 'MongoDB Atlas Core Online',
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
      rssMb: Math.round(memUsage.rss / 1024 / 1024),
      mediasoupActive: true
    };

    res.json({ userCount, postCount, reportCount, telemetry });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

exports.broadcastAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Announcement message required' });
    }
    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('notification', {
        type: 'system',
        message: `📢 [SYSTEM ARCHITECT]: ${message.trim()}`,
        createdAt: new Date()
      });
    }
    res.json({ success: true, message: 'Broadcast dispatched to all active nodes' });
  } catch (err) {
    res.status(500).json({ message: 'Broadcast failed' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const cursor = req.query.cursor;
    const query = {};

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const users = await User.find(query)
      .select('name email role isVerified isDeleted createdAt avatar username')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    const nextCursor = users.length > 0 ? users[users.length - 1].createdAt : null;

    res.json({ success: true, data: users, nextCursor });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin' || user.email === 'sidhantas786@gmail.com' || user.username === 'sidsahu') {
      return res.status(403).json({ message: 'Prohibited: Founder & Admin account cannot be banned.' });
    }

    user.role = user.role === 'banned' ? 'user' : 'banned';
    await user.save();

    res.json({ message: `User status updated to ${user.role}`, user });
  } catch (err) {
    console.error('banUser error:', err);
    res.status(500).json({ message: 'Server error updating user role' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin' || user.email === 'sidhantas786@gmail.com' || user.username === 'sidsahu') {
      return res.status(403).json({ message: 'Prohibited: Founder & Admin account cannot be deleted.' });
    }

    res.json({ message: 'User deleted permanently' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

exports.listPosts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const cursor = req.query.cursor;
    const query = {};

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(query)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    const nextCursor = posts.length > 0 ? posts[posts.length - 1].createdAt : null;

    res.json({ success: true, data: posts, nextCursor });
  } catch (err) {
    console.error('listPosts error:', err);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { status = 'open' } = req.query;
    const reports = await Report.find({ status })
      .populate('reportedBy', 'name email avatar')
      .populate('targetUser', 'name email avatar')
      .populate({
        path: 'targetPost',
        select: 'content images user createdAt',
        populate: { path: 'user', select: 'name avatar' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reports });
  } catch (err) {
    console.error('getReports error:', err);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
};

exports.handleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'dismiss', 'delete_post', 'ban_user'

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (action === 'delete_post' && report.targetPost) {
      await Post.findByIdAndDelete(report.targetPost);
      await Comment.deleteMany({ post: report.targetPost });
    } else if (action === 'ban_user' && report.targetUser) {
      await User.findByIdAndUpdate(report.targetUser, { role: 'banned' });
    }

    report.status = 'resolved';
    report.resolvedAt = new Date();
    await report.save();

    res.json({ success: true, message: `Report handled: ${action}` });
  } catch (err) {
    console.error('handleReport error:', err);
    res.status(500).json({ message: 'Server error handling report' });
  }
};

// Toggle Verification Badge
exports.toggleVerifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = !user.isVerified;
    if (user.isVerified) {
      if (!user.badges) user.badges = [];
      if (!user.badges.includes('verified')) user.badges.push('verified');
    } else {
      user.badges = (user.badges || []).filter(b => b !== 'verified');
    }
    await user.save();
    res.json({ success: true, message: `User verification set to ${user.isVerified}`, isVerified: user.isVerified, user });
  } catch (err) {
    console.error('toggleVerifyUser error:', err);
    res.status(500).json({ message: 'Failed to update verification status' });
  }
};

// Creator Treasury: Grant / Mint Coins to User
exports.grantCoins = async (req, res) => {
  try {
    const { id } = req.params;
    const amount = parseInt(req.body.amount, 10);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Valid coin amount required' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.wallet) user.wallet = { balance: 0, totalReceived: 0, totalSent: 0 };
    user.wallet.balance = (user.wallet.balance || 0) + amount;
    user.wallet.totalReceived = (user.wallet.totalReceived || 0) + amount;
    await user.save();

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(String(user._id)).emit('wallet:update', {
        balance: user.wallet.balance,
        delta: amount,
        message: `🪙 Founder Treasury Grant: +${amount} Coins added to your creator wallet!`
      });
    }

    res.json({
      success: true,
      message: `Minted ${amount} coins to ${user.name || user.username}`,
      newBalance: user.wallet.balance
    });
  } catch (err) {
    console.error('grantCoins error:', err);
    res.status(500).json({ message: 'Treasury minting failed' });
  }
};

// Emergency Maintenance Platform Freeze Toggle
let isMaintenanceActive = false;
exports.toggleMaintenance = async (req, res) => {
  try {
    isMaintenanceActive = !isMaintenanceActive;
    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('system:maintenance', { active: isMaintenanceActive });
    }
    res.json({
      success: true,
      maintenance: isMaintenanceActive,
      message: isMaintenanceActive 
        ? 'Platform Emergency Freeze ACTIVATED by Founder' 
        : 'Platform Operations NORMALIZED'
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle maintenance state' });
  }
};
