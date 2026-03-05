import { PrismaClient, Role, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating user srinidhi8593@gmail.com...');

    const hashedPassword = await bcrypt.hash('srinidhi123', 10);

    const user = await prisma.user.upsert({
        where: { email: 'srinidhi8593@gmail.com' },
        update: {
            passwordHash: hashedPassword,
            status: Status.ACTIVE,
            role: Role.BUSINESS_ADMIN
        },
        create: {
            email: 'srinidhi8593@gmail.com',
            passwordHash: hashedPassword,
            name: 'Srinidhi',
            role: Role.BUSINESS_ADMIN,
            status: Status.ACTIVE
        }
    });

    console.log(`✅ User created/updated successfully: ${user.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
