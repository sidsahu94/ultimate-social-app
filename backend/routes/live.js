const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const live = require('../controllers/liveController');

router.post('/start', protect, live.start);
router.post('/end/:roomId', protect, live.end);
router.get('/list', live.list);
router.get('/:roomId', live.get);
router.post('/:roomId/superchat', protect, live.superchat);

module.exports = router;
