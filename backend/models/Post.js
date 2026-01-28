// backend/models/Post.js
const mongoose = require('mongoose');

const PollOptionSchema = new mongoose.Schema({
  text: String,
  // 🔥 SCALABILITY FIX: Removed 'votes' array (User IDs).
  // Storing IDs inside the document limits the number of voters to ~50k before crashing.
  // We now store just the count here. Detailed tracking is in the 'PollVote' collection.
  count: { type: Number, default: 0 } 
}, { _id: false });

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  content: { type: String, default: '' },
  images: [String],
  videos: [String],
  
  hashtags: { type: [String], index: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Note: We keep 'likes' array here for easier "isLikedByMe" checks on the frontend.
  // However, we added 'likesCount' for performance when just displaying numbers.
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 },
  
  // 🔥 SCALABILITY FIX: Removed 'comments' array [ObjectId].
  // Comments are now queried directly from the Comment collection using index { post: 1 }.
  commentsCount: { type: Number, default: 0 },
  
  views: { type: Number, default: 0 },
  
  // Status Flags
  isArchived: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  isDraft: { type: Boolean, default: false },
  
  // Trending Score (Pre-calculated for algorithmic feed)
  score: { type: Number, default: 0, index: true }, 

  poll: {
    question: String,
    options: [PollOptionSchema],
    expiresAt: Date
  },
  
  scheduledAt: { type: Date, index: true },
  createdAt: { type: Date, default: Date.now } // Indexed via compound index below
}, { timestamps: true });

// --- INDEXES ---

// 1. Feed Query Optimization: 
// Speeds up "Find posts by users I follow, sorted by newest"
PostSchema.index({ user: 1, createdAt: -1 });

// 2. Search Optimization: 
// Allows full-text search on content and tags
PostSchema.index({ content: 'text', hashtags: 'text' });

// 3. Trending Feed: 
// Speeds up fetching "Hot" posts
PostSchema.index({ score: -1, createdAt: -1 });

// 4. Feed Filtering (Partial Index):
// Creates a smaller, faster index containing only public, published posts
PostSchema.index(
  { createdAt: -1 },
  { 
    name: "feed_optimization_idx",
    partialFilterExpression: { 
      isArchived: false, 
      isFlagged: false, 
      isDraft: false 
    } 
  }
);

module.exports = mongoose.model('Post', PostSchema);