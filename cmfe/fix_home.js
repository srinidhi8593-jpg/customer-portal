const fs = require('fs');

const targetFile = '/Users/srinidhi.bk/WS/cmfe/src/app/page.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

content = `import HomeClient from './HomeClient';

export default function Home() {
  return <HomeClient />;
}
`;

fs.writeFileSync(targetFile, content);

const clientFile = '/Users/srinidhi.bk/WS/cmfe/src/app/HomeClient.tsx';
const clientContent = `'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomeClient() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="space-y-12 mt-6">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-acron-yoke-500 via-acron-yoke-400 to-[#0a4a4e] text-white px-10 py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-acron-pitch rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-acron-pitch rounded-full filter blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            Welcome to <span className="text-acron-pitch">Acron Aviation</span> Community Portal
          </h1>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            Connect with fellow aviation professionals, explore training resources, and participate in community discussions.
          </p>
          <div className="flex space-x-4">
            {user ? (
                <>
                    <Link href="/forum" className="bg-acron-pitch hover:bg-acron-pitch text-acron-yoke-500 font-bold py-3 px-8 rounded-lg shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                    Go to Forum
                    </Link>
                    <Link href="/resources" className="bg-transparent hover:bg-white/10 text-white font-bold py-3 px-8 rounded-lg border-2 border-acron-pitch transition-all hover:-translate-y-0.5">
                    Browse Resources
                    </Link>
                </>
            ) : null}
          </div>
        </div>
      </section>

      {/* A-Spot Banner for Unauthenticated Users */}
      {!user && (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00363D] to-[#517a7e] text-white px-10 py-12 flex items-center justify-between">
             <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full filter blur-3xl -translate-y-1/4 translate-x-1/4" />
            </div>
            <div className="relative z-10 flex-1 pr-8">
                <h2 className="text-3xl font-bold mb-3">Join the Acron Aviation Network</h2>
                <p className="text-gray-200">Register your organization to access exclusive training systems, flight data intelligence, and our premier pilot academy.</p>
            </div>
            <div className="relative z-10 flex-shrink-0">
                <Link href="/auth/register/organization" className="bg-acron-pitch hover:bg-[#00c97a] text-acron-yoke-500 font-bold py-4 px-10 rounded-xl shadow-xl transition-transform hover:-translate-y-1 text-lg">
                    Register Now
                </Link>
            </div>
        </section>
      )}

      {/* Quick Links Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {user ? (
            <>
                {/* Forum Card for Logged in Users */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 bg-acron-pitch/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-acron-pitch/20 transition-colors">
                    <span className="text-2xl">💬</span>
                </div>
                <h3 className="text-lg font-bold text-acron-yoke-500 mb-2">Community Forum</h3>
                <p className="text-sm text-gray-500 mb-4">Join discussions, ask questions, and share your expertise with aviation professionals worldwide.</p>
                <Link href="/forum" className="text-acron-pitch font-semibold text-sm hover:underline">Explore Forum →</Link>
                </div>
                
                {/* Resources Card for Logged in Users */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 bg-acron-pitch/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-acron-pitch/20 transition-colors">
                    <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-lg font-bold text-acron-yoke-500 mb-2">Resource Library</h3>
                <p className="text-sm text-gray-500 mb-4">Access manuals, guidelines, policies, and technical documentation for your fleet operations.</p>
                <Link href="/resources" className="text-acron-pitch font-semibold text-sm hover:underline">Browse Resources →</Link>
                </div>

                {/* Training Services Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 bg-acron-pitch/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-acron-pitch/20 transition-colors">
                    <span className="text-2xl">✈️</span>
                </div>
                <h3 className="text-lg font-bold text-acron-yoke-500 mb-2">Training Services</h3>
                <p className="text-sm text-gray-500 mb-4">Discover simulator-based training programs and pilot academy courses tailored to your needs.</p>
                <Link href="/forum" className="text-acron-pitch font-semibold text-sm hover:underline">Learn More →</Link>
                </div>
            </>
        ) : (
            <>
                {/* Training Systems Card for Unauthenticated Users */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 bg-acron-pitch/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-acron-pitch/20 transition-colors">
                    <span className="text-2xl">🛫</span>
                </div>
                <h3 className="text-lg font-bold text-acron-yoke-500 mb-2">Cutting-edge pilot training systems</h3>
                <p className="text-sm text-gray-500 mb-4">Experience full flight simulators and comprehensive training devices built with utmost fidelity.</p>
                <a href="https://acronaviation.com/training-systems" className="text-acron-pitch font-semibold text-sm hover:underline">Explore More →</a>
                </div>
                
                {/* Avionics Card for Unauthenticated Users */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 bg-acron-pitch/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-acron-pitch/20 transition-colors">
                    <span className="text-2xl">⚙️</span>
                </div>
                <h3 className="text-lg font-bold text-acron-yoke-500 mb-2">Aftermarket Spares & Comps</h3>
                <p className="text-sm text-gray-500 mb-4">Find reliable aftermarket parts, components, and avionics upgrades for your fleet.</p>
                <a href="https://acronaviation.com/avionics" className="text-acron-pitch font-semibold text-sm hover:underline">Discover Avionics →</a>
                </div>

                {/* Driver Training Card for Unauthenticated Users */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group">
                <div className="w-12 h-12 bg-acron-pitch/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-acron-pitch/20 transition-colors">
                    <span className="text-2xl">🚗</span>
                </div>
                <h3 className="text-lg font-bold text-acron-yoke-500 mb-2">Driver Systems</h3>
                <p className="text-sm text-gray-500 mb-4">Advanced driver training solutions covering ground safety and airfield operational driving.</p>
                <a href="https://acronaviation.com/driver-training-solutions" className="text-acron-pitch font-semibold text-sm hover:underline">Learn More →</a>
                </div>
            </>
        )}
      </section>
    </div>
  );
}
`;

fs.writeFileSync(clientFile, clientContent);
console.log("Successfully created HomeClient.tsx and converted page.tsx to Server Component.");
