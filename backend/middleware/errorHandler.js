// backend/middleware/errorHandler.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  logger.error(err?.stack || err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid resource ID';
  }

  if (err?.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field || 'Record'} already exists`;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    errors = Object.values(err.errors).map((v) => v.message);
    message = errors.join(', ');
  }

  if (err?.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err?.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (err?.name === 'ZodError') {
    statusCode = 400;
    errors = (err.issues || []).map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};