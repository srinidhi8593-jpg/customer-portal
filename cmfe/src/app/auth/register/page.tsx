'use client';

import Link from 'next/link';

export default function RegisterPage() {
    return (
        <div className="space-y-8 max-w-4xl mx-auto py-4">
            <div className="animate-fade-in-up relative overflow-hidden bg-gradient-to-br from-acron-yoke-500 via-acron-thrust to-acron-yoke-400 text-white px-8 py-10 rounded-3xl shadow-2xl shadow-acron-yoke-500/20">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:2rem_2rem]" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-acron-pitch/20 rounded-full blur-[60px]" />
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">Create Your Account</h1>
                    <p className="mt-3 text-gray-300 font-medium max-w-xl">Join the DebatHub community and get access to exclusive resources, training modules, and expert support.</p>
                    <nav className="mt-4 text-sm text-gray-300/80">
                        <Link href="/" className="hover:text-acron-pitch transition-colors">Home</Link> <span className="mx-1">›</span> <span className="text-acron-pitch font-medium">Register</span>
                    </nav>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Registration */}
                <div className="animate-fade-in-up delay-200 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden hover-gradient-border">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-400/15 transition-all duration-500" />

                    <div className="flex items-start gap-5 relative z-10">
                        <div className="flex-shrink-0 w-12 h-12 bg-acron-pitch/10 rounded-2xl flex items-center justify-center group-hover:bg-acron-pitch/20 group-hover:scale-110 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-acron-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-acron-pitch uppercase tracking-widest">Option 1</span>
                            <h2 className="text-xl font-black text-acron-yoke-500 mt-1 mb-2">Register as User</h2>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mt-4 mb-6 leading-relaxed relative z-10">Request individual access to DebatHub. Your request will be manually reviewed and assigned to an organization by an administrator.</p>
                    <Link href="/auth/register/user" className="relative z-10 inline-flex items-center gap-2 bg-acron-pitch text-acron-yoke-500 font-bold py-3 px-6 rounded-xl hover:bg-acron-yoke-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95 text-sm">
                        Register as User
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Organization Registration */}
                <div className="animate-fade-in-up delay-300 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden hover-gradient-border">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-400/15 transition-all duration-500" />

                    <div className="flex items-start gap-5 relative z-10">
                        <div className="flex-shrink-0 w-12 h-12 bg-acron-pitch/10 rounded-2xl flex items-center justify-center group-hover:bg-acron-pitch/20 group-hover:scale-110 transition-all duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-acron-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-acron-pitch uppercase tracking-widest">Option 2</span>
                            <h2 className="text-xl font-black text-acron-yoke-500 mt-1 mb-2">Register as Organization</h2>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mt-4 mb-6 leading-relaxed relative z-10">Register your organization for B2B access. Includes Sold To, Bill To, Ship To, Carrier, and Authority Admin Contact information.</p>
                    <Link href="/auth/register/org" className="relative z-10 inline-flex items-center gap-2 bg-acron-pitch text-acron-yoke-500 font-bold py-3 px-6 rounded-xl hover:bg-acron-yoke-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-lg active:scale-95 text-sm">
                        Register as Organization
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>

            <p className="text-center text-sm text-gray-500 font-medium animate-fade-in delay-400">
                Already have an account? <Link href="/auth/login" className="text-acron-pitch font-bold hover:text-acron-thrust transition-colors">Sign In</Link>
            </p>
        </div>
    );
}
