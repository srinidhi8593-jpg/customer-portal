'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import { API_URL } from '@/config/api';
const API = `${API_URL}/forum`;

interface Post {
    id: string; title: string; content: string; status: string; tags: string[];
    attachments: string[]; createdAt: string; author: { id: string; name: string };
    category: { id: string; name: string } | null;
    _count: { comments: number; likes: number };
}
interface Category { id: string; name: string; }

function SearchResultsContent() {
    const { user, token, isLoading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    // URL params
    const q = searchParams.get('q') || '';
    const urlType = searchParams.get('type') || '';
    const urlSort = searchParams.get('sort') || 'recent';
    const urlCategory = searchParams.get('categoryId') || '';
    const urlDateFrom = searchParams.get('dateFrom') || '';
    const urlDateTo = searchParams.get('dateTo') || '';
    const urlTags = searchParams.get('tags') || '';
    const urlAuthor = searchParams.get('author') || '';
    const urlAttach = searchParams.get('hasAttachments') || '';

    // State
    const [posts, setPosts] = useState<Post[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(q);

    // Filter state (local, synced from URL)
    const [sortBy, setSortBy] = useState(urlSort);
    const [filterCategory, setFilterCategory] = useState(urlCategory);
    const [filterDateFrom, setFilterDateFrom] = useState(urlDateFrom);
    const [filterDateTo, setFilterDateTo] = useState(urlDateTo);
    const [filterTags, setFilterTags] = useState(urlTags);
    const [filterAuthor, setFilterAuthor] = useState(urlAuthor);
    const [filterAttach, setFilterAttach] = useState(urlAttach === 'true');
    const [filterOpen, setFilterOpen] = useState(true);

    // Unique tags from results for suggestions
    const allTags = Array.from(new Set(posts.flatMap(p => p.tags)));

    // Load categories
    useEffect(() => {
        if (!token) return;
        fetch(`${API}/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json()).then(setAllCategories).catch(() => { });
    }, [token]);

    // Build URL from filters (pushes to router, triggering re-fetch)
    const applyFilters = useCallback(() => {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (urlType) params.set('type', urlType);
        if (sortBy !== 'recent') params.set('sort', sortBy);
        if (filterCategory) params.set('categoryId', filterCategory);
        if (filterDateFrom) params.set('dateFrom', filterDateFrom);
        if (filterDateTo) params.set('dateTo', filterDateTo);
        if (filterTags) params.set('tags', filterTags);
        if (filterAuthor) params.set('author', filterAuthor);
        if (filterAttach) params.set('hasAttachments', 'true');
        router.push(`/forum/search?${params.toString()}`);
    }, [searchQuery, urlType, sortBy, filterCategory, filterDateFrom, filterDateTo, filterTags, filterAuthor, filterAttach, router]);

    // Fetch results based on URL params
    useEffect(() => {
        if (!token) { setLoading(false); return; }

        const fetchResults = async () => {
            setLoading(true);
            try {
                // Categories filter
                if (urlType !== 'posts' && q) {
                    const catRes = await fetch(`${API}/categories`, { headers: { 'Authorization': `Bearer ${token}` } });
                    if (catRes.ok) {
                        const allCats = await catRes.json();
                        setCategories(allCats.filter((c: Category) => c.name.toLowerCase().includes(q.toLowerCase())));
                    }
                }

                // Posts
                if (urlType !== 'categories') {
                    const params = new URLSearchParams();
                    if (q) params.set('search', q);
                    params.set('take', '50');
                    if (urlSort && urlSort !== 'recent') params.set('sort', urlSort);
                    if (urlCategory) params.set('categoryId', urlCategory);
                    if (urlDateFrom) params.set('dateFrom', urlDateFrom);
                    if (urlDateTo) params.set('dateTo', urlDateTo);
                    if (urlTags) params.set('tags', urlTags);
                    if (urlAuthor) params.set('author', urlAuthor);
                    if (urlAttach === 'true') params.set('hasAttachments', 'true');

                    const postRes = await fetch(`${API}/posts?${params.toString()}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (postRes.ok) {
                        const data = await postRes.json();
                        if (Array.isArray(data)) setPosts(data);
                    }
                }
            } catch { }
            setLoading(false);
        };
        fetchResults();
    }, [token, q, urlType, urlSort, urlCategory, urlDateFrom, urlDateTo, urlTags, urlAuthor, urlAttach]);

    const clearFilters = () => {
        setFilterCategory(''); setFilterDateFrom(''); setFilterDateTo('');
        setFilterTags(''); setFilterAuthor(''); setFilterAttach(false);
        setSortBy('recent');
        router.push(`/forum/search?q=${encodeURIComponent(q)}`);
    };

    const handleSearch = () => {
        if (searchQuery.trim()) applyFilters();
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    useEffect(() => {
        if (!isLoading && !user) router.push('/auth/login');
    }, [isLoading, user, router]);

    const hasActiveFilters = filterCategory || filterDateFrom || filterDateTo || filterTags || filterAuthor || filterAttach;

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="text-xs text-gray-500">
                <Link href="/" className="hover:text-acron-pitch">Home</Link> &gt;{' '}
                <Link href="/forum" className="hover:text-acron-pitch">Forum</Link> &gt;{' '}
                <span className="text-acron-pitch font-medium">Search Results</span>
            </nav>

            <h1 className="text-2xl font-bold text-acron-yoke-500">
                Search Results {q && <span className="text-gray-400">for &ldquo;{q}&rdquo;</span>}
            </h1>

            {/* Search Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
                <div className="flex-1 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Refine your search..."
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-acron-pitch focus:outline-none focus:ring-1 focus:ring-acron-pitch" />
                </div>
                <button onClick={handleSearch}
                    className="bg-acron-yoke-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-acron-yoke-400 transition-colors">
                    Search
                </button>
            </div>

            {/* Sort + Filter Toggle Row */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Link href={`/forum/search?q=${encodeURIComponent(q)}`}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${!urlType ? 'bg-acron-pitch text-acron-yoke-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        All
                    </Link>
                    <Link href={`/forum/search?q=${encodeURIComponent(q)}&type=categories`}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${urlType === 'categories' ? 'bg-acron-pitch text-acron-yoke-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        Categories
                    </Link>
                    <Link href={`/forum/search?q=${encodeURIComponent(q)}&type=posts`}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${urlType === 'posts' ? 'bg-acron-pitch text-acron-yoke-500' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        Posts
                    </Link>
                </div>
                <div className="flex items-center gap-3">
                    {/* Sort */}
                    <select value={sortBy} onChange={e => { setSortBy(e.target.value); setTimeout(() => { const p = new URLSearchParams(searchParams.toString()); p.set('sort', e.target.value); router.push(`/forum/search?${p.toString()}`); }, 0); }}
                        className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:border-acron-pitch focus:outline-none">
                        <option value="recent">Most Recent</option>
                        <option value="popular">Most Popular</option>
                        <option value="rated">Highest Rated</option>
                    </select>
                    <button onClick={() => setFilterOpen(!filterOpen)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${filterOpen ? 'bg-acron-yoke-500 text-white border-acron-yoke-500' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'}`}>
                        <span>⚙</span> Filters {hasActiveFilters && <span className="w-2 h-2 bg-acron-pitch rounded-full" />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Filter Sidebar */}
                {filterOpen && (
                    <aside className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 h-fit lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-acron-yoke-500">Refine Results</h3>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">Clear all</button>
                            )}
                        </div>

                        {/* Category */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">CATEGORY</label>
                            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-acron-pitch focus:outline-none">
                                <option value="">All Categories</option>
                                {allCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">DATE RANGE</label>
                            <div className="flex gap-2">
                                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-acron-pitch focus:outline-none" />
                                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:border-acron-pitch focus:outline-none" />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">TAGS</label>
                            <input type="text" value={filterTags} onChange={e => setFilterTags(e.target.value)}
                                placeholder="e.g. discussion, help"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-acron-pitch focus:outline-none" />
                            {allTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {allTags.slice(0, 8).map(t => (
                                        <button key={t} onClick={() => setFilterTags(prev => prev ? `${prev},${t}` : t)}
                                            className="text-[10px] bg-gray-100 hover:bg-acron-pitch/10 text-gray-600 px-2 py-0.5 rounded transition-colors">{t}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Author */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">AUTHOR</label>
                            <input type="text" value={filterAuthor} onChange={e => setFilterAuthor(e.target.value)}
                                placeholder="Search by author name"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-acron-pitch focus:outline-none" />
                        </div>

                        {/* Attachment Type */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1.5">ATTACHMENTS</label>
                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={filterAttach} onChange={e => setFilterAttach(e.target.checked)}
                                    className="rounded border-gray-300 text-acron-pitch focus:ring-acron-pitch" />
                                Has attachments
                            </label>
                        </div>

                        {/* Apply Button */}
                        <button onClick={applyFilters}
                            className="w-full bg-acron-pitch text-acron-yoke-500 font-bold py-2.5 rounded-lg text-sm hover:bg-acron-pitch transition-colors">
                            Apply Filters
                        </button>
                    </aside>
                )}

                {/* Results */}
                <div className={filterOpen ? 'lg:col-span-3' : 'lg:col-span-4'}>
                    {loading ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <div className="inline-block w-8 h-8 border-2 border-acron-pitch border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-sm text-gray-400">Searching...</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Result Count */}
                            {(urlType !== 'categories') && (
                                <p className="text-xs text-gray-500">{posts.length} post{posts.length !== 1 ? 's' : ''} found</p>
                            )}

                            {/* Categories Results */}
                            {urlType !== 'posts' && categories.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-acron-yoke-500 mb-3">📁 Categories ({categories.length})</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {categories.map(cat => (
                                            <Link key={cat.id} href={`/forum?categoryId=${cat.id}`}
                                                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-acron-yoke-500 rounded-lg flex items-center justify-center text-white text-sm">📁</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-acron-yoke-500 group-hover:text-acron-pitch transition-colors">{cat.name}</p>
                                                        <p className="text-xs text-gray-400">View posts →</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Posts Results */}
                            {urlType !== 'categories' && posts.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-acron-yoke-500 mb-3">📝 Posts ({posts.length})</h2>
                                    <div className="space-y-3">
                                        {posts.map(post => (
                                            <Link key={post.id} href={`/forum/${post.id}`}
                                                className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-3 flex-1">
                                                        <div className="w-9 h-9 bg-acron-pitch rounded-full flex items-center justify-center text-acron-yoke-500 font-bold text-sm flex-shrink-0">
                                                            {post.author.name.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-bold text-acron-yoke-500 group-hover:text-acron-pitch transition-colors">{post.title}</h3>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {post.author.name} &middot; {formatDate(post.createdAt)}
                                                                {post.category && <> &middot; <span className="text-acron-pitch">{post.category.name}</span></>}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{post.content.replace(/<[^>]*>/g, '').slice(0, 200)}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`ml-3 flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${post.status === 'PUBLISHED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                        }`}>{post.status === 'PUBLISHED' ? '● Published' : '⏳ Pending'}</span>
                                                </div>
                                                <div className="flex items-center justify-between mt-3 pl-12">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {post.tags.slice(0, 4).map(t => <span key={t} className="text-[10px] bg-acron-yoke-500 text-white px-2 py-0.5 rounded">{t}</span>)}
                                                        {post.attachments.length > 0 && (
                                                            <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded">📎 {post.attachments.length}</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex space-x-3">
                                                        <span>❤️ {post._count.likes}</span>
                                                        <span>💬 {post._count.comments}</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* No Results */}
                            {!loading && categories.length === 0 && posts.length === 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                                    <div className="text-5xl mb-4">🔍</div>
                                    <h2 className="text-lg font-bold text-acron-yoke-500 mb-2">No matching results found</h2>
                                    <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                                        We couldn&apos;t find any posts or categories matching your search.
                                        Try adjusting your keywords or removing some filters.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        {hasActiveFilters && (
                                            <button onClick={clearFilters}
                                                className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                                Clear Filters
                                            </button>
                                        )}
                                        <Link href="/forum"
                                            className="px-6 py-2.5 bg-acron-pitch text-acron-yoke-500 rounded-lg text-sm font-bold hover:bg-acron-pitch transition-colors">
                                            Browse All Posts
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center text-gray-400">Loading...</div>}>
            <SearchResultsContent />
        </Suspense>
    );
}
