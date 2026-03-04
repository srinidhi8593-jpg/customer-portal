const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { email: 'admin@acronaviation.com' },
    data: { password: hash }
  });
  console.log('Password updated for admin@acronaviation.com to admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
