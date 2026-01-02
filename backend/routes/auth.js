// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimit');
const { protect } = require('../middleware/authMiddleware'); // 🔥 Needed for logout

// Public Routes (Rate Limited)
router.post('/register', authLimiter, authController.register);
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/login', authLimiter, authController.login);
router.post('/google-login', authLimiter, authController.googleLogin);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/request-reset', authLimiter, authController.requestPasswordReset);
router.post('/reset-password', authLimiter, authController.resetPassword);

// Protected Routes
router.post('/logout', protect, authController.logout); // 🔥 NEW

module.exports = router;