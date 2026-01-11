// backend/controllers/marketplaceController.js
const Product = require('../models/Product');

exports.list = async (_req,res)=>{
  const items = await Product.find().sort({ createdAt:-1 }).limit(200);
  res.json(items);
};

exports.mine = async (req,res)=>{
  const items = await Product.find({ owner: req.user._id }).sort({ createdAt:-1 });
  res.json(items);
};

exports.create = async (req,res)=>{
  const { title, price, desc, tags = [] } = req.body;
  const image = (req.file && `/uploads/${require('path').basename(req.file.path)}`) || '';
  const item = await Product.create({ owner:req.user._id, title, price, desc, image, tags });
  res.status(201).json(item);
};
