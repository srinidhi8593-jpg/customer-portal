const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123', 10);
  await prisma.user.update({
    where: { email: 'srinidhi8593@gmail.com' },
    data: { password: hash }
  });
  console.log('Password updated for srinidhi8593@gmail.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
