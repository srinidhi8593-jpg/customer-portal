import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const posts = await prisma.post.findMany({
        include: { author: true }
    });
    console.log("Total posts in DB:", posts.length);
    posts.forEach(p => {
        console.log(`- [${p.status}] ${p.title} by ${p.author.email}`);
    });
    await prisma.$disconnect();
}
check().catch(console.error);
