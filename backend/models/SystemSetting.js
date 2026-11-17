const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: false }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SystemSetting ||
  mongoose.model('SystemSetting', systemSettingSchema);
