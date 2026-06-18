// JWT + refresh-token helpers.
//
// Access tokens are short-lived JWTs carrying the user's identity, role and
// org. Refresh tokens are opaque random strings; only a SHA-256 hash is stored
// in the database so a DB leak cannot be replayed against the API.
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

// Opaque refresh token. We sign a JWT too so we can cheaply read its expiry,
// but the security-relevant part is the random jti that we hash and persist.
export function generateRefreshToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { sub: user.id, jti },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn },
  );
  return { token, jti };
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

// Hash the raw refresh token before storing / comparing.
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Resolve a duration string like "7d" / "15m" into an absolute Date.
export function expiryFromNow(duration) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  if (!match) {
    // Fall back to 7 days if the format is unexpected.
    return new Date(Date.now() + 7 * ms.d);
  }
  const [, value, unit] = match;
  return new Date(Date.now() + Number(value) * ms[unit]);
}
