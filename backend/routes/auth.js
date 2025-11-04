// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register
router.post('/register', authController.register);

// Verify OTP (after register)
router.post('/verify-otp', authController.verifyOtp);

// Login
router.post('/login', authController.login);

// Google Login (send idToken from client)
router.post('/google-login', authController.googleLogin);

// Request password reset (send OTP)
router.post('/request-reset', authController.requestPasswordReset);

// Reset password (with OTP)
router.post('/reset-password', authController.resetPassword);

module.exports = router;
