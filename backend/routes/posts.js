// backend/routes/posts.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const postsController = require('../controllers/postsController');
const commentsController = require('../controllers/commentsController'); // NEW: Import comments
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.get('/feed', optionalAuth, postsController.getFeed);
router.get('/trending', optionalAuth, postsController.trending);
router.get('/search', optionalAuth, postsController.searchPosts);

// Scheduled Posts
router.get('/scheduled', protect, postsController.getScheduledPosts);
router.post('/scheduled', protect, upload.any(), postsController.schedulePost);

// Post CRUD
router.post('/', protect, upload.any(), postsController.createPost);
router.get('/:postId', protect, postsController.getPostById);
// Fallbacks/Aliases for Single Post Fetch
router.get('/post/:id', protect, postsController.getPostById);
router.get('/posts/post/:id', protect, postsController.getPostById);

router.put('/like/:postId', protect, postsController.likePost);
router.post('/:postId/react', protect, postsController.reactPost);

// Bookmarks
router.post('/:postId/bookmark', protect, postsController.toggleBookmark);
router.get('/bookmarks/me', protect, postsController.getBookmarks);

// Posts by User ID (Profile Page)
router.get('/user/:id', optionalAuth, postsController.getPostsByUser); // Allow optionalAuth for public profiles
router.put('/:id', protect, upload.any(), postsController.updatePost);
router.delete('/:id', protect, postsController.deletePost);

// Comments (Aliasing the commentsController to /posts route is not standard, but fixing the missing /comments calls)
// It's better to ensure frontend uses /api/comments/:postId, but adding an alias here for a quick fix if needed:
// router.post('/:postId/comment', protect, commentsController.create);
// router.get('/:postId/comments', protect, commentsController.list);

module.exports = router;