// backend/controllers/adminController.js
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report'); // Ensure Report model exists
const Comment = require('../models/Comment'); // For cleanup if needed

// --- 1. DASHBOARD STATS ---
exports.getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();
    const reportCount = await Report.countDocuments({ status: 'open' });
    
    // Optional: Calculate active users today (if lastActive field exists)
    // const activeToday = await User.countDocuments({ lastActive: { $gte: new Date(new Date().setHours(0,0,0,0)) } });

    res.json({ 
        userCount, 
        postCount, 
        reportCount,
        // activeToday 
    });
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

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Toggle Ban Status
    const isBanning = user.role !== 'banned';
    user.role = isBanning ? 'banned' : 'user';
    
    // If banning, FORCE LOGOUT by clearing refresh token
    if (isBanning) {
        user.refreshToken = null; 
        
        // Optional: Emit socket event to force client logout immediately
        const io = req.app.get('io');
        if (io) {
            io.to(id.toString()).emit('force_logout');
        }
    }
    
    await user.save();
    res.json({ message: `User ${user.role}`, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Server error banning user' });
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
    const reports = await Report.find({ status: 'open' })
      .populate('reporter', 'name email')
      .populate('targetUser', 'name email') 
      .populate('targetPost', 'content user') // Nested user pop might fail if simple ref, usually just content is enough
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
        // Force socket logout
        const io = req.app.get('io');
        if (io) io.to(String(report.targetUser)).emit('force_logout');

    } else if (action === 'delete_post' && report.targetPost) {
        await Post.findByIdAndDelete(report.targetPost);
        // Also cleanup associated data (simple version)
        await Comment.deleteMany({ post: report.targetPost });
    }

    // Update Report Status
    report.status = 'resolved';
    report.action = action; // Track what was done
    report.handledBy = req.user._id;
    await report.save();

    res.json({ message: `Report resolved: ${action}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error handling report' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    // 🔥 FIX: Use Soft Delete instead of hard delete
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