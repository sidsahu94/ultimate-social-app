// backend/models/Saved.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SavedSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
}, { timestamps: true });

module.exports = mongoose.model('Saved', SavedSchema);
