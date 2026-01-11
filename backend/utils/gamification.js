// backend/utils/gamification.js
const User = require('../models/User');
const Notification = require('../models/Notification');

// XP Table: Level 1=0, Level 2=100, Level 3=300, etc.
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 5000];

exports.addXP = async (userId, amount, io) => {
  try {
    const user = await User.findById(userId).select('xp level name notificationSettings');
    if (!user) return;

    user.xp += amount;

    // Check for Level Up
    const nextLevelXP = XP_THRESHOLDS[user.level] || (user.level * 500); // Fallback logic
    let leveledUp = false;

    if (user.xp >= nextLevelXP) {
      user.level += 1;
      leveledUp = true;
    }

    await user.save();

    // Real-time Update
    if (io) {
        io.to(String(userId)).emit('xp:update', { 
            xp: user.xp, 
            level: user.level, 
            leveledUp 
        });

        if (leveledUp) {
            // Send visual celebration event
            io.to(String(userId)).emit('notification', {
                type: 'system',
                message: `🎉 Level Up! You are now Level ${user.level}!`
            });
        }
    }
  } catch (e) {
    console.error("XP Error:", e);
  }
};