//backend/utils/notify.js
const Notification = require('../models/Notification');

/**
 * Creates a notification in DB and emits via Socket
 */
const createNotification = async (req, { toUser, type, data, message }) => {
  try {
    const io = req.app.get('io') || global.io;
    const actorId = req.user._id;

    // Don't notify self
    if (String(toUser) === String(actorId)) return;

    // 1. Save to DB
    const notif = await Notification.create({
      user: toUser,
      actor: actorId,
      type,
      data,
      message: message || `New ${type} from ${req.user.name}`
    });

    // 2. Emit Real-time to user's personal room
    if (io) {
      io.to(String(toUser)).emit('notification', notif);
    }
    
    return notif;
  } catch (err) {
    console.error('Notification error:', err);
  }
};

module.exports = createNotification;