import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: { posts: true }
    });
    const usersWithPosts = users.filter((u: any) => u.posts.length > 0);
    console.log("Users with posts data:");
    for (const u of usersWithPosts) {
        console.log(`\nUser: ${u.name} (${u.email})`);
        for (const p of u.posts) {
            console.log(` - Post: "${p.title}"`);
            console.log(`   Status: [${p.status}]`);
            console.log(`   Content: ${p.content}`);
            console.log(`   Likes: ${p.upvotes}`);
        }
    }
    if (usersWithPosts.length === 0) {
        console.log("No previous posts data found in the database.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
