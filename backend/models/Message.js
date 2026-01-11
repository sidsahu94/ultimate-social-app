// backend/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true }, // Index added below
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 🔥 UPDATED: Message Type & Polls
  type: { type: String, enum: ['text', 'poll'], default: 'text' },
  pollOptions: [{ 
    text: String, 
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
  }],
  
  content: { type: String, default: '' },
  media: { type: String, default: null },
  audio: { type: String, default: null },
  
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  isForwarded: { type: Boolean, default: false },
  
  // 🔥 UPDATED: Encryption Flag
  isEncrypted: { type: Boolean, default: false },

  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  
  reactions: [{
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String }
  }]
}, { timestamps: true });

// 🔥 CRITICAL PERFORMANCE INDEXES
// 1. Speeds up: "Get messages for this chat, sorted by date"
MessageSchema.index({ chat: 1, createdAt: -1 });

// 2. Speeds up: "Search within a specific chat"
MessageSchema.index({ chat: 1, content: 'text' });

module.exports = mongoose.model('Message', MessageSchema);