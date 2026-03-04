'use client';

import Link from 'next/link';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const FEATURED_CATEGORIES = ['Knowledge Base', 'FAQs', 'Guides', 'Configuration', 'Best Practices'];

interface Announcement { id: string; title: string; description: string; createdAt: string; }

interface Post {
    id: string;
    title: string;
    content: string;
    status: string;
    tags: string[];
    createdAt: string;
    author: { name: string };
    category: { id: string; name: string } | null;
    _count: { comments: number; likes: number };
}

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-3">
                    <div className="h-3 w-24 skeleton" />
                    <div className="h-5 w-3/4 skeleton" />
                    <div className="h-3 w-32 skeleton" />
                </div>
            </div>
            <div className="mt-5 space-y-2">
                <div className="h-3 w-full skeleton" />
                <div className="h-3 w-2/3 skeleton" />
            </div>
            <div className="mt-6 pt-5 border-t border-gray-50 flex justify-between">
                <div className="flex gap-2">
                    <div className="h-6 w-16 skeleton rounded-lg" />
                    <div className="h-6 w-16 skeleton rounded-lg" />
                </div>
                <div className="flex gap-4">
                    <div className="h-4 w-8 skeleton" />
                    <div className="h-4 w-8 skeleton" />
                </div>
            </div>
        </div>
    );
}

