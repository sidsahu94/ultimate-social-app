// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    req.userId = String(user._id);
    req.user.id = String(user._id);
    next();
  } catch (err) {
    console.error('protect middleware error:', err && err.message ? err.message : err);
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
}

async function optionalAuth(req, res, next) {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) return next();

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        req.userId = String(user._id);
        req.user.id = String(user._id);
      }
    } catch (e) {
      // ignore invalid token
    }
    return next();
  } catch (err) {
    console.error('optionalAuth middleware error:', err && err.message ? err.message : err);
    return next();
  }
}

function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return next();
    } catch (err) {
      console.error('restrictTo error:', err && err.message ? err.message : err);
      return res.status(500).json({ message: 'Server error' });
    }
  };
}

function requireRole(role) {
  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
      if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden: requires ' + role });
      next();
    } catch (err) {
      console.error('requireRole error:', err && err.message ? err.message : err);
      res.status(500).json({ message: 'Server error' });
    }
  };
}

function adminOnly(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (req.user.isAdmin || req.user.role === 'admin') return next();
    return res.status(403).json({ message: 'Admins only' });
  } catch (err) {
    console.error('adminOnly error:', err && err.message ? err.message : err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { protect, optionalAuth, restrictTo, requireRole, adminOnly };
