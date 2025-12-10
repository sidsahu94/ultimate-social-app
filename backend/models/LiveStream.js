const mongoose = require('mongoose');

const SuperchatSchema = new mongoose.Schema({
  from: { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  amount: Number,
  message: String,
  createdAt: { type:Date, default:Date.now }
}, {_id:false});

const LiveStreamSchema = new mongoose.Schema({
  roomId: { type:String, unique:true },
  host: { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  title: String,
  isLive: { type:Boolean, default:true },
  viewers: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  superchats: [SuperchatSchema]
}, { timestamps:true });

module.exports = mongoose.model('LiveStream', LiveStreamSchema);
