import prisma from './src/db';

async function main() {
    // Find the first BUSINESS_ADMIN role
    const admin = await prisma.user.findFirst({ where: { role: 'BUSINESS_ADMIN' } });
    if (!admin) return console.log('BUSINESS_ADMIN user not found');

    // Make sure an Org exists
    let org = await prisma.organization.findFirst();
    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'Acron Aviation Internal',
                status: 'ACTIVE',
                sapBpId: 'INTERNAL_001',
                currency: 'USD'
            }
        });
    }

    // Assign admin to the org
    await prisma.user.update({
        where: { id: admin.id },
        data: { orgId: org.id }
    });

    console.log(`Assigned Admin (${admin.email}) to Org: ${org.name}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
