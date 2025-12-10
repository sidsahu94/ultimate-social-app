// backend/models/Payout.js
const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['manual', 'scheduled', 'auto'], default: 'manual' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  note: String,
  createdAt: { type: Date, default: Date.now },
  paidAt: Date,
});

module.exports = mongoose.model('Payout', PayoutSchema);
