const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const reels = require('../controllers/reelsController');

// Ensure controller functions exist before routing
if (!reels.uploadReel || !reels.feed) {
    console.error("Reels controller functions missing!");
}

// Upload a reel (Video file)
router.post('/upload', protect, upload.any(), reels.uploadReel);

// Get Reels feed
router.get('/feed', reels.feed);

module.exports = router;