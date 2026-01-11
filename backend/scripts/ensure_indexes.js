// backend/scripts/ensure_indexes.js
const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Post = require('../models/Post');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected. Indexing...");
    
    // Search Indexes
    await User.collection.createIndex({ name: 'text', email: 'text' });
    await Post.collection.createIndex({ content: 'text', hashtags: 'text' });
    
    // Sort Indexes
    await Post.collection.createIndex({ createdAt: -1 });
    await Post.collection.createIndex({ user: 1 });
    
    console.log("Indexes created.");
    process.exit();
});