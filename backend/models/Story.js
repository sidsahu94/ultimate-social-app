// backend/models/Story.js
const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  media: { type:String, required:true },
  type: { type:String, enum:['image','video'], default:'image' },
  
  // 🔥 UPDATED: Privacy setting
  privacy: { type: String, enum: ['public', 'close_friends'], default: 'public' },
  
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }],
  
  // The index is created at the bottom with expireAfterSeconds
  expiresAt: { type:Date, required:true } 
}, { timestamps:true });

// This creates the TTL (Time To Live) index
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 

module.exports = mongoose.model('Story', StorySchema);