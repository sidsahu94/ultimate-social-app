// backend/routes/translate.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const t = require('../controllers/translateController');

router.post('/', protect, t.translate);

module.exports = router;
