// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/email');
const axios = require('axios'); // We use axios to fetch user info from Google

// Token Generator Helper
const createToken = (payload, expiresIn = process.env.JWT_EXPIRE || '7d') =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

// --- REGISTER ---
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    user = new User({ name, email, password: hashed });
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.tempOtp = otp;
    
    await user.save();
    
    // Attempt to send email, but don't block if it fails (dev mode)
    try {
        await sendOtpEmail(email, otp);
    } catch (e) {
        console.warn("Email send failed:", e.message);
    }

    const token = createToken({ id: user._id });
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- VERIFY OTP ---
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+tempOtp');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (String(user.tempOtp) !== String(otp)) return res.status(400).json({ message: 'Invalid OTP' });

    user.tempOtp = undefined;
    user.isVerified = true;
    await user.save();
    res.json({ message: 'Verified' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
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

// --- GOOGLE LOGIN (FIXED) ---
exports.googleLogin = async (req, res) => {
  try {
    // 1. Get the Access Token from frontend
    const { token: accessToken } = req.body; 
    
    if (!accessToken) {
        return res.status(400).json({ message: "No access token provided" });
    }

    // 2. Fetch User Info from Google using the Access Token
    const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    const { email, name, picture, sub: googleId } = googleRes.data;

    // 3. Find or Create User
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        avatar: picture,
        isVerified: true,
        // Generate a random password placeholder so normal login doesn't crash if tried
        password: await bcrypt.hash(Math.random().toString(36), 12) 
      });
      await user.save();
    } else {
      // Update existing user with Google ID if missing
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.avatar) user.avatar = picture;
        await user.save();
      }
    }

    // 4. Generate JWT for our app
    const jwtToken = createToken({ id: user._id });
    
    res.json({ token: jwtToken, user });

  } catch (err) {
    console.error('Google login error details:', err.response?.data || err.message);
    res.status(500).json({ message: 'Google login failed', error: err.message });
  }
};

// --- PASSWORD RESET REQUEST ---
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = Date.now() + 1000 * 60 * 15; // 15 mins
    await user.save();
    
    try {
        await sendOtpEmail(email, otp, 'Password Reset OTP');
    } catch(e) {
        console.warn("Reset email failed");
    }
    
    res.json({ message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- PASSWORD RESET CONFIRM ---
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+password +resetOtp +resetOtpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (!user.resetOtp || String(user.resetOtp) !== String(otp) || Date.now() > user.resetOtpExpires)
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