import { z } from 'zod';

const frontendEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().default('http://localhost:5000/api/v1'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export function getFrontendEnv() {
  const env = frontendEnvSchema.parse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (process.env.NODE_ENV === 'production' && (!process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL.includes('localhost'))) {
    console.warn('⚠️ Warning: NEXT_PUBLIC_API_BASE_URL is not set to a production URL.');
  }

  return env;
}

export const env = getFrontendEnv();
