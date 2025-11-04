// backend/routes/stories.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const storiesController = require('../controllers/storiesController');
const upload = require('../utils/multer');

// quick runtime checks to help debugging — remove or comment later
if (process.env.NODE_ENV !== 'production') {
  try {
    console.log('types -> protect:', typeof protect, ', upload.single:', typeof upload.single, ', createStory:', typeof storiesController.createStory);
  } catch (e) {
    console.warn('stories route debug log failed', e);
  }
}

/**
 * POST /api/stories
 * Form: multipart/form-data with single file field named "media"
 */
if (typeof protect !== 'function' || typeof upload.single !== 'function' || typeof storiesController.createStory !== 'function') {
  // If any required item is missing we register a stub that returns an informative error
  router.post('/', (req, res) => {
    return res.status(500).json({
      message:
        'Stories route misconfigured. Check that authMiddleware.protect, multer upload, and storiesController.createStory are functions.',
      types: {
        protect: typeof protect,
        uploadSingle: typeof (upload && upload.single),
        createStory: typeof (storiesController && storiesController.createStory),
      },
    });
  });
} else {
  router.post('/', protect, upload.single('media'), storiesController.createStory);
  router.get('/', protect, storiesController.getStories);
  router.post('/:id/view', protect, storiesController.markViewed);
}

module.exports = router;
