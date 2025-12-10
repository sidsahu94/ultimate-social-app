// backend/models/Report.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReportSchema = new Schema({
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
  targetPost: { type: Schema.Types.ObjectId, ref: 'Post' },
  reason: { type: String, required: true },
  details: { type: String },
  status: { type: String, enum: ['open', 'investigating', 'resolved', 'dismissed'], default: 'open' },
  handledBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
