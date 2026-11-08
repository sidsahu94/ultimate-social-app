const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const getKey = (req) => {
  if (req.user?._id) {
    return `user:${req.user._id}`;
  }

  return ipKeyGenerator(req.ip);
};

const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    keyGenerator: getKey,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message,
    },
  });

exports.generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests, try again later',
});

exports.authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts',
});

exports.chatLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Message rate exceeded',
});

exports.gameLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: 'Too many submissions',
});

exports.financialLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: 'Financial limit reached',
});

exports.uploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many uploads, try again later',
});

exports.passwordResetLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset attempts',
});

exports.otpLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many OTP attempts',
});