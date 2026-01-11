// backend/routes/stories.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const storiesController = require('../controllers/storiesController');
const upload = require('../utils/multer');

// --- 1. Create Story ---
// Uploads a file (image/video) and creates a story entry
router.post('/', protect, upload.single('media'), storiesController.createStory);

// --- 2. Get Stories Feed ---
// Fetches active stories from self + following (and Close Friends logic)
router.get('/', protect, storiesController.getStories);

// --- 3. Mark as Viewed ---
// Updates the viewer list for a specific story
router.post('/:id/view', protect, storiesController.markViewed);

// --- 4. Delete Story (🔥 NEW) ---
// Allows the author to delete their story before it expires
router.delete('/:id', protect, storiesController.deleteStory);

module.exports = router;