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
    
    // 🔥 FIX: Removed .select('-password +isDeleted') which caused the projection error
    // 'password' is excluded by default in schema
    // 'isDeleted' is included by default in schema
    const user = await User.findById(decoded.id); 
    
    if (!user || user.isDeleted) {
        return res.status(401).json({ message: 'Account deactivated or user not found' });
    }

    req.user = user;
    req.userId = String(user._id);
    req.user.id = String(user._id);
    next();
  } catch (err) {
    // console.error('protect middleware error:', err.message); // Optional: Uncomment to debug
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
      // 🔥 FIX: Simplified query here too
      const user = await User.findById(decoded.id);
      
      if (user && !user.isDeleted) {
        req.user = user;
        req.userId = String(user._id);
        req.user.id = String(user._id);
      }
    } catch (e) {}
    return next();
  } catch (err) {
    return next();
  }
}

function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (req.user.role !== role) return res.status(403).json({ message: 'Forbidden: requires ' + role });
    next();
  };
}

function adminOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admins only' });
}

module.exports = { protect, optionalAuth, restrictTo, requireRole, adminOnly };