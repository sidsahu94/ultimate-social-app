const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Creates a notification in DB and emits via Socket
 * 🔥 Includes:
 * 1. User Preference Check (Don't send if disabled)
 * 2. Spam Prevention (Debounce duplicates)
 * 3. Auto-Cleanup (Delete old notifications)
 */
const createNotification = async (req, { toUser, type, data, message }) => {
  try {
    const io = req.app.get('io') || global.io;
    const actorId = req.user._id;

    // 1. Don't notify self
    if (String(toUser) === String(actorId)) return;

    // 2. 🔥 Check User Preferences
    const recipient = await User.findById(toUser).select('notificationSettings');
    
    if (recipient && recipient.notificationSettings) {
        // Map notification types to settings keys
        const typeMap = {
            'like': 'likes',
            'comment': 'comments',
            'follow': 'follows',
            'message': 'messages',
            'mention': 'messages' // Mentions usually fall under messages or comments
        };

        const settingKey = typeMap[type];
        // If setting exists and is set to false, SKIP notification
        if (settingKey && recipient.notificationSettings[settingKey] === false) {
            return; 
        }
    }

    // 3. Spam Prevention (Debounce 30s)
    if (['like', 'follow'].includes(type)) {
        const query = {
            user: toUser,
            actor: actorId,
            type: type,
            isRead: false
        };
        // For likes/comments, ensure it matches the specific post
        if (data?.postId) query['data.postId'] = data.postId;

        const existing = await Notification.findOne(query);
        
        if (existing) {
            const timeDiff = Date.now() - new Date(existing.createdAt).getTime();
            // If created less than 30 seconds ago, ignore to prevent spam
            if (timeDiff < 30 * 1000) {
                return existing; 
            }

            // Otherwise, bump to top (update time)
            existing.createdAt = Date.now();
            await existing.save();
            return existing;
        }
    }

    // 4. Save Notification
    const notif = await Notification.create({
      user: toUser,
      actor: actorId,
      type,
      data,
      message: message || `New ${type} from ${req.user.name}`
    });

    // 5. Emit Real-time
    if (io) {
      io.to(String(toUser)).emit('notification', notif);
    }

    // 6. Auto-Cleanup (Fire and forget)
    // Delete notifications older than 30 days for this user
    Notification.deleteMany({
        user: toUser,
        createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).exec().catch(err => console.error("Notification cleanup failed", err));
    
    return notif;
  } catch (err) {
    console.error('Notification error:', err);
  }
};

module.exports = createNotification;