// backend/routes/auth.js

const express = require('express');
const router = express.Router();

// Middleware
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { protect } = require('../middleware/authMiddleware');

// Validators
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  requestResetSchema,
  resetPasswordSchema,
  googleLoginSchema,
} = require('../validators/authValidator');

// Controller
const authController = require('../controllers/authController');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Register
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

// Verify OTP
router.post(
  '/verify-otp',
  authLimiter,
  validate(verifyOtpSchema),
  authController.verifyOtp
);

// Login
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

// Google Login
router.post(
  '/google-login',
  authLimiter,
  validate(googleLoginSchema),
  authController.googleLogin
);

// Refresh Token
router.post(
  '/refresh',
  authLimiter,
  authController.refresh
);

// Request Password Reset
router.post(
  '/request-reset',
  authLimiter,
  validate(requestResetSchema),
  authController.requestPasswordReset
);

// Reset Password
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ==========================================
// PROTECTED ROUTES
// ==========================================

// Logout
router.post(
  '/logout',
  protect,
  authController.logout
);

// Logout All Other Sessions
router.post(
  '/logout-all',
  protect,
  authController.logoutAll
);

module.exports = router;