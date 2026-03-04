import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middlewares/rbac';
import prisma from '../db';
import { sendEmail } from '../services/email.service';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Get current user profile
router.get('/me', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // rbac uses decoded.id
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, email: true, name: true, role: true, orgId: true,
                phone: true, businessUnit: true,
                organization: { select: { name: true } }
            }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update current user profile
router.put('/me', authenticate, async (req: Request, res: Response) => {
    const { name, email, phone } = req.body;
    try {
        const userId = (req as any).user.id;
        const userEmail = (req as any).user.email;
        // Basic validation
        if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

        // Ensure email isn't taken by another user
        if (email !== userEmail) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) return res.status(400).json({ error: 'Email is already in use' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name, email, phone },
            select: {
                id: true, email: true, name: true, role: true, orgId: true,
                phone: true, businessUnit: true
            }
        });

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Change current user password
router.put('/me/password', authenticate, async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const userId = (req as any).user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hash }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's submitted or saved posts
router.get('/me/posts', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const tab = (req.query.tab as string) || 'submitted'; // 'submitted' | 'saved'
        const sortBy = (req.query.sortBy as string) || 'date'; // 'date' | 'likes' | 'comments'
        const search = (req.query.search as string) || '';
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Base where condition based on the tab
        let whereCondition: any = {};

        if (tab === 'submitted') {
            whereCondition.authorId = userId;
        } else if (tab === 'saved') {
            whereCondition.savedBy = {
                some: { userId }
            };
        }

        if (search) {
            whereCondition.title = { contains: search, mode: 'insensitive' };
        }

        // Sorting logic
        let orderByCondition: any = { createdAt: 'desc' };
        if (sortBy === 'likes') {
            orderByCondition = { likes: { _count: 'desc' } };
        } else if (sortBy === 'comments') {
            orderByCondition = { comments: { _count: 'desc' } };
        }

        const [total, posts] = await Promise.all([
            prisma.post.count({ where: whereCondition }),
            prisma.post.findMany({
                where: whereCondition,
                include: {
                    category: true,
                    _count: { select: { comments: true } },
                    savedBy: { where: { userId } } // To easily identify if the user has saved this post
                },
                orderBy: orderByCondition,
                skip,
                take: limit
            })
        ]);

        res.json({
            posts: posts.map((p: any) => ({
                id: p.id,
                title: p.title,
                status: p.status, // We use this purely for status pill display
                createdAt: p.createdAt,
                likes: p._count.likes,
                comments: p._count.comments,
                category: p.category?.name,
                isSaved: p.savedBy.length > 0
            })),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user notifications
router.get('/me/notifications', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const unreadOnly = req.query.unread === 'true';
        const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' as const : 'desc' as const;

        const whereCondition: any = { userId };
        if (unreadOnly) {
            whereCondition.isRead = false;
        }

        const [total, unreadCount, notifications] = await Promise.all([
            prisma.notification.count({ where: { userId } }),
            prisma.notification.count({ where: { userId, isRead: false } }),
            prisma.notification.findMany({
                where: whereCondition,
                orderBy: { createdAt: sortOrder },
                skip,
                take: limit
            })
        ]);

        res.json({
            notifications,
            unreadCount,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Fetch notifications error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark notification(s) as read
router.put('/me/notifications/:id/read', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const notificationId = String(req.params.id);

        if (notificationId === 'all') {
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });
        } else {
            // Verify ownership
            const notification = await prisma.notification.findFirst({
                where: { id: notificationId, userId }
            });
            if (!notification) return res.status(404).json({ error: 'Notification not found' });

            await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true }
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Mark notification read error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get team members (ORG_ADMIN or BUSINESS_ADMIN only)
// Add new team member (ORG_ADMIN or BUSINESS_ADMIN only)
router.post('/me/team', authenticate, async (req: Request, res: Response) => {
    try {
        const adminUser = (req as any).user;
        if (!['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(adminUser.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (!adminUser.orgId) {
            return res.status(400).json({ error: 'You do not belong to an organization' });
        }

        const { name, email, phone, role } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        if (!['PUBLISHER', 'VIEWER'].includes(role)) {
            return res.status(400).json({ error: 'Role must be PUBLISHER or VIEWER' });
        }

        // Check email uniqueness
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'A user with this email already exists' });
        }

        const tempPassword = Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                phone: phone || null,
                passwordHash,
                role,
                orgId: adminUser.orgId,
                status: 'ACTIVE'
            },
            select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
        });

        // Generate password reset token for the new user
        const resetToken = jwt.sign({ id: newUser.id, type: 'reset' }, JWT_SECRET, { expiresIn: '7d' });
        const resetLink = `http://localhost:3000/auth/reset-password?token=${resetToken}`;

        // Log the reset link to console (essential for local dev where SMTP may not be running)
        console.log(`\n========================================`);
        console.log(`NEW USER CREATED: ${name} (${email})`);
        console.log(`Role: ${role}`);
        console.log(`Password Reset Link: ${resetLink}`);
        console.log(`========================================\n`);

        // Send welcome email with reset link
        await sendEmail(email, 'USER_WELCOME', {
            name,
            role,
            resetLink,
            portalUrl: 'http://localhost:3000'
        });

        res.status(201).json({ message: 'User created successfully', user: newUser, resetLink });
    } catch (err) {
        console.error('Add team member error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// List team members (ORG_ADMIN or BUSINESS_ADMIN only)
router.get('/me/team', authenticate, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        if (!['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        if (!user.orgId) {
            return res.status(400).json({ error: 'User does not belong to an organization' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search as string;
        const role = req.query.role as string;

        const where: any = { orgId: user.orgId };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (role) {
            where.role = role;
        }

        const [total, members] = await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    title: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            })
        ]);

        res.json({
            members,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Fetch team error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change team member role (ORG_ADMIN or BUSINESS_ADMIN only)
router.put('/me/team/:id/role', authenticate, async (req: Request, res: Response) => {
    try {
        const adminUser = (req as any).user;
        if (!['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(adminUser.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const targetUserId = String(req.params.id);
        const { role } = req.body;

        if (!['PUBLISHER', 'VIEWER'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role assignment. Can only assign PUBLISHER or VIEWER.' });
        }

        const targetUser = await prisma.user.findFirst({
            where: { id: targetUserId, orgId: adminUser.orgId }
        });

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found in your organization' });
        }

        // Prevent modifying other ORG_ADMINs or BUSINESS_ADMINs
        if (['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(targetUser.role)) {
            return res.status(403).json({ error: 'Cannot modify administrative roles' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        });

        res.json(updatedUser);
    } catch (err) {
        console.error('Update team role error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove/Deactivate team member (ORG_ADMIN or BUSINESS_ADMIN only)
router.delete('/me/team/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const adminUser = (req as any).user;
        if (!['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(adminUser.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const targetUserId = String(req.params.id);

        const targetUser = await prisma.user.findFirst({
            where: { id: targetUserId, orgId: adminUser.orgId }
        });

        if (!targetUser) {
            return res.status(404).json({ error: 'User not found in your organization' });
        }

        if (['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(targetUser.role)) {
            return res.status(403).json({ error: 'Cannot remove administrative users' });
        }

        // We choose to deactivate rather than hard delete to preserve foreign key constraints
        await prisma.user.update({
            where: { id: targetUserId },
            data: { status: 'REJECTED' }
        });

        res.json({ success: true, message: 'User deactivated from organization' });
    } catch (err) {
        console.error('Remove team member error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
