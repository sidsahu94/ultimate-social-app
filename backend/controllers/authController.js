const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Token Generator
const createToken = (payload, expiresIn = '7d') =>
  jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn });

// --- REGISTER (AUTO-VERIFIED) ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already registered' });

    // Handle Referral
    let referrer = null;
    if (referralCode) {
        referrer = await User.findOne({ referralCode });
    }

    const hashed = await bcrypt.hash(password, 12);
    
    user = new User({
      name,
      email,
      password: hashed,
      // ✨ AUTO-VERIFY: No email OTP needed anymore
      isVerified: true, 
      referredBy: referrer ? referrer._id : null,
      wallet: { balance: referrer ? 50 : 0 } // Bonus for being referred
    });
    
    await user.save();

    // Reward Referrer
    if (referrer) {
        referrer.wallet.balance += 50;
        await referrer.save();
    }

    const token = createToken({ id: user._id });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (!user.password) return res.status(400).json({ message: 'Please login with Google' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = createToken({ id: user._id });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GOOGLE LOGIN ---
exports.googleLogin = async (req, res) => {
  try {
    const { token: accessToken } = req.body; 
    if (!accessToken) return res.status(400).json({ message: "No access token" });

    const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    const { email, name, picture, sub: googleId } = googleRes.data;
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        name, email, googleId, avatar: picture, isVerified: true,
        password: await bcrypt.hash(Math.random().toString(36), 12) 
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }

    const jwtToken = createToken({ id: user._id });
    res.json({ token: jwtToken, user });

  } catch (err) {
    res.status(500).json({ message: 'Google login failed' });
  }
};

// Keep existing OTP stubs if needed for legacy compatibility, but they aren't used for reg anymore
exports.verifyOtp = async (req, res) => res.json({ message: 'Already verified' });
exports.requestPasswordReset = async (req, res) => res.json({ message: 'Feature disabled in Zero-Config mode' });
exports.resetPassword = async (req, res) => res.json({ message: 'Feature disabled' });