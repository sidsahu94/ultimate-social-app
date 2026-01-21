// middleware/validators.js
const { body, validationResult } = require('express-validator');

exports.validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];