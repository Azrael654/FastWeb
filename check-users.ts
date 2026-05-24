import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.appUser.findMany({
    select: { email: true, role: true }
  });
  console.log('All Users:', users);
}

checkUsers().finally(() => prisma.$disconnect());
