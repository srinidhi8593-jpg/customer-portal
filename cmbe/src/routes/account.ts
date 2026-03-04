import express, { Request, Response } from 'express';
import { authenticate } from '../middlewares/rbac';
import prisma from '../db';

const router = express.Router();

router.get('/profile', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
        const profile = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, name: true, email: true, role: true, organization: true }
        });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/notifications', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
        const unreadCount = await prisma.notification.count({
            where: { userId: user.id, isRead: false }
        });
        res.json({ notifications, unreadCount });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// My Teams - ORG ADMIN Only
router.get('/teams', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (user.role !== 'ORG_ADMIN') return res.status(403).json({ error: 'Access denied' });

    try {
        const teams = await prisma.user.findMany({
            where: { orgId: user.orgId }
        });
        res.json(teams);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
