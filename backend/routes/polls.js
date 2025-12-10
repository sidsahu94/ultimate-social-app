const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const polls = require('../controllers/pollsController');

router.post('/', protect, polls.createPollPost);
router.post('/:id/vote/:index', protect, polls.vote);

module.exports = router;
