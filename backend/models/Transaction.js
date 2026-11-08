const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: function(amountValue) {
        return amountValue > 0 && Number.isInteger(amountValue);
      },
      message: 'Transaction balance increments must represent integer values using localized lowest sub-units.'
    }
  },
  description: {
    type: String,
    trim: true,
    maxLength: 300
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true, // Strict database key uniqueness enforcement mapping rule
    default: () => require('crypto').randomUUID()
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);