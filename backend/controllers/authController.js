const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto'); 
const { sendOtpEmail } = require('../utils/email'); 

// Helper: Generate Token Pair
const createTokens = async (user) => {
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET || 'refreshsecret', { expiresIn: '7d' });
    
    // Store hashed refresh token
    user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

// --- REGISTER ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already registered' });

    let referrer = null;
    if (referralCode) {
        referrer = await User.findOne({ referralCode });
    }

    const hashed = await bcrypt.hash(password, 12);
    
    user = new User({
      name,
      email,
      password: hashed,
      isVerified: true, 
      referredBy: referrer ? referrer._id : null,
      wallet: { balance: referrer ? 50 : 0 }
    });
    
    await user.save();

    if (referrer) {
        referrer.wallet.balance += 50;
        await referrer.save();
    }

    const { accessToken, refreshToken } = await createTokens(user);
    res.status(201).json({ token: accessToken, refreshToken, user });
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

    const { accessToken, refreshToken } = await createTokens(user);
    
    res.json({ token: accessToken, refreshToken, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- GOOGLE LOGIN ---
exports.googleLogin = async (req, res) => {
  try {
    const { token: accessTokenInput } = req.body; 
    if (!accessTokenInput) return res.status(400).json({ message: "No access token" });

    const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessTokenInput}` }
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
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }

    const { accessToken, refreshToken } = await createTokens(user);
    res.json({ token: accessToken, refreshToken, user });

  } catch (err) {
    console.error("Google login error:", err.message);
    res.status(500).json({ message: 'Google login failed' });
  }
};

// --- REFRESH TOKEN (Rotation) ---
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No token provided' });

    // 1. Verify the token signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refreshsecret');

    // 2. Check if user exists (Select +refreshToken AND +isDeleted)
    const user = await User.findById(decoded.id).select('+refreshToken +isDeleted');
    
    if (!user) return res.status(401).json({ message: 'User not found' });

    if (user.isDeleted) {
        return res.status(403).json({ message: 'Account deactivated' });
    }

    // 3. Verify the token matches the hash in DB
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    
    if (user.refreshToken !== hashedToken) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
        return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // 4. Rotate: Issue NEW pair and save new hash
    const tokens = await createTokens(user);
    
    res.json({ 
        token: tokens.accessToken, 
        refreshToken: tokens.refreshToken 
    });

  } catch (err) {
    return res.status(403).json({ message: 'Token expired or invalid' });
  }
};

// --- LOGOUT ---
exports.logout = async (req, res) => {
  try {
    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Logout failed' });
  }
};

// Legacy Stub
exports.verifyOtp = async (req, res) => res.json({ message: 'Already verified' });

// --- PASSWORD RESET LOGIC ---
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();

    try {
        const sent = await sendOtpEmail(email, otp, 'Password Reset Code');
        if (!sent) console.log(`[DEV MODE] Password Reset OTP for ${email}: ${otp}`);
    } catch (emailErr) {
        console.log(`[DEV MODE - Email Failed] OTP for ${email}: ${otp}`);
    }

    res.json({ message: 'Reset code sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ 
        email, 
        resetOtpExpires: { $gt: Date.now() } 
    }).select('+resetOtp');

    if (!user) return res.status(400).json({ message: 'Invalid or expired code' });

    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) return res.status(400).json({ message: 'Invalid code' });

    user.password = await bcrypt.hash(newPassword, 12);
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    
    // 🔥 CRITICAL SECURITY FIX: Invalidate existing sessions
    user.refreshToken = null; 

    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};