import { prisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';
import { Errors } from '../utils/AppError.js';

const publicSelect = { id: true, name: true, email: true, role: true, organizationId: true, createdAt: true };

export async function listUsers(organizationId) {
  return prisma.user.findMany({ where: { organizationId }, select: publicSelect, orderBy: { createdAt: 'asc' } });
}

export async function createUser(organizationId, { name, email, password, role }) {
  if (await prisma.user.findUnique({ where: { email } })) {
    throw Errors.conflict('A user with this email already exists');
  }
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: { name, email, passwordHash, role: role ?? 'MEMBER', organizationId },
    select: publicSelect,
  });
}

export async function updateUserRole(organizationId, userId, role) {
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
  if (!user) throw Errors.notFound('User not found');
  return prisma.user.update({ where: { id: userId }, data: { role }, select: publicSelect });
}

export async function deleteUser(organizationId, userId, requesterId) {
  if (userId === requesterId) throw Errors.validation('You cannot delete your own account');
  const user = await prisma.user.findFirst({ where: { id: userId, organizationId } });
  if (!user) throw Errors.notFound('User not found');
  await prisma.user.delete({ where: { id: userId } });
}
