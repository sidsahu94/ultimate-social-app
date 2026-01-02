const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type:String, required:true },
  email: { type:String, unique:true, required:true },
  password: { type:String, select:false },
  
  // Profile Details
  avatar: String,
  coverPhoto: String,
  bio: String,
  website: String,
  location: String,
  
  // 🔥 NEW: Custom Status (e.g., "Working", "Travel")
  userStatus: { type: String, default: 'Available' },
  
  // 🔥 NEW: Profile Health Score (0-100)
  profileCompletion: { type: Number, default: 20 },

  // 🔥 NEW: Pinned Post on Profile
  pinnedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },

  // 🔥 NEW: Notification Preferences
  notificationSettings: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
  },

  role: { type:String, default:'user' },
  isVerified: { type:Boolean, default:false },
  googleId: String,
  
  // Social Graph
  followers: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  following: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  closeFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saved: [{ type:mongoose.Schema.Types.ObjectId, ref:'Post' }],

  // Gamification & Wallet
  badges: [{ type:String }],
  wallet: {
    balance: { type:Number, default: 100 },
    totalReceived: { type:Number, default: 0 },
    totalSent: { type:Number, default: 0 }
  },
  lastAirdrop: { type: Date, default: null },
  referralCode: { type: String, unique: true, sparse: true }, 
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Links & Metadata
  socialLinks: {
    twitter: String,
    instagram: String,
    linkedin: String,
    website: String 
  },
  qrHandle: { type:String, unique:true, sparse:true },
  nftPfpUrl: String,
  privateProfile: { type:Boolean, default:false },

  // Geo Location
  geo: {
    type: { type:String, enum:['Point'], default:'Point' },
    coordinates: { type:[Number], default: [0,0] }
  },

  // Soft Delete & Security
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  refreshToken: { type: String, select: false }, // 🔥 Security Hardening

  // OTPs
  tempOtp: { type:String, select:false },
  resetOtp: { type:String, select:false },
  resetOtpExpires: { type:Number, select:false },
}, { timestamps:true });

// Indexes for Search
UserSchema.index({ name:'text', email:'text' });
UserSchema.index({ geo: '2dsphere' });

// Auto-generate referral code on save
UserSchema.pre('save', function(next) {
    if (!this.referralCode) {
        this.referralCode = this._id.toString().slice(-6).toUpperCase();
    }
    next();
});

// 🔥 Global Query Middleware: Hide soft-deleted users
UserSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('User', UserSchema);