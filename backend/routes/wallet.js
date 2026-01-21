// backend/routes/wallet.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const wallet = require('../controllers/walletController');
const { financialLimiter } = require('../middleware/rateLimit'); // 🔥 Import stricter limiter

router.get('/me', protect, wallet.me);
router.post('/airdrop', protect, wallet.airdrop);

// 🔥 Apply financial limiter to critical endpoints
router.post('/tip', protect, financialLimiter, wallet.tip);
router.post('/pin', protect, financialLimiter, wallet.setPin);
router.get('/pin/status', protect, wallet.checkPinStatus);

module.exports = router;