// backend/models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: "" },
  images: [{ type: String }],
  videos: [{ type: String }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  hashtags: [{ type: String }],
  isArchived: { type: Boolean, default: false },
}, { timestamps: true }); // createdAt & updatedAt

module.exports = mongoose.model('Post', postSchema);
