'use client';

import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Notification {
    id: string;
    content: string;
    isRead: boolean;
    link: string | null;
    createdAt: string;
}

export default function NotificationsPage() {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/me/notifications?page=${page}&limit=10&sortOrder=${sortOrder}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
                setTotalPages(data.pagination.totalPages || 1);
            }
        } catch (err) {
            console.error('Fetch notifications error', err);
        } finally {
            setLoading(false);
        }
    }, [token, page, sortOrder]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/users/me/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                if (id === 'all') {
                    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                    setUnreadCount(0);
                } else {
                    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (err) {
            console.error('Mark read error', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-fade-in-up">
                <div>
                    <h1 className="text-xl font-black text-acron-yoke-500 tracking-tight">Notifications</h1>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Stay updated with your latest activity</p>
                </div>
                <div className="flex items-center space-x-3 flex-wrap">
                    <select
                        value={sortOrder}
                        onChange={(e) => { setSortOrder(e.target.value as 'desc' | 'asc'); setPage(1); }}
                        className="input-premium text-sm rounded-xl px-3 py-2 bg-white text-gray-700 font-medium cursor-pointer"
                    >
                        <option value="desc">Newest First</option>
                        <option value="asc">Oldest First</option>
                    </select>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">{unreadCount} unread</span>
                    {unreadCount > 0 && (
                        <button onClick={() => markAsRead('all')} className="text-xs text-acron-pitch font-bold hover:text-acron-thrust transition-colors">
                            Mark all read
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start space-x-3">
                            <div className="w-2.5 h-2.5 rounded-full skeleton mt-1.5 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 skeleton" />
                                <div className="h-3 w-24 skeleton" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 animate-fade-in">
                    <div className="text-6xl mb-5 animate-float">🔔</div>
                    <p className="text-lg font-black text-acron-yoke-500 mb-2">All caught up!</p>
                    <p className="text-sm text-gray-400 font-medium">You have no notifications yet. They&apos;ll appear here when there&apos;s activity.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n, i) => {
                        const dateStr = new Date(n.createdAt).toLocaleDateString() + ' ' + new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        const content = (
                            <div className="flex items-start space-x-3 w-full">
                                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 transition-colors ${n.isRead ? 'bg-gray-300' : 'bg-acron-pitch animate-pulse'}`} />
                                <div className="flex-1">
                                    <p className={`text-sm ${n.isRead ? 'text-gray-600' : 'text-acron-yoke-500 font-bold'}`}>{n.content}</p>
                                    <p className="text-xs text-gray-400 mt-1.5 font-medium">{dateStr}</p>
                                </div>
                                {!n.isRead && (
                                    <span className="text-[10px] font-bold bg-acron-pitch/10 text-acron-pitch px-2 py-0.5 rounded-full flex-shrink-0">NEW</span>
                                )}
                            </div>
                        );

                        return (
                            <div key={n.id} onClick={() => !n.isRead && markAsRead(n.id)}
                                className={`bg-white rounded-xl border p-4 transition-all duration-300 cursor-pointer hover:shadow-md animate-fade-in-up ${n.isRead ? 'border-gray-100' : 'border-acron-pitch/30 bg-acron-pitch/5 shadow-sm'}`}
                                style={{ animationDelay: `${i * 0.05}s` }}>
                                {n.link ? (
                                    <Link href={n.link} className="block">{content}</Link>
                                ) : content}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 pt-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-95"
                    >
                        ← Previous
                    </button>
                    <span className="text-sm font-bold text-gray-500 bg-gray-100 px-4 py-2 rounded-xl">Page {page} of {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
