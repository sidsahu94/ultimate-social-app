// backend/routes/payouts.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const payoutController = require('../controllers/payoutController');
const { financialLimiter } = require('../middleware/rateLimit'); // 🔥 Import stricter limiter

// --- User Routes ---
// 🔥 Apply financial limiter here
router.post('/create', protect, financialLimiter, payoutController.create);

// --- Admin Routes ---
router.get('/', protect, restrictTo('admin'), payoutController.list);
router.post('/:id/paid', protect, restrictTo('admin'), payoutController.markPaid);

module.exports = router;