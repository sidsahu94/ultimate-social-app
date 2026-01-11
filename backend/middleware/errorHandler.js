// backend/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  // Log error for debugging
  console.error('🔥 ERROR:', err);

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    // Include stack trace only in development for easier debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err })
  });
};