// backend/controllers/notificationsController.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const { webpush, publicKey } = require('../utils/push');

exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor;
    const query = { user: req.user.id };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    const nextCursor = notifications.length > 0 ? notifications[notifications.length - 1].createdAt : null;

    res.status(200).json({
      success: true,
      data: notifications,
      nextCursor
    });
  } catch (error) {
    console.error('getNotifications err', error);
    res.status(500).json({
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('markAsRead err', error);
    res.status(500).json({
      message: 'Error updating notifications',
      error: error.message
    });
  }
};

exports.markSingleRead = async (req, res) => {
  try {
    const id = req.params.id;
    const notif = await Notification.findById(id);

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

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
    res.status(500).json({
      message: 'Error marking notification',
      error: error.message
    });
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

exports.getPushKey = (req, res) => {
  res.json({ publicKey });
};

exports.subscribe = async (req, res) => {
  try {
    const sub = req.body;
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { pushSubscriptions: sub } }
    );
    res.status(201).json({ message: 'Push Subscribed' });
  } catch (err) {
    res.status(500).json({ message: 'Subscription failed' });
  }
};

exports.sendPushToUser = async (userId, payload) => {
  try {
    const user = await User.findById(userId).select('pushSubscriptions');
    if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      const promises = user.pushSubscriptions.map(sub => 
        webpush.sendNotification(sub, JSON.stringify(payload)).catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Clean up dead subscription channels
            User.findByIdAndUpdate(userId, { $pull: { pushSubscriptions: sub } }).catch(() => {});
          }
        })
      );
      await Promise.all(promises);
    }
  } catch (err) {
    console.error('Push Engine Error:', err);
  }
};