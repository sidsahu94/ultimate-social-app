const { z } = require('zod');

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  REDIS_URL: z.string().optional().default(''),
  ALLOWED_ORIGINS: z.string().optional().default('http://localhost:5173'),

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
    console.error('🚨 FATAL ERROR: Invalid environment variables');
    for (const issue of result.error.issues) {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  const env = result.data;

  if (env.NODE_ENV === 'production') {
    const missing = productionOnlyKeys.filter((key) => !String(process.env[key] || '').trim());

    if (missing.length > 0) {
      console.error('🚨 FATAL ERROR: Missing production environment variables');
      for (const key of missing) {
        console.error(`   - ${key} is required in production`);
      }
      process.exit(1);
    }

    if (String(process.env.MASTER_OTP || '').trim()) {
      throw new Error('MASTER_OTP cannot be used in production');
    }
  }

  console.log('✅ Environment variables validated successfully.');
  return env;
};