import { prisma } from '../config/prisma.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  signAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  expiryFromNow,
} from '../utils/tokens.js';
import { env } from '../config/env.js';
import { Errors } from '../utils/AppError.js';

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId };
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = generateRefreshToken(user);
  await prisma.refreshToken.create({
    data: { tokenHash: hashToken(refreshToken), userId: user.id, expiresAt: expiryFromNow(env.jwt.refreshExpiresIn) },
  });
  return { accessToken, refreshToken };
}

// The first user of a new organization becomes its ADMIN.
export async function register({ organizationName, name, email, password }) {
  if (await prisma.user.findUnique({ where: { email } })) {
    throw Errors.conflict('A user with this email already exists');
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { name: organizationName } });
    return tx.user.create({ data: { name, email, passwordHash, role: 'ADMIN', organizationId: organization.id } });
  });
  return { user: publicUser(user), ...(await issueTokens(user)) };
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) throw Errors.invalidCredentials();
  return { user: publicUser(user), ...(await issueTokens(user)) };
}

// Rotation: validate the presented token, revoke it, issue a fresh pair.
export async function refresh(rawToken) {
  if (!rawToken) throw Errors.unauthorized('Refresh token is required');

  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw Errors.unauthorized('Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw Errors.unauthorized('Refresh token is no longer valid');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw Errors.unauthorized('User no longer exists');

  const { accessToken, refreshToken } = await prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    const access = signAccessToken(user);
    const { token: newRefresh } = generateRefreshToken(user);
    await tx.refreshToken.create({
      data: { tokenHash: hashToken(newRefresh), userId: user.id, expiresAt: expiryFromNow(env.jwt.refreshExpiresIn) },
    });
    return { accessToken: access, refreshToken: newRefresh };
  });

  return { user: publicUser(user), accessToken, refreshToken };
}

export async function logout(rawToken) {
  if (!rawToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(rawToken), revoked: false },
    data: { revoked: true },
  });
}
