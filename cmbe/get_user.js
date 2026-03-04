const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'srinidhi8593@gmail.com' } });
    console.log("USER:", user ? user.email : "NOT FOUND");
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
