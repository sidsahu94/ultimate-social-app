// backend/routes/posts.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const postsController = require('../controllers/postsController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads'),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Public feed (optional auth). If token present req.user will be set.
router.get('/feed', optionalAuth, postsController.getFeed);

// Trending (public)
router.get('/trending', optionalAuth, postsController.trending);

// POST create (protected)
router.post('/', protect, upload.any(), postsController.createPost);

// get by id (protected - existing)
router.get('/:postId', protect, postsController.getPostById);

// alias routes frontend tries
router.get('/post/:id', protect, postsController.getPostById);
router.get('/posts/post/:id', protect, postsController.getPostById);

// like (protected)
router.put('/like/:postId', protect, postsController.likePost);

// get posts by user
router.get('/user/:id', protect, postsController.getPostsByUser);

// update (protected)
router.put('/:id', protect, upload.any(), postsController.updatePost);

// delete (protected)
router.delete('/:id', protect, postsController.deletePost);

module.exports = router;
