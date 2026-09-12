import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralized, validated environment configuration.
 * Everything reads config from here (never process.env directly),
 * so defaults and fallbacks live in one place.
 */
const toInt = (val, fallback) => {
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  port: toInt(process.env.PORT, 5000),

  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  db: {
    uri: process.env.MONGODB_URI || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  bcryptSaltRounds: toInt(process.env.BCRYPT_SALT_ROUNDS, 10),

  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'whisper-large-v3-turbo',
    get enabled() {
      return Boolean(process.env.GEMINI_API_KEY);
    },
    get groqEnabled() {
      return Boolean(process.env.GROQ_API_KEY);
    },
  },

  storage: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    localDir: process.env.UPLOAD_LOCAL_DIR || 'uploads',
    maxUploadMb: toInt(process.env.MAX_UPLOAD_MB, 10),
    get cloudinaryEnabled() {
      return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
          process.env.CLOUDINARY_API_KEY &&
          process.env.CLOUDINARY_API_SECRET
      );
    },
  },

  email: {
    host: process.env.SMTP_HOST || '',
    port: toInt(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'no-reply@sutra.app',
    get enabled() {
      return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
    },
  },

  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: toInt(process.env.RATE_LIMIT_MAX, 300),
  },
};

export default env;
