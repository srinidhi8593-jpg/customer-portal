import prisma from './src/db';

async function main() {
    // 1. Find the first ORG_ADMIN
    const admin = await prisma.user.findFirst({ where: { role: 'ORG_ADMIN' } });
    if (!admin || !admin.orgId) return console.error('No ORG_ADMIN found');

    // 2. Create some dummy team members
    await prisma.user.createMany({
        data: [
            {
                email: 'publisher@' + admin.email.split('@')[1],
                passwordHash: admin.passwordHash,
                name: 'Test Publisher',
                title: 'Senior Publisher',
                role: 'PUBLISHER',
                status: 'ACTIVE',
                orgId: admin.orgId
            },
            {
                email: 'viewer@' + admin.email.split('@')[1],
                passwordHash: admin.passwordHash,
                name: 'Test Viewer',
                title: 'Data Analyst',
                role: 'VIEWER',
                status: 'ACTIVE',
                orgId: admin.orgId
            }
        ]
    });
    console.log('Seeded team members for org', admin.orgId);
}

main().catch(console.error).finally(() => prisma.$disconnect());
