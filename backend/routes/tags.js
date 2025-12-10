const router = require('express').Router();
const { suggest } = require('../controllers/tagSuggestionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/suggest', protect, suggest);

module.exports = router;
