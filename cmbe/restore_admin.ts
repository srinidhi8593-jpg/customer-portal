import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
        const adminUsers = await prisma.user.findMany({ where: { role: 'BUSINESS_ADMIN' } });
        console.log("Admins:", adminUsers.map(u => u.email));

        // Restore srinidhi if needed
        const res = await prisma.user.updateMany({
            where: { email: 'srinidhi8593@gmail.com' },
            data: { role: 'BUSINESS_ADMIN' }
        });

        console.log("Restored srinidhi8593@gmail.com to BUSINESS_ADMIN. Modified count:", res.count);

        // Delete any pending/faulty org requests from the tests to clean up
        const delRes = await prisma.orgRegistrationRequest.deleteMany({
            where: { soldToEmail: 'taxexempt@example.com' }
        });
        console.log("Deleted test requests:", delRes.count);

        // Delete any organizations created that might cause sapBpId conflict
        const delOrg = await prisma.organization.deleteMany({
            where: { sapBpId: { in: ['BP-TAX123', 'BP-TAX999'] } }
        });
        console.log("Deleted test organizations:", delOrg.count);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}
run();
