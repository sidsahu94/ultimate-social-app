// backend/routes/extra.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const extraController = require('../controllers/extraController');
const searchSuggestController = require('../controllers/searchSuggestController'); // 🔥 Imported
const { chatLimiter } = require('../middleware/rateLimit');

router.post('/ai/avatar', protect, upload.single('avatar'), extraController.aiAvatar);
router.post('/upload', protect, upload.single('media'), extraController.uploadFile);

router.post('/voice/:chatId', protect, chatLimiter, upload.single('audio'), extraController.voice);

router.post('/save/:postId', protect, extraController.toggleSave); 
router.get('/save/:id', protect, extraController.getSavedByUser); 
router.get('/insights', protect, extraController.insights);

// 🔥 FIX: Added the missing suggestions route
router.get('/suggestions', protect, searchSuggestController.suggestions); 

router.get('/reels', extraController.getReels); 
router.get('/shop/items', extraController.getShopItems); 

module.exports = router;