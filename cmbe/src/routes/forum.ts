import express, { Request, Response } from 'express';
import { authenticate, authorize } from '../middlewares/rbac';
import prisma from '../db';

const router = express.Router();

// List all categories (public)
router.get('/categories', async (req: Request, res: Response) => {
    try {
        const categories = await prisma.forumCategory.findMany({ orderBy: { name: 'asc' } });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Follow a category
router.post('/categories/:id/follow', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const categoryId = String(req.params.id);
    try {
        const existing = await prisma.followedCategory.findFirst({ where: { userId: user.id, categoryId } });
        if (!existing) {
            await prisma.followedCategory.create({ data: { userId: user.id, categoryId } });
        }
        res.json({ followed: true });
    } catch (err) {
        console.error('Follow category error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Unfollow a category
router.delete('/categories/:id/follow', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const categoryId = String(req.params.id);
    try {
        await prisma.followedCategory.deleteMany({ where: { userId: user.id, categoryId } });
        res.json({ unfollowed: true });
    } catch (err) {
        console.error('Unfollow category error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Dashboard Summary (Top 5 trending, latest)
router.get('/dashboard', authenticate, async (req: Request, res: Response) => {
    try {
        const trending = await prisma.post.findMany({
            where: { status: 'PUBLISHED' },
            take: 5,
            orderBy: { upvotes: 'desc' },
            include: { author: { select: { name: true } }, category: true }
        });
        res.json({ trending });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Search Autosuggest
router.get('/search/autosuggest', authenticate, async (req: Request, res: Response) => {
    const { q } = req.query;
    const query = typeof q === 'string' ? q : '';

    try {
        const categories = await prisma.forumCategory.findMany({
            where: { name: { contains: query, mode: 'insensitive' } },
            take: 5
        });

        const posts = await prisma.post.findMany({
            where: {
                status: 'PUBLISHED',
                title: { contains: query, mode: 'insensitive' }
            },
            take: 5
        });

        const resources = await prisma.resource.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 5
        });

        res.json({ categories, posts, resources });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create Post (PENDING_APPROVAL)
router.post('/posts', authenticate, authorize(['BUSINESS_ADMIN', 'ORG_ADMIN', 'PUBLISHER']), async (req: Request, res: Response) => {
    const { title, content, categoryId, tags, attachments } = req.body;
    const user = (req as any).user;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    try {
        // All posts go to PENDING_APPROVAL. Admins will review them in the Backoffice.
        const postStatus = 'PENDING_APPROVAL';
        const data: any = {
            title,
            content,
            authorId: user.id,
            tags: tags || [],
            attachments: attachments || [],
            status: postStatus
        };

        // Only set categoryId if provided and valid
        if (categoryId) {
            const catExists = await prisma.forumCategory.findUnique({ where: { id: categoryId } });
            if (catExists) {
                data.categoryId = categoryId;
            }
        }

        const post = await prisma.post.create({ data });

        res.status(201).json(post);
    } catch (err) {
        console.error('Create post error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get posts with pagination, filters and sorting
router.get('/posts', authenticate, async (req: Request, res: Response) => {
    const { categoryId, search, skip = 0, take = 20, sort, dateFrom, dateTo, tags, author, hasAttachments } = req.query;
    const user = (req as any).user;
    try {
        // Build where clause
        const where: any = {
            status: 'PUBLISHED' as const,
            ...(categoryId ? { categoryId: String(categoryId) } : {}),
            ...(search ? { title: { contains: String(search), mode: 'insensitive' as const } } : {}),
        };

        // Date range filter
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(String(dateFrom));
            if (dateTo) {
                const end = new Date(String(dateTo));
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        // Tags filter
        if (tags) {
            const tagList = String(tags).split(',').map(t => t.trim()).filter(Boolean);
            if (tagList.length > 0) {
                where.tags = { hasSome: tagList };
            }
        }

        // Author filter (by name, case-insensitive)
        if (author) {
            where.author = { name: { contains: String(author), mode: 'insensitive' as const } };
        }

        // Has attachments filter
        if (hasAttachments === 'true') {
            where.attachments = { isEmpty: false };
        }

        // Sorting
        let orderBy: any = { createdAt: 'desc' };
        if (sort === 'popular') orderBy = { upvotes: 'desc' };
        else if (sort === 'rated') orderBy = { comments: { _count: 'desc' } };

        const posts = await prisma.post.findMany({
            where,
            skip: Number(skip),
            take: Number(take),
            orderBy,
            include: { author: { select: { id: true, name: true } }, category: true, _count: { select: { comments: true } } }
        });
        res.json(posts);
    } catch (err) {
        console.error('Get posts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


// Get single post detail with comments
router.get('/posts/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const postId = String(req.params.id);
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: { select: { id: true, name: true, role: true } },
                category: true,
                comments: {
                    where: { parentCommentId: null },
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: { select: { id: true, name: true, role: true } },
                        replies: {
                            orderBy: { createdAt: 'asc' },
                            include: {
                                author: { select: { id: true, name: true, role: true } },
                                votes: { where: { userId: user.id } }
                            }
                        },
                        votes: { where: { userId: user.id } }
                    }
                },
                votes: { where: { userId: user.id } },
                savedBy: { where: { userId: user.id } },
                _count: { select: { comments: true } }
            }
        });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const userVote = post.votes.length > 0 ? post.votes[0].type : null;
        const score = post.upvotes - post.downvotes;
        const isSaved = post.savedBy.length > 0;

        // Map comments to include user interaction and score
        const mappedComments = post.comments.map(c => ({
            ...c,
            userVote: c.votes.length > 0 ? c.votes[0].type : null,
            score: c.upvotes - c.downvotes,
            replies: c.replies.map(r => ({
                ...r,
                userVote: r.votes.length > 0 ? r.votes[0].type : null,
                score: r.upvotes - r.downvotes,
            }))
        }));

        res.json({ ...post, comments: mappedComments, userVote, score, isSaved, commentsCount: post._count.comments });
    } catch (err) {
        console.error('Get post detail error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Vote on a post
router.post('/posts/:id/vote', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const postId = String(req.params.id);
    const { type } = req.body; // 'UPVOTE' or 'DOWNVOTE'

    if (!type || !['UPVOTE', 'DOWNVOTE'].includes(type)) {
        return res.status(400).json({ error: 'Invalid vote type' });
    }

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const existing = await prisma.postVote.findFirst({
            where: { postId, userId: user.id }
        });

        if (existing) {
            if (existing.type === type) {
                // Toggle off
                await prisma.postVote.delete({ where: { id: existing.id } });
                await prisma.post.update({
                    where: { id: postId },
                    data: {
                        upvotes: type === 'UPVOTE' ? { decrement: 1 } : undefined,
                        downvotes: type === 'DOWNVOTE' ? { decrement: 1 } : undefined
                    }
                });
                const updated = await prisma.post.findUnique({ where: { id: postId } });
                return res.json({ userVote: null, score: (updated?.upvotes || 0) - (updated?.downvotes || 0) });
            } else {
                // Switch vote
                await prisma.postVote.update({
                    where: { id: existing.id },
                    data: { type }
                });
                await prisma.post.update({
                    where: { id: postId },
                    data: {
                        upvotes: type === 'UPVOTE' ? { increment: 1 } : { decrement: 1 },
                        downvotes: type === 'DOWNVOTE' ? { increment: 1 } : { decrement: 1 }
                    }
                });
                const updated = await prisma.post.findUnique({ where: { id: postId } });
                return res.json({ userVote: type, score: (updated?.upvotes || 0) - (updated?.downvotes || 0) });
            }
        } else {
            // New vote
            await prisma.postVote.create({ data: { postId, userId: user.id, type } });
            await prisma.post.update({
                where: { id: postId },
                data: {
                    upvotes: type === 'UPVOTE' ? { increment: 1 } : undefined,
                    downvotes: type === 'DOWNVOTE' ? { increment: 1 } : undefined
                }
            });
            const updated = await prisma.post.findUnique({ where: { id: postId } });
            return res.json({ userVote: type, score: (updated?.upvotes || 0) - (updated?.downvotes || 0) });
        }
    } catch (err) {
        console.error('Vote error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save / unsave a post (toggle)
router.post('/posts/:id/save', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const postId = String(req.params.id);
    try {
        const existing = await prisma.savedPost.findFirst({
            where: { postId, userId: user.id }
        });
        if (existing) {
            await prisma.savedPost.delete({ where: { id: existing.id } });
            res.json({ isSaved: false });
        } else {
            await prisma.savedPost.create({ data: { postId, userId: user.id } });
            res.json({ isSaved: true });
        }
    } catch (err) {
        console.error('Save error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add comment to a post
router.post('/posts/:id/comments', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { content } = req.body;
    const postId = String(req.params.id);
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });
    try {
        const comment = await prisma.comment.create({
            data: { content: content.trim(), postId, authorId: user.id },
            include: { author: { select: { id: true, name: true, role: true } } }
        });

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (post && post.authorId !== user.id) {
            await prisma.notification.create({
                data: {
                    userId: post.authorId,
                    content: `${user.name} commented on your post "${post.title}"`,
                    link: `/forum/${postId}`
                }
            });
        }

        const mentions = content.match(/@(\w+)/g);
        if (mentions) {
            for (const mention of mentions) {
                const uname = mention.substring(1);
                const targetUsers = await prisma.user.findMany({ where: { name: { contains: uname, mode: 'insensitive' } } });
                for (const tu of targetUsers) {
                    if (tu.id !== user.id) {
                        await prisma.notification.create({
                            data: {
                                userId: tu.id,
                                content: `${user.name} mentioned you in a comment on "${post?.title || 'a post'}"`,
                                link: `/forum/${postId}`
                            }
                        });
                    }
                }
            }
        }

        res.status(201).json(comment);
    } catch (err) {
        console.error('Add comment error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reply to a comment (threaded)
router.post('/comments/:id/reply', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { content } = req.body;
    const commentId = String(req.params.id);
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });
    try {
        const parent = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!parent) return res.status(404).json({ error: 'Comment not found' });

        const reply = await prisma.comment.create({
            data: { content: content.trim(), postId: parent.postId, authorId: user.id, parentCommentId: parent.id },
            include: { author: { select: { id: true, name: true, role: true } } }
        });

        // Notify the parent comment author
        if (parent.authorId !== user.id) {
            await prisma.notification.create({
                data: {
                    userId: parent.authorId,
                    content: `${user.name} replied to your comment`,
                    link: `/forum/${parent.postId}`
                }
            });
        }

        // Also notify the post author if different from parent comment author and commenter
        const parentPost = await prisma.post.findUnique({ where: { id: parent.postId } });
        if (parentPost && parentPost.authorId !== user.id && parentPost.authorId !== parent.authorId) {
            await prisma.notification.create({
                data: {
                    userId: parentPost.authorId,
                    content: `${user.name} commented on your post "${parentPost.title}"`,
                    link: `/forum/${parent.postId}`
                }
            });
        }

        const mentions = content.match(/@(\w+)/g);
        if (mentions) {
            for (const mention of mentions) {
                const uname = mention.substring(1);
                const targetUsers = await prisma.user.findMany({ where: { name: { contains: uname, mode: 'insensitive' } } });
                for (const tu of targetUsers) {
                    if (tu.id !== user.id) {
                        await prisma.notification.create({
                            data: {
                                userId: tu.id,
                                content: `${user.name} mentioned you in a comment`,
                                link: `/forum/${parent.postId}`
                            }
                        });
                    }
                }
            }
        }

        res.status(201).json(reply);
    } catch (err) {
        console.error('Reply error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Vote on a comment
router.post('/comments/:id/vote', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const commentId = String(req.params.id);
    const { type } = req.body; // 'UPVOTE' or 'DOWNVOTE'

    if (!type || !['UPVOTE', 'DOWNVOTE'].includes(type)) {
        return res.status(400).json({ error: 'Invalid vote type' });
    }

    try {
        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const existing = await prisma.commentVote.findFirst({
            where: { commentId, userId: user.id }
        });

        if (existing) {
            if (existing.type === type) {
                // Toggle off
                await prisma.commentVote.delete({ where: { id: existing.id } });
                await prisma.comment.update({
                    where: { id: commentId },
                    data: {
                        upvotes: type === 'UPVOTE' ? { decrement: 1 } : undefined,
                        downvotes: type === 'DOWNVOTE' ? { decrement: 1 } : undefined
                    }
                });
                const updated = await prisma.comment.findUnique({ where: { id: commentId } });
                return res.json({ userVote: null, score: (updated?.upvotes || 0) - (updated?.downvotes || 0) });
            } else {
                // Switch vote
                await prisma.commentVote.update({
                    where: { id: existing.id },
                    data: { type }
                });
                await prisma.comment.update({
                    where: { id: commentId },
                    data: {
                        upvotes: type === 'UPVOTE' ? { increment: 1 } : { decrement: 1 },
                        downvotes: type === 'DOWNVOTE' ? { increment: 1 } : { decrement: 1 }
                    }
                });
                const updated = await prisma.comment.findUnique({ where: { id: commentId } });
                return res.json({ userVote: type, score: (updated?.upvotes || 0) - (updated?.downvotes || 0) });
            }
        } else {
            // New vote
            await prisma.commentVote.create({ data: { commentId, userId: user.id, type } });
            await prisma.comment.update({
                where: { id: commentId },
                data: {
                    upvotes: type === 'UPVOTE' ? { increment: 1 } : undefined,
                    downvotes: type === 'DOWNVOTE' ? { increment: 1 } : undefined
                }
            });
            const updated = await prisma.comment.findUnique({ where: { id: commentId } });
            return res.json({ userVote: type, score: (updated?.upvotes || 0) - (updated?.downvotes || 0) });
        }
    } catch (err) {
        console.error('Comment vote error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark best answer (post author or BUSINESS_ADMIN only)
router.put('/posts/:id/best-answer', authenticate, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { commentId } = req.body;
    const postId = String(req.params.id);
    try {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.authorId !== user.id && user.role !== 'BUSINESS_ADMIN') {
            return res.status(403).json({ error: 'Only post author or admin can set best answer' });
        }
        const updated = await prisma.post.update({
            where: { id: postId },
            data: { isBestAnswerId: commentId || null }
        });
        res.json(updated);
    } catch (err) {
        console.error('Best answer error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get related posts Based on tags and category
router.get('/posts/:id/related', authenticate, async (req: Request, res: Response) => {
    try {
        const postId = String(req.params.id);
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const related = await prisma.post.findMany({
            where: {
                id: { not: postId },
                status: 'PUBLISHED',
                OR: [
                    { categoryId: post.categoryId },
                    { tags: { hasSome: post.tags } }
                ]
            },
            take: 5,
            orderBy: { upvotes: 'desc' },
            include: { _count: { select: { comments: true } } }
        });

        res.json(related);
    } catch (err) {
        console.error('Related error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get related resources Based on tags matching titles/descriptions
router.get('/posts/:id/resources', authenticate, async (req: Request, res: Response) => {
    try {
        const postId = String(req.params.id);
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ error: 'Post not found' });

        if (post.tags.length === 0) return res.json([]);

        // Find resources where title or description contains at least one of the tags
        const OR_conditions = post.tags.map(tag => ({
            OR: [
                { title: { contains: tag, mode: 'insensitive' as const } },
                { description: { contains: tag, mode: 'insensitive' as const } }
            ]
        }));

        const resources = await prisma.resource.findMany({
            where: { OR: OR_conditions.flat() },
            take: 5
        });

        res.json(resources);
    } catch (err) {
        console.error('Resources error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});
// Get active announcements
router.get('/announcements', authenticate, async (req: Request, res: Response) => {
    try {
        const announcements = await prisma.announcement.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        res.json(announcements);
    } catch (err) {
        console.error('Fetch announcements error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
