// Password hashing helpers built on bcryptjs (pure-JS, no native build step,
// which keeps the Docker image simple).
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
