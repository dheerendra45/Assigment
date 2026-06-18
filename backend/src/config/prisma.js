// Single shared PrismaClient instance for the whole process.
import { PrismaClient } from '@prisma/client';
import { isProduction } from './env.js';

export const prisma = new PrismaClient({
  log: isProduction ? ['warn', 'error'] : ['warn', 'error'],
});

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
