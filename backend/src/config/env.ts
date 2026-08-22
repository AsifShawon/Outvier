import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters long'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().min(1, 'FRONTEND_URL is required'),
  ENABLE_ADMIN_SEEDER: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  ADMIN_SEED_PASSWORD: z.string().optional(),
  DEFAULT_AI_PROVIDER: z.string().default('groq'),
  GROQ_API_KEY: z.string().optional(),
  CRICOS_CKAN_BASE_URL: z.string().default('https://data.gov.au/data/api/action'),
  CRICOS_SYNC_LIMIT: z.coerce.number().default(5000),
  CRICOS_SYNC_USE_TOKEN: z.coerce.boolean().default(false),
  DATA_GOV_AU_API_TOKEN: z.string().optional(),
  INGESTION_CONCURRENCY: z.coerce.number().default(2),
  CRAWLER_USER_AGENT: z.string().default('OutvierBot/1.0 (+https://outvier.com/bot)'),
  CRAWLER_RATE_LIMIT_MS: z.coerce.number().default(1500),
  MAX_PAGES_PER_UNIVERSITY: z.coerce.number().default(80),
  MAX_PROGRAMS_PER_UNIVERSITY: z.coerce.number().default(200),
  ENCRYPTION_SECRET: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    console.error('❌ Environment validation failed:', errorDetails);
    throw new Error(`Invalid environment configuration: ${errorDetails}`);
  }

  const env = parsed.data;

  // Strict check: if admin seeder is enabled, require strong password
  if (env.ENABLE_ADMIN_SEEDER) {
    if (!env.ADMIN_SEED_PASSWORD || env.ADMIN_SEED_PASSWORD.length < 8 || env.ADMIN_SEED_PASSWORD === 'admin123' || env.ADMIN_SEED_PASSWORD === 'password') {
      throw new Error('ENABLE_ADMIN_SEEDER is true but ADMIN_SEED_PASSWORD is missing or insecure (must be >= 8 characters and non-default).');
    }
  }

  if (env.NODE_ENV === 'production') {
    const productionErrors: string[] = [];

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      productionErrors.push('JWT_SECRET must be explicitly set to a secure key of at least 32 characters in production.');
    }

    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
      productionErrors.push('JWT_REFRESH_SECRET must be explicitly set to a secure key of at least 32 characters in production.');
    }

    if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.length < 32) {
      productionErrors.push('COOKIE_SECRET must be explicitly set to a secure key of at least 32 characters in production.');
    }

    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost') || process.env.MONGODB_URI.includes('127.0.0.1')) {
      productionErrors.push('MONGODB_URI must be set to a production database URI.');
    }

    if (!process.env.REDIS_URL || process.env.REDIS_URL.includes('localhost') || process.env.REDIS_URL.includes('127.0.0.1')) {
      productionErrors.push('REDIS_URL must be set to a production Redis instance.');
    }

    if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL.includes('localhost')) {
      productionErrors.push('FRONTEND_URL must be explicitly configured in production.');
    }

    if (productionErrors.length > 0) {
      console.error('❌ Production environment configuration errors:');
      productionErrors.forEach((err) => console.error(`  - ${err}`));
      throw new Error(`Production environment validation failed: ${productionErrors.join('; ')}`);
    }
  }

  return env;
}

export const env = validateEnv();
