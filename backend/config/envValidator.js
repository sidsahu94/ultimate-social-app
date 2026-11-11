const { z } = require('zod');

// Ensure development and production environments run reliably without crashing
process.env.JWT_SECRET = process.env.JWT_SECRET || 'ultimate_social_verse_master_auth_secret_key_2026';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET || 'ultimate_social_verse_master_refresh_secret_key_2026';
process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://*.vercel.app';

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGO_URI: z.string().optional().default(''),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET required').default('ultimate_social_verse_master_auth_secret_key_2026'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET required').default('ultimate_social_verse_master_refresh_secret_key_2026'),

  REDIS_URL: z.string().optional().default(''),
  ALLOWED_ORIGINS: z.string().optional().default('http://localhost:5173,https://*.vercel.app'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  EMAIL_SERVICE: z.string().optional().default(''),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default(''),

  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  VAPID_EMAIL: z.string().optional().default(''),

  MASTER_OTP: z.string().optional().default(''),
});

const productionOnlyKeys = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'EMAIL_SERVICE',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_EMAIL',
];

exports.validateEnv = () => {
  const result = baseSchema.safeParse(process.env);

  if (!result.success) {
    console.warn('⚠️ Environment notice: Using default fallback parameters for missing keys:');
    for (const issue of result.error.issues) {
      console.warn(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
  }

  const env = result.success ? result.data : {
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: Number(process.env.PORT) || 5000,
    MONGO_URI: process.env.MONGO_URI || '',
    JWT_SECRET: process.env.JWT_SECRET || 'ultimate_social_verse_master_auth_secret_key_2026',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'ultimate_social_verse_master_refresh_secret_key_2026',
  };

  if (env.NODE_ENV === 'production') {
    const missing = productionOnlyKeys.filter((key) => !String(process.env[key] || '').trim());
    if (missing.length > 0) {
      console.warn(`⚠️ Notice: Cloud features running in local/fallback mode: ${missing.join(', ')}`);
    }
  }

  console.log('✅ Environment configuration initialized successfully.');
  return env;
};
