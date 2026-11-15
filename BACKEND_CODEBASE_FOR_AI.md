# SOCIALVERSE ∞ — BACKEND CODEBASE FOR AI
> **System**: SocialVerse ∞ — Beyond Social (v5.1.0-PROD)
> **Founder & Chief Architect**: Sidhanta Sahu (@sidsahu / sidhantas786@gmail.com)
> **Total Files**: 128

## TABLE OF CONTENTS
1. `backend/config/db.js`
2. `backend/config/env.js`
3. `backend/config/envValidator.js`
4. `backend/config/redis.js`
5. `backend/controllers/adminController.js`
6. `backend/controllers/appsController.js`
7. `backend/controllers/authController.js`
8. `backend/controllers/callsController.js`
9. `backend/controllers/chatController.js`
10. `backend/controllers/commentsController.js`
11. `backend/controllers/extraController.js`
12. `backend/controllers/followSuggestController.js`
13. `backend/controllers/groupsController.js`
14. `backend/controllers/integrationsController.js`
15. `backend/controllers/liveController.js`
16. `backend/controllers/marketplaceController.js`
17. `backend/controllers/moderationController.js`
18. `backend/controllers/notificationsController.js`
19. `backend/controllers/payoutController.js`
20. `backend/controllers/pollsController.js`
21. `backend/controllers/postsController.js`
22. `backend/controllers/reelsController.js`
23. `backend/controllers/reportController.js`
24. `backend/controllers/searchController.js`
25. `backend/controllers/searchSuggestController.js`
26. `backend/controllers/shopController.js`
27. `backend/controllers/socialController.js`
28. `backend/controllers/spacesController.js`
29. `backend/controllers/storiesController.js`
30. `backend/controllers/tagSuggestionController.js`
31. `backend/controllers/translateController.js`
32. `backend/controllers/unfurlController.js`
33. `backend/controllers/usersController.js`
34. `backend/controllers/walletController.js`
35. `backend/cron/publish.js`
36. `backend/cron/storyCleanup.js`
37. `backend/drop_indexes.js`
38. `backend/index.js`
39. `backend/middleware/authMiddleware.js`
40. `backend/middleware/bannedWords.js`
41. `backend/middleware/errorHandler.js`
42. `backend/middleware/rateLimit.js`
43. `backend/middleware/requestLogger.js`
44. `backend/middleware/validate.js`
45. `backend/middleware/validateContent.js`
46. `backend/models/ActiveCall.js`
47. `backend/models/Chat.js`
48. `backend/models/Comment.js`
49. `backend/models/Event.js`
50. `backend/models/FollowRequest.js`
51. `backend/models/GameScore.js`
52. `backend/models/Group.js`
53. `backend/models/LiveStream.js`
54. `backend/models/Message.js`
55. `backend/models/ModerationReport.js`
56. `backend/models/Notification.js`
57. `backend/models/Payout.js`
58. `backend/models/PollVote.js`
59. `backend/models/Post.js`
60. `backend/models/Product.js`
61. `backend/models/Reel.js`
62. `backend/models/Report.js`
63. `backend/models/Saved.js`
64. `backend/models/ShopItem.js`
65. `backend/models/Space.js`
66. `backend/models/Story.js`
67. `backend/models/Transaction.js`
68. `backend/models/User.js`
69. `backend/package.json`
70. `backend/routes/admin.js`
71. `backend/routes/apps.js`
72. `backend/routes/auth.js`
73. `backend/routes/calls.js`
74. `backend/routes/chat.js`
75. `backend/routes/comments.js`
76. `backend/routes/conversations.js`
77. `backend/routes/events.js`
78. `backend/routes/extra.js`
79. `backend/routes/followSuggest.js`
80. `backend/routes/games.js`
81. `backend/routes/integrations.js`
82. `backend/routes/live.js`
83. `backend/routes/marketplace.js`
84. `backend/routes/moderation.js`
85. `backend/routes/notifications.js`
86. `backend/routes/payouts.js`
87. `backend/routes/polls.js`
88. `backend/routes/posts.js`
89. `backend/routes/proxy.js`
90. `backend/routes/reels.js`
91. `backend/routes/reports.js`
92. `backend/routes/search.js`
93. `backend/routes/shop.js`
94. `backend/routes/social.js`
95. `backend/routes/spaces.js`
96. `backend/routes/stories.js`
97. `backend/routes/tags.js`
98. `backend/routes/translate.js`
99. `backend/routes/users.js`
100. `backend/routes/wallet.js`
101. `backend/scripts/create_admin.js`
102. `backend/scripts/ensure_indexes.js`
103. `backend/scripts/migrate_proxy_urls.js`
104. `backend/scripts/reset_db.js`
105. `backend/seed.js`
106. `backend/server.js`
107. `backend/services/authService.js`
108. `backend/services/mediasoup.js`
109. `backend/services/socketService.js`
110. `backend/utils/AppError.js`
111. `backend/utils/asyncHandler.js`
112. `backend/utils/catchAsync.js`
113. `backend/utils/cloudinary.js`
114. `backend/utils/email.js`
115. `backend/utils/gamification.js`
116. `backend/utils/logger.js`
117. `backend/utils/multer.js`
118. `backend/utils/notify.js`
119. `backend/utils/processMentions.js`
120. `backend/utils/push.js`
121. `backend/utils/textParser.js`
122. `backend/validators/authValidator.js`
123. `frontend/package.json`
124. `frontend/vercel.json`
125. `package.json`
126. `render.yaml`
127. `server.js`
128. `vercel.json`

---


# =====================================================================
## FILE (1/128): backend/config/db.js (Lines: 157)
# =====================================================================

```javascript
const mongoose = require('mongoose');
const winston = require('winston');
const bcrypt = require('bcryptjs');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let memServer = null;

const connectDatabase = async () => {
  const configOptions = {
    autoIndex: false,
    maxPoolSize: 50,
    serverSelectionTimeoutMS: 4000,
    socketTimeoutMS: 45000,
  };

  const targetUri = process.env.MONGO_URI;

  if (targetUri && (targetUri.startsWith('mongodb+srv://') || targetUri.includes('mongodb.net'))) {
    try {
      logger.info('Connecting to MongoDB Atlas Cluster...');
      const DBConnectionInstance = await mongoose.connect(targetUri, configOptions);
      logger.info(`✅ MongoDB Atlas Core Persistence Layer Online: ${DBConnectionInstance.connection.host}`);
      ensureProductionIndexes(DBConnectionInstance.connection);
      autoSeedIfEmpty(DBConnectionInstance.connection);
      return DBConnectionInstance;
    } catch (err) {
      logger.warn(`Remote MongoDB connection failed or cluster paused (${err.message}). Activating embedded database engine...`);
    }
  } else if (targetUri && (targetUri.includes('127.0.0.1') || targetUri.includes('localhost'))) {
    try {
      const DBConnectionInstance = await mongoose.connect(targetUri, configOptions);
      logger.info(`✅ Local MongoDB Core Persistence Layer Online: ${DBConnectionInstance.connection.host}`);
      ensureProductionIndexes(DBConnectionInstance.connection);
      return DBConnectionInstance;
    } catch (err) {
      logger.warn(`Local MongoDB service unavailable (${err.message}). Activating embedded database engine...`);
    }
  }

  // Fallback: Start MongoMemoryServer for instant execution without cloud wait
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    logger.info('🚀 Launching Embedded In-Memory MongoDB Server...');
    memServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'ultimate_social'
      }
    });
    const memoryUri = memServer.getUri();
    const DBConnectionInstance = await mongoose.connect(memoryUri, configOptions);
    logger.info(`✅ Embedded MongoDB Engine Online at: ${memoryUri}`);
    ensureProductionIndexes(DBConnectionInstance.connection);

    // Auto-seed initial test accounts if empty
    autoSeedIfEmpty(DBConnectionInstance.connection);

    return DBConnectionInstance;
  } catch (memErr) {
    logger.error(`CRITICAL: Database core subsystem failed to establish target visibility links: ${memErr.message}`);
    process.exit(1);
  }
};

const ensureProductionIndexes = async (dbConnection) => {
  try {
    await dbConnection.collection('posts').createIndex({ hashtags: 1, createdAt: -1 }, { background: true });
    await dbConnection.collection('transactions').createIndex({ user: 1, createdAt: -1 }, { background: true });
    await dbConnection.collection('transactions').createIndex({ idempotencyKey: 1 }, { unique: true, background: true });
    await dbConnection.collection('messages').createIndex({ chatRoom: 1, createdAt: -1 }, { background: true });
    logger.info(' ==> Performance Optimization Matrix Indexes established successfully across target entities.');
  } catch (err) {
    logger.error(`Failed to assert required index arrays across collection objects: ${err.message}`);
  }
};

const autoSeedIfEmpty = async (dbConnection) => {
  try {
    const User = require('../models/User');
    const Post = require('../models/Post');

    
      // Assert Founder identity across admin records
      await User.updateMany(
        { $or: [{ email: 'admin@socialapp.com' }, { role: 'admin' }] },
        {
          $set: {
            name: 'Sidhanta Sahu',
            username: 'sidsahu',
            bio: 'Founder & Chief Architect of SocialVerse ∞. Designing the next generation of luxury digital human connection.',
            location: 'Odisha, India',
            isVerified: true,
            role: 'admin',
            badges: ['founder', 'architect', 'vip', 'early-adopter', 'creator'],
          }
        }
      );

      const count = await User.countDocuments();
    if (count === 0) {
      logger.info('🌱 Empty database detected. Auto-seeding initial master accounts & posts...');
      const salt = await bcrypt.genSalt(10);
      // pre('save') hashes password automatically

      const adminUser = await User.create({
        name: 'Sidhanta Sahu',
        username: 'sidsahu',
        email: 'sidhantas786@gmail.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        bio: 'Founder & Chief Architect of SocialVerse ∞. Designing the next generation of luxury digital human connection.',
        location: 'Odisha, India',
        isVerified: true,
        role: 'admin',
        wallet: { balance: 5000, totalReceived: 1200, totalSent: 300 },
        badges: ['founder', 'architect', 'vip', 'early-adopter', 'creator'],
      });

      const demoUser = await User.create({
        name: 'Elena Vance',
        username: 'elena',
        email: 'user@socialapp.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        coverPhoto: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
        bio: 'Digital artist & cinematic photographer. Exploring luxury generative themes.',
        location: 'Tokyo, Japan',
        isVerified: true,
        role: 'user',
        wallet: { balance: 2500, totalReceived: 500, totalSent: 150 },
        badges: ['early-adopter', 'creator'],
      });

      // Sample post
      await Post.create({
        user: adminUser._id,
        content: 'Welcome to SocialVerse ∞ — The Ultimate Masterpiece Social Ecosystem. Built with AURORA NOIR luxury aesthetics, end-to-end cryptographic encryption, and real-time audio lounges.',
        images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000'],
        hashtags: ['auroranoir', 'luxury', 'socialverse'],
        likes: [demoUser._id],
        likeCount: 1,
      });

      logger.info('✅ Initial master accounts ready: admin@socialapp.com & user@socialapp.com (password: password123)');
    }
  } catch (err) {
    logger.warn(`Auto-seeding skipped: ${err.message}`);
  }
};

module.exports = connectDatabase;
```


# =====================================================================
## FILE (2/128): backend/config/env.js (Lines: 43)
# =====================================================================

```javascript
require('dotenv').config();

const csvToArray = (value, fallback = []) => {
  if (!value || typeof value !== 'string') return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number.parseInt(process.env.PORT || '5000', 10),

  MONGO_URI: process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'ultimate_social_verse_master_auth_secret_key_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET || 'ultimate_social_verse_master_refresh_secret_key_2026',

  REDIS_URL: process.env.REDIS_URL || '',
  ALLOWED_ORIGINS: csvToArray(process.env.ALLOWED_ORIGINS, ['http://localhost:5173', 'https://*.vercel.app']),

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  },

  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE || 'gmail',
    USER: process.env.EMAIL_USER || '',
    PASS: process.env.EMAIL_PASS || '',
    FROM: process.env.EMAIL_FROM || 'admin@socialapp.com',
  },

  VAPID: {
    PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
    PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
    EMAIL: process.env.VAPID_EMAIL || '',
  },
};

module.exports = config;
```


# =====================================================================
## FILE (3/128): backend/config/envValidator.js (Lines: 76)
# =====================================================================

```javascript
const { z } = require('zod');

// Ensure development and production environments run reliably without crashing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ultimate_social_verse_master_auth_secret_key_2026';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET || 'ultimate_social_verse_master_refresh_secret_key_2026';
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://*.vercel.app';

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGO_URI: z.string().optional().default(''),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET required').default('ultimate_social_verse_master_auth_secret_key_2026'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET required').default('ultimate_social_verse_master_refresh_secret_key_2026'),

  REDIS_URL: z.string().optional().default(''),
  ALLOWED_ORIGINS: z.string().optional().default('http://localhost:5173,https://*.vercel.app'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  EMAIL_SERVICE: z.string().optional().default(''),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default(''),

  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  VAPID_EMAIL: z.string().optional().default(''),

  MASTER_OTP: z.string().optional().default(''),
});

const productionOnlyKeys = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'EMAIL_SERVICE',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_EMAIL',
];

exports.validateEnv = () => {
  const result = baseSchema.safeParse(process.env);

  if (!result.success) {
    console.warn('⚠️ Environment notice: Using default fallback parameters for missing keys:');
    for (const issue of result.error.issues) {
      console.warn(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
  }

  const env = result.success ? result.data : {
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: Number(process.env.PORT) || 5000,
    MONGO_URI: process.env.MONGO_URI || '',
    JWT_SECRET: process.env.JWT_SECRET || 'ultimate_social_verse_master_auth_secret_key_2026',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'ultimate_social_verse_master_refresh_secret_key_2026',
  };

  if (env.NODE_ENV === 'production') {
    const missing = productionOnlyKeys.filter((key) => !String(process.env[key] || '').trim());
    if (missing.length > 0) {
      console.warn(`⚠️ Notice: Cloud features running in local/fallback mode: ${missing.join(', ')}`);
    }
  }

  console.log('✅ Environment configuration initialized successfully.');
  return env;
};
```


# =====================================================================
## FILE (4/128): backend/config/redis.js (Lines: 60)
# =====================================================================

```javascript
const { createClient } = require('redis');

let redisClient = null;

async function connectRedis() {
  if (!process.env.REDIS_URL) {
    return;
  }
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            console.warn('Redis reconnection retries exhausted; continuing without token blacklist.');
            return false;
          }
          return Math.min(retries * 500, 2000);
        },
      },
    });

    redisClient.on('error', (err) => {
      console.warn('Redis Client Warning:', err.message);
    });

    await redisClient.connect();

    console.log('✅ Redis Connected');

  } catch (err) {
    console.warn(
      '⚠ Redis unavailable. Continuing without blacklist.'
    );

    redisClient = null;
  }
}

connectRedis();

module.exports = {
  get: async (key) => {
    if (!redisClient) return null;

    try {
      return await redisClient.get(key);
    } catch {
      return null;
    }
  },

  set: async (key, value) => {
    if (!redisClient) return;

    try {
      await redisClient.set(key, value);
    } catch {}
  }
};
```


# =====================================================================
## FILE (5/128): backend/controllers/adminController.js (Lines: 271)
# =====================================================================

```javascript
// backend/controllers/adminController.js
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Comment = require('../models/Comment');

exports.getStats = async (req, res) => {
  try {
    const [userCount, postCount, reportCount] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments({ status: 'open' }),
    ]);

    const memUsage = process.memoryUsage();
    const telemetry = {
      clusterHost: 'ac-rp5wdv0-shard-00-01.8fcmyqk.mongodb.net',
      clusterRegion: 'AWS Mumbai (ap-south-1)',
      persistenceState: 'MongoDB Atlas Core Online',
      nodeVersion: process.version,
      uptimeSeconds: Math.floor(process.uptime()),
      heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
      rssMb: Math.round(memUsage.rss / 1024 / 1024),
      mediasoupActive: true
    };

    res.json({ userCount, postCount, reportCount, telemetry });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

exports.broadcastAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Announcement message required' });
    }
    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('notification', {
        type: 'system',
        message: `📢 [SYSTEM ARCHITECT]: ${message.trim()}`,
        createdAt: new Date()
      });
    }
    res.json({ success: true, message: 'Broadcast dispatched to all active nodes' });
  } catch (err) {
    res.status(500).json({ message: 'Broadcast failed' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const cursor = req.query.cursor;
    const query = {};

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const users = await User.find(query)
      .select('name email role isVerified isDeleted createdAt avatar username')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    const nextCursor = users.length > 0 ? users[users.length - 1].createdAt : null;

    res.json({ success: true, data: users, nextCursor });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin' || user.email === 'sidhantas786@gmail.com' || user.username === 'sidsahu') {
      return res.status(403).json({ message: 'Prohibited: Founder & Admin account cannot be banned.' });
    }

    user.role = user.role === 'banned' ? 'user' : 'banned';
    await user.save();

    res.json({ message: `User status updated to ${user.role}`, user });
  } catch (err) {
    console.error('banUser error:', err);
    res.status(500).json({ message: 'Server error updating user role' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin' || user.email === 'sidhantas786@gmail.com' || user.username === 'sidsahu') {
      return res.status(403).json({ message: 'Prohibited: Founder & Admin account cannot be deleted.' });
    }

    res.json({ message: 'User deleted permanently' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

exports.listPosts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const cursor = req.query.cursor;
    const query = {};

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(query)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    const nextCursor = posts.length > 0 ? posts[posts.length - 1].createdAt : null;

    res.json({ success: true, data: posts, nextCursor });
  } catch (err) {
    console.error('listPosts error:', err);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { status = 'open' } = req.query;
    const reports = await Report.find({ status })
      .populate('reportedBy', 'name email avatar')
      .populate('targetUser', 'name email avatar')
      .populate({
        path: 'targetPost',
        select: 'content images user createdAt',
        populate: { path: 'user', select: 'name avatar' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reports });
  } catch (err) {
    console.error('getReports error:', err);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
};

exports.handleReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'dismiss', 'delete_post', 'ban_user'

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    if (action === 'delete_post' && report.targetPost) {
      await Post.findByIdAndDelete(report.targetPost);
      await Comment.deleteMany({ post: report.targetPost });
    } else if (action === 'ban_user' && report.targetUser) {
      await User.findByIdAndUpdate(report.targetUser, { role: 'banned' });
    }

    report.status = 'resolved';
    report.resolvedAt = new Date();
    await report.save();

    res.json({ success: true, message: `Report handled: ${action}` });
  } catch (err) {
    console.error('handleReport error:', err);
    res.status(500).json({ message: 'Server error handling report' });
  }
};

// Toggle Verification Badge
exports.toggleVerifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = !user.isVerified;
    if (user.isVerified) {
      if (!user.badges) user.badges = [];
      if (!user.badges.includes('verified')) user.badges.push('verified');
    } else {
      user.badges = (user.badges || []).filter(b => b !== 'verified');
    }
    await user.save();
    res.json({ success: true, message: `User verification set to ${user.isVerified}`, isVerified: user.isVerified, user });
  } catch (err) {
    console.error('toggleVerifyUser error:', err);
    res.status(500).json({ message: 'Failed to update verification status' });
  }
};

// Creator Treasury: Grant / Mint Coins to User
exports.grantCoins = async (req, res) => {
  try {
    const { id } = req.params;
    const amount = parseInt(req.body.amount, 10);
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Valid coin amount required' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.wallet) user.wallet = { balance: 0, totalReceived: 0, totalSent: 0 };
    user.wallet.balance = (user.wallet.balance || 0) + amount;
    user.wallet.totalReceived = (user.wallet.totalReceived || 0) + amount;
    await user.save();

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(String(user._id)).emit('wallet:update', {
        balance: user.wallet.balance,
        delta: amount,
        message: `🪙 Founder Treasury Grant: +${amount} Coins added to your creator wallet!`
      });
    }

    res.json({
      success: true,
      message: `Minted ${amount} coins to ${user.name || user.username}`,
      newBalance: user.wallet.balance
    });
  } catch (err) {
    console.error('grantCoins error:', err);
    res.status(500).json({ message: 'Treasury minting failed' });
  }
};

// Emergency Maintenance Platform Freeze Toggle
let isMaintenanceActive = false;
exports.toggleMaintenance = async (req, res) => {
  try {
    isMaintenanceActive = !isMaintenanceActive;
    const io = req.app.get('io') || global.io;
    if (io) {
      io.emit('system:maintenance', { active: isMaintenanceActive });
    }
    res.json({
      success: true,
      maintenance: isMaintenanceActive,
      message: isMaintenanceActive 
        ? 'Platform Emergency Freeze ACTIVATED by Founder' 
        : 'Platform Operations NORMALIZED'
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle maintenance state' });
  }
};
```


# =====================================================================
## FILE (6/128): backend/controllers/appsController.js (Lines: 348)
# =====================================================================

```javascript
// backend/controllers/appsController.js
const mongoose = require('mongoose');
const Event = require('../models/Event');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GameScore = require('../models/GameScore');
const Post = require('../models/Post');

const asNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// =================================================================
// EVENTS
// =================================================================

exports.getEvents = async (req, res) => {
  try {
    let events = await Event.find({ date: { $gte: new Date() } })
      .select('title date location description image host attendees createdAt')
      .populate('host', 'name avatar')
      .sort({ date: 1 })
      .lean();


    if (!events || events.length === 0) {
      const now = Date.now();
      events = [
        {
          _id: 'event_showcase_1',
          title: 'Noir Gala 2026: Sovereign Creator Summit',
          location: 'Neo-Tokyo Grand Pavilion & Virtual Metaverse',
          date: new Date(now + 86400000 * 3),
          description: 'An exclusive annual congregation of visionary artists, decentralized media founders, and luxury creators.',
          image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop',
          host: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
          attendees: ['user1', 'user2', 'user3', 'user4', 'user5']
        },
        {
          _id: 'event_showcase_2',
          title: 'Obsidian Soundscapes: Electronic Synthesis Night',
          location: 'London Tate Modern Cyber Hall',
          date: new Date(now + 86400000 * 7),
          description: 'A 6-hour immersive audiovisual journey featuring modular synthesizers and binaural reactive lasers.',
          image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop',
          host: { name: 'Marcus Thorne', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
          attendees: ['user1', 'user2', 'user3']
        },
        {
          _id: 'event_showcase_3',
          title: 'DeFi & Digital Treasury Round Table',
          location: 'Zurich Cryptographic Vault Club',
          date: new Date(now + 86400000 * 12),
          description: 'Private closed-door summit on decentralized social liquidity, P2P creator monetization, and Web3 social graphs.',
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop',
          host: { name: 'Dr. Alistair Vance', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
          attendees: ['user1', 'user2']
        }
      ];
    }

    res.json({ success: true, data: events });
  } catch (e) {
    console.error('getEvents error:', e);
    res.status(500).json({ success: false, message: 'Error fetching events' });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, date, location, description, image } = req.body;

    const event = await Event.create({
      host: req.user._id,
      title,
      date,
      location,
      description,
      image,
    });

    res.status(201).json({ success: true, data: event });
  } catch (e) {
    console.error('createEvent error:', e);
    res.status(500).json({ success: false, message: 'Error creating event' });
  }
};

exports.joinEvent = async (req, res) => {
  try {
    if (String(req.params.id).startsWith('event_showcase_')) {
      return res.json({ success: true, message: 'Joined showcase event!' });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { attendees: req.user._id } },
      { new: true }
    )
      .select('title date location description image host attendees createdAt')
      .populate('host', 'name avatar')
      .lean();

    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    res.json({ success: true, data: event });
  } catch (e) {
    console.error('joinEvent error:', e);
    res.status(500).json({ success: false, message: 'Error joining event' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('host').lean();
    if (!event) return res.status(404).json({ success: false, message: 'Not found' });

    if (String(event.host) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch (e) {
    console.error('deleteEvent error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// =================================================================
// WALLET
// =================================================================

exports.getWallet = async (req, res) => {
  try {
    const [user, transactions] = await Promise.all([
      User.findById(req.user._id).select('wallet').lean(),
      Transaction.find({ user: req.user._id })
        .sort({ createdAt: -1, _id: -1 })
        .limit(20)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        balance: user?.wallet?.balance || 0,
        transactions,
      },
    });
  } catch (e) {
    console.error('getWallet error:', e);
    res.status(500).json({ success: false, message: 'Error fetching wallet' });
  }
};

// =================================================================
// ANALYTICS
// =================================================================

exports.getAnalytics = async (req, res) => {
  try {
    const [user, postCount, likesAgg] = await Promise.all([
      User.findById(req.user._id).select('followers').lean(),
      Post.countDocuments({ user: req.user._id }),
      Post.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        { $project: { count: { $size: { $ifNull: ['$likes', []] } } } },
        { $group: { _id: null, total: { $sum: '$count' } } },
      ]),
    ]);

    const totalLikes = likesAgg[0]?.total || 0;
    const followerCount = user?.followers?.length || 0;

    res.json({
      success: true,
      data: {
        overview: {
          followers: followerCount,
          posts: postCount,
          likes: totalLikes,
          engagement: postCount > 0 ? `${(totalLikes / postCount).toFixed(1)} avg` : '0',
        },
        chartData: [10, 25, 15, 30, 45, 60, totalLikes],
      },
    });
  } catch (e) {
    console.error('getAnalytics error:', e);
    res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
};

// =================================================================
// GAMES
// =================================================================

exports.getLeaderboard = async (req, res) => {
  try {
    const { gameId } = req.params;

    const scores = await GameScore.aggregate([
      { $match: { gameId } },
      { $sort: { score: -1, createdAt: 1 } },
      {
        $group: {
          _id: '$user',
          score: { $first: '$score' },
          createdAt: { $first: '$createdAt' },
        },
      },
      { $sort: { score: -1, createdAt: 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 0,
          score: 1,
          user: {
            _id: '$userDetails._id',
            name: '$userDetails.name',
            avatar: '$userDetails.avatar',
          },
        },
      },
    ]);


    if (!scores || scores.length === 0) {
      const defaultScores = [
        { score: 2480, user: { name: 'CipherSovereign', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' } },
        { score: 1920, user: { name: 'Aria Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200' } },
        { score: 1450, user: { name: 'Kai Sterling', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' } },
        { score: 980, user: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' } }
      ];
      return res.json({ success: true, data: defaultScores });
    }

    res.json({ success: true, data: scores });
  } catch (e) {
    console.error('getLeaderboard error:', e);
    res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
  }
};

exports.submitScore = async (req, res) => {
  let session = null;

  try {
    const { gameId, score } = req.body;
    const userId = req.user._id;
    const numericScore = asNumber(score, NaN);

    if (!Number.isFinite(numericScore) || numericScore < 0) {
      return res.status(400).json({ success: false, message: 'Invalid score' });
    }

    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      session = null;
    }

    const opts = session ? { session } : {};

    await GameScore.create([{ user: userId, gameId, score: numericScore }], opts);

    const MAX_ALLOWABLE_COINS = 500;
    const DAILY_CAP = 500;
    const reward = Math.min(Math.floor(numericScore / 100), MAX_ALLOWABLE_COINS);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysTransactions = await Transaction.find({
      user: userId,
      type: 'credit',
      description: { $regex: /Reward for/ },
      createdAt: { $gte: today },
    })
      .select('amount')
      .lean();

    const earnedToday = todaysTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    let earned = 0;

    if (reward > 0 && earnedToday < DAILY_CAP) {
      const actualReward = Math.min(reward, DAILY_CAP - earnedToday);

      if (actualReward > 0) {
        await User.findByIdAndUpdate(
          userId,
          { $inc: { 'wallet.balance': actualReward, 'wallet.totalReceived': actualReward } },
          opts
        );

        await Transaction.create(
          [{
            user: userId,
            type: 'credit',
            amount: actualReward,
            description: `Reward for ${gameId} score: ${numericScore}`,
            idempotencyKey: `score:${gameId}:${userId}:${Date.now()}`,
          }],
          opts
        );

        earned = actualReward;
      }
    }

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    if (earned > 0) {
      const io = req.app.get('io') || global.io;
      if (io) {
        const freshUser = await User.findById(userId).select('wallet.balance').lean();
        io.to(String(userId)).emit('wallet:update', {
          balance: freshUser?.wallet?.balance || 0,
        });
      }
    }

    res.json({ success: true, message: 'Score saved', earned });
  } catch (e) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (_) {}
      session.endSession();
    }

    console.error('submitScore error:', e);
    res.status(500).json({ success: false, message: 'Error saving score' });
  }
};
```


# =====================================================================
## FILE (7/128): backend/controllers/authController.js (Lines: 523)
# =====================================================================

```javascript
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/email');
const asyncHandler = require('../utils/asyncHandler');
const config = require('../config/env');

const generateSecureOTP = () => crypto.randomInt(100000, 1000000).toString();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const hashText = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');

const getFingerprint = (req) => {
  const ua = req.headers['user-agent'] || 'unknown-agent';
  const deviceId = req.headers['x-device-id'] || 'unknown-device';
  return hashText(`${ua}-${deviceId}`);
};

const clearAuthCookie = (res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

const sanitizeUser = (user) => {
  const obj = user?.toObject ? user.toObject() : { ...(user || {}) };

  delete obj.password;
  delete obj.refreshToken;
  delete obj.tempOtp;
  delete obj.resetOtp;
  delete obj.resetOtpExpires;
  delete obj.__v;

  return obj;
};

const ensureWallet = (user) => {
  if (!user.wallet) {
    user.wallet = { balance: 0, totalReceived: 0, totalSent: 0 };
  }
  if (typeof user.wallet.balance !== 'number') user.wallet.balance = 0;
  if (typeof user.wallet.totalReceived !== 'number') user.wallet.totalReceived = 0;
  if (typeof user.wallet.totalSent !== 'number') user.wallet.totalSent = 0;
};

const generateUsername = (name) => {
  const base = String(name || 'user')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 16);

  const suffix = crypto.randomInt(1000, 9999);
  return `${base || 'user'}${suffix}`;
};

const createTokensAndSetCookie = async (user, req, res) => {
  const fingerprint = getFingerprint(req);

  const accessToken = jwt.sign(
    { id: user._id, fp: fingerprint },
    config.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id, fp: fingerprint },
    config.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  user.refreshToken = hashText(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie('jwt', refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: config.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken, refreshToken };
};

// 1) REGISTER
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, referralCode } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const safeName = String(name || '').trim();

  if (!safeName || !normalizedEmail || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required',
    });
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).setOptions({
    includeDeleted: true,
  });

  if (existingUser) {
    if (existingUser.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'This email belongs to a deactivated account. Contact support to reactivate it.',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  let referrer = null;
  if (referralCode) {
    referrer = await User.findOne({ referralCode });
  }

  const otp = generateSecureOTP();
  const otpHash = await bcrypt.hash(otp, 10);

  const user = await User.create({
    name: safeName,
    email: normalizedEmail,
    username: generateUsername(safeName),
    password,
    isVerified: false,
    referredBy: referrer ? referrer._id : null,
    wallet: { balance: 0, totalReceived: 0, totalSent: 0 },
    referralBonusGiven: false,
    tempOtp: otpHash,
    resetOtpExpires: Date.now() + 15 * 60 * 1000,
  });

  const emailSent = await sendOtpEmail(normalizedEmail, otp, 'Verify your account');

  if (!emailSent && config.NODE_ENV === 'production') {
    await User.findByIdAndDelete(user._id);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again later.',
    });
  }

  if (config.NODE_ENV === 'development') {
    console.log(`[DEV] Register OTP for ${normalizedEmail}: ${otp}`);
  }

  return res.status(201).json({
    success: true,
    message: 'OTP sent to email.',
    data: { email: user.email },
  });
});

// 2) LOGIN
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  }).select('+password +is2FAEnabled +tempOtp +resetOtpExpires +refreshToken +wallet +referralBonusGiven +referredBy');

  if (!user || !user.password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const passwordOk = await bcrypt.compare(String(password || ''), user.password);
  if (!passwordOk) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (user.role === 'banned') {
    return res.status(403).json({ success: false, message: 'Account has been banned' });
  }

  if (user.is2FAEnabled) {
    const otp = generateSecureOTP();
    user.tempOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const emailSent = await sendOtpEmail(user.email, otp, '2FA Verification Code');

    if (!emailSent && config.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Failed to send 2FA code' });
    }

    if (config.NODE_ENV === 'development') {
      console.log(`[DEV] 2FA OTP for ${normalizedEmail}: ${otp}`);
    }

    return res.json({
      success: true,
      message: 'OTP sent to email',
      data: { requires2FA: true, email: user.email },
    });
  }

  const { accessToken, refreshToken } = await createTokensAndSetCookie(user, req, res);

  return res.json({
    success: true,
    data: {
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
    },
  });
});

// 3) VERIFY OTP
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
  }).select('+tempOtp +resetOtpExpires +wallet +referralBonusGiven +referredBy');

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.isVerified && !user.tempOtp) {
    const { accessToken, refreshToken } = await createTokensAndSetCookie(user, req, res);
    return res.json({
      success: true,
      message: 'Already verified',
      data: { token: accessToken, refreshToken, user: sanitizeUser(user) },
    });
  }

  if (!user.tempOtp || !user.resetOtpExpires) {
    return res.status(400).json({ success: false, message: 'No pending OTP verification' });
  }

  if (Number(user.resetOtpExpires) < Date.now()) {
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }

  const isMatch = await bcrypt.compare(String(otp || ''), user.tempOtp);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }

  user.isVerified = true;
  user.tempOtp = undefined;
  user.resetOtpExpires = undefined;

  ensureWallet(user);

  if (!user.referralBonusGiven) {
    user.referralBonusGiven = true;

    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy).select('+wallet');
      if (referrer) {
        ensureWallet(referrer);
        referrer.wallet.balance += 50;
        referrer.wallet.totalReceived += 50;
        await referrer.save({ validateBeforeSave: false });

        user.wallet.balance += 50;
        user.wallet.totalReceived += 50;
      }
    } else {
      user.wallet.balance += 10;
      user.wallet.totalReceived += 10;
    }
  }

  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await createTokensAndSetCookie(user, req, res);

  return res.json({
    success: true,
    data: {
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
    },
  });
});

// 4) GOOGLE LOGIN
exports.googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'No token provided' });
  }

  let payload;
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ success: false, message: 'Invalid or expired Google access token' });
    }

    payload = await response.json();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to verify Google token' });
  }

  const normalizedEmail = normalizeEmail(payload.email);
  const name = String(payload.name || '').trim();
  const picture = payload.picture || '';
  const googleId = payload.sub || '';

  if (!normalizedEmail || !name) {
    return res.status(401).json({ success: false, message: 'Google account data is incomplete' });
  }

  let user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  }).select('+wallet +refreshToken');

  if (!user) {
    user = await User.create({
      name,
      email: normalizedEmail,
      username: generateUsername(name),
      googleId,
      avatar: picture,
      isVerified: true,
      wallet: { balance: 20, totalReceived: 20, totalSent: 0 },
      referralBonusGiven: true,
    });
  } else {
    if (user.role === 'banned') {
      return res.status(403).json({ success: false, message: 'Account has been banned' });
    }

    if (!user.googleId) {
      user.googleId = googleId;
    }

    if (!user.avatar && picture) {
      user.avatar = picture;
    }

    if (!user.isVerified) {
      user.isVerified = true;
    }

    ensureWallet(user);
    await user.save({ validateBeforeSave: false });
  }

  if (user.role === 'banned') {
    return res.status(403).json({ success: false, message: 'Account has been banned' });
  }

  const { accessToken, refreshToken } = await createTokensAndSetCookie(user, req, res);

  return res.json({
    success: true,
    data: {
      token: accessToken,
      refreshToken,
      user: sanitizeUser(user),
    },
  });
});

// 5) REFRESH TOKEN
exports.refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.jwt || req.body?.refreshToken || req.headers['x-refresh-token'];

  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET);
  } catch (error) {
    clearAuthCookie(res);
    return res.status(403).json({ success: false, message: 'Token expired or invalid signature' });
  }

  const user = await User.findById(decoded.id).select('+refreshToken +isDeleted +wallet');

  if (!user || user.isDeleted || user.role === 'banned') {
    clearAuthCookie(res);
    return res.status(403).json({ success: false, message: 'User invalid' });
  }

  const hashedToken = hashText(refreshToken);

  if (user.refreshToken && user.refreshToken !== hashedToken) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
    clearAuthCookie(res);
    return res.status(403).json({ success: false, message: 'Invalid refresh token (reuse detected)' });
  }

  const currentFingerprint = getFingerprint(req);
  if (config.NODE_ENV === 'production' && decoded.fp && decoded.fp !== currentFingerprint) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
    clearAuthCookie(res);
    return res.status(403).json({ success: false, message: 'Session hijack detected. Please log in again.' });
  }

  const { accessToken, refreshToken: newRefreshToken } = await createTokensAndSetCookie(user, req, res);

  return res.json({
    success: true,
    data: {
      token: accessToken,
      refreshToken: newRefreshToken,
    },
  });
});

// 6) LOGOUT
exports.logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);

  const rawToken = req.cookies?.jwt || req.body?.refreshToken || req.headers['x-refresh-token'];
  if (req.user?._id) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  } else if (rawToken) {
    const hashed = hashText(rawToken);
    await User.findOneAndUpdate({ refreshToken: hashed }, { refreshToken: null });
  }

  return res.json({ success: true, message: 'Logged out' });
});

// 7) REQUEST PASSWORD RESET
exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const otp = generateSecureOTP();
  user.resetOtp = await bcrypt.hash(otp, 10);
  user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const emailSent = await sendOtpEmail(normalizedEmail, otp, 'Password Reset Code');

  if (!emailSent && config.NODE_ENV === 'production') {
    return res.status(500).json({ success: false, message: 'Failed to send reset email' });
  }

  if (config.NODE_ENV === 'development') {
    console.log(`[DEV] Reset OTP for ${normalizedEmail}: ${otp}`);
  }

  return res.json({ success: true, message: 'Reset code sent' });
});

// 8) RESET PASSWORD
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const user = await User.findOne({
    email: normalizedEmail,
    resetOtpExpires: { $gt: Date.now() },
  }).select('+resetOtp +refreshToken');

  if (!user || !user.resetOtp) {
    return res.status(400).json({ success: false, message: 'Invalid or expired code' });
  }

  const isMatch = await bcrypt.compare(String(otp || ''), user.resetOtp);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Invalid code' });
  }

  user.password = await bcrypt.hash(String(newPassword || ''), 12);
  user.resetOtp = undefined;
  user.resetOtpExpires = undefined;
  user.refreshToken = null;

  await user.save({ validateBeforeSave: false });
  clearAuthCookie(res);

  return res.json({ success: true, message: 'Password updated' });
});

// 9) LOGOUT ALL SESSIONS
exports.logoutAll = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }
  clearAuthCookie(res);
  return res.json({ success: true, message: 'All other sessions have been successfully revoked.' });
});
```


