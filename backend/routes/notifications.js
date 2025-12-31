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
    // FIX: Use the controller's logic to handle ownership check and mark as read
    await notificationsController.markSingleRead(req, res);
  } catch (err) {
    // If controller fails to respond, send generic error (though controller should handle its own response)
    console.error('mark single notification read err', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error marking notification as read' });
    }
  }
});
router.get('/unread-count', protect, notificationsController.getUnreadCount);

module.exports = router;