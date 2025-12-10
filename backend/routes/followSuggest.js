const router = require('express').Router();
const { suggest } = require('../controllers/followSuggestController');
const { protect } = require('../middleware/authMiddleware');

router.get('/suggest', protect, suggest);

module.exports = router;
