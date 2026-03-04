'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

import { API_BASE_URL, API_URL } from '@/config/api';
const API = `${API_URL}/resources`;

interface Resource {
    id: string; title: string; description: string; fileUrl: string;
    downloadCount: number; createdAt: string; updatedAt: string;
    categories: { id: string; name: string }[];
    subcategories: { id: string; name: string }[];
    relatedResources?: Resource[]; // from backend
}

export default function ResourceDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { user, token, isLoading } = useAuth();
    const [resource, setResource] = useState<Resource | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) router.push('/auth/login');
    }, [isLoading, user, router]);

    useEffect(() => {
        if (!token || !id) return;
        setLoading(true);
        fetch(`${API}/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => {
                if (!r.ok) {
                    if (r.status === 404) router.push('/resources');
                    throw Error('Fetch failed');
                }
                return r.json();
            })
            .then(setResource)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id, token, router]);

    const handleDownload = async (resourceId: string, url: string) => {
        if (!token || downloading) return;
        setDownloading(true);
        try {
            const dlRes = await fetch(`${API}/${resourceId}/download`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            const dlData = await dlRes.json();

            // Re-fetch to update the current download count
            const res = await fetch(`${API}/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const updated = await res.json();
                setResource(updated);
            }

            // Open the file URL in a new tab for viewing/downloading
            let fileUrl = dlData.url || url;
            if (fileUrl.startsWith('/uploads')) {
                fileUrl = `${API_BASE_URL}${fileUrl}`;
            }
            window.open(fileUrl, '_blank');
        } catch (err) {
            console.error(err);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="inline-block w-8 h-8 border-2 border-acron-pitch border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!resource) return null;

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const getFileType = (url: string) => {
        if (url.endsWith('.pdf')) return 'PDF Document';
        if (url.endsWith('.docx') || url.endsWith('.doc')) return 'Word Document';
        if (url.endsWith('.xlsx')) return 'Excel Spreadsheet';
        return 'Standard File';
    };

    // Simulate file size based on id length just for display realism
    const getFileSize = (idStr: string) => {
        const hash = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return ((hash % 10) + 1.5).toFixed(1) + ' MB';
    };

    return (
        <div className="w-full">
            {/* Dark Header Banner */}
            <div className="bg-acron-yoke-500 text-white -mx-4 -mt-6 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-10 mb-8 border-t border-acron-thrust">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumbs */}
                    <nav className="text-xs text-gray-400 mb-6 flex items-center gap-2">
                        <Link href="/" className="hover:text-acron-pitch transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/resources" className="hover:text-acron-pitch transition-colors">Resources</Link>
                        <span>/</span>
                        {resource.categories && resource.categories.length > 0 && (
                            <Link href={`/resources?categoryId=${resource.categories[0].id}`} className="hover:text-acron-pitch transition-colors">{resource.categories[0].name}</Link>
                        )}
                        {resource.subcategories && resource.subcategories.length > 0 && (
                            <>
                                <span>/</span>
                                <Link href={`/resources?categoryId=${resource.categories[0]?.id}&subcategoryId=${resource.subcategories[0].id}`} className="hover:text-acron-pitch transition-colors">{resource.subcategories[0].name}</Link>
                            </>
                        )}
                        <span>/</span>
                        <span className="text-white font-medium truncate max-w-[200px]">{resource.title}</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="bg-acron-pitch/20 text-acron-pitch text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    {getFileType(resource.fileUrl)}
                                </span>
                                <span className="text-gray-400 text-sm">Updated {formatDate(resource.updatedAt)}</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                                {resource.title}
                            </h1>
                            <p className="text-lg text-gray-300 max-w-3xl leading-relaxed">
                                {resource.description}
                            </p>
                        </div>

                        {/* Primary Action Card (Desktop) */}
                        <div className="hidden md:block w-80 flex-shrink-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                            <div className="text-center mb-6">
                                <div className="text-4xl mb-3">📄</div>
                                <h3 className="font-bold text-white text-lg">Ready to download</h3>
                                <p className="text-gray-400 text-sm mt-1">{getFileType(resource.fileUrl)} &middot; {getFileSize(resource.id)}</p>
                            </div>
                            <button
                                onClick={() => handleDownload(resource.id, resource.fileUrl)}
                                disabled={downloading}
                                className="w-full bg-acron-pitch hover:bg-[#00c969] text-acron-yoke-500 font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                {downloading ? 'Downloading...' : 'Download Resource'}
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-4">
                                Downloaded {resource.downloadCount} times
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile primary action */}
            <div className="md:hidden mb-8 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-bold text-acron-yoke-500">{getFileType(resource.fileUrl)}</h3>
                        <p className="text-gray-500 text-xs mt-0.5">{getFileSize(resource.id)} &middot; {resource.downloadCount} downloads</p>
                    </div>
                    <div className="text-3xl">📄</div>
                </div>
                <button
                    onClick={() => handleDownload(resource.id, resource.fileUrl)}
                    disabled={downloading}
                    className="w-full bg-acron-yoke-500 hover:bg-acron-yoke-400 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {downloading ? 'Downloading...' : 'Download'}
                </button>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="md:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-acron-yoke-500 mb-4 border-b border-gray-200 pb-2">Resource Details</h2>
                        <div className="prose prose-sm md:prose max-w-none text-gray-600">
                            <p>{resource.description}</p>
                            <p>This document is provided as part of the <strong>{resource.categories && resource.categories.length > 0 ? resource.categories.map(c => c.name).join(', ') : 'Uncategorized'}</strong> library. Ensure you are using the latest version updated on {formatDate(resource.updatedAt)}.</p>

                            <h4>Specifications</h4>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Format:</strong> {getFileType(resource.fileUrl)}</li>
                                <li><strong>Size:</strong> {getFileSize(resource.id)} (approximate)</li>
                                {resource.subcategories && resource.subcategories.length > 0 && <li><strong>Subcategories:</strong> {resource.subcategories.map(s => s.name).join(', ')}</li>}
                                <li><strong>Access Level:</strong> Standard/Logged-in</li>
                            </ul>
                        </div>
                    </section>
                </div>

                <div className="md:col-span-1">
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <h3 className="font-bold text-acron-yoke-500 text-sm mb-4">Metadata</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <span className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Categories</span>
                                <span className="text-acron-yoke-500 font-medium">{resource.categories && resource.categories.length > 0 ? resource.categories.map(c => c.name).join(', ') : 'Uncategorized'}</span>
                            </div>
                            {resource.subcategories && resource.subcategories.length > 0 && (
                                <div>
                                    <span className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Tags</span>
                                    <div className="flex flex-wrap gap-2">
                                        {resource.subcategories.map(sub => (
                                            <span key={sub.id} className="inline-block px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-600 font-medium">
                                                {sub.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <span className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Added On</span>
                                <span className="text-gray-700">{formatDate(resource.createdAt)}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Downloads</span>
                                <span className="text-gray-700 font-mono bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">{resource.downloadCount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Resources */}
            {resource.relatedResources && resource.relatedResources.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-acron-yoke-500">Related Resources</h2>
                        {resource.categories && resource.categories.length > 0 && (
                            <Link href={`/resources?categoryId=${resource.categories[0].id}`} className="text-acron-pitch hover:text-acron-yoke-500 text-sm font-bold transition-colors">
                                View all in {resource.categories[0].name} &rarr;
                            </Link>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {resource.relatedResources.map(rel => (
                            <Link key={rel.id} href={`/resources/${rel.id}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all hover:-translate-y-1 block group">
                                <span className="text-2xl mb-3 block">📄</span>
                                <h3 className="font-bold text-acron-yoke-500 text-sm mb-2 group-hover:text-acron-pitch transition-colors line-clamp-2">{rel.title}</h3>
                                <p className="text-xs text-gray-500 mb-4 line-clamp-2">{rel.description}</p>
                                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                                    <span>⬇️ {rel.downloadCount}</span>
                                    <span className="text-acron-pitch font-semibold group-hover:underline">View</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
