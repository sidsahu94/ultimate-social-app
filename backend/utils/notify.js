// backend/utils/notify.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const { webpush } = require('./push'); // 🔥 Import Push Utility

const createNotification = async (req, { toUser, type, data, message }) => {
  try {
    const actorId = req.user._id.toString();
    const recipientId = toUser.toString();

    // 1. No self-notifications
    if (actorId === recipientId) return;

    // 2. Spam Prevention (Debounce)
    if (type === 'like') {
      const recent = await Notification.findOne({
        user: recipientId,
        actor: actorId,
        type: 'like',
        'data.postId': data.postId,
        createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) } // 1 hour
      });
      if (recent) return;
    }

    // 3. Construct Message if missing
    const msg = message || `${req.user.name} ${
        type==='like'?'liked your post':
        type==='comment'?'commented on your post':
        type==='follow'?'started following you':
        'interacted with you'
    }`;

    // 4. Save Notification
    const notif = await Notification.create({
      user: toUser,
      actor: actorId,
      type,
      data,
      message: msg
    });

    // 5. Emit Real-time (Socket)
    const io = req.app.get('io') || global.io;
    if (io) io.to(recipientId).emit('notification', notif);

    // 6. 🔥 SEND WEB PUSH
    try {
        const recipient = await User.findById(toUser).select('pushSubscription notificationSettings');
        
        // Map notification type to user settings keys
        const settingKey = type === 'like' ? 'likes' : 
                           type === 'comment' ? 'comments' : 
                           type === 'follow' ? 'follows' : 'messages';

        // Only push if user enabled this type AND has a subscription
        if (recipient?.pushSubscription && recipient.notificationSettings?.[settingKey] !== false) {
            
            const payload = JSON.stringify({
                title: 'SocialApp',
                body: msg,
                icon: '/pwa-192x192.png', // Ensure this exists in public/
                data: {
                    url: data?.link || '/notifications' 
                }
            });
            
            await webpush.sendNotification(recipient.pushSubscription, payload);
        }
    } catch (pushErr) {
        if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            // Subscription is dead/expired, remove it from DB
            await User.findByIdAndUpdate(toUser, { $unset: { pushSubscription: "" } });
        } else {
            console.error("Push failed:", pushErr.message);
        }
    }

    return notif;
  } catch (err) {
    console.error('Notification error:', err);
  }
};

module.exports = createNotification;