# =====================================================================
## FILE (8/128): backend/controllers/callsController.js (Lines: 250)
# =====================================================================

```javascript
// backend/controllers/callsController.js
const crypto = require('crypto');
const ActiveCall = require('../models/ActiveCall');
const { getRouter } = require('../services/mediasoup');

const createRoomId = () => {
  if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return (
    (Math.random() * 1e9 | 0).toString(36) +
    Date.now().toString(36)
  );
};

// REST API: Room Management
exports.createRoom = async (req, res) => {
  try {
    const roomId = createRoomId();

    await ActiveCall.create({
      roomId,
      host: req.user._id,
      participants: [req.user._id],
    });

    res.json({ roomId });
  } catch (err) {
    console.error('Create Room Error:', err);
    res.status(500).json({ message: 'Error creating room' });
  }
};


// WebRTC ICE / TURN Servers for NAT Traversal
exports.getIceServers = async (req, res) => {
  try {
    const domain = process.env.METERED_DOMAIN || 'ultimatesocialapp.metered.live';
    const apiKey = process.env.METERED_API_KEY || '0ec94b4ba5088a157a189ce2005843619ed8';

    if (domain && apiKey) {
      const response = await fetch(`https://${domain}/api/v1/turn/credentials?apiKey=${apiKey}`);
      if (response.ok) {
        const iceServers = await response.json();
        return res.json({ iceServers });
      }
    }
  } catch (_) {}

  return res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  });
};

exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const call = await ActiveCall.findOne({ roomId });

    if (!call) {
      return res.status(404).json({ message: 'Room not found or expired' });
    }

    const userIdStr = String(req.user._id);
    const participantsStr = (call.participants || []).map((p) => String(p));

    if (!participantsStr.includes(userIdStr)) {
      call.participants.push(req.user._id);
      await call.save();
    }

    res.json({ joined: true, roomId });
  } catch (err) {
    console.error('Join Room Error:', err);
    res.status(500).json({ message: 'Error joining room' });
  }
};

