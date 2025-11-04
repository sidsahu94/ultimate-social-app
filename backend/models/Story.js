// backend/models/Story.js
const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  media: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], default: 'image' },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Story', storySchema);
