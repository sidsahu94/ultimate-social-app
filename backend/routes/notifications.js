// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const notificationsController = require('../controllers/notificationsController');
const Notification = require('../models/Notification');

router.get('/', protect, notificationsController.getNotifications);

// alias used by frontend fallbacks
router.get('/list', protect, notificationsController.getNotifications);

// mark all as read
router.put('/mark-read', protect, notificationsController.markAsRead);

// single-notification read endpoint (frontend attempted POST /notifications/:id/read)
router.post('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked' });
  } catch (err) {
    console.error('mark single notification read err', err);
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;

