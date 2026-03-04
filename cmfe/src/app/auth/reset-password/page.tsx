'use client';

import { useState } from 'react';
import { API_BASE_URL, API_URL } from '@/config/api';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!token) {
            setError('Invalid or missing reset token. Please request a new reset link.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Reset failed');
            } else {
                setSuccess(true);
            }
        } catch {
            setError('Unable to connect to server');
        }

        setLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-2xl shadow-lg text-center">
                    <div className="w-16 h-16 bg-acron-pitch/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-acron-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-acron-yoke-500 mb-2">Password Reset Successful</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        Your password has been updated. You can now log in with your new password.
                    </p>
                    <a
                        href="/auth/login"
                        className="inline-block bg-acron-pitch text-acron-yoke-500 font-bold py-2.5 px-8 rounded-lg hover:bg-acron-pitch transition-all shadow-sm hover:shadow-md"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-2xl shadow-lg">
                <div className="text-center mb-8">

                    <h1 className="text-2xl font-bold text-acron-yoke-500">Reset Password</h1>
                    <p className="text-sm text-gray-500 mt-1">Enter your new password below</p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-acron-yoke-500 mb-1">New Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-acron-pitch focus:ring-acron-pitch p-2.5 border text-sm"
                            placeholder="Minimum 6 characters"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-acron-yoke-500 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-acron-pitch focus:ring-acron-pitch p-2.5 border text-sm"
                            placeholder="Re-enter your password"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-acron-pitch text-acron-yoke-500 font-bold py-2.5 px-4 rounded-lg hover:bg-acron-pitch transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
