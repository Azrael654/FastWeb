import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function restoreAdmins() {
  await prisma.appUser.updateMany({
    data: { role: 'admin' }
  });
  console.log('Restored all users to admin role for testing!');
}

restoreAdmins().finally(() => prisma.$disconnect());
