// backend/routes/extra.js
const express = require('express');
const router = express.Router();

// Ensure both protect and optionalAuth are imported from your auth middleware
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');

const extraController = require('../controllers/extraController');
const searchSuggestController = require('../controllers/searchSuggestController');
const { chatLimiter } = require('../middleware/rateLimit');

// AI Avatar Generation
router.post('/ai/avatar', protect, upload.single('avatar'), extraController.aiAvatar);

// General File Upload
router.post('/upload', protect, upload.single('media'), extraController.uploadFile);

// Voice Messages (Rate Limited)
router.post('/voice/:chatId', protect, chatLimiter, upload.single('audio'), extraController.voice);

// Saving / Bookmarking
router.post('/save/:postId', protect, extraController.toggleSave); 
router.get('/save/:id', protect, extraController.getSavedByUser); 

// Profile Insights
router.get('/insights', protect, extraController.insights);

// 🔥 FIX: Suggestions now use optionalAuth instead of protect
// This allows the home page to load suggestions for guests without throwing a 401 error.
router.get('/suggestions', optionalAuth, searchSuggestController.suggestions); 

// Reels Feed (Public)
router.get('/reels', extraController.getReels); 

// Shop Items (Public)
router.get('/shop/items', extraController.getShopItems); 

module.exports = router;