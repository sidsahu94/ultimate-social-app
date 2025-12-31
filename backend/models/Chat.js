// backend/models/Chat.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  content: { type:String, default:'' },
  media: { type:String, default:null }, // For images/videos
  
  // ✅ ADDED: Audio field for voice notes
  audio: { type:String, default:null }, 
  
  reactions: [{
    by: { type: mongoose.Schema.Types.ObjectId, ref:'User' },
    emoji: { type:String }
  }],
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }], // read receipts
}, { timestamps:true });

const ChatSchema = new mongoose.Schema({
  name: { type:String, default:'' },         // for groups
  isGroup: { type:Boolean, default:false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref:'User', index:true }],

  messages: [MessageSchema],

  typing: [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }], // who is typing
  unread: { type: Map, of: Number, default: {} }, // userId -> count
}, { timestamps:true });

module.exports = mongoose.model('Chat', ChatSchema);