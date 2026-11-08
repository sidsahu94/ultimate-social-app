// backend/routes/posts.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const postsController = require('../controllers/postsController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const validateContent = require('../middleware/validateContent');
const upload = require('../utils/multer');

// ==========================================
// SAFE FALLBACK HANDLER
// ==========================================

const notImplemented = (name) => {
  return (req, res) => {
    return res.status(501).json({
      success: false,
      message: `${name} controller not implemented`
    });
  };
};

// ==========================================
// CONTROLLER SAFETY
// ==========================================

const getFeed =
  postsController.getFeed ||
  notImplemented('getFeed');

const trending =
  postsController.trending ||
  notImplemented('trending');

const searchPosts =
  postsController.searchPosts ||
  notImplemented('searchPosts');

const getDrafts =
  postsController.getDrafts ||
  notImplemented('getDrafts');

const getScheduledPosts =
  postsController.getScheduledPosts ||
  notImplemented('getScheduledPosts');

const schedulePost =
  postsController.schedulePost ||
  notImplemented('schedulePost');

const unlockPost = postsController.unlockPost || notImplemented("unlockPost");

const createPost =
  postsController.createPost ||
  notImplemented('createPost');

const getPostById =
  postsController.getPostById ||
  notImplemented('getPostById');

const viewPost =
  postsController.viewPost ||
  notImplemented('viewPost');

const likePost =
  postsController.likePost ||
  notImplemented('likePost');

const reactPost =
  postsController.reactPost ||
  notImplemented('reactPost');

const toggleBookmark =
  postsController.toggleBookmark ||
  notImplemented('toggleBookmark');

const getBookmarks =
  postsController.getBookmarks ||
  notImplemented('getBookmarks');

const getPostsByUser =
  postsController.getPostsByUser ||
  notImplemented('getPostsByUser');

const updatePost =
  postsController.updatePost ||
  notImplemented('updatePost');

const deletePost =
  postsController.deletePost ||
  notImplemented('deletePost');

const getPostLikes =
  postsController.getPostLikes ||
  notImplemented('getPostLikes');

const aiCompose =
  postsController.aiCompose ||
  notImplemented('aiCompose');

const unfurlLink =
  postsController.unfurlLink ||
  notImplemented('unfurlLink');

// ==========================================
// PUBLIC FEEDS
// ==========================================

router.get('/feed', optionalAuth, getFeed);

router.get('/trending', optionalAuth, trending);

router.get('/search', optionalAuth, searchPosts);

// ==========================================
// DRAFTS
// ==========================================

router.get('/drafts', protect, getDrafts);

// ==========================================
// SCHEDULED POSTS
// ==========================================

router.get(
  '/scheduled',
  protect,
  getScheduledPosts
);

router.post(
  '/scheduled',
  protect,
  upload.any(),
  validateContent,
  schedulePost
);

// ==========================================
// BOOKMARKS & USER POSTS (Static & Sub-path Routes FIRST)
// ==========================================

router.get(
  ['/bookmarks/me', '/bookmarks'],
  protect,
  getBookmarks
);

router.post(
  '/:postId/bookmark',
  protect,
  toggleBookmark
);

router.get(
  '/user/:id',
  optionalAuth,
  getPostsByUser
);

// ==========================================
// VIEWS & INTERACTIONS
// ==========================================

router.post(
  '/:id/view',
  optionalAuth,
  viewPost
);

router.put(
  '/like/:postId',
  protect,
  likePost
);

router.post(
  '/:postId/react',
  protect,
  reactPost
);

router.post(
  '/:id/unlock',
  protect,
  unlockPost
);

router.post(
  '/ai/compose',
  protect,
  aiCompose
);

// ==========================================
// POST CRUD & DYNAMIC ID (Must be after specific sub-routes)
// ==========================================

router.post(
  '/',
  protect,
  upload.any(),
  validateContent,
  createPost
);

router.get(
  '/:postId',
  optionalAuth,
  getPostById
);

// Fallbacks
router.get(
  '/post/:id',
  optionalAuth,
  getPostById
);

router.get(
  '/posts/post/:id',
  optionalAuth,
  getPostById
);

router.put(
  '/:id',
  protect,
  upload.any(),
  validateContent,
  updatePost
);

router.delete(
  '/:id',
  protect,
  deletePost
);

router.get(
  '/:id/likes',
  protect,
  getPostLikes
);

// ==========================================
// UTILITIES
// ==========================================

router.post(
  '/unfurl',
  unfurlLink
);

module.exports = router;