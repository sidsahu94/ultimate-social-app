// backend/routes/extra.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const extraController = require('../controllers/extraController');
const searchSuggestController = require('../controllers/searchSuggestController'); 

// --- User-Auth Protected Routes ---
router.post('/ai/avatar', protect, upload.single('avatar'), extraController.aiAvatar);
router.post('/voice/:chatId', protect, upload.single('audio'), extraController.voice);
router.post('/save/:postId', protect, extraController.toggleSave); 
router.get('/save/:id', protect, extraController.getSavedByUser); 
router.get('/insights', protect, extraController.insights);
router.get('/suggestions', protect, searchSuggestController.suggestions); 
// ------------------------------------

// --- Public/Optional-Auth Routes ---
// This assumes getReels and getShopItems are exported from extraController
router.get('/reels', extraController.getReels); // <--- Line 23 for crash check
router.get('/shop/items', extraController.getShopItems); 
// ------------------------------------

module.exports = router;