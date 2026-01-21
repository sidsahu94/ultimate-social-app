// backend/scripts/reset_db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const reset = async () => {
    try {
        console.log("🔥 Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected.");

        console.log("⚠️ DELETING ALL DATA...");
        
        await User.deleteMany({});
        await Post.deleteMany({});
        await Comment.deleteMany({});
        await Notification.deleteMany({});
        await Chat.deleteMany({});
        await Message.deleteMany({});

        console.log("✨ Database is now CLEAN.");
        console.log("ℹ️  You can now register a fresh account via the frontend.");
        
        process.exit(0);
    } catch (e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
};

reset();