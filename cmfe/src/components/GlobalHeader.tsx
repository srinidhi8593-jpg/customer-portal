'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import ForumSearchBar from './ForumSearchBar';

interface Subcategory { id: string; name: string; }
interface ResourceCat { id: string; name: string; subcategories: Subcategory[]; _count: { resources: number }; }
interface HeaderNotification { id: string; content: string; isRead: boolean; link: string | null; createdAt: string; }

export default function GlobalHeader() {
    const { user, token, logout, isLoading } = useAuth();
    const [resOpen, setResOpen] = useState(false);
    const [accOpen, setAccOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [resCats, setResCats] = useState<ResourceCat[]>([]);
    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const [latestNotifs, setLatestNotifs] = useState<HeaderNotification[]>([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const resRef = useRef<HTMLDivElement>(null);
    const accRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    const fetchLatestNotifs = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/users/me/notifications?page=1&limit=5`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.notifications) {
                setLatestNotifs(data.notifications);
                if (data.unreadCount !== undefined) setUnreadNotifs(data.unreadCount);
            }
        } catch (err) { /* silent */ }
    };

    // Fetch resource categories once
    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/resources/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
            if (Array.isArray(data)) setResCats(data);
            else setResCats([]);
        }).catch(() => { setResCats([]); });

        // Fetch unread notifications badge count
        fetch(`${API_URL}/users/me/notifications?unread=true&limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(data => {
            if (data.unreadCount !== undefined) setUnreadNotifs(data.unreadCount);
        }).catch(() => { });
    }, [token]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (resRef.current && !resRef.current.contains(e.target as Node)) setResOpen(false);
            if (accRef.current && !accRef.current.contains(e.target as Node)) setAccOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <header className="w-full relative">


            {/* Main Header Row */}
            <div className="glass-dark border-b border-white/10 shadow-premium sticky top-0 z-[100]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 md:h-24 flex items-center justify-between">
                    <div className="flex items-center">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="mr-3 md:hidden rounded-lg p-2 text-white hover:bg-white/10 transition-colors duration-300 focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                        <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center h-full py-2 group gap-2.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-acron-pitch group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                                <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
                            </svg>
                            <span className="text-white text-lg md:text-xl font-extrabold tracking-tight">DebatHub</span>
                        </Link>

                    </div>

                    {user ? (
                        <div className="hidden md:flex flex-1 max-w-md mx-8">
                            <ForumSearchBar />
                        </div>
                    ) : (
                        <div className="hidden lg:flex flex-1 justify-center items-center space-x-8">
                        </div>
                    )}

                    <div className="flex items-center space-x-4">
                        {!isLoading && user ? (
                            <>
                                <div className="relative" ref={notifRef}>
                                    <button
                                        onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchLatestNotifs(); }}
                                        className="relative text-acron-pitch hover:text-white transition-colors duration-300 p-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        {unreadNotifs > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-acron-pitch text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
                                                {unreadNotifs > 9 ? '9+' : unreadNotifs}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notifications Dropdown */}
                                    {notifOpen && (
                                        <div className="dropdown-enter absolute top-full right-[-60px] md:right-0 mt-4 w-screen max-w-sm md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                                <h3 className="text-sm font-black text-[#1A1A1A]">Notifications</h3>
                                                {unreadNotifs > 0 && (
                                                    <span className="text-[10px] font-bold bg-acron-pitch text-white px-2.5 py-0.5 rounded-full">{unreadNotifs} new</span>
                                                )}
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                {latestNotifs.length === 0 ? (
                                                    <div className="p-8 text-center">
                                                        <div className="text-3xl mb-3">🔔</div>
                                                        <p className="text-gray-400 text-sm font-medium">No notifications yet</p>
                                                    </div>
                                                ) : (
                                                    latestNotifs.map(n => (
                                                        <Link
                                                            key={n.id}
                                                            href={n.link || '/account/notifications'}
                                                            onClick={async () => {
                                                                setNotifOpen(false);
                                                                if (!n.isRead && token) {
                                                                    setUnreadNotifs(prev => Math.max(0, prev - 1));
                                                                    setLatestNotifs(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif));
                                                                    try {
                                                                        await fetch(`${API_URL}/users/me/notifications/${n.id}/read`, {
                                                                            method: 'PUT',
                                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                                        });
                                                                    } catch (err) { /* silent */ }
                                                                }
                                                            }}
                                                            className={`block px-4 py-3 border-b border-gray-50 hover:bg-acron-pitch/5 transition-colors duration-300 ${!n.isRead ? 'bg-acron-pitch/5' : ''}`}
                                                        >
                                                            <div className="flex items-start gap-2.5">
                                                                <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-acron-pitch'}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm leading-snug ${n.isRead ? 'text-gray-500' : 'text-acron-yoke-500 font-semibold'}`}>{n.content}</p>
                                                                    <p className="text-[11px] text-gray-400 mt-1 font-medium">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                            <a
                                                href="/account/notifications"
                                                onClick={() => setNotifOpen(false)}
                                                className="block text-center py-3 text-sm font-bold text-acron-pitch hover:bg-acron-pitch/5 transition-colors duration-300 border-t border-gray-100"
                                            >
                                                View all notifications →
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-3 relative" ref={accRef}>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-white text-sm font-medium">{user.name}</p>
                                        <p className="text-gray-400 text-xs font-medium">{user.role.replace('_', ' ')}</p>
                                    </div>
                                    <button
                                        onClick={() => setAccOpen(!accOpen)}
                                        className="w-9 h-9 bg-acron-pitch rounded-xl flex items-center justify-center text-acron-yoke-500 font-bold text-sm hover:ring-2 hover:ring-white/50 transition-all duration-300 hover:scale-105">
                                        {user.name.charAt(0).toUpperCase()}
                                    </button>

                                    {/* Account Menu */}
                                    {accOpen && (
                                        <div className="dropdown-enter absolute top-full right-0 mt-4 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                                <p className="font-bold text-acron-yoke-500 leading-tight">{user.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                                                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-acron-pitch/15 text-acron-pitch px-2 py-0.5 rounded-lg">
                                                    {user.role.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="p-2 space-y-0.5">
                                                <Link href="/account/profile" onClick={() => setAccOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-acron-pitch hover:bg-acron-pitch/5 rounded-xl transition-all duration-300 font-medium">
                                                    <span>👤</span> My Profile
                                                </Link>
                                                <Link href="/account/posts" onClick={() => setAccOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-acron-pitch hover:bg-acron-pitch/5 rounded-xl transition-all duration-300 font-medium">
                                                    <span>📝</span> My Posts
                                                </Link>
                                                <Link href="/account/notifications" onClick={() => setAccOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-acron-pitch hover:bg-acron-pitch/5 rounded-xl transition-all duration-300 font-medium">
                                                    <span>🔔</span> My Notifications
                                                </Link>
                                                {user.role === 'ORG_ADMIN' && (
                                                    <Link href="/account/teams" onClick={() => setAccOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-acron-pitch hover:bg-acron-pitch/5 rounded-xl transition-all duration-300 font-medium">
                                                        <span>👥</span> My Teams
                                                    </Link>
                                                )}
                                            </div>
                                            <div className="p-2 border-t border-gray-100 bg-gray-50">
                                                <button onClick={() => { setAccOpen(false); logout(); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-300 font-medium">
                                                    <span>🚪</span> Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : !isLoading ? (
                            <div className="hidden sm:flex items-center space-x-3">
                                <Link href="/auth/login" className="flex items-center space-x-2 text-acron-pitch hover:text-white transition-colors duration-300 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Login</span>
                                </Link>
                                <Link href="/auth/register" className="flex items-center space-x-2 bg-acron-pitch text-acron-yoke-500 hover:bg-white transition-colors duration-300 text-sm font-bold px-4 py-2 rounded-xl shadow-sm">
                                    <span>Register</span>
                                </Link>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-acron-yoke-500 border-b border-white/10 shadow-2xl flex flex-col max-h-[calc(100vh-120px)] overflow-y-auto animate-fade-in-up" style={{ animationDuration: '0.25s' }}>
                        <div className="px-4 py-4 space-y-4">
                            {user ? (
                                <div className="mb-4">
                                    <ForumSearchBar />
                                </div>
                            ) : null}

                            {user ? (
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 px-2">Navigation</h4>
                                    <Link onClick={() => setMobileMenuOpen(false)} href="/forum" className="block px-4 py-3 text-white font-bold uppercase tracking-wider text-sm hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all duration-300">Debate Forum</Link>

                                    <div className="mt-2 text-white">
                                        <div className="px-4 py-2 font-bold uppercase tracking-wider text-sm">Resources</div>
                                        <div className="pl-6 space-y-2 mt-2">
                                            {resCats.map(cat => (
                                                <Link key={cat.id} onClick={() => setMobileMenuOpen(false)} href={`/resources?categoryId=${cat.id}`} className="block text-gray-300 hover:text-white py-1.5 text-sm transition-colors duration-300">{cat.name}</Link>
                                            ))}
                                            <Link onClick={() => setMobileMenuOpen(false)} href="/resources" className="block text-acron-pitch font-semibold py-1.5 text-sm">View All Resources →</Link>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {!user && !isLoading && (
                                <div className="border-t border-white/10 pt-4 mt-4 space-y-2 sm:hidden">
                                    <Link onClick={() => setMobileMenuOpen(false)} href="/auth/login" className="block w-full text-center py-3 bg-white/5 text-white font-bold rounded-xl border border-white/10 transition-all duration-300 hover:bg-white/10">Login</Link>
                                    <Link onClick={() => setMobileMenuOpen(false)} href="/auth/register" className="block w-full text-center py-3 bg-acron-pitch text-acron-yoke-500 font-bold rounded-xl transition-all duration-300 hover:bg-white">Register</Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Bar */}
            <div className="bg-acron-yoke-500/95 backdrop-blur-md border-t border-white/5 shadow-sm hidden md:block relative z-[90]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex items-center h-12">
                        {user ? (
                            <>
                                <Link href="/forum" className="text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-300 text-sm font-bold uppercase tracking-widest px-6 py-3 border-r border-white/10">
                                    Debate Forum
                                </Link>

                                {/* Resources Dropdown */}
                                <div ref={resRef} className="relative h-full">
                                    <button
                                        onClick={() => setResOpen(!resOpen)}
                                        className={`flex items-center gap-2 h-full text-sm font-bold uppercase tracking-widest px-6 transition-all duration-300 ${resOpen ? 'text-acron-pitch bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                                        Resources
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${resOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {resOpen && user && resCats.length > 0 && (
                                        <div className="dropdown-enter absolute top-full left-0 mt-0 w-[520px] bg-white rounded-b-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                                            <div className="p-5">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-black text-acron-yoke-500">Resource Categories</h3>
                                                    <Link href="/resources" onClick={() => setResOpen(false)}
                                                        className="text-xs text-acron-pitch font-bold hover:text-acron-thrust transition-colors duration-300">View All Resources →</Link>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                                    {resCats.map(cat => (
                                                        <div key={cat.id}>
                                                            <Link href={`/resources?categoryId=${cat.id}`} onClick={() => setResOpen(false)}
                                                                className="flex items-center gap-2 group">
                                                                <span className="w-8 h-8 bg-acron-yoke-500 rounded-lg flex items-center justify-center text-white text-xs flex-shrink-0 group-hover:bg-acron-pitch transition-colors duration-300">📚</span>
                                                                <div>
                                                                    <span className="text-sm font-bold text-acron-yoke-500 group-hover:text-acron-pitch transition-colors duration-300">{cat.name}</span>
                                                                    <span className="text-[10px] text-gray-400 ml-1">({cat._count.resources})</span>
                                                                </div>
                                                            </Link>
                                                            {cat.subcategories.length > 0 && (
                                                                <div className="ml-10 mt-1.5 space-y-1">
                                                                    {cat.subcategories.map(sub => (
                                                                        <Link key={sub.id} href={`/resources?categoryId=${cat.id}&subcategoryId=${sub.id}`}
                                                                            onClick={() => setResOpen(false)}
                                                                            className="block text-xs text-gray-500 hover:text-acron-pitch transition-colors duration-300">
                                                                            {sub.name}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </nav>
                </div>
            </div>
        </header>
    );
}
