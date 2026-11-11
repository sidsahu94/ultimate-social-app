require('dotenv').config();

const csvToArray = (value, fallback = []) => {
  if (!value || typeof value !== 'string') return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number.parseInt(process.env.PORT || '5000', 10),

  MONGO_URI: process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'ultimate_social_verse_master_auth_secret_key_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET || 'ultimate_social_verse_master_refresh_secret_key_2026',

  REDIS_URL: process.env.REDIS_URL || '',
  ALLOWED_ORIGINS: csvToArray(process.env.ALLOWED_ORIGINS, ['http://localhost:5173', 'https://*.vercel.app']),

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  },

  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE || 'gmail',
    USER: process.env.EMAIL_USER || '',
    PASS: process.env.EMAIL_PASS || '',
    FROM: process.env.EMAIL_FROM || 'admin@socialapp.com',
  },

  VAPID: {
    PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
    PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
    EMAIL: process.env.VAPID_EMAIL || '',
  },
};

module.exports = config;
