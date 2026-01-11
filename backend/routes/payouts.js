// backend/routes/payouts.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const payoutController = require('../controllers/payoutController');

// --- User Routes ---
// POST /api/payouts/create - Request a withdrawal
router.post('/create', protect, payoutController.create);

// --- Admin Routes ---
// GET /api/payouts - List all requests
router.get('/', protect, restrictTo('admin'), payoutController.list);

// POST /api/payouts/:id/paid - Mark as paid
router.post('/:id/paid', protect, restrictTo('admin'), payoutController.markPaid);

module.exports = router;