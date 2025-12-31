const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const reels = require('../controllers/reelsController');

// Upload reel
router.post('/upload', protect, upload.any(), reels.uploadReel);

// Reels feed
router.get('/feed', protect, reels.feed);

// ✅ LIKE / UNLIKE REEL (FIX)
router.put('/like/:id', protect, reels.likeReel);
// ... existing routes
router.post('/:id/view', protect, reels.viewReel); // 🔥 NEW ROUTE


module.exports = router;
