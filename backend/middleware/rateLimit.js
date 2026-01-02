const rateLimit = require('express-rate-limit');

// Generic limiter (safe default for all routes)
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300, // per IP
  message: { message: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter (login, register, otp) - Brute force protection
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, 
  message: { message: 'Too many login/register attempts, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat limiter - Spam protection
exports.chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 1 message per second average
  message: { message: 'You are sending messages too fast' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Game / Reward limiter - Abuse protection
exports.gameLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 100, 
  message: { message: 'Too many game submissions' },
  standardHeaders: true,
  legacyHeaders: false,
});