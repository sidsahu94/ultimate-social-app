// backend/models/Post.js
const mongoose = require('mongoose');

const PollOptionSchema = new mongoose.Schema({
  text: String,
  votes: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }]
}, { _id:false });

const PostSchema = new mongoose.Schema({
  user: { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  content: { type:String, default:'' },
  images: [String],
  videos: [String],
  
  hashtags: [String],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  likes: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  
  // 🔥 NEW: View Count (Analytics)
  views: { type: Number, default: 0 },

  isArchived: { type:Boolean, default:false },
  isFlagged: { type:Boolean, default:false },
  
  // 🔥 NEW: Draft Support
  isDraft: { type: Boolean, default: false },

  // Polls
  poll: {
    question: String,
    options: [PollOptionSchema],
    expiresAt: Date
  }
}, { timestamps:true });

// Compound text index for search
PostSchema.index({ content: 'text', hashtags: 'text' });

module.exports = mongoose.model('Post', PostSchema);