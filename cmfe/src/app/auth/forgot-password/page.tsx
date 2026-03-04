'use client';

import { useState } from 'react';
import { API_BASE_URL, API_URL } from '@/config/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Something went wrong');
            } else {
                setSubmitted(true);
            }
        } catch {
            setError('Unable to connect to server');
        }

        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-2xl shadow-lg text-center">
                    <div className="w-16 h-16 bg-acron-pitch/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-acron-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-acron-yoke-500 mb-2">Check Your Email</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        We&apos;ve sent a password reset link to <strong className="text-acron-yoke-500">{email}</strong>.
                        Please check your inbox and follow the instructions to reset your password.
                    </p>
                    <p className="text-xs text-gray-400 mb-6">The link will expire in 1 hour.</p>
                    <a href="/auth/login" className="text-acron-pitch font-semibold text-sm hover:underline">← Back to Login</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-md bg-white p-8 border border-gray-200 rounded-2xl shadow-lg">
                <div className="text-center mb-8">

                    <h1 className="text-2xl font-bold text-acron-yoke-500">Forgot Password</h1>
                    <p className="text-sm text-gray-500 mt-1">Enter your email and we&apos;ll send you a reset link</p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-acron-yoke-500 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-acron-pitch focus:ring-acron-pitch p-2.5 border text-sm"
                            placeholder="you@company.com"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-acron-pitch text-acron-yoke-500 font-bold py-2.5 px-4 rounded-lg hover:bg-acron-pitch transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                <p className="text-center mt-6 text-sm text-gray-500">
                    Remember your password? <a href="/auth/login" className="text-acron-pitch font-semibold hover:underline">Sign In</a>
                </p>
            </div>
        </div>
    );
}
