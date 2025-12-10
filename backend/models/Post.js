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
  likes: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],

 
  isArchived: { type:Boolean, default:false },
  isFlagged: { type:Boolean, default:false },

  // Stage-5: Polls
  poll: {
    question: String,
    options: [PollOptionSchema],
    expiresAt: Date
  }
}, { timestamps:true });

PostSchema.index({ content:'text', hashtags:1 });

module.exports = mongoose.model('Post', PostSchema);
