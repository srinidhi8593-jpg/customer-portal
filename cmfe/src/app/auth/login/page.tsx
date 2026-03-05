'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);

        if (result.success) {
            router.push('/dashboard');
        } else {
            setError(result.error || 'Login failed');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12">
            <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl shadow-acron-yoke-500/10 border border-gray-100 animate-scale-in">
                {/* Left Panel - Branded */}
                <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-acron-yoke-500 via-acron-thrust to-acron-yoke-400 text-white relative overflow-hidden animate-gradient">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-acron-pitch/20 rounded-full blur-[80px]" />
                    <div className="absolute top-20 -left-10 w-40 h-40 bg-white/5 rounded-full blur-[60px]" />

                    <div className="relative z-10">
                        <span style={{ display: 'none' }} className="h-10 w-auto mb-8 opacity-90" />
                        <h2 className="text-3xl font-black tracking-tight leading-tight mb-4">
                            Welcome back to your
                            <span className="text-acron-pitch block">DebatHub</span>
                        </h2>
                        <p className="text-gray-300 font-medium leading-relaxed">
                            Access your resources, connect with the community, and manage your projects.
                        </p>
                    </div>

                    <div className="relative z-10 flex items-center gap-4 mt-8">
                        <div className="flex -space-x-2">
                            {['A', 'B', 'C', 'D'].map((letter, i) => (
                                <div key={letter} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-xs font-bold backdrop-blur-sm">
                                    {letter}
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-300 font-medium">
                            <span className="text-white font-bold">50k+</span> professionals trust us
                        </p>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="bg-white p-8 md:p-10 flex flex-col justify-center">
                    <div className="md:hidden mb-8">
                        <span style={{ display: 'none' }} className="h-10 w-auto mx-auto mb-4" />
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-acron-yoke-500 tracking-tight">Sign In</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">Enter your credentials to access your account</p>
                    </div>

                    {error && (
                        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 animate-fade-in-up">
                            <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="input-premium block w-full rounded-xl p-3 text-sm font-medium"
                                placeholder="you@company.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="input-premium block w-full rounded-xl p-3 text-sm font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Link href="/auth/forgot-password" className="text-sm text-acron-pitch hover:text-acron-thrust font-semibold transition-colors">Forgot password?</Link>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-acron-pitch text-acron-yoke-500 font-extrabold py-3.5 px-4 rounded-xl hover:bg-acron-yoke-500 hover:text-white transition-all duration-300 shadow-lg shadow-acron-pitch/20 hover:shadow-acron-yoke-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-acron-yoke-500/30 border-t-acron-yoke-500 rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500 font-medium">
                            Don&apos;t have an account?{' '}
                            <Link href="/auth/register" className="text-acron-pitch font-bold hover:text-acron-thrust transition-colors">Create Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
