// backend/middleware/requestLogger.js

const logger = require('../utils/logger');

module.exports = (req, res, next) => {

  // Skip static assets
  const ignored = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.ico',
    '.webp',
    '.map'
  ];

  const shouldIgnore = ignored.some(ext =>
    req.originalUrl.endsWith(ext)
  );

  if (shouldIgnore) {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {

    const duration = Date.now() - start;

    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );

  });

  next();
};