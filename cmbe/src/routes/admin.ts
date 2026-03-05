import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, authorize } from '../middlewares/rbac';
import prisma from '../db';
import { sendEmail, sendPostApprovedEmail, sendPostRejectedEmail } from '../services/email.service';
import multer from 'multer';
import { storageService } from '../services/storage.service';

const upload = multer();
const router = express.Router();

// Get Pending Org Requests
router.get('/org-requests', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    try {
        const requests = await prisma.orgRegistrationRequest.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve Org -> Requires SAP BP ID
router.post('/org-requests/:id/approve', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { sapBpId, currency, orgStatus } = req.body;
    if (!sapBpId) return res.status(400).json({ error: 'SAP BP ID is required before approval' });

    try {
        const request = await prisma.orgRegistrationRequest.findUnique({ where: { id: String(id) } });
        if (!request) return res.status(404).json({ error: 'Not found' });

        // Create Organization with SAP BP ID
        const org = await prisma.organization.create({
            data: {
                name: request.soldToCompany,
                sapBpId,
                currency: currency || 'USD',
                status: orgStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
            }
        });

        // Check if Authority Admin user already exists
        let authorityAdmin = await prisma.user.findUnique({ where: { email: request.authorityAdminEmail } });

        const tempPassword = Math.random().toString(36).slice(-8);

        if (authorityAdmin) {
            // Update existing user
            authorityAdmin = await prisma.user.update({
                where: { id: authorityAdmin.id },
                data: {
                    role: 'ORG_ADMIN',
                    orgId: org.id,
                    status: 'ACTIVE'
                }
            });
        } else {
            // Create new user
            const passwordHash = await bcrypt.hash(tempPassword, 10);
            authorityAdmin = await prisma.user.create({
                data: {
                    email: request.authorityAdminEmail,
                    name: request.authorityAdminName,
                    phone: request.authorityAdminPhone,
                    passwordHash,
                    role: 'ORG_ADMIN',
                    orgId: org.id,
                    status: 'ACTIVE'
                }
            });
        }

        await prisma.orgRegistrationRequest.update({
            where: { id: String(id) },
            data: { status: 'ACTIVE' }
        });

        // Send Approval Email to the Authority Admin with their new temporary password
        await sendEmail(request.authorityAdminEmail, 'ORG_APPROVED', {
            orgName: org.name,
            sapBpId: org.sapBpId || '',
            currency: org.currency || 'USD',
            tempPassword
        });

        res.json({ message: 'Organization approved and admin created', org, adminUser: authorityAdmin.id });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Reject Org
router.post('/org-requests/:id/reject', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const request = await prisma.orgRegistrationRequest.findUnique({ where: { id: String(id) } });
        if (!request) return res.status(404).json({ error: 'Not found' });

        await prisma.orgRegistrationRequest.update({
            where: { id: String(id) },
            data: { status: 'REJECTED', rejectionReason: reason || 'No reason provided' }
        });

        await sendEmail(request.authorityAdminEmail, 'ORG_REJECTED', {
            orgName: request.soldToCompany,
            reason: reason || 'No reason provided'
        });

        res.json({ message: 'Organization rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve User Request -> Assign Role & Org
router.post('/user-requests/:id/approve', authenticate, authorize(['BUSINESS_ADMIN', 'ORG_ADMIN']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role, orgId } = req.body; // e.g., 'PUBLISHER', 'VIEWER'

    try {
        const request = await prisma.userRegistrationRequest.findUnique({ where: { id: String(id) } });
        if (!request) return res.status(404).json({ error: 'Not found' });

        const tempPassword = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const user = await prisma.user.create({
            data: {
                email: request.email,
                name: request.name,
                passwordHash,
                role,
                orgId,
                status: 'ACTIVE'
            }
        });

        await prisma.userRegistrationRequest.update({
            where: { id: String(id) },
            data: { status: 'ACTIVE' }
        });

        await sendEmail(request.email, 'USER_APPROVED', { tempPassword, role });

        res.json({ message: 'User approved', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reject User
router.post('/user-requests/:id/reject', authenticate, authorize(['BUSINESS_ADMIN', 'ORG_ADMIN']), async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const request = await prisma.userRegistrationRequest.findUnique({ where: { id: String(id) } });
        if (!request) return res.status(404).json({ error: 'Not found' });

        await prisma.userRegistrationRequest.update({
            where: { id: String(id) },
            data: { status: 'REJECTED', rejectionReason: reason || 'No reason provided' }
        });

        await sendEmail(request.email, 'USER_REJECTED', {
            name: request.name,
            reason: reason || 'No reason provided'
        });

        res.json({ message: 'User request rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get Pending User Requests
router.get('/user-requests', authenticate, authorize(['BUSINESS_ADMIN', 'ORG_ADMIN']), async (req: Request, res: Response) => {
    try {
        const requests = await prisma.userRegistrationRequest.findMany({ where: { status: 'PENDING' } });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve Post
router.put('/posts/:id/approve', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    try {
        const postId = String(req.params.id);
        const post = await prisma.post.update({
            where: { id: postId },
            data: { status: 'PUBLISHED' }
        });

        // Notify author via in-app notification
        await prisma.notification.create({
            data: {
                userId: post.authorId,
                content: `Your post "${post.title}" has been approved and published.`,
                link: `/forum/${post.id}`
            }
        });

        // Send approval email to author
        const author = await prisma.user.findUnique({ where: { id: post.authorId }, select: { email: true, name: true } });
        if (author?.email) {
            sendPostApprovedEmail(author.email, author.name, post.title, post.id).catch(() => { });
        }

        // Notify followers of category
        if (post.categoryId) {
            const followers = await prisma.followedCategory.findMany({ where: { categoryId: post.categoryId } });
            if (followers.length > 0) {
                const notifications = followers.filter((f: any) => f.userId !== post.authorId).map((f: any) => ({
                    userId: f.userId,
                    content: `New post in a category you follow: ${post.title}`,
                    link: `/forum/${post.id}`
                }));
                if (notifications.length > 0) {
                    await prisma.notification.createMany({ data: notifications });
                }
            }
        }

        res.json(post);
    } catch (err) {
        console.error('Approve post error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reject Post
router.put('/posts/:id/reject', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    const { reason } = req.body;
    try {
        const postId = String(req.params.id);
        const post = await prisma.post.update({
            where: { id: postId },
            data: { status: 'REJECTED' }
        });

        await prisma.notification.create({
            data: {
                userId: post.authorId,
                content: `Your post "${post.title}" has been rejected. Reason: ${reason || 'Not provided'}`,
                link: `/forum/${post.id}`
            }
        });

        // Send rejection email to author
        const author = await prisma.user.findUnique({ where: { id: post.authorId }, select: { email: true, name: true } });
        if (author?.email) {
            sendPostRejectedEmail(author.email, author.name, post.title, reason || '').catch(() => { });
        }

        res.json(post);
    } catch (err) {
        console.error('Reject post error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== POST MANAGEMENT =====

// List posts by status (admin)
router.get('/posts', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    const { status, search, skip = 0, take = 50 } = req.query;
    try {
        const where: any = {};
        if (status) where.status = String(status);
        if (search) where.title = { contains: String(search), mode: 'insensitive' };

        const posts = await prisma.post.findMany({
            where,
            skip: Number(skip),
            take: Number(take),
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { id: true, name: true, email: true } },
                category: true,
                _count: { select: { comments: true } }
            }
        });
        const total = await prisma.post.count({ where });
        res.json({ posts, total });
    } catch (err) {
        console.error('Admin list posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get post details (admin)
router.get('/posts/:id', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    try {
        const postId = String(req.params.id);
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: { select: { id: true, name: true, email: true } },
                category: true,
                _count: { select: { comments: true } }
            }
        });
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (err) {
        console.error('Admin get post detail error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Edit post (admin)
router.put('/posts/:id', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    const { title, content, categoryId, tags } = req.body;
    try {
        const postId = String(req.params.id);
        const data: any = {};
        if (title !== undefined) data.title = title;
        if (content !== undefined) data.content = content;
        if (categoryId !== undefined) data.categoryId = categoryId || null;
        if (tags !== undefined) data.tags = tags;

        const post = await prisma.post.update({
            where: { id: postId },
            data,
            include: { author: { select: { id: true, name: true } }, category: true }
        });
        res.json(post);
    } catch (err) {
        console.error('Admin edit post error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete post (admin)
router.delete('/posts/:id', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    try {
        const postId = String(req.params.id);
        // Delete related records first
        await prisma.postVote.deleteMany({ where: { postId } });
        await prisma.savedPost.deleteMany({ where: { postId } });
        await prisma.comment.deleteMany({ where: { postId } });
        await prisma.notification.deleteMany({ where: { link: `/forum/${postId}` } });
        await prisma.post.delete({ where: { id: postId } });
        res.json({ message: 'Post deleted' });
    } catch (err) {
        console.error('Admin delete post error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== COMMENT MANAGEMENT =====

// List comments for a post (admin)
router.get('/posts/:id/comments', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    try {
        const postId = String(req.params.id);
        const comments = await prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
            include: {
                author: { select: { id: true, name: true, email: true } },
                parentComment: { select: { id: true, content: true, author: { select: { name: true } } } }
            }
        });
        res.json(comments);
    } catch (err) {
        console.error('Admin list comments error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Edit comment (admin)
router.put('/comments/:id', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });
    try {
        const comment = await prisma.comment.update({
            where: { id: String(req.params.id) },
            data: { content: content.trim() },
            include: { author: { select: { id: true, name: true } } }
        });
        res.json(comment);
    } catch (err) {
        console.error('Admin edit comment error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete comment (admin)
router.delete('/comments/:id', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    try {
        const commentId = String(req.params.id);
        // Delete child replies first
        await prisma.comment.deleteMany({ where: { parentCommentId: commentId } });
        await prisma.comment.delete({ where: { id: commentId } });
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        console.error('Admin delete comment error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== FORUM SETTINGS =====

// Get forum settings
router.get('/settings', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    try {
        let settings = await prisma.forumSettings.findFirst();
        if (!settings) {
            settings = await prisma.forumSettings.create({
                data: { postLimitPerUser: 0, defaultPostVisibility: 'ALL' }
            });
        }
        res.json(settings);
    } catch (err) {
        console.error('Get settings error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update forum settings
router.put('/settings', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    const { postLimitPerUser, defaultPostVisibility } = req.body;
    try {
        let settings = await prisma.forumSettings.findFirst();
        if (!settings) {
            settings = await prisma.forumSettings.create({
                data: { postLimitPerUser: postLimitPerUser ?? 0, defaultPostVisibility: defaultPostVisibility ?? 'ALL' }
            });
        } else {
            settings = await prisma.forumSettings.update({
                where: { id: settings.id },
                data: {
                    postLimitPerUser: postLimitPerUser ?? settings.postLimitPerUser,
                    defaultPostVisibility: defaultPostVisibility ?? settings.defaultPostVisibility
                }
            });
        }
        res.json(settings);
    } catch (err) {
        console.error('Update settings error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== RESOURCE MANAGEMENT =====

// Helper to parse arrays from FormData
const parseArray = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return typeof val === 'string' ? [val] : [];
    }
};

// Create resource (admin)
router.post('/resources', authenticate, authorize(['BUSINESS_ADMIN']), upload.single('file'), async (req: Request, res: Response) => {
    const { title, description } = req.body;
    const categoryIds = parseArray(req.body.categoryIds);
    const subcategoryIds = parseArray(req.body.subcategoryIds);

    if (!title || !req.file) {
        return res.status(400).json({ error: 'Title and file are required' });
    }

    try {
        const fileUrl = await storageService.uploadFile(req.file, 'resources');

        const resource = await prisma.resource.create({
            data: {
                title,
                description: description || '',
                fileUrl,
                categories: {
                    connect: categoryIds.map((id: string) => ({ id }))
                },
                subcategories: {
                    connect: subcategoryIds.map((id: string) => ({ id }))
                }
            },
            include: { categories: true, subcategories: true }
        });
        res.status(201).json(resource);
    } catch (err) {
        console.error('Create resource error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Edit resource (admin)
router.put('/resources/:id', authenticate, authorize(['BUSINESS_ADMIN']), upload.single('file'), async (req: Request, res: Response) => {
    const { title, description } = req.body;
    const categoryIds = parseArray(req.body.categoryIds);
    const subcategoryIds = parseArray(req.body.subcategoryIds);

    try {
        const existingResource = await prisma.resource.findUnique({ where: { id: String(req.params.id) } });
        if (!existingResource) return res.status(404).json({ error: 'Resource not found' });

        const data: any = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;

        // Handle file upload
        if (req.file) {
            // Optionally delete the old file here if it exists locally
            if (existingResource.fileUrl.startsWith('/uploads/')) {
                await storageService.deleteFile(existingResource.fileUrl).catch(e => console.error("Failed to delete old file", e));
            }
            data.fileUrl = await storageService.uploadFile(req.file, 'resources');
        }

        // Handle category updates (replace existing relationships)
        if (req.body.categoryIds !== undefined) {
            data.categories = { set: categoryIds.map((id: string) => ({ id })) };
        }
        if (req.body.subcategoryIds !== undefined) {
            data.subcategories = { set: subcategoryIds.map((id: string) => ({ id })) };
        }

        const resource = await prisma.resource.update({
            where: { id: String(req.params.id) },
            data,
            include: { categories: true, subcategories: true }
        });
        res.json(resource);
    } catch (err) {
        console.error('Edit resource error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete resource (admin)
router.delete('/resources/:id', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    try {
        const resource = await prisma.resource.findUnique({ where: { id: String(req.params.id) } });
        if (resource && resource.fileUrl.startsWith('/uploads/')) {
            await storageService.deleteFile(resource.fileUrl).catch(e => console.error("Failed to delete file", e));
        }
        await prisma.resource.delete({ where: { id: String(req.params.id) } });
        res.json({ message: 'Resource deleted' });
    } catch (err) {
        console.error('Delete resource error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ===== ANNOUNCEMENTS MANAGEMENT (ADMIN) =====

// List all announcements
router.get('/announcements', authenticate, authorize(['BUSINESS_ADMIN', 'ORG_ADMIN']), async (req: Request, res: Response) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(announcements);
    } catch (err) {
        console.error('List announcements error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create announcement
router.post('/announcements', authenticate, authorize(['BUSINESS_ADMIN', 'ORG_ADMIN']), async (req: Request, res: Response) => {
    const { title, description, isActive } = req.body;
    try {
        const announcement = await prisma.announcement.create({
            data: { title, description, isActive: isActive ?? true }
        });
        res.json(announcement);
    } catch (err) {
        console.error('Create announcement error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update announcement
router.put('/announcements/:id', authenticate, authorize(['BUSINESS_ADMIN', 'ORG_ADMIN']), async (req: Request, res: Response) => {
    const { title, description, isActive } = req.body;
    try {
        const announcement = await prisma.announcement.update({
            where: { id: String(req.params.id) },
            data: { title, description, isActive }
        });
        res.json(announcement);
    } catch (err) {
        console.error('Update announcement error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete announcement
router.delete('/announcements/:id', authenticate, authorize(['BUSINESS_ADMIN', 'ORG_ADMIN']), async (req: Request, res: Response) => {
    try {
        await prisma.announcement.delete({
            where: { id: String(req.params.id) }
        });
        res.json({ message: 'Announcement deleted' });
    } catch (err) {
        console.error('Delete announcement error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Seed default forum categories (idempotent — safe to call multiple times)
router.post('/seed/forum-categories', authenticate, authorize(['BUSINESS_ADMIN']), async (req: Request, res: Response) => {
    const DEFAULT_CATEGORIES = [
        'General Discussion',
        'Help & Support',
        'Announcements',
        'Best Practices',
        'Product Updates',
        'Feature Requests',
        'Debates',
        'News & Trends',
    ];
    try {
        let added = 0;
        for (const name of DEFAULT_CATEGORIES) {
            const exists = await prisma.forumCategory.findFirst({ where: { name } });
            if (!exists) {
                await prisma.forumCategory.create({ data: { name } });
                added++;
            }
        }
        res.json({ message: `Seeded successfully. Added ${added} new categories.` });
    } catch (err) {
        console.error('Seed forum categories error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
