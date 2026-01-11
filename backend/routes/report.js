// backend/routes/report.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.post('/', protect, reportController.createReport);
router.get('/mine', protect, reportController.getMyReports);
// admin endpoints
router.get('/', protect, restrictTo('admin'), reportController.getReports);
router.put('/:id', protect, restrictTo('admin'), reportController.updateReport);

module.exports = router;
