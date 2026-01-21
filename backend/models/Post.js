// backend/models/Post.js
const mongoose = require('mongoose');

const PollOptionSchema = new mongoose.Schema({
  text: String,
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { _id: false });

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Optimized for "Posts by User"
  content: { type: String, default: '' },
  images: [String],
  videos: [String],
  hashtags: { type: [String], index: true }, // Optimized for Hashtag Search
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  views: { type: Number, default: 0 },
  
  isArchived: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  isDraft: { type: Boolean, default: false },
  
  // 🔥 PERFORMANCE: Pre-calculated score for feed sorting (reduces aggregation load)
  score: { type: Number, default: 0, index: true }, 

  poll: {
    question: String,
    options: [PollOptionSchema],
    expiresAt: Date
  },
  
  createdAt: { type: Date, default: Date.now, index: true }, // Optimized for Feed Sorting
  scheduledAt: { type: Date, index: true } // Optimized for Cron Jobs
}, { timestamps: true });

// Compound text index for Full Text Search
PostSchema.index({ content: 'text', hashtags: 'text' });

module.exports = mongoose.model('Post', PostSchema);