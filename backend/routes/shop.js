const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const shop = require('../controllers/shopController');

router.get('/', shop.list);
router.post('/', protect, upload.single('image'), shop.create);
router.post('/:id/buy', protect, shop.buy);

module.exports = router;
