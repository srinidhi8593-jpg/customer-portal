'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';

const TABS = ['Org Requests', 'User Requests', 'Post Requests', 'Approved Posts', 'Rejected Posts', 'Announcements'];

interface OrgRequest { id: string; soldToCompany: string; authorityAdminEmail: string; status: string; createdAt: string; }
interface UserRequest { id: string; name: string; email: string; company: string; industry: string; status: string; createdAt: string; }
interface PendingPost { id: string; title: string; status: string; createdAt: string; author: { name: string }; category?: { name: string } | null; }
interface Announcement { id: string; title: string; description: string; isActive: boolean; createdAt: string; }

export default function AdminBackoffice() {
    const { user, token, isLoading } = useAuth();
    const [tab, setTab] = useState('Org Requests');

    // Org Requests
    const [orgRequests, setOrgRequests] = useState<OrgRequest[]>([]);
    const [orgLoading, setOrgLoading] = useState(false);
    const [approveOrgId, setApproveOrgId] = useState<string | null>(null);
    const [sapBpId, setSapBpId] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [orgActionLoading, setOrgActionLoading] = useState('');

    // User Requests
    const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
    const [userLoading, setUserLoading] = useState(false);
    const [approveUserId, setApproveUserId] = useState<string | null>(null);
    const [assignRole, setAssignRole] = useState('VIEWER');
    const [userActionLoading, setUserActionLoading] = useState('');

    // Post Moderation
    const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
    const [approvedPosts, setApprovedPosts] = useState<PendingPost[]>([]);
    const [rejectedPosts, setRejectedPosts] = useState<PendingPost[]>([]);
    const [postLoading, setPostLoading] = useState(false);
    const [postActionLoading, setPostActionLoading] = useState('');
    const [rejectPostId, setRejectPostId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    // Announcements
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [announcementLoading, setAnnouncementLoading] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [announcementForm, setAnnouncementForm] = useState({ title: '', description: '', isActive: true });

    // Status messages
    const [message, setMessage] = useState({ text: '', type: '' });

    // Auth guard: BUSINESS_ADMIN only
    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'BUSINESS_ADMIN')) {
            redirect('/auth/login');
        }
    }, [user, isLoading]);

    const showMessage = (text: string, type: 'success' | 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    // Fetch Org Requests
    const fetchOrgRequests = useCallback(async () => {
        if (!token) return;
        setOrgLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/org-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setOrgRequests(await res.json());
        } catch (err) { console.error(err); }
        finally { setOrgLoading(false); }
    }, [token]);

    // Fetch User Requests
    const fetchUserRequests = useCallback(async () => {
        if (!token) return;
        setUserLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/user-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUserRequests(await res.json());
        } catch (err) { console.error(err); }
        finally { setUserLoading(false); }
    }, [token]);

    // Fetch Posts by Status
    const fetchPostsByStatus = useCallback(async (status: string, setter: React.Dispatch<React.SetStateAction<PendingPost[]>>) => {
        if (!token) return;
        setPostLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/posts?status=${status}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setter(data.posts || data);
            }
        } catch (err) { console.error(err); }
        finally { setPostLoading(false); }
    }, [token]);

    // Fetch Announcements
    const fetchAnnouncements = useCallback(async () => {
        if (!token) return;
        setAnnouncementLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/announcements`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setAnnouncements(await res.json());
        } catch (err) { console.error(err); }
        finally { setAnnouncementLoading(false); }
    }, [token]);

    useEffect(() => {
        if (!token) return;
        if (tab === 'Org Requests') fetchOrgRequests();
        if (tab === 'User Requests') fetchUserRequests();
        if (tab === 'Post Requests') fetchPostsByStatus('PENDING_APPROVAL', setPendingPosts);
        if (tab === 'Approved Posts') fetchPostsByStatus('PUBLISHED', setApprovedPosts);
        if (tab === 'Rejected Posts') fetchPostsByStatus('REJECTED', setRejectedPosts);
        if (tab === 'Announcements') fetchAnnouncements();
    }, [tab, token, fetchOrgRequests, fetchUserRequests, fetchPostsByStatus, fetchAnnouncements]);

    // Approve Org
    const handleApproveOrg = async (id: string) => {
        if (!sapBpId.trim()) { showMessage('SAP BP ID is required', 'error'); return; }
        setOrgActionLoading(id);
        try {
            const res = await fetch(`${API_URL}/admin/org-requests/${id}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ sapBpId, currency })
            });
            if (res.ok) {
                showMessage('Organization approved successfully', 'success');
                setApproveOrgId(null); setSapBpId(''); fetchOrgRequests();
            } else {
                const data = await res.json();
                showMessage(data.error || 'Failed to approve', 'error');
            }
        } catch { showMessage('Server error', 'error'); }
        finally { setOrgActionLoading(''); }
    };

    // Reject Org
    const handleRejectOrg = async (id: string) => {
        if (!window.confirm('Reject this organization request?')) return;
        setOrgActionLoading(id);
        try {
            const res = await fetch(`${API_URL}/admin/org-requests/${id}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Rejected by admin' })
            });
            if (res.ok) { showMessage('Organization rejected', 'success'); fetchOrgRequests(); }
            else { showMessage('Failed to reject', 'error'); }
        } catch { showMessage('Server error', 'error'); }
        finally { setOrgActionLoading(''); }
    };

    // Approve User
    const handleApproveUser = async (id: string) => {
        setUserActionLoading(id);
        try {
            const res = await fetch(`${API_URL}/admin/user-requests/${id}/approve`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: assignRole, orgId: user?.orgId })
            });
            if (res.ok) {
                showMessage('User approved successfully', 'success');
                setApproveUserId(null); setAssignRole('VIEWER'); fetchUserRequests();
            } else {
                const data = await res.json();
                showMessage(data.error || 'Failed to approve', 'error');
            }
        } catch { showMessage('Server error', 'error'); }
        finally { setUserActionLoading(''); }
    };

    // Reject User
    const handleRejectUser = async (id: string) => {
        if (!window.confirm('Reject this user request?')) return;
        setUserActionLoading(id);
        try {
            const res = await fetch(`${API_URL}/admin/user-requests/${id}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Rejected by admin' })
            });
            if (res.ok) { showMessage('User request rejected', 'success'); fetchUserRequests(); }
            else { showMessage('Failed to reject', 'error'); }
        } catch { showMessage('Server error', 'error'); }
        finally { setUserActionLoading(''); }
    };

    // Approve Post
    const handleApprovePost = async (id: string) => {
        setPostActionLoading(id);
        try {
            const res = await fetch(`${API_URL}/admin/posts/${id}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) { showMessage('Post approved and published', 'success'); fetchPostsByStatus('PENDING_APPROVAL', setPendingPosts); }
            else { showMessage('Failed to approve post', 'error'); }
        } catch { showMessage('Server error', 'error'); }
        finally { setPostActionLoading(''); }
    };

    // Reject Post
    const handleRejectPost = async (id: string) => {
        setPostActionLoading(id);
        try {
            const res = await fetch(`${API_URL}/admin/posts/${id}/reject`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectReason || 'Rejected by admin' })
            });
            if (res.ok) {
                showMessage('Post rejected', 'success');
                setRejectPostId(null); setRejectReason(''); fetchPostsByStatus('PENDING_APPROVAL', setPendingPosts);
            } else { showMessage('Failed to reject post', 'error'); }
        } catch { showMessage('Server error', 'error'); }
        finally { setPostActionLoading(''); }
    };

    // Save Announcement
    const handleSaveAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingAnnouncement
                ? `${API_URL}/admin/announcements/${editingAnnouncement.id}`
                : `${API_URL}/admin/announcements`;
            const method = editingAnnouncement ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(announcementForm)
            });
            if (res.ok) {
                showMessage(`Announcement ${editingAnnouncement ? 'updated' : 'created'}`, 'success');
                setShowAnnouncementModal(false);
                fetchAnnouncements();
            } else { showMessage('Error saving announcement', 'error'); }
        } catch { showMessage('Server error', 'error'); }
    };

    // Delete Announcement
    const handleDeleteAnnouncement = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        try {
            const res = await fetch(`${API_URL}/admin/announcements/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showMessage('Announcement deleted', 'success');
                fetchAnnouncements();
            } else { showMessage('Failed to delete', 'error'); }
        } catch { showMessage('Server error', 'error'); }
    };

    const openAnnouncementModal = (acc?: Announcement) => {
        if (acc) {
            setEditingAnnouncement(acc);
            setAnnouncementForm({ title: acc.title, description: acc.description, isActive: acc.isActive });
        } else {
            setEditingAnnouncement(null);
            setAnnouncementForm({ title: '', description: '', isActive: true });
        }
        setShowAnnouncementModal(true);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (!user || user.role !== 'BUSINESS_ADMIN') return null;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-acron-yoke-500 to-acron-yoke-400 px-6 py-5 rounded-xl">
                <h1 className="text-xl font-bold text-white">Admin Backoffice</h1>
                <p className="text-sm text-gray-300 mt-1">Manage registrations, content moderation, and portal settings</p>
            </div>

            {/* Status Message */}
            {message.text && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 bg-white rounded-xl border border-gray-200 p-1.5">
                {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-acron-pitch text-acron-yoke-500 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Org Requests */}
                {tab === 'Org Requests' && (
                    <div>
                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-acron-yoke-500">Pending Organization Requests</h2>
                            <button onClick={fetchOrgRequests} className="text-xs text-acron-pitch font-medium hover:underline">↻ Refresh</button>
                        </div>
                        {orgLoading ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Loading requests...</div>
                        ) : orgRequests.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No pending organization requests</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orgRequests.map(org => (
                                        <tr key={org.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm font-medium text-acron-yoke-500">{org.soldToCompany}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{org.authorityAdminEmail}</td>
                                            <td className="px-5 py-3 text-sm">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${org.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : org.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {org.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{new Date(org.createdAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 text-sm">
                                                {org.status === 'PENDING' && (
                                                    approveOrgId === org.id ? (
                                                        <div className="flex items-center space-x-2">
                                                            <input type="text" value={sapBpId} onChange={e => setSapBpId(e.target.value)}
                                                                placeholder="SAP BP ID *" className="border border-gray-300 rounded px-2 py-1 text-xs w-28" />
                                                            <select value={currency} onChange={e => setCurrency(e.target.value)}
                                                                className="border border-gray-300 rounded px-2 py-1 text-xs">
                                                                <option>USD</option><option>EUR</option><option>GBP</option>
                                                            </select>
                                                            <button onClick={() => handleApproveOrg(org.id)}
                                                                disabled={orgActionLoading === org.id}
                                                                className="bg-acron-pitch text-acron-yoke-500 px-2 py-1 rounded text-xs font-bold disabled:opacity-50">
                                                                {orgActionLoading === org.id ? '...' : 'Confirm'}
                                                            </button>
                                                            <button onClick={() => setApproveOrgId(null)} className="text-gray-400 text-xs">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-x-2">
                                                            <button onClick={() => setApproveOrgId(org.id)} className="bg-acron-pitch text-acron-yoke-500 px-3 py-1 rounded text-xs font-bold hover:bg-acron-pitch">Approve</button>
                                                            <button onClick={() => handleRejectOrg(org.id)}
                                                                disabled={orgActionLoading === org.id}
                                                                className="bg-red-50 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-100 disabled:opacity-50">Reject</button>
                                                        </div>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* User Requests */}
                {tab === 'User Requests' && (
                    <div>
                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-acron-yoke-500">Pending User Requests</h2>
                            <button onClick={fetchUserRequests} className="text-xs text-acron-pitch font-medium hover:underline">↻ Refresh</button>
                        </div>
                        {userLoading ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Loading requests...</div>
                        ) : userRequests.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No pending user requests</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {userRequests.map(u => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm font-medium text-acron-yoke-500">{u.name}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{u.company || '-'}</td>
                                            <td className="px-5 py-3 text-sm">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : u.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-sm">
                                                {u.status === 'PENDING' && (
                                                    approveUserId === u.id ? (
                                                        <div className="flex items-center space-x-2">
                                                            <select value={assignRole} onChange={e => setAssignRole(e.target.value)}
                                                                className="border border-gray-300 rounded px-2 py-1 text-xs">
                                                                <option value="VIEWER">Viewer</option>
                                                                <option value="PUBLISHER">Publisher</option>
                                                            </select>
                                                            <button onClick={() => handleApproveUser(u.id)}
                                                                disabled={userActionLoading === u.id}
                                                                className="bg-acron-pitch text-acron-yoke-500 px-2 py-1 rounded text-xs font-bold disabled:opacity-50">
                                                                {userActionLoading === u.id ? '...' : 'Confirm'}
                                                            </button>
                                                            <button onClick={() => setApproveUserId(null)} className="text-gray-400 text-xs">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-x-2">
                                                            <button onClick={() => setApproveUserId(u.id)} className="bg-acron-pitch text-acron-yoke-500 px-3 py-1 rounded text-xs font-bold hover:bg-acron-pitch">Approve</button>
                                                            <button onClick={() => handleRejectUser(u.id)}
                                                                disabled={userActionLoading === u.id}
                                                                className="bg-red-50 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-100 disabled:opacity-50">Reject</button>
                                                        </div>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Post Requests (Pending Approval) */}
                {tab === 'Post Requests' && (
                    <div>
                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-acron-yoke-500">Posts Awaiting Moderation</h2>
                            <button onClick={() => fetchPostsByStatus('PENDING_APPROVAL', setPendingPosts)} className="text-xs text-acron-pitch font-medium hover:underline">↻ Refresh</button>
                        </div>
                        {postLoading ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Loading posts...</div>
                        ) : pendingPosts.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No posts awaiting moderation</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Author</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingPosts.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm font-medium text-acron-yoke-500">{p.title}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{p.author?.name || 'Unknown'}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{p.category?.name || '-'}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 text-sm">
                                                {rejectPostId === p.id ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                                            placeholder="Reason..." className="border border-gray-300 rounded px-2 py-1 text-xs w-40" />
                                                        <button onClick={() => handleRejectPost(p.id)}
                                                            disabled={postActionLoading === p.id}
                                                            className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold disabled:opacity-50">Confirm</button>
                                                        <button onClick={() => setRejectPostId(null)} className="text-gray-400 text-xs">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div className="space-x-2">
                                                        <button onClick={() => handleApprovePost(p.id)}
                                                            disabled={postActionLoading === p.id}
                                                            className="bg-acron-pitch text-acron-yoke-500 px-3 py-1 rounded text-xs font-bold hover:bg-acron-pitch disabled:opacity-50">
                                                            {postActionLoading === p.id ? '...' : 'Approve'}
                                                        </button>
                                                        <button onClick={() => setRejectPostId(p.id)}
                                                            className="bg-red-50 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-100">Reject</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
                {/* Approved Posts */}
                {tab === 'Approved Posts' && (
                    <div>
                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-acron-yoke-500">Approved Posts</h2>
                            <button onClick={() => fetchPostsByStatus('PUBLISHED', setApprovedPosts)} className="text-xs text-acron-pitch font-medium hover:underline">↻ Refresh</button>
                        </div>
                        {postLoading ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Loading posts...</div>
                        ) : approvedPosts.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No approved posts found</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Author</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {approvedPosts.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm font-medium text-acron-yoke-500">{p.title}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{p.author?.name || 'Unknown'}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{p.category?.name || '-'}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 text-sm">
                                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">PUBLISHED</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
                {/* Rejected Posts */}
                {tab === 'Rejected Posts' && (
                    <div>
                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-acron-yoke-500">Rejected Posts</h2>
                            <button onClick={() => fetchPostsByStatus('REJECTED', setRejectedPosts)} className="text-xs text-acron-pitch font-medium hover:underline">↻ Refresh</button>
                        </div>
                        {postLoading ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Loading posts...</div>
                        ) : rejectedPosts.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No rejected posts found</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Author</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rejectedPosts.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm font-medium text-acron-yoke-500">{p.title}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{p.author?.name || 'Unknown'}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{p.category?.name || '-'}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 text-sm">
                                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700">REJECTED</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
                {/* Announcements */}
                {tab === 'Announcements' && (
                    <div>
                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-acron-yoke-500">Announcements Management</h2>
                            <div className="space-x-4">
                                <button onClick={() => openAnnouncementModal()} className="text-xs bg-acron-pitch text-acron-yoke-500 font-bold px-3 py-1.5 rounded hover:bg-acron-pitch/90">+ New</button>
                                <button onClick={fetchAnnouncements} className="text-xs text-acron-pitch font-medium hover:underline">↻ Refresh</button>
                            </div>
                        </div>
                        {announcementLoading ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Loading announcements...</div>
                        ) : announcements.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">No announcements found</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {announcements.map(a => (
                                        <tr key={a.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 text-sm font-medium text-acron-yoke-500 max-w-[200px] truncate">{a.title}</td>
                                            <td className="px-5 py-3 text-sm text-gray-500 max-w-[300px] truncate">{a.description}</td>
                                            <td className="px-5 py-3 text-sm">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {a.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 text-sm">
                                                <div className="space-x-3">
                                                    <button onClick={() => openAnnouncementModal(a)} className="text-blue-600 font-semibold hover:underline">Edit</button>
                                                    <button onClick={() => handleDeleteAnnouncement(a.id)} className="text-red-500 font-semibold hover:underline">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Announcement Modal */}
            {showAnnouncementModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</h2>
                        <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                <input required type="text" value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-acron-pitch outline-none" placeholder="Announcement title..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                <textarea required rows={4} value={announcementForm.description} onChange={e => setAnnouncementForm({ ...announcementForm, description: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-acron-pitch outline-none" placeholder="Detailed description..." />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="isActive" checked={announcementForm.isActive} onChange={e => setAnnouncementForm({ ...announcementForm, isActive: e.target.checked })} className="rounded text-acron-pitch focus:ring-acron-pitch" />
                                <label htmlFor="isActive" className="text-sm font-medium">Active (Visible on dashboard)</label>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowAnnouncementModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm font-bold bg-acron-pitch text-acron-yoke-500 rounded-lg shadow hover:bg-acron-pitch/90">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
