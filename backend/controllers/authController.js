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