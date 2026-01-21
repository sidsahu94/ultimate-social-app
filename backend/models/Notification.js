// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['like','comment','follow','mention','message','group','report','system','reel'], default: 'system' },
  data: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// 🔥 CRITICAL PERFORMANCE INDEX
notificationSchema.index({ user: 1, isRead: 1 }); // Speeds up "get unread count" queries

module.exports = mongoose.model('Notification', notificationSchema);