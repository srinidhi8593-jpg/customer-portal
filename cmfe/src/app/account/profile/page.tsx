'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, token, isLoading, updateUser } = useAuth();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
    const [changingPassword, setChangingPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/login');
        } else if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [isLoading, user, router]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMsg({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 8) {
            setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long' });
            return;
        }

        setChangingPassword(true);

        try {
            const res = await fetch(`${API_URL}/users/me/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();
            if (!res.ok) {
                setPasswordMsg({ type: 'error', text: data.error || 'Failed to change password' });
            } else {
                setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            setPasswordMsg({ type: 'error', text: 'Server connection failed' });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg({ type: '', text: '' });

        try {
            const res = await fetch(`${API_URL}/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) {
                setMsg({ type: 'error', text: data.error || 'Failed to update profile' });
            } else {
                setMsg({ type: 'success', text: 'Profile updated successfully.' });
                updateUser(data);
                setIsEditing(false);
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Server connection failed' });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || !user) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-acron-pitch border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400 font-medium">Loading profile...</span>
                </div>
            </div>
        );
    }

    const AlertBox = ({ msg: m }: { msg: { type: string; text: string } }) => {
        if (!m.text) return null;
        const isError = m.type === 'error';
        return (
            <div className={`p-4 mb-6 rounded-xl text-sm font-medium flex items-center gap-3 animate-fade-in-up ${isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isError ? 'bg-red-100' : 'bg-emerald-100'}`}>
                    {isError ? '⚠️' : '✅'}
                </span>
                {m.text}
            </div>
        );
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-acron-yoke-500 tracking-tight">My Profile</h1>
                <p className="text-gray-400 mt-2 font-medium">Manage your personal information and account security.</p>
            </div>

            <AlertBox msg={msg} />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-acron-yoke-500">Personal Information</h2>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-sm font-bold text-acron-pitch hover:text-acron-thrust transition-colors flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Profile
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSave}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                                {isEditing ? (
                                    <input type="text" required value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="input-premium w-full px-4 py-2.5 rounded-xl" />
                                ) : (
                                    <p className="font-semibold text-gray-900 py-2.5">{user.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                                {isEditing ? (
                                    <input type="email" required value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="input-premium w-full px-4 py-2.5 rounded-xl" />
                                ) : (
                                    <p className="font-semibold text-gray-900 py-2.5">{user.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                                {isEditing ? (
                                    <input type="tel" value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 (555) 000-0000"
                                        className="input-premium w-full px-4 py-2.5 rounded-xl" />
                                ) : (
                                    <p className="font-semibold text-gray-900 py-2.5">{user.phone || <span className="text-gray-400 italic font-normal">Not provided</span>}</p>
                                )}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex justify-end gap-3 border-t border-gray-100 pt-6 mt-4">
                                <button type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
                                    }}
                                    className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-100">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="bg-acron-pitch hover:bg-acron-yoke-500 hover:text-white text-acron-yoke-500 font-bold py-2.5 px-6 rounded-xl transition-all duration-300 shadow-sm disabled:opacity-70 active:scale-95 flex items-center gap-2">
                                    {saving ? (
                                        <><div className="w-4 h-4 border-2 border-acron-yoke-500/30 border-t-acron-yoke-500 rounded-full animate-spin" /> Saving...</>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Read Only Business Logic block */}
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 sm:p-8 animate-fade-in-up delay-200">
                    <h2 className="text-lg font-black text-acron-yoke-500 mb-6 border-b border-gray-200 pb-3 flex items-center gap-2">
                        <span className="text-xl">🏢</span> Business Information
                    </h2>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Company Role</label>
                            <p className="font-semibold text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded-lg inline-block">
                                {user.role.replace('_', ' ')}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Designation</label>
                            <p className="text-gray-900 font-medium">{user.title || <span className="text-gray-400 italic">Not specified</span>}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Business Unit</label>
                            <p className="text-gray-900 font-medium">{user.businessUnit || <span className="text-gray-400 italic">Global</span>}</p>
                        </div>
                    </div>
                </div>

                {/* Security Block */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 flex flex-col justify-between animate-fade-in-up delay-300">
                    <div>
                        <h2 className="text-lg font-black text-acron-yoke-500 mb-2 flex items-center gap-2">
                            <span className="text-xl">🔒</span> Account Security
                        </h2>
                        <p className="text-sm text-gray-400 mb-6 border-b border-gray-100 pb-4 font-medium">Update your password securely. Use at least 8 characters.</p>

                        <AlertBox msg={passwordMsg} />

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
                                <input type="password" required value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="input-premium w-full px-4 py-2.5 rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                                <input type="password" required value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="At least 8 characters"
                                    className="input-premium w-full px-4 py-2.5 rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                                <input type="password" required value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Must match new password"
                                    className="input-premium w-full px-4 py-2.5 rounded-xl" />
                            </div>
                            <button type="submit"
                                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                                className="w-full bg-acron-yoke-500 hover:bg-acron-yoke-400 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]">
                                {changingPassword ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Update Password
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
