// Wrapper to eliminate try-catch blocks in controllers
module.exports = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);