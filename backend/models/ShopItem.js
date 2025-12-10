const mongoose = require('mongoose');

const ShopItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  image: String,
  stock: { type: Number, default: 1 },
  metadata: Object,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps:true });

module.exports = mongoose.model('ShopItem', ShopItemSchema);
