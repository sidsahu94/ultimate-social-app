const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  owner: { type:mongoose.Schema.Types.ObjectId, ref:'User' },
  title: String,
  price: Number,
  image: String,
  desc: String,
  tags: [String],
  stock: { type:Number, default:1 }
}, { timestamps:true });

ProductSchema.index({ title:'text', tags:1 });

module.exports = mongoose.model('Product', ProductSchema);
