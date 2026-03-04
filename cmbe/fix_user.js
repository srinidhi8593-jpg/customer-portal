const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    // 1. First, restore srinidhi8593@gmail.com to BUSINESS_ADMIN
    const user = await prisma.user.updateMany({
        where: { email: 'srinidhi8593@gmail.com' },
        data: { role: 'BUSINESS_ADMIN' }
    });
    console.log("Restored user:", user.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
