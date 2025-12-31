// backend/routes/extra.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const extraController = require('../controllers/extraController');
const searchSuggestController = require('../controllers/searchSuggestController'); 

// --- User-Auth Protected Routes ---
router.post('/ai/avatar', protect, upload.single('avatar'), extraController.aiAvatar);

router.post('/upload', protect, upload.single('media'), extraController.uploadFile);

// ✅ VOICE ROUTE: Must be present for AudioRecorder to work
router.post('/voice/:chatId', protect, upload.single('audio'), extraController.voice);

router.post('/save/:postId', protect, extraController.toggleSave); 
router.get('/save/:id', protect, extraController.getSavedByUser); 
router.get('/insights', protect, extraController.insights);
router.get('/suggestions', protect, searchSuggestController.suggestions); 
// ------------------------------------

// --- Public/Optional-Auth Routes ---
router.get('/reels', extraController.getReels); 
router.get('/shop/items', extraController.getShopItems); 
// ------------------------------------

module.exports = router;