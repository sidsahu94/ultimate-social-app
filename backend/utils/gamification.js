// backend/utils/gamification.js
const User = require('../models/User');

// XP Table
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 5000];

exports.addXP = async (userId, amount, io) => {
  try {
    // 1. Atomic Increment (Safe for concurrency)
    const user = await User.findByIdAndUpdate(
        userId, 
        { $inc: { xp: amount } }, 
        { new: true, select: 'xp level name' }
    );
    
    if (!user) return;

    // 2. Level Up Logic (Calculated after atomic update)
    // Note: This part isn't strictly atomic regarding the level field, 
    // but the XP data is now safe.
    const nextLevelXP = XP_THRESHOLDS[user.level] || (user.level * 500);
    let leveledUp = false;

    if (user.xp >= nextLevelXP) {
        user.level += 1;
        leveledUp = true;
        await user.save(); // Save the new level
    }

    // 3. Emit Real-time Update
    if (io) {
        io.to(String(userId)).emit('xp:update', { 
            xp: user.xp, 
            level: user.level, 
            leveledUp 
        });

        if (leveledUp) {
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