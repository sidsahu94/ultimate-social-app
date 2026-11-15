const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { 
      type: String, 
      enum: ['like', 'comment', 'follow', 'mention', 'message', 'group', 'report', 'system', 'reel', 'story', 'sale', 'coin', 'admin', 'call'], 
      default: 'system' 
    },
    message: { type: String, trim: true, default: '' },
    data: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Optimized compound index
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
