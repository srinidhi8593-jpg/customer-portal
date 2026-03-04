import prisma from './src/db';
import bcrypt from 'bcryptjs';

async function main() {
    // 1. Create a second test user (Publisher) in the same org as admin
    const admin = await prisma.user.findFirst({ where: { role: 'BUSINESS_ADMIN' } });
    if (!admin) { console.log('Admin user not found'); return; }

    const testEmail = 'john.doe@acron.com';
    let testUser = await prisma.user.findUnique({ where: { email: testEmail } });

    if (!testUser) {
        const hash = await bcrypt.hash('test1234', 10);
        testUser = await prisma.user.create({
            data: {
                email: testEmail,
                name: 'John Doe',
                passwordHash: hash,
                role: 'PUBLISHER',
                status: 'ACTIVE',
                orgId: admin.orgId
            }
        });
        console.log(`Created test user: ${testUser.name} (${testUser.email})`);
    } else {
        console.log(`Test user already exists: ${testUser.name} (${testUser.email})`);
    }

    // 2. Find a post authored by the admin
    const adminPost = await prisma.post.findFirst({
        where: { authorId: admin.id },
        orderBy: { createdAt: 'desc' }
    });

    if (!adminPost) {
        console.log('No posts by admin found. Creating a sample post...');
        const cat = await prisma.forumCategory.findFirst();
        const post = await prisma.post.create({
            data: {
                title: 'Welcome to the Echidna Forum',
                content: 'This is a sample post to test the notification system.',
                authorId: admin.id,
                status: 'PUBLISHED',
                categoryId: cat?.id
            }
        });
        console.log(`Created post: "${post.title}" (ID: ${post.id})`);

        // Comment on it as John Doe
        const comment = await prisma.comment.create({
            data: {
                content: 'Great post! Looking forward to more updates on the portal.',
                postId: post.id,
                authorId: testUser.id
            }
        });

        // Create the notification for admin
        await prisma.notification.create({
            data: {
                userId: admin.id,
                content: `${testUser.name} replied to your post "${post.title}"`,
                link: `/forum/${post.id}`,
                isRead: false
            }
        });

        console.log(`Comment added by ${testUser.name} on post "${post.title}"`);
        console.log(`Notification created for ${admin.name}`);
    } else {
        console.log(`Found admin post: "${adminPost.title}" (ID: ${adminPost.id})`);

        // 3. Add a comment from the test user
        const comment = await prisma.comment.create({
            data: {
                content: 'This is really helpful information. Thanks for sharing!',
                postId: adminPost.id,
                authorId: testUser.id
            }
        });

        // 4. Create notification for the admin (simulating what the API does)
        await prisma.notification.create({
            data: {
                userId: admin.id,
                content: `${testUser.name} replied to your post "${adminPost.title}"`,
                link: `/forum/${adminPost.id}`,
                isRead: false
            }
        });

        console.log(`Comment added by ${testUser.name} on post "${adminPost.title}"`);
        console.log(`Notification created for ${admin.name}`);
        console.log(`Post link: /forum/${adminPost.id}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
