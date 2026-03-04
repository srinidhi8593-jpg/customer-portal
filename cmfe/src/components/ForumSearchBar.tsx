'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

interface Category { id: string; name: string; }
interface PostSuggestion { id: string; title: string; }
interface ResourceSuggestion { id: string; title: string; fileUrl: string; isExternal: boolean; }

export default function ForumSearchBar() {
    const { token } = useAuth();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [posts, setPosts] = useState<PostSuggestion[]>([]);
    const [resources, setResources] = useState<ResourceSuggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Debounced autosuggest fetch
    useEffect(() => {
        if (!query.trim() || !token) {
            setCategories([]);
            setPosts([]);
            setResources([]);
            setShowDropdown(false);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/forum/search/autosuggest?q=${encodeURIComponent(query.trim())}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data.categories || []);
                    setPosts(data.posts || []);
                    setResources(data.resources || []);
                    setShowDropdown(true);
                }
            } catch { }
            setLoading(false);
        }, 250);
    }, [query, token]);

    const goToSearch = (extraParams?: string) => {
        setShowDropdown(false);
        router.push(`/forum/search?q=${encodeURIComponent(query.trim())}${extraParams || ''}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.trim()) {
            goToSearch();
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => { if (query.trim() && (categories.length > 0 || posts.length > 0 || resources.length > 0)) setShowDropdown(true); }}
                onKeyDown={handleKeyDown}
                placeholder="Search forum..."
                className="w-full bg-acron-yoke-500/60 border border-acron-thrust rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-acron-pitch transition-colors"
            />

            {/* Auto-suggestions Dropdown */}
            {showDropdown && (categories.length > 0 || posts.length > 0 || resources.length > 0 || loading) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
                    {loading && (
                        <div className="px-4 py-3 text-xs text-gray-400 text-center">Searching...</div>
                    )}

                    {/* Categories Section */}
                    {categories.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Categories</span>
                                <button onClick={() => goToSearch('&type=categories')}
                                    className="text-xs text-acron-pitch font-semibold hover:underline">View all</button>
                            </div>
                            {categories.map(cat => (
                                <button key={cat.id}
                                    onClick={() => {
                                        setShowDropdown(false);
                                        router.push(`/forum?categoryId=${cat.id}`);
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center space-x-2 border-b border-gray-50">
                                    <span className="w-6 h-6 bg-acron-yoke-500 rounded flex items-center justify-center text-white text-[10px] flex-shrink-0">📁</span>
                                    <span className="text-sm text-acron-yoke-500 font-medium">{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Posts Section */}
                    {posts.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Posts</span>
                                <button onClick={() => goToSearch('&type=posts')}
                                    className="text-xs text-acron-pitch font-semibold hover:underline">View all</button>
                            </div>
                            {posts.map(post => (
                                <button key={post.id}
                                    onClick={() => {
                                        setShowDropdown(false);
                                        router.push(`/forum/${post.id}`);
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center space-x-2 border-b border-gray-50">
                                    <span className="w-6 h-6 bg-acron-pitch rounded flex items-center justify-center text-acron-yoke-500 text-[10px] flex-shrink-0">📝</span>
                                    <span className="text-sm text-acron-yoke-500">{post.title}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Resources Section */}
                    {resources.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Resources</span>
                            </div>
                            {resources.map(res => (
                                <button key={res.id}
                                    onClick={() => {
                                        setShowDropdown(false);
                                        router.push(`/resources/${res.id}`);
                                    }}
                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-50 group">
                                    <div className="flex items-center space-x-2 truncate pr-2">
                                        <span className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center text-blue-600 text-[10px] flex-shrink-0">📚</span>
                                        <span className="text-sm text-acron-yoke-500 truncate">{res.title}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-acron-pitch transition-colors uppercase whitespace-nowrap">View Details</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* All results link */}
                    {!loading && (categories.length > 0 || posts.length > 0 || resources.length > 0) && (
                        <button onClick={() => goToSearch()}
                            className="w-full px-4 py-3 text-center text-xs font-semibold text-acron-pitch hover:bg-gray-50 transition-colors border-t border-gray-100">
                            View all results for &ldquo;{query}&rdquo;
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
