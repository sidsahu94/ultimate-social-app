const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto'); 
const { sendOtpEmail } = require('../utils/email'); 

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
      // ✨ AUTO-VERIFY: No email OTP needed anymore for standard flow
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
        name, 
        email, 
        googleId, 
        avatar: picture, 
        isVerified: true,
        // 🔥 FIX: Password left undefined. 
        // This allows 'updatePassword' to detect it's a first-time setup.
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google ID to existing account if matching email
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }

    const jwtToken = createToken({ id: user._id });
    res.json({ token: jwtToken, user });

  } catch (err) {
    console.error("Google login error:", err.message);
    res.status(500).json({ message: 'Google login failed' });
  }
};

// Legacy Stub
exports.verifyOtp = async (req, res) => res.json({ message: 'Already verified' });

// --- PASSWORD RESET LOGIC ---

// 1. Request Reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash it for security before saving
    user.resetOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Send Email
    try {
        const sent = await sendOtpEmail(email, otp, 'Password Reset Code');
        if (!sent) {
            console.log(`[DEV MODE] Password Reset OTP for ${email}: ${otp}`);
        }
    } catch (emailErr) {
        console.log(`[DEV MODE - Email Failed] OTP for ${email}: ${otp}`);
    }

    res.json({ message: 'Reset code sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Complete Reset
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ 
        email, 
        resetOtpExpires: { $gt: Date.now() } 
    }).select('+resetOtp');

    if (!user) return res.status(400).json({ message: 'Invalid or expired code' });

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) return res.status(400).json({ message: 'Invalid code' });

    // Update Password
    user.password = await bcrypt.hash(newPassword, 12);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};