// backend/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// Generic limiter (safe default for all routes)
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300, // per IP
  message: { success: false, message: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter (login, register, otp) - Brute force protection
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, 
  message: { success: false, message: 'Too many login attempts, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat limiter - Spam protection
exports.chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, 
  message: { success: false, message: 'You are sending messages too fast' },
});

// Game / Reward limiter - Abuse protection
exports.gameLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 100, 
  message: { success: false, message: 'Too many game submissions' },
});

// 🔥 NEW: Financial Limiter (Stricter for Wallet/Payouts)
exports.financialLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 financial actions per hour per IP
  message: { success: false, message: 'Financial transaction limit reached. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});