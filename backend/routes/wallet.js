// backend/routes/wallet.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const wallet = require('../controllers/walletController');

router.get('/me', protect, wallet.me);
router.post('/airdrop', protect, wallet.airdrop);
router.post('/tip', protect, wallet.tip);

router.post('/pin', protect, wallet.setPin);
router.get('/pin/status', protect, wallet.checkPinStatus);


module.exports = router;
