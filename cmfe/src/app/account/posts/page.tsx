'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

interface Post {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    likes: number;
    comments: number;
    category?: string;
    isSaved: boolean;
}

export default function MyPostsPage() {
    const { token } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [tab, setTab] = useState<'submitted' | 'saved'>('submitted');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const query = new URLSearchParams({
                tab,
                sortBy,
                search,
                page: String(page),
                limit: '10'
            });
            const res = await fetch(`${API_URL}/users/me/posts?${query.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setPosts(data.posts);
                setTotalPages(data.pagination.totalPages || 1);
            }
        } catch (err) {
            console.error('Failed to fetch posts', err);
        } finally {
            setLoading(false);
        }
    }, [token, tab, sortBy, search, page]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchPosts();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
                <div>
                    <h1 className="text-xl font-black text-acron-yoke-500 tracking-tight">My Posts</h1>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Manage your submitted and saved posts</p>
                </div>
                <Link href="/forum/create" className="bg-acron-pitch text-acron-yoke-500 font-bold py-2.5 px-5 rounded-xl text-sm hover:bg-acron-yoke-500 hover:text-white transition-all duration-300 whitespace-nowrap flex items-center gap-2 active:scale-95 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New Post
                </Link>
            </div>

            {/* Navigation & Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm animate-fade-in-up delay-100">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => { setTab('submitted'); setPage(1); }}
                        className={`flex-1 md:w-32 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${tab === 'submitted' ? 'bg-white text-acron-yoke-500 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Submitted
                    </button>
                    <button
                        onClick={() => { setTab('saved'); setPage(1); }}
                        className={`flex-1 md:w-32 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${tab === 'saved' ? 'bg-white text-acron-yoke-500 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Saved
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <form onSubmit={handleSearch} className="flex">
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-premium text-sm rounded-l-xl p-2.5 w-full sm:w-48 rounded-r-none"
                        />
                        <button type="submit" className="bg-acron-yoke-500 text-white px-4 rounded-r-xl hover:bg-acron-thrust transition-colors active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </form>

                    <select
                        value={sortBy}
                        onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                        className="input-premium text-sm rounded-xl p-2.5 cursor-pointer"
                    >
                        <option value="date">Newest First</option>
                        <option value="likes">Most Liked</option>
                        <option value="comments">Most Commented</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {loading ? (
                    [0, 1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-16 skeleton" />
                                <div className="h-5 w-2/3 skeleton" />
                                <div className="h-3 w-40 skeleton" />
                            </div>
                            <div className="h-6 w-20 skeleton rounded-full" />
                        </div>
                    ))
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 animate-fade-in">
                        <div className="text-6xl mb-5 animate-float">{tab === 'saved' ? '🔖' : '📝'}</div>
                        <p className="text-lg font-black text-acron-yoke-500 mb-2">No {tab} posts</p>
                        <p className="text-sm text-gray-400 font-medium mb-6">
                            {tab === 'saved' ? 'Posts you save will appear here.' : 'Start sharing your thoughts in the debate forum.'}
                        </p>
                        {tab === 'submitted' && (
                            <Link href="/forum/create" className="inline-flex items-center gap-2 bg-acron-pitch text-acron-yoke-500 font-bold py-2.5 px-6 rounded-xl hover:bg-acron-yoke-500 hover:text-white transition-all duration-300 text-sm active:scale-95">
                                Create Your First Post
                            </Link>
                        )}
                    </div>
                ) : (
                    posts.map((post, i) => (
                        <div key={post.id}
                            className={`bg-white rounded-xl border border-gray-100 p-5 hover:border-acron-pitch/40 hover:shadow-lg transition-all duration-300 group overflow-hidden relative animate-fade-in-up`}
                            style={{ animationDelay: `${i * 0.05}s` }}>
                            {post.isSaved && (
                                <div className="absolute top-0 right-8 bg-blue-500 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-b-lg shadow-sm">
                                    Saved
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        {post.category && <span className="text-[10px] font-bold text-acron-pitch uppercase tracking-wider">{post.category}</span>}
                                    </div>
                                    <Link href={`/forum/${post.id}`} className="text-base font-bold text-acron-yoke-500 group-hover:text-acron-pitch transition-colors duration-300">{post.title}</Link>
                                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2.5 font-medium">
                                        <span className="flex items-center gap-1">📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1">❤️ {post.likes}</span>
                                        <span className="flex items-center gap-1">💬 {post.comments}</span>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${post.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        post.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                            'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        {post.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 pt-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-95"
                    >
                        ← Previous
                    </button>
                    <span className="text-sm font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-xl">Page {page} of {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
