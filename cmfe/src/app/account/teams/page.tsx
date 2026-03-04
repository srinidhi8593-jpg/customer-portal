'use client';

import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    title: string | null;
    phone?: string | null;
    createdAt: string;
}

export default function TeamsPage() {
    const { user, token } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Add User Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', role: 'VIEWER' });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');
    const [resetLink, setResetLink] = useState('');

    // Edit User Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editMember, setEditMember] = useState<TeamMember | null>(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '', role: '' });
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');

    // If not ORG_ADMIN, kick them out
    useEffect(() => {
        if (user && user.role !== 'ORG_ADMIN' && user.role !== 'BUSINESS_ADMIN') {
            redirect('/account');
        }
    }, [user]);

    const fetchMembers = useCallback(async () => {
        if (!token || !user || !['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(user.role)) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '10' });
            if (search) params.append('search', search);
            if (roleFilter) params.append('role', roleFilter);

            const res = await fetch(`${API_URL}/users/me/team?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMembers(data.members || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } catch (err) {
            console.error('Fetch team error', err);
        } finally {
            setLoading(false);
        }
    }, [token, user, page, search, roleFilter]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleAddUser = async () => {
        if (!token) return;
        setAddError('');
        setAddSuccess('');
        if (!addForm.name.trim() || !addForm.email.trim()) {
            setAddError('Name and email are required');
            return;
        }
        setAddLoading(true);
        try {
            const res = await fetch(`${API_URL}/users/me/team`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addForm)
            });
            const data = await res.json();
            if (res.ok) {
                const link = data.resetLink || '';
                setAddSuccess(`${addForm.name} has been added successfully!`);
                setResetLink(link);
                setAddForm({ name: '', email: '', phone: '', role: 'VIEWER' });
                fetchMembers();
            } else {
                setAddError(data.error || 'Failed to add user');
            }
        } catch (err) {
            setAddError('Failed to add user. Please try again.');
        } finally {
            setAddLoading(false);
        }
    };

    const openEditModal = (member: TeamMember) => {
        setEditMember(member);
        setEditForm({ name: member.name, phone: (member as any).phone || '', role: member.role });
        setEditError('');
        setShowEditModal(true);
    };

    const handleEditUser = async () => {
        if (!token || !editMember) return;
        setEditError('');
        setEditLoading(true);
        try {
            // Update role via existing endpoint
            if (editForm.role !== editMember.role) {
                const res = await fetch(`${API_URL}/users/me/team/${editMember.id}/role`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ role: editForm.role })
                });
                if (!res.ok) {
                    const data = await res.json();
                    setEditError(data.error || 'Failed to update role');
                    setEditLoading(false);
                    return;
                }
            }
            setShowEditModal(false);
            fetchMembers();
        } catch (err) {
            setEditError('Failed to update user. Please try again.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleRoleChange = async (memberId: string, newRole: string) => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/users/me/team/${memberId}/role`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to change role');
            }
        } catch (err) {
            console.error('Role update error', err);
        }
    };

    const handleRemove = async (memberId: string, memberName: string) => {
        if (!token) return;
        if (!window.confirm(`Are you sure you want to deactivate ${memberName}? They will no longer be able to login.`)) return;

        try {
            const res = await fetch(`${API_URL}/users/me/team/${memberId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setMembers(members.map(m => m.id === memberId ? { ...m, status: 'REJECTED' } : m));
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to remove user');
            }
        } catch (err) {
            console.error('Remove member error', err);
        }
    };

    if (!user || !['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(user.role)) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-4 rounded-xl border border-gray-200 gap-4">
                <h1 className="text-xl font-bold text-acron-yoke-500">My Organization Team</h1>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Search name or email..."
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-acron-pitch"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none"
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Roles</option>
                        <option value="VIEWER">Viewer</option>
                        <option value="PUBLISHER">Publisher</option>
                    </select>
                    <button
                        onClick={() => { setShowAddModal(true); setAddError(''); setAddSuccess(''); setResetLink(''); }}
                        className="px-4 py-2 bg-acron-pitch text-acron-yoke-500 font-bold text-sm rounded-lg hover:bg-[#00c766] transition-colors whitespace-nowrap"
                    >
                        + Add User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                                <th className="p-4">Name / Email</th>
                                <th className="p-4 hidden md:table-cell">Title</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Role</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">Loading team members...</td>
                                </tr>
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">No team members found matching your criteria.</td>
                                </tr>
                            ) : members.map(m => (
                                <tr key={m.id} className={`border-b border-gray-100 transition-colors ${m.status === 'REJECTED' || m.status === 'INACTIVE' ? 'bg-gray-50 opacity-75' : 'hover:bg-gray-50'}`}>
                                    <td className="p-4">
                                        <p className="font-bold text-acron-yoke-500 text-sm">{m.name} {m.id === user.id && <span className="text-xs bg-blue-100 text-blue-700 px-2 rounded-full ml-2">You</span>}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{m.email}</p>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-sm text-gray-600">
                                        {m.title || '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {m.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {(['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(m.role) || m.status === 'REJECTED') ? (
                                            <span className="text-sm font-medium text-gray-700">{m.role.replace('_', ' ')}</span>
                                        ) : (
                                            <select
                                                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none"
                                                value={m.role}
                                                onChange={(e) => handleRoleChange(m.id, e.target.value)}
                                            >
                                                <option value="VIEWER">VIEWER</option>
                                                <option value="PUBLISHER">PUBLISHER</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {(!['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(m.role) && m.status !== 'REJECTED') && (
                                            <>
                                                <button
                                                    onClick={() => openEditModal(m)}
                                                    className="text-xs text-acron-pitch hover:text-[#00c766] font-medium px-3 py-1.5 border border-acron-pitch/30 rounded hover:bg-acron-pitch/5 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleRemove(m.id, m.name)}
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 border border-red-200 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    Deactivate
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-200 flex justify-center items-center space-x-4 bg-gray-50">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 border border-gray-300 bg-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-600 font-medium">Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="px-3 py-1.5 border border-gray-300 bg-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-acron-yoke-500">Add New Team Member</h2>
                            <p className="text-sm text-gray-500 mt-1">Add a user to your organization. They will receive an email with login instructions.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            {addError && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{addError}</div>}
                            {addSuccess && (
                                <div className="space-y-3">
                                    <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{addSuccess}</div>
                                    {resetLink && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-blue-700 mb-1">🔗 Share this password reset link with the new user:</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={resetLink}
                                                    className="flex-1 text-xs bg-white border border-blue-200 rounded px-2 py-1.5 text-blue-800 font-mono"
                                                />
                                                <button
                                                    onClick={() => { navigator.clipboard.writeText(resetLink); }}
                                                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-blue-500 mt-1.5">This link expires in 7 days.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={addForm.name}
                                    onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                                    placeholder="e.g. Jane Smith"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-acron-pitch/50 focus:border-acron-pitch"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                                <input
                                    type="email"
                                    value={addForm.email}
                                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                                    placeholder="jane.smith@company.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-acron-pitch/50 focus:border-acron-pitch"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={addForm.phone}
                                    onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                                    placeholder="+1 555-123-4567"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-acron-pitch/50 focus:border-acron-pitch"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Access Role *</label>
                                <select
                                    value={addForm.role}
                                    onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-acron-pitch/50 focus:border-acron-pitch"
                                >
                                    <option value="VIEWER">Viewer — Can view content</option>
                                    <option value="PUBLISHER">Publisher — Can create and publish posts</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddUser}
                                disabled={addLoading}
                                className="px-5 py-2 text-sm font-bold bg-acron-pitch text-acron-yoke-500 rounded-lg hover:bg-[#00c766] transition-colors disabled:opacity-50"
                            >
                                {addLoading ? 'Adding...' : 'Add User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-acron-yoke-500">Edit Team Member</h2>
                            <p className="text-sm text-gray-500 mt-1">Update the role for <span className="font-semibold">{editMember.name}</span></p>
                        </div>
                        <div className="p-6 space-y-4">
                            {editError && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{editError}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editMember.email}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Access Role</label>
                                <select
                                    value={editForm.role}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-acron-pitch/50 focus:border-acron-pitch"
                                >
                                    <option value="VIEWER">Viewer — Can view content</option>
                                    <option value="PUBLISHER">Publisher — Can create and publish posts</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditUser}
                                disabled={editLoading}
                                className="px-5 py-2 text-sm font-bold bg-acron-pitch text-acron-yoke-500 rounded-lg hover:bg-[#00c766] transition-colors disabled:opacity-50"
                            >
                                {editLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
