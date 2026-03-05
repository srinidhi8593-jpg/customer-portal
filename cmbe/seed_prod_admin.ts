import { PrismaClient, Role, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding initial admin user...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@customerportal.com' },
        update: {},
        create: {
            email: 'admin@customerportal.com',
            passwordHash: hashedPassword,
            name: 'System Admin',
            role: Role.BUSINESS_ADMIN,
            status: Status.ACTIVE
        }
    });

    console.log(`✅ Admin user created/verified: ${admin.email}`);
    console.log('Password: admin123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
