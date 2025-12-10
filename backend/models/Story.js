// backend/models/Story.js
const mongoose = require('mongoose');
const StorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  media: { type:String, required:true },
  type: { type:String, enum:['image','video'], default:'image' },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }],
  expiresAt: { type:Date, required:true, index:true }
}, { timestamps:true });

StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto TTL

module.exports = mongoose.model('Story', StorySchema);