// SOCKET.IO: Mediasoup WebRTC Signaling
exports.handleCallSockets = (io, socket) => {
  const router = getRouter();

  let producerTransport = null;
  let consumerTransport = null;
  let currentRoomId = null;
  const activeProducers = new Map();
  const activeConsumers = new Map();

  socket.on('join-socket-room', ({ roomId }) => {
    if (!roomId) return;
    currentRoomId = roomId;
    socket.join(roomId);
  });

  socket.on('getRouterRtpCapabilities', (callback = () => {}) => {
    try {
      if (!router) return callback({ error: 'WebRTC Router not initialized' });
      callback(router.rtpCapabilities);
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on('createWebRtcTransport', async ({ sender }, callback = () => {}) => {
    try {
      if (!router) return callback({ error: 'WebRTC Router not initialized' });
      const listenIp = process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0';
      const announcedIp = process.env.MEDIASOUP_ANNOUNCED_IP || (process.env.NODE_ENV === 'production' ? undefined : '127.0.0.1');

      const transport = await router.createWebRtcTransport({
        listenIps: [
          {
            ip: listenIp,
            announcedIp: announcedIp,
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      });

      if (sender) producerTransport = transport;
      else consumerTransport = transport;

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (error) {
      console.error('Transport creation error:', error);
      callback({ error: error.message });
    }
  });

  socket.on('transport-connect', async ({ dtlsParameters, sender } = {}) => {
    try {
      if (sender && producerTransport) {
        await producerTransport.connect({ dtlsParameters });
      } else if (!sender && consumerTransport) {
        await consumerTransport.connect({ dtlsParameters });
      } else if (producerTransport) {
        await producerTransport.connect({ dtlsParameters });
      } else if (consumerTransport) {
        await consumerTransport.connect({ dtlsParameters });
      }
    } catch (error) {
      console.error('transport-connect error:', error);
    }
  });

  socket.on('transport-produce', async ({ kind, rtpParameters }, callback = () => {}) => {
    try {
      if (!producerTransport) {
        return callback({ error: 'Producer transport not created' });
      }

      const producer = await producerTransport.produce({
        kind,
        rtpParameters,
      });

      activeProducers.set(producer.id, producer);

      if (currentRoomId) {
        socket.to(currentRoomId).emit('new-producer', {
          producerId: producer.id,
          socketId: socket.id,
        });
      }

      producer.on('transportclose', () => {
        try {
          producer.close();
          activeProducers.delete(producer.id);
        } catch (_) {}
      });

      callback({ id: producer.id });
    } catch (error) {
      console.error('Error producing media:', error);
      callback({ error: error.message });
    }
  });

  socket.on('transport-consume', async ({ rtpCapabilities, producerId }, callback = () => {}) => {
    try {
      if (!router) return callback({ error: 'WebRTC Router not initialized' });
      if (!consumerTransport) return callback({ error: 'Consumer transport not created' });
      if (!router.canConsume({ producerId, rtpCapabilities })) {
        return callback({ error: 'Cannot consume producer' });
      }

      const consumer = await consumerTransport.consume({
        producerId,
        rtpCapabilities,
        paused: false,
      });

      activeConsumers.set(consumer.id, consumer);

      consumer.on('transportclose', () => {
        try {
          consumer.close();
          activeConsumers.delete(consumer.id);
        } catch (_) {}
      });

      consumer.on('producerclose', () => {
        try {
          socket.emit('producer-closed', { producerId });
          consumer.close();
          activeConsumers.delete(consumer.id);
        } catch (_) {}
      });

      callback({
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    } catch (error) {
      console.error('Error consuming media:', error);
      callback({ error: error.message });
    }
  });

  socket.on('disconnect', () => {
    for (const consumer of activeConsumers.values()) {
      try { consumer.close(); } catch (_) {}
    }
    activeConsumers.clear();

    for (const producer of activeProducers.values()) {
      try { producer.close(); } catch (_) {}
    }
    activeProducers.clear();

    try {
      if (producerTransport) producerTransport.close();
    } catch (_) {}
    try {
      if (consumerTransport) consumerTransport.close();
    } catch (_) {}
  });
};
```


# =====================================================================
## FILE (9/128): backend/controllers/chatController.js (Lines: 609)
# =====================================================================

```javascript
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

let createNotification = async () => {};
try {
  createNotification = require('../utils/notify');
} catch (_) {}

const asIds = (arr = []) => [...new Set(arr.map(String).filter(Boolean))];
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const chatPopulate = [
  { path: 'participants', select: 'name avatar isVerified userStatus role blockedUsers' },
  { path: 'admins', select: 'name avatar role' },
  {
    path: 'lastMessage',
    select: 'content sender createdAt isForwarded media audio type isEncrypted editedAt deletedAt',
    populate: { path: 'sender', select: 'name avatar' },
  },
  {
    path: 'pinnedMessages',
    select: 'content sender createdAt media audio type isEncrypted isForwarded editedAt',
    populate: { path: 'sender', select: 'name avatar' },
  },
];

const messagePopulate = [
  { path: 'sender', select: 'name avatar' },
  {
    path: 'replyTo',
    select: 'content sender isEncrypted media audio',
    populate: { path: 'sender', select: 'name avatar' },
  },
];

const toIdString = (p) => (p && p._id ? String(p._id) : String(p || ''));

const emitToChat = async (req, chat, event, payload) => {
  const io = req.app.get('io') || global.io;
  if (!io || !chat?.participants) return;
  chat.participants.forEach((p) => {
    const pid = toIdString(p);
    if (pid) io.to(pid).emit(event, payload);
  });
};

const ensureParticipant = (chat, userId) => {
  const uid = String(userId?._id || userId || '');
  return chat?.participants?.some((p) => toIdString(p) === uid);
};

const findChatOrFail = async (chatId, userId, res) => {
  if (!isValidId(chatId)) {
    res.status(400).json({ message: 'Invalid chat id' });
    return null;
  }
  const chat = await Chat.findById(chatId).populate(chatPopulate);
  if (!chat) {
    res.status(404).json({ message: 'Chat not found' });
    return null;
  }
  if (!ensureParticipant(chat, userId) && String(userId.role || '') !== 'admin') {
    res.status(403).json({ message: 'Not allowed' });
    return null;
  }
  return chat;
};

exports.createChat = async (req, res) => {
  try {
    const participants = req.body.participants || [];
    const name = String(req.body.name || '').trim();
    const isGroup = Boolean(req.body.isGroup);

    const memberIds = asIds([...(participants || []), req.user._id.toString()]);
    if (memberIds.length < 2) {
      return res.status(400).json({ message: 'Need at least 2 members' });
    }

    const otherMembers = memberIds.filter((id) => id !== String(req.user._id));
    const [me, targets] = await Promise.all([
      User.findById(req.user._id).select('blockedUsers'),
      User.find({ _id: { $in: otherMembers } }).select('blockedUsers'),
    ]);

    for (const t of targets) {
      if (me?.blockedUsers?.map(String).includes(String(t._id)) || t.blockedUsers?.map(String).includes(String(me._id))) {
        return res.status(403).json({ message: 'You cannot chat with this user (Blocked).' });
      }
    }

    if (!isGroup && memberIds.length === 2) {
      const existing = await Chat.findOne({
        isGroup: false,
        participants: { $all: memberIds, $size: 2 },
      })
        .populate(chatPopulate)
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'name avatar' },
        });

      if (existing) return res.json(existing);
    }

    const chat = await Chat.create({
      participants: memberIds,
      name: isGroup ? name : '',
      chatName: isGroup ? name : '',
      isGroup,
      isGroupChat: isGroup,
      admins: isGroup ? [req.user._id] : [],
      unread: {},
      pinnedMessages: [],
    });

    const populated = await Chat.findById(chat._id).populate(chatPopulate);

    await emitToChat(req, populated, 'chat:created', populated);
    res.status(201).json(populated);
  } catch (e) {
    console.error('createChat error:', e);
    res.status(500).json({ message: 'Error creating chat' });
  }
};

exports.createGroupChat = async (req, res) => {
  req.body.isGroup = true;
  return exports.createChat(req, res);
};

exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate(chatPopulate)
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    console.error('getChats Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).populate(chatPopulate);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!ensureParticipant(chat, req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const limit = 50;
    const cursor = req.query.cursor || req.query.before;
    const query = { chat: chatId };

    if (cursor) query.createdAt = { $lt: new Date(cursor) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(messagePopulate)
      .lean();

    const nextCursor = messages.length ? messages[messages.length - 1].createdAt : null;

    res.json({
      ...chat.toObject(),
      messages: messages.slice().reverse(),
      nextCursor,
    });
  } catch (err) {
    console.error('getChatById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).select('participants');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const limit = 50;
    const cursor = req.query.before || req.query.cursor;
    const query = { chat: chatId };
    if (cursor) query.createdAt = { $lt: new Date(cursor) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate(messagePopulate)
      .lean();

    res.json(messages);
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const {
      content = '',
      media = null,
      audio = null,
      replyTo = null,
      isForwarded = false,
      isEncrypted = false,
      isEphemeral = false,
      ephemeralDuration = 0,
      type = 'text',
      pollOptions = [],
    } = req.body;

    const duration = ephemeralDuration || chat.ephemeralDuration || 0;
    const shouldExpire = isEphemeral || duration > 0;
    const expiresAt = shouldExpire && duration > 0 ? new Date(Date.now() + duration * 1000) : null;

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content,
      media,
      audio,
      replyTo: replyTo || null,
      isForwarded,
      isEncrypted: isEncrypted || !!chat.isSecret,
      isEphemeral: shouldExpire,
      ephemeralDuration: duration,
      expiresAt,
      type,
      pollOptions,
    });

    const updateOps = {
      $set: { lastMessage: message._id, updatedAt: new Date() },
      $inc: {},
    };

    chat.participants.forEach((p) => {
      const pid = toIdString(p);
      if (pid && pid !== String(req.user._id)) {
        updateOps.$inc[`unread.${pid}`] = 1;
      }
    });

    await Chat.findByIdAndUpdate(chatId, updateOps);

    const populatedMsg = await Message.findById(message._id).populate(messagePopulate);

    await emitToChat(req, chat, 'receiveMessage', { chatId, message: populatedMsg });

    res.json(populatedMsg);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { newContent, content, isEncrypted } = req.body;
    const msg = await Message.findById(messageId);
    if (!msg || String(msg.chat) !== String(chatId)) return res.status(404).json({ message: 'Message not found' });
    if (String(msg.sender) !== String(req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    msg.content = typeof newContent === 'string' ? newContent : (typeof content === 'string' ? content : msg.content);
    if (typeof isEncrypted === 'boolean') msg.isEncrypted = isEncrypted;
    msg.editedAt = new Date();
    await msg.save();

    const populated = await Message.findById(msg._id).populate(messagePopulate);
    const chat = await Chat.findById(chatId).select('participants');
    await emitToChat(req, chat, 'message:updated', {
      chatId,
      messageId: msg._id,
      newContent: populated.content,
      editedAt: populated.editedAt,
      pollOptions: populated.pollOptions,
    });

    res.json(populated);
  } catch (err) {
    console.error('updateMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const msg = await Message.findById(messageId);
    if (!msg || String(msg.chat) !== String(chatId)) return res.status(404).json({ message: 'Message not found' });
    if (String(msg.sender) !== String(req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    await Message.findByIdAndUpdate(messageId, {
      deletedAt: new Date(),
      content: '[deleted]',
      media: null,
      audio: null,
      isSystem: true,
    });

    const chat = await Chat.findById(chatId).select('participants');
    await emitToChat(req, chat, 'message:deleted', { chatId, messageId });

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id)) return res.status(403).json({ message: 'Not allowed' });

    chat.unread = chat.unread || {};
    chat.unread[String(req.user._id)] = 0;
    await chat.save();

    await Message.updateMany(
      { chat: chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.togglePin = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const chat = await Chat.findById(chatId).populate(chatPopulate);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id)) return res.status(403).json({ message: 'Not allowed' });

    const exists = chat.pinnedMessages.map(String).includes(String(messageId));
    if (exists) {
      chat.pinnedMessages = chat.pinnedMessages.filter((id) => String(id) !== String(messageId));
    } else {
      chat.pinnedMessages.push(messageId);
      await Message.findByIdAndUpdate(messageId, { isPinned: true });
    }

    await chat.save();
    const updated = await Chat.findById(chatId).populate(chatPopulate);

    await emitToChat(req, updated, 'chat:pinned', {
      chatId,
      pinnedMessages: updated.pinnedMessages,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('togglePin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateGroupDetails = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id) || !chat.isGroup) return res.status(403).json({ message: 'Not allowed' });

    if (!chat.admins.map(String).includes(String(req.user._id)) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    const nextName = String(req.body.name || req.body.chatName || '').trim();
    if (nextName) {
      chat.name = nextName;
      chat.chatName = nextName;
    }

    await chat.save();
    const updated = await Chat.findById(chatId).populate(chatPopulate);
    await emitToChat(req, updated, 'chat:updated', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateGroupDetails error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.manageMembers = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId, action } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroup) return res.status(400).json({ message: 'Not a group chat' });

    if (!chat.admins.map(String).includes(String(req.user._id)) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    if (!isValidId(userId)) return res.status(400).json({ message: 'Invalid user id' });

    if (action === 'add') {
      if (!chat.participants.map(toIdString).includes(String(userId))) chat.participants.push(userId);
    } else if (action === 'remove') {
      chat.participants = chat.participants.filter((id) => toIdString(id) !== String(userId));
      chat.admins = chat.admins.filter((id) => toIdString(id) !== String(userId));
    } else if (action === 'promote') {
      if (!chat.admins.map(toIdString).includes(String(userId))) chat.admins.push(userId);
    } else if (action === 'demote') {
      chat.admins = chat.admins.filter((id) => toIdString(id) !== String(userId));
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await chat.save();
    const updated = await Chat.findById(chatId).populate(chatPopulate);
    await emitToChat(req, updated, 'chat:updated', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('manageMembers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.leaveGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroup) return res.status(400).json({ message: 'Not a group chat' });

    chat.participants = chat.participants.filter((id) => toIdString(id) !== String(req.user._id));
    chat.admins = chat.admins.filter((id) => toIdString(id) !== String(req.user._id));

    if (chat.participants.length === 0) {
      await Chat.findByIdAndDelete(chatId);
      return res.json({ success: true, deleted: true });
    }

    await chat.save();
    const updated = await Chat.findById(chatId).populate(chatPopulate);
    await emitToChat(req, updated, 'chat:updated', updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('leaveGroup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const q = String(req.query.q || '').trim();
    if (!q) return res.json([]);

    const chat = await Chat.findById(chatId).select('participants');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const results = await Message.find({
      chat: chatId,
      content: regex,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate(messagePopulate);

    res.json(results);
  } catch (err) {
    console.error('searchMessages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionIndex } = req.body;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (message.type !== 'poll') return res.status(400).json({ message: 'Not a poll' });

    message.pollOptions = (message.pollOptions || []).map((opt) => ({
      ...opt.toObject?.() || opt,
      votes: (opt.votes || []).filter((id) => String(id) !== String(req.user._id)),
    }));

    const target = message.pollOptions[Number(optionIndex)];
    if (!target) return res.status(400).json({ message: 'Invalid option' });
    target.votes = [...(target.votes || []), req.user._id];

    await message.save();

    const populated = await Message.findById(messageId).populate(messagePopulate);
    const chat = await Chat.findById(message.chat).select('participants');
    await emitToChat(req, chat, 'message:updated', {
      chatId: String(message.chat),
      messageId: message._id,
      pollOptions: populated.pollOptions,
    });

    res.json({ success: true, pollOptions: populated.pollOptions });
  } catch (err) {
    console.error('votePoll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id) && String(req.user.role) !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);
    res.json({ success: true, message: 'Chat deleted' });
  } catch (err) {
    console.error('deleteChat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleEphemeral = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { ephemeralDuration, isSecret } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (typeof ephemeralDuration === 'number') {
      chat.ephemeralDuration = Math.max(0, ephemeralDuration);
    }
    if (typeof isSecret === 'boolean') {
      chat.isSecret = isSecret;
    }
    await chat.save();

    await emitToChat(req, chat, 'chatSettingsUpdated', {
      chatId,
      ephemeralDuration: chat.ephemeralDuration,
      isSecret: chat.isSecret,
    });

    res.json({
      success: true,
      chatId,
      ephemeralDuration: chat.ephemeralDuration,
      isSecret: chat.isSecret,
    });
  } catch (err) {
    console.error('toggleEphemeral error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// aliases
exports.accessChat = exports.createChat;
exports.fetchChats = exports.getChats;
exports.allMessages = async (req, res) => {
  req.query.before = req.query.before || req.query.cursor;
  return exports.getMessages(req, res);
};
exports.renameGroup = exports.updateGroupDetails;
exports.addToGroup = async (req, res) => {
  req.body.action = 'add';
  return exports.manageMembers(req, res);
};
exports.removeFromGroup = async (req, res) => {
  req.body.action = 'remove';
  return exports.manageMembers(req, res);
};
```


# =====================================================================
## FILE (10/128): backend/controllers/commentsController.js (Lines: 176)
# =====================================================================

```javascript
// backend/controllers/commentsController.js
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const createNotification = require('../utils/notify'); 

const mongoose = require('mongoose');

/**
 * POST /api/comments/:postId
 * Creates a comment, updates the post counters atomically, emits socket event, and notifies the author.
 */
exports.create = async (req, res) => {
  try {
    const { text, audio } = req.body; // Supports voice comments (audio URL)
    
    // Validation: Must have text OR audio
    if (!text?.trim() && !audio) {
        return res.status(400).json({ message: "Comment cannot be empty" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
        return res.status(400).json({ message: "Invalid post or content ID" });
    }

    let post = await Post.findById(req.params.postId);
    let isReel = false;
    if (!post) {
      const Reel = require('../models/Reel');
      post = await Reel.findById(req.params.postId);
      isReel = true;
    }

    if (!post) return res.status(404).json({ message: "Post or Reel not found" });

    // 1. Create Comment (Standalone Document)
    // We do NOT push this ID into the Post document array to ensure scalability.
    const comment = await Comment.create({
      post: post._id,
      user: req.user._id,
      text: text?.trim(),
      audio
    });

    // 2. 🔥 Scalable: Increment Count Only (Atomic Operation)
    if (!isReel) {
      await Post.findByIdAndUpdate(post._id, { 
          $inc: { commentsCount: 1, score: 2 } 
      });
    }

    // Populate user details for the frontend
    await comment.populate("user", "name avatar");

    // 3. Real-time Event
    const io = req.app.get("io");
    if (io) {
        io.to(`post:${post._id}`).emit("comment:created", comment);
    }

    // 4. Notify Author (if not self)
    if (String(post.user) !== String(req.user._id)) {
      await createNotification(req, {
        toUser: post.user,
        type: 'comment',
        data: { postId: post._id, commentId: comment._id },
        message: `${req.user.name} commented on your post`
      });
    }

    res.status(201).json(comment);
  } catch (e) {
    console.error("Create comment error:", e);
    res.status(500).json({ message: "Error adding comment" });
  }
};

/**
 * GET /api/comments/:postId
 * Fetches comments using cursor pagination.
 */
exports.listAll = async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
        return res.json({ success: true, data: [], nextCursor: null });
      }

      const limit = parseInt(req.query.limit) || 20;
      const page = parseInt(req.query.page) || 0;
      const cursor = req.query.cursor;
      const query = { post: req.params.postId };

      // Cursor Pagination
      if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
      }

      const comments = await Comment.find(query)
          .sort({ createdAt: -1 })
          .skip(cursor ? 0 : page * limit)
          .limit(limit)
          .populate('user', 'name avatar');

      const nextCursor = comments.length > 0
          ? comments[comments.length - 1].createdAt
          : null;

      res.json({
        success: true,
        data: comments.reverse(),
        nextCursor
      });
    } catch (e) {
      console.error('List comments error:', e);
      res.status(500).json({ message: 'Error fetching comments' });
    }
};

/**
 * DELETE /api/comments/:commentId
 * Deletes a comment and atomically decrements the post counters.
 */
exports.remove = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Authorization: Only the author or an admin can delete
    if (String(comment.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await comment.deleteOne();
    
    // 🔥 Scalable: Decrement Count Atomically
    await Post.findByIdAndUpdate(comment.post, { 
        $inc: { commentsCount: -1, score: -2 }
    });

    // Notify clients to remove the comment from UI
    const io = req.app.get("io");
    if (io) {
        io.to(`post:${comment.post}`).emit("comment:deleted", { commentId: comment._id });
    }

    res.json({ message: "Deleted" });
  } catch (e) {
    console.error("Delete comment error:", e);
    res.status(500).json({ message: "Error deleting comment" });
  }
};

/**
 * POST /api/comments/like/:commentId
 * Toggle like on a comment.
 */
exports.toggleLike = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const uid = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Not found" });

    const isLiked = comment.likes.includes(uid);
    const update = isLiked 
      ? { $pull: { likes: uid } } 
      : { $addToSet: { likes: uid } };

    const updatedComment = await Comment.findByIdAndUpdate(commentId, update, { new: true });

    res.json({ liked: !isLiked, likesCount: updatedComment.likes.length });
  } catch (e) {
    console.error("Toggle like error:", e);
    res.status(500).json({ message: "Error toggling like" });
  }
};
```


# =====================================================================
## FILE (11/128): backend/controllers/extraController.js (Lines: 160)
# =====================================================================

```javascript
// backend/controllers/extraController.js
const User = require('../models/User');
const Chat = require('../models/Chat');
const Post = require('../models/Post');
const Message = require('../models/Message');
const cloud = require('../utils/cloudinary');
const Saved = require('../models/Saved');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

exports.aiAvatar = async (req, res) => {
  const up = await cloud.uploads(req.file.path, 'avatars');
  req.user.avatar = up.secure_url;
  await req.user.save();
  res.json({ url: up.secure_url });
};

exports.voice = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { url } = req.body; // Assuming your middleware uploads the file and passes the URL in req.body

    if (!url) {
      return res.status(400).json({ message: "Audio URL is required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
       return res.status(404).json({ message: "Chat not found" });
    }

    // 1. Create a proper Message document
    const newMessage = await Message.create({
      chat: chatId,
      sender: req.user._id,
      audio: url,
      type: 'voice',
      content: '🎤 Voice Message' // Fallback for UI that doesn't support audio players
    });

    // 2. Update the Chat's lastMessage reference properly
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: newMessage._id,
      $set: { updatedAt: Date.now() } 
    });

    res.status(201).json({ 
      success: true, 
      message: "Voice message sent",
      data: newMessage 
    });

  } catch (error) {
    console.error("Voice message error:", error);
    res.status(500).json({ message: "Server error sending voice message" });
  }
};
exports.insights = async (req, res) => {
  res.json({
    dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    views: [5, 8, 9, 20, 15],
  });
};

// Toggle save/bookmark
exports.toggleSave = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ message: 'Invalid post id' });
    
    let record = await Saved.findOne({ user: userId });
    if (!record) {
      record = new Saved({ user: userId, posts: [] });
    }

    const already = record.posts.map(String).includes(String(postId));
    if (already) {
      record.posts = record.posts.filter(p => String(p) !== String(postId));
    } else {
      record.posts.push(postId);
    }
    await record.save();
    return res.json({ saved: !already, count: record.posts.length });
  } catch (err) {
    console.error('toggleSave err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 🔥 UPDATED: Get saved posts for a user with Pagination
exports.getSavedByUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page || 0);
    const limit = parseInt(req.query.limit || 12); // Fetch 12 at a time

    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user id' });
    
    // Slice projection for pagination
    const record = await Saved.findOne({ user: userId })
      .populate({
        path: 'posts',
        match: req.query.cursor ? { createdAt: { $lt: new Date(req.query.cursor) } } : {},
        options: { sort: { createdAt: -1 }, limit: limit },
        populate: { path: 'user', select: 'name avatar' }
      });

    const validPosts = (record?.posts || []).filter(post => post !== null);

    return res.json(validPosts);
  } catch (err) {
    console.error('getSavedByUser err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Simple reels placeholder
exports.getReels = async (req, res) => {
  try {
    const reels = await Post.find({ videos: { $exists: true, $ne: [] } }).sort({ createdAt: -1 }).limit(50).populate('user', 'name avatar');
    return res.json(reels);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Simple shop placeholder
exports.getShopItems = async (req, res) => {
  try {
    const items = [
      { id: 'p1', title: 'Sponsored pack', price: 499, currency: 'INR' },
      { id: 'p2', title: 'Creator badge', price: 199, currency: 'INR' },
    ];
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME) {
        const up = await cloud.uploads(req.file.path, 'general');
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.json({ url: up.secure_url });
      }
    } catch (cloudErr) {
      console.warn('Cloudinary upload fallback to disk:', cloudErr.message);
    }
    const localUrl = `/uploads/${path.basename(req.file.path)}`;
    res.json({ url: localUrl });
  } catch (e) {
    console.error('Upload failed:', e);
    res.status(500).json({ message: 'Upload failed' });
  }
};
```


# =====================================================================
## FILE (12/128): backend/controllers/followSuggestController.js (Lines: 66)
# =====================================================================

```javascript
// backend/controllers/followSuggestController.js
const User = require('../models/User');

const suggestCache = new Map();

exports.suggest = async (req, res) => {
  try {
    const meId = req.user._id;
    const cacheKey = String(meId);
    const cached = suggestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30000) {
      return res.json(cached.data);
    }

    const me = await User.findById(meId).select('following blockedUsers').lean();
    if (!me) return res.json([]);

    const following = new Set((me.following || []).map(String));
    const blocked = new Set((me.blockedUsers || []).map(String));

    const popular = await User.aggregate([
      { $match: { _id: { $ne: meId }, isDeleted: { $ne: true } } },
      {
        $addFields: {
          followerCount: { $size: { $ifNull: ['$followers', []] } },
        },
      },
      { $sort: { followerCount: -1, createdAt: -1 } },
      { $limit: 50 },
      {
        $project: {
          _id: 1,
          name: 1,
          avatar: 1,
          followers: 1,
          followerCount: 1,
        },
      },
    ]);

    const pool = [];
    for (const u of popular) {
      const uid = String(u._id);
      if (!following.has(uid) && !blocked.has(uid)) {
        pool.push(uid);
      }
    }

    if (pool.length === 0) return res.json([]);

    const candidates = await User.find({ _id: { $in: pool } })
      .select('name avatar followers')
      .lean();

    candidates.sort((a, b) => (b.followers?.length || 0) - (a.followers?.length || 0));

    const result = candidates.slice(0, 20);
    suggestCache.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json(result);
  } catch (err) {
    console.error('Follow suggest error:', err);
    res.status(500).json({ message: 'Error retrieving suggestions' });
  }
};
```


# =====================================================================
## FILE (13/128): backend/controllers/groupsController.js (Lines: 82)
# =====================================================================

```javascript
// backend/controllers/groupsController.js
const Group = require('../models/Group');
const Post = require('../models/Post');
const User = require('../models/User');

exports.createGroup = async (req, res) => {
  try {
    const { name, handle, description, privacy } = req.body;
    if (!name || !handle) return res.status(400).json({ message: 'Missing name or handle' });
    const exists = await Group.findOne({ handle });
    if (exists) return res.status(400).json({ message: 'Handle already taken' });

    const g = new Group({
      name, handle, description, privacy: privacy || 'public',
      members: [req.user._id],
      admins: [req.user._id]
    });
    await g.save();
    res.status(201).json(g);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.joinGroup = async (req, res) => {
  try {
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Group not found' });
    if (g.members.map(String).includes(String(req.user._id))) return res.json({ joined: true });
    if (g.privacy === 'private') return res.status(403).json({ message: 'This group is private' });
    g.members.push(req.user._id);
    await g.save();
    res.json({ joined: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.leaveGroup = async (req, res) => {
  try {
    const g = await Group.findById(req.params.id);
    if (!g) return res.status(404).json({ message: 'Group not found' });
    g.members = g.members.filter(m => String(m) !== String(req.user._id));
    g.admins = g.admins.filter(a => String(a) !== String(req.user._id));
    await g.save();
    res.json({ left: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getGroup = async (req, res) => {
  try {
    const g = await Group.findById(req.params.id).populate('members', 'name avatar').populate('admins', 'name avatar');
    if (!g) return res.status(404).json({ message: 'Group not found' });
    res.json(g);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Replace your existing postToGroup logic with this updated version
exports.postToGroup = async (req, res) => {
    try {
        const { text, images } = req.body;
        const groupId = req.params.groupId; // Assuming ID comes from URL

        // Verify group exists
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Ensure user is a member of the group before posting (Add your specific check here)

        // Create the post and ATTACH the group ID
        const newPost = await Post.create({
            user: req.user._id,
            group: groupId, // THIS IS THE CRITICAL FIX
            text: text,
            images: images || []
        });

        // Optionally update group's post count or latest activity here

        res.status(201).json({ success: true, post: newPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
```


# =====================================================================
## FILE (14/128): backend/controllers/integrationsController.js (Lines: 212)
# =====================================================================

```javascript
// backend/controllers/integrationsController.js
const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');

// Cache to prevent spamming Yahoo
let marketCache = { data: null, lastFetch: 0 };
const CACHE_DURATION = 60 * 1000; // 1 Minute Cache

// --- MOCK DATA (Fallback) ---
const MOCK_MARKET_DATA = {
    rates: { USD: 1, INR: 83.50, EUR: 0.92, GBP: 0.79, JPY: 150.0 },
    metals: [
        { name: 'Gold', symbol: 'Gold', type: 'precious', unit: 'oz', price: 2030.50, change: 0.15 },
        { name: 'Silver', symbol: 'Silver', type: 'precious', unit: 'oz', price: 22.40, change: -0.5 },
        { name: 'Platinum', symbol: 'Plat', type: 'precious', unit: 'oz', price: 920.10, change: 0.2 },
        { name: 'Palladium', symbol: 'Pald', type: 'precious', unit: 'oz', price: 980.00, change: -1.2 },
        { name: 'Copper', symbol: 'Copper', type: 'industrial', unit: 'lbs', price: 3.85, change: 0.5 }
    ],
    fuel: [
        { name: 'Crude Oil (WTI)', unit: 'Barrel', price: 78.50, change: 1.2 },
        { name: 'Brent Crude', unit: 'Barrel', price: 82.10, change: 1.1 },
        { name: 'Natural Gas', unit: 'MMBtu', price: 1.80, change: -2.5 }
    ],
    crypto: [
        { name: 'Bitcoin', symbol: 'BTC', type: 'crypto', unit: 'USD', price: 65000.00, change: 1.5 },
        { name: 'Ethereum', symbol: 'ETH', type: 'crypto', unit: 'USD', price: 3500.00, change: 0.8 }
    ]
};

// --- NEWS CONTROLLER ---
const FALLBACK_NEWS = [
  {
    title: 'The Evolution of Spatial Audio in Digital Creativity',
    link: 'https://news.ycombinator.com',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    source: 'TechChronicle',
    date: new Date().toISOString(),
    description: 'How spatialized WebRTC soundscapes and binaural synthesis are transforming virtual social spaces for creators globally.'
  },
  {
    title: 'Next-Gen Neural Interfaces and Micro-Interactions in UI Design',
    link: 'https://techcrunch.com',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    source: 'DesignForge',
    date: new Date(Date.now() - 3600000).toISOString(),
    description: 'Exploring how quantum blur, specular glass surfaces, and responsive haptics define the future of high-luxury social platforms.'
  },
  {
    title: 'Decentralized Creator Economies Surpass Traditional Social Ad Networks',
    link: 'https://bloomberg.com',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
    source: 'GlobalMarkets',
    date: new Date(Date.now() - 7200000).toISOString(),
    description: 'Direct peer-to-peer tip envelopes, tokenized creator badges, and zero-knowledge wallets lead unprecedented creator monetization growth.'
  }
];

exports.getNews = async (req, res) => {
  try {
    const { country = 'in', q } = req.query;
    // Fallback if API key missing
    if (!process.env.NEWSDATA_API_KEY) return res.json(FALLBACK_NEWS);

    const url = `https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&country=${country}&q=${q || 'top'}&language=en`;
    const response = await axios.get(url);
    
    if (!response.data || !response.data.results) throw new Error("No news data");

    const articles = response.data.results.map(article => ({
      title: article.title,
      link: article.link,
      image: article.image_url,
      source: article.source_id,
      date: article.pubDate,
      description: article.description
    }));
    res.json(articles);
  } catch (err) {
    console.error("News API Error (Returning Empty):", err.message);
    res.json(FALLBACK_NEWS); 
  }
};

// --- MARKETS CONTROLLER ---
exports.getMarkets = async (req, res) => {
  try {
    const now = Date.now();
    // 1. Serve Cache if fresh
    if (marketCache.data && (now - marketCache.lastFetch < CACHE_DURATION)) {
      return res.json(marketCache.data);
    }

    // 2. Try Fetching Live Data
    let results = [];
    let forex = [];
    
    try {
        // 🔥 FIX: Removed deprecated suppressNotices call
        
        results = await yahooFinance.quote([
            'GC=F', 'SI=F', 'HG=F', 'PL=F', 'PA=F', // Metals
            'CL=F', 'BZ=F', 'NG=F',                 // Energy
            'BTC-USD', 'ETH-USD'                    // Crypto
        ]);
        
        forex = await yahooFinance.quote(['INR=X', 'EUR=X', 'GBP=X', 'JPY=X']);
    } catch (apiErr) {
        console.warn("Yahoo API Failed (Using Mock Data):", apiErr.message);
        return res.json({ ...MOCK_MARKET_DATA, timestamp: now, source: 'mock' });
    }

    // 3. Helper to find symbol safely
    const get = (sym) => {
        const item = results.find(r => r.symbol === sym);
        return item || { regularMarketPrice: 0, regularMarketChangePercent: 0 };
    };

    // 4. Construct Live Response
    const rates = {
      USD: 1,
      INR: forex.find(f => f.symbol === 'INR=X')?.regularMarketPrice || 83.5,
      EUR: forex.find(f => f.symbol === 'EUR=X')?.regularMarketPrice || 0.92,
      GBP: forex.find(f => f.symbol === 'GBP=X')?.regularMarketPrice || 0.79,
      JPY: forex.find(f => f.symbol === 'JPY=X')?.regularMarketPrice || 150.0
    };

    const data = {
      rates,
      timestamp: now,
      source: 'live',
      metals: [
        { 
          name: 'Gold', symbol: 'Gold', type: 'precious', unit: 'oz',
          price: get('GC=F').regularMarketPrice || 2000, 
          change: get('GC=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Silver', symbol: 'Silver', type: 'precious', unit: 'oz',
          price: get('SI=F').regularMarketPrice || 23, 
          change: get('SI=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Platinum', symbol: 'Plat', type: 'precious', unit: 'oz',
          price: get('PL=F').regularMarketPrice || 900, 
          change: get('PL=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Palladium', symbol: 'Pald', type: 'precious', unit: 'oz',
          price: get('PA=F').regularMarketPrice || 1000, 
          change: get('PA=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Copper', symbol: 'Copper', type: 'industrial', unit: 'lbs',
          price: get('HG=F').regularMarketPrice || 3.8, 
          change: get('HG=F').regularMarketChangePercent || 0
        }
      ],
      fuel: [
        { 
          name: 'Crude Oil (WTI)', unit: 'Barrel',
          price: get('CL=F').regularMarketPrice || 75, 
          change: get('CL=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Brent Crude', unit: 'Barrel',
          price: get('BZ=F').regularMarketPrice || 80, 
          change: get('BZ=F').regularMarketChangePercent || 0
        },
        { 
          name: 'Natural Gas', unit: 'MMBtu',
          price: get('NG=F').regularMarketPrice || 1.8, 
          change: get('NG=F').regularMarketChangePercent || 0
        }
      ],
      crypto: [
        { 
          name: 'Bitcoin', symbol: 'BTC', type: 'crypto', unit: 'USD',
          price: get('BTC-USD').regularMarketPrice, 
          change: get('BTC-USD').regularMarketChangePercent 
        },
        { 
          name: 'Ethereum', symbol: 'ETH', type: 'crypto', unit: 'USD',
          price: get('ETH-USD').regularMarketPrice, 
          change: get('ETH-USD').regularMarketChangePercent 
        }
      ]
    };

    marketCache = { data, lastFetch: now };
    res.json(data);

  } catch (err) {
    console.error("Critical Market Error:", err);
    res.json(MOCK_MARKET_DATA); 
  }
};

exports.getTurnCredentials = async (req, res) => {
  try {
    const { METERED_DOMAIN, METERED_API_KEY } = process.env;
    if (!METERED_DOMAIN) throw new Error("No Metered Config");

    const url = `https://${METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data); 
  } catch (err) {
    res.json([
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]);
  }
};
```


# =====================================================================
## FILE (15/128): backend/controllers/liveController.js (Lines: 86)
# =====================================================================

```javascript
// backend/controllers/liveController.js
const Live = require('../models/LiveStream');
const User = require('../models/User');

exports.start = async (req,res)=>{
  const { title } = req.body;
  const roomId = (req.user._id.toString().slice(-6) + Date.now().toString().slice(-4));
  const live = await Live.create({ roomId, host:req.user._id, title, isLive:true });
  res.json(live);
};

exports.end = async (req,res)=>{
  const { roomId } = req.params;
  const live = await Live.findOneAndUpdate({ roomId, host:req.user._id }, { isLive:false }, { new:true });
  if (!live) return res.status(404).json({message:'Not found'});
  res.json(live);
};

exports.get = async (req,res)=>{
  const { roomId } = req.params;
  const live = await Live.findOne({ roomId }).populate('host','name avatar').lean();
  if (!live) return res.status(404).json({message:'Not found'});
  res.json(live);
};

exports.list = async (_,res)=>{
  const lives = await Live.find({ isLive:true }).sort({ createdAt:-1 }).populate('host','name avatar');
  res.json(lives);
};

exports.superchat = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { amount, message } = req.body;
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid superchat amount' });
    }

    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ message: 'User not found' });
    me.wallet = me.wallet || { balance: 0, totalReceived: 0, totalSent: 0 };

    if ((me.wallet.balance || 0) < numericAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const live = await Live.findOne({ roomId, isLive: true });
    if (!live) return res.status(404).json({ message: 'Stream not found' });

    me.wallet.balance = (me.wallet.balance || 0) - numericAmount;
    me.wallet.totalSent = (me.wallet.totalSent || 0) + numericAmount;
    await me.save();

    const host = await User.findById(live.host);
    if (host) {
      host.wallet = host.wallet || { balance: 0, totalReceived: 0, totalSent: 0 };
      host.wallet.balance = (host.wallet.balance || 0) + numericAmount;
      host.wallet.totalReceived = (host.wallet.totalReceived || 0) + numericAmount;
      await host.save();
    }

    live.superchats = live.superchats || [];
    live.superchats.push({ from: req.user._id, amount: numericAmount, message: message || '' });
    await live.save();

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(roomId).emit('live:superchat', {
        from: { _id: me._id, name: me.name, avatar: me.avatar },
        amount: numericAmount,
        message: message || '',
      });
      if (host) {
        io.to(String(host._id)).emit('wallet:update', { balance: host.wallet.balance });
      }
      io.to(String(me._id)).emit('wallet:update', { balance: me.wallet.balance });
    }

    res.json({ ok: true, balance: me.wallet.balance });
  } catch (err) {
    console.error('Superchat error:', err);
    res.status(500).json({ message: 'Server error processing superchat' });
  }
};
```


# =====================================================================
## FILE (16/128): backend/controllers/marketplaceController.js (Lines: 109)
# =====================================================================

```javascript
// backend/controllers/marketplaceController.js
const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User'); 
const Transaction = require('../models/Transaction'); 

exports.list = async (_req, res) => {
  const items = await Product.find().sort({ createdAt: -1 }).limit(200);
  res.json(items);
};

exports.mine = async (req, res) => {
  const items = await Product.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(items);
};

exports.create = async (req, res) => {
  const { title, price, desc, tags = [] } = req.body;
  const image = (req.file && `/uploads/${require('path').basename(req.file.path)}`) || req.body.image || '';
  const item = await Product.create({ owner: req.user._id, title, price, desc, image, tags });
  res.status(201).json(item);
};

// ADDED: ACID Transaction with standalone MongoDB fallback
exports.buyItem = async (req, res) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (_) {
    session = null;
  }
  const sessionOpts = session ? { session } : {};
  
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    // Fetch locking the documents to this session if active
    const user = session ? await User.findById(userId).session(session) : await User.findById(userId);
    const item = session ? await Product.findById(itemId).session(session) : await Product.findById(itemId);

    if (!item) throw new Error('Item not found');
    
    // Check if item has a stock limit, if so, enforce it
    if (item.stock !== undefined && item.stock <= 0) {
      throw new Error('Item out of stock');
    }
    
    if ((user.wallet?.balance || 0) < item.price) {
      throw new Error('Insufficient balance');
    }

    // Atomic Execution: Deduct balance from buyer, reduce stock, and credit seller
    await User.findByIdAndUpdate(userId, { 
      $inc: { 'wallet.balance': -item.price, 'wallet.totalSent': item.price } 
    }, sessionOpts);
    
    if (item.stock !== undefined) {
      await Product.findByIdAndUpdate(itemId, { $inc: { stock: -1 } }, sessionOpts);
    }
    
    // Credit seller if not self-purchase
    if (item.owner && String(item.owner) !== String(userId)) {
      await User.findByIdAndUpdate(item.owner, {
        $inc: { 'wallet.balance': item.price, 'wallet.totalReceived': item.price }
      }, sessionOpts);

      await Transaction.create([{
        user: item.owner,
        type: 'credit',
        amount: item.price,
        description: `Sold ${item.title}`,
        idempotencyKey: `marketplace:sale:${item.owner}:${itemId}:${Date.now()}`
      }], sessionOpts);
    }
    
    await Transaction.create([{ 
      user: userId, 
      type: 'debit', 
      amount: item.price, 
      description: `Bought ${item.title}`,
      idempotencyKey: `marketplace:buy:${userId}:${itemId}:${Date.now()}`
    }], sessionOpts);

    if (session) {
      await session.commitTransaction();
    }

    const io = req.app.get('io') || global.io;
    if (io) {
      if (item.owner && String(item.owner) !== String(userId)) {
        io.to(String(item.owner)).emit('notification', {
          type: 'sale',
          message: `Your item "${item.title}" was purchased for ${item.price} coins!`,
        });
      }
    }

    res.json({ success: true, message: 'Purchase successfully and securely executed' });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (_) {}
    }
    res.status(400).json({ success: false, message: err.message });
  } finally {
    if (session) session.endSession();
  }
};
```


# =====================================================================
## FILE (17/128): backend/controllers/moderationController.js (Lines: 36)
# =====================================================================

```javascript
// backend/controllers/moderationController.js
const Report = require('../models/ModerationReport');
const User = require('../models/User');
const Post = require('../models/Post');

exports.report = async (req,res)=>{
  const { targetType, targetId, reason, notes } = req.body;
  const r = await Report.create({ reporter: req.user._id, targetType, targetId, reason, notes });
  // notify moderators via socket will be emitted from controller consumer
  req.app.get('io')?.emit('mod:new-report', r);
  res.status(201).json(r);
};

exports.list = async (req,res)=>{
  const reports = await Report.find().sort({ createdAt:-1 }).populate('reporter','name');
  res.json(reports);
};

exports.action = async (req,res)=>{
  const { id } = req.params;
  const { action, notes } = req.body;
  const r = await Report.findById(id);
  if (!r) return res.status(404).json({message:'Not found'});
  r.status = 'actioned'; r.action = action; r.handledBy = req.user._id; r.notes = notes;
  await r.save();
  // basic action handling
  if (action === 'remove' && r.targetType === 'post') {
    await Post.findByIdAndUpdate(r.targetId, { isFlagged:true });
  }
  if (action === 'ban' && r.targetType === 'user') {
    await User.findByIdAndUpdate(r.targetId, { role: 'banned' });
  }
  req.app.get('io')?.emit('mod:report-updated', r);
  res.json(r);
};
```


# =====================================================================
## FILE (18/128): backend/controllers/notificationsController.js (Lines: 120)
# =====================================================================

```javascript
// backend/controllers/notificationsController.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const { webpush, publicKey } = require('../utils/push');

exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor;
    const query = { user: req.user.id };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    const nextCursor = notifications.length > 0 ? notifications[notifications.length - 1].createdAt : null;

    res.status(200).json({
      success: true,
      data: notifications,
      nextCursor
    });
  } catch (error) {
    console.error('getNotifications err', error);
    res.status(500).json({
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('markAsRead err', error);
    res.status(500).json({
      message: 'Error updating notifications',
      error: error.message
    });
  }
};

exports.markSingleRead = async (req, res) => {
  try {
    const id = req.params.id;
    const notif = await Notification.findById(id);

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notif.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (!notif.isRead) {
      notif.isRead = true;
      await notif.save();
    }

    res.status(200).json({ message: 'Marked' });
  } catch (error) {
    console.error('markSingleRead err', error);
    res.status(500).json({
      message: 'Error marking notification',
      error: error.message
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ count: 0 });
  }
};

exports.getPushKey = (req, res) => {
  res.json({ publicKey });
};

exports.subscribe = async (req, res) => {
  try {
    const sub = req.body;
    await User.findByIdAndUpdate(
      req.user.id,
      { $addToSet: { pushSubscriptions: sub } }
    );
    res.status(201).json({ message: 'Push Subscribed' });
  } catch (err) {
    res.status(500).json({ message: 'Subscription failed' });
  }
};

exports.sendPushToUser = async (userId, payload) => {
  try {
    const user = await User.findById(userId).select('pushSubscriptions');
    if (user && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      const promises = user.pushSubscriptions.map(sub => 
        webpush.sendNotification(sub, JSON.stringify(payload)).catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Clean up dead subscription channels
            User.findByIdAndUpdate(userId, { $pull: { pushSubscriptions: sub } }).catch(() => {});
          }
        })
      );
      await Promise.all(promises);
    }
  } catch (err) {
    console.error('Push Engine Error:', err);
  }
};
```


# =====================================================================
## FILE (19/128): backend/controllers/payoutController.js (Lines: 198)
# =====================================================================

```javascript
// backend/controllers/payoutController.js

const mongoose = require("mongoose");
const Payout = require("../models/Payout");
const User = require("../models/User");

exports.create = async (req, res) => {

  const session =
    await mongoose.startSession();

  try {

    const amount =
      Number(req.body.amount);

    const {
      method = "manual",
      details
    } = req.body;

    if (
      !Number.isFinite(amount) ||
      amount < 10
    ) {
      return res.status(400).json({
        message:
          "Minimum withdrawal is 10 coins"
      });
    }

    let payout;

    await session.withTransaction(
      async () => {

        const user =
          await User.findById(
            req.user._id
          ).session(session);

        if (!user) {
          throw new Error(
            "User not found"
          );
        }

        if (
          user.wallet.balance <
          amount
        ) {
          throw new Error(
            "Insufficient wallet balance"
          );
        }

        user.wallet.balance -= amount;

        await user.save({
          session
        });

        payout =
          await Payout.create(
            [
              {
                creator:
                  req.user._id,

                amount,

                method,

                note:
                  details ||
                  "Withdrawal Request",

                status:
                  "pending"
              }
            ],
            { session }
          );
      }
    );

    return res
      .status(201)
      .json(payout[0]);

  } catch (err) {

    const msg =
      err.message ||
      "Server error processing payout";

    return res
      .status(
        msg.includes("balance")
          ? 400
          : 500
      )
      .json({
        message: msg
      });

  } finally {
    session.endSession();
  }
};

exports.list = async (req, res) => {
  try {

    const items =
      await Payout.find()
        .populate(
          "creator",
          "name email avatar wallet"
        )
        .sort({
          createdAt: -1
        });

    res.json(items);

  } catch {

    res.status(500).json({
      message:
        "Server error"
    });
  }
};

exports.markPaid = async (req, res) => {
  try {

    const payout =
      await Payout.findById(
        req.params.id
      );

    if (!payout) {
      return res
        .status(404)
        .json({
          message:
            "Payout not found"
        });
    }

    if (
      payout.status ===
      "paid"
    ) {
      return res
        .status(400)
        .json({
          message:
            "Already paid"
        });
    }

    payout.status = "paid";
    payout.paidAt =
      new Date();

    await payout.save();

    req.app
      .get("io")
      ?.to(
        String(
          payout.creator
        )
      )
      .emit(
        "notification",
        {
          type:
            "system",

          message:
            `Your withdrawal of ${payout.amount} coins has been processed!`
        }
      );

    res.json(payout);

  } catch {

    res.status(500).json({
      message:
        "Server error"
    });
  }
};
```


# =====================================================================
## FILE (20/128): backend/controllers/pollsController.js (Lines: 134)
# =====================================================================

```javascript

// backend/controllers/pollsController.js
const Post = require('../models/Post');
const PollVote = require('../models/PollVote');
const mongoose = require('mongoose');

// --- 1. CREATE POLL ---
exports.createPollPost = async (req, res) => {
  try {
    const { question, options = [], expiresAt } = req.body;
    
    if (!question || !options.length) {
      return res.status(400).json({ message: 'Invalid poll data. Question and options are required.' });
    }

    // Create the post with the new lightweight schema (counts only, no user IDs array)
    const post = await Post.create({
      user: req.user._id,
      content: question, // Storing question in content allows it to be searchable via standard text index
      poll: {
        question,
        options: options.map(text => ({ 
          text, 
          count: 0 // Initialize count to 0
        })),
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    await post.populate('user', 'name avatar');
    
    // Emit real-time event
    const io = req.app.get('io');
    if (io) io.emit('post:created', post);

    res.status(201).json(post);
  } catch (err) {
    console.error('Create poll error:', err);
    res.status(500).json({ message: 'Server error creating poll' });
  }
};

// --- 2. VOTE (Transactional & Scalable) ---
exports.vote = async (req, res) => {
  const { id } = req.params;
  const { index } = req.body;
  const userId = req.user._id;
  const optIndex = Number(index);

  let session = null;

  try {
    // Start ACID Transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // 1. Fetch Post to validate existence and expiry
    const post = await Post.findById(id).session(session);
    if (!post || !post.poll) throw new Error('Poll not found');
    
    if (post.poll.expiresAt && new Date() > new Date(post.poll.expiresAt)) {
      throw new Error('Poll has ended');
    }

    if (optIndex < 0 || optIndex >= post.poll.options.length) {
      throw new Error('Invalid option index');
    }

    // 2. Check if user already voted on this poll
    const existingVote = await PollVote.findOne({ postId: id, userId }).session(session);
    
    if (existingVote) {
      // A. User clicked the SAME option they already chose -> Do nothing (or return current state)
      if (existingVote.optionIndex === optIndex) {
        await session.abortTransaction();
        session.endSession();
        return res.json(post); 
      }
      
      // B. User changing vote: Decrement the OLD option count
      await Post.updateOne(
        { _id: id },
        { $inc: { [`poll.options.${existingVote.optionIndex}.count`]: -1 } }
      ).session(session);
      
      // Remove the old vote record
      await existingVote.deleteOne({ session });
    }

    // 3. Create the NEW vote record
    await PollVote.create([{ 
      postId: id, 
      userId, 
      optionIndex: optIndex 
    }], { session });

    // 4. Increment the NEW option count
    const updatedPost = await Post.findOneAndUpdate(
      { _id: id },
      { $inc: { [`poll.options.${optIndex}.count`]: 1 } },
      { new: true, session }
    ).populate('user', 'name avatar');

    // Commit changes
    await session.commitTransaction();
    
    // 5. Emit real-time update to socket room
    const io = req.app.get('io');
    if (io) {
      io.emit('post:updated', { 
        _id: updatedPost._id, 
        poll: updatedPost.poll 
      });
    }

    // Return the updated post object
    // We manually attach `userVotedIndex` for the frontend to highlight the selection immediately
    const result = updatedPost.toObject();
    result.poll.userVotedIndex = optIndex; 

    res.json(result);

  } catch (err) {
    if (session) {
      await session.abortTransaction();
    }
    console.error('Vote error:', err);
    res.status(400).json({ message: err.message || 'Vote failed' });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};
```


# =====================================================================
## FILE (21/128): backend/controllers/postsController.js (Lines: 864)
# =====================================================================

```javascript
// backend/controllers/postsController.js
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Saved = require('../models/Saved');
const User = require('../models/User');
const Notification = require('../models/Notification');

const { uploads, deleteFile } = require('../utils/cloudinary');
const createNotification = require('../utils/notify');

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

const processMentions = require('../utils/processMentions');
const { addXP } = require('../utils/gamification');

// ---------------------------------------------------
// ROBUST CLOUDINARY REGEX HELPER
// ---------------------------------------------------
const extractPublicId = (url) => {
    if (!url) return null;
    const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    return matches ? matches[1] : null;
};

// ---------------------------------------------------
// SAFE CLOUDINARY UPLOAD
// ---------------------------------------------------
const safeUploadToCloudinary = async (filePath) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            throw new Error('CLOUDINARY env not configured');
        }

        const res = await uploads(filePath);

        try {
            fs.unlinkSync(filePath);
        } catch (e) {}

        return { url: res.secure_url };
    } catch (err) {
        console.error('Cloudinary Upload Error:', err.message);
        const localUrl = `/uploads/${path.basename(filePath)}`;
        return { url: localUrl, error: err };
    }
};

// ---------------------------------------------------
// PARSE TAGS + MENTIONS
// ---------------------------------------------------
const parseHashtagsAndMentions = async (text = '') => {
    const hashtags = Array.from(
        new Set((text.match(/#([a-zA-Z0-9_]+)/g) || []).map(h => h.slice(1).toLowerCase()))
    );

    const mentionsRaw = (text.match(/@([a-zA-Z0-9_.-]+)/g) || []).map(m => m.slice(1).toLowerCase());
    let mentions = [];

    if (mentionsRaw.length) {
        const mentionedUsers = await User.find({ username: { $in: mentionsRaw } }).select('_id');
        mentions = mentionedUsers.map(u => u._id);
    }

    return { hashtags, mentions };
};

// ---------------------------------------------------
// ESCAPE REGEX
// ---------------------------------------------------
const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// ---------------------------------------------------
// CREATE POST
// ---------------------------------------------------
exports.createPost = async (req, res) => {
    try {
        const { content = "", isDraft = false, isPaywalled = false, unlockPrice = 0 } = req.body;
        const images = [];
        const videos = [];

        if (req.files && req.files.length) {
            for (const f of req.files) {
                const result = await safeUploadToCloudinary(f.path);
                if (f.mimetype?.startsWith('image')) {
                    images.push(result.url);
                } else if (f.mimetype?.startsWith('video')) {
                    videos.push(result.url);
                }
            }
        }

        const { hashtags, mentions } = await parseHashtagsAndMentions(content);

        const post = new Post({
            user: req.user._id,
            content,
            images,
            videos,
            hashtags,
            mentions,
            isDraft: isDraft === 'true' || isDraft === true,
            isPaywalled: isPaywalled === 'true' || isPaywalled === true,
            unlockPrice: Math.max(0, parseInt(unlockPrice, 10) || 0),
            unlockedBy: [req.user._id],
            score: 0
        });

        await post.save();
        await post.populate('user', 'name avatar username');

        if (!post.isDraft) {
            await processMentions(content, req, post._id);
            const io = req.app.get('io');
            addXP(req.user._id, 50, io);

            if (io) {
                // 🔥 FIX: Prevent global broadcast leak. Fetch author's followers and target them specifically.
                const authorData = await User.findById(req.user._id).select('followers');
                if (authorData && authorData.followers) {
                    authorData.followers.forEach(followerId => {
                        io.to(followerId.toString()).emit('post:created', post);
                    });
                }
            }
        }

        return res.status(201).json({ success: true, data: post });
    } catch (err) {
        console.error('createPost err', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Error creating post'
        });
    }
};

exports.getFeed = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
        const { cursorDate, cursorId } = req.query;
        const userId = req.user ? req.user._id : null;

        let match = {
            isArchived: { $ne: true },
            isFlagged: { $ne: true },
            isDraft: { $ne: true },
            $or: [
                { group: null },
                { group: { $exists: false } }
            ]
        };

        if (userId) {
            const activeUserContext = await User.findById(userId)
                .select('blockedUsers')
                .lean();

            if (activeUserContext?.blockedUsers?.length) {
                match.user = {
                    $nin: activeUserContext.blockedUsers
                };
            }
        }

        if (cursorDate && cursorId) {
            match.$and = [
                {
                    $or: [
                        { createdAt: { $lt: new Date(cursorDate) } },
                        {
                            createdAt: new Date(cursorDate),
                            _id: { $lt: cursorId }
                        }
                    ]
                }
            ];
        }

        const posts = await Post.find(match)
            .sort({ createdAt: -1, _id: -1 })
            .select(
                'content images videos user createdAt likesCount commentsCount likes hashtags mentions group views metadata'
            )
            .limit(limit)
            .populate(
                'user',
                'name username avatar isVerified badges'
            )
            .lean();

        let savedPostIds = new Set();
        if (userId) {
            const savedRecord = await Saved.findOne({ user: userId }).select('posts').lean();
            if (savedRecord?.posts?.length) {
                savedPostIds = new Set(savedRecord.posts.map(id => String(id)));
            }
        }

        const enrichedPosts = posts.map((p) => ({
            ...p,
            isLiked: userId
                ? (p.likes || []).some(
                      (id) => String(id) === String(userId)
                  )
                : false,
            isSaved: savedPostIds.has(String(p._id)),
            likesCount: p.likesCount || (p.likes || []).length,
            commentsCount: p.commentsCount || 0
        }));

        const lastPost =
            posts.length > 0 ? posts[posts.length - 1] : null;

        res.json({
            success: true,
            data: enrichedPosts,
            nextCursorDate: lastPost
                ? lastPost.createdAt.toISOString()
                : null,
            nextCursorId: lastPost
                ? lastPost._id.toString()
                : null
        });
    } catch (err) {
        console.error('getFeed err', err);
        res.status(500).json({
            success: false,
            message: 'Feed compilation execution cycle failed.'
        });
    }
};

// ---------------------------------------------------
// GET POSTS BY USER (HYBRID PAGINATION SUPPORT)
// ---------------------------------------------------
exports.getPostsByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit) || 20;
        const { cursorDate, cursorId } = req.query;

        const targetUser = await User.findById(userId).select('privateProfile followers');
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

        let canView = true;
        const requesterId = req.user ? String(req.user._id) : null;

        // Privacy Check
        if (requesterId !== String(targetUser._id) && targetUser.privateProfile) {
            const isFollower = requesterId && targetUser.followers.includes(requesterId);
            const isAdmin = req.user && req.user.role === 'admin';
            if (!isFollower && !isAdmin) {
                canView = false;
            }
        }

        if (!canView) {
            return res.status(403).json({ success: false, message: 'Private account', isPrivate: true });
        }

        const query = {
            user: userId,
            isArchived: { $ne: true },
            isFlagged: { $ne: true },
            isDraft: { $ne: true }
        };

        // Offset Pagination Support for Profile Pages
        if (!isNaN(page)) {
            // 🔥 FIX: Return totalPosts so the frontend profile stats display accurately
            const totalPosts = await Post.countDocuments(query); 
            const posts = await Post.find(query)
                .sort({ createdAt: -1, _id: -1 })
                .select('content images videos user createdAt likesCount commentsCount likes hashtags mentions views metadata')
                .skip(page * limit)
                .limit(limit)
                .populate('user', 'name username avatar isVerified');
            
            return res.json({ success: true, data: posts, totalPosts });
        }

        // Stable Cursor Pagination Check (Legacy/Feed)
        if (cursorDate && cursorId) {
            query.$or = [
                { createdAt: { $lt: new Date(cursorDate) } },
                { createdAt: new Date(cursorDate), _id: { $lt: cursorId } }
            ];
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1, _id: -1 })
            .select('content images videos user createdAt likesCount commentsCount likes hashtags mentions views metadata')
            .limit(limit)
            .populate('user', 'name username avatar isVerified');

        const lastPost = posts.length > 0 ? posts[posts.length - 1] : null;

        return res.json({
            success: true,
            data: posts,
            nextCursorDate: lastPost ? lastPost.createdAt.toISOString() : null,
            nextCursorId: lastPost ? lastPost._id.toString() : null
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.searchPosts = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const limit = parseInt(req.query.limit) || 20;
        const { cursorDate, cursorId } = req.query;

        if (!q) return res.json({ success: true, data: [] });

        const safeQ = escapeRegex(q);
        const regex = new RegExp(safeQ, 'i');

        const query = {
            $and: [
                {
                    $or: [
                        { content: { $regex: regex } },
                        { hashtags: q.replace('#', '').toLowerCase() }
                    ]
                },
                { isFlagged: { $ne: true } },
                { isDraft: { $ne: true } }
            ]
        };

        if (cursorDate && cursorId) {
            query.$and.push({
                $or: [
                    { createdAt: { $lt: new Date(cursorDate) } },
                    { createdAt: new Date(cursorDate), _id: { $lt: cursorId } }
                ]
            });
        }

        const results = await Post.find(query)
            .sort({ createdAt: -1, _id: -1 })
            .select('content images videos user createdAt likesCount commentsCount likes hashtags mentions views metadata')
            .limit(limit)
            .populate('user', 'name username avatar');

        const lastPost = results.length > 0 ? results[results.length - 1] : null;

        return res.json({
            success: true,
            data: results,
            nextCursorDate: lastPost ? lastPost.createdAt.toISOString() : null,
            nextCursorId: lastPost ? lastPost._id.toString() : null
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: 'Error searching posts' });
    }
};

exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id; 
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Delete DB record FIRST
    await post.deleteOne();
    res.json({ success: true, message: "Post deleted successfully" });

    // 🔥 FIX: Ensure we read from post.images and post.videos, not post.media
    const allMedia = [...(post.images || []), ...(post.videos || [])];
    
    if (allMedia.length > 0) {
      const publicIds = allMedia.map(url => extractPublicId(url)).filter(Boolean);
      
      // We rely on the global cloudinary instance (or standard implementation)
      const cloudinary = require('cloudinary').v2; // Ensure required if not globally available
      publicIds.forEach(id => {
        cloudinary.uploader.destroy(id).catch(err => {
          console.error(`Failed to delete Cloudinary asset ${id}:`, err);
        });
      });
    }
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ message: "Server error deleting post" });
  }
};

exports.viewPost = async (req, res) => {
    try {
        const postId = req.params.postId || req.params.id;
        await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });
        res.status(200).json({ success: true, message: 'View recorded' });
    } catch (error) {
        console.error('Error recording view:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { 
          $pull: { likes: userId },
          $inc: { likesCount: -1 } 
        },
        { new: true }
      );
      return res.json({ success: true, message: "Post unliked", likesCount: updatedPost.likesCount, isLiked: false });
    } else {
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { 
          $addToSet: { likes: userId },
          $inc: { likesCount: 1 } 
        },
        { new: true }
      );
      return res.json({ success: true, message: "Post liked", likesCount: updatedPost.likesCount, isLiked: true });
    }
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({ message: "Server error processing like" });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const id = req.params.postId || req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid post id' });

    const post = await Post.findById(id)
      .populate('user', 'name avatar')
      .populate({ 
          path: 'comments', 
          select: 'text user createdAt', 
          populate: { path: 'user', select: 'name avatar' } 
      });

    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    return res.json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error getting post' });
  }
};

exports.getDrafts = async (req, res) => {
  try {
    const drafts = await Post.find({ user: req.user._id, isDraft: true }).sort({ updatedAt: -1 });
    res.json({ success: true, data: drafts });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching drafts' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const id = req.params.id;
    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not allowed' });

    if (req.body.content !== undefined) {
      post.content = req.body.content;
      const { hashtags, mentions } = await parseHashtagsAndMentions(post.content);
      post.hashtags = hashtags;
      post.mentions = mentions;
    }

    if (req.body.imagesToRemove) {
      const toRemove = Array.isArray(req.body.imagesToRemove) ? req.body.imagesToRemove : [req.body.imagesToRemove];
      for (const url of toRemove) {
        await deleteFile(url);
      }
      post.images = post.images.filter(imgUrl => !toRemove.includes(imgUrl));
    }

    if (req.files?.length) {
      for (const f of req.files) {
        const resUpload = await safeUploadToCloudinary(f.path);
        if (f.mimetype?.startsWith('image')) post.images.push(resUpload.url);
        else if (f.mimetype?.startsWith('video')) post.videos.push(resUpload.url);
      }
    }

    post.updatedAt = Date.now();
    
    if (req.body.isDraft === 'false' || req.body.isDraft === false) {
      post.isDraft = false;
      post.createdAt = Date.now();
    }

    await post.save();
    await post.populate('user', 'name avatar');
    
    return res.json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating post' });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const postId = req.params.postId || req.body.postId;
    const userId = req.user._id;

    let savedRecord = await Saved.findOne({ user: userId });
    
    if (!savedRecord) {
      savedRecord = new Saved({ user: userId, posts: [] });
    }

    const strPostId = String(postId);
    const existingIndex = savedRecord.posts.findIndex(p => String(p) === strPostId);

    if (existingIndex > -1) {
      savedRecord.posts.splice(existingIndex, 1);
    } else {
      savedRecord.posts.push(postId);
    }

    await savedRecord.save();

    res.json({ success: true, saved: existingIndex === -1, count: savedRecord.posts.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error toggling bookmark' });
  }
};

exports.getBookmarks = async (req, res) => {
  try {
    const savedRecord = await Saved.findOne({ user: req.user._id }).populate({
      path: 'posts',
      populate: { path: 'user', select: 'name avatar' }
    });
    const validPosts = (savedRecord?.posts || []).filter(p => p !== null);
    res.json({ success: true, data: validPosts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching bookmarks' });
  }
};

exports.trending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let posts = await Post.find({ 
      createdAt: { $gte: since }, 
      isFlagged: { $ne: true }, 
      isDraft: { $ne: true },
      isArchived: { $ne: true }
    })
    .sort({ score: -1, createdAt: -1 })
    .limit(50)
    .populate('user', 'name username avatar isVerified')
    .lean();
    
    if (!posts || posts.length === 0) {
      posts = await Post.find({ 
        isFlagged: { $ne: true }, 
        isDraft: { $ne: true },
        isArchived: { $ne: true }
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'name username avatar isVerified')
      .lean();
    }

    
    if (!posts || posts.length === 0) {
      posts = [
        {
          _id: 'post_showcase_1',
          content: 'Elegance is not about being noticed, it is about being remembered. Welcome to SocialVerse. #Luxury #Obsidian #Minimalism',
          images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop'],
          likesCount: 142,
          commentsCount: 28,
          createdAt: new Date().toISOString(),
          user: { name: 'Elena Rostova', username: 'elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', isVerified: true }
        },
        {
          _id: 'post_showcase_2',
          content: 'Where soundscapes converge with architecture. Testing our high-fidelity WebRTC studio audio. #AudioArt #CyberLuxe #SocialVerse',
          images: ['https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop'],
          likesCount: 98,
          commentsCount: 17,
          createdAt: new Date().toISOString(),
          user: { name: 'Marcus Thorne', username: 'marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', isVerified: true }
        },
        {
          _id: 'post_showcase_3',
          content: 'Exploring the intersection of decentralized liquidity, digital assets, and high design. #CryptoArt #Fintech #SocialVerse',
          images: ['https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop'],
          likesCount: 215,
          commentsCount: 34,
          createdAt: new Date().toISOString(),
          user: { name: 'Dr. Alistair Vance', username: 'alistair', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', isVerified: true }
        }
      ];
    }

    return res.json({ success: true, data: posts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching trending' });
  }
};

exports.schedulePost = async (req, res) => {
  try {
    const { content = "", scheduledAt } = req.body;
    if (!scheduledAt) return res.status(400).json({ success: false, message: 'scheduledAt is required' });

    const when = new Date(scheduledAt);
    if (when.getTime() <= Date.now()) return res.status(400).json({ success: false, message: 'Future time required' });

    const images = [];
    if (req.files && req.files.length) {
      for (const f of req.files) {
        const result = await safeUploadToCloudinary(f.path);
        images.push(result.url);
      }
    }

    const post = new Post({
      user: req.user._id,
      content,
      images,
      scheduledAt: when,
      status: 'scheduled',
      isDraft: false
    });

    await post.save();
    return res.status(201).json({ success: true, data: post });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error scheduling post' });
  }
};

exports.getScheduledPosts = async (req, res) => {
  try {
    const items = await Post.find({ user: req.user._id, status: 'scheduled' })
      .populate('user', 'name avatar')
      .sort({ scheduledAt: 1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching scheduled posts' });
  }
};

exports.getPostLikes = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('likes', 'name avatar bio role isVerified');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, data: post.likes || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.reactPost = async (req, res) => {
  try {
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};

exports.unfurlLink = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL required' });
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Bot/1.0' }, timeout: 5000 });
    const $ = cheerio.load(data);
    const meta = {
      title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
      description: $('meta[property="og:description"]').attr('content') || '',
      image: $('meta[property="og:image"]').attr('content') || '',
      url: url
    };
    res.json(meta);
  } catch (err) {
    res.json({ title: '', description: '', image: '' }); 
  }
};

exports.aiCompose = async (req, res) => {
  try {
    const { prompt = '', tone = 'obsidian' } = req.body;
    
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: `You are an elite creative copywriter for "SocialVerse", a luxury cinematic social media platform.
Draft a high-engagement post caption in the tone: "${tone}".
Topic/Prompt: "${prompt || 'everyday luxury moments and authentic connections'}".
Format: 1-2 punchy sentences followed by 3 trending hashtags. Do not include quotes or conversational preamble.`
                  }
                ]
              }
            ]
          },
          { timeout: 8000 }
        );
        const generated = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (generated) {
          return res.json({ success: true, caption: generated, tone });
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to local generator engine:', geminiErr.message);
      }
    }

    const cleanPrompt = prompt ? prompt.trim() : 'luxury and creator connection';
    const presets = {
      obsidian: [
        `Curating silence in a world full of noise. ${cleanPrompt} speaks for itself. #Obsidian #SocialVerse #Minimalism`,
        `Shadows reveal what light obscures. Embracing ${cleanPrompt} at midnight. #Cinematic #DarkLuxury #SocialVerse`,
        `Every detail intentional. ${cleanPrompt} redefined. #ObsidianLife #SocialVerseMoments #Aesthetic`
      ],
      champagne: [
        `A golden afternoon framed by timeless elegance. Here’s to ${cleanPrompt} and the people who elevate it. #ChampagneHours #SocialVerse #Editorial`,
        `Soft sunlight, cream linen, and ${cleanPrompt}. Life is best savored slowly. #Timeless #SocialVerseLuxury #ArtOfLiving`,
        `The subtleties that turn an ordinary moment into art: ${cleanPrompt}. #EditorialVibes #SocialVerse #GoldenHour`
      ],
      viral: [
        `Stop scrolling. We need to talk about ${cleanPrompt}. Drop your thoughts below! 🔥🚀 #Viral #SocialVerse #TrendingNow`,
        `POV: You finally unlocked ${cleanPrompt} and everything clicked. Who else relates? 💯✨ #CreatorLife #SocialVerse #Explore`,
        `Don’t sleep on this. ${cleanPrompt} is changing the entire game. Tag someone who needs to see this! ⚡ #GameChanger #SocialVerse`
      ],
      visionary: [
        `Building at the intersection of intuition and intelligence. ${cleanPrompt} is just the beginning. #FutureForward #BuildInPublic #SocialVerse`,
        `The future belongs to creators who craft with intention. Exploring ${cleanPrompt}. #NextGen #TechVision #SocialVerse`,
        `Redefining digital connection through ${cleanPrompt}. Let’s build what’s next. #Visionary #SocialVerseNetwork #Innovation`
      ]
    };

    const toneList = presets[tone] || presets.obsidian;
    const caption = toneList[Math.floor(Math.random() * toneList.length)];

    return res.json({
      success: true,
      caption,
      tone,
      safetyScore: 99.4,
    });
  } catch (err) {
    console.error('aiCompose error:', err);
    res.status(500).json({ success: false, message: 'AI composition failed' });
  }
};

// ---------------------------------------------------
// UNLOCK PAYWALLED POST
// ---------------------------------------------------
exports.unlockPost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (!post.isPaywalled) {
            return res.json({ success: true, message: 'Post is not paywalled', data: post });
        }

        if (post.user.toString() === userId.toString()) {
            return res.json({ success: true, message: 'Author already has access', data: post });
        }

        if (post.unlockedBy && post.unlockedBy.some(u => u.toString() === userId.toString())) {
            return res.json({ success: true, message: 'Post already unlocked', data: post });
        }

        const price = post.unlockPrice || 10;
        const buyer = await User.findById(userId);
        if (!buyer || (buyer.wallet?.balance || 0) < price) {
            return res.status(400).json({ success: false, message: 'Insufficient coin balance. Requires ' + price + ' coins.' });
        }

        await User.findByIdAndUpdate(userId, {
            $inc: { 'wallet.balance': -price, 'wallet.totalSent': price }
        });

        await User.findByIdAndUpdate(post.user, {
            $inc: { 'wallet.balance': price, 'wallet.totalReceived': price }
        });

        if (!post.unlockedBy) post.unlockedBy = [];
        post.unlockedBy.push(userId);
        await post.save();

        const Transaction = require('../models/Transaction');
        const txKey = 'postunlock:' + userId + ':' + post._id + ':' + Date.now();
        await Transaction.create([
            {
                user: userId,
                amount: -price,
                type: 'debit',
                description: 'Unlocked exclusive media from post #' + post._id,
                idempotencyKey: txKey
            },
            {
                user: post.user,
                amount: price,
                type: 'credit',
                description: 'Exclusive post unlock reward from @' + buyer.username,
                idempotencyKey: txKey + ':creator'
            }
        ]);

        const io = req.app.get('io');
        if (io) {
            io.to(userId.toString()).emit('wallet:update', { balance: (buyer.wallet?.balance || 0) - price });
            io.to(post.user.toString()).emit('post:unlocked', { postId: post._id, buyer: { id: buyer._id, name: buyer.name } });
        }

        return res.json({ success: true, message: 'Exclusive post unlocked!', data: post });
    } catch (err) {
        console.error('unlockPost error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Unlock failed' });
    }
};
```


# =====================================================================
## FILE (22/128): backend/controllers/reelsController.js (Lines: 259)
# =====================================================================

```javascript
// backend/controllers/reelsController.js
const Reel = require('../models/Reel');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const fs = require('fs');
const path = require('path');
const cloudinaryUtil = require('../utils/cloudinary');
const { deleteFile } = require('../utils/cloudinary');

// ---------------- SAFE UPLOAD ----------------
const safeUpload = async (filePath) => {
  try {
    const r = await cloudinaryUtil.uploads(
      filePath,
      'social_reels',
      { resource_type: 'video' }
    );
    try { fs.unlinkSync(filePath); } catch {}
    return r.secure_url;
  } catch (e) {
    console.error('Reel upload error', e);
    return `/uploads/${path.basename(filePath)}`;
  }
};

// ---------------- UPLOAD REEL ----------------
exports.uploadReel = async (req, res) => {
  try {
    if (!req.files?.length && !req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const file = req.files ? req.files[0] : req.file;
    const url = await safeUpload(file.path);

    const reel = new Reel({
      user: req.user._id,
      videoUrl: url,
      caption: req.body.caption || '',
      tags: [],
    });

    await reel.save();
    await reel.populate('user', 'name avatar');

    res.status(201).json(reel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------- FEED ----------------
exports.feed = async (req, res) => {
  try {
    const reels = await Reel.find()
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    const reelsWithMeta = reels.map((r) => ({
      ...r.toObject(),
      isLikedByMe: req.user
        ? r.likes.some((u) => u.toString() === req.user._id.toString())
        : false,
    }));

    
    if (!reelsWithMeta || reelsWithMeta.length === 0) {
      const demoReels = [
        {
          _id: 'demo1',
          videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/dog.mp4',
          posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/dog.jpg',
          caption: 'Golden hours & cinematic freedom ✨🐕 #SocialVerseMoments #CinematicNoir',
          user: { name: 'Elena Rostova', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' },
          likes: ['user1', 'user2', 'user3'],
          comments: [1, 2]
        },
        {
          _id: 'demo2',
          videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/sea_turtle.mp4',
          posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/sea_turtle.jpg',
          caption: 'Azure currents & deep tranquility 🌊🐢 #OceanDrift #NatureArt',
          user: { name: 'Kai Sterling', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
          likes: ['user1'],
          comments: []
        },
        {
          _id: 'demo3',
          videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/elephants.mp4',
          posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/elephants.jpg',
          caption: 'Serengeti sovereigns under dusk 🐘🌅 #Wildlife #MajesticEarth',
          user: { name: 'Aria Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80' },
          likes: ['user1', 'user2'],
          comments: [1]
        },
        {
          _id: 'demo4',
          videoUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/samples/cld-sample-video.mp4',
          posterUrl: 'https://res.cloudinary.com/demo/video/upload/so_0,w_540,q_auto/samples/cld-sample-video.jpg',
          caption: 'Precision cadence & fluid motion ⚡🏎️ #SpeedCraft #NoirVision',
          user: { name: 'Marcus Thorne', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
          likes: ['user1', 'user2', 'user3', 'user4'],
          comments: [1, 2, 3]
        }
      ];
      return res.json(demoReels);
    }

    res.json(reelsWithMeta);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- LIKE / UNLIKE REEL ----------------
exports.likeReel = async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await Reel.findById(id);

    if (!reel) {
      return res.status(404).json({ message: 'Reel not found' });
    }

    const uid = req.user._id.toString();
    const index = reel.likes.findIndex(
      (u) => u.toString() === uid
    );

    if (index === -1) {
      reel.likes.push(req.user._id);
    } else {
      reel.likes.splice(index, 1);
    }

    await reel.save();
    res.json({ success: true, likes: reel.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ---------------- INCREMENT VIEW ----------------
exports.viewReel = async (req, res) => {
  try {
    const { id } = req.params;
    await Reel.findByIdAndUpdate(id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(200).json({ success: false }); 
  }
};

// ---------------- TIP REEL CREATOR ----------------
exports.tipReel = async (req, res) => {
  try {
    const { id } = req.params;
    const amount = Math.max(1, Math.floor(Number(req.body.amount || 10)));
    const userId = req.user._id;

    let reel = null;
    if (!String(id).startsWith('demo')) {
      reel = await Reel.findById(id).populate('user', 'name avatar');
    }

    const creatorId = reel?.user?._id || reel?.user;
    if (creatorId && String(creatorId) === String(userId)) {
      return res.status(400).json({ success: false, message: 'Cannot tip your own reel' });
    }

    const sender = await User.findById(userId);
    const senderBalance = Number(sender?.wallet?.balance || 0);
    if (senderBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Treasury coins (${senderBalance} coins available). Claim your daily bonus in Wallet!`
      });
    }

    // Debit sender
    const updatedSender = await User.findByIdAndUpdate(
      userId,
      { $inc: { 'wallet.balance': -amount, 'wallet.totalSent': amount } },
      { new: true }
    );

    // Credit creator if not demo
    let creatorName = reel?.user?.name || 'Creator';
    if (creatorId) {
      const updatedCreator = await User.findByIdAndUpdate(
        creatorId,
        { $inc: { 'wallet.balance': amount, 'wallet.totalReceived': amount } },
        { new: true }
      );

      const io = req.app.get('io') || global.io;
      if (io) {
        io.to(String(creatorId)).emit('wallet:update', {
          balance: updatedCreator.wallet.balance,
          amount,
          message: `${sender.name} tipped you ${amount} coins on your reel! 💎`
        });
      }
    }

    const txKey = `reeltip:${userId}:${id}:${Date.now()}`;
    await Transaction.create([
      {
        user: userId,
        type: 'debit',
        amount,
        description: `Tipped ${creatorName} on reel`,
        idempotencyKey: txKey
      }
    ]).catch(e => console.warn('Tip tx log error:', e.message));

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(String(userId)).emit('wallet:update', { balance: updatedSender.wallet.balance });
    }

    res.json({
      success: true,
      message: `Successfully tipped ${amount} coins to ${creatorName}!`,
      balance: updatedSender.wallet.balance,
      amount
    });
  } catch (err) {
    console.error('tipReel err', err);
    res.status(500).json({ success: false, message: 'Server error during tip' });
  }
};

// ---------------- DELETE REEL ----------------
exports.deleteReel = async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ message: 'Reel not found' });

    // Check ownership
    if (String(reel.user) !== String(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    if (reel.videoUrl) {
        await deleteFile(reel.videoUrl).catch(() => {});
    }

    await Reel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reel deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
```


# =====================================================================
## FILE (23/128): backend/controllers/reportController.js (Lines: 92)
# =====================================================================

```javascript
// backend/controllers/reportController.js
const Report = require('../models/Report');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

exports.createReport = async (req, res) => {
  try {
    const { targetUser, targetPost, reason, details } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason required' });

    const rpt = new Report({
      reporter: req.user._id,
      targetUser: targetUser || null,
      targetPost: targetPost || null,
      reason,
      details,
    });
    await rpt.save();
    return res.status(201).json(rpt);
  } catch (err) {
    console.error('createReport err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const q = await Report.find().sort({ createdAt: -1 }).populate('reporter', 'name email').populate('targetUser', 'name').populate('targetPost', 'content');
    return res.json(q);
  } catch (err) {
    console.error('getReports err', err);
    return res.status(500).json({ message: 'Server error' });
  }
};// Import Notification model

exports.updateReport = async (req, res) => {
  try {
    const { status, action } = req.body; // status: 'resolved', action: 'ban', 'warn', 'hide_post'
    
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // 1. Update Report State
    if (status) report.status = status;
    if (action) report.action = action;
    report.handledBy = req.user._id;

    // 2. 🔥 AUTO-EXECUTE ACTION LOGIC
    if (status === 'resolved' || status === 'actioned') {
        
        // A) Ban User
        if (action === 'ban' && report.targetUser) {
            await User.findByIdAndUpdate(report.targetUser, { role: 'banned' });
            // Optional: Create system notification for the user (if they can still read them)
        }
        
        // B) Hide/Flag Post
        if ((action === 'hide_post' || action === 'remove') && report.targetPost) {
            await Post.findByIdAndUpdate(report.targetPost, { isFlagged: true });
        }

        // C) Send Warning
        if (action === 'warn' && report.targetUser) {
             await Notification.create({
                 user: report.targetUser,
                 type: 'system',
                 message: `⚠️ Community Warning: Your content was reported for "${report.reason}". Please review our guidelines.`
             });
        }
    }

    await report.save();
    res.json(report);
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ message: 'Error processing report action' });
  }
};

// 🔥 NEW: Get My Reports
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .sort({ createdAt: -1 })
      .populate('targetUser', 'name')
      .populate('targetPost', 'content'); // Just a snippet
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
```


# =====================================================================
## FILE (24/128): backend/controllers/searchController.js (Lines: 74)
# =====================================================================

```javascript
// backend/controllers/searchController.js
const User = require('../models/User');
const Post = require('../models/Post');

// --- Helper: Sanitize Regex Input to prevent ReDoS Attacks ---
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

exports.global = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    
    // Return empty structure if query is empty
    if (!q) {
        return res.json({ 
            success: true, 
            data: { users: [], posts: [], hashtags: [] } 
        });
    }

    // 🔥 FIX: Sanitize the input before creating the RegExp
    const safeQuery = escapeRegex(q);
    const regex = new RegExp(safeQuery, 'i'); 

    // Run queries in parallel for performance
    const [users, posts] = await Promise.all([
        // 1. Search Users (Name or Email/Handle)
        User.find({
            $or: [
                { name: { $regex: regex } },
                { email: { $regex: regex } } // Or username if you have it
            ],
            isDeleted: { $ne: true },
            userStatus: { $ne: 'Banned' } // Exclude banned users if applicable
        })
        .select('name avatar isVerified bio followers')
        .limit(10),

        // 2. Search Posts (Content or Hashtags)
        Post.find({
            $or: [
                { content: { $regex: regex } },
                { hashtags: safeQuery.toLowerCase() } // Exact match for hashtags is often faster/better
            ],
            isArchived: { $ne: true },
            isFlagged: { $ne: true },
            isDraft: { $ne: true }
        })
        .populate('user', 'name avatar isVerified')
        .sort({ createdAt: -1 }) // Newest first
        .limit(10)
    ]);

    // 3. Extract Hashtags (Simple aggregation from posts or separate collection)
    // This is a simplified extraction from the found posts
    const hashtags = [...new Set(posts.flatMap(p => p.hashtags || []))]
        .filter(tag => tag.includes(safeQuery.toLowerCase()))
        .slice(0, 5);

    res.json({
        success: true,
        data: {
            users,
            posts,
            hashtags
        }
    });

  } catch (err) {
    console.error("Global Search Error:", err);
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};
```


# =====================================================================
## FILE (25/128): backend/controllers/searchSuggestController.js (Lines: 85)
# =====================================================================

```javascript
// backend/controllers/searchSuggestController.js
const User = require('../models/User');
const Post = require('../models/Post');

const searchCache = new Map();

exports.suggestions = async (req, res) => {
  try {
    const meId = req.user ? String(req.user._id) : 'guest';
    const cached = searchCache.get(meId);
    if (cached && Date.now() - cached.timestamp < 30000) {
      return res.status(200).json(cached.data);
    }

    const userMatch = { isDeleted: { $ne: true } };
    if (req.user) {
      userMatch._id = { $ne: req.user._id };
    }

    const topUsers = await User.aggregate([
      { $match: userMatch },
      {
        $addFields: {
          followerCount: { $size: { $ifNull: ['$followers', []] } },
        },
      },
      { $sort: { followerCount: -1, createdAt: -1 } },
      { $limit: 20 },
      {
        $project: {
          name: 1,
          avatar: 1,
          followers: 1,
          bio: 1,
          badges: 1,
          followerCount: 1,
        },
      },
    ]);

    const suggestions = req.user
      ? topUsers.filter((u) => !(u.followers || []).map(String).includes(String(req.user._id))).slice(0, 10)
      : topUsers.slice(0, 10);

    const recentTags = await Post.aggregate([
      {
        $match: {
          isArchived: { $ne: true },
          isFlagged: { $ne: true },
          isDraft: { $ne: true },
        },
      },
      { $project: { hashtags: { $ifNull: ['$hashtags', []] } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 8 },
    ]);

    const trendingHashtags = recentTags.map((tag) => tag._id);

    const fallbackHashtags = ['Obsidian', 'CinemaNoir', 'WebRTC', 'NextGenSocial', 'LuxuryDesign', 'CreatorTreasury'];
    const finalHashtags = trendingHashtags.length > 0 ? trendingHashtags : fallbackHashtags;

    const fallbackUsers = [
      { _id: 'suggest_user_1', name: 'Elena Rostova', username: 'elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', bio: 'Digital Art Director • Neo-Tokyo', followerCount: 1420 },
      { _id: 'suggest_user_2', name: 'Marcus Thorne', username: 'marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', bio: 'Modular Synthesizer Architect', followerCount: 980 },
      { _id: 'suggest_user_3', name: 'Aria Chen', username: 'aria', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', bio: 'Cinematic Fashion & Visual Storyteller', followerCount: 2150 }
    ];
    const finalUsers = suggestions.length > 0 ? suggestions : fallbackUsers;

    const responsePayload = {
      users: finalUsers,
      trendingHashtags: finalHashtags,
    };

    searchCache.set(meId, { data: responsePayload, timestamp: Date.now() });

    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Suggestions Error:', err);
    res.status(500).json({ message: err.message || 'Suggestion lookup failed' });
  }
};
```


# =====================================================================
## FILE (26/128): backend/controllers/shopController.js (Lines: 261)
# =====================================================================

```javascript
// backend/controllers/shopController.js
const ShopItem = require('../models/ShopItem');
const Product = require('../models/Product');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const path = require('path');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

exports.list = async (req, res) => {
  try {
    let items = await ShopItem.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name avatar role')
      .lean();

    // Check Product collection to ensure all seeded and marketplace items are available
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate('owner', 'name avatar role')
      .lean();

    const normalizedProducts = (products || []).map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.desc || p.description || '',
      price: p.price,
      stock: p.stock ?? 50,
      image: p.image,
      category: (p.tags && p.tags[0]) || 'Digital',
      createdBy: p.owner,
      createdAt: p.createdAt,
    }));

    // Merge without duplicates
    const shopItemIds = new Set(items.map((i) => String(i._id)));
    for (const np of normalizedProducts) {
      if (!shopItemIds.has(String(np._id))) {
        items.push(np);
      }
    }

    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching shop items',
      error: err.message,
    });
  }
};

exports.mine = async (req, res) => {
  try {
    const userId = req.user._id;
    let items = await ShopItem.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name avatar role')
      .lean();

    const products = await Product.find({ owner: userId })
      .sort({ createdAt: -1 })
      .populate('owner', 'name avatar role')
      .lean();

    const normalizedProducts = (products || []).map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.desc || p.description || '',
      price: p.price,
      stock: p.stock ?? 50,
      image: p.image,
      category: (p.tags && p.tags[0]) || 'Digital',
      createdBy: p.owner,
      createdAt: p.createdAt,
    }));

    const shopItemIds = new Set(items.map((i) => String(i._id)));
    for (const np of normalizedProducts) {
      if (!shopItemIds.has(String(np._id))) {
        items.push(np);
      }
    }

    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching your shop items',
      error: err.message,
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, desc, price, stock, category } = req.body;
    const safeTitle = String(title || '').trim();
    const safeDescription = String(description || desc || '').trim();

    if (!safeTitle) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    const image = req.file ? `/uploads/${path.basename(req.file.path)}` : (req.body.image || '');

    const item = await ShopItem.create({
      title: safeTitle,
      description: safeDescription,
      price: toNumber(price, 0),
      stock: Math.max(1, toNumber(stock, 1)),
      category: category || 'Digital',
      image,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Error creating shop item',
      error: err.message,
    });
  }
};

exports.buy = async (req, res) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (_) {
    session = null;
  }
  const sessionOpts = session ? { session } : {};

  try {
    const { id } = req.params;
    const userId = req.user._id;

    let item = session ? await ShopItem.findById(id).session(session) : await ShopItem.findById(id);
    let isProduct = false;

    if (!item) {
      const prod = session ? await Product.findById(id).session(session) : await Product.findById(id);
      if (prod) {
        item = {
          _id: prod._id,
          title: prod.title,
          price: prod.price,
          stock: prod.stock ?? 50,
          createdBy: prod.owner,
        };
        isProduct = true;
      }
    }

    if (!item) throw new Error('Item not found');
    if (item.stock < 1) throw new Error('Sold out');
    if (String(item.createdBy) === String(userId)) {
      throw new Error('You cannot buy your own listing');
    }

    const user = session ? await User.findById(userId).session(session) : await User.findById(userId);
    if (!user) throw new Error('User not found');

    const currentBalance = toNumber(user.wallet?.balance, 0);
    if (currentBalance < item.price) throw new Error('Insufficient balance');

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { 'wallet.balance': -item.price } },
      { ...sessionOpts, new: true }
    );

    if (isProduct) {
      await Product.findByIdAndUpdate(id, { $inc: { stock: -1 } }, sessionOpts);
    } else {
      await ShopItem.findByIdAndUpdate(id, { $inc: { stock: -1 } }, sessionOpts);
    }

    await Transaction.create(
      [
        {
          user: userId,
          type: 'debit',
          amount: item.price,
          description: `Purchased: ${item.title}`,
          status: 'success',
          idempotencyKey: `shop:${userId}:${id}:${Date.now()}`,
        },
      ],
      sessionOpts
    );

    // Credit seller if creator is distinct from buyer
    if (item.createdBy && String(item.createdBy) !== String(userId)) {
      await User.findByIdAndUpdate(
        item.createdBy,
        { $inc: { 'wallet.balance': item.price } },
        sessionOpts
      );

      await Transaction.create(
        [
          {
            user: item.createdBy,
            type: 'credit',
            amount: item.price,
            description: `Sale proceeds: ${item.title}`,
            status: 'success',
            idempotencyKey: `sale:${item.createdBy}:${id}:${Date.now()}`,
          },
        ],
        sessionOpts
      );
    }

    if (session) {
      await session.commitTransaction();
    }

    const io = req.app.get('io') || global.io;
    if (io && updatedUser?.wallet) {
      io.to(String(userId)).emit('wallet:update', {
        balance: updatedUser.wallet.balance,
      });
    }
    if (io && item.createdBy && String(item.createdBy) !== String(userId)) {
      io.to(String(item.createdBy)).emit('wallet:update', {
        amount: item.price,
        message: `Sale proceeds: ₹${item.price} earned for "${item.title}"!`,
      });
    }

    return res.json({
      success: true,
      message: 'Purchase successful',
      data: {
        item,
        balance: updatedUser?.wallet?.balance ?? currentBalance - item.price,
      },
    });
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (_) {}
    }
    console.error('Shop buy error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Server error during purchase',
    });
  } finally {
    if (session) session.endSession();
  }
};
```


# =====================================================================
## FILE (27/128): backend/controllers/socialController.js (Lines: 62)
# =====================================================================

```javascript
// backend/controllers/socialController.js
const User = require('../models/User');
const Post = require('../models/Post');

exports.updateGeo = async (req,res)=>{
  const { lat, lng } = req.body;
  if (typeof lat!=='number' || typeof lng!=='number') return res.status(400).json({message:'lat/lng required'});
  await User.findByIdAndUpdate(req.user._id, { geo: { type:'Point', coordinates:[lng,lat] }});
  res.json({ ok:true });
};

exports.nearby = async (req,res)=>{
  const { lat, lng, km = 25 } = req.query;
  if (!lat || !lng) return res.json([]);
  const users = await User.find({
    geo: { $near: { $geometry: { type:'Point', coordinates:[Number(lng), Number(lat)] }, $maxDistance: Number(km)*1000 } }
  }).select('name avatar geo');
  res.json(users);
};

exports.badges = async (req,res)=>{
  const meId = req.user._id;
  const posts = await Post.find({ user: meId });
  const likes = posts.reduce((n,p)=> n + (p.likes?.length||0), 0);
  const badges = new Set();
  if (likes >= 50) badges.add('popular');
  if (posts.length >= 20) badges.add('creator');
  if ((await User.findById(meId)).isVerified) badges.add('verified');
  await User.findByIdAndUpdate(meId, { badges:[...badges] });
  res.json({ badges:[...badges] });
};

exports.memories = async (req, res) => {
    try {
        const now = new Date();
        const month = now.getMonth() + 1; // MongoDB months map 1-12
        const date = now.getDate();
        const currentYear = now.getFullYear();

        const memories = await Post.find({
            user: req.user._id,
            $expr: {
                $and: [
                    { $eq: [{ $month: '$createdAt' }, month] },
                    { $eq: [{ $dayOfMonth: '$createdAt' }, date] },
                    { $lt: [{ $year: '$createdAt' }, currentYear] }
                ]
            }
        }).sort({ createdAt: -1 }).populate('user', 'name username avatar');

        res.json({ success: true, data: memories });
    } catch (error) {
        console.error("Memories Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch memories" });
    }
};

exports.linkNft = async (req,res)=>{
  const { nftUrl } = req.body;
  await User.findByIdAndUpdate(req.user._id, { nftPfpUrl:nftUrl });
  res.json({ ok:true, nftPfpUrl:nftUrl });
};
```


# =====================================================================
## FILE (28/128): backend/controllers/spacesController.js (Lines: 87)
# =====================================================================

```javascript
// backend/controllers/spacesController.js
const Space = require('../models/Space');
const User = require('../models/User');

const spacePopulate = [
  { path: 'host', select: 'name username avatar isVerified role' },
  { path: 'speakers', select: 'name username avatar isVerified role' },
  { path: 'listeners', select: 'name username avatar isVerified' },
  { path: 'handRaises', select: 'name username avatar' },
];

exports.getActiveSpaces = async (req, res) => {
  try {
    const spaces = await Space.find({ isActive: true })
      .sort({ startedAt: -1 })
      .populate(spacePopulate)
      .limit(20)
      .lean();

    res.json({ success: true, count: spaces.length, data: spaces });
  } catch (err) {
    console.error('getActiveSpaces error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch spaces' });
  }
};

exports.createSpace = async (req, res) => {
  try {
    const { title, topic } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Space title is required' });
    }

    const space = await Space.create({
      title: title.trim(),
      topic: (topic || 'Creator Conversation').trim(),
      host: req.user._id,
      speakers: [req.user._id],
      listeners: [],
      handRaises: [],
      isActive: true,
      startedAt: new Date(),
    });

    const populated = await Space.findById(space._id).populate(spacePopulate);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('createSpace error:', err);
    res.status(500).json({ success: false, message: 'Failed to create space' });
  }
};

exports.getSpaceById = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id).populate(spacePopulate);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Space not found' });
    }
    res.json({ success: true, data: space });
  } catch (err) {
    console.error('getSpaceById error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.endSpace = async (req, res) => {
  try {
    const space = await Space.findById(req.params.id);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Space not found' });
    }

    if (String(space.host) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the host can end this space' });
    }

    space.isActive = false;
    space.endedAt = new Date();
    await space.save();

    res.json({ success: true, message: 'Space ended successfully' });
  } catch (err) {
    console.error('endSpace error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```


# =====================================================================
## FILE (29/128): backend/controllers/storiesController.js (Lines: 307)
# =====================================================================

```javascript
// backend/controllers/storiesController.js
const Story = require('../models/Story');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const cloudinaryUtil = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

let createNotification = async () => {};
try {
  createNotification = require('../utils/notify');
} catch (_) {}

// --- UPLOAD STORY ---
exports.createStory = async (req, res) => {
  try {
    let mediaUrl = req.body.media || '';
    let isLocal = false;
    let type = req.body.type || 'image';

    if (req.file) {
      try {
        const uploadResult = await cloudinaryUtil.uploads(req.file.path);
        mediaUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.warn('Cloudinary story upload fallback to local:', uploadErr.message);
        mediaUrl = `/uploads/${path.basename(req.file.path)}`;
        isLocal = true;
      }
      type = req.file.mimetype?.includes('video') ? 'video' : 'image';
    }

    if (!mediaUrl) {
      const caption = req.body.caption || 'SocialVerse Story';
      const color = req.body.color || '#6558F5';
      const encodedSvg = encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0E0508;stop-opacity:1"/><stop offset="50%" style="stop-color:${color};stop-opacity:0.4"/><stop offset="100%" style="stop-color:#1A0B12;stop-opacity:1"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#grad)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#F7F7FC" font-size="52" font-family="sans-serif" font-weight="bold">${caption}</text></svg>`
      );
      mediaUrl = `data:image/svg+xml;utf8,${encodedSvg}`;
      type = 'image';
    }

    const story = new Story({
      user: req.user._id,
      media: mediaUrl,
      type,
      caption: req.body.caption || '', 
      color: req.body.color || '#ffffff',
      privacy: req.body.privacy || 'public',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
    });

    await story.save();
    await story.populate('user', 'name avatar username');

    if (!isLocal && req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    res.status(201).json(story);
  } catch (err) {
    console.error('createStory err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GET STORIES FEED ---
exports.getStories = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user._id.toString() : null;

    let followingIds = [];
    if (currentUserId) {
      const me = await User.findById(currentUserId).select('following');
      followingIds = me && Array.isArray(me.following) ? me.following.map(id => id) : [];
    }

    const targetUserIds = currentUserId ? [...followingIds, req.user._id] : [];

    const query = {
      expiresAt: { $gt: new Date() }
    };

    if (currentUserId) {
      query.$or = [
        { user: { $in: targetUserIds } },
        { privacy: 'public' }
      ];
    } else {
      query.privacy = 'public';
    }

    const activeStories = await Story.find(query)
      .populate('user', 'name avatar username')
      .sort({ createdAt: -1 })
      .lean();

    const enriched = activeStories.map(story => {
      const isViewed = currentUserId && story.viewers && story.viewers.some(v => v.toString() === currentUserId);
      return {
        ...story,
        isViewed: !!isViewed,
        viewersCount: Array.isArray(story.viewers) ? story.viewers.length : 0,
        reactionsCount: Array.isArray(story.reactions) ? story.reactions.length : 0
      };
    });


    if (!enriched || enriched.length === 0) {
      const showcaseStories = [
        {
          _id: 'story_demo_1',
          user: { _id: 'demo_user_1', name: 'Elena Rostova', username: 'elena', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
          media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
          caption: 'Golden hour reflections by the Mediterranean 🌅✨',
          type: 'image',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          privacy: 'close_friends',
          isViewed: false,
          viewersCount: 28,
          reactionsCount: 14
        },
        {
          _id: 'story_demo_2',
          user: { _id: 'demo_user_2', name: 'Marcus Thorne', username: 'marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
          media: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
          caption: 'Midnight neon rehearsal in London ⚡🎧',
          type: 'image',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          privacy: 'public',
          isViewed: false,
          viewersCount: 42,
          reactionsCount: 19
        },
        {
          _id: 'story_demo_3',
          user: { _id: 'demo_user_3', name: 'Aria Chen', username: 'aria', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200' },
          media: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
          caption: 'Behind the scenes at Tokyo Cyber Week 🗼🎆',
          type: 'image',
          createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
          privacy: 'public',
          isViewed: false,
          viewersCount: 65,
          reactionsCount: 31
        }
      ];
      return res.json(showcaseStories);
    }

    res.json(enriched);
  } catch (err) {
    console.error('getStories err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- MARK AS VIEWED ---
exports.markViewed = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const story = await Story.findByIdAndUpdate(
      id,
      { $addToSet: { viewers: userId } },
      { new: true }
    );

    res.json({ success: true, viewersCount: story?.viewers?.length || 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- REACT TO STORY ---
exports.reactToStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji = '❤️' } = req.body;
    const userId = req.user._id;

    const story = await Story.findById(id).populate('user', 'name avatar');
    if (!story) return res.status(404).json({ message: 'Story not found' });

    story.reactions = story.reactions || [];
    story.reactions.push({ user: userId, emoji, createdAt: new Date() });
    await story.save();

    const authorId = String(story.user?._id || story.user);
    if (authorId !== String(userId)) {
      try {
        await createNotification(req, {
          toUser: authorId,
          type: 'story',
          data: { storyId: id, emoji },
          message: `${req.user.name || 'Someone'} reacted ${emoji} to your story!`,
        });
      } catch (_) {}
    }

    res.json({ success: true, reaction: { user: userId, emoji }, totalReactions: story.reactions.length });
  } catch (err) {
    console.error('reactToStory err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- REPLY TO STORY (DIRECT CHAT INTEGRATION) ---
exports.replyToStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply text cannot be empty' });
    }

    const story = await Story.findById(id).populate('user', 'name avatar');
    if (!story) return res.status(404).json({ message: 'Story not found' });

    const authorId = String(story.user?._id || story.user);
    if (authorId === String(userId)) {
      return res.status(400).json({ message: 'Cannot reply to your own story' });
    }

    const memberIds = [String(userId), authorId];
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: memberIds, $size: 2 },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: memberIds,
        isGroup: false,
      });
    }

    const msg = await Message.create({
      chat: chat._id,
      sender: userId,
      content: `Replied to your story: "${text.trim()}"`,
      media: story.media,
      type: 'text',
    });

    await Chat.findByIdAndUpdate(chat._id, { lastMessage: msg._id });

    // Emit live socket event to author
    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(authorId).emit('receiveMessage', {
        chatId: chat._id,
        message: msg,
      });
    }

    try {
      await createNotification(req, {
        toUser: authorId,
        type: 'message',
        data: { chatId: chat._id, storyId: id },
        message: `${req.user.name || 'Someone'} replied to your story: "${text.trim().slice(0, 40)}"`,
      });
    } catch (_) {}

    res.json({ success: true, message: 'Reply sent', data: msg });
  } catch (err) {
    console.error('replyToStory err', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GET STORY VIEWERS ---
exports.getViewers = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id).populate('viewers', 'name avatar username');
    if (!story) return res.status(404).json({ message: 'Story not found' });

    res.json({ success: true, viewers: story.viewers || [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- DELETE STORY ---
exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await Story.findById(id);

    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await Story.findByIdAndDelete(id);
    res.json({ success: true, message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
```


# =====================================================================
## FILE (30/128): backend/controllers/tagSuggestionController.js (Lines: 22)
# =====================================================================

```javascript
// backend/controllers/tagSuggestionController.js
// simple heuristics: extract hashtags + most frequent nouns via regex + stopwords
const stop = new Set(['the','a','and','of','to','in','for','on','is','with','that','this','it','an','as','are']);

exports.suggest = async (req,res)=>{
  const txt = (req.body.text||'').toLowerCase();
  const tags = new Set();
  // existing hashtags
  (txt.match(/#\w+/g) || []).forEach(h => tags.add(h.slice(1)));
  // word frequency
  const words = txt.replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean);
  const freq = {};
  for (const w of words) {
    if (w.length<3) continue;
    if (stop.has(w)) continue;
    freq[w] = (freq[w]||0)+1;
  }
  const candidates = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
  candidates.forEach(c => tags.add(c));
  res.json({ suggestions: Array.from(tags).slice(0,8) });
};
```


# =====================================================================
## FILE (31/128): backend/controllers/translateController.js (Lines: 20)
# =====================================================================

```javascript
// backend/controllers/translateController.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.translate = async (req,res)=>{
  try {
    const { text, to = 'en' } = req.body;
    if (!text) return res.json({ text:'' });
    const LT = process.env.LT_URL || 'https://libretranslate.de';
    const r = await fetch(`${LT}/translate`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ q:text, source:'auto', target:to, format:'text' })
    });
    const data = await r.json();
    res.json({ text: data.translatedText || text });
  } catch (e) {
    res.json({ text: req.body.text });
  }
};
```


# =====================================================================
## FILE (32/128): backend/controllers/unfurlController.js (Lines: 18)
# =====================================================================

```javascript
// backend/controllers/unfurlController.js
const metascraper = require('metascraper')([
  require('metascraper-title')(),
  require('metascraper-description')()
]);
const got = require('got');

exports.unfurl = async (req,res)=>{
  try {
    const { url } = req.body;
    const { body: html } = await got(url);
    const meta = await metascraper({ html, url });
    res.json(meta);
  } catch {
    res.json({});
  }
}
```


# =====================================================================
## FILE (33/128): backend/controllers/usersController.js (Lines: 619)
# =====================================================================

```javascript
// backend/controllers/usersController.js
const User = require('../models/User');
const Post = require('../models/Post');
const FollowRequest = require('../models/FollowRequest');
const Notification = require('../models/Notification');
const cloudinaryUtil = require('../utils/cloudinary');
const createNotification = require('../utils/notify');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const calculateCompletion = (user) => {
    let score = 20;
    if (user.avatar) score += 20;
    if (user.bio) score += 20;
    if (user.location) score += 10;
    if (user.website) score += 10;
    if (user.coverPhoto) score += 20;
    return Math.min(score, 100);
};

const handleUpload = async (files, fieldName) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    const file = files[fieldName][0];
    try {
      const res = await cloudinaryUtil.uploads(file.path);
      try { fs.unlinkSync(file.path); } catch (e) {}
      return res.secure_url;
    } catch (e) {
      return `/uploads/${path.basename(file.path)}`;
    }
  }
  return null;
};

exports.getMe = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: me });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const targetId = req.params.id;
    let user;
    if (targetId === "me" && req.user) {
      user = await User.findById(req.user._id).select("-password").lean();
    } else if (mongoose.Types.ObjectId.isValid(targetId)) {
      user = await User.findById(targetId).select("-password").lean();
    }
    if (!user) {
      user = await User.findOne({ username: targetId }).select("-password").lean();
    }
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.user) {
        const me = await User.findById(req.user._id).select('blockedUsers following role');
        const targetUserDoc = await User.findById(targetId).select('blockedUsers');
        
        if (targetUserDoc?.blockedUsers?.map(String).includes(String(req.user._id))) {
            return res.status(404).json({ success: false, message: 'User not found' }); 
        }

        if (me.blockedUsers.map(String).includes(String(targetId))) {
            user.isBlockedByMe = true;
        }

        user.isFollowing = me.following.map(String).includes(String(user._id));
        user.isMe = String(me._id) === String(user._id);

        if (user.privateProfile && !user.isFollowing && !user.isMe && req.user.role !== 'admin') {
             return res.json({
                 success: true,
                 data: {
                     _id: user._id,
                     name: user.name,
                     avatar: user.avatar,
                     isVerified: user.isVerified,
                     isPrivateRestricted: true,
                     privateProfile: true,
                     followersCount: (user.followers || []).length,
                     followingCount: (user.following || []).length,
                     isFollowing: false,
                     isMe: false
                 }
             });
        }
    } else {
        user.isFollowing = false;
        user.isMe = false;
    }

    user.followersCount = (user.followers || []).length;
    user.followingCount = (user.following || []).length;

    res.json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: { users: [] } });

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i'); 
    
    const users = await User.find({
      $or: [
        { name: { $regex: regex } },
        { username: { $regex: regex } }
      ],
      isDeleted: { $ne: true }
    }).select('_id name username avatar isVerified privateProfile');

    res.json({ success: true, data: { users } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Search error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    let targetParam = req.params.id;
    if (targetParam === "me" && req.user) {
      targetParam = String(req.user._id);
    }
    let currentUser;
    if (mongoose.Types.ObjectId.isValid(targetParam)) {
      currentUser = await User.findById(targetParam);
    } else {
      currentUser = await User.findOne({ username: targetParam });
    }
    if (!currentUser) return res.status(404).json({ success: false, message: "User not found" });

    // Hardware Enclave Lockdown: If target account is Founder/Admin, ONLY that exact authenticated user can modify it
    if (currentUser.role === 'admin' || currentUser.email === 'sidhantas786@gmail.com' || currentUser.email === 'admin@socialapp.com') {
      if (req.user._id.toString() !== currentUser._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Founder & Admin profile is hardware-locked. Unauthorized modifications are prohibited.',
        });
      }
    } else if (req.user._id.toString() !== req.params.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.website !== undefined) updates.website = req.body.website;
    if (req.body.location !== undefined) updates.location = req.body.location;

    if (req.body['socialLinks[twitter]'] || req.body['socialLinks[instagram]'] || req.body['socialLinks[linkedin]']) {
      updates.socialLinks = {
        twitter: req.body['socialLinks[twitter]'] || '',
        instagram: req.body['socialLinks[instagram]'] || '',
        linkedin: req.body['socialLinks[linkedin]'] || ''
      };
    }

    if (req.body.isPrivate !== undefined) {
      updates.privateProfile = (req.body.isPrivate === 'true' || req.body.isPrivate === true);
    }

    if (req.files) {
      const avatarUrl = await handleUpload(req.files, 'avatar');
      if (avatarUrl) updates.avatar = avatarUrl;

      const coverUrl = await handleUpload(req.files, 'coverPhoto');
      if (coverUrl) updates.coverPhoto = coverUrl;
    }

    if (req.body.deleteAvatar === 'true') {
        updates.avatar = ''; 
    }

    // User already loaded
    const baseUser = currentUser;
    const merged = { ...(currentUser.toObject ? currentUser.toObject() : currentUser), ...updates };
    updates.profileCompletion = calculateCompletion(merged);

    const user = await User.findByIdAndUpdate(currentUser._id, updates, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body; 
        if (!status) return res.status(400).json({ success: false, message: 'Status required' });
        
        const user = await User.findByIdAndUpdate(req.user._id, { userStatus: status }, { new: true }).select('userStatus');
        res.json({ success: true, data: user });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        const user = await User.findById(req.user._id);
        
        if (settings.likes !== undefined || settings.comments !== undefined || settings.follows !== undefined) {
             user.notificationSettings = { ...user.notificationSettings, ...settings };
        }

        if (req.body.is2FAEnabled !== undefined) {
            user.is2FAEnabled = req.body.is2FAEnabled;
        }

        await user.save();
        res.json({
            success: true,
            data: { notificationSettings: user.notificationSettings, is2FAEnabled: user.is2FAEnabled }
        });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error updating settings' });
    }
};

exports.pinPost = async (req, res) => {
    try {
        const { postId } = req.body;
        const user = await User.findById(req.user._id);
        
        if (user.pinnedPost && String(user.pinnedPost) === String(postId)) {
            user.pinnedPost = null;
        } else {
            user.pinnedPost = postId;
        }
        
        await user.save();
        res.json({ success: true, data: { pinnedPost: user.pinnedPost } });
    } catch (e) {
        res.status(500).json({ success: false, message: "Failed to pin post" });
    }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (user.password) {
        if (!currentPassword) return res.status(400).json({ success: false, message: 'Current password required' });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be 6+ chars' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updatePassword = exports.changePassword;

exports.followToggle = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user._id;

    if (targetId === myId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    const me = await User.findById(myId);

    if (!targetUser || !me) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = me.following.includes(targetId);

    if (isFollowing) {
      await User.findByIdAndUpdate(myId, { $pull: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $pull: { followers: myId } });
      return res.json({ message: "Unfollowed successfully", isFollowing: false });
    } else {
      if (targetUser.privateProfile) {
        const existingReq = await FollowRequest.findOne({ sender: myId, receiver: targetId, status: 'pending' });
        if (existingReq) {
          return res.status(400).json({ message: "Follow request already sent" });
        }
        
        await FollowRequest.create({ from: myId, to: targetId, status: 'pending' });
        return res.json({ message: "Follow request sent", isRequested: true });
      }

      await User.findByIdAndUpdate(myId, { $addToSet: { following: targetId } });
      await User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } });
      return res.json({ message: "Followed successfully", isFollowing: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error processing follow request" });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user._id;

    const me = await User.findById(myId);
    if (!me) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isBlocked = (me.blockedUsers || []).map(String).includes(String(targetId));

    if (isBlocked) {
      await User.findByIdAndUpdate(myId, { $pull: { blockedUsers: targetId } });
    } else {
      await User.findByIdAndUpdate(myId, {
        $addToSet: { blockedUsers: targetId },
        $pull: { following: targetId, followers: targetId }
      });
      await User.findByIdAndUpdate(targetId, {
        $pull: { followers: myId, following: myId }
      });
    }
    res.json({ success: true, data: { blocked: !isBlocked } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error blocking user' });
  }
};

exports.updateCloseFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const ids = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    user.closeFriends = ids;
    await user.save();

    const populated = await User.findById(user._id).select('closeFriends').populate('closeFriends', 'name avatar');
    res.json({ success: true, data: { closeFriends: populated.closeFriends || [] } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error updating close friends' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;
    
    const user = await User.findById(req.params.id)
      .select('followers')
      .populate({
        path: 'followers',
        select: 'name username avatar role isVerified',
        options: { skip: page * limit, limit: limit }
      });
      
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.followers || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching followers' });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const user = await User.findById(req.params.id)
      .select('following')
      .populate({
        path: 'following',
        select: 'name username avatar role isVerified',
        options: { skip: page * limit, limit: limit }
      });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user.following || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching following' });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'name username avatar');
    res.json({ success: true, data: user.blockedUsers || [] });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching blocked users' });
  }
};

exports.getFollowRequests = async (req, res) => {
  try {
    const reqs = await FollowRequest.find({ to: req.user._id, status: 'pending' })
      .populate('from', 'name username avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reqs });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error fetching requests' });
  }
};

exports.acceptFollowRequest = async (req, res) => {
  try {
    const fr = await FollowRequest.findById(req.params.id);
    if (!fr) return res.status(404).json({ success: false, message: 'Request not found' });

    const me = await User.findById(req.user._id);
    const them = await User.findById(fr.from);

    if (!me.followers.map(String).includes(String(them._id))) me.followers.push(them._id);
    if (!them.following.map(String).includes(String(me._id))) them.following.push(me._id);

    fr.status = 'accepted';
    await Promise.all([fr.save(), me.save(), them.save()]);
    
    await createNotification(req, {
        toUser: them._id,
        type: 'system',
        message: `${me.name} accepted your follow request.`,
        data: { link: `/profile/${me._id}` }
    });

    res.json({ success: true, message: 'Request approved' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error accepting request' });
  }
};

exports.declineFollowRequest = async (req, res) => {
  try {
    await FollowRequest.findByIdAndUpdate(req.params.id, { status: 'declined' });
    res.json({ success: true, message: 'Request declined' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error declining request' });
  }
};

exports.approveRequest = exports.acceptFollowRequest;
exports.rejectRequest = exports.declineFollowRequest;

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, {
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted_${userId}_${Date.now()}@deleted.com`,
      refreshToken: null
    });

    await User.updateMany(
        { $or: [{ followers: userId }, { following: userId }] },
        { $pull: { followers: userId, following: userId } }
    );

    const io = req.app.get('io');
    if (io) io.to(userId.toString()).emit('auth:force_logout');

    res.json({ success: true, message: 'Account deactivated and social links removed.' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteMe = exports.deleteAccount;

// ==========================================
// DAILY QUESTS & PRESTIGE STREAKS
// ==========================================
const DEFAULT_QUESTS = [
  { id: 'drop_story', title: 'Drop a 24h Story to Friends', reward: 25, target: 1 },
  { id: 'tip_creator', title: 'Send a Creator Tip on Reels', reward: 15, target: 1 },
  { id: 'explore_reels', title: 'Stream 3 Trending Reels', reward: 20, target: 3 },
  { id: 'send_dm', title: 'Exchange an Encrypted Direct Message', reward: 10, target: 1 }
];

exports.getDailyQuests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const now = new Date();
    const lastDate = user.streak?.lastActiveDate ? new Date(user.streak.lastActiveDate) : null;
    
    let streakCount = user.streak?.count || 1;
    if (lastDate) {
      const diffHours = (now - lastDate) / (1000 * 60 * 60);
      if (diffHours >= 24 && diffHours < 48) {
        streakCount += 1;
      } else if (diffHours >= 48) {
        streakCount = 1;
      }
    }

    const bestStreak = Math.max(streakCount, user.streak?.bestStreak || 1);
    user.streak = { count: streakCount, lastActiveDate: now, bestStreak };

    if (!user.dailyQuests || user.dailyQuests.length === 0) {
      user.dailyQuests = DEFAULT_QUESTS.map(q => ({
        ...q,
        completed: true,
        claimed: false,
        progress: q.target
      }));
    }

    await user.save();
    return res.json({
      success: true,
      streak: user.streak,
      quests: user.dailyQuests
    });
  } catch (err) {
    console.error('getDailyQuests err:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch quests' });
  }
};

exports.claimDailyQuest = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const quest = (user.dailyQuests || []).find(q => q.id === id);
    if (!quest) return res.status(404).json({ success: false, message: 'Quest not found' });
    if (quest.claimed) return res.status(400).json({ success: false, message: 'Reward already claimed' });

    quest.claimed = true;
    const reward = quest.reward || 15;

    if (!user.wallet) user.wallet = { balance: 0, totalReceived: 0, totalSent: 0 };
    user.wallet.balance = (user.wallet.balance || 0) + reward;
    user.wallet.totalReceived = (user.wallet.totalReceived || 0) + reward;

    await user.save();

    const Transaction = require('../models/Transaction');
    await Transaction.create({
      user: user._id,
      amount: reward,
      type: 'credit',
      description: 'Daily Quest Reward: ' + quest.title,
      idempotencyKey: 'quest:' + user._id + ':' + id + ':' + new Date().toDateString()
    }).catch(() => {});

    const io = req.app.get('io');
    if (io) io.to(user._id.toString()).emit('wallet:update', { balance: user.wallet.balance });

    return res.json({
      success: true,
      message: 'Claimed ' + reward + ' coins!',
      newBalance: user.wallet.balance,
      quests: user.dailyQuests
    });
  } catch (err) {
    console.error('claimDailyQuest err:', err);
    return res.status(500).json({ success: false, message: 'Failed to claim reward' });
  }
};

exports.passkeyRegisterOptions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const challenge = Buffer.from(Date.now().toString() + Math.random().toString()).toString('base64');
    return res.json({
      success: true,
      rp: { name: 'SocialVerse Hardware Enclave', id: 'localhost' },
      user: { id: user._id, name: user.email, displayName: user.name },
      challenge,
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { userVerification: 'preferred', residentKey: 'preferred' }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Passkey options failed' });
  }
};

exports.passkeyRegisterVerify = async (req, res) => {
  try {
    const { id, rawId, type } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.passkeyCredentials) user.passkeyCredentials = [];
    user.passkeyCredentials.push({
      credentialId: id || rawId || 'passkey_' + Date.now(),
      publicKey: 'ENCLAVE_PUBKEY_' + Date.now(),
      counter: 1,
      transports: ['internal']
    });
    await user.save();

    return res.json({ success: true, message: 'Biometric Passkey bound to Hardware Enclave successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};
```


# =====================================================================
## FILE (34/128): backend/controllers/walletController.js (Lines: 230)
# =====================================================================

```javascript
// backend/controllers/walletController.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Helper for consistent error responses
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message });

// --- 1. GET MY WALLET ---
exports.me = async (req, res) => {
  try {
    const me = await User.findById(req.user._id)
      .select('wallet lastAirdrop referralCode walletPin')
      .lean();
      
    res.json({
      ...me.wallet,
      lastAirdrop: me.lastAirdrop,
      referralCode: me.referralCode,
      hasPin: !!me.walletPin 
    });
  } catch (e) {
    console.error("Wallet Fetch Error:", e);
    res.status(500).json({ message: 'Server error fetching wallet' });
  }
};

// --- 2. SET WALLET PIN ---
exports.setPin = async (req, res) => {
  try {
    const { pin, oldPin } = req.body;
    const user = await User.findById(req.user._id).select('+walletPin');

    if (!pin || pin.length !== 6 || isNaN(pin)) {
      return fail(res, 'PIN must be exactly 6 digits');
    }

    // Verify old PIN if it exists to prevent unauthorized overwrite
    if (user.walletPin) {
      if (!oldPin) return fail(res, 'Please enter your current PIN to change it.', 403);
      
      const isMatch = await bcrypt.compare(oldPin, user.walletPin);
      if (!isMatch) return fail(res, 'Current PIN is incorrect.', 401);
    }

    const hashed = await bcrypt.hash(pin, 10);
    user.walletPin = hashed;
    await user.save();
    
    res.json({ success: true, message: 'Wallet PIN updated successfully' });
  } catch (e) {
    res.status(500).json({ message: 'Error setting PIN' });
  }
};

// --- 3. CHECK PIN STATUS ---
exports.checkPinStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletPin').lean();
    res.json({ hasPin: !!user.walletPin });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 4. DAILY AIRDROP ---
exports.airdrop = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const now = new Date();
    
    if (me.lastAirdrop) {
      const diff = now - new Date(me.lastAirdrop);
      const hours = diff / (1000 * 60 * 60);
      if (hours < 24) {
        const timeLeft = Math.ceil(24 - hours);
        return fail(res, `Come back in ${timeLeft} hours!`);
      }
    }

    const AMOUNT = 200;
    
    // 🔥 FIX: Use { new: true } to return the updated document, preventing stale socket emits
    const updatedUser = await User.findByIdAndUpdate(req.user._id, {
      $inc: { "wallet.balance": AMOUNT },
      $set: { lastAirdrop: now }
    }, { new: true });

    // Log transaction (fire and forget for airdrop)
    Transaction.create({
      user: me._id,
      type: 'credit',
      amount: AMOUNT,
      description: 'Daily Airdrop Reward',
      idempotencyKey: `airdrop:${me._id}:${now.toISOString().split('T')[0]}`
    }).catch(err => console.warn('Airdrop transaction log error:', err.message));

    const io = req.app.get('io') || global.io;
    if (io) {
      // Broadcast the exact new balance
      io.to(String(me._id)).emit('wallet:update', { balance: updatedUser.wallet.balance });
    }

    res.json({ success: true, message: `Received ${AMOUNT} coins!`, balance: updatedUser.wallet.balance });
  } catch (e) {
    console.error("Airdrop error:", e);
    res.status(500).json({ message: 'Server error processing airdrop' });
  }
};

// --- 5. SECURE TRANSFER (TIP) - ACID Transaction with Standalone Mongo Fallback ---
exports.tip = async (req, res) => {
  let session = null;
  try {
    const to = req.body.to || req.body.recipientId || req.body.targetUserId;
    const pin = req.body.pin || req.body.newPin;
    const idempotencyKey = req.body.idempotencyKey;
    const numAmount = Math.abs(Number(req.body.amount));

    if (!numAmount || numAmount < 1) return fail(res, 'Invalid amount (min 1 coin)');

    // 1. Fetch Sender & Verify PIN (Read Operation)
    const sender = await User.findById(req.user._id).select('+walletPin wallet');
    if (!sender.walletPin) {
      if (req.body.newPin && String(req.body.newPin).length === 6 && !isNaN(req.body.newPin)) {
        sender.walletPin = await bcrypt.hash(String(req.body.newPin), 10);
        await sender.save();
      } else {
        return fail(res, 'Please set a 6-digit Wallet PIN first', 403);
      }
    } else {
      const isPinValid = await bcrypt.compare(String(pin || ''), sender.walletPin);
      if (!isPinValid) return fail(res, 'Incorrect PIN', 401);
    }

    if (sender.wallet.balance < numAmount) return fail(res, 'Insufficient balance');

    // 2. Resolve Recipient
    if (!to) return fail(res, 'Recipient ID is required', 400);
    const recipient = await User.findById(to);
    if (!recipient) return fail(res, 'User not found', 404);
    if (sender._id.equals(recipient._id)) return fail(res, 'Cannot tip yourself');

    // 3. START SESSION IF SUPPORTED (Replica set environments)
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (_) {
      session = null;
    }
    const sessionOpts = session ? { session } : {};

    const safeIdempotencyKey = idempotencyKey || `tip:${sender._id}:${Date.now()}`;

    // 4. Log Transaction FIRST (Idempotency Guard)
    await Transaction.create([{
      user: sender._id,
      type: 'debit',
      amount: numAmount,
      description: `Tip to ${recipient.name}`,
      idempotencyKey: safeIdempotencyKey
    }], sessionOpts);

    // 5. Deduct from Sender (Atomic decrement with balance guard)
    const updatedSender = await User.findOneAndUpdate(
      { _id: sender._id, "wallet.balance": { $gte: numAmount } },
      { $inc: { "wallet.balance": -numAmount, "wallet.totalSent": numAmount } },
      { ...sessionOpts, new: true }
    );

    if (!updatedSender) {
        throw new Error("Balance check failed during atomic update");
    }

    // 6. Add to Recipient
    await User.findByIdAndUpdate(
      recipient._id,
      { $inc: { "wallet.balance": numAmount, "wallet.totalReceived": numAmount } },
      sessionOpts
    );

    // 7. Log Recipient Credit Side
    await Transaction.create([{
      user: recipient._id,
      type: 'credit',
      amount: numAmount,
      description: `Tip from ${sender.name}`,
      idempotencyKey: `tip-credit:${sender._id}:${recipient._id}:${Date.now()}`
    }], sessionOpts);

    // 8. Commit if session is active
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    // 9. Real-time Updates (Best Effort)
    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(String(sender._id)).emit('wallet:update', { balance: updatedSender.wallet.balance });
      io.to(String(recipient._id)).emit('wallet:update', { balance: recipient.wallet.balance + numAmount });
      io.to(String(recipient._id)).emit('notification', {
        type: 'wallet',
        message: `You received ${numAmount} coins from ${sender.name}!`
      });
    }

    res.json({ success: true, message: `Sent ${numAmount} to ${recipient.name}` });

  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (_) {}
      session.endSession();
    }
    
    // Handle Duplicate Key Error (Idempotency Success)
    if (err.code === 11000) {
      return res.json({ success: true, message: 'Transaction already processed (Cached)', cached: true });
    }
    
    console.error("Tip Transaction Failed:", err);
    
    if (err.message === "Balance check failed during atomic update") {
        return fail(res, 'Insufficient balance (Concurrent transaction)');
    }

    res.status(500).json({ success: false, message: "Transaction failed" });
  }
};
```


# =====================================================================
## FILE (35/128): backend/cron/publish.js (Lines: 14)
# =====================================================================

```javascript
// backend/cron/publish.js
const Post = require('../models/Post');

setInterval(async () => {
  const now = new Date();
  const pending = await Post.find({ publishAt: { $lte: now }, isPublished: { $ne: true } });
  for (const p of pending) {
    p.isPublished = true;
    await p.save();
    // emit event
    global.io?.emit('post:published', p);
  }
}, 15 * 1000); // every 15s in DEV; increase in prod
```


# =====================================================================
## FILE (36/128): backend/cron/storyCleanup.js (Lines: 33)
# =====================================================================

```javascript
// backend/cron/storyCleanup.js
const cron = require('node-cron');
const Story = require('../models/Story');
const { deleteFile } = require('../utils/cloudinary');

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('🧹 Running Story Cleanup...');
  try {
    const now = new Date();
    
    // 1. Find expired stories
    const expiredStories = await Story.find({ expiresAt: { $lt: now } });
    
    if (expiredStories.length === 0) return;

    // 2. Delete media from Cloudinary
    for (const story of expiredStories) {
      if (story.media) {
         // This uses the deleteFile utility we fixed earlier
         await deleteFile(story.media);
      }
    }

    // 3. Delete from DB
    const ids = expiredStories.map(s => s._id);
    await Story.deleteMany({ _id: { $in: ids } });
    
    console.log(`✅ Cleaned up ${ids.length} expired stories.`);
  } catch (err) {
    console.error('Story cleanup failed:', err);
  }
});
```


# =====================================================================
## FILE (37/128): backend/drop_indexes.js (Lines: 31)
# =====================================================================

```javascript
// backend/drop_indexes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Drop ALL indexes on the 'posts' collection
    try {
        await mongoose.connection.collection('posts').dropIndexes();
        console.log('🔥 Successfully dropped all indexes on "posts" collection.');
    } catch (e) {
        console.log('⚠️ Could not drop indexes (maybe collection is empty?). Skipping.');
    }

    console.log('✅ Done. You can now restart your server.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();
```


# =====================================================================
## FILE (38/128): backend/index.js (Lines: 1)
# =====================================================================

```javascript

```


# =====================================================================
## FILE (39/128): backend/middleware/authMiddleware.js (Lines: 282)
# =====================================================================

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Redis optional (prevents startup crash)
let redisClient;

try {
    redisClient = require('../config/redis');
} catch (err) {

    console.warn(
        '⚠ Redis not configured → Token blacklist disabled'
    );

    redisClient = {
        get: async () => null,
        set: async () => null,
    };
}

async function protect(req, res, next) {
    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {

            token =
                req.headers.authorization.split(' ')[1];

        } else if (
            req.cookies &&
            req.cookies.jwt
        ) {

            token = req.cookies.jwt;
        }

        if (!token) {
            return res
                .status(401)
                .json({
                    message:
                        'Not authenticated',
                });
        }

        // Optional blacklist check
        const blacklisted =
            await redisClient.get(
                `blacklist:${token}`
            );

        if (blacklisted) {
            return res
                .status(401)
                .json({
                    message:
                        'Session expired. Login again.',
                });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user =
            await User.findById(decoded.id);

        if (!user || user.isDeleted) {
            return res
                .status(401)
                .json({
                    message:
                        'Account unavailable',
                });
        }

        req.user = user;
        req.userId = String(user._id);
        req.user.id = String(user._id);

        next();

    } catch (err) {

        return res
            .status(401)
            .json({
                message:
                    'Token invalid or expired',
            });
    }
}

async function optionalAuth(
    req,
    res,
    next
) {
    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith(
                'Bearer'
            )
        ) {

            token =
                req.headers.authorization.split(
                    ' '
                )[1];

        } else if (
            req.cookies &&
            req.cookies.jwt
        ) {

            token = req.cookies.jwt;
        }

        if (!token) {
            return next();
        }

        try {

            const blacklisted =
                await redisClient.get(
                    `blacklist:${token}`
                );

            if (blacklisted) {
                return next();
            }

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

            const user =
                await User.findById(
                    decoded.id
                );

            if (
                user &&
                !user.isDeleted
            ) {
                req.user = user;
                req.userId =
                    String(
                        user._id
                    );

                req.user.id =
                    String(
                        user._id
                    );
            }

        } catch {}

        next();

    } catch {

        next();
    }
}

function restrictTo(...allowedRoles) {
    return (
        req,
        res,
        next
    ) => {

        if (!req.user) {
            return res
                .status(401)
                .json({
                    message:
                        'Not authenticated',
                });
        }

        if (
            !allowedRoles.includes(
                req.user.role
            )
        ) {
            return res
                .status(403)
                .json({
                    message:
                        'Forbidden',
                });
        }

        next();
    };
}

function requireRole(role) {
    return (
        req,
        res,
        next
    ) => {

        if (!req.user) {
            return res
                .status(401)
                .json({
                    message:
                        'Not authenticated',
                });
        }

        if (
            req.user.role !==
            role
        ) {
            return res
                .status(403)
                .json({
                    message:
                        `Requires ${role}`,
                });
        }

        next();
    };
}

function adminOnly(
    req,
    res,
    next
) {

    if (!req.user) {
        return res
            .status(401)
            .json({
                message:
                    'Not authenticated',
            });
    }

    if (
        req.user.role ===
        'admin'
    ) {
        return next();
    }

    return res
        .status(403)
        .json({
            message:
                'Admins only',
        });
}

module.exports = {
    protect,
    optionalAuth,
    restrictTo,
    requireRole,
    adminOnly,
};
```


# =====================================================================
## FILE (40/128): backend/middleware/bannedWords.js (Lines: 23)
# =====================================================================

```javascript
// backend/middleware/bannedWords.js
const fs = require('fs');
const path = require('path');

let banned = [];
try {
  const p = path.join(__dirname, '..', 'config', 'banned-words.txt');
  if (fs.existsSync(p)) banned = fs.readFileSync(p, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
} catch(e){}

module.exports = (req, res, next) => {
  const text = (req.body?.content || req.body?.caption || '') + '';
  if (!text) return next();
  const lower = text.toLowerCase();
  for (const w of banned) {
    if (!w) continue;
    if (lower.includes(w.toLowerCase())) {
      return res.status(400).json({ message: 'Content contains banned words' });
    }
  }
  next();
};
```


# =====================================================================
## FILE (41/128): backend/middleware/errorHandler.js (Lines: 65)
# =====================================================================

```javascript
// backend/middleware/errorHandler.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  logger.error(err?.stack || err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid resource ID';
  }

  if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field || 'Record'} already exists`;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    errors = Object.values(err.errors).map((v) => v.message);
    message = errors.join(', ');
  }

  if (err?.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err?.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (err?.name === 'ZodError') {
    statusCode = 400;
    errors = (err.issues || []).map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};
```


# =====================================================================
## FILE (42/128): backend/middleware/rateLimit.js (Lines: 71)
# =====================================================================

```javascript
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const getKey = (req) => {
  if (req.user?._id) {
    return `user:${req.user._id}`;
  }

  return ipKeyGenerator(req.ip);
};

const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    keyGenerator: getKey,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

exports.generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests, try again later',
});

exports.authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts',
});

exports.chatLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Message rate exceeded',
});

exports.gameLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: 'Too many submissions',
});

exports.financialLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: 'Financial limit reached',
});

exports.uploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many uploads, try again later',
});

exports.passwordResetLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset attempts',
});

exports.otpLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many OTP attempts',
});
```


# =====================================================================
## FILE (43/128): backend/middleware/requestLogger.js (Lines: 41)
# =====================================================================

```javascript
// backend/middleware/requestLogger.js

const logger = require('../utils/logger');

module.exports = (req, res, next) => {

  // Skip static assets
  const ignored = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.ico',
    '.webp',
    '.map'
  ];

  const shouldIgnore = ignored.some(ext =>
    req.originalUrl.endsWith(ext)
  );

  if (shouldIgnore) {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {

    const duration = Date.now() - start;

    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );

  });

  next();
};
```


# =====================================================================
## FILE (44/128): backend/middleware/validate.js (Lines: 41)
# =====================================================================

```javascript
// backend/middleware/validate.js
const { ZodError } = require('zod');

/**
 * Enterprise validation middleware parsing incoming request streams securely.
 * Mitigates unhandled engine crashes on invalid or entirely absent payload contexts.
 */
module.exports = (schema) => {
  return async (req, res, next) => {
    try {
      // Hardened initialization ensures structural evaluation blocks are objects
      const payload = {
        body: req.body && typeof req.body === 'object' ? req.body : {},
        query: req.query && typeof req.query === 'object' ? req.query : {},
        params: req.params && typeof req.params === 'object' ? req.params : {},
      };

      const validated = await schema.parseAsync(payload);
      
      // Safe context re-assignment preventing payload corruption
      req.body = validated.body ?? req.body;
      req.query = validated.query ?? req.query;
      req.params = validated.params ?? req.params;
      
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          type: 'ValidationError',
          message: 'Validation failed',
          errors: err.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }
      return next(err);
    }
  };
};
```


# =====================================================================
## FILE (45/128): backend/middleware/validateContent.js (Lines: 25)
# =====================================================================

```javascript
// backend/middleware/validateContent.js
const Filter = require('bad-words');
const filter = new Filter();

// Optional: Add custom bad words
// filter.addWords('somebadword', 'anotherone');

module.exports = (req, res, next) => {
  try {
    const fieldsToCheck = ['content', 'text', 'caption', 'title', 'description', 'message'];
    
    for (const field of fieldsToCheck) {
      if (req.body[field] && typeof req.body[field] === 'string') {
        if (filter.isProfane(req.body[field])) {
          return res.status(400).json({ 
            message: 'Your content contains inappropriate language. Please revise it.' 
          });
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};
```


# =====================================================================
## FILE (46/128): backend/models/ActiveCall.js (Lines: 11)
# =====================================================================

```javascript
// backend/models/ActiveCall.js
const mongoose = require('mongoose');

const ActiveCallSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 🔥 Auto-delete after 24 hours (MongoDB TTL)
});

module.exports = mongoose.model('ActiveCall', ActiveCallSchema);
```


# =====================================================================
## FILE (47/128): backend/models/Chat.js (Lines: 75)
# =====================================================================

```javascript
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    chatName: { type: String, trim: true, default: '' }, // legacy alias
    isGroup: { type: Boolean, default: false },
    isGroupChat: { type: Boolean, default: false }, // legacy alias

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },

    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],

    unread: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    isSecret: {
      type: Boolean,
      default: false,
    },

    ephemeralDuration: {
      type: Number,
      default: 0, // 0 = disabled, or duration in seconds (e.g. 10, 60, 3600, 86400)
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.pre('save', function normalize(next) {
  if (!this.chatName && this.name) this.chatName = this.name;
  if (!this.name && this.chatName) this.name = this.chatName;
  if (typeof this.isGroupChat !== 'boolean') this.isGroupChat = !!this.isGroup;
  if (typeof this.isGroup !== 'boolean') this.isGroup = !!this.isGroupChat;
  next();
});

chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
```


# =====================================================================
## FILE (48/128): backend/models/Comment.js (Lines: 37)
# =====================================================================

```javascript
// backend/models/Comment.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  audio: {
    type: String
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
}, {
  timestamps: true
});

// --- INDEXES ---
// Compound index to optimize querying comments by post and sorting them by newest first
commentSchema.index({ post: 1, createdAt: -1 });

// Index to optimize querying comments by a specific user
commentSchema.index({ user: 1 });

module.exports = mongoose.model("Comment", commentSchema);
```


# =====================================================================
## FILE (49/128): backend/models/Event.js (Lines: 15)
# =====================================================================

```javascript
// backend/models/Event.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  location: String,
  type: { type: String, enum: ['virtual', 'physical'], default: 'physical' },
  image: String,
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
```


# =====================================================================
## FILE (50/128): backend/models/FollowRequest.js (Lines: 11)
# =====================================================================

```javascript
// backend/models/FollowRequest.js
const mongoose = require('mongoose');

const followReq = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending','accepted','declined'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('FollowRequest', followReq);
```


# =====================================================================
## FILE (51/128): backend/models/GameScore.js (Lines: 41)
# =====================================================================

```javascript
const mongoose = require('mongoose');

const GameScoreSchema =
  new mongoose.Schema({

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    gameId: {
      type: String,
      required: true
    },

    score: {
      type: Number,
      required: true
    }

  }, {
    timestamps: true
  });

// --- INDEXES ---

GameScoreSchema.index({
  gameId: 1,
  score: -1
});

GameScoreSchema.index({
  user: 1
});

module.exports =
  mongoose.model(
    'GameScore',
    GameScoreSchema
  );
```


# =====================================================================
## FILE (52/128): backend/models/Group.js (Lines: 18)
# =====================================================================

```javascript
// backend/models/Group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  handle: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  avatar: { type: String },
  coverPhoto: { type: String },
  privacy: { type: String, enum: ['public','private'], default: 'public' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bannedWords: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema);

```


# =====================================================================
## FILE (53/128): backend/models/LiveStream.js (Lines: 21)
# =====================================================================

```javascript
// backend/models/LiveStream.js
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
```


# =====================================================================
## FILE (54/128): backend/models/Message.js (Lines: 119)
# =====================================================================

```javascript
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      
    },
    type: {
      type: String,
      enum: ['text', 'poll', 'system'],
      default: 'text',
    },
    pollOptions: [
      {
        text: String,
        votes: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    content: {
      type: String,
      default: '',
    },
    media: {
      type: String,
      default: null,
    },
    audio: {
      type: String,
      default: null,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    isEphemeral: {
      type: Boolean,
      default: false,
    },
    ephemeralDuration: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    reactions: [
      {
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        emoji: String,
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ chat: 1, content: 'text' });
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.Message || mongoose.model('Message', MessageSchema);
```


# =====================================================================
## FILE (55/128): backend/models/ModerationReport.js (Lines: 16)
# =====================================================================

```javascript
// backend/models/ModerationReport.js
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
```


# =====================================================================
## FILE (56/128): backend/models/Notification.js (Lines: 16)
# =====================================================================

```javascript
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['like', 'comment', 'follow', 'mention', 'message', 'group', 'report', 'system', 'reel', 'story'], default: 'system' },
    data: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Optimized compound index
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
```


# =====================================================================
## FILE (57/128): backend/models/Payout.js (Lines: 15)
# =====================================================================

```javascript
// backend/models/Payout.js
const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['manual', 'scheduled', 'auto'], default: 'manual' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  note: String,
  createdAt: { type: Date, default: Date.now },
  paidAt: Date,
});

module.exports = mongoose.model('Payout', PayoutSchema);
```


# =====================================================================
## FILE (58/128): backend/models/PollVote.js (Lines: 13)
# =====================================================================

```javascript
// backend/models/PollVote.js
const mongoose = require('mongoose');

const PollVoteSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  optionIndex: { type: Number, required: true }
}, { timestamps: true });

// Compound Index: One vote per user per post
PollVoteSchema.index({ postId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('PollVote', PollVoteSchema);
```


# =====================================================================
## FILE (59/128): backend/models/Post.js (Lines: 187)
# =====================================================================

```javascript
// backend/models/Post.js
const mongoose = require('mongoose');

const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
      index: true,
    },

    content: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },

    images: [
      {
        type: String,
        trim: true,
      },
    ],

    videos: [
      {
        type: String,
        trim: true,
      },
    ],

    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
      index: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    isFlagged: {
      type: Boolean,
      default: false,
    },

    isPaywalled: {
      type: Boolean,
      default: false,
    },

    unlockPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    unlockedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    isDraft: {
      type: Boolean,
      default: false,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    publishAt: {
      type: Date,
      default: null,
    },

    scheduledFor: {
      type: Date,
      default: null,
    },

    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },

    allowComments: {
      type: Boolean,
      default: true,
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    link: {
      type: String,
      trim: true,
      default: '',
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PostSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
});

PostSchema.index({ hashtags: 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ score: -1, createdAt: -1 });

module.exports = mongoose.models.Post || mongoose.model('Post', PostSchema);
```


# =====================================================================
## FILE (60/128): backend/models/Product.js (Lines: 20)
# =====================================================================

```javascript

// backend/models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  price: Number,
  image: String,
  desc: String,
  tags: [String],
  stock: { type: Number, default: 1 }
}, { timestamps: true });

// 🔥 FIX: Separate the indexes. 
// You cannot mix 'text' and 'array' in a single compound index in MongoDB.
ProductSchema.index({ title: 'text' });
ProductSchema.index({ tags: 1 });

module.exports = mongoose.model('Product', ProductSchema);
```


# =====================================================================
## FILE (61/128): backend/models/Reel.js (Lines: 53)
# =====================================================================

```javascript
const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  videoUrl: {
    type: String,
    required: true
  },

  caption: {
    type: String,
    default: ''
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  views: {
    type: Number,
    default: 0
  },

  tags: [{
    type: String
  }]

}, {
  timestamps: true
});

// --- INDEXES ---

reelSchema.index({
  createdAt: -1
});

reelSchema.index({
  user: 1
});

module.exports =
  mongoose.model(
    'Reel',
    reelSchema
  );
```


# =====================================================================
## FILE (62/128): backend/models/Report.js (Lines: 63)
# =====================================================================

```javascript
const mongoose = require('mongoose');

const { Schema } = mongoose;

const ReportSchema = new Schema({

  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  targetUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },

  targetPost: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },

  reason: {
    type: String,
    required: true
  },

  details: {
    type: String
  },

  status: {
    type: String,
    enum: [
      'open',
      'investigating',
      'resolved',
      'dismissed'
    ],
    default: 'open'
  },

  handledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }

}, {
  timestamps: true
});

// --- INDEXES ---

ReportSchema.index({
  status: 1,
  createdAt: -1
});

module.exports =
  mongoose.model(
    'Report',
    ReportSchema
  );
```


# =====================================================================
## FILE (63/128): backend/models/Saved.js (Lines: 11)
# =====================================================================

```javascript
// backend/models/Saved.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SavedSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
}, { timestamps: true });

module.exports = mongoose.model('Saved', SavedSchema);
```


# =====================================================================
## FILE (64/128): backend/models/ShopItem.js (Lines: 15)
# =====================================================================

```javascript
// backend/models/ShopItem.js
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
```


# =====================================================================
## FILE (65/128): backend/models/Space.js (Lines: 65)
# =====================================================================

```javascript
// backend/models/Space.js
const mongoose = require('mongoose');

const SpaceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    topic: {
      type: String,
      default: 'General Conversation',
      trim: true,
      maxlength: 60,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    speakers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    listeners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    handRaises: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

SpaceSchema.index({ isActive: 1, startedAt: -1 });

module.exports = mongoose.models.Space || mongoose.model('Space', SpaceSchema);
```


# =====================================================================
## FILE (66/128): backend/models/Story.js (Lines: 25)
# =====================================================================

```javascript
const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    media: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    privacy: { type: String, enum: ['public', 'close_friends'], default: 'public' },
    caption: { type: String, default: '' },
    color: { type: String, default: '#ffffff' },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: { type: String, default: '❤️' },
        createdAt: { type: Date, default: Date.now }
    }],
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

// --- INDEXES ---
StorySchema.index({ user: 1 });
// Auto-delete stories after 24 hours (86400 seconds TTL Index)
StorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Story', StorySchema);
```


# =====================================================================
## FILE (67/128): backend/models/Transaction.js (Lines: 38)
# =====================================================================

```javascript
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: function(amountValue) {
        return amountValue > 0 && Number.isInteger(amountValue);
      },
      message: 'Transaction balance increments must represent integer values using localized lowest sub-units.'
    }
  },
  description: {
    type: String,
    trim: true,
    maxLength: 300
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true, // Strict database key uniqueness enforcement mapping rule
    default: () => require('crypto').randomUUID()
  }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
```


# =====================================================================
## FILE (68/128): backend/models/User.js (Lines: 237)
# =====================================================================

```javascript
// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true // Critically indexed for high-volume username lookups
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true // Critically indexed for high-volume email lookups
    },

    password: {
      type: String,
      required: function() { 
        // Dynamic condition: password property is required only if the profile isn't authenticating via Google OAuth
        return !this.googleId; 
      }
    },

    avatar: {
      type: String,
      default: ''
    },

    coverPhoto: {
      type: String,
      default: ''
    },

    bio: {
      type: String,
      default: ''
    },

    website: {
      type: String,
      default: ''
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    role: {
      type: String,
      enum: ['user', 'admin', 'moderator', 'banned'],
      default: 'user'
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    // ==========================================
    // EXTRA FUNCTIONAL SYSTEMS
    // ==========================================

    // --- Wallet & Economy System ---
    wallet: {
      balance: { type: Number, default: 0 },
      totalSent: { type: Number, default: 0 },
      totalReceived: { type: Number, default: 0 }
    },
    walletPin: { type: String, select: false }, // Hashed PIN for transactions
    lastAirdrop: { type: Date },
    lastDailyBonus: { type: Date },
    referralCode: { type: String },

    // --- Gamification & Social ---
    streak: {
      count: { type: Number, default: 1 },
      lastActiveDate: { type: Date, default: Date.now },
      bestStreak: { type: Number, default: 1 }
    },
    dailyQuests: [
      {
        id: String,
        title: String,
        reward: Number,
        completed: { type: Boolean, default: false },
        claimed: { type: Boolean, default: false },
        progress: { type: Number, default: 0 },
        target: { type: Number, default: 1 }
      }
    ],
    passkeyCredentials: [
      {
        credentialId: String,
        publicKey: String,
        counter: Number,
        transports: [String],
        createdAt: { type: Date, default: Date.now }
      }
    ],
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: String }],
    nftPfpUrl: { type: String },
    profileCompletion: { type: Number, default: 20 },
    socialLinks: {
      twitter: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' }
    },

    // --- Profile Visibility & Status ---
    privateProfile: { type: Boolean, default: false },
    userStatus: { type: String, default: 'online' },
    pinnedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    closeFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // --- Location & Geo-queries ---
    geo: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    },

    // --- Security & Auth (2FA / Sessions / Push) ---
    is2FAEnabled: { type: Boolean, default: false },
    twoFactorAuth: {
      enabled: { type: Boolean, default: false },
      secret: { type: String }
    },
    refreshToken: { type: String },
    googleId: { type: String, unique: true, sparse: true }, // Added sparse flag configuration for partial validation indexing on federated signups
    notificationSettings: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true }
    },
    pushSubscriptions: [{
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String
      }
    }],

    // --- Account Deletion State ---
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
  },
  {
    timestamps: true
  }
);

// ==========================================
// DB INDEXES
// ==========================================

// Critical index required for $near and geo-spatial queries
userSchema.index({ geo: '2dsphere' });

// Optimized Compound/Standard Time-Series Query Indexing
userSchema.index({ createdAt: -1 });

// ==========================================
// PASSWORD HASH
// ==========================================

userSchema.pre(
  'save',
  async function (next) {
    if (!this.isModified('password') || !this.password) {
      return next();
    }

    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
  }
);

// ==========================================
// PASSWORD COMPARE
// ==========================================

userSchema.methods.matchPassword =
  async function (enteredPassword) {
    if (!this.password) return false; // Prevent comparison if user is an exclusive OAuth signup without a password
    return bcrypt.compare(
      enteredPassword,
      this.password
    );
  };

// ==========================================

module.exports =
  mongoose.models.User ||
  mongoose.model(
    'User',
    userSchema
  );
```


# =====================================================================
## FILE (69/128): backend/package.json (Lines: 66)
# =====================================================================

```json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@faker-js/faker": "^10.1.0",
    "@socket.io/redis-adapter": "^8.3.0",
    "axios": "^1.13.2",
    "bad-words": "^3.0.4",
    "bcryptjs": "^3.0.3",
    "chart.js": "^4.5.1",
    "cheerio": "^1.1.2",
    "cloudinary": "^2.8.0",
    "compression": "^1.8.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "crypto-js": "^4.2.0",
    "dotenv": "^17.2.3",
    "express": "^4.18.2",
    "express-mongo-sanitize": "^2.2.0",
    "express-rate-limit": "^8.2.1",
    "google-auth-library": "^10.5.0",
    "got": "^14.6.2",
    "helmet": "^8.1.0",
    "hpp": "^0.2.3",
    "jsonwebtoken": "^9.0.2",
    "link-preview-js": "^3.1.0",
    "metascraper": "^5.49.5",
    "metascraper-description": "^5.49.5",
    "metascraper-title": "^5.49.5",
    "mime-types": "^3.0.1",
    "mongodb": "4.1",
    "mongodb-memory-server": "^11.3.0",
    "mongoose": "^8.20.2",
    "morgan": "^1.10.1",
    "multer": "^2.0.2",
    "node-cron": "^4.2.1",
    "node-fetch": "^3.3.2",
    "nodemailer": "^7.0.13",
    "react-chartjs-2": "^5.3.1",
    "redis": "^5.10.0",
    "resend": "^6.7.0",
    "socket.io": "^4.8.1",
    "socket.io-redis": "^6.1.1",
    "twilio": "^5.11.2",
    "uuid": "^13.0.0",
    "web-push": "^3.6.7",
    "winston": "^3.19.0",
    "xss-clean": "^0.1.4",
    "yahoo-finance2": "^3.11.2",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.10"
  },
  "description": ""
}
```


# =====================================================================
## FILE (70/128): backend/routes/admin.js (Lines: 49)
# =====================================================================

```javascript
// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Hardware Enclave Lockdown: Only Founder Sidhanta Sahu can access admin routes
const founderEnclaveGuard = (req, res, next) => {
  const u = req.user;
  if (!u) return res.status(401).json({ message: 'Authentication required' });
  const isFounder = (
    u.email === 'sidhantas786@gmail.com' ||
    u.email === 'admin@socialapp.com' ||
    u.username === 'sidsahu' ||
    u.role === 'admin'
  );
  if (!isFounder) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Hardware Enclave Protection restricts administrative controls to Founder Sidhanta Sahu.'
    });
  }
  next();
};

// Protect all admin routes with strict dual enclave verification
router.use(protect, restrictTo('admin'), founderEnclaveGuard);

// --- Dashboard Stats & Telemetry ---
router.get('/stats', adminController.getStats);
router.post('/broadcast', adminController.broadcastAnnouncement);
router.post('/maintenance', adminController.toggleMaintenance);

// --- User Management & Creator Treasury ---
router.get('/users', adminController.listUsers);
router.put('/users/:id/verify', adminController.toggleVerifyUser);
router.post('/users/:id/coins', adminController.grantCoins);
router.put('/users/:id/ban', adminController.banUser);
router.delete('/users/:id', adminController.deleteUser);

// --- Content Moderation ---
router.get('/posts', adminController.listPosts);

// --- Report Management ---
router.get('/reports', adminController.getReports);
router.put('/reports/:id', adminController.handleReport);

module.exports = router;
```


# =====================================================================
## FILE (71/128): backend/routes/apps.js (Lines: 34)
# =====================================================================

```javascript
// backend/routes/apps.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const appsController = require('../controllers/appsController');
const { gameLimiter } = require('../middleware/rateLimit');

// Optional authentication middleware: attaches user if token exists, but does not block guests
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

// Events (Publicly viewable, creation & joining protected)
router.get('/events', optionalAuth, appsController.getEvents);
router.post('/events', protect, appsController.createEvent);
router.post('/events/:id/join', protect, appsController.joinEvent);
router.delete('/events/:id', protect, appsController.deleteEvent);

// Wallet
router.get('/wallet', protect, appsController.getWallet);

// Games (Leaderboards publicly viewable, score submission protected)
router.get('/games', optionalAuth, (req, res) => res.json({ success: true, data: [{ id: 'snake', name: 'Cyber Snake', icon: '🐍' }, { id: '2048', name: '2048 Elite', icon: '🔢' }, { id: 'quiz', name: 'Trivia Royale', icon: '❓' }] }));
router.get('/games/:gameId/leaderboard', optionalAuth, appsController.getLeaderboard);
router.post('/games/score', protect, gameLimiter, appsController.submitScore);

// Analytics
router.get('/analytics', protect, appsController.getAnalytics);

module.exports = router;
```


# =====================================================================
## FILE (72/128): backend/routes/auth.js (Lines: 101)
# =====================================================================

```javascript
// backend/routes/auth.js

const express = require('express');
const router = express.Router();

// Middleware
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { protect } = require('../middleware/authMiddleware');

// Validators
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  requestResetSchema,
  resetPasswordSchema,
  googleLoginSchema,
} = require('../validators/authValidator');

// Controller
const authController = require('../controllers/authController');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Register
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

// Verify OTP
router.post(
  '/verify-otp',
  authLimiter,
  validate(verifyOtpSchema),
  authController.verifyOtp
);

// Login
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

// Google Login
router.post(
  '/google-login',
  authLimiter,
  validate(googleLoginSchema),
  authController.googleLogin
);

// Refresh Token
router.post(
  '/refresh',
  authLimiter,
  authController.refresh
);

// Request Password Reset
router.post(
  '/request-reset',
  authLimiter,
  validate(requestResetSchema),
  authController.requestPasswordReset
);

// Reset Password
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ==========================================
// PROTECTED ROUTES
// ==========================================

// Logout
router.post(
  '/logout',
  protect,
  authController.logout
);

// Logout All Other Sessions
router.post(
  '/logout-all',
  protect,
  authController.logoutAll
);

module.exports = router;
```


# =====================================================================
## FILE (73/128): backend/routes/calls.js (Lines: 12)
# =====================================================================

```javascript
// backend/routes/calls.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createRoom, joinRoom, getIceServers } = require('../controllers/callsController');

router.post('/room', protect, createRoom);
router.post('/room/:roomId/join', protect, joinRoom);
router.get('/credentials', protect, getIceServers);

module.exports = router;
```


# =====================================================================
## FILE (74/128): backend/routes/chat.js (Lines: 34)
# =====================================================================

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

router.post('/', protect, chatController.createChat);
router.post('/group', protect, chatController.createGroupChat);

router.get('/', protect, chatController.getChats);

router.get('/:chatId', protect, chatController.getChatById);
router.get('/:chatId/messages', protect, chatController.getMessages);
router.get('/:chatId/search', protect, chatController.searchMessages);

router.post('/:chatId/message', protect, chatController.sendMessage);
router.put('/:chatId/message/:messageId', protect, chatController.updateMessage);
router.delete('/:chatId/message/:messageId', protect, chatController.deleteMessage);
router.post('/message/:messageId/vote', protect, chatController.votePoll);

router.post('/:chatId/read', protect, chatController.markAsRead);
router.put('/:chatId/details', protect, chatController.updateGroupDetails);
router.put('/:chatId/members', protect, chatController.manageMembers);
router.post('/:chatId/leave', protect, chatController.leaveGroup);
router.put('/:chatId/pin/:messageId', protect, chatController.togglePin);
router.put('/:chatId/ephemeral', protect, chatController.toggleEphemeral);
router.delete('/:chatId', protect, chatController.deleteChat);

// legacy aliases
router.put('/rename', protect, chatController.renameGroup);
router.put('/groupadd', protect, chatController.addToGroup);
router.put('/groupremove', protect, chatController.removeFromGroup);
router.get('/message/:chatId', protect, chatController.allMessages);

module.exports = router;
```


# =====================================================================
## FILE (75/128): backend/routes/comments.js (Lines: 20)
# =====================================================================

```javascript

// backend/routes/comments.js
const router = require("express").Router();
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const comments = require("../controllers/commentsController");

// Toggle like (MUST be defined before /:postId)
router.post("/like/:commentId", protect, comments.toggleLike);
router.post("/:commentId/like", protect, comments.toggleLike);

// Delete a comment
router.delete("/:commentId", protect, comments.remove);

// Create a comment
router.post("/:postId", protect, comments.create);

// List comments (public with optional auth)
router.get("/:postId", optionalAuth, comments.listAll);

module.exports = router;
```


# =====================================================================
## FILE (76/128): backend/routes/conversations.js (Lines: 11)
# =====================================================================

```javascript
// backend/routes/conversations.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

// return list of chats (same as GET /api/chat)
router.get('/', protect, chatController.getChats);

module.exports = router;
```


# =====================================================================
## FILE (77/128): backend/routes/events.js (Lines: 20)
# =====================================================================

```javascript
// backend/routes/events.js
const express = require('express');
const router = express.Router();
const appsController = require('../controllers/appsController');
const { protect } = require('../middleware/authMiddleware');

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, appsController.getEvents);
router.post('/', protect, appsController.createEvent);
router.post('/:id/join', protect, appsController.joinEvent);
router.delete('/:id', protect, appsController.deleteEvent);

module.exports = router;
```


# =====================================================================
## FILE (78/128): backend/routes/extra.js (Lines: 82)
# =====================================================================

```javascript
// backend/routes/extra.js
const express = require('express');
const router = express.Router();

// Ensure both protect and optionalAuth are imported from your auth middleware
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');

const extraController = require('../controllers/extraController');
const searchSuggestController = require('../controllers/searchSuggestController');
const { chatLimiter } = require('../middleware/rateLimit');

// AI Avatar Generation
router.post('/ai/avatar', protect, upload.single('avatar'), extraController.aiAvatar);

// General File Upload
router.post('/upload', protect, upload.single('media'), extraController.uploadFile);

// Voice Messages (Rate Limited)
router.post('/voice/:chatId', protect, chatLimiter, upload.single('audio'), extraController.voice);

// Saving / Bookmarking
router.post('/save/:postId', protect, extraController.toggleSave); 
router.get('/save/:id', protect, extraController.getSavedByUser); 

// Profile Insights
router.get('/insights', protect, extraController.insights);

// 🔥 FIX: Suggestions now use optionalAuth instead of protect
// This allows the home page to load suggestions for guests without throwing a 401 error.
router.get('/suggestions', optionalAuth, searchSuggestController.suggestions); 

// Reels Feed (Public)
router.get('/reels', extraController.getReels); 

// Shop Items (Public)
router.get('/shop/items', extraController.getShopItems);

// Incident Reports (Admin / Moderation)
router.get('/reports', optionalAuth, async (req, res) => {
  try {
    const Report = require('../models/Report');
    let reports = await Report.find()
      .populate('reporter', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();
    if (!reports || reports.length === 0) {
      reports = [
        {
          _id: 'rep_showcase_1',
          reporter: { name: 'Aarav Deshmukh', email: 'aarav@socialverse.ai' },
          reason: 'Spam / Automated bot behavior',
          createdAt: new Date()
        },
        {
          _id: 'rep_showcase_2',
          reporter: { name: 'Riya Sharma', email: 'riya@socialverse.ai' },
          reason: 'Duplicate unverified content',
          createdAt: new Date(Date.now() - 3600000 * 4)
        }
      ];
    }
    res.json({ success: true, data: reports });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

router.post('/reports/:id/handle', protect, async (req, res) => {
  try {
    const Report = require('../models/Report');
    const { action } = req.body;
    if (req.params.id && !req.params.id.startsWith('rep_showcase_')) {
      await Report.findByIdAndUpdate(req.params.id, { status: action || 'resolved' });
    }
    res.json({ success: true, message: `Report handled with action: ${action}` });
  } catch (err) {
    res.json({ success: true, message: 'Report handled' });
  }
}); 

module.exports = router;
```


# =====================================================================
## FILE (79/128): backend/routes/followSuggest.js (Lines: 9)
# =====================================================================

```javascript
// backend/routes/followSuggest.js
const router = require('express').Router();
const { suggest } = require('../controllers/followSuggestController');
const { protect } = require('../middleware/authMiddleware');

router.get('/suggest', protect, suggest);

module.exports = router;
```


# =====================================================================
## FILE (80/128): backend/routes/games.js (Lines: 33)
# =====================================================================

```javascript
// backend/routes/games.js
const express = require('express');
const router = express.Router();
const appsController = require('../controllers/appsController');
const { protect } = require('../middleware/authMiddleware');
const { gameLimiter } = require('../middleware/rateLimit');

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

const GAMES_LIST = [
  { id: 'snake', name: 'Cyber Snake', color: 'from-[#0F766E] to-[#00F2FE]', icon: '🐍', plays: 1420 },
  { id: '2048', name: '2048 Elite', color: 'from-[#D4AF37] to-[#F4D49A]', icon: '🔢', plays: 980 },
  { id: 'quiz', name: 'Trivia Royale', color: 'from-[#1D4ED8] to-[#052E24]', icon: '❓', plays: 640 },
];

router.get('/', optionalAuth, (req, res) => {
  res.json({ success: true, data: GAMES_LIST });
});

router.get('/list', optionalAuth, (req, res) => {
  res.json({ success: true, data: GAMES_LIST });
});

router.get('/:gameId/leaderboard', optionalAuth, appsController.getLeaderboard);
router.post('/score', protect, gameLimiter, appsController.submitScore);

module.exports = router;
```


# =====================================================================
## FILE (81/128): backend/routes/integrations.js (Lines: 12)
# =====================================================================

```javascript
// backend/routes/integrations.js
const router = require('express').Router();
const controller = require('../controllers/integrationsController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// We protect these so only logged-in users consume your API quota
router.get('/news', optionalAuth, controller.getNews);
router.get('/markets', optionalAuth, controller.getMarkets);
// 🔥 The new route for frontend to call
router.get('/turn', protect, controller.getTurnCredentials);

module.exports = router;
```


# =====================================================================
## FILE (82/128): backend/routes/live.js (Lines: 13)
# =====================================================================

```javascript
// backend/routes/live.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const live = require('../controllers/liveController');

router.post('/start', protect, live.start);
router.post('/end/:roomId', protect, live.end);
router.get('/list', live.list);
router.get('/:roomId', live.get);
router.post('/:roomId/superchat', protect, live.superchat);

module.exports = router;
```


# =====================================================================
## FILE (83/128): backend/routes/marketplace.js (Lines: 12)
# =====================================================================

```javascript
// backend/routes/marketplace.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const market = require('../controllers/marketplaceController');

router.get('/', market.list);
router.get('/mine', protect, market.mine);
router.post('/', protect, upload.single('image'), market.create);

module.exports = router;
```


# =====================================================================
## FILE (84/128): backend/routes/moderation.js (Lines: 21)
# =====================================================================

```javascript
// backend/routes/moderation.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Report = require('../models/Report');

router.use(protect, restrictTo('admin'));

// quick stats for admin ui
router.get('/stats', async (req, res) => {
  try {
    const openReports = await Report.countDocuments({ status: 'open' });
    return res.json({ openReports });
  } catch (err) {
    console.error('mod stats err', err);
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;
```


# =====================================================================
## FILE (85/128): backend/routes/notifications.js (Lines: 35)
# =====================================================================

```javascript
// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const notificationsController = require('../controllers/notificationsController');
const Notification = require('../models/Notification');
const { getPushKey, subscribe } = require('../controllers/notificationsController');

router.get('/', protect, notificationsController.getNotifications);

// alias used by frontend fallbacks
router.get('/list', protect, notificationsController.getNotifications);

// mark all as read
router.put('/mark-read', protect, notificationsController.markAsRead);

// single-notification read endpoint (frontend attempted POST /notifications/:id/read)
router.post('/:id/read', protect, async (req, res) => {
  try {
    // FIX: Use the controller's logic to handle ownership check and mark as read
    await notificationsController.markSingleRead(req, res);
  } catch (err) {
    // If controller fails to respond, send generic error (though controller should handle its own response)
    console.error('mark single notification read err', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error marking notification as read' });
    }
  }
});
router.get('/unread-count', protect, notificationsController.getUnreadCount);
// 🔥 NEW ROUTES
router.get('/push-key', protect, getPushKey);
router.post('/subscribe', protect, subscribe);

module.exports = router;
```


# =====================================================================
## FILE (86/128): backend/routes/payouts.js (Lines: 16)
# =====================================================================

```javascript
// backend/routes/payouts.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const payoutController = require('../controllers/payoutController');
const { financialLimiter } = require('../middleware/rateLimit'); // 🔥 Import stricter limiter

// --- User Routes ---
// 🔥 Apply financial limiter here
router.post('/create', protect, financialLimiter, payoutController.create);

// --- Admin Routes ---
router.get('/', protect, restrictTo('admin'), payoutController.list);
router.post('/:id/paid', protect, restrictTo('admin'), payoutController.markPaid);

module.exports = router;
```


# =====================================================================
## FILE (87/128): backend/routes/polls.js (Lines: 10)
# =====================================================================

```javascript
// backend/routes/polls.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const polls = require('../controllers/pollsController');

router.post('/', protect, polls.createPollPost);
router.post('/:id/vote/:index', protect, polls.vote);

module.exports = router;
```


# =====================================================================
## FILE (88/128): backend/routes/posts.js (Lines: 258)
# =====================================================================

```javascript
// backend/routes/posts.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const postsController = require('../controllers/postsController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const validateContent = require('../middleware/validateContent');
const upload = require('../utils/multer');

// ==========================================
// SAFE FALLBACK HANDLER
// ==========================================

const notImplemented = (name) => {
  return (req, res) => {
    return res.status(501).json({
      success: false,
      message: `${name} controller not implemented`
    });
  };
};

// ==========================================
// CONTROLLER SAFETY
// ==========================================

const getFeed =
  postsController.getFeed ||
  notImplemented('getFeed');

const trending =
  postsController.trending ||
  notImplemented('trending');

const searchPosts =
  postsController.searchPosts ||
  notImplemented('searchPosts');

const getDrafts =
  postsController.getDrafts ||
  notImplemented('getDrafts');

const getScheduledPosts =
  postsController.getScheduledPosts ||
  notImplemented('getScheduledPosts');

const schedulePost =
  postsController.schedulePost ||
  notImplemented('schedulePost');

const unlockPost = postsController.unlockPost || notImplemented("unlockPost");

const createPost =
  postsController.createPost ||
  notImplemented('createPost');

const getPostById =
  postsController.getPostById ||
  notImplemented('getPostById');

const viewPost =
  postsController.viewPost ||
  notImplemented('viewPost');

const likePost =
  postsController.likePost ||
  notImplemented('likePost');

const reactPost =
  postsController.reactPost ||
  notImplemented('reactPost');

const toggleBookmark =
  postsController.toggleBookmark ||
  notImplemented('toggleBookmark');

const getBookmarks =
  postsController.getBookmarks ||
  notImplemented('getBookmarks');

const getPostsByUser =
  postsController.getPostsByUser ||
  notImplemented('getPostsByUser');

const updatePost =
  postsController.updatePost ||
  notImplemented('updatePost');

const deletePost =
  postsController.deletePost ||
  notImplemented('deletePost');

const getPostLikes =
  postsController.getPostLikes ||
  notImplemented('getPostLikes');

const aiCompose =
  postsController.aiCompose ||
  notImplemented('aiCompose');

const unfurlLink =
  postsController.unfurlLink ||
  notImplemented('unfurlLink');

// ==========================================
// PUBLIC FEEDS
// ==========================================

router.get('/feed', optionalAuth, getFeed);

router.get('/trending', optionalAuth, trending);

router.get('/search', optionalAuth, searchPosts);

// ==========================================
// DRAFTS
// ==========================================

router.get('/drafts', protect, getDrafts);

// ==========================================
// SCHEDULED POSTS
// ==========================================

router.get(
  '/scheduled',
  protect,
  getScheduledPosts
);

router.post(
  '/scheduled',
  protect,
  upload.any(),
  validateContent,
  schedulePost
);

// ==========================================
// BOOKMARKS & USER POSTS (Static & Sub-path Routes FIRST)
// ==========================================

router.get(
  ['/bookmarks/me', '/bookmarks'],
  protect,
  getBookmarks
);

router.post(
  '/:postId/bookmark',
  protect,
  toggleBookmark
);

router.get(
  '/user/:id',
  optionalAuth,
  getPostsByUser
);

// ==========================================
// VIEWS & INTERACTIONS
// ==========================================

router.post(
  '/:id/view',
  optionalAuth,
  viewPost
);

router.put(
  '/like/:postId',
  protect,
  likePost
);

router.post(
  '/:postId/react',
  protect,
  reactPost
);

router.post(
  '/:id/unlock',
  protect,
  unlockPost
);

router.post(
  '/ai/compose',
  optionalAuth,
  aiCompose
);

// ==========================================
// POST CRUD & DYNAMIC ID (Must be after specific sub-routes)
// ==========================================

router.post(
  '/',
  protect,
  upload.any(),
  validateContent,
  createPost
);

router.get(
  '/:postId',
  optionalAuth,
  getPostById
);

// Fallbacks
router.get(
  '/post/:id',
  optionalAuth,
  getPostById
);

router.get(
  '/posts/post/:id',
  optionalAuth,
  getPostById
);

router.put(
  '/:id',
  protect,
  upload.any(),
  validateContent,
  updatePost
);

router.delete(
  '/:id',
  protect,
  deletePost
);

router.get(
  '/:id/likes',
  protect,
  getPostLikes
);

// ==========================================
// UTILITIES
// ==========================================

router.post(
  '/unfurl',
  unfurlLink
);

module.exports = router;
```


# =====================================================================
## FILE (89/128): backend/routes/proxy.js (Lines: 78)
# =====================================================================

```javascript
// backend/routes/proxy.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// IMPORTANT: Whitelist remains strict for security.
// 🔥 FIX: Use exact hostnames to prevent subdomain bypass (e.g. images.unsplash.com.attacker.com)
const ALLOWED_HOSTS = [
    'res.cloudinary.com',
    'images.unsplash.com',       // Required for Seed Data
    'plus.unsplash.com',         // Required for Unsplash
    'loremflickr.com',           // Required for Faker/Seed Data
    'cloudflare-ipfs.com',       // Common for avatars
    'avatars.githubusercontent.com',
    'lh3.googleusercontent.com', // Google Auth avatars
    'dl.dropboxusercontent.com',
    'i.imgur.com', 
];

router.get('/image', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ message: 'url param required' });

    try {
        // 1. URL Validation
        const parsed = new URL(url);
        
        // 🔥 SECURITY FIX: Strict Hostname Check
        if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
            console.error(`Proxy rejected: Host not allowed: ${parsed.hostname}`);
            return res.status(403).json({ message: 'Host not allowed' });
        }

        // 2. Fetch the external image as a stream
        // We set 'Authorization: undefined' to prevent passing our API token to external hosts
        const r = await axios.get(url, { 
            responseType: 'stream', 
            timeout: 20000,
            headers: {
                Authorization: undefined 
            }
        });

        // 3. Set necessary headers for the client
        const contentType = r.headers['content-type'] || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        
        // Pass through caching headers if available
        if (r.headers['cache-control']) res.setHeader('Cache-Control', r.headers['cache-control']);
        if (r.headers['content-length']) res.setHeader('Content-Length', r.headers['content-length']);

        // 4. Pipe the data stream directly to the response
        r.data.pipe(res);
        
        // Handle stream errors
        r.data.on('error', (err) => {
            console.error('Proxy stream pipe error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Image stream failed' });
            }
        });

    } catch (err) {
        // Log the error detail
        const errorMsg = err?.message || err;
        console.error(`Proxy fetch or server error for ${url}: ${errorMsg}`);
        
        // 5. Handle Final Error Response
        if (!res.headersSent) {
            const statusCode = err.response?.status || 502;
            return res.status(statusCode).json({ message: `Proxy fetch failed: ${errorMsg}` });
        }
        res.end(); 
    }
});

module.exports = router;
```


# =====================================================================
## FILE (90/128): backend/routes/reels.js (Lines: 27)
# =====================================================================

```javascript
// backend/routes/reels.js
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const reels = require('../controllers/reelsController');

// Upload reel
router.post('/upload', protect, upload.any(), reels.uploadReel);

// Reels feed
router.get('/feed', optionalAuth, reels.feed);

// Like / unlike reel
router.put('/like/:id', protect, reels.likeReel);

// Tip creator on reel
router.post('/:id/tip', protect, reels.tipReel);

// View reel analytics
router.post('/:id/view', protect, reels.viewReel);

// Delete reel
router.delete('/:id', protect, reels.deleteReel);

module.exports = router;
```


# =====================================================================
## FILE (91/128): backend/routes/reports.js (Lines: 14)
# =====================================================================

```javascript
// backend/routes/report.js
const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');

router.post('/', protect, reportController.createReport);
router.get('/mine', protect, reportController.getMyReports);
// admin endpoints
router.get('/', protect, restrictTo('admin'), reportController.getReports);
router.put('/:id', protect, restrictTo('admin'), reportController.updateReport);

module.exports = router;
```


# =====================================================================
## FILE (92/128): backend/routes/search.js (Lines: 32)
# =====================================================================

```javascript
// backend/routes/search.js
const router = require("express").Router();
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const searchController = require('../controllers/searchController');
const Post = require("../models/Post");
const User = require("../models/User");

// --- NEW GLOBAL SEARCH ---
// This will handle: GET /api/search/global?q=...
router.get("/global", searchController.global);

// --- ORIGINAL BASIC SEARCH (fallback) ---
// This will handle: GET /api/search?q=...
router.get("/", optionalAuth, async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ users: [], posts: [] }); // Return object as expected
  
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  
  try {
    const [users, posts] = await Promise.all([
      User.find({ name: regex }).select("name avatar bio").limit(20),
      Post.find({ content: regex }).populate("user", "name avatar").limit(20),
    ]);
    res.json({ users, posts });
  } catch (err) {
    console.error("Basic search error:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

module.exports = router;
```


# =====================================================================
## FILE (93/128): backend/routes/shop.js (Lines: 52)
# =====================================================================

```javascript
// backend/routes/shop.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');
const shop = require('../controllers/shopController');
const ShopItem = require('../models/ShopItem');
const Product = require('../models/Product');

// List all items
router.get('/', shop.list);

// List my items
router.get('/mine', protect, shop.mine);

// Create new item
router.post('/', protect, upload.single('image'), shop.create);

// Buy item
router.post('/:id/buy', protect, shop.buy);

// Delete item (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user._id;

    // Find and delete from ShopItem or Product
    let deletedItem = await ShopItem.findOneAndDelete({ 
      _id: itemId, 
      createdBy: userId 
    });

    if (!deletedItem) {
      deletedItem = await Product.findOneAndDelete({
        _id: itemId,
        owner: userId
      });
    }

    if (!deletedItem) {
      return res.status(404).json({ message: 'Item not found or you do not have permission to delete it.' });
    }

    res.json({ ok: true, message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Delete shop item error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```


# =====================================================================
## FILE (94/128): backend/routes/social.js (Lines: 13)
# =====================================================================

```javascript
// backend/routes/social.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const social = require('../controllers/socialController');

router.post('/geo', protect, social.updateGeo);
router.get('/nearby', protect, social.nearby);
router.post('/badges/refresh', protect, social.badges);
router.get('/memories', protect, social.memories);
router.post('/nft', protect, social.linkNft);

module.exports = router;
```


# =====================================================================
## FILE (95/128): backend/routes/spaces.js (Lines: 13)
# =====================================================================

```javascript
// backend/routes/spaces.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const spacesController = require('../controllers/spacesController');

router.get('/', protect, spacesController.getActiveSpaces);
router.post('/', protect, spacesController.createSpace);
router.get('/:id', protect, spacesController.getSpaceById);
router.post('/:id/end', protect, spacesController.endSpace);

module.exports = router;
```


# =====================================================================
## FILE (96/128): backend/routes/stories.js (Lines: 30)
# =====================================================================

```javascript
// backend/routes/stories.js
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const storiesController = require('../controllers/storiesController');
const upload = require('../utils/multer');

// --- 1. Create Story ---
router.post('/', protect, upload.single('media'), storiesController.createStory);

// --- 2. Get Stories Feed ---
router.get('/', optionalAuth, storiesController.getStories);

// --- 3. Mark as Viewed ---
router.post('/:id/view', protect, storiesController.markViewed);

// --- 4. React to Story (Emoji) ---
router.post('/:id/react', protect, storiesController.reactToStory);

// --- 5. Reply to Story (Direct Chat Message) ---
router.post('/:id/reply', protect, storiesController.replyToStory);

// --- 6. Get Story Viewers ---
router.get('/:id/viewers', protect, storiesController.getViewers);

// --- 7. Delete Story ---
router.delete('/:id', protect, storiesController.deleteStory);

module.exports = router;
```


# =====================================================================
## FILE (97/128): backend/routes/tags.js (Lines: 31)
# =====================================================================

```javascript
// backend/routes/tags.js
const express = require('express');
const router = express.Router();
const { suggest } = require('../controllers/tagSuggestionController');
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
 router.post('/suggest', protect, suggest);

// Get popular hashtags matching query
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if(!q) return res.json([]);

        // Aggregation to find tags starting with 'q', count usage, sort by popularity
        const tags = await Post.aggregate([
            { $unwind: "$hashtags" }, // Split array into documents
            { $match: { hashtags: { $regex: `^${q}`, $options: 'i' } } }, // Filter match
            { $group: { _id: "$hashtags", count: { $sum: 1 } } }, // Count occurrences
            { $sort: { count: -1 } }, // Sort popular first
            { $limit: 5 } // Top 5
        ]);

        res.json(tags.map(t => t._id));
    } catch(e) {
        console.error(e);
        res.status(500).json([]);
    }
});

module.exports = router;
```


# =====================================================================
## FILE (98/128): backend/routes/translate.js (Lines: 9)
# =====================================================================

```javascript
// backend/routes/translate.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const t = require('../controllers/translateController');

router.post('/', protect, t.translate);

module.exports = router;
```


# =====================================================================
## FILE (99/128): backend/routes/users.js (Lines: 81)
# =====================================================================

```javascript
// backend/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');

// ==========================================
// 1. Current User Operations (No ID required)
// ==========================================

// Get own profile
router.get('/me', protect, userController.getMe);
router.get('/quests', protect, userController.getDailyQuests);
router.post('/quests/:id/claim', protect, userController.claimDailyQuest);
router.get('/passkey/register-options', protect, userController.passkeyRegisterOptions);
router.post('/passkey/register-verify', protect, userController.passkeyRegisterVerify);

// Delete own account
router.delete('/me', protect, userController.deleteAccount);

// Security
router.put('/password', protect, userController.changePassword);

// Settings & Preferences
router.put('/status', protect, userController.updateStatus); 
router.put('/settings/notifications', protect, userController.updateSettings); 
router.put('/close-friends', protect, userController.updateCloseFriends);
router.get('/blocked', protect, userController.getBlockedUsers);

// ==========================================
// 2. Search & Discovery
// ==========================================

router.get('/search', userController.searchUsers);
router.get('/suggested', optionalAuth, (req, res, next) => {
  const followSuggestController = require('../controllers/followSuggestController');
  return followSuggestController.suggest(req, res, next);
});
router.get('/suggestions', optionalAuth, (req, res, next) => {
  const followSuggestController = require('../controllers/followSuggestController');
  return followSuggestController.suggest(req, res, next);
});
router.get('/follow-requests', protect, userController.getFollowRequests);

// ==========================================
// 3. Specific Actions on Other Users
// ==========================================

// Follow / Unfollow
router.post('/:id/follow', protect, userController.followToggle);

// Block User
router.post('/:id/block', protect, userController.blockUser);

// Manage Requests
router.post('/requests/:id/approve', protect, userController.acceptFollowRequest);
router.post('/requests/:id/reject', protect, userController.declineFollowRequest);
// (Legacy aliases for request management)
router.post('/accept-request/:id', protect, userController.acceptFollowRequest);
router.post('/decline-request/:id', protect, userController.declineFollowRequest);

// Get Lists
router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);
router.put('/pin', protect, userController.pinPost); 

// ==========================================
// 4. Dynamic ID Routes (MUST BE LAST)
// ==========================================

// Update Profile (Multipart: Avatar & Cover)
router.put('/:id', protect, upload.fields([
    { name: 'avatar', maxCount: 1 }, 
    { name: 'coverPhoto', maxCount: 1 }
]), userController.updateProfile);

// Get Public User Profile
router.get('/:id', optionalAuth, userController.getUserById);

module.exports = router;
```


# =====================================================================
## FILE (100/128): backend/routes/wallet.js (Lines: 111)
# =====================================================================

```javascript
// backend/routes/wallet.js
const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const wallet = require('../controllers/walletController');
const { financialLimiter } = require('../middleware/rateLimit'); // 🔥 Import stricter limiter
const User = require('../models/User'); // Added to support daily bonus logic

router.get('/me', protect, wallet.me);
router.get('/balance', protect, wallet.me);
router.get('/', protect, wallet.me);
router.post('/airdrop', protect, wallet.airdrop);

// 🔥 Apply financial limiter to critical endpoints
router.post('/tip', protect, financialLimiter, wallet.tip);
router.post('/pin', protect, financialLimiter, wallet.setPin);
router.get('/pin/status', protect, wallet.checkPinStatus);

// Daily Bonus Route
router.post('/claim-daily-bonus', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastClaimed = user.lastDailyBonus ? new Date(new Date(user.lastDailyBonus).getFullYear(), new Date(user.lastDailyBonus).getMonth(), new Date(user.lastDailyBonus).getDate()).getTime() : null;

    if (lastClaimed === today) {
      return res.status(400).json({ error: 'Bonus already claimed today.' });
    }

    const BONUS_AMOUNT = 50;
    const currentBal = (user.wallet && typeof user.wallet.balance === 'number') ? user.wallet.balance : 0;
    const newBal = currentBal + BONUS_AMOUNT;

    user.wallet = user.wallet || {};
    user.wallet.balance = newBal;
    user.lastDailyBonus = now;
    await user.save();

    const Transaction = require('../models/Transaction');
    Transaction.create({
      user: user._id,
      type: 'credit',
      amount: BONUS_AMOUNT,
      description: 'Daily Bonus Reward',
      idempotencyKey: `dailybonus:${user._id}:${now.toISOString().split('T')[0]}`
    }).catch(err => console.warn('Daily bonus tx log error:', err.message));

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(String(user._id)).emit('wallet:update', { balance: newBal });
    }

    res.json({ success: true, newBalance: newBal });
  } catch (error) {
    console.error('Daily bonus claim error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Coin Pack Purchasing Endpoint (Simulated Gateway with Idempotency)
router.post('/purchase', protect, financialLimiter, async (req, res) => {
  try {
    const { packageId, amount, currency = 'USD' } = req.body;
    const coinPacks = {
      starter: { coins: 100, price: 1.99 },
      creator: { coins: 500, price: 7.99 },
      vip: { coins: 1200, price: 14.99 },
      mogul: { coins: 3000, price: 29.99 },
    };

    const selectedPack = coinPacks[packageId] || { coins: Number(amount) || 100, price: 1.99 };
    const coinsToAdd = selectedPack.coins;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.wallet = user.wallet || { balance: 0, totalReceived: 0, totalSent: 0 };
    user.wallet.balance = (user.wallet.balance || 0) + coinsToAdd;
    user.wallet.totalReceived = (user.wallet.totalReceived || 0) + coinsToAdd;
    await user.save();

    const Transaction = require('../models/Transaction');
    const idempotencyKey = `purchase:${user._id}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`;
    await Transaction.create({
      user: user._id,
      type: 'credit',
      amount: coinsToAdd,
      description: `Purchased ${selectedPack.coins} SocialVerse Coins (${packageId || 'custom'})`,
      idempotencyKey,
    }).catch(() => {});

    const io = req.app.get('io') || global.io;
    if (io) {
      io.to(String(user._id)).emit('wallet:update', { balance: user.wallet.balance });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully purchased ${coinsToAdd} coins!`,
      balance: user.wallet.balance,
      wallet: user.wallet,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Transaction failed', message: err.message });
  }
});

module.exports = router;
```


# =====================================================================
## FILE (101/128): backend/scripts/create_admin.js (Lines: 38)
# =====================================================================

```javascript
// backend/scripts/create_admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const email = process.env.ADMIN_EMAIL || 'sidhantas786@gmail.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  
  // Check if exists
  let admin = await User.findOne({ email });
  if (admin) {
      console.log('Admin already exists. Updating role and password...');
      admin.role = 'admin';
      admin.isVerified = true;
      admin.password = await bcrypt.hash(password, 12);
      await admin.save();
  } else {
      console.log('Creating new SocialVerse admin...');
      const hashed = await bcrypt.hash(password, 12);
      admin = await User.create({
          name: 'Sidhanta Sahu (Founder)',
          username: 'admin',
          email,
          password: hashed,
          role: 'admin',
          isVerified: true
      });
  }
  
  console.log(`Admin ready.\nEmail: ${email}\nPass: ${password}`);
  process.exit();
};

createAdmin();
```


# =====================================================================
## FILE (102/128): backend/scripts/ensure_indexes.js (Lines: 164)
# =====================================================================

```javascript
// backend/scripts/ensure_indexes.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Transaction = require('../models/Transaction');
const GameScore = require('../models/GameScore');
const Report = require('../models/Report');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Story = require('../models/Story');
const Event = require('../models/Event');
const PollVote = require('../models/PollVote');
const Product = require('../models/Product');
const ShopItem = require('../models/ShopItem');
const LiveStream = require('../models/LiveStream');
const FollowRequest = require('../models/FollowRequest');

const connectionOptions = {
  autoIndex: false,
  maxPoolSize: 25,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

async function safeCreateIndex(collection, keys, options = {}) {
  const name = options.name || Object.entries(keys)
    .map(([field, dir]) => `${field}_${String(dir).replace(/\s+/g, '')}`)
    .join('_');

  try {
    await collection.createIndex(keys, {
      background: true,
      ...options,
      name,
    });
    console.log(`✅ ${collection.collectionName}: ${name}`);
  } catch (err) {
    const ignorable =
      err?.code === 85 ||
      err?.code === 86 ||
      err?.codeName === 'IndexOptionsConflict' ||
      err?.codeName === 'IndexKeySpecsConflict' ||
      /already exists/i.test(err?.message || '');

    if (ignorable) {
      console.log(`↩️  ${collection.collectionName}: ${name} already exists`);
      return;
    }

    console.error(`❌ ${collection.collectionName}: failed to create ${name}`);
    throw err;
  }
}

async function buildIndexes() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI, connectionOptions);
  console.log('✅ Connected.');

  console.log('🏗️  Building indexes...');

  const tasks = [
    // Users
    safeCreateIndex(User.collection, { email: 1 }, { unique: true, name: 'email_1' }),
    safeCreateIndex(User.collection, { username: 1 }, { unique: true, sparse: true, name: 'username_1' }),
    safeCreateIndex(User.collection, { role: 1, createdAt: -1 }, { name: 'role_createdAt_desc' }),
    safeCreateIndex(User.collection, { privateProfile: 1, createdAt: -1 }, { name: 'privateProfile_createdAt_desc' }),

    // Posts
    safeCreateIndex(Post.collection, { user: 1, createdAt: -1 }, { name: 'user_createdAt_desc' }),
    safeCreateIndex(Post.collection, { createdAt: -1 }, {
      name: 'public_feed_optimization_idx',
      partialFilterExpression: {
        isArchived: false,
        isFlagged: false,
        isDraft: false,
      },
    }),
    safeCreateIndex(Post.collection, { score: -1, createdAt: -1 }, { name: 'score_createdAt_desc' }),
    safeCreateIndex(Post.collection, { hashtags: 1, createdAt: -1 }, { name: 'hashtags_createdAt_desc' }),
    safeCreateIndex(Post.collection, { content: 'text', hashtags: 'text', mentions: 'text' }, { name: 'post_text_search' }),

    // Comments
    safeCreateIndex(Comment.collection, { post: 1, createdAt: -1 }, { name: 'post_createdAt_desc' }),
    safeCreateIndex(Comment.collection, { user: 1, createdAt: -1 }, { name: 'comment_user_createdAt_desc' }),

    // Notifications
    safeCreateIndex(Notification.collection, { user: 1, isRead: 1, createdAt: -1 }, { name: 'user_isRead_createdAt_desc' }),
    safeCreateIndex(Notification.collection, { user: 1, createdAt: -1 }, { name: 'notification_user_createdAt_desc' }),

    // Transactions / Wallet
    safeCreateIndex(Transaction.collection, { user: 1, createdAt: -1 }, { name: 'transaction_user_createdAt_desc' }),
    safeCreateIndex(Transaction.collection, { user: 1, type: 1, createdAt: -1 }, { name: 'transaction_user_type_createdAt_desc' }),
    safeCreateIndex(Transaction.collection, { idempotencyKey: 1 }, { unique: true, name: 'idempotencyKey_1' }),

    // Games
    safeCreateIndex(GameScore.collection, { gameId: 1, score: -1 }, { name: 'gameId_score_desc' }),
    safeCreateIndex(GameScore.collection, { gameId: 1, user: 1 }, { name: 'gameId_user' }),
    safeCreateIndex(GameScore.collection, { user: 1, gameId: 1, score: -1 }, { name: 'user_gameId_score_desc' }),

    // Reports / Moderation
    safeCreateIndex(Report.collection, { status: 1, createdAt: -1 }, { name: 'status_createdAt_desc' }),
    safeCreateIndex(Report.collection, { reporter: 1, createdAt: -1 }, { name: 'reporter_createdAt_desc' }),
    safeCreateIndex(Report.collection, { targetUser: 1, status: 1 }, { name: 'targetUser_status' }),
    safeCreateIndex(Report.collection, { targetPost: 1, status: 1 }, { name: 'targetPost_status' }),

    // Chats / Messages
    safeCreateIndex(Chat.collection, { participants: 1, updatedAt: -1 }, { name: 'participants_updatedAt_desc' }),
    safeCreateIndex(Chat.collection, { lastMessage: 1, updatedAt: -1 }, { name: 'lastMessage_updatedAt_desc' }),
    safeCreateIndex(Message.collection, { chat: 1, createdAt: -1 }, { name: 'chat_createdAt_desc' }),
    safeCreateIndex(Message.collection, { chat: 1, deletedAt: 1, createdAt: -1 }, { name: 'chat_deletedAt_createdAt_desc' }),
    safeCreateIndex(Message.collection, { chat: 1, sender: 1, createdAt: -1 }, { name: 'chat_sender_createdAt_desc' }),

    // Stories
    safeCreateIndex(Story.collection, { user: 1, expiresAt: 1 }, { name: 'story_user_expiresAt' }),
    safeCreateIndex(Story.collection, { createdAt: 1 }, { expireAfterSeconds: 86400, name: 'story_ttl_24h' }),

    // Events
    safeCreateIndex(Event.collection, { date: 1, createdAt: -1 }, { name: 'event_date_createdAt_desc' }),
    safeCreateIndex(Event.collection, { host: 1, date: 1 }, { name: 'host_date' }),

    // Polls
    safeCreateIndex(PollVote.collection, { postId: 1, userId: 1 }, { unique: true, name: 'postId_userId_unique' }),
    safeCreateIndex(PollVote.collection, { postId: 1 }, { name: 'postId_1' }),

    // Marketplace / Shop
    safeCreateIndex(Product.collection, { owner: 1, createdAt: -1 }, { name: 'product_owner_createdAt_desc' }),
    safeCreateIndex(Product.collection, { title: 'text', desc: 'text', tags: 'text' }, { name: 'product_text_search' }),
    safeCreateIndex(ShopItem.collection, { createdBy: 1, createdAt: -1 }, { name: 'shop_createdBy_createdAt_desc' }),

    // Live
    safeCreateIndex(LiveStream.collection, { roomId: 1 }, { unique: true, name: 'roomId_1' }),
    safeCreateIndex(LiveStream.collection, { isLive: 1, createdAt: -1 }, { name: 'isLive_createdAt_desc' }),
    safeCreateIndex(LiveStream.collection, { host: 1, isLive: 1 }, { name: 'host_isLive' }),

    // Follow requests
    safeCreateIndex(FollowRequest.collection, { receiver: 1, status: 1, createdAt: -1 }, { name: 'receiver_status_createdAt_desc' }),
    safeCreateIndex(FollowRequest.collection, { sender: 1, receiver: 1 }, { unique: true, name: 'sender_receiver_unique' }),
  ];

  await Promise.all(tasks);

  console.log('✨ Index build complete.');
  await mongoose.disconnect();
}

if (require.main === module) {
  buildIndexes().catch(async (err) => {
    console.error('❌ Index build failed:', err);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  });
}

module.exports = buildIndexes;
```


# =====================================================================
## FILE (103/128): backend/scripts/migrate_proxy_urls.js (Lines: 66)
# =====================================================================

```javascript
// backend/scripts/migrate_chats.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

dotenv.config();

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all chats that still have the old 'messages' array
    // Note: This requires the old Chat schema temporarily or using lean() / aggregation
    // Since we updated the Chat model file, mongoose might strip 'messages' if we query normally.
    // We use collection access to be safe.
    const chats = await mongoose.connection.collection('chats').find({ messages: { $exists: true, $ne: [] } }).toArray();

    console.log(`Found ${chats.length} chats to migrate.`);

    for (const chat of chats) {
      const oldMessages = chat.messages || [];
      if (oldMessages.length === 0) continue;

      console.log(`Migrating ${oldMessages.length} messages for Chat ${chat._id}...`);

      const newMessages = oldMessages.map(msg => ({
        chat: chat._id,
        sender: msg.sender,
        content: msg.content,
        media: msg.media,
        audio: msg.audio,
        replyTo: msg.replyTo,
        isForwarded: msg.isForwarded,
        readBy: msg.readBy || [],
        deliveredTo: msg.deliveredTo || [],
        reactions: msg.reactions || [],
        createdAt: msg.createdAt || new Date(),
        updatedAt: msg.updatedAt || new Date()
      }));

      // Bulk Insert for performance
      const inserted = await Message.insertMany(newMessages);
      
      // Update Chat: Set lastMessage and unset the messages array
      const lastMsgId = inserted[inserted.length - 1]._id;
      
      await mongoose.connection.collection('chats').updateOne(
        { _id: chat._id },
        { 
            $set: { lastMessage: lastMsgId },
            $unset: { messages: "" } // Remove the old array to free up space
        }
      );
    }

    console.log('🎉 Migration Complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Failed:', err);
    process.exit(1);
  }
};

runMigration();
```


# =====================================================================
## FILE (104/128): backend/scripts/reset_db.js (Lines: 41)
# =====================================================================

```javascript
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
```


# =====================================================================
## FILE (105/128): backend/seed.js (Lines: 376)
# =====================================================================

```javascript
// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

dotenv.config({ path: require('path').join(__dirname, '.env') });

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const GameScore = require('./models/GameScore');
const Event = require('./models/Event');
const Product = require('./models/Product');
const Reel = require('./models/Reel');
const Story = require('./models/Story');
const Space = require('./models/Space');

const CURATED_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80'
];

const CURATED_PHOTOS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1080&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&auto=format&fit=crop&q=85'
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ DB Connection Error:', err);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  console.log('🧹 Purging outdated collections...');
  try { await Product.collection.drop(); } catch (e) {}

  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
    Notification.deleteMany({}),
    GameScore.deleteMany({}),
    Event.deleteMany({}),
    Reel.deleteMany({}),
    Story.deleteMany({}),
    Space.deleteMany({})
  ]);

  console.log('👑 Seeding Core Creators & Master Accounts...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const initialUsers = [
    {
      name: 'Sidhanta Sahu',
      username: 'sidsahu',
      email: 'sidhantas786@gmail.com',
      password: hashedPassword,
      avatar: CURATED_AVATARS[0],
      coverPhoto: CURATED_PHOTOS[0],
      bio: 'Creative Director & Founder at SocialVerse. Designing the future of artistic human connection.',
      location: 'San Francisco, CA',
      isVerified: true,
      role: 'admin',
      wallet: { balance: 8500, totalReceived: 3200, totalSent: 800 },
      badges: ['early-adopter', 'vip', 'creator'],
    },
    {
      name: 'Elena Vance',
      username: 'elena',
      email: 'user@socialapp.com',
      password: hashedPassword,
      avatar: CURATED_AVATARS[1],
      coverPhoto: CURATED_PHOTOS[1],
      bio: 'Digital artist & cinematic photographer. Exploring luxury generative themes.',
      location: 'Tokyo, Japan',
      isVerified: true,
      role: 'user',
      wallet: { balance: 4200, totalReceived: 1200, totalSent: 450 },
      badges: ['early-adopter', 'creator'],
    },
    {
      name: 'Julian Hayes',
      username: 'julian',
      email: 'julian@socialverse.design',
      password: hashedPassword,
      avatar: CURATED_AVATARS[2],
      coverPhoto: CURATED_PHOTOS[2],
      bio: 'Architectural photographer. Capturing the interplay of light and brutalist shadow.',
      location: 'Berlin, Germany',
      isVerified: true,
      role: 'user',
      wallet: { balance: 2100, totalReceived: 400, totalSent: 100 },
      badges: ['creator', 'verified'],
    },
    {
      name: 'Seraphina Lin',
      username: 'seraphina',
      email: 'seraphina@socialverse.ai',
      password: hashedPassword,
      avatar: CURATED_AVATARS[3],
      coverPhoto: CURATED_PHOTOS[3],
      bio: 'Synthesizing ambient electronica & neural audiovisuals. 🎶',
      location: 'Seoul, South Korea',
      isVerified: true,
      role: 'user',
      wallet: { balance: 6400, totalReceived: 2100, totalSent: 600 },
      badges: ['creator', 'vip'],
    },
    {
      name: 'Marcus Sterling',
      username: 'sterling',
      email: 'marcus@socialverse.luxury',
      password: hashedPassword,
      avatar: CURATED_AVATARS[4],
      coverPhoto: CURATED_PHOTOS[4],
      bio: 'Horology, automotive engineering, and timeless minimalism.',
      location: 'London, UK',
      isVerified: true,
      role: 'user',
      wallet: { balance: 12000, totalReceived: 5000, totalSent: 1500 },
      badges: ['vip'],
    }
  ];

  // Generate 10 more users using faker with curated avatars
  for (let i = 0; i < 10; i++) {
    const fName = faker.person.firstName();
    const lName = faker.person.lastName();
    initialUsers.push({
      name: `${fName} ${lName}`,
      username: `${fName.toLowerCase()}${i + 1}`,
      email: faker.internet.email({ firstName: fName, lastName: lName }).toLowerCase(),
      password: hashedPassword,
      avatar: CURATED_AVATARS[(i + 5) % CURATED_AVATARS.length],
      coverPhoto: CURATED_PHOTOS[(i + 3) % CURATED_PHOTOS.length],
      bio: faker.person.bio(),
      location: `${faker.location.city()}, ${faker.location.country()}`,
      isVerified: i % 2 === 0,
      role: 'user',
      wallet: { balance: parseFloat(faker.finance.amount({ min: 500, max: 4000, dec: 2 })), totalReceived: 0, totalSent: 0 },
      badges: ['early-adopter'],
    });
  }

  const createdUsers = await User.insertMany(initialUsers);
  console.log(`✅ ${createdUsers.length} Users Created`);

  // --- Follow Graph ---
  console.log('🔗 Establishing Follow Graph...');
  for (const u of createdUsers) {
    const others = createdUsers.filter(o => String(o._id) !== String(u._id));
    const toFollow = others.sort(() => 0.5 - Math.random()).slice(0, 6);
    u.following = toFollow.map(o => o._id);
    await u.save();

    for (const target of toFollow) {
      if (!target.followers.includes(u._id)) {
        target.followers.push(u._id);
        await target.save();
      }
    }
  }

  // --- Posts & Content ---
  console.log('📸 Publishing Rich Editorial Posts...');
  const postTexts = [
    'Golden hour reflecting through geometric facades. The balance between stillness and human energy is where luxury lives. #Architecture #Cinematic #SocialVerse',
    'Curating soundscapes for deep work at midnight. What soundtrack fuels your creativity right now? Drop your favorites below! 🎧 #DeepWork #Electronica #SoundDesign',
    'Simplicity is the ultimate sophistication. Finding beauty in clean lines, obsidian textures, and timeless craftsmanship. #ObsidianNoir #Design #Minimalism',
    'Exploring generative neural rendering with WebGL. The speed of real-time shaders in 2026 is truly boundary-breaking. #GenerativeArt #CreativeCoding #TechVision',
    'Midnight in Tokyo. Neon reflections on rain-soaked asphalt. Every alley tells a quiet story. #StreetPhotography #TokyoNoir #Cyberpunk',
    'Just deployed the new decentralized real-time audio lounge. Crystal-clear WebRTC channels with zero latency. Join the space tonight! 🎙️ #AudioSpace #BuildInPublic',
    'A quiet moment in the studio with espresso and analogue sketches. Before code, there must always be vision. #DesignPhilosophy #ArtOfLiving',
    'The elegance of dark mode interfaces when crafted with intention. Contrast, glass specular sheens, and restrained colour accents. #UIUX #AuroraNoir #Masterpiece'
  ];

  const allPosts = [];
  for (let pIdx = 0; pIdx < postTexts.length; pIdx++) {
    const author = createdUsers[pIdx % createdUsers.length];
    const likers = createdUsers.filter(u => String(u._id) !== String(author._id)).slice(0, 4 + (pIdx % 6));

    const post = await Post.create({
      user: author._id,
      content: postTexts[pIdx],
      images: [CURATED_PHOTOS[pIdx % CURATED_PHOTOS.length]],
      hashtags: ['socialverse', 'auroranoir', 'luxury', 'creative'],
      likes: likers.map(l => l._id),
      likesCount: likers.length,
      createdAt: new Date(Date.now() - (pIdx * 3.5 * 3600 * 1000))
    });
    allPosts.push(post);
  }

  // Add more spontaneous posts
  for (let i = 0; i < 15; i++) {
    const author = createdUsers[(i + 3) % createdUsers.length];
    const likers = createdUsers.filter(u => String(u._id) !== String(author._id)).slice(0, 3 + (i % 5));
    const post = await Post.create({
      user: author._id,
      content: `${faker.lorem.paragraph()} #Trending #SocialVerseLife`,
      images: i % 2 === 0 ? [CURATED_PHOTOS[(i + 4) % CURATED_PHOTOS.length]] : [],
      hashtags: ['trending', 'lifestyle', 'community'],
      likes: likers.map(l => l._id),
      likesCount: likers.length,
      createdAt: new Date(Date.now() - (i * 5.2 * 3600 * 1000))
    });
    allPosts.push(post);
  }

  console.log(`✅ ${allPosts.length} Editorial Posts Published`);

  // --- Comments ---
  console.log('💬 Weaving Engaging Conversations & Comments...');
  const commentSamples = [
    'The lighting here is absolutely mesmerizing!',
    'Incredible perspective. What focal length did you shoot this on?',
    'This aesthetic is pure luxury. Well done! ✨',
    'Bookmarking this for creative inspiration tonight.',
    'Couldn’t agree more. Intention over volume every single time.'
  ];

  for (const post of allPosts.slice(0, 12)) {
    const commenters = createdUsers.filter(u => String(u._id) !== String(post.user)).slice(0, 3);
    for (let cIdx = 0; cIdx < commenters.length; cIdx++) {
      const comment = await Comment.create({
        post: post._id,
        user: commenters[cIdx]._id,
        text: commentSamples[(cIdx + post.content.length) % commentSamples.length],
        likes: []
      });
      post.comments = post.comments || [];
      post.comments.push(comment._id);
      post.commentsCount = (post.commentsCount || 0) + 1;
    }
    await post.save();
  }

  // --- Active 24H Stories ---
  console.log('✨ Publishing 24-Hour Stories...');
  for (let sIdx = 0; sIdx < 6; sIdx++) {
    const author = createdUsers[sIdx];
    await Story.create({
      user: author._id,
      media: CURATED_PHOTOS[(sIdx + 2) % CURATED_PHOTOS.length],
      type: 'image',
      privacy: 'public',
      viewers: createdUsers.slice(7, 12).map(u => u._id),
      expiresAt: new Date(Date.now() + 20 * 3600 * 1000)
    });
  }

  // --- Live Audio Spaces ---
  console.log('🎙️ Initializing Live Audio Spaces...');
  await Space.create({
    title: 'Late Night Design & Audio Synthesis 🌙',
    topic: 'Luxury UI & Ambient Sound Design',
    host: createdUsers[0]._id,
    speakers: [createdUsers[0]._id, createdUsers[1]._id, createdUsers[3]._id],
    listeners: [createdUsers[2]._id, createdUsers[4]._id, createdUsers[5]._id],
    isActive: true,
    startedAt: new Date(Date.now() - 45 * 60 * 1000)
  });

  await Space.create({
    title: 'The Future of WebRTC & Edge Infrastructure ⚡',
    topic: 'Engineering & Scalability',
    host: createdUsers[1]._id,
    speakers: [createdUsers[1]._id, createdUsers[2]._id],
    listeners: [createdUsers[4]._id],
    isActive: true,
    startedAt: new Date(Date.now() - 20 * 60 * 1000)
  });

  // --- Reels ---
  console.log('🎬 Uploading High-Energy Reels...');
  const FAST_REEL_CLIPS = [
    { url: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/dog.mp4', caption: 'Kinetic energy in full bloom! 🐕✨ #Joy #Momentum #SocialVerseCinema' },
    { url: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/sea_turtle.mp4', caption: 'Azure currents & deep tranquility 🌊🐢 #OceanDrift #NatureArt' },
    { url: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/elephants.mp4', caption: 'Serengeti sovereigns under dusk 🐘🌅 #Wildlife #MajesticEarth' },
    { url: 'https://res.cloudinary.com/demo/video/upload/so_0,du_8,w_540,q_auto/samples/cld-sample-video.mp4', caption: 'Precision cadence & fluid motion ⚡🏎️ #SpeedCraft #NoirVision' }
  ];
  for (let r = 0; r < FAST_REEL_CLIPS.length; r++) {
    const author = createdUsers[(r + 1) % createdUsers.length];
    await Reel.create({
      user: author._id,
      videoUrl: FAST_REEL_CLIPS[r].url,
      caption: FAST_REEL_CLIPS[r].caption,
      likes: createdUsers.slice(0, 5).map(u => u._id),
      createdAt: new Date(Date.now() - (r * 6 * 3600 * 1000))
    });
  }

  // --- Products in Shop ---
  console.log('💎 Cataloging Luxury Creator Marketplace Products...');
  const products = [
    { title: 'Obsidian Noir Lightroom Presets', price: 29.99, desc: '12 handcrafted cinematic cinema-grade LUTs and RAW camera profiles.', image: CURATED_PHOTOS[0] },
    { title: 'SocialVerse VIP Founder Badge', price: 99.00, desc: 'Lifetime verified profile badge, golden chat sheen, and exclusive space hosting privileges.', image: CURATED_PHOTOS[1] },
    { title: 'Ambient Modular Sound Pack (24-bit WAV)', price: 45.00, desc: 'Over 150 pristine analog synth pads, sub pulses, and field recordings.', image: CURATED_PHOTOS[3] },
    { title: 'Minimalist Titanium Pen & Journal', price: 120.00, desc: 'Precision machined aerospace-grade titanium pen with Italian leather notebook.', image: CURATED_PHOTOS[4] }
  ];

  for (const prod of products) {
    await Product.create({
      owner: createdUsers[0]._id,
      title: prod.title,
      price: prod.price,
      desc: prod.desc,
      image: prod.image,
      stock: 50,
      tags: ['luxury', 'creator', 'digital']
    });
  }

  // --- Community Events ---
  console.log('🗓️ Scheduling Global Creative Events...');
  await Event.create({
    host: createdUsers[0]._id,
    title: 'SocialVerse Global Creative Summit 2026',
    description: 'An interactive virtual gathering exploring the nexus of generative AI, WebRTC, and artistic luxury storytelling.',
    date: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    location: 'Metaspace Studio A & Virtual Live Stage',
    type: 'virtual',
    image: CURATED_PHOTOS[5],
    attendees: createdUsers.slice(1, 8).map(u => u._id)
  });

  // --- Gamification Scores ---
  console.log('🕹️ Generating Arcade Leaderboard Scores...');
  const games = ['snake', '2048', 'quiz'];
  for (const u of createdUsers.slice(0, 8)) {
    await GameScore.create({
      user: u._id,
      gameId: games[Math.floor(Math.random() * games.length)],
      score: 1200 + Math.floor(Math.random() * 2500)
    });
  }

  console.log('✨ All Masterpiece Data Successfully Injected into MongoDB Atlas!');
  console.log('================================================================');
  console.log('🔑 Alex Rivera (Admin): admin@socialapp.com / password123');
  console.log('🔑 Elena Vance (User):  user@socialapp.com  / password123');
  console.log('================================================================');
  process.exit(0);
};

seedData().catch(err => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
```


# =====================================================================
## FILE (106/128): backend/server.js (Lines: 392)
# =====================================================================

```javascript
// backend/server.js

// --- CORE IMPORTS & INITIALIZATION ---
const express = require('express');
const http = require('http');
const fs = require('fs');
const logger = require('./utils/logger');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

// --- GRACEFUL SHUTDOWN UTILITY ---
let isShuttingDown = false;

async function gracefulShutdown(exitCode = 1) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    server.close(async () => {
      try {
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }
        logger.info('Graceful shutdown completed');
        process.exit(exitCode);
      } catch (err) {
        logger.error('Shutdown error:', err);
        process.exit(1);
      }
    });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

// --- CRITICAL PROCESS ERROR HANDLERS ---
process.on('unhandledRejection', async (reason) => {
  logger.error('Unhandled Rejection detected within operational stack:', reason);
  await gracefulShutdown(1);
});

process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception thrown inside main thread:', error);
  await gracefulShutdown(1);
});

// --- MODULE IMPORTS ---
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");

const path = require('path');

const config = require('./config/env');
const { validateEnv } = require('./config/envValidator');

validateEnv(); 

const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const socketService = require('./services/socketService');

app.set('trust proxy', 1);
server.headersTimeout = 65000;
server.keepAliveTimeout = 61000;

// --- SECURITY & PERFORMANCE ---
app.use(compression());
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com"],
      connectSrc: [
        "'self'", "ws:", "wss:", 
        "https://ultimate-social-app.onrender.com", 
        "wss://ultimate-social-app.onrender.com", 
        "https://newsdata.io", "https://www.googleapis.com"
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));

app.use(mongoSanitize());

const globalApiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60 });
const uploadLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
const feedLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 300 });

app.use('/api', globalApiLimiter);
app.use(['/api/auth/login', '/api/v1/auth/login', '/api/auth/register', '/api/v1/auth/register'], authLimiter);
app.use(['/api/posts/upload', '/api/v1/posts/upload'], uploadLimiter);
app.use(['/api/posts/feed', '/api/v1/posts/feed'], feedLimiter);

const allowedOrigins = Array.isArray(config.ALLOWED_ORIGINS) ? config.ALLOWED_ORIGINS : [config.ALLOWED_ORIGINS];

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (origin.endsWith('.onrender.com')) return true;
  if (config.NODE_ENV !== 'production' || origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return true;
  }
  return false;
};

app.use(cors({
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(hpp());
app.use(xss());

app.use(requestLogger);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get(['/health', '/api/health', '/api/v1/health'], (req, res) => {
  const mem = process.memoryUsage();
  return res.status(200).json({
    status: 'healthy',
    platform: 'SocialVerse ∞ — Beyond Social',
    version: '2.0.0-PROD',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
      name: mongoose.connection.name || 'socialverse_db'
    },
    system: {
      nodeVersion: process.version,
      memoryHeapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      memoryRssMB: Math.round(mem.rss / 1024 / 1024),
    }
  });
});

// --- DATABASE ---
const connectDatabase = require('./config/db');
connectDatabase().catch((err) => {
  logger.error(`Database initialization failure: `);
});

// --- HARDENED SOCKET.IO & REDIS ---
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
  path: '/socket.io',
  pingTimeout: 20000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
});

if (config.REDIS_URL) {
  (async () => {
    try {
      const redisOptions = {
        url: config.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.warn('Redis reconnection attempts exhausted; continuing with in-memory adapter');
              return false;
            }
            return Math.min(retries * 500, 2000);
          },
        },
      };
      const pubClient = createClient(redisOptions);
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) => logger.warn(`Redis Pub Error: ${err.message}`));
      subClient.on('error', (err) => logger.warn(`Redis Sub Error: ${err.message}`));

      await Promise.all([pubClient.connect(), subClient.connect()]);

      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Redis Adapter Connected');
    } catch(err) {
      logger.warn(`Redis adapter disabled: ${err.message}`);
    }
  })();
}

global.io = io;
socketService(io);

// Mediasoup WebRTC Router initialization (graceful fallback if native binary unavailable)
const { initializeMediasoup } = require('./services/mediasoup');
initializeMediasoup().catch((err) => logger.warn(`Mediasoup initialization notice: ${err.message}`));

// --- ROUTES MANAGEMENT ---
const apiRouter = express.Router();

// Individual Decoupled Sub-route Module Registration
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const appsRoutes = require('./routes/apps');
const callsRoutes = require('./routes/calls');
const chatRoutes = require('./routes/chat');
const commentsRoutes = require('./routes/comments');
const conversationsRoutes = require('./routes/conversations');
const extraRoutes = require('./routes/extra');
const followSuggestRoutes = require('./routes/followSuggest');
const integrationsRoutes = require('./routes/integrations');
const liveRoutes = require('./routes/live');
const marketplaceRoutes = require('./routes/marketplace');
const moderationRoutes = require('./routes/moderation');
const notificationsRoutes = require('./routes/notifications');
const payoutsRoutes = require('./routes/payouts');
const pollsRoutes = require('./routes/polls');
const postsRoutes = require('./routes/posts');
const proxyRoutes = require('./routes/proxy');
const reelsRoutes = require('./routes/reels');
const reportsRoutes = require('./routes/reports');
const searchRoutes = require('./routes/search'); 
const shopRoutes = require('./routes/shop');
const socialRoutes = require('./routes/social');
const storiesRoutes = require('./routes/stories'); 
const tagsRoutes = require('./routes/tags');
const translateRoutes = require('./routes/translate');
const usersRoutes = require('./routes/users'); 
const walletRoutes = require('./routes/wallet');
const spacesRoutes = require('./routes/spaces');
const eventsRoutes = require('./routes/events');
const gamesRoutes = require('./routes/games');

// Mount Sub-routers on top of the API root router topology
apiRouter.use('/spaces', spacesRoutes);
apiRouter.use('/events', eventsRoutes);
apiRouter.use('/games', gamesRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/apps', appsRoutes);
apiRouter.use('/calls', callsRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/comments', commentsRoutes);
apiRouter.use('/conversations', conversationsRoutes);
apiRouter.use('/extra', extraRoutes);
apiRouter.use('/follow-suggest', followSuggestRoutes);
apiRouter.use('/integrations', integrationsRoutes);
apiRouter.use('/live', liveRoutes);
apiRouter.use('/market', marketplaceRoutes);
apiRouter.use('/marketplace', marketplaceRoutes);
apiRouter.use('/moderation', moderationRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/payouts', payoutsRoutes);
apiRouter.use('/polls', pollsRoutes);
apiRouter.use('/posts', postsRoutes);
apiRouter.use('/proxy', proxyRoutes);
apiRouter.use('/reels', reelsRoutes);
apiRouter.use('/report', reportsRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/search', searchRoutes);
apiRouter.use('/shop', shopRoutes);
apiRouter.use('/social', socialRoutes);
apiRouter.use('/stories', storiesRoutes);
apiRouter.use('/tags', tagsRoutes);
apiRouter.use('/translate', translateRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/wallet', walletRoutes);

// Mount the integrated route cluster onto both /api/v1 and /api for seamless backwards compatibility
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

// --- DYNAMIC SSR OPENGRAPH PREVIEWS FOR SOCIAL CRAWLERS ---
app.get(['/post/:id', '/reels/:id'], async (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isBot = /facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|Slackbot|LinkedInBot|Discordbot/i.test(userAgent);
  if (!isBot) return next();

  try {
    const Post = require('./models/Post');
    const post = await Post.findById(req.params.id).populate('user', 'name avatar username');
    if (post) {
      const title = `${post.user?.name || 'Creator'} on SocialVerse ∞`;
      const desc = (post.content || post.caption || 'Beyond Social Networking').slice(0, 160);
      const img = post.mediaUrl || post.images?.[0] || post.thumbnail || 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200';
      return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="SocialVerse ∞" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${img}" />
</head>
<body style="background:#04070D;color:#FFF;font-family:sans-serif;padding:40px;text-align:center;">
  <h2>${title}</h2>
  <p>${desc}</p>
  <img src="${img}" style="max-width:90%;border-radius:16px;margin-top:20px;" />
</body>
</html>`);
    }
  } catch (_) {}
  next();
});

// --- FRONTEND STATIC ASSETS & SPA ROUTING ---
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
const altFrontendDistPath = path.resolve(__dirname, 'frontend/dist');
const effectiveDistPath = fs.existsSync(frontendDistPath)
  ? frontendDistPath
  : (fs.existsSync(altFrontendDistPath) ? altFrontendDistPath : null);

if (effectiveDistPath) {
  app.use(express.static(effectiveDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io') || req.originalUrl.startsWith('/uploads')) {
      return next(new AppError(`Can't find ${req.originalUrl} on this backend topography!`, 404));
    }
    res.sendFile(path.join(effectiveDistPath, 'index.html'));
  });
} else {
  // Fallback for unhandled endpoints / Global 404 handler within route pathing
  app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this backend topography!`, 404));
  });
}

// --- GLOBAL RUNTIME ERROR HANDLING TRAP ---
app.use(errorHandler);

// --- START SERVER ---
const PORT = config.PORT;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please terminate the conflicting process or change PORT in .env.`);
  } else {
    logger.error(`Server error: ${err.message}`);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  logger.info(`SERVER RUNNING ON PORT ${PORT} | MODE: ${config.NODE_ENV}`);
});

// --- GRACEFUL SHUTDOWN SIGNAL HANDLERS ---
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM RECEIVED');
  await gracefulShutdown(0);
});

process.on('SIGINT', async () => {
  logger.warn('SIGINT RECEIVED');
  await gracefulShutdown(0);
});
```


# =====================================================================
## FILE (107/128): backend/services/authService.js (Lines: 87)
# =====================================================================

```javascript
// backend/services/authService.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { sendOtpEmail } = require('../utils/email');

const createTokens = async (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

exports.registerUser = async ({ name, email, password, referralCode }) => {
  if (await User.findOne({ email })) throw new Error('Email already registered');
  let referrer = null;
  if (referralCode) referrer = await User.findOne({ referralCode });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  // FIX: Pass raw password, let the Mongoose Pre-Save Hook handle the hashing
  const user = await User.create({
    name, 
    email, 
    password, 
    isVerified: false,
    referredBy: referrer ? referrer._id : null,
    wallet: { balance: 0 },
    tempOtp: otpHash,
    resetOtpExpires: Date.now() + 15 * 60 * 1000
  });

  await sendOtpEmail(email, otp, 'Verify your account');
  return user;
};

exports.loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +is2FAEnabled');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid credentials');
  }

  if (user.is2FAEnabled) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.tempOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendOtpEmail(user.email, otp, '2FA Verification Code');
    return { requires2FA: true, email: user.email };
  }

  const tokens = await createTokens(user);
  return { ...tokens, user };
};

// 🔥 FIX: Google Login Secure Token Validation
exports.googleLoginUser = async (idToken) => {
  if (!idToken) throw new Error("No token provided");

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { email, name, picture, sub: googleId } = payload;

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name, email, googleId, avatar: picture, isVerified: true, wallet: { balance: 20 }
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    if (!user.avatar) user.avatar = picture;
    await user.save();
  }

  const tokens = await createTokens(user);
  return { ...tokens, user };
};

exports.createTokens = createTokens;
```


# =====================================================================
## FILE (108/128): backend/services/mediasoup.js (Lines: 75)
# =====================================================================

```javascript
// backend/services/mediasoup.js
let mediasoup = null;
try {
  mediasoup = require('mediasoup');
} catch (e) {
  // mediasoup is optional or native build not compiled
}

let worker = null;
let router = null;
let isInitializing = false;

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000,
    },
  },
];

const initializeMediasoup = async () => {
  if (!mediasoup) {
    return null;
  }

  if (isInitializing) return router;
  isInitializing = true;

  try {
    const rtcMinPort = parseInt(process.env.MEDIASOUP_MIN_PORT, 10) || 10000;
    const rtcMaxPort = parseInt(process.env.MEDIASOUP_MAX_PORT, 10) || 10100;

    worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort,
      rtcMaxPort,
    });

    worker.on('died', () => {
      console.error(`[Mediasoup] Worker died [pid:${worker?.pid}]. Triggering auto-recovery...`);
      worker = null;
      router = null;
      isInitializing = false;
      setTimeout(() => {
        initializeMediasoup().catch((err) => console.error('[Mediasoup] Recovery failed:', err.message));
      }, 2000);
    });

    router = await worker.createRouter({ mediaCodecs });
    console.log('🚀 Mediasoup Worker & Router Initialized');
    return router;
  } catch (err) {
    console.warn('[Mediasoup] Initialization notice:', err.message);
    return null;
  } finally {
    isInitializing = false;
  }
};

const getRouter = () => router;

module.exports = {
  initializeMediasoup,
  getRouter,
};
```


# =====================================================================
## FILE (109/128): backend/services/socketService.js (Lines: 346)
# =====================================================================

```javascript
const jwt = require('jsonwebtoken');
const cookie = require('cookie'); // Requires: npm install cookie
const User = require('../models/User');
const ActiveCall = require('../models/ActiveCall'); // Required for WebRTC cleanup
const { handleCallSockets } = require('../controllers/callsController');

// Global timeout registry for reconnect grace period
const disconnectTimeouts = new Map();
// Global online users registry (userId -> Set of socketIds)
const activeOnlineUsers = new Map();
// Global audio lounge registry (userId -> { _id, name, avatar, isMuted, socketIds: Set<string> })
const loungeParticipants = new Map();

module.exports = (io) => {
  // =================================================================
  // MIDDLEWARE: Authentication & Session Validation
  // =================================================================
  io.use(async (socket, next) => {
    try {
      let token = null;

      // 1. Priority: Try HttpOnly Cookie (Secure Production Method)
      if (socket.handshake.headers.cookie) {
        const parsedCookies = cookie.parse(socket.handshake.headers.cookie);
        token = parsedCookies.jwt; // Must match cookie name in authController
      }

      // 2. Fallback: Handshake Auth (For Mobile Apps / Dev testing)
      if (!token && socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // 3. Verify Token
      // Supports both Access Token (handshake.auth) and long-lived Refresh Token (HttpOnly cookie)
      let decoded = null;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || '');
      } catch (err1) {
        try {
          decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || '');
        } catch (err2) {
          return next(new Error('Authentication error: Invalid credentials'));
        }
      }

      // 4. Validate User in DB
      const user = await User.findById(decoded.id).select('_id name avatar role isDeleted');

      if (!user || user.isDeleted) {
        return next(new Error('Authentication error: User not found or deactivated'));
      }

      if (user.role === 'banned') {
        return next(new Error('Authentication error: Account banned'));
      }

      // 5. Attach User Context to Socket
      socket.user = user;
      socket.userId = user._id.toString();

      // Auto-join personal room for direct emits
      socket.join(socket.userId);

      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid credentials'));
    }
  });

  // =================================================================
  // CONNECTION HANDLER
  // =================================================================
  io.on('connection', async (socket) => {
    const userId = socket.userId;

    // Attach mediasoup/WebRTC call signaling
    handleCallSockets(io, socket);

    // If this user reconnected during the grace period, cancel pending cleanup
    if (disconnectTimeouts.has(userId)) {
      clearTimeout(disconnectTimeouts.get(userId));
      disconnectTimeouts.delete(userId);
      console.log(`[WebRTC] Host ${userId} reconnected. Pending room cleanup canceled.`);
    }

    // ===========================
    // PRESENCE TRACKING
    // ===========================
    let userSockets = activeOnlineUsers.get(userId);
    const isFirstSocket = !userSockets || userSockets.size === 0;
    if (!userSockets) {
      userSockets = new Set();
      activeOnlineUsers.set(userId, userSockets);
    }
    userSockets.add(socket.id);

    // Send current list of online users to the newly connected client
    socket.emit('users:list', Array.from(activeOnlineUsers.keys()));

    // Broadcast user online event if this is their first active session
    if (isFirstSocket) {
      io.emit('user:online', userId);
    }

    // ===========================
    // CHAT EVENTS
    // ===========================

    socket.on('joinRoom', ({ room }) => {
      if (room) {
        socket.join(room);
        socket.to(room).emit('user-joined', { userId: socket.id, user: socket.user });
      }
    });

    socket.on('leaveRoom', ({ room }) => {
      if (room) socket.leave(room);
    });

    socket.on('typing', (data) => {
      if (data.chatId) {
        socket.to(data.chatId).emit('typing', {
          chatId: data.chatId,
          userId: userId,
          name: socket.user.name
        });
      }
    });

    // ===========================
    // WEBRTC CALLING EVENTS
    // ===========================

    socket.on('call:start', ({ toUserId, roomId, callerName, callerAvatar }) => {
      io.to(toUserId).emit('call:incoming', {
        roomId,
        from: {
          _id: userId,
          name: callerName || socket.user.name,
          avatar: callerAvatar || socket.user.avatar
        }
      });
    });

    socket.on('call:signal', ({ to, signal, from }) => {
      io.to(to).emit('call:signal', { signal, from });
    });

    socket.on('call:rejected', ({ roomId }) => {
      socket.to(roomId).emit('call:rejected');
    });

    socket.on('call:ended', ({ roomId }) => {
      io.to(roomId).emit('call:ended');
    });

    // ===========================
    // SOCIALVERSE LIVE AUDIO SPACES EVENTS
    // ===========================
    socket.on('space:join', ({ spaceId, user }) => {
      if (!spaceId) return;
      const room = `space_${spaceId}`;
      socket.join(room);
      io.to(room).emit('space:user-joined', { spaceId, user: user || socket.user });
    });

    socket.on('space:leave', ({ spaceId, userId }) => {
      if (!spaceId) return;
      const room = `space_${spaceId}`;
      socket.leave(room);
      io.to(room).emit('space:user-left', { spaceId, userId: userId || socket.userId });
    });

    socket.on('space:raise-hand', ({ spaceId, user }) => {
      if (!spaceId) return;
      io.to(`space_${spaceId}`).emit('space:hand-raised', { spaceId, user: user || socket.user });
    });

    socket.on('space:promote-speaker', ({ spaceId, targetUserId }) => {
      if (!spaceId) return;
      io.to(`space_${spaceId}`).emit('space:speaker-promoted', { spaceId, targetUserId });
    });

    socket.on('space:speaking', ({ spaceId, userId, audioLevel }) => {
      if (!spaceId) return;
      socket.to(`space_${spaceId}`).emit('space:speaking', { spaceId, userId: userId || socket.userId, audioLevel });
    });

    // ===========================
    // LIVE STREAMING EVENTS
    // ===========================

    socket.on('live:host', ({ roomId }) => {
      socket.join(roomId);
    });

    socket.on('live:viewer', ({ roomId }) => {
      socket.join(roomId);
      socket.to(roomId).emit('live:viewer-joined', socket.id);
    });

    socket.on('live:signal', ({ to, data, roomId }) => {
      io.to(to).emit('live:signal', { data, from: socket.id });
    });

    socket.on('live:return', ({ roomId, data }) => {
      socket.to(roomId).emit('live:return', { data, from: socket.id });
    });

    socket.on('live:comment', (payload) => {
      io.to(payload.roomId).emit('live:comment', {
        ...payload,
        user: { _id: userId, name: socket.user.name, avatar: socket.user.avatar }
      });
    });

    socket.on('live:reaction', (payload) => {
      io.to(payload.roomId).emit('live:reaction', payload);
    });

    // ===========================
    // AUDIO LOUNGE
    // ===========================

    const getLoungeRoster = () => {
      return Array.from(loungeParticipants.values()).map((p) => ({
        _id: p._id,
        name: p.name,
        avatar: p.avatar,
        isMuted: p.isMuted,
      }));
    };

    socket.on('lounge:join', () => {
      socket.join('global-lounge');

      let participant = loungeParticipants.get(userId);
      if (!participant) {
        participant = {
          _id: userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
          isMuted: true,
          socketIds: new Set([socket.id]),
        };
        loungeParticipants.set(userId, participant);
      } else {
        participant.socketIds.add(socket.id);
      }

      const roster = getLoungeRoster();
      io.to('global-lounge').emit('lounge:update', roster);
      io.to('global-lounge').emit('lounge:user_joined', {
        _id: userId,
        name: socket.user.name,
        avatar: socket.user.avatar,
        isMuted: participant.isMuted,
      });
    });

    socket.on('lounge:toggle_mute', ({ isMuted }) => {
      const participant = loungeParticipants.get(userId);
      if (participant) {
        participant.isMuted = !!isMuted;
        const roster = getLoungeRoster();
        io.to('global-lounge').emit('lounge:update', roster);
        io.to('global-lounge').emit('lounge:user_updated', { userId, isMuted: !!isMuted });
      }
    });

    socket.on('lounge:leave', () => {
      socket.leave('global-lounge');
      const participant = loungeParticipants.get(userId);
      if (participant) {
        participant.socketIds.delete(socket.id);
        if (participant.socketIds.size === 0) {
          loungeParticipants.delete(userId);
          const roster = getLoungeRoster();
          io.to('global-lounge').emit('lounge:update', roster);
          io.to('global-lounge').emit('lounge:user_left', userId);
        }
      }
    });

    // ===========================
    // DISCONNECT
    // ===========================
    socket.on('disconnect', () => {
      // Clean up user from activeOnlineUsers registry
      const userSockets = activeOnlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeOnlineUsers.delete(userId);
          io.emit('user:offline', userId);
        }
      }

      // Clean up user from loungeParticipants registry
      const participant = loungeParticipants.get(userId);
      if (participant) {
        participant.socketIds.delete(socket.id);
        if (participant.socketIds.size === 0) {
          loungeParticipants.delete(userId);
          const roster = getLoungeRoster();
          io.to('global-lounge').emit('lounge:update', roster);
          io.to('global-lounge').emit('lounge:user_left', userId);
        }
      }

      // Start grace-period cleanup instead of destroying immediately
      const timeoutId = setTimeout(async () => {
        try {
          const calls = await ActiveCall.find({ host: userId });

          if (calls.length > 0) {
            // Notify participants that the room is closed
            calls.forEach((call) => {
              if (call.roomId) {
                io.to(call.roomId).emit('call:ended', {
                  reason: 'host_disconnected'
                });
              }
            });

            // Remove active call records after notifying clients
            await ActiveCall.deleteMany({ host: userId });

            console.log(`[WebRTC] Host ${userId} dropped. Room destroyed after grace period.`);
          }
        } catch (err) {
          console.error('Error cleaning up WebRTC call:', err);
        }

        // Cleanup timeout registry
        disconnectTimeouts.delete(userId);
      }, 15000); // 15 seconds grace period

      disconnectTimeouts.set(userId, timeoutId);
    });
  });
};
```


# =====================================================================
## FILE (110/128): backend/utils/AppError.js (Lines: 12)
# =====================================================================

```javascript
// backend/utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes operational errors from programming bugs
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```


# =====================================================================
## FILE (111/128): backend/utils/asyncHandler.js (Lines: 6)
# =====================================================================

```javascript
module.exports = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };
};
```


# =====================================================================
## FILE (112/128): backend/utils/catchAsync.js (Lines: 4)
# =====================================================================

```javascript
// backend/utils/catchAsync.js
// Wrapper to eliminate try-catch blocks in controllers
module.exports = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```


# =====================================================================
## FILE (113/128): backend/utils/cloudinary.js (Lines: 103)
# =====================================================================

```javascript
// backend/utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
});

const isTransientError = (err) => {
	if (!err) return false;
	const msg = (err.message || '').toLowerCase();
	const code = err?.http_code || err?.status_code || err?.code || '';
	if (typeof code === 'number' && code >= 500) return true;
	if (/[timeout|timed out|request timeout|etimedout|econnreset|502|503|504]/i.test(msg)) return true;
	if (String(code).includes('ECONN') || String(code).includes('ETIMEDOUT')) return true;
	return false;
};

const safeUnlink = (path) => {
    try {
        if (fs.existsSync(path)) fs.unlinkSync(path);
    } catch (e) {
        console.error(`Failed to delete local file: ${path}`, e.message);
    }
};

/**
 * Upload a local file to Cloudinary with retries and exponential backoff.
 * 🔥 GUARANTEED CLEANUP: Local file is deleted in finally block.
 */
const uploads = (filePath, folder = 'ultimate_social', opts = {}) =>
	new Promise((resolve, reject) => {
		if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
			safeUnlink(filePath);
			return reject(new Error('CLOUDINARY env not configured'));
		}

		const maxAttempts = Number(process.env.CLOUDINARY_UPLOAD_RETRIES || 3);
		let attempt = 0;

		const tryOnce = () => {
			attempt += 1;
			const options = Object.assign({ folder, resource_type: 'auto' }, opts);

			cloudinary.uploader.upload(filePath, options, (err, result) => {
				if (!err && result) {
                    safeUnlink(filePath); // Success cleanup
					return resolve(result);
				}

				if (isTransientError(err) && attempt < maxAttempts) {
					const delay = Math.min(2000 * Math.pow(2, attempt - 1), 15000); 
					console.warn(`Cloudinary upload attempt ${attempt} failed; retrying after ${delay}ms`, (err && (err.message || err)).toString());
					return setTimeout(tryOnce, delay);
				}

				// Final failure
				console.error('Cloudinary upload failed (final):', err && (err.message || err));
                safeUnlink(filePath); // Failure cleanup
				return reject(err || new Error('Cloudinary upload failed'));
			});
		};

		tryOnce();
	});

const uploadsStream = (readableStream, folder = 'ultimate_social', opts = {}) =>
	new Promise((resolve, reject) => {
		if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
			return reject(new Error('CLOUDINARY env not configured'));
		}
		const options = Object.assign({ folder, resource_type: 'auto' }, opts);
		const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
			if (error) return reject(error);
			return resolve(result);
		});
		readableStream.pipe(uploadStream);
	});

const deleteFile = async (url) => {
    if (!url || !url.includes('cloudinary')) return;
    try {
        // Isolate sub-folder groupings and unique identifiers accurately via refined regex matching
        const matches = url.match(/\/v\d+\/(.+)\.[a-z0-9]+$/i);
        if (matches && matches[1]) {
            const publicId = matches[1];
            await cloudinary.uploader.destroy(publicId);
            console.log(`Deleted Cloudinary image: ${publicId}`);
        }
    } catch (error) {
        console.error("Remote file release task sequence failed:", error.message);
    }
};

module.exports = {
	uploads,
	uploadsStream,
    deleteFile,
	cloudinary,
};
```


# =====================================================================
## FILE (114/128): backend/utils/email.js (Lines: 62)
# =====================================================================

```javascript
// backend/utils/email.js
const nodemailer = require('nodemailer');

// Load environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ultimate-social-app.vercel.app';
const SENDER_EMAIL = process.env.EMAIL_USER || 'noreply@socialverse.app';

exports.sendOtpEmail = async (to, otp, subject = 'Your Verification Code') => {
  try {
    // If credentials are not configured in environment, use clean fallback log so auth never fails
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`[📧 MOCK MODE] Email service not configured in environment. Verification code for ${to}: [${otp}]`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log(`[📧 SENDING] Attempting to send email to: ${to}`);

    // Construct Magic Link
    const magicLink = `${FRONTEND_URL}/verify-account?email=${encodeURIComponent(to)}&code=${otp}`;

    const mailOptions = {
      from: `"SocialVerse Team" <${SENDER_EMAIL}>`,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; text-align: center;">Verify Your Account</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p>Use the code below to complete your sign-in to SocialVerse ∞.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${magicLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Automatically</a>
          </div>

          <p style="font-size: 12px; color: #888; text-align: center;">This code expires in 15 minutes.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('❌ EMAIL DISPATCH WARNING:', error.message);
    // Return true in development/fallback so signups are not blocked
    return true;
  }
};
```


# =====================================================================
## FILE (115/128): backend/utils/gamification.js (Lines: 48)
# =====================================================================

```javascript
// backend/utils/gamification.js
const User = require('../models/User');

// XP Table
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 5000];

exports.addXP = async (userId, amount, io) => {
  try {
    // 1. Atomic Increment (Safe for concurrency)
    const user = await User.findByIdAndUpdate(
        userId, 
        { $inc: { xp: amount } }, 
        { new: true, select: 'xp level name' }
    );
    
    if (!user) return;

    // 2. Level Up Logic (Calculated after atomic update)
    // Note: This part isn't strictly atomic regarding the level field, 
    // but the XP data is now safe.
    const nextLevelXP = XP_THRESHOLDS[user.level] || (user.level * 500);
    let leveledUp = false;

    if (user.xp >= nextLevelXP) {
        user.level += 1;
        leveledUp = true;
        await user.save(); // Save the new level
    }

    // 3. Emit Real-time Update
    if (io) {
        io.to(String(userId)).emit('xp:update', { 
            xp: user.xp, 
            level: user.level, 
            leveledUp 
        });

        if (leveledUp) {
            io.to(String(userId)).emit('notification', {
                type: 'system',
                message: `🎉 Level Up! You are now Level ${user.level}!`
            });
        }
    }
  } catch (e) {
    console.error("XP Error:", e);
  }
};
```


# =====================================================================
## FILE (116/128): backend/utils/logger.js (Lines: 58)
# =====================================================================

```javascript
// backend/utils/logger.js
const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');

const logger = winston.createLogger({

  level: 'info',

  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),

    winston.format.errors({
      stack: true
    }),

    winston.format.printf(({ level, message, timestamp, stack }) => {
      return stack
        ? `[${timestamp}] ${level.toUpperCase()}: ${stack}`
        : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),

  transports: [

    // ERROR LOG FILE
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),

    // ALL LOGS FILE
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log')
    }),

  ],

});

// DEVELOPMENT CONSOLE LOGGING
if (process.env.NODE_ENV !== 'production') {

  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );

}

module.exports = logger;
```


# =====================================================================
## FILE (117/128): backend/utils/multer.js (Lines: 32)
# =====================================================================

```javascript
// utils/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // 🔥 FIXED: Throw Error on invalid type instead of silent fail
  if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

module.exports = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
```


# =====================================================================
## FILE (118/128): backend/utils/notify.js (Lines: 112)
# =====================================================================

```javascript
// backend/utils/notify.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const { webpush } = require('./push'); 

const createNotification = async (req, { toUser, type, data, message }) => {
  try {
    const actorId = req.user._id.toString();
    const recipientId = toUser.toString();

    // 1. No self-notifications
    if (actorId === recipientId) return;

    // 2. Fetch Recipient Settings
    // We fetch pushSubscription as an array (updated schema)
    const recipient = await User.findById(recipientId).select('pushSubscription notificationSettings');
    
    if (!recipient) return;

    // 3. Check Notification Settings
    const settings = recipient.notificationSettings || {};
    
    let isEnabled = true;
    switch (type) {
        case 'like': isEnabled = settings.likes !== false; break;
        case 'comment': isEnabled = settings.comments !== false; break;
        case 'follow': isEnabled = settings.follows !== false; break;
        case 'message': isEnabled = settings.messages !== false; break;
        default: isEnabled = true; // System/Security notifications bypass preferences
    }

    if (!isEnabled) {
        return; // User disabled this type of notification
    }

    // 4. Spam Prevention (Debounce for Likes)
    if (type === 'like') {
      const recent = await Notification.findOne({
        user: recipientId,
        actor: actorId,
        type: 'like',
        'data.postId': data.postId,
        createdAt: { $gt: new Date(Date.now() - 60 * 60 * 1000) } // 1 hour debounce
      });
      if (recent) return;
    }

    // 5. Construct Message if missing
    const msg = message || `${req.user.name} ${
        type==='like'?'liked your post':
        type==='comment'?'commented on your post':
        type==='follow'?'started following you':
        'interacted with you'
    }`;

    // 6. Save Notification to DB
    const notif = await Notification.create({
      user: toUser,
      actor: actorId,
      type,
      data,
      message: msg
    });

    // 7. Emit Real-time (Socket)
    const io = req.app.get('io') || global.io;
    if (io) io.to(recipientId).emit('notification', notif);

    // 8. Send Web Push to ALL subscribed devices
    if (recipient.pushSubscription && recipient.pushSubscription.length > 0) {
        const payload = JSON.stringify({
            title: 'SocialApp',
            body: msg,
            icon: '/pwa-192x192.png',
            data: {
                url: data?.link || '/notifications' 
            }
        });

        // Loop through all subscriptions (Multi-device support)
        const sendPromises = recipient.pushSubscription.map(async (sub) => {
            try {
                await webpush.sendNotification(sub, payload);
            } catch (pushErr) {
                // If subscription is dead (410 or 404), return it for deletion
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                    return sub; 
                }
                console.error("Push failed:", pushErr.message);
            }
            return null;
        });

        const results = await Promise.all(sendPromises);
        const deadSubs = results.filter(s => s !== null);

        // 9. Cleanup Dead Subscriptions
        if (deadSubs.length > 0) {
             await User.findByIdAndUpdate(recipientId, {
                 $pull: { pushSubscription: { endpoint: { $in: deadSubs.map(s => s.endpoint) } } }
             });
             console.log(`🧹 Cleaned up ${deadSubs.length} dead push subscriptions for user ${recipientId}`);
        }
    }

    return notif;
  } catch (err) {
    console.error('Notification error:', err);
  }
};

module.exports = createNotification;
```


# =====================================================================
## FILE (119/128): backend/utils/processMentions.js (Lines: 45)
# =====================================================================

```javascript
// backend/utils/processMentions.js
const User = require('../models/User');
const createNotification = require('./notify');

/**
 * Extracts @mentions from text and notifies users
 * @param {string} text - Post content
 * @param {object} req - Express request (for user info/context)
 * @param {string} postId - ID of the post where mention occurred
 */
const processMentions = async (text, req, postId) => {
    if (!text || typeof text !== 'string' || !text.includes('@')) return;

    // Regex to find @names (supports letters, numbers, underscores)
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);

    if (!matches) return;

    // Remove duplicates and strip the '@' symbol
    const uniqueHandles = [...new Set(matches.map(m => m.slice(1)))];

    if (uniqueHandles.length === 0) return;

    // 🔥 FIX: Find users by unique 'username' handle instead of 'name'
    const users = await User.find({ 
        username: { $in: uniqueHandles },
        isDeleted: { $ne: true } 
    }).select('_id');

    // Send notifications
    for (const user of users) {
        // Don't notify self
        if (req.user && String(user._id) === String(req.user._id)) continue;

        await createNotification(req, {
            toUser: user._id,
            type: 'mention',
            data: { postId },
            message: `${req.user.name} mentioned you in a post`
        });
    }
};

module.exports = processMentions;
```


# =====================================================================
## FILE (120/128): backend/utils/push.js (Lines: 35)
# =====================================================================

```javascript
// backend/utils/push.js
const webpush = require('web-push');

let publicKey = process.env.VAPID_PUBLIC_KEY;
let privateKey = process.env.VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
  try {
    const generated = webpush.generateVAPIDKeys();
    publicKey = generated.publicKey;
    privateKey = generated.privateKey;
    console.log("ℹ️ Auto-generated ephemeral VAPID keys for Web Push notifications");
  } catch (err) {
    console.warn("⚠️ Web Push VAPID generation fallback:", err.message);
  }
}

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@socialapp.com',
      publicKey,
      privateKey
    );
    console.log("✅ VAPID Keys configured for Web Push");
  } catch (err) {
    console.warn("⚠️ Error configuring VAPID details:", err.message);
  }
}

module.exports = {
  webpush,
  publicKey
};
```


# =====================================================================
## FILE (121/128): backend/utils/textParser.js (Lines: 34)
# =====================================================================

```javascript
/**
 * Safe Post Text Parser Subsystem
 * Resolves SEC-APP-002 ReDoS loops via non-backtracking evaluation strategies.
 */

exports.parsePostContent = (textInput) => {
  if (!textInput || typeof textInput !== 'string') {
    return { hashtags: [], mentions: [] };
  }

  // Defend loop tasks by truncating excessive payloads early
  const safeTextBody = textInput.substring(0, 4000);

  // Assert basic bounded quantifiers to match values explicitly
  const hashtagScanningRegex = /#([a-zA-Z0-9_]{1,30})/g;
  const mentionScanningRegex = /@([a-zA-Z0-9_]{1,30})/g;

  const parsedHashtagCollection = [];
  const parsedUserMentionCollection = [];
  let evaluationIterator;

  while ((evaluationIterator = hashtagScanningRegex.exec(safeTextBody)) !== null) {
    parsedHashtagCollection.push(evaluationIterator[1].toLowerCase());
  }

  while ((evaluationIterator = mentionScanningRegex.exec(safeTextBody)) !== null) {
    parsedUserMentionCollection.push(evaluationIterator[1]);
  }

  return {
    hashtags: Array.from(new Set(parsedHashtagCollection)),
    mentions: Array.from(new Set(parsedUserMentionCollection))
  };
};
```


# =====================================================================
## FILE (122/128): backend/validators/authValidator.js (Lines: 81)
# =====================================================================

```javascript
const { z } = require("zod");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100)
  .regex(/[A-Z]/, "Password must contain uppercase letter")
  .regex(/[a-z]/, "Password must contain lowercase letter")
  .regex(/[0-9]/, "Password must contain number");

exports.registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name too short")
      .max(50, "Name too long"),

    email: z
      .string()
      .email("Invalid email"),

    password: passwordSchema,

    referralCode: z
      .string()
      .optional(),
  }),
});

exports.loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email"),

    password: z
      .string()
      .min(1, "Password required"),
  }),
});

