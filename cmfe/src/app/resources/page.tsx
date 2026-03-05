'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import { API_BASE_URL, API_URL } from '@/config/api';
const API = `${API_URL}/resources`;

interface Subcategory { id: string; name: string; }
interface ResourceCat { id: string; name: string; subcategories: Subcategory[]; _count: { resources: number }; }
interface Resource {
    id: string; title: string; description: string; fileUrl: string;
    downloadCount: number; createdAt: string;
    categories: { id: string; name: string }[];
    subcategories: { id: string; name: string }[];
}

function SkeletonResourceCard() {
    return (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 skeleton rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 skeleton" />
                        <div className="h-4 w-full skeleton" />
                        <div className="h-3 w-3/4 skeleton" />
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between">
                <div className="h-3 w-24 skeleton" />
                <div className="h-3 w-16 skeleton" />
            </div>
        </div>
    );
}

function ResourcesContent() {
    const { user, token, isLoading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    const catId = searchParams.get('categoryId') || '';
    const subId = searchParams.get('subcategoryId') || '';
    const urlSort = searchParams.get('sort') || '';
    const urlSearch = searchParams.get('search') || '';

    const [categories, setCategories] = useState<ResourceCat[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(urlSearch);
    const [sort, setSort] = useState(urlSort);

    useEffect(() => {
        if (!isLoading && !user) router.push('/auth/login');
    }, [isLoading, user, router]);

    // Fetch categories
    useEffect(() => {
        if (!token) return;
        fetch(`${API}/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json()).then(data => { if (Array.isArray(data)) setCategories(data); }).catch(() => { });
    }, [token]);

    // Fetch resources
    useEffect(() => {
        if (!token) { setLoading(false); return; }
        setLoading(true);
        const params = new URLSearchParams();
        if (catId) params.set('categoryId', catId);
        if (subId) params.set('subcategoryId', subId);
        if (urlSort) params.set('sort', urlSort);
        if (urlSearch) params.set('search', urlSearch);
        params.set('take', '50');

        fetch(`${API}?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json()).then(data => { if (Array.isArray(data)) setResources(data); })
            .catch(() => { }).finally(() => setLoading(false));
    }, [token, catId, subId, urlSort, urlSearch]);

    const navigate = (overrides: Record<string, string>) => {
        const p = new URLSearchParams();
        const vals = { categoryId: catId, subcategoryId: subId, sort, search, ...overrides };
        Object.entries(vals).forEach(([k, v]) => { if (v) p.set(k, v); });
        router.push(`/resources?${p.toString()}`);
    };

    const activeCat = Array.isArray(categories) ? categories.find(c => c.id === catId) : undefined;

    const handleDownload = async (id: string) => {
        if (!token) return;
        try {
            const dlRes = await fetch(`${API}/${id}/download`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            const dlData = await dlRes.json();

            let fileUrl = dlData.url;
            if (fileUrl && fileUrl.startsWith('/uploads')) {
                fileUrl = `${API_BASE_URL}${fileUrl}`;
            }
            if (fileUrl) window.open(fileUrl, '_blank');

            const params = new URLSearchParams();
            if (catId) params.set('categoryId', catId);
            if (subId) params.set('subcategoryId', subId);
            if (urlSort) params.set('sort', urlSort);
            if (urlSearch) params.set('search', urlSearch);
            params.set('take', '50');
            const res = await fetch(`${API}?${params.toString()}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); if (Array.isArray(d)) setResources(d); }
        } catch (err) {
            console.error('Download error:', err);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const fileIcon = (url: string) => {
        if (url.includes('.pdf')) return '📄';
        if (url.includes('.doc')) return '📝';
        if (url.includes('.xls')) return '📊';
        return '📁';
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <nav className="text-xs text-gray-500 animate-fade-in">
                <Link href="/" className="hover:text-acron-pitch transition-colors">Home</Link> ›{' '}
                <Link href="/resources" className="hover:text-acron-pitch transition-colors">Resources</Link>
                {activeCat && <> › <span className="text-acron-pitch font-medium">{activeCat.name}</span></>}
            </nav>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl font-black text-acron-yoke-500 tracking-tight">
                        Resource Library
                        {activeCat && <span className="text-gray-400 font-normal ml-2">/ {activeCat.name}</span>}
                    </h1>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Browse and download training materials, documentation, and tools</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && navigate({ search })}
                            placeholder="Search resources..."
                            className="input-premium pl-9 pr-4 py-2 rounded-xl text-sm w-full md:w-64" />
                    </div>
                    <select value={sort} onChange={e => { setSort(e.target.value); navigate({ sort: e.target.value }); }}
                        className="input-premium rounded-xl px-3 py-2 text-sm bg-white text-gray-600 cursor-pointer flex-1 md:flex-none">
                        <option value="">Latest First</option>
                        <option value="downloads">Most Downloaded</option>
                        <option value="az">A-Z</option>
                    </select>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Category Sidebar */}
                <aside className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-6 shadow-sm animate-fade-in-up delay-100">
                        <h2 className="text-xs font-black text-acron-yoke-500 uppercase tracking-widest mb-4">Categories</h2>
                        <div className="space-y-1">
                            <button onClick={() => router.push('/resources')}
                                className={`w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all duration-300 font-medium ${!catId ? 'bg-acron-pitch/10 text-acron-yoke-500 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                                All Resources
                            </button>
                            {Array.isArray(categories) && categories.map(cat => (
                                <div key={cat.id}>
                                    <button onClick={() => navigate({ categoryId: cat.id, subcategoryId: '' })}
                                        className={`w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all duration-300 flex justify-between items-center font-medium ${catId === cat.id && !subId ? 'bg-acron-pitch/10 text-acron-yoke-500 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        <span>{cat.name}</span>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{cat._count.resources}</span>
                                    </button>
                                    {catId === cat.id && cat.subcategories.length > 0 && (
                                        <div className="ml-3 pl-3 border-l-2 border-acron-pitch/30 space-y-0.5 mt-1">
                                            {cat.subcategories.map(sub => (
                                                <button key={sub.id}
                                                    onClick={() => navigate({ categoryId: cat.id, subcategoryId: sub.id })}
                                                    className={`w-full text-left text-xs px-2 py-1.5 rounded-md transition-all duration-300 ${subId === sub.id ? 'text-acron-pitch font-bold bg-acron-pitch/5' : 'text-gray-500 hover:text-acron-yoke-500'}`}>
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Resources Grid */}
                <main className="flex-1">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[0, 1, 2, 3, 4, 5].map(i => <SkeletonResourceCard key={i} />)}
                        </div>
                    ) : resources.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center animate-fade-in">
                            <div className="text-6xl mb-5 animate-float">📚</div>
                            <h2 className="text-lg font-black text-acron-yoke-500 mb-2">No resources found</h2>
                            <p className="text-sm text-gray-400 max-w-md mx-auto">Try a different category or search term to find what you&apos;re looking for.</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-gray-400 mb-4 font-medium">{resources.length} resource{resources.length !== 1 ? 's' : ''} found</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {resources.map((r, i) => (
                                    <Link href={`/resources/${r.id}`} key={r.id}
                                        className={`bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col group block hover-gradient-border animate-fade-in-up`}
                                        style={{ animationDelay: `${i * 0.05}s` }}>
                                        <div className="p-5 flex-1">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{fileIcon(r.fileUrl)}</span>
                                                <div className="flex-1 min-w-0">
                                                    {(r.categories || []).map((cat: any) => (
                                                        <span key={cat.id} className="text-[10px] font-bold px-2 py-0.5 bg-acron-pitch/10 text-acron-yoke-500 rounded-full mr-1">{cat.name}</span>
                                                    ))}
                                                    {(r.subcategories && r.subcategories.length > 0) && (
                                                        <span className="text-[10px] font-medium text-gray-400 ml-1">
                                                            / {(r.subcategories || []).map((sub: any) => sub.name).join(', ')}
                                                        </span>
                                                    )}
                                                    <h3 className="mt-2 text-sm font-bold text-acron-yoke-500 group-hover:text-acron-pitch transition-colors duration-300 line-clamp-2">{r.title}</h3>
                                                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{r.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center group-hover:bg-acron-pitch/5 transition-colors duration-300">
                                            <div className="text-xs text-gray-400 font-medium">
                                                <span>⬇️ {r.downloadCount}</span>
                                                <span className="mx-2">&middot;</span>
                                                <span>{formatDate(r.createdAt)}</span>
                                            </div>
                                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownload(r.id); }}
                                                className="text-acron-pitch hover:text-acron-yoke-500 font-bold text-xs transition-colors">
                                                Download
                                            </button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function ResourcesLibrary() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-acron-pitch border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400 font-medium">Loading resources...</span>
                </div>
            </div>
        }>
            <ResourcesContent />
        </Suspense>
    );
}
