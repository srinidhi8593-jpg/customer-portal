import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding default resource categories...');

    const categoriesToCreate = [
        {
            name: 'Data Sheets',
            subcategories: ['Hardware Specifications', 'Software Specifications', 'Product Overviews']
        },
        {
            name: 'User Manuals',
            subcategories: ['Installation Guides', 'Administrator Guides', 'End User Guides']
        },
        {
            name: 'Case Studies',
            subcategories: ['Industry Deployments', 'Success Stories']
        }
    ];

    let addedCount = 0;
    for (const cat of categoriesToCreate) {
        const existing = await prisma.resourceCategory.findFirst({
            where: { name: cat.name }
        });

        if (!existing) {
            await prisma.resourceCategory.create({
                data: {
                    name: cat.name,
                    subcategories: {
                        create: cat.subcategories.map(sub => ({ name: sub }))
                    }
                }
            });
            addedCount++;
        }
    }

    console.log(`✅ Default categories seeded successfully! (Added ${addedCount} new categories)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
