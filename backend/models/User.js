const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type:String, required:true },
  email: { type:String, unique:true, required:true },
  password: { type:String, select:false },
  avatar: String,
  coverPhoto: String,
  bio: String,
  website: String,
  location: String,
  role: { type:String, default:'user' },
  isVerified: { type:Boolean, default:false },

  googleId: String,
  followers: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  following: [{ type:mongoose.Schema.Types.ObjectId, ref:'User' }],
  saved: [{ type:mongoose.Schema.Types.ObjectId, ref:'Post' }],

  // Gamification & Wallet
  badges: [{ type:String }],
  wallet: {
    balance: { type:Number, default: 100 },
    totalReceived: { type:Number, default: 0 },
    totalSent: { type:Number, default: 0 }
  },
  // --- NEW FIELDS ---
  lastAirdrop: { type: Date, default: null }, // For 24h cooldown
  referralCode: { type: String, unique: true, sparse: true }, 
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Social Links
  socialLinks: {
    twitter: String,
    instagram: String,
    linkedin: String,
    website: String 
  },

  qrHandle: { type:String, unique:true, sparse:true },
  nftPfpUrl: String,
  privateProfile: { type:Boolean, default:false },

  // Geo
  geo: {
    type: { type:String, enum:['Point'], default:'Point' },
    coordinates: { type:[Number], default: [0,0] }
  },

  // Security
  tempOtp: { type:String, select:false },
  resetOtp: { type:String, select:false },
  resetOtpExpires: { type:Number, select:false },
}, { timestamps:true });

UserSchema.index({ name:'text', email:'text' });
UserSchema.index({ geo: '2dsphere' });

// Auto-generate referral code on save if missing
UserSchema.pre('save', function(next) {
    if (!this.referralCode) {
        this.referralCode = this._id.toString().slice(-6).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);