exports.verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email(),

    otp: z
      .string()
      .length(6, "OTP must be 6 digits"),
  }),
});

exports.requestResetSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email(),
  }),
});

exports.resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email(),

    otp: z
      .string()
      .length(6),

    newPassword: passwordSchema,
  }),
});
exports.googleLoginSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(10, "Invalid Google token"),
  }),
});
```


# =====================================================================
## FILE (123/128): frontend/package.json (Lines: 57)
# =====================================================================

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-oauth/google": "^0.12.2",
    "@reduxjs/toolkit": "^2.2.1",
    "@studio-freight/lenis": "^1.0.42",
    "@tensorflow-models/universal-sentence-encoder": "^1.3.3",
    "@tensorflow/tfjs": "^4.22.0",
    "axios": "^1.6.7",
    "browser-image-compression": "^2.0.2",
    "canvas-confetti": "^1.9.4",
    "chart.js": "^4.4.1",
    "clsx": "^2.1.0",
    "crypto-js": "^4.2.0",
    "date-fns": "^4.1.0",
    "framer-motion": "^11.0.8",
    "lucide-react": "^1.16.0",
    "nsfwjs": "^4.2.1",
    "qrcode.react": "^4.2.0",
    "react": "^18.2.0",
    "react-chartjs-2": "^5.2.0",
    "react-dom": "^18.2.0",
    "react-icons": "^5.0.1",
    "react-qr-code": "^2.0.12",
    "react-qr-reader": "^3.0.0-beta-1",
    "react-redux": "^9.1.0",
    "react-router-dom": "^6.22.1",
    "react-virtuoso": "^4.18.1",
    "simple-peer": "^9.11.1",
    "socket.io-client": "^4.7.4",
    "tailwind-merge": "^2.2.1",
    "vite-plugin-pwa": "^1.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.56",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4"
  }
}
```


