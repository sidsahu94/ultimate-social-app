// backend/models/FollowRequest.js
const mongoose = require('mongoose');

const followReq = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, alias: 'sender' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, alias: 'receiver' },
  status: { type: String, enum: ['pending','accepted','declined'], default: 'pending' },
}, { timestamps: true });

followReq.index({ from: 1, to: 1 }, { unique: true });
followReq.index({ to: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.FollowRequest || mongoose.model('FollowRequest', followReq);
