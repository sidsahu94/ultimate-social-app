// backend/models/PollVote.js
const mongoose = require('mongoose');

const PollVoteSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  optionIndex: { type: Number, required: true }
}, { timestamps: true });

// Compound Index: One vote per user per post
PollVoteSchema.index({ postId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('PollVote', PollVoteSchema);