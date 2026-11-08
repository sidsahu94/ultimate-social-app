// backend/routes/stories.js
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const storiesController = require('../controllers/storiesController');
const upload = require('../utils/multer');

// --- 1. Create Story ---
router.post('/', protect, upload.single('media'), storiesController.createStory);

// --- 2. Get Stories Feed ---
router.get('/', optionalAuth, storiesController.getStories);

// --- 3. Mark as Viewed ---
router.post('/:id/view', protect, storiesController.markViewed);

// --- 4. React to Story (Emoji) ---
router.post('/:id/react', protect, storiesController.reactToStory);

// --- 5. Reply to Story (Direct Chat Message) ---
router.post('/:id/reply', protect, storiesController.replyToStory);

// --- 6. Get Story Viewers ---
router.get('/:id/viewers', protect, storiesController.getViewers);

// --- 7. Delete Story ---
router.delete('/:id', protect, storiesController.deleteStory);

module.exports = router;
