// backend/routes/marketplace.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const market = require('../controllers/marketplaceController');

router.get('/', market.list);
router.get('/mine', protect, market.mine);
router.post('/', protect, upload.single('image'), market.create);
router.post('/:itemId/buy', protect, market.buyItem);
router.post('/buy/:itemId', protect, market.buyItem);

module.exports = router;
