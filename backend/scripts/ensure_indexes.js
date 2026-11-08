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
      err?.codeName === 'IndexOptionsConflict' ||
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