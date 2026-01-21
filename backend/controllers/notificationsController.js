// backend/controllers/notificationsController.js
const Notification = require('../models/Notification');
const User = require('../models/User'); // Ensure User model has pushSubscription field
const { webpush, publicKey } = require('../utils/push');
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
// 🔥 NEW: Get Public Key
exports.getPushKey = (req, res) => {
    res.json({ publicKey });
};

// 🔥 NEW: Subscribe User
exports.subscribe = async (req, res) => {
    try {
        const subscription = req.body;
        await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
        res.status(201).json({ message: 'Push Subscribed' });
    } catch (err) {
        res.status(500).json({ message: 'Subscription failed' });
    }
};

// 🔥 NEW: Send Push (Helper to be used in notify.js)
exports.sendPushToUser = async (userId, payload) => {
    try {
        const user = await User.findById(userId).select('pushSubscription');
        if (user && user.pushSubscription) {
            await webpush.sendNotification(user.pushSubscription, JSON.stringify(payload));
        }
    } catch (err) {
        console.error("Push Error (Expired sub?):", err.statusCode);
    }
};
exports.subscribe = async (req, res) => {
    try {
        const sub = req.body;
        // Add to array, avoiding exact duplicates
        await User.findByIdAndUpdate(req.user.id, { 
            $addToSet: { pushSubscription: sub } 
        });
        res.status(201).json({ message: 'Push Subscribed' });
    } catch (err) {
        res.status(500).json({ message: 'Subscription failed' });
    }
};