// backend/models/Comment.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  audio: {
    type: String
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, {
  timestamps: true
});

// --- INDEXES ---
// Compound index to optimize querying comments by post and sorting them by newest first
commentSchema.index({ post: 1, createdAt: -1 });

// Index to optimize querying comments by a specific user
commentSchema.index({ user: 1 });

module.exports = mongoose.model("Comment", commentSchema);