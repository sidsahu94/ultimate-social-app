// backend/models/Comment.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true },
    audio: { type: String }, 
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// 🔥 CRITICAL PERFORMANCE INDEX
commentSchema.index({ post: 1, createdAt: -1 }); // Speeds up loading comments for a post

module.exports = mongoose.model("Comment", commentSchema);