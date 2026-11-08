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