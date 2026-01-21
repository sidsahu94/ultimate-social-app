// backend/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  // Always log full error on server side for debugging
  console.error('🔥 ERROR:', err);

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    // 🔥 SECURITY FIX: strictly hide stack in production
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err })
  });
};