import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding default forum categories...');

    const categoriesToCreate = [
        'General Discussion',
        'Help & Support',
        'Announcements',
        'Best Practices',
        'Product Updates',
        'Feature Requests'
    ];

    let addedCount = 0;
    for (const catName of categoriesToCreate) {
        const existing = await prisma.forumCategory.findFirst({
            where: { name: catName }
        });

        if (!existing) {
            await prisma.forumCategory.create({
                data: {
                    name: catName
                }
            });
            addedCount++;
        }
    }

    console.log(`✅ Default forum categories seeded successfully! (Added ${addedCount} new categories)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
