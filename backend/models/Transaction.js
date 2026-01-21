// backend/models/Transaction.js
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  description: String,
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
  
  // 🔥 NEW: Idempotency Key to prevent double-spending on network retries
  idempotencyKey: { type: String, unique: true, sparse: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);