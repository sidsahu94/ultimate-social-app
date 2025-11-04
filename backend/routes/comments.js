// backend/routes/comments.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const commentsController = require('../controllers/commentsController');

// Add comment to a post
router.post('/:postId', protect, commentsController.addComment);

// Reply to a comment
router.post('/reply/:commentId', protect, commentsController.replyToComment);

module.exports = router;
