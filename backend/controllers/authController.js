// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/email');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (payload, expiresIn = process.env.JWT_EXPIRE || '7d') =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    user = new User({ name, email, password: hashed });
    await user.save();

    // send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // store otp temporarily in-memory (for simple demo). In production store hashed OTP with expiry.
    user.tempOtp = otp;
    await user.save();
    await sendOtpEmail(email, otp);

    const token = createToken({ id: user._id });
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.tempOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    user.tempOtp = undefined;
    user.isVerified = true;
    await user.save();
    res.json({ message: 'Verified' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (!user.password) return res.status(400).json({ message: 'Please login with OAuth or reset password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = createToken({ id: user._id });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name,
        email,
        googleId,
        avatar: picture,
        isVerified: true,
      });
      await user.save();
    } else {
      // link google if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = user.avatar || picture;
        await user.save();
      }
    }

    const token = createToken({ id: user._id });
    res.json({ token, user });
  } catch (err) {
    console.error('google login err', err);
    res.status(500).json({ message: 'Google login failed', error: err.message });
  }
};

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();
    await sendOtpEmail(email, otp, 'Password Reset OTP');
    res.json({ message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+password +resetOtp +resetOtpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.resetOtp || user.resetOtp !== otp || Date.now() > user.resetOtpExpires)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
