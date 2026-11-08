// backend/routes/reels.js
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const reels = require('../controllers/reelsController');

// Upload reel
router.post('/upload', protect, upload.any(), reels.uploadReel);

// Reels feed
router.get('/feed', optionalAuth, reels.feed);

// Like / unlike reel
router.put('/like/:id', protect, reels.likeReel);

// Tip creator on reel
router.post('/:id/tip', protect, reels.tipReel);

// View reel analytics
router.post('/:id/view', protect, reels.viewReel);

// Delete reel
router.delete('/:id', protect, reels.deleteReel);

module.exports = router;
