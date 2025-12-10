const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetType: { type: String, enum:['post','user','comment','stream'] },
  targetId: String,
  reason: String,
  notes: String,
  status: { type: String, enum:['open','dismissed','actioned'], default:'open' },
  action: { type: String, enum:['none','warn','ban','remove','mute'], default:'none' },
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps:true });

module.exports = mongoose.model('ModerationReport', ReportSchema);
