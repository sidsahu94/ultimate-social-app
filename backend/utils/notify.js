const Notification = require('../models/Notification');

/**
 * Creates a notification in DB and emits via Socket
 * 🔥 Includes Spam Prevention (Duplicate Check)
 */
const createNotification = async (req, { toUser, type, data, message }) => {
  try {
    const io = req.app.get('io') || global.io;
    const actorId = req.user._id;

    // 1. Don't notify self
    if (String(toUser) === String(actorId)) return;

    // 2. 🔥 FIX: Spam Prevention
    // Check if an UNREAD notification of the same type from the same actor already exists
    // (e.g. Don't send 5 "User liked your post" notifications for the same post)
    if (['like', 'follow'].includes(type)) {
        const query = {
            user: toUser,
            actor: actorId,
            type: type,
            isRead: false
        };
        
        // For likes/comments, ensure it matches the specific post
        if (data?.postId) {
            query['data.postId'] = data.postId;
        }

        const existing = await Notification.findOne(query);
        if (existing) {
            // Update timestamp so it jumps to top, but don't create new
            existing.createdAt = Date.now();
            await existing.save();
            return existing;
        }
    }

    // 3. Save to DB
    const notif = await Notification.create({
      user: toUser,
      actor: actorId,
      type,
      data,
      message: message || `New ${type} from ${req.user.name}`
    });

    // 4. Emit Real-time
    if (io) {
      io.to(String(toUser)).emit('notification', notif);
    }
    
    return notif;
  } catch (err) {
    console.error('Notification error:', err);
  }
};

module.exports = createNotification;