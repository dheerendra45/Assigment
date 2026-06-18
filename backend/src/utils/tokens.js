import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, organizationId: user.organizationId },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

export function generateRefreshToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: user.id, jti }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
  return { token, jti };
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

// Only the SHA-256 hash of a refresh token is ever stored.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function expiryFromNow(duration) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  if (!match) return new Date(Date.now() + 7 * ms.d);
  const [, value, unit] = match;
  return new Date(Date.now() + Number(value) * ms[unit]);
}
