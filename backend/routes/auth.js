// backend/routes/auth.js

const express = require('express');
const router = express.Router();

// Middleware
const validate = require('../middleware/validate');
const { authLimiter, otpLimiter, passwordResetLimiter } = require('../middleware/rateLimit');
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

// Check username availability
router.get('/check-username', authController.checkUsername);

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
  otpLimiter,
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
  passwordResetLimiter,
  validate(requestResetSchema),
  authController.requestPasswordReset
);

// Reset Password
router.post(
  '/reset-password',
  passwordResetLimiter,
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