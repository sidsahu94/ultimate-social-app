// backend/utils/logger.js
const winston = require('winston');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');

const logger = winston.createLogger({

  level: 'info',

  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),

    winston.format.errors({
      stack: true
    }),

    winston.format.printf(({ level, message, timestamp, stack }) => {
      return stack
        ? `[${timestamp}] ${level.toUpperCase()}: ${stack}`
        : `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),

  transports: [

    // ERROR LOG FILE
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),

    // ALL LOGS FILE
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log')
    }),

  ],

});

// DEVELOPMENT CONSOLE LOGGING
if (process.env.NODE_ENV !== 'production') {

  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );

}

module.exports = logger;