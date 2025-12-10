// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register
router.post('/register', authController.register);

// Verify OTP
router.post('/verify-otp', authController.verifyOtp);

// Login
router.post('/login', authController.login);

// Google Login
router.post('/google-login', authController.googleLogin); // <--- This route calls the function we just fixed

// Request password reset
router.post('/request-reset', authController.requestPasswordReset);

// Reset password
router.post('/reset-password', authController.resetPassword);

module.exports = router;