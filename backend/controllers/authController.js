// backend/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/email');

// --- Helper: Generate Token Pair ---
const createTokens = async (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

  // Store hashed refresh token in DB for security (Rotation)
  user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// --- Helper: Generate Unique Username ---
// Ensures users have a handle like @john1234 instead of just a name
const generateUsername = (name) => {
  const base = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); // Remove special chars
  const randomSuffix = Math.floor(Math.random() * 10000);
  return `${base}${randomSuffix}`;
};

// --- 1. REGISTER ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;
    
    // Check if user exists
    if (await User.findOne({ email })) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Handle Referral
    let referrer = null;
    if (referralCode) {
        referrer = await User.findOne({ referralCode });
    }

    const hashed = await bcrypt.hash(password, 12);
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    
    // Auto-generate username
    const username = generateUsername(name);

    const user = await User.create({
      name,
      email,
      username, // 🔥 Added: Critical for mentions
      password: hashed,
      isVerified: false, 
      referredBy: referrer ? referrer._id : null,
      wallet: { balance: 0 },
      tempOtp: otpHash,
      resetOtpExpires: Date.now() + 15 * 60 * 1000 // 15m expiry
    });

    // 🔥 SECURITY: Strict Email Check
    // In production, we MUST ensure the email is actually sent.
    // If SendGrid/Resend fails, we shouldn't leave a phantom unverified account.
    const emailSent = await sendOtpEmail(email, otp, 'Verify your account');

    if (!emailSent && process.env.NODE_ENV === 'production') {
        // Rollback: Delete the user if email failed so they can try again
        await User.findByIdAndDelete(user._id);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to send verification email. Please try again later.' 
        });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Register OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      success: true,
      message: 'OTP sent to email.',
      data: { email: user.email }
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// --- 2. LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).select('+password +is2FAEnabled');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Handle 2FA
    if (user.is2FAEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.tempOtp = await bcrypt.hash(otp, 10);
      user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
      await user.save();
      
      const emailSent = await sendOtpEmail(user.email, otp, '2FA Verification Code');
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] 2FA OTP for ${email}: ${otp}`);
      }

      if (!emailSent && process.env.NODE_ENV === 'production') {
          return res.status(500).json({ success: false, message: "Failed to send 2FA code" });
      }

      return res.json({
        success: true,
        message: 'OTP sent to email',
        data: { requires2FA: true, email: user.email }
      });
    }

    const tokens = await createTokens(user);
    res.json({
      success: true,
      data: { ...tokens, user }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// --- 3. VERIFY OTP ---
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email }).select('+tempOtp +resetOtpExpires +wallet');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isVerified && !user.tempOtp) {
        return res.json({ success: true, message: 'Already verified', data: { user } });
    }

    // 🔥 SECURITY: STRICT Master OTP Check
    const isDev = process.env.NODE_ENV === 'development';
    const isMaster = isDev && process.env.MASTER_OTP && otp === process.env.MASTER_OTP;

    if (!isMaster) {
      if (user.resetOtpExpires < Date.now()) {
        return res.status(400).json({ success: false, message: 'OTP expired' });
      }
      const isMatch = await bcrypt.compare(otp, user.tempOtp);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Verification Success
    user.isVerified = true;
    user.tempOtp = undefined;
    user.resetOtpExpires = undefined;

    // Sign-up / Referral Bonus Logic
    if (user.wallet.balance === 0) {
       // Only apply bonus if balance is 0 (new user)
       if (user.referredBy) {
           const referrer = await User.findById(user.referredBy);
           if (referrer) {
               referrer.wallet.balance += 50;
               await referrer.save();
               user.wallet.balance += 50; 
           }
       } else {
           user.wallet.balance += 10; // Standard bonus
       }
    }

    await user.save();
    const tokens = await createTokens(user);

    res.json({
      success: true,
      data: { ...tokens, user }
    });

  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// --- 4. GOOGLE LOGIN ---
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "No token provided" });

    const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { email, name, picture, sub: googleId } = googleRes.data;
    let user = await User.findOne({ email });

    if (!user) {
      // 🔥 FIX: Generate username for Google users so they have a handle
      const username = generateUsername(name);

      user = await User.create({
        name,
        email,
        username, // Added this field
        googleId,
        avatar: picture,
        isVerified: true,
        wallet: { balance: 20 }
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
      await user.save();
    }

    const tokens = await createTokens(user);
    res.json({ success: true, data: { ...tokens, user } });

  } catch (err) {
    console.error("Google Login Error:", err.message);
    res.status(500).json({ success: false, message: 'Google login failed' });
  }
};

// --- 5. REFRESH TOKEN ---
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // Explicitly return 401 if no token, frontend will catch this and logout
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No token provided' });

    // Verify signature
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
        return res.status(403).json({ success: false, message: 'Token expired or invalid signature' });
    }

    // Find user
    const user = await User.findById(decoded.id).select('+refreshToken +isDeleted');
    if (!user || user.isDeleted) return res.status(403).json({ success: false, message: 'User invalid' });

    // Verify Hash Match (Detect Reuse)
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (user.refreshToken !== hashedToken) {
      // Reuse detected! Nuke the session.
      user.refreshToken = null; 
      await user.save({ validateBeforeSave: false });
      return res.status(403).json({ success: false, message: 'Invalid refresh token (Reuse detected)' });
    }

    // Issue new pair
    const tokens = await createTokens(user);
    
    res.json({
      success: true,
      data: { token: tokens.accessToken, refreshToken: tokens.refreshToken }
    });

  } catch (err) {
    console.error("Refresh Error:", err.message);
    return res.status(403).json({ success: false, message: 'Server error during refresh' });
  }
};

// --- 6. LOGOUT ---
exports.logout = async (req, res) => {
    try {
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
        }
        res.json({ success: true, message: 'Logged out' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
};

// --- 7. PASSWORD RESET ---
exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = await bcrypt.hash(otp, 10);
        user.resetOtpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        const emailSent = await sendOtpEmail(email, otp, 'Password Reset Code');
        
        if (process.env.NODE_ENV === 'development') console.log(`[DEV] Reset OTP: ${otp}`);
        
        if (!emailSent && process.env.NODE_ENV === 'production') {
            return res.status(500).json({ success: false, message: "Failed to send reset email" });
        }

        res.json({ success: true, message: 'Reset code sent' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email, resetOtpExpires: { $gt: Date.now() } }).select('+resetOtp');

        if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired code' });

        const isDev = process.env.NODE_ENV === 'development';
        const isMaster = isDev && process.env.MASTER_OTP && otp === process.env.MASTER_OTP;

        if (!isMaster) {
            if (!(await bcrypt.compare(otp, user.resetOtp))) {
                return res.status(400).json({ success: false, message: 'Invalid code' });
            }
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.resetOtp = undefined;
        user.resetOtpExpires = undefined;
        user.refreshToken = null; // Force logout everywhere
        await user.save();

        res.json({ success: true, message: 'Password updated' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Exports for reuse (optional)
exports.createTokens = createTokens;