import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-acron-yoke-500 text-white mt-16 border-t shadow-[0_-10px_40px_rgba(0,43,49,0.1)] border-white/5 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-acron-pitch/40 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
                    <div>
                        <h3 className="text-acron-pitch text-base font-black mb-5 tracking-widest uppercase">Debate</h3>
                        <ul className="space-y-2.5 text-sm text-gray-300 font-medium tracking-wide">
                            {['Forum', 'Resources', 'Knowledge Base', 'Events', 'Blog'].map(i => (
                                <li key={i}><Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">{i}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-acron-pitch text-base font-black mb-5 tracking-widest uppercase">Platform</h3>
                        <ul className="space-y-2.5 text-sm text-gray-300 font-medium tracking-wide">
                            {['Dashboard', 'Notifications', 'Teams', 'Analytics', 'Settings'].map(i => (
                                <li key={i}><Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">{i}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-acron-pitch text-base font-black mb-5 tracking-widest uppercase">Company</h3>
                        <ul className="space-y-2.5 text-sm text-gray-300 font-medium tracking-wide">
                            {['About Us', 'Careers', 'Contact'].map(i => (
                                <li key={i}><Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">{i}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-acron-pitch text-base font-black mb-5 tracking-widest uppercase">Explore</h3>
                        <ul className="space-y-2.5 text-sm text-gray-300 font-medium tracking-wide">
                            {['DebatHub', 'About Us', 'Newsroom'].map(i => (
                                <li key={i}><Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">{i}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-acron-pitch text-base font-black mb-5 tracking-widest uppercase">Support</h3>
                        <ul className="space-y-2.5 text-sm text-gray-300 font-medium tracking-wide">
                            {['Contact Us', 'FAQ'].map(i => (
                                <li key={i}><Link href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">{i}</Link></li>
                            ))}
                        </ul>

                    </div>
                </div>
            </div>
            <div className="border-t border-white/10 bg-black/20 relative">
                {/* Gradient line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-acron-pitch/20 to-transparent" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400 font-medium">
                    <p>© 2026 DebatHub. &middot; <Link href="#" className="hover:text-white transition-colors duration-300">Privacy Policy</Link> &middot; <Link href="#" className="hover:text-white transition-colors duration-300">Terms & Conditions</Link></p>
                    <div className="flex space-x-3 mt-4 md:mt-0">
                        {[
                            { icon: 'f', label: 'Facebook' },
                            { icon: 'in', label: 'LinkedIn' },
                            { icon: '𝕏', label: 'X' },
                            { icon: '▶', label: 'YouTube' },
                            { icon: '📷', label: 'Instagram' }
                        ].map((social, i) => (
                            <a key={i} href="#" aria-label={social.label}
                                className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-300 hover:bg-acron-pitch hover:text-acron-yoke-500 hover:border-acron-pitch hover:scale-110 transition-all duration-300 text-sm font-bold">
                                {social.icon}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
