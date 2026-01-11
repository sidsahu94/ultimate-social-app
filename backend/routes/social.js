// backend/routes/social.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const social = require('../controllers/socialController');

router.post('/geo', protect, social.updateGeo);
router.get('/nearby', protect, social.nearby);
router.post('/badges/refresh', protect, social.badges);
router.get('/memories', protect, social.memories);
router.post('/nft', protect, social.linkNft);

module.exports = router;
