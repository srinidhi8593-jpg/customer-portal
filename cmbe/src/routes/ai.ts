import express, { Request, Response } from 'express';
import { authenticate } from '../middlewares/rbac';
import prisma from '../db';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

const apiKey = process.env.GEMINI_API_KEY;
// Initialize the AI client only if the API key is present
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

router.post('/chat', authenticate, async (req: Request, res: Response) => {
    const { message, history } = req.body;
    const user = (req as any).user;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const lowerMsg = message.trim().toLowerCase();
        const isGreeting = ['hi', 'hello', 'hey', 'greetings', 'help'].includes(lowerMsg);

        if (!ai && isGreeting) {
            return res.json({ reply: "Hi there! 👋 I am currently operating in **Database-Only Mode** because my AI brain (API Key) isn't connected yet.\n\nAsk me a specific question, and I'll search our community forum to find relevant posts for you!" });
        }

        // RAG Implementation: Find relevant forum posts based on the keywords in the message.
        const stopWords = ['what', 'where', 'when', 'how', 'why', 'who', 'this', 'that', 'with', 'from', 'want', 'provide', 'show', 'please', 'could', 'would', 'should', 'give', 'can', 'you', 'are', 'the', 'and', 'for', 'any'];
        const keywords = message.toLowerCase().split(/[ \n\t.,!?]+/).filter((w: string) => w.length > 2 && !stopWords.includes(w));

        let contextPosts = [];
        let searchMode = 'exact';

        if (keywords.length > 0) {
            // First try strict AND
            contextPosts = await prisma.post.findMany({
                where: {
                    status: 'PUBLISHED',
                    AND: keywords.map((kw: string) => ({
                        OR: [
                            { title: { contains: kw, mode: 'insensitive' } },
                            { content: { contains: kw, mode: 'insensitive' } },
                            { tags: { has: kw } },
                            { comments: { some: { content: { contains: kw, mode: 'insensitive' } } } }
                        ]
                    }))
                },
                orderBy: { upvotes: 'desc' }, // prioritise trending matches
                take: 5,
                select: { id: true, title: true, content: true, tags: true }
            });

            // If strict AND fails, fallback to OR (partial match)
            if (contextPosts.length === 0) {
                searchMode = 'partial';
                contextPosts = await prisma.post.findMany({
                    where: {
                        status: 'PUBLISHED',
                        OR: keywords.map((kw: string) => ({
                            title: { contains: kw, mode: 'insensitive' }
                        })).concat(keywords.map((kw: string) => ({
                            content: { contains: kw, mode: 'insensitive' }
                        }))).concat(keywords.map((kw: string) => ({
                            comments: { some: { content: { contains: kw, mode: 'insensitive' } } }
                        })))
                    },
                    orderBy: { upvotes: 'desc' },
                    take: 5,
                    select: { id: true, title: true, content: true, tags: true }
                });
            }
        }

        // If no keyword match found, get the latest trending posts context.
        if (contextPosts.length === 0 && !isGreeting) {
            searchMode = 'fallback';
            contextPosts = await prisma.post.findMany({
                where: { status: 'PUBLISHED' },
                orderBy: { createdAt: 'desc' }, // show most recent instead of same top-voted ones
                take: 5,
                select: { id: true, title: true, content: true, tags: true }
            });
        }

        let contextBlock = '';
        if (contextPosts.length > 0) {
            contextBlock = 'Here are some relevant forum posts from the DebatHub Community knowledge base:\n\n';
            contextPosts.forEach((post, index) => {
                // strip HTML from post content for the context block
                const plainTextContent = post.content.replace(/<[^>]*>?/gm, '');
                contextBlock += `[Post ${index + 1}] Title: ${post.title}\nTags: ${post.tags.join(', ')}\nContent: ${plainTextContent.substring(0, 1000)}\n\n`;
            });
        } else {
            contextBlock = 'No highly relevant specific forum posts were found, but you can answer generally based on your knowledge if applicable.';
        }

        const systemInstruction = `You are a helpful and polite AI assistant for DebatHub.
You help users by answering their questions, drawing primarily from the knowledge within the community forum posts provided in the context below.
Always try to use the provided context to answer the question. If you use information from a post, mention that you found it in the community forum.
If the context does not contain the answer, politely inform the user that you don't have that specific information in the current community knowledge base, but help them as best as you can.
Do not invent information about DebatHub products that is not supported by the context.
Return your response formatted in Markdown.

--- CONTEXT ---
${contextBlock}
--- END CONTEXT ---`;

        // We could map the 'history' array (which contains {role: 'user'|'model', parts: [{text: string}]})
        if (!ai) {
            let fallbackReply = "";
            if (searchMode === 'fallback') {
                fallbackReply = "I am currently operating in **Database-Only Mode** and couldn't find exact matches for your request. However, here are the latest posts from the forum:\n\n";
            } else if (searchMode === 'partial') {
                fallbackReply = "I am currently operating in **Database-Only Mode**. I found some posts that partially match your keywords:\n\n";
            } else {
                fallbackReply = "I am currently operating in **Database-Only Mode**. Here are the most relevant posts I found:\n\n";
            }

            if (contextPosts.length > 0) {
                contextPosts.forEach(p => {
                    fallbackReply += `- [**${p.title}**](/forum/${p.id})\n`;
                });
                fallbackReply += "\nPlease review the posts above for more details!";
            } else {
                fallbackReply = "I am currently operating in **Database-Only Mode** and could not find any forum posts matching your query.";
            }
            return res.json({ reply: fallbackReply });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2, // low temp for factual QA
            }
        });

        res.json({ reply: response.text });
    } catch (err) {
        console.error('AI Chat Error:', err);
        res.status(500).json({ error: 'Failed to generate AI response' });
    }
});

router.post('/suggest', authenticate, async (req: Request, res: Response) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Post title and content are required' });
    }

    try {
        if (!ai) {
            return res.json({
                suggestion: "I am currently operating in **Database-Only Mode** because my AI brain (API Key) isn't connected yet.\n\n" +
                    "Normally, I would analyze this post and provide helpful suggestions, relevant resources, or troubleshooting steps based on the context."
            });
        }

        const plainTextContent = content.replace(/<[^>]*>?/gm, '');
        const prompt = `Please act as a helpful AI assistant for a community forum.
I am going to provide you with the title and content of a user's forum post.
Your task is to comprehensively analyze the **Post Title** and provide highly relevant suggestions.
Crucially, you must pull recent data, relevant internet links, and study materials that directly address the topic.
Format your response nicely in Markdown and clearly list out the URLs and resources you suggest.

**Post Title**: ${title}
**Post Content**: ${plainTextContent}

**Your Suggestion (including recent data, relevant links, and study materials)**:`

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3,
            }
        });

        res.json({ suggestion: response.text });
    } catch (err: any) {
        console.error('AI Suggest Error Message:', err?.message);
        console.error('AI Suggest Error Full:', err);
        res.status(500).json({ error: 'Failed to generate AI suggestion', details: err?.message });
    }
});

export default router;