function PostCard({ post, index }: { post: Post; index: number }) {
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return (
        <Link href={`/forum/${post.id}`}
            className={`block bg-white rounded-2xl border border-gray-100 p-6 hover-lift hover:border-acron-pitch/40 transition-all duration-300 group relative overflow-hidden animate-fade-in-up`}
            style={{ animationDelay: `${index * 0.08}s` }}>
            {/* Subtle background glow on hover */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-acron-pitch/5 blur-3xl group-hover:bg-acron-pitch/15 transition-all duration-500 rounded-full" />

            <div className="flex items-start justify-between relative z-10">
                <div className="flex items-start space-x-4 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-acron-pitch to-acron-thrust rounded-xl flex items-center justify-center text-acron-yoke-500 font-extrabold text-sm flex-shrink-0 shadow-sm shadow-acron-pitch/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        {post.author.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 mt-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-acron-pitch uppercase tracking-widest">{post.category?.name || 'General'}</span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs font-semibold text-gray-500">{formatDate(post.createdAt)}</span>
                        </div>
                        <h3 className="text-lg font-extrabold text-acron-yoke-500 group-hover:text-acron-pitch transition-colors duration-300 leading-tight mb-1">{post.title}</h3>
                        <p className="text-sm text-gray-400 font-medium">By <span className="text-acron-yoke-400 font-semibold">{post.author.name}</span></p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                    <span className={`flex-shrink-0 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border-b-2 ${post.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        post.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>{post.status === 'PUBLISHED' ? 'PUBLISHED' : 'PENDING'}</span>
                </div>
            </div>

            <p className="text-sm text-gray-500 mt-5 line-clamp-2 leading-relaxed">
                {post.content.replace(/<[^>]*>/g, '').slice(0, 180)}...
            </p>

            <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-50 relative z-10">
                <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs font-semibold bg-gray-50 text-acron-thrust border border-gray-100 px-3 py-1 rounded-lg lowercase transition-all duration-300 group-hover:border-acron-thrust/20 group-hover:bg-acron-thrust/5">#{tag}</span>
                    ))}
                </div>
                <div className="flex items-center space-x-5 text-sm font-semibold text-gray-400">
                    <div className="flex items-center gap-1.5 hover:text-red-400 transition-colors">
                        <span className="text-base">❤️</span> {post._count.likes}
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-acron-pitch transition-colors">
                        <span className="text-base">💬</span> {post._count.comments}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function DashboardPage() {
    const { user, isLoading, token } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        }
    }, [isLoading, user, router]);

    // Fetch real posts and announcements
    useEffect(() => {
        if (!token) return;

        fetch(`${API_URL}/forum/posts?take=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setPosts(data); })
            .catch(() => { })
            .finally(() => setLoadingPosts(false));

        fetch(`${API_URL}/forum/announcements`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setAnnouncements(data); })
            .catch(() => { });
    }, [token]);

    if (isLoading || !user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-acron-pitch border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400 font-medium">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="text-xs text-gray-500 animate-fade-in">
                <Link href="/" className="hover:text-acron-pitch transition-colors">Home</Link> › <span className="text-acron-pitch font-medium">Dashboard</span>
            </nav>

            {/* Welcome Bar */}
            <div className="relative overflow-hidden bg-gradient-to-br from-acron-yoke-500 via-acron-thrust to-acron-yoke-400 rounded-3xl p-8 text-white shadow-2xl shadow-acron-yoke-500/20 card-shine">
                <div className="absolute top-0 right-0 w-64 h-64 bg-acron-pitch opacity-10 blur-[100px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-acron-thrust opacity-20 blur-[80px] -ml-24 -mb-24" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-xs text-gray-300 font-bold uppercase tracking-widest mb-2">{today}</p>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Welcome back, <span className="text-acron-pitch">{user.name.split(' ')[0]}</span></h1>
                        <p className="text-gray-300 mt-2 font-medium text-sm">Here&apos;s what&apos;s happening in your community today.</p>
                    </div>
                    <Link href="/forum/create" className="hidden md:inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm active:scale-95">
                        <span>✏️</span> New Post
                    </Link>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Create Post', desc: 'Share a topic or news', icon: '✏️', href: '/forum/create', gradient: 'from-emerald-500/10 to-teal-500/5' },
                    { label: 'Ask a Question', desc: 'Expert community help', icon: '💬', href: '/forum/create', gradient: 'from-blue-500/10 to-indigo-500/5' },
                    { label: 'My Submissions', desc: 'History and stats', icon: '📊', href: '/account/posts', gradient: 'from-purple-500/10 to-pink-500/5' },
                ].map((a, i) => (
                    <Link key={a.label} href={a.href}
                        className={`bg-white rounded-2xl border border-gray-100 p-5 hover-lift group relative overflow-hidden transition-all duration-300 flex items-start space-x-4 hover-gradient-border animate-fade-in-up`}
                        style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        <span className="text-2xl relative z-10 p-3 bg-gray-50 rounded-xl group-hover:scale-110 transition-transform duration-300 block">{a.icon}</span>
                        <div className="relative z-10">
                            <p className="text-sm font-extrabold text-acron-yoke-500 group-hover:text-acron-thrust transition-colors">{a.label}</p>
                            <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed">{a.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left 2 cols */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Recent Posts */}
                    <section>
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-lg font-black text-acron-yoke-500">Recent Posts</h2>
                            <Link href="/forum" className="text-acron-pitch text-xs font-bold hover:text-acron-thrust transition-colors flex items-center gap-1">
                                View All
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                        {loadingPosts ? (
                            <div className="space-y-3">
                                {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center animate-fade-in">
                                <div className="text-5xl mb-4">📝</div>
                                <p className="text-gray-500 font-bold mb-2">No posts yet</p>
                                <p className="text-sm text-gray-400 mb-4">Be the first to share something with the community.</p>
                                <Link href="/forum/create" className="inline-flex items-center gap-2 text-acron-pitch font-bold text-sm hover:text-acron-thrust transition-colors">
                                    Create your first post
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
                            </div>
                        )}
                    </section>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">

                    {/* Featured Categories */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up delay-300">
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="text-xs font-black text-acron-yoke-500 uppercase tracking-widest">Trending Categories</h3>
                        </div>
                        <div className="p-5 flex flex-wrap gap-2">
                            {FEATURED_CATEGORIES.map(cat => (
                                <Link key={cat} href="/forum"
                                    className="text-[10px] font-bold bg-white text-acron-yoke-500 border border-gray-100 px-3.5 py-2 rounded-xl hover:bg-acron-pitch hover:text-acron-yoke-500 hover:border-acron-pitch hover-lift transition-all duration-300 uppercase tracking-tight">
                                    {cat}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Announcements */}
                    {announcements.length > 0 && (
                        <div className="glass-dark rounded-2xl border border-white/5 shadow-premium overflow-hidden text-white animate-fade-in-up delay-400">
                            <div className="px-6 py-4 border-b border-white/10 bg-black/10 flex items-center gap-2">
                                <span className="text-acron-pitch animate-pulse">📢</span>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-acron-pitch">Announcements</h3>
                            </div>
                            <ul className="divide-y divide-white/5">
                                {announcements.map((a) => (
                                    <li key={a.id} className="px-6 py-5 hover:bg-white/5 transition-colors duration-300 cursor-pointer group">
                                        <div className="flex items-start space-x-4">
                                            <div className="w-9 h-9 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0 group-hover:scale-110 group-hover:bg-acron-pitch/20 transition-all duration-300">
                                                {a.title.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-white leading-tight">{a.title}</p>
                                                <p className="text-[11px] text-gray-300 mt-1 leading-snug font-medium line-clamp-2">{a.description}</p>
                                                <p className="text-[10px] text-acron-pitch mt-2 font-bold uppercase tracking-wider">{new Date(a.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
