// backend/scripts/ensure_indexes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Models
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const PollVote = require('../models/PollVote'); // 🔥 New Model for Scalable Polls

const runIndexes = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected.');

    console.log('🏗️  Building Indexes...');

    // --- 1. USER INDEXES ---
    // Text search for Name/Email (High priority for search suggestions)
    await User.collection.createIndex({ name: 'text', email: 'text', username: 'text' });
    
    // Geo-spatial index for "Nearby" feature
    await User.collection.createIndex({ geo: '2dsphere' });
    
    // Performance: Login lookups and duplicate checks
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true, sparse: true });
    console.log('   -> User indexes set.');

    // --- 2. POST INDEXES ---
    // Text search for Content/Hashtags
    await Post.collection.createIndex({ content: 'text', hashtags: 'text' });
    
    // 🔥 OPTIMIZED FEED INDEX (Compound Index)
    // Critical for fetching "My Feed" (Users I follow + Sorted by Date)
    // Allows query: find({ user: { $in: [...] } }).sort({ createdAt: -1 }) to use the index
    await Post.collection.createIndex({ user: 1, createdAt: -1 });
    
    // 🔥 GLOBAL FEED OPTIMIZATION (Partial Filter)
    // Creates a smaller, faster index containing only "clean" public posts.
    // The public feed query will use this instead of scanning the entire collection.
    await Post.collection.createIndex(
        { createdAt: -1 }, 
        { 
            name: "public_feed_optimization_idx",
            partialFilterExpression: { 
                isArchived: false, 
                isFlagged: false, 
                isDraft: false 
            } 
        }
    );

    // Algorithmic Feed: Sort by Score (Hot/Trending)
    await Post.collection.createIndex({ score: -1, createdAt: -1 });
    
    console.log('   -> Post indexes set (with Partial Feed Optimization).');

    // --- 3. COMMENT INDEXES (Scalability Fix) ---
    // Fast retrieval of comments for a specific post, sorted by newest
    // Critical for pagination in the Comments Modal
    await Comment.collection.createIndex({ post: 1, createdAt: -1 });
    console.log('   -> Comment indexes set.');

    // --- 4. POLL VOTE INDEXES (Scalability Fix) ---
    // 🔥 Ensures a user can only vote once per post at the DB level.
    // This prevents race conditions and data corruption.
    await PollVote.collection.createIndex({ postId: 1, userId: 1 }, { unique: true });
    
    // Cleanup/Stats: Quickly find all votes for a specific post
    await PollVote.collection.createIndex({ postId: 1 });
    console.log('   -> PollVote indexes set.');

    // --- 5. NOTIFICATION INDEXES ---
    // Fast count of unread notifications (red badge count)
    await Notification.collection.createIndex({ user: 1, isRead: 1 });
    
    // Sorting notifications by date for the dropdown list
    await Notification.collection.createIndex({ user: 1, createdAt: -1 });
    console.log('   -> Notification indexes set.');

    console.log('✨ All indexes verified and created successfully.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error creating indexes:', err);
    process.exit(1);
  }
};

runIndexes();