// backend/routes/shop.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const shop = require('../controllers/shopController');
const ShopItem = require('../models/ShopItem'); // Required for inline delete logic

// List all items
router.get('/', shop.list);

// Create new item
router.post('/', protect, upload.single('image'), shop.create);

// Buy item
router.post('/:id/buy', protect, shop.buy);

// Delete item (Owner only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const itemId = req.params.id;
        const userId = req.user._id;

        // Find and delete only if the creator matches the requester
        const deletedItem = await ShopItem.findOneAndDelete({ 
            _id: itemId, 
            createdBy: userId 
        });

        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found or you do not have permission to delete it.' });
        }

        res.json({ ok: true, message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Delete shop item error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;