// backend/controllers/adminController.js
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Comment = require('../models/Comment');

// --- 1. DASHBOARD STATS ---
exports.getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    const reportCount = await Report.countDocuments({ status: 'open' });
    
    res.json({ userCount, postCount, reportCount });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

// --- 2. USER MANAGEMENT ---
exports.listUsers = async (req, res) => {
  try {
    // Return latest 50 users with essential admin fields
    const users = await User.find()
      .select('name email role isVerified isDeleted createdAt avatar')
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// 🔥 FIX: "Zombie" Socket Disconnect on Ban
exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Toggle Ban Status
    const isBanning = user.role !== 'banned';
    user.role = isBanning ? 'banned' : 'user';
    
    if (isBanning) {
        user.refreshToken = null; // Invalidate session
        
        const io = req.app.get('io');
        if (io) {
            // 1. Notify Client UI to logout
            io.to(id.toString()).emit('auth:force_logout');
            
            // 2. 🔥 FORCE DISCONNECT SOCKET
            // Fetch all sockets in the user's personal room
            const socketIds = await io.in(id.toString()).allSockets();
            socketIds.forEach(socketId => {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    socket.disconnect(true); // Close underlying connection
                    console.log(`🔫 Force disconnected banned user socket: ${socketId}`);
                }
            });
        }
    }
    
    await user.save();
    res.json({ message: `User ${user.role}`, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error banning user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // Use Soft Delete instead of hard delete
    await User.findByIdAndUpdate(userId, { 
        isDeleted: true, 
        email: `deleted_${userId}_${Date.now()}@deleted.com`, // Free up email
        refreshToken: null 
    });
    
    res.json({ message: 'User deactivated (Soft Delete)' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 3. POST MANAGEMENT ---
exports.listPosts = async (req, res) => {
  try {
    // Return latest 100 posts for moderation view
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('user', 'name email avatar');
      
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching posts' });
  }
};

// --- 4. REPORT MANAGEMENT ---
exports.getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : { status: 'open' };

    const reports = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate('targetUser', 'name email') 
      .populate('targetPost', 'content user') 
      .populate('handledBy', 'name')
      .sort({ createdAt: -1 });
      
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
};

exports.handleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'dismiss', 'ban_user', 'delete_post'
    
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Execute Action
    if (action === 'ban_user' && report.targetUser) {
        await User.findByIdAndUpdate(report.targetUser, { 
            role: 'banned', 
            refreshToken: null 
        });
        
        // Force socket logout for reported user
        const io = req.app.get('io');
        if (io) {
            io.to(String(report.targetUser)).emit('auth:force_logout');
            const socketIds = await io.in(String(report.targetUser)).allSockets();
            socketIds.forEach(sid => {
                const socket = io.sockets.sockets.get(sid);
                if (socket) socket.disconnect(true);
            });
        }

    } else if (action === 'delete_post' && report.targetPost) {
        await Post.findByIdAndDelete(report.targetPost);
        await Comment.deleteMany({ post: report.targetPost });
    }

    // Update Report Status
    report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
    report.action = action; // Track what was done
    report.handledBy = req.user._id;
    await report.save();

    res.json({ message: `Report resolved: ${action}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error handling report' });
  }
};