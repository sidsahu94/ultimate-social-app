// backend/utils/notify.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const { webpush } = require('./push'); 

const createNotification = async (req, { toUser, type, data, message }) => {
  try {
    const actorId = req.user._id.toString();
    const recipientId = toUser.toString();

    // 1. No self-notifications
    if (actorId === recipientId) return;

    // 2. Fetch Recipient Settings
    // We fetch pushSubscription as an array (updated schema)
    const recipient = await User.findById(recipientId).select('pushSubscription notificationSettings');
    
    if (!recipient) return;

    // 3. Check Notification Settings
    const settings = recipient.notificationSettings || {};
    
    let isEnabled = true;
    switch (type) {
        case 'like': isEnabled = settings.likes !== false; break;
        case 'comment': isEnabled = settings.comments !== false; break;
        case 'follow': isEnabled = settings.follows !== false; break;
        case 'message': isEnabled = settings.messages !== false; break;
        default: isEnabled = true; // System/Security notifications bypass preferences
    }

    if (!isEnabled) {
        return; // User disabled this type of notification
    }

    // 4. Spam Prevention (Debounce for Likes)
    if (type === 'like') {
      const recent = await Notification.findOne({
        user: recipientId,
        actor: actorId,
        type: 'like',
        'data.postId': data.postId,
        createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) } // 1 hour debounce
      });
      if (recent) return;
    }

    // 5. Construct Message if missing
    const msg = message || `${req.user.name} ${
        type==='like'?'liked your post':
        type==='comment'?'commented on your post':
        type==='follow'?'started following you':
        'interacted with you'
    }`;

    // 6. Save Notification to DB
    const notif = await Notification.create({
      user: toUser,
      actor: actorId,
      type,
      data,
      message: msg
    });

    // 7. Emit Real-time (Socket)
    const io = req.app.get('io') || global.io;
    if (io) io.to(recipientId).emit('notification', notif);

    // 8. Send Web Push to ALL subscribed devices
    if (recipient.pushSubscription && recipient.pushSubscription.length > 0) {
        const payload = JSON.stringify({
            title: 'SocialApp',
            body: msg,
            icon: '/pwa-192x192.png',
            data: {
                url: data?.link || '/notifications' 
            }
        });

        // Loop through all subscriptions (Multi-device support)
        const sendPromises = recipient.pushSubscription.map(async (sub) => {
            try {
                await webpush.sendNotification(sub, payload);
            } catch (pushErr) {
                // If subscription is dead (410 or 404), return it for deletion
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                    return sub; 
                }
                console.error("Push failed:", pushErr.message);
            }
            return null;
        });

        const results = await Promise.all(sendPromises);
        const deadSubs = results.filter(s => s !== null);

        // 9. Cleanup Dead Subscriptions
        if (deadSubs.length > 0) {
             await User.findByIdAndUpdate(recipientId, {
                 $pull: { pushSubscription: { endpoint: { $in: deadSubs.map(s => s.endpoint) } } }
             });
             console.log(`🧹 Cleaned up ${deadSubs.length} dead push subscriptions for user ${recipientId}`);
        }
    }

    return notif;
  } catch (err) {
    console.error('Notification error:', err);
  }
};

module.exports = createNotification;