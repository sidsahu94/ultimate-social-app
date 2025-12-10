// backend/routes/moderation.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Report = require('../models/Report');

router.use(protect, restrictTo('admin'));

// quick stats for admin ui
router.get('/stats', async (req, res) => {
  try {
    const openReports = await Report.countDocuments({ status: 'open' });
    return res.json({ openReports });
  } catch (err) {
    console.error('mod stats err', err);
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;
