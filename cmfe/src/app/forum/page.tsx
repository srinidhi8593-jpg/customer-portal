'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

const SORT_OPTIONS = ['Latest', 'Most Liked', 'Most Commented', 'Oldest'];

interface Post {
    id: string;
    title: string;
    content: string;
    status: string;
    tags: string[];
    attachments: string[];
    createdAt: string;
    author: { name: string };
    category: { id: string; name: string } | null;
    _count: { comments: number; likes: number };
}

interface Category {
    id: string;
    name: string;
}

function SkeletonPost() {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-3">
                    <div className="h-3 w-28 skeleton" />
                    <div className="h-5 w-3/4 skeleton" />
                    <div className="h-3 w-36 skeleton" />
                </div>
                <div className="h-7 w-20 skeleton rounded-lg" />
            </div>
            <div className="mt-5 space-y-2">
                <div className="h-3 w-full skeleton" />
                <div className="h-3 w-5/6 skeleton" />
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

export default function ForumListingPage() {
    const { token } = useAuth();
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [sort, setSort] = useState('Latest');
    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch categories
    useEffect(() => {
        fetch(`${API_URL}/forum/categories`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setCategories(data); })
            .catch(() => { });
    }, []);

    // Fetch posts
    useEffect(() => {
        if (!token) return;
        setLoading(true);
        const params = new URLSearchParams();
        if (categoryId) params.set('categoryId', categoryId);
        if (search) params.set('search', search);
        params.set('take', '20');

        fetch(`${API_URL}/forum/posts?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setPosts(data); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [token, categoryId]);

    // Search with debounce on button click
    const doSearch = () => {
        if (!token) return;
        setLoading(true);
        const params = new URLSearchParams();
        if (categoryId) params.set('categoryId', categoryId);
        if (search) params.set('search', search);
        params.set('take', '20');

        fetch(`${API_URL}/forum/posts?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setPosts(data); })
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="space-y-6">
            <nav className="text-xs text-gray-500 animate-fade-in">
                <Link href="/" className="hover:text-acron-pitch transition-colors">Home</Link> › <span className="text-acron-pitch font-medium">Forum</span>
            </nav>

            <div className="flex justify-between items-center animate-fade-in-up">
                <div>
                    <h1 className="text-2xl font-black text-acron-yoke-500 tracking-tight">Community Forum</h1>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Discover discussions, share knowledge, and connect with peers</p>
                </div>
                <Link href="/forum/create" className="bg-acron-pitch hover:bg-acron-yoke-500 hover:text-white text-acron-yoke-500 font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-sm active:scale-95 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Post
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-wrap items-center gap-4 animate-fade-in-up delay-100">
                <div className="flex-1 min-w-[240px]">
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && doSearch()}
                            placeholder="Find discussions..." className="input-premium w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                        className="input-premium bg-white rounded-xl text-xs font-bold uppercase tracking-wider p-2.5 cursor-pointer">
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={sort} onChange={e => setSort(e.target.value)}
                        className="input-premium bg-white rounded-xl text-xs font-bold uppercase tracking-wider p-2.5 cursor-pointer">
                        {SORT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <button onClick={doSearch} className="bg-acron-yoke-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-acron-thrust transition-all duration-300 shadow-sm active:scale-95">Search</button>
            </div>

            {/* Results */}
            <p className="text-xs text-gray-400 font-medium">{loading ? '' : `${posts.length} results found`}</p>

            {loading ? (
                <div className="space-y-4">
                    {[0, 1, 2, 3].map(i => <SkeletonPost key={i} />)}
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center animate-fade-in">
                    <div className="text-6xl mb-5 animate-float">🔍</div>
                    <p className="text-lg font-black text-acron-yoke-500 mb-2">No discussions found</p>
                    <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">Try adjusting your filters or start a new conversation with the community.</p>
                    <Link href="/forum/create" className="inline-flex items-center gap-2 bg-acron-pitch text-acron-yoke-500 font-bold py-2.5 px-6 rounded-xl hover:bg-acron-yoke-500 hover:text-white transition-all duration-300 text-sm active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Post
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post, i) => (
                        <Link key={post.id} href={`/forum/${post.id}`}
                            className={`block bg-white rounded-2xl border border-gray-100 p-6 hover-lift hover:border-acron-pitch/40 transition-all duration-300 group relative overflow-hidden animate-fade-in-up`}
                            style={{ animationDelay: `${i * 0.06}s` }}>
                            {/* Subtle background glow on hover */}
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-acron-pitch/5 blur-3xl group-hover:bg-acron-pitch/15 transition-all duration-500 rounded-full" />

                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-start space-x-4 flex-1">
                                    <div className="w-10 h-10 bg-gradient-to-br from-acron-pitch to-acron-thrust rounded-xl flex items-center justify-center text-acron-yoke-500 font-extrabold text-sm flex-shrink-0 shadow-sm shadow-acron-pitch/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
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
                                    {post.tags.slice(0, 4).map(tag => (
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
                    ))}
                </div>
            )}
        </div>
    );
}
