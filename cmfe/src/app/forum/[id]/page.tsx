'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { API_URL } from '@/config/api';
const API = `${API_URL}/forum`;

interface Author { id: string; name: string; role: string; }
interface Reply { id: string; content: string; author: Author; upvotes: number; downvotes: number; score: number; userVote: string | null; createdAt: string; }
interface Comment { id: string; content: string; author: Author; upvotes: number; downvotes: number; score: number; userVote: string | null; createdAt: string; replies: Reply[]; }
interface Post {
    id: string; title: string; content: string; status: string; tags: string[];
    attachments: string[]; createdAt: string; updatedAt: string;
    author: Author; category: { id: string; name: string } | null;
    comments: Comment[]; userVote: string | null; score: number; isSaved: boolean; commentsCount: number;
    isBestAnswerId: string | null;
}
interface RelatedPost { id: string; title: string; category: { name: string } | null; _count: { comments: number }; }
interface RelatedResource { id: string; title: string; fileUrl: string; }

export default function PostDetailPage() {
    const params = useParams();
    const postId = params.id as string;
    const { user, token, isLoading } = useAuth();
    const router = useRouter();
    const commentEditorRef = useRef<HTMLDivElement>(null);

    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(false);
    const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
    const [relatedResources, setRelatedResources] = useState<RelatedResource[]>([]);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [isSuggesting, setIsSuggesting] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [showSuggestion, setShowSuggestion] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (!isLoading && !user) router.push('/auth/login');
    }, [isLoading, user, router]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;

                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        }
                    }
                    if (finalTranscript && commentEditorRef.current) {
                        const currentHtml = commentEditorRef.current.innerHTML;
                        const space = currentHtml && !currentHtml.endsWith(' ') ? ' ' : '';
                        commentEditorRef.current.innerHTML = currentHtml + space + finalTranscript;

                        // Move cursor to end
                        const range = document.createRange();
                        const sel = window.getSelection();
                        range.selectNodeContents(commentEditorRef.current);
                        range.collapse(false);
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsRecording(false);
                };

                recognition.onend = () => {
                    setIsRecording(false);
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Failed to start recording", err);
            }
        }
    };

    const fetchRelated = useCallback(async () => {
        if (!token) return;
        try {
            const [resP, resR] = await Promise.all([
                fetch(`${API}/posts/${postId}/related`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API}/posts/${postId}/resources`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (resP.ok) setRelatedPosts(await resP.json());
            if (resR.ok) setRelatedResources(await resR.json());
        } catch { console.error('Failed to load related content'); }
    }, [token, postId]);

    const fetchPost = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/posts/${postId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) { setError('Post not found'); setLoading(false); return; }
            const data = await res.json();
            setPost(data);
            setSaved(data.isSaved);
        } catch { setError('Unable to connect'); }
        setLoading(false);
    }, [token, postId]);

    useEffect(() => { fetchPost(); fetchRelated(); }, [fetchPost, fetchRelated]);

    const handlePostVote = async (type: 'UPVOTE' | 'DOWNVOTE') => {
        if (!token || !post) return;
        const previousVote = post.userVote;
        const previousScore = post.score;

        let newScore = previousScore;
        if (previousVote === type) { newScore += (type === 'UPVOTE' ? -1 : 1); setPost({ ...post, userVote: null, score: newScore }); }
        else {
            if (previousVote) newScore += (previousVote === 'UPVOTE' ? -2 : 2);
            else newScore += (type === 'UPVOTE' ? 1 : -1);
            setPost({ ...post, userVote: type, score: newScore });
        }

        const res = await fetch(`${API}/posts/${postId}/vote`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ type })
        });
        if (!res.ok) setPost({ ...post, userVote: previousVote, score: previousScore });
    };

    const toggleSave = async () => {
        if (!token) return;
        const res = await fetch(`${API}/posts/${postId}/save`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setSaved(data.isSaved);
        }
    };

    const submitComment = async () => {
        // Stop recording before submitting
        if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }

        const html = commentEditorRef.current?.innerHTML?.trim();
        if (!html || !token) return;
        setSubmitting(true);
        const res = await fetch(`${API}/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: html })
        });
        if (res.ok) {
            if (commentEditorRef.current) commentEditorRef.current.innerHTML = '';
            await fetchPost();
        }
        setSubmitting(false);
    };

    const submitReply = async (commentId: string) => {
        if (!replyContent.trim() || !token) return;
        setSubmitting(true);
        const res = await fetch(`${API}/comments/${commentId}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: replyContent.trim() })
        });
        if (res.ok) { setReplyingTo(null); setReplyContent(''); await fetchPost(); }
        setSubmitting(false);
    };

    const handleCommentVote = async (commentId: string, type: 'UPVOTE' | 'DOWNVOTE') => {
        if (!token) return;
        await fetch(`${API}/comments/${commentId}/vote`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ type })
        });
        await fetchPost();
    };

    const markBestAnswer = async (commentId: string) => {
        if (!token) return;
        await fetch(`${API}/posts/${postId}/best-answer`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ commentId })
        });
        await fetchPost();
    };

    const shareEmail = () => {
        if (!post) return;
        const subject = encodeURIComponent(`Check out: ${post.title}`);
        const body = encodeURIComponent(`I found this post on DebatHub:\n\n${post.title}\n\n${window.location.href}`);
        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const timeAgo = (d: string) => {
        const diff = Date.now() - new Date(d).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const execCmd = (cmd: string, val?: string) => {
        commentEditorRef.current?.focus();
        document.execCommand(cmd, false, val);
    };

    const handleAISuggestion = async () => {
        if (!post || !token) return;
        setIsSuggesting(true);
        setShowSuggestion(true);
        setAiSuggestion(null);

        try {
            const res = await fetch(`${API_URL}/ai/suggest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title: post.title, content: post.content })
            });

            if (res.ok) {
                const data = await res.json();
                setAiSuggestion(data.suggestion);
            } else {
                setAiSuggestion('Failed to load suggestion. Please try again.');
            }
        } catch {
            setAiSuggestion('An error occurred connecting to the AI.');
        }
        setIsSuggesting(false);
    };

    const canMarkBest = post && user && (post.author.id === user.id || user.role === 'BUSINESS_ADMIN');

    if (isLoading || loading) return <div className="min-h-[60vh] flex items-center justify-center text-gray-400">Loading...</div>;
    if (error || !post) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <p className="text-gray-400 mb-4">{error || 'Post not found'}</p>
            <Link href="/forum" className="text-acron-pitch font-semibold">← Back to Forum</Link>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="text-xs text-gray-500 flex items-center space-x-1">
                <Link href="/" className="hover:text-acron-pitch">Home</Link><span>&gt;</span>
                <Link href="/forum" className="hover:text-acron-pitch">Forum</Link><span>&gt;</span>
                <span className="text-acron-pitch font-medium truncate max-w-[300px]">{post.title}</span>
            </nav>

            <Link href="/forum" className="inline-flex items-center text-sm text-gray-500 hover:text-acron-pitch transition-colors">
                ← Back to Forum
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Post */}
                    <article className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-6 flex items-start space-x-5">
                            {/* Vertical Voting */}
                            <div className="flex flex-col items-center space-y-1 flex-shrink-0 mt-1">
                                <button onClick={() => handlePostVote('UPVOTE')} title="This post is useful"
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${post.userVote === 'UPVOTE' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 4l8 10H4z" /></svg>
                                </button>
                                <span className="text-xl font-bold text-gray-700">{post.score}</span>
                                <button onClick={() => handlePostVote('DOWNVOTE')} title="This post is not useful"
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${post.userVote === 'DOWNVOTE' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 20L4 10h16z" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 min-w-0">
                                {/* Author & Meta */}
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-acron-pitch rounded-full flex items-center justify-center text-acron-yoke-500 font-bold flex-shrink-0">
                                        {post.author.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h1 className="text-lg font-bold text-acron-yoke-500">{post.title}</h1>
                                        <p className="text-xs text-gray-500 mt-1">
                                            <span className="font-semibold text-acron-yoke-500">{post.author.name}</span>
                                            <span className="ml-1 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{post.author.role.replace('_', ' ')}</span>
                                            <span className="mx-1">&middot;</span>
                                            {formatDate(post.createdAt)}
                                            <span className="mx-1">&middot;</span>
                                            <span className="text-acron-pitch">{post.category?.name || 'General'}</span>
                                        </p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${post.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' :
                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>{post.status === 'PUBLISHED' ? '● Published' : '⏳ Pending'}</span>
                                </div>

                                {/* Content */}
                                <div className="mt-5 text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: post.content }} />

                                {/* Tags */}
                                {post.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-gray-100">
                                        {post.tags.map(t => <span key={t} className="text-xs bg-acron-yoke-500 text-white px-2.5 py-1 rounded">{t}</span>)}
                                    </div>
                                )}

                                {/* Attachments */}
                                {post.attachments.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h3 className="text-xs font-semibold text-gray-500 mb-2">📎 ATTACHMENTS ({post.attachments.length})</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {post.attachments.map((a, i) => (
                                                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                    <div className="flex items-center space-x-2 min-w-0">
                                                        <span className="text-sm">📄</span>
                                                        <span className="text-xs font-medium text-acron-yoke-500 truncate">{a}</span>
                                                    </div>
                                                    <button className="text-xs text-acron-pitch font-semibold hover:underline flex-shrink-0 ml-2">Download</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Engagement Bar */}
                                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                                    <div className="flex items-center space-x-4">
                                        <span className="flex items-center space-x-1.5 text-sm font-medium text-gray-500">
                                            <span>💬</span><span>{post.commentsCount} Answers</span>
                                        </span>
                                    </div>
                                    <button onClick={shareEmail}
                                        className="flex items-center space-x-1.5 text-sm text-gray-400 hover:text-acron-pitch transition-colors">
                                        <span>📧</span><span>Share via Email</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>

                    {/* Add Comment */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-bold text-acron-yoke-500 mb-3">💬 Add a Comment</h3>
                        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:border-acron-pitch focus-within:ring-1 focus-within:ring-acron-pitch">
                            <div className="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                    <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('bold'); }}
                                        className="w-7 h-7 rounded text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors">B</button>
                                    <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('italic'); }}
                                        className="w-7 h-7 rounded text-xs italic text-gray-600 hover:bg-gray-200 transition-colors">I</button>
                                    <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }}
                                        className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors">•</button>
                                    <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList'); }}
                                        className="w-7 h-7 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors">1.</button>
                                    <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'pre'); }}
                                        className="w-7 h-7 rounded text-xs font-mono text-gray-600 hover:bg-gray-200 transition-colors">&lt;/&gt;</button>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleRecording}
                                    title={isRecording ? "Stop Recording" : "Start Voice Typing"}
                                    className={`flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-bold transition-colors ${isRecording
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse'
                                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                        }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <span>{isRecording ? 'Recording...' : 'Voice Type'}</span>
                                </button>
                            </div>
                            <div ref={commentEditorRef} contentEditable suppressContentEditableWarning
                                className="min-h-[80px] p-3 text-sm text-gray-900 focus:outline-none prose prose-sm max-w-none"
                                data-placeholder="Write your comment..." />
                        </div>
                        <style>{`[contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; }`}</style>
                        <div className="mt-3 flex items-center justify-between">
                            {isRecording && <p className="text-xs text-indigo-500 font-medium animate-pulse">🎤 Listening... speak now to add to your comment.</p>}
                            <div className="flex-1"></div>
                            <button onClick={submitComment} disabled={submitting}
                                className="bg-acron-pitch text-acron-yoke-500 font-bold py-2 px-6 rounded-lg text-sm hover:bg-acron-pitch transition-all disabled:opacity-40">
                                {submitting ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div>
                        <h3 className="text-sm font-bold text-acron-yoke-500 mb-4">
                            Conversation ({post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'})
                        </h3>
                        {post.comments.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                                No comments yet. Be the first to share your thoughts!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {post.comments.map(comment => (
                                    <div key={comment.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                        {/* Best Answer Badge */}
                                        {post.isBestAnswerId === comment.id && (
                                            <div className="bg-acron-pitch/10 border-b border-acron-pitch/20 px-4 py-1.5 flex items-center space-x-1.5">
                                                <span className="text-sm">⭐</span>
                                                <span className="text-xs font-bold text-acron-yoke-500">Best Answer</span>
                                            </div>
                                        )}
                                        <div className="p-4">
                                            {/* Comment Header */}
                                            <div className="flex items-start space-x-4">
                                                {/* Comment Voting left col */}
                                                <div className="flex flex-col items-center space-y-1 flex-shrink-0 mt-1">
                                                    <button onClick={() => handleCommentVote(comment.id, 'UPVOTE')} title="Upvote"
                                                        className={`w-7 h-7 text-[10px] rounded-full flex items-center justify-center transition-colors ${comment.userVote === 'UPVOTE' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                                        ▲
                                                    </button>
                                                    <span className="text-xs font-bold text-gray-700">{comment.score}</span>
                                                    <button onClick={() => handleCommentVote(comment.id, 'DOWNVOTE')} title="Downvote"
                                                        className={`w-7 h-7 text-[10px] rounded-full flex items-center justify-center transition-colors ${comment.userVote === 'DOWNVOTE' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                                                        ▼
                                                    </button>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-[10px] flex-shrink-0">
                                                                {comment.author.name.charAt(0)}
                                                            </div>
                                                            <p className="text-xs">
                                                                <span className="font-bold text-acron-yoke-500">{comment.author.name}</span>
                                                                <span className="ml-1 text-gray-400">&middot; {timeAgo(comment.createdAt)}</span>
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            {canMarkBest && post.isBestAnswerId !== comment.id && (
                                                                <button onClick={() => markBestAnswer(comment.id)}
                                                                    className="text-xs text-gray-400 hover:text-acron-pitch transition-colors" title="Mark as Best Answer">
                                                                    ⭐ Best
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-sm text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: comment.content }} />

                                                    {/* Comment Actions */}
                                                    <div className="flex items-center space-x-4 mt-3">
                                                        <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                            className="text-xs text-gray-400 hover:text-acron-pitch transition-colors">
                                                            ↩ Reply
                                                        </button>
                                                    </div>

                                                    {/* Reply Form */}
                                                    {replyingTo === comment.id && (
                                                        <div className="mt-3 ml-2 pl-3 border-l-2 border-acron-pitch/30">
                                                            <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
                                                                rows={2} placeholder="Write a reply..."
                                                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:border-acron-pitch focus:ring-acron-pitch focus:outline-none" />
                                                            <div className="flex justify-end space-x-2 mt-2">
                                                                <button onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                                                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">Cancel</button>
                                                                <button onClick={() => submitReply(comment.id)} disabled={submitting || !replyContent.trim()}
                                                                    className="bg-acron-pitch text-acron-yoke-500 font-bold py-1.5 px-4 rounded-lg text-xs hover:bg-acron-pitch disabled:opacity-40">
                                                                    {submitting ? '...' : 'Reply'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Threaded Replies */}
                                                    {comment.replies.length > 0 && (
                                                        <div className="mt-3 space-y-2 ml-2 pl-3 border-l-2 border-gray-100">
                                                            {comment.replies.map(reply => (
                                                                <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-[10px]">
                                                                            {reply.author.name.charAt(0)}
                                                                        </div>
                                                                        <span className="text-xs font-bold text-acron-yoke-500">{reply.author.name}</span>
                                                                        <span className="text-xs text-gray-400">&middot; {timeAgo(reply.createdAt)}</span>
                                                                    </div>
                                                                    <div className="mt-1.5 text-xs text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: reply.content }} />
                                                                    <div className="flex items-center space-x-2 mt-2">
                                                                        <button onClick={() => handleCommentVote(reply.id, 'UPVOTE')}
                                                                            className={`text-xs transition-colors ${reply.userVote === 'UPVOTE' ? 'text-orange-600' : 'text-gray-400 hover:text-acron-pitch'}`}>
                                                                            ▲ {reply.score}
                                                                        </button>
                                                                    </div>
                                                                    {/* Best Answer Badge for reply */}
                                                                    {post.isBestAnswerId === reply.id && (
                                                                        <span className="inline-flex items-center space-x-1 text-xs bg-acron-pitch/10 text-acron-yoke-500 font-bold px-2 py-0.5 rounded mt-1.5">
                                                                            <span>⭐</span><span>Best Answer</span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    {/* Related Questions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-xs font-bold text-gray-500 mb-3">RELATED QUESTIONS</h3>
                        {relatedPosts.length === 0 ? (
                            <p className="text-xs text-gray-400">No related questions found.</p>
                        ) : (
                            <div className="space-y-3">
                                {relatedPosts.map(rp => (
                                    <Link key={rp.id} href={`/forum/${rp.id}`} className="block group">
                                        <h4 className="text-sm font-medium text-acron-pitch group-hover:underline line-clamp-2 leading-snug">{rp.title}</h4>
                                        <p className="text-xs text-gray-400 mt-1">💬 {rp._count.comments} answers &middot; {rp.category?.name || 'General'}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Related Resources */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-xs font-bold text-gray-500 mb-3">SUGGESTED RESOURCES</h3>
                        {relatedResources.length === 0 ? (
                            <p className="text-xs text-gray-400">No mapped resources.</p>
                        ) : (
                            <div className="space-y-3">
                                {relatedResources.map(rr => (
                                    <a key={rr.id} href={rr.fileUrl} target="_blank" rel="noopener noreferrer" className="block group bg-gray-50 p-3 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-start space-x-2">
                                            <span className="text-lg">📚</span>
                                            <div>
                                                <h4 className="text-sm font-medium text-acron-pitch group-hover:underline leading-snug">{rr.title}</h4>
                                                <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase">External Link</span>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-xs font-bold text-gray-500 mb-3">POST ACTIONS</h3>
                        <button onClick={handleAISuggestion} disabled={isSuggesting}
                            className={`w-full mb-3 text-sm font-bold py-2.5 rounded-lg border transition-all flex items-center justify-center space-x-2 ${isSuggesting ? 'bg-indigo-50 text-indigo-400 border-indigo-200 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-transparent shadow-sm hover:from-indigo-600 hover:to-purple-600'}`}>
                            <span>✨</span>
                            <span>{isSuggesting ? 'Thinking...' : 'AI Suggestion'}</span>
                        </button>
                        <button onClick={toggleSave}
                            className={`w-full text-sm font-medium py-2.5 rounded-lg border transition-all flex items-center justify-center space-x-2 ${saved ? 'bg-acron-yoke-500 text-white border-acron-yoke-500 shadow-sm hover:bg-[#07181a]' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                            <span>{saved ? '🔖' : '📑'}</span>
                            <span>{saved ? 'Saved to My Posts' : 'Save Post'}</span>
                        </button>
                        <button onClick={shareEmail}
                            className="w-full mt-3 flex items-center justify-center space-x-2 bg-gray-100 text-acron-yoke-500 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                            <span>📧</span><span>Share via Email</span>
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(window.location.href); }}
                            className="w-full mt-2 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                            <span>🔗</span><span>Copy Link</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* AI Suggestion Modal Overlap */}
            {showSuggestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between shadow-sm">
                            <h3 className="text-white font-bold flex items-center space-x-2">
                                <span className="text-xl">✨</span>
                                <div>
                                    <span className="block text-sm">AI Assistant</span>
                                    <span className="block text-xs font-normal opacity-80">Insights & Suggestions</span>
                                </div>
                            </h3>
                            <button onClick={() => setShowSuggestion(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto w-full">
                            {isSuggesting ? (
                                <div className="space-y-4 animate-pulse pt-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed
                                    prose-headings:text-indigo-900 prose-headings:font-bold prose-headings:mb-4 prose-headings:mt-6
                                    prose-a:text-indigo-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                                    prose-li:my-1 prose-ul:my-4 prose-ul:list-disc prose-ol:list-decimal prose-ol:my-4
                                    prose-p:mb-4 last:prose-p:mb-0
                                    prose-strong:text-gray-900 prose-strong:font-bold">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {aiSuggestion || ''}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                        <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-end">
                            <button onClick={() => setShowSuggestion(false)} className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
