'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
    { label: 'Profile', href: '/account', icon: '👤' },
    { label: 'My Posts', href: '/account/posts', icon: '📝' },
    { label: 'Notifications', href: '/account/notifications', icon: '🔔' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();

    const allowedNavItems = user && ['ORG_ADMIN', 'BUSINESS_ADMIN'].includes(user.role)
        ? [...NAV_ITEMS, { label: 'My Teams', href: '/account/teams', icon: '👥' }]
        : NAV_ITEMS;

    return (
        <div className="space-y-6">
            <nav className="text-xs text-gray-500 animate-fade-in">
                <Link href="/" className="hover:text-acron-pitch transition-colors">Home</Link> › <span className="text-acron-pitch font-medium">My Account</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-6 shadow-sm animate-fade-in-up">
                        <div className="bg-gradient-to-br from-acron-yoke-500 via-acron-thrust to-acron-yoke-400 p-6 relative overflow-hidden animate-gradient">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:1.5rem_1.5rem]" />
                            <div className="relative z-10">
                                <div className="w-14 h-14 bg-acron-pitch rounded-2xl flex items-center justify-center text-acron-yoke-500 font-black text-xl mb-3 shadow-lg shadow-acron-pitch/30 animate-pulse-glow">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <p className="text-white font-bold text-sm">{user?.name || 'User'}</p>
                                <p className="text-gray-300 text-xs mt-0.5 font-medium">{user?.email}</p>
                                <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-white/15 text-acron-pitch px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">
                                    {user?.role?.replace('_', ' ') || 'Member'}
                                </span>
                            </div>
                        </div>
                        <nav className="p-2">
                            {allowedNavItems.map((item, i) => (
                                <Link key={item.href} href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${pathname === item.href
                                        ? 'bg-acron-pitch/10 text-acron-yoke-500 font-bold shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-acron-yoke-500'
                                        }`}>
                                    <span className="text-base">{item.icon}</span>
                                    {item.label}
                                    {pathname === item.href && (
                                        <div className="ml-auto w-1.5 h-1.5 bg-acron-pitch rounded-full" />
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-3 animate-fade-in-up delay-200">{children}</div>
            </div>
        </div>
    );
}
