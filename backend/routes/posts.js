// backend/routes/posts.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const postsController = require('../controllers/postsController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const validateContent = require('../middleware/validateContent');

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Public Feeds
router.get('/feed', optionalAuth, postsController.getFeed);
router.get('/trending', optionalAuth, postsController.trending);
router.get('/search', optionalAuth, postsController.searchPosts);

// 🔥 NEW: Drafts Route (Must come before /:id to avoid collision)
router.get('/drafts', protect, postsController.getDrafts);

// Scheduled Posts
router.get('/scheduled', protect, postsController.getScheduledPosts);
router.post('/scheduled', protect, upload.any(), validateContent, postsController.schedulePost);

// Post CRUD
router.post('/', protect, upload.any(), validateContent, postsController.createPost);
router.get('/:postId', protect, postsController.getPostById);

// Fallbacks for Single Post Fetch (to catch frontend variations)
router.get('/post/:id', protect, postsController.getPostById);
router.get('/posts/post/:id', protect, postsController.getPostById);

// 🔥 NEW: View Counting
router.post('/:id/view', optionalAuth, postsController.viewPost);

// Interactions
router.put('/like/:postId', protect, postsController.likePost);
router.post('/:postId/react', protect, postsController.reactPost);

// Bookmarks
router.post('/:postId/bookmark', protect, postsController.toggleBookmark);
router.get('/bookmarks/me', protect, postsController.getBookmarks);

// User Posts (Profile)
router.get('/user/:id', optionalAuth, postsController.getPostsByUser);
router.put('/:id', protect, upload.any(), validateContent, postsController.updatePost);
router.delete('/:id', protect, postsController.deletePost);
router.get('/:id/likes', protect, postsController.getPostLikes);

// Utilities
router.post('/unfurl', postsController.unfurlLink);

module.exports = router;