// backend/routes/spaces.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const spacesController = require('../controllers/spacesController');

router.get('/', protect, spacesController.getActiveSpaces);
router.post('/', protect, spacesController.createSpace);
router.get('/:id', protect, spacesController.getSpaceById);
router.post('/:id/end', protect, spacesController.endSpace);

module.exports = router;
