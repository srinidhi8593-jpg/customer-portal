const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.announcement.deleteMany({});
  console.log('Cleared existing announcements');
}

main().catch(console.error).finally(() => prisma.$disconnect());
