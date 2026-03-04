import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        const adminUsers = await prisma.user.findMany({ where: { role: 'BUSINESS_ADMIN' } });
        console.log("Admins:", adminUsers.map(u => u.email));
        
        // Restore srinidhi if needed
        await prisma.user.updateMany({
            where: { email: 'srinidhi8593@gmail.com' },
            data: { role: 'BUSINESS_ADMIN' }
        });
        
        console.log("Restored srinidhi8593@gmail.com to BUSINESS_ADMIN");
    } catch(err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}
run();
