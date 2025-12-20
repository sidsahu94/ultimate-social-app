// backend/models/Group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  handle: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  avatar: { type: String },
  coverPhoto: { type: String },
  privacy: { type: String, enum: ['public','private'], default: 'public' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bannedWords: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);

