// Centralized environment configuration.
// In local dev we load a .env file; in Docker the values come from the
// container environment, so a missing .env file is not an error.
import process from 'node:process';

try {
  // Node >= 20.6 ships process.loadEnvFile(). No external dotenv dependency.
  process.loadEnvFile();
} catch {
  // No .env file present (e.g. inside Docker) — rely on the real environment.
}

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),

  databaseUrl: required('DATABASE_URL'),
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};

export const isProduction = env.nodeEnv === 'production';
export const isTest = env.nodeEnv === 'test';
