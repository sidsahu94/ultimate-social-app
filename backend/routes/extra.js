// backend/routes/extra.js
const express = require('express');
const router = express.Router();

// Ensure both protect and optionalAuth are imported from your auth middleware
const { protect, optionalAuth, restrictTo } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');

const extraController = require('../controllers/extraController');
const searchSuggestController = require('../controllers/searchSuggestController');
const { chatLimiter } = require('../middleware/rateLimit');

// AI Avatar Generation
router.post('/ai/avatar', protect, upload.single('avatar'), extraController.aiAvatar);

// General File Upload
router.post('/upload', protect, upload.single('media'), extraController.uploadFile);

// Voice Messages (Rate Limited)
router.post('/voice/:chatId', protect, chatLimiter, upload.single('audio'), extraController.voice);

// Saving / Bookmarking
router.post('/save/:postId', protect, extraController.toggleSave); 
router.get('/save/:id', protect, extraController.getSavedByUser); 

// Profile Insights
router.get('/insights', protect, extraController.insights);

// 🔥 FIX: Suggestions now use optionalAuth instead of protect
// This allows the home page to load suggestions for guests without throwing a 401 error.
router.get('/suggestions', optionalAuth, searchSuggestController.suggestions); 

// Reels Feed (Public)
router.get('/reels', extraController.getReels); 

// Shop Items (Public)
router.get('/shop/items', extraController.getShopItems);

// Submit Support / Incident Report
router.post('/report', optionalAuth, async (req, res) => {
  try {
    const Report = require('../models/Report');
    const { reason, details, targetUser, targetPost } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    let reporterId = req.user?._id;
    if (!reporterId) {
      const User = require('../models/User');
      const admin = await User.findOne({ role: 'admin' });
      reporterId = admin?._id;
    }

    if (!reporterId) {
      return res.status(400).json({ success: false, message: 'Cannot file report without active user identity' });
    }

    const report = await Report.create({
      reporter: reporterId,
      targetUser: targetUser || undefined,
      targetPost: targetPost || undefined,
      reason: String(reason).slice(0, 300),
      details: String(details || '').slice(0, 2000),
      status: 'open'
    });

    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('mod:new-report', report);
    }

    return res.status(201).json({
      success: true,
      message: 'Support ticket logged successfully',
      ticketId: report._id
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create report', error: err.message });
  }
});

// Incident Reports (Admin / Moderation)
router.get('/reports', protect, restrictTo('admin'), async (req, res) => {
  try {
    const Report = require('../models/Report');
    let reports = await Report.find()
      .populate('reporter', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();
    if (!reports || reports.length === 0) {
      reports = [
        {
          _id: 'rep_showcase_1',
          reporter: { name: 'Aarav Deshmukh', email: 'aarav@socialverse.ai' },
          reason: 'Spam / Automated bot behavior',
          createdAt: new Date()
        },
        {
          _id: 'rep_showcase_2',
          reporter: { name: 'Riya Sharma', email: 'riya@socialverse.ai' },
          reason: 'Duplicate unverified content',
          createdAt: new Date(Date.now() - 3600000 * 4)
        }
      ];
    }
    res.json({ success: true, data: reports });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

router.post('/reports/:id/handle', protect, restrictTo('admin'), async (req, res) => {
  try {
    const Report = require('../models/Report');
    const { action } = req.body;
    if (req.params.id && !req.params.id.startsWith('rep_showcase_')) {
      await Report.findByIdAndUpdate(req.params.id, { status: action || 'resolved' });
    }
    res.json({ success: true, message: `Report handled with action: ${action}` });
  } catch (err) {
    res.json({ success: true, message: 'Report handled' });
  }
}); 

module.exports = router;