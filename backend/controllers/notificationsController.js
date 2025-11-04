// backend/controllers/notificationsController.js
const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * Returns notifications for current user (most recent first)
 */
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    console.error('getNotifications err', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

/**
 * PUT /api/notifications/mark-read
 * Marks all unread notifications for current user as read
 */
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('markAsRead err', error);
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
};

/**
 * POST /api/notifications/:id/read
 * Mark a single notification as read
 */
exports.markSingleRead = async (req, res) => {
  try {
    const id = req.params.id;
    const notif = await Notification.findById(id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    // ensure owner
    if (notif.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (!notif.isRead) {
      notif.isRead = true;
      await notif.save();
    }

    res.status(200).json({ message: 'Marked' });
  } catch (error) {
    console.error('markSingleRead err', error);
    res.status(500).json({ message: 'Error marking notification', error: error.message });
  }
};
