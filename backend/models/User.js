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