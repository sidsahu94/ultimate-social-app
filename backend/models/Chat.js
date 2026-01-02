// backend/models/Chat.js
const mongoose = require('mongoose');

// 1. Define the Message Schema
const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  content: { type:String, default:'' },
  media: { type:String, default:null }, 
  audio: { type:String, default:null }, 
  
  // This 'ref: Message' is what caused the crash previously
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }, 
  
  // Advanced Features
  isForwarded: { type: Boolean, default: false },
  editedAt: { type: Date },

  reactions: [{
    by: { type: mongoose.Schema.Types.ObjectId, ref:'User' },
    emoji: { type:String }
  }],
  
  // Read/Delivery Status
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }], 
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }], 

  createdAt: { type: Date, default: Date.now }
}, { timestamps:true });

// 🔥 CRITICAL FIX: Register the 'Message' model explicitly.
// Without this line, Mongoose throws "MissingSchemaError" when you try to .populate('messages.replyTo')
mongoose.model('Message', MessageSchema);

// 2. Define the Chat Schema
const ChatSchema = new mongoose.Schema({
  name: { type:String, default:'' },
  isGroup: { type:Boolean, default:false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref:'User', index:true }],
  
  // Messages are embedded sub-documents, but now they can self-reference via the registered model above
  messages: [MessageSchema],

  // Pinned Messages (Stores IDs of messages)
  pinnedMessages: [{ type: mongoose.Schema.Types.ObjectId }], 

  typing: [{ type: mongoose.Schema.Types.ObjectId, ref:'User' }], 
  unread: { type: Map, of: Number, default: {} }, 
}, { timestamps:true });

// Optimize unread count lookups
ChatSchema.index({ "unread.$**": 1 });

module.exports = mongoose.model('Chat', ChatSchema);