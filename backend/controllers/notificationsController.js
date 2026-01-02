// backend/controllers/notificationsController.js
const Notification = require('../models/Notification');

/**
 * GET /api/notifications
 * 🔥 FIXED: Added Pagination
 */
exports.getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 0);
    const limit = parseInt(req.query.limit || 20);

    const notifications = await Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(page * limit)
        .limit(limit);
        
    res.status(200).json(notifications);
  } catch (error) {
    console.error('getNotifications err', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

/**
 * PUT /api/notifications/mark-read
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
 */
exports.markSingleRead = async (req, res) => {
  try {
    const id = req.params.id;
    const notif = await Notification.findById(id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

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

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ count: 0 });
  }
};