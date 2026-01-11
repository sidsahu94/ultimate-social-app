// backend/controllers/reportController.js
const Report = require('../models/Report');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

exports.createReport = async (req, res) => {
  try {
    const { targetUser, targetPost, reason, details } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason required' });

    const rpt = new Report({
      reporter: req.user._id,
      targetUser: targetUser || null,
      targetPost: targetPost || null,
      reason,
      details,
    });
    await rpt.save();
    return res.status(201).json(rpt);
  } catch (err) {
    console.error('createReport err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const q = await Report.find().sort({ createdAt: -1 }).populate('reporter', 'name email').populate('targetUser', 'name').populate('targetPost', 'content');
    return res.json(q);
  } catch (err) {
    console.error('getReports err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};// Import Notification model

exports.updateReport = async (req, res) => {
  try {
    const { status, action } = req.body; // status: 'resolved', action: 'ban', 'warn', 'hide_post'
    
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // 1. Update Report State
    if (status) report.status = status;
    if (action) report.action = action;
    report.handledBy = req.user._id;

    // 2. 🔥 AUTO-EXECUTE ACTION LOGIC
    if (status === 'resolved' || status === 'actioned') {
        
        // A) Ban User
        if (action === 'ban' && report.targetUser) {
            await User.findByIdAndUpdate(report.targetUser, { role: 'banned' });
            // Optional: Create system notification for the user (if they can still read them)
        }
        
        // B) Hide/Flag Post
        if ((action === 'hide_post' || action === 'remove') && report.targetPost) {
            await Post.findByIdAndUpdate(report.targetPost, { isFlagged: true });
        }

        // C) Send Warning
        if (action === 'warn' && report.targetUser) {
             await Notification.create({
                 user: report.targetUser,
                 type: 'system',
                 message: `⚠️ Community Warning: Your content was reported for "${report.reason}". Please review our guidelines.`
             });
        }
    }

    await report.save();
    res.json(report);
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ message: 'Error processing report action' });
  }
};

// 🔥 NEW: Get My Reports
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .sort({ createdAt: -1 })
      .populate('targetUser', 'name')
      .populate('targetPost', 'content'); // Just a snippet
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};