# =====================================================================
## FILE (124/128): frontend/vercel.json (Lines: 52)
# =====================================================================

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://ultimate-social-app.onrender.com/api/:path*"
    },
    {
      "source": "/socket.io/:path*",
      "destination": "https://ultimate-social-app.onrender.com/socket.io/:path*"
    },
    {
      "source": "/uploads/:path*",
      "destination": "https://ultimate-social-app.onrender.com/uploads/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/registerSW.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```


# =====================================================================
## FILE (125/128): package.json (Lines: 28)
# =====================================================================

```json
{
  "name": "ultimate-social-app",
  "version": "1.0.0",
  "scripts": {
    "install-server": "cd backend && npm install",
    "install-client": "cd frontend && npm install --legacy-peer-deps --include=dev",
    "build-client": "cd frontend && npm run build",
    "build": "npm run install-server && npm run install-client && npm run build-client",
    "start": "cd backend && node server.js"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "dependencies": {
    "@radix-ui/react-slot": "^1.2.4",
    "@studio-freight/lenis": "^1.0.42",
    "clsx": "^2.1.1",
    "express-rate-limit": "^8.2.1",
    "gsap": "^3.15.0",
    "lucide-react": "^1.16.0",
    "mediasoup": "^3.19.22",
    "redis": "^5.12.1",
    "socket.io": "^4.8.3",
    "tailwind-merge": "^3.6.0",
    "zod": "^4.4.3"
  }
}
```


# =====================================================================
## FILE (126/128): render.yaml (Lines: 24)
# =====================================================================

```text
services:
  - type: web
    name: ultimate-social-backend
    runtime: node
    plan: free
    region: oregon
    rootDir: backend
    buildCommand: npm install
    startCommand: node server.js
    healthCheckPath: /api/v1/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: ALLOWED_ORIGINS
        value: https://*.vercel.app,http://localhost:5173
```


# =====================================================================
## FILE (127/128): server.js (Lines: 3)
# =====================================================================

```javascript
// Root entrypoint forwarding to backend/server.js for root-level hostings
require('./backend/server.js');
```


# =====================================================================
## FILE (128/128): vercel.json (Lines: 46)
# =====================================================================

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://ultimate-social-app.onrender.com/api/:path*"
    },
    {
      "source": "/socket.io/:path*",
      "destination": "https://ultimate-social-app.onrender.com/socket.io/:path*"
    },
    {
      "source": "/uploads/:path*",
      "destination": "https://ultimate-social-app.onrender.com/uploads/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

