const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { role: 'BUSINESS_ADMIN' }
    });
    console.log("Admin Users:");
    for (const u of users) {
        console.log(`\nEmail: ${u.email}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
