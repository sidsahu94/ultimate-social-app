// backend/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // recipient
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who triggered it
  type: { type: String, enum: ['like','comment','follow','mention','message','group','report','system','reel'], default: 'system' },
  data: { type: mongoose.Schema.Types.Mixed }, // arbitrary payload (e.g. {postId, commentId})
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
