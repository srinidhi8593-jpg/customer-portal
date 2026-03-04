import express, { Request, Response } from 'express';
import { authenticate } from '../middlewares/rbac';
import prisma from '../db';

const router = express.Router();

// Get all resource categories with subcategories
router.get('/categories', authenticate, async (req: Request, res: Response) => {
    try {
        const categories = await prisma.resourceCategory.findMany({
            orderBy: { name: 'asc' },
            include: {
                subcategories: { orderBy: { name: 'asc' } },
                _count: { select: { resources: true } }
            }
        });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// List resources with filters and sorting
router.get('/', authenticate, async (req: Request, res: Response) => {
    const { categoryId, subcategoryId, search, sort, skip = 0, take = 20 } = req.query;

    try {
        const where: any = {};
        if (categoryId) where.categories = { some: { id: String(categoryId) } };
        if (subcategoryId) where.subcategories = { some: { id: String(subcategoryId) } };
        if (search) where.title = { contains: String(search), mode: 'insensitive' as const };

        let orderBy: any = { createdAt: 'desc' };
        if (sort === 'downloads') orderBy = { downloadCount: 'desc' };
        else if (sort === 'az') orderBy = { title: 'asc' };

        const resources = await prisma.resource.findMany({
            where,
            skip: Number(skip),
            take: Number(take),
            orderBy,
            include: { categories: true, subcategories: true }
        });

        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single resource detail with related resources
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    const id = String(req.params.id);
    try {
        const resource = await prisma.resource.findUnique({
            where: { id },
            include: { categories: true, subcategories: true }
        });
        if (!resource) return res.status(404).json({ error: 'Resource not found' });

        // Get related resources (sharing at least one category, excluding current)
        const categoryIds = resource.categories.map((c: any) => c.id);
        const related = await prisma.resource.findMany({
            where: {
                categories: { some: { id: { in: categoryIds } } },
                id: { not: resource.id }
            },
            take: 4,
            orderBy: { downloadCount: 'desc' },
            include: { categories: true, subcategories: true }
        });

        res.json({ ...resource, relatedResources: related });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Download (increment count)
router.post('/:id/download', authenticate, async (req: Request, res: Response) => {
    const id = String(req.params.id);
    try {
        const resource = await prisma.resource.update({
            where: { id },
            data: { downloadCount: { increment: 1 } }
        });
        res.json({ url: resource.fileUrl });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

