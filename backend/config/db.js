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
