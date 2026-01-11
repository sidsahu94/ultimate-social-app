// backend/routes/integrations.js
const router = require('express').Router();
const controller = require('../controllers/integrationsController');
const { protect } = require('../middleware/authMiddleware');

// We protect these so only logged-in users consume your API quota
router.get('/news', protect, controller.getNews);
router.get('/markets', protect, controller.getMarkets);
// 🔥 The new route for frontend to call
router.get('/turn', protect, controller.getTurnCredentials);

module.exports = router;