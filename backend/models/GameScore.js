const mongoose = require('mongoose');

const GameScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: String, required: true }, // e.g., 'snake', '2048'
  score: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model('GameScore', GameScoreSchema);