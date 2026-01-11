// backend/models/ActiveCall.js
const mongoose = require('mongoose');

const ActiveCallSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 🔥 Auto-delete after 24 hours (MongoDB TTL)
});

module.exports = mongoose.model('ActiveCall', ActiveCallSchema);