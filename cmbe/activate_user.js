const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.user.update({
        where: { email: 'srinidhi8593@gmail.com' },
        data: { status: 'ACTIVE' }
    });
    console.log('Status updated to ACTIVE for srinidhi8593@gmail.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
