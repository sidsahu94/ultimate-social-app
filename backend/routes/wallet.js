// backend/routes/wallet.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const wallet = require('../controllers/walletController');
const { financialLimiter } = require('../middleware/rateLimit'); // 🔥 Import stricter limiter
const User = require('../models/User'); // Added to support daily bonus logic

router.get('/me', protect, wallet.me);
router.post('/airdrop', protect, wallet.airdrop);

// 🔥 Apply financial limiter to critical endpoints
router.post('/tip', protect, financialLimiter, wallet.tip);
router.post('/pin', protect, financialLimiter, wallet.setPin);
router.get('/pin/status', protect, wallet.checkPinStatus);

// Daily Bonus Route
router.post('/claim-daily-bonus', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastClaimed = user.lastDailyBonus ? new Date(new Date(user.lastDailyBonus).getFullYear(), new Date(user.lastDailyBonus).getMonth(), new Date(user.lastDailyBonus).getDate()).getTime() : null;

    if (lastClaimed === today) {
      return res.status(400).json({ error: 'Bonus already claimed today.' });
    }

    const BONUS_AMOUNT = 50;
    const currentBal = (user.wallet && typeof user.wallet.balance === 'number') ? user.wallet.balance : 0;
    const newBal = currentBal + BONUS_AMOUNT;

    user.wallet = user.wallet || {};
    user.wallet.balance = newBal;
    user.lastDailyBonus = now;
    await user.save();

    const Transaction = require('../models/Transaction');
    Transaction.create({
      user: user._id,
      type: 'credit',
      amount: BONUS_AMOUNT,
      description: 'Daily Bonus Reward',
      idempotencyKey: `dailybonus:${user._id}:${now.toISOString().split('T')[0]}`
    }).catch(err => console.warn('Daily bonus tx log error:', err.message));

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(String(user._id)).emit('wallet:update', { balance: newBal });
    }

    res.json({ success: true, newBalance: newBal });
  } catch (error) {
    console.error('Daily bonus claim error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;