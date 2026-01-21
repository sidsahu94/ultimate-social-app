// backend/scripts/ensure_indexes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' }); // Adjust path if running from root

// Import Models
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');

const runIndexes = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected.');

    console.log('🏗️  Building Indexes...');

    // --- 1. USER INDEXES ---
    // Text search for Name/Email (High priority for search)
    await User.collection.createIndex({ name: 'text', email: 'text' });
    // Geo-spatial index for "Nearby" feature
    await User.collection.createIndex({ geo: '2dsphere' });
    // Performance: Login lookups
    await User.collection.createIndex({ email: 1 });
    console.log('   -> User indexes set.');

    // --- 2. POST INDEXES ---
    // Text search for Content/Hashtags
    await Post.collection.createIndex({ content: 'text', hashtags: 'text' });
    
    // 🔥 OPTIMIZED FEED INDEX (Partial Filter Expression)
    // This creates a smaller, faster index containing only "clean" public posts.
    // The feed query will use this instead of scanning everything.
    await Post.collection.createIndex(
        { createdAt: -1 }, 
        { 
            name: "feed_optimization_idx",
            partialFilterExpression: { 
                isArchived: false, 
                isFlagged: false, 
                isDraft: false 
            } 
        }
    );

    // Feed Filtering: Get specific user's posts sorted by date
    await Post.collection.createIndex({ user: 1, createdAt: -1 });
    
    // Algorithmic Feed: Sort by Score (Hot/Trending)
    await Post.collection.createIndex({ score: -1, createdAt: -1 });
    
    console.log('   -> Post indexes set (with Partial Feed Optimization).');

    // --- 3. NOTIFICATION INDEXES ---
    // Fast count of unread notifications
    await Notification.collection.createIndex({ user: 1, isRead: 1 });
    // Sorting notifications by date
    await Notification.collection.createIndex({ user: 1, createdAt: -1 });
    console.log('   -> Notification indexes set.');

    // --- 4. COMMENT INDEXES ---
    // Fast retrieval of comments for a specific post
    await Comment.collection.createIndex({ post: 1, createdAt: -1 });
    console.log('   -> Comment indexes set.');

    console.log('✨ All indexes verified and created successfully.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error creating indexes:', err);
    process.exit(1);
  }
};

runIndexes();