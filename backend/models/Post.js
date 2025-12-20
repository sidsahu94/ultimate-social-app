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
  
  // Arrays like this caused the index error previously
  hashtags: [String],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  likes: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],

  isArchived: { type:Boolean, default:false },
  isFlagged: { type:Boolean, default:false },

  // Polls
  poll: {
    question: String,
    options: [PollOptionSchema],
    expiresAt: Date
  }
}, { timestamps:true });

// ✅ FIX: Changed hashtags from 1 to 'text'.
// This creates a compound text index. MongoDB allows multiple text fields, 
// even if they are arrays.
PostSchema.index({ content: 'text', hashtags: 'text' });

module.exports = mongoose.model('Post', PostSchema);