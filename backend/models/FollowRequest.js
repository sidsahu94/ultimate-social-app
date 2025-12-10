// backend/models/FollowRequest.js
const mongoose = require('mongoose');

const followReq = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending','accepted','declined'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('FollowRequest', followReq);
