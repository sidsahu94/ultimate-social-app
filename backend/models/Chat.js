// backend/models/Chat.js
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  isGroup: { type: Boolean, default: false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For groups
  
  // 🔥 FIX: Removed embedded 'messages' array to prevent 16MB limit cap.
  // Instead, we just keep a reference to the latest message for the sidebar preview.
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },

  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  
  // Per-user unread counts
  unread: { type: Map, of: Number, default: {} }, 
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);