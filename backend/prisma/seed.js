// Idempotent demo data: an org with admin/manager/member accounts and tasks.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  const org = await prisma.organization.upsert({
    where: { id: 'seed-org-0000-0000-0000-000000000001' },
    update: {},
    create: { id: 'seed-org-0000-0000-0000-000000000001', name: 'Acme Inc.' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.test' },
    update: {},
    create: { name: 'Alice Admin', email: 'admin@acme.test', passwordHash, role: 'ADMIN', organizationId: org.id },
  });
  const manager = await prisma.user.upsert({
    where: { email: 'manager@acme.test' },
    update: {},
    create: { name: 'Mike Manager', email: 'manager@acme.test', passwordHash, role: 'MANAGER', organizationId: org.id },
  });
  const member = await prisma.user.upsert({
    where: { email: 'member@acme.test' },
    update: {},
    create: { name: 'Mia Member', email: 'member@acme.test', passwordHash, role: 'MEMBER', organizationId: org.id },
  });

  if ((await prisma.task.count({ where: { organizationId: org.id } })) === 0) {
    const now = Date.now();
    const day = 86_400_000;
    await prisma.task.createMany({
      data: [
        { title: 'Set up CI pipeline', description: 'Configure GitHub Actions for tests and lint.', priority: 'HIGH', status: 'IN_PROGRESS', assigneeId: member.id, organizationId: org.id, dueDate: new Date(now + 2 * day) },
        { title: 'Write onboarding docs', description: 'Document local dev setup.', priority: 'MEDIUM', status: 'TODO', assigneeId: member.id, organizationId: org.id, dueDate: new Date(now - 1 * day) },
        { title: 'Design landing page', description: 'Hero + pricing sections.', priority: 'LOW', status: 'IN_REVIEW', assigneeId: manager.id, organizationId: org.id, dueDate: new Date(now + 5 * day) },
        { title: 'Fix login redirect bug', priority: 'HIGH', status: 'BLOCKED', assigneeId: member.id, organizationId: org.id },
        { title: 'Quarterly roadmap planning', priority: 'MEDIUM', status: 'DONE', assigneeId: admin.id, organizationId: org.id },
      ],
    });
  }

  console.log('Seed complete. Login: admin@acme.test / manager@acme.test / member@acme.test (password: Password123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
