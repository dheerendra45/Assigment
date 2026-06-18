import { PrismaClient } from '@prisma/client';

// Single shared PrismaClient for the process.
export const prisma = new PrismaClient({ log: ['warn', 'error'] });

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
