// backend/controllers/authController.js
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
    
    // Store hashed refresh token in DB
    user.refreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

// --- 1. REGISTER (Send OTP) ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already registered' });

    // Handle Referral Lookup (Don't award yet)
    let referrer = null;
    if (referralCode) {
        referrer = await User.findOne({ referralCode });
    }

    const hashed = await bcrypt.hash(password, 12);
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // Create User (Unverified)
    user = new User({
      name,
      email,
      password: hashed,
      isVerified: false, // 🔥 Critical: User cannot login yet
      referredBy: referrer ? referrer._id : null,
      wallet: { balance: 0 }, // Bonus added after verification
      // Store OTP temporarily
      tempOtp: otpHash,
      resetOtpExpires: Date.now() + 15 * 60 * 1000 // 15 Minutes expiry
    });
    
    await user.save();

    // Send Email
    const emailSent = await sendOtpEmail(email, otp, 'Verify your account');
    
    // Dev Helper: Log OTP if email fails or in dev mode
    if (process.env.NODE_ENV === 'development' || !emailSent) {
        console.log(`[DEV MODE] Verification OTP for ${email}: ${otp}`);
    }

    res.status(201).json({ 
        message: 'OTP sent to email. Please verify.', 
        email: user.email 
    });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- 2. VERIFY ACCOUNT (Exchange OTP for Tokens) ---
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Explicitly select hidden OTP fields
    const user = await User.findOne({ email }).select('+tempOtp +resetOtpExpires');

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.json({ message: 'Already verified', user }); // Idempotency

    // Check Expiry
    if (user.resetOtpExpires < Date.now()) {
        return res.status(400).json({ message: 'OTP expired. Please register again or request resend.' });
    }

    // Validate OTP
    const isMatch = await bcrypt.compare(otp, user.tempOtp);
    if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });

    // Mark Verified & Clean up
    user.isVerified = true;
    user.tempOtp = undefined;
    user.resetOtpExpires = undefined;
    
    // 🔥 Award Referral Bonus Now (Prevents spam farming)
    if (user.referredBy) {
        const referrer = await User.findById(user.referredBy);
        if (referrer) {
            referrer.wallet.balance += 50;
            user.wallet.balance += 50; // Give new user a bonus too
            await referrer.save();
        }
    } else {
        user.wallet.balance += 10; // Small starting bonus for non-referrals
    }

    await user.save();

    // Issue Session Tokens
    const { accessToken, refreshToken } = await createTokens(user);
    res.json({ token: accessToken, refreshToken, user });

  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ... existing code ...

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    const user = await User.findOne({ email }).select('+password +is2FAEnabled'); // 🔥 Select is2FAEnabled
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // 🔥 NEW: 2FA Logic
    if (user.is2FAEnabled) {
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.tempOtp = await bcrypt.hash(otp, 10);
        user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        // Send Email
        await sendOtpEmail(user.email, otp, '2FA Verification Code');
        
        if (process.env.NODE_ENV === 'development') console.log(`[2FA] OTP for ${email}: ${otp}`);

        // Return special flag, NOT the token
        return res.json({ 
            requires2FA: true, 
            email: user.email, 
            message: 'OTP sent to email' 
        });
    }

    // Normal Login (No 2FA)
    const { accessToken, refreshToken } = await createTokens(user);
    res.json({ token: accessToken, refreshToken, user });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
// --- 4. GOOGLE LOGIN ---
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
        isVerified: true, // Google emails are trusted
        wallet: { balance: 20 } // Welcome bonus
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

// --- 5. REFRESH TOKEN (Rotation) ---
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No token provided' });

    // Verify signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refreshsecret');

    // Check DB
    const user = await User.findById(decoded.id).select('+refreshToken +isDeleted');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isDeleted) return res.status(403).json({ message: 'Account deactivated' });

    // Verify Hash Match
    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    if (user.refreshToken !== hashedToken) {
        // Reuse Detection: If token doesn't match, invalidate everything
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
        return res.status(403).json({ message: 'Invalid refresh token (Reuse detected)' });
    }

    // Rotate
    const tokens = await createTokens(user);
    res.json({ 
        token: tokens.accessToken, 
        refreshToken: tokens.refreshToken 
    });

  } catch (err) {
    return res.status(403).json({ message: 'Token expired or invalid' });
  }
};

// --- 6. LOGOUT ---
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

// --- 7. PASSWORD RESET REQUEST ---
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();

    const sent = await sendOtpEmail(email, otp, 'Password Reset Code');
    if (!sent) console.log(`[DEV MODE] Password Reset OTP for ${email}: ${otp}`);

    res.json({ message: 'Reset code sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- 8. RESET PASSWORD CONFIRM ---
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
    
    // Invalidate existing sessions
    user.refreshToken = null; 

    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};