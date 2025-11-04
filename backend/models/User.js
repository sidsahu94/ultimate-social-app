// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // hide password by default unless explicitly selected
  password: { type: String, select: false },
  googleId: { type: String },
  avatar: { type: String },
  coverPhoto: { type: String },
  bio: { type: String, default: "" },
  website: { type: String, default: "" },
  location: { type: String, default: "" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  role: { type: String, default: 'user' },
  isVerified: { type: Boolean, default: false },
  profileViews: { type: Number, default: 0 },

  // OTP / reset fields (explicit)
  tempOtp: { type: String },                 // registration OTP (transient)
  resetOtp: { type: String, select: false }, // password reset OTP
  resetOtpExpires: { type: Date }
}, { timestamps: true }); // createdAt & updatedAt automatically handled

module.exports = mongoose.model('User', userSchema);
