// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type:String, required:true },
  email: { type:String, unique:true, required:true },
  password: { type:String, select:false },
  
  // --- Profile Visuals ---
  avatar: { type: String, default: "" },
  coverPhoto: { type: String, default: "" },
  bio: { type: String, default: "" },
  website: String,
  location: String,
  
  // --- Status & Meta ---
  userStatus: { type: String, default: 'Available' },
  profileCompletion: { type: Number, default: 20 },
  pinnedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },

  // --- Notification Preferences ---
  notificationSettings: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
  },

  // Web Push Subscription (JSON stored as Object)
  pushSubscription: { type: Object, select: false },

  role: { type:String, default:'user' },
  isVerified: { type:Boolean, default:false },
  googleId: String,
  
  // --- Social Graph ---
  followers: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  following: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  closeFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saved: [{ type:mongoose.Schema.Types.ObjectId, ref:'Post' }],

  // --- Gamification & Wallet ---
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{ type:String }],
  
  // Interest Graph (The Brain)
  interestProfile: { 
    type: Map, 
    of: Number, 
    default: {} 
  },
  
  wallet: {
    balance: { type:Number, default: 100 },
    totalReceived: { type:Number, default: 0 },
    totalSent: { type:Number, default: 0 }
  },

  // 🔥 NEW: Wallet Security PIN
  walletPin: { type: String, select: false }, 
  
  streak: {
    count: { type: Number, default: 0 },
    lastLogin: { type: Date }
  },
  lastAirdrop: { type: Date, default: null },
  referralCode: { type: String, unique: true, sparse: true }, 
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // --- Links & IDs ---
  socialLinks: {
    twitter: String,
    instagram: String,
    linkedin: String,
    website: String 
  },
  qrHandle: { type:String, unique:true, sparse:true },
  nftPfpUrl: String,
  privateProfile: { type:Boolean, default:false },

  // --- Geo Location ---
  geo: {
    type: { type:String, enum:['Point'], default:'Point' },
    coordinates: { type:[Number], default: [0,0] }
  },

  // --- Security ---
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  refreshToken: { type: String, select: false },
  is2FAEnabled: { type: Boolean, default: false },

  // --- OTPs ---
  tempOtp: { type:String, select:false },
  resetOtp: { type:String, select:false },
  resetOtpExpires: { type:Number, select:false },
}, { timestamps:true });

// Indexes for Search and Geo
UserSchema.index({ name:'text', email:'text' });
UserSchema.index({ geo: '2dsphere' });

// Middleware: Auto-generate Referral Code
UserSchema.pre('save', function(next) {
    if (!this.referralCode) {
        this.referralCode = this._id.toString().slice(-6).toUpperCase();
    }
    next();
});

// Middleware: Soft Delete Filter
UserSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('User', UserSchema);