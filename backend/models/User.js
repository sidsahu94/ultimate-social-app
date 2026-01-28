// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please provide a name'], 
    trim: true,
    index: 'text' 
  },
  // Unique username for mentions/urls
  username: { 
      type: String, 
      unique: true, 
      sparse: true, 
      index: true 
  },
  email: { 
    type: String, 
    unique: true, 
    required: [true, 'Please provide an email'], 
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 
      'Please provide a valid email'
    ]
  },
  // 🔥 Fix: Password is only required if NOT a Google User
  password: { 
    type: String, 
    required: function() { return !this.googleId; }, 
    minlength: 6,
    select: false 
  },
  
  // --- Profile Visuals ---
  avatar: { type: String, default: "" },
  coverPhoto: { type: String, default: "" },
  bio: { type: String, maxlength: 160, default: "" },
  location: { type: String, default: "" },
  website: { type: String, default: "" },
  socialLinks: {
    twitter: String,
    instagram: String,
    linkedin: String
  },
  
  // --- Status & Meta ---
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  userStatus: { type: String, default: 'Available' },
  googleId: String,
  
  // --- Gamification ---
  xp: { type: Number, default: 0, index: -1 }, 
  level: { type: Number, default: 1 },
  badges: [{ type: String }],
  streak: {
    count: { type: Number, default: 0 },
    lastLogin: { type: Date }
  },
  
  // --- Social Graph ---
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  closeFriends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  
  // --- Wallet & Economy ---
  wallet: {
    balance: { type: Number, default: 100 },
    totalReceived: { type: Number, default: 0 },
    totalSent: { type: Number, default: 0 }
  },
  walletPin: { type: String, select: false },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // --- Settings ---
  notificationSettings: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
  },
  pushSubscription: { type: [Object], select: false, default: [] },
  
  // --- Geo Location ---
  geo: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },

  // --- Security ---
  is2FAEnabled: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
  tempOtp: { type: String, select: false },
  resetOtp: { type: String, select: false },
  resetOtpExpires: { type: Number, select: false },
  
  // --- Soft Delete ---
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- INDEXES ---
UserSchema.index({ geo: '2dsphere' });

// --- VIRTUALS ---
UserSchema.virtual('followersCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

UserSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// --- MIDDLEWARE ---
UserSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = this._id.toString().slice(-6).toUpperCase();
  }
  next();
});

// 🔥 Fix: Only hash password if it exists and is modified
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.pre(/^find/, function(next) {
  if (this.options.includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);