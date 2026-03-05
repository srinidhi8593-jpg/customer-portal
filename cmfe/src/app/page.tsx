'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`text-3xl md:text-4xl font-black text-white mb-1 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      {target}{suffix}
    </div>
  );
}

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-acron-pitch border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400 font-medium">Loading portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Hero Section - Dark & Premium */}
      <section className="relative pt-32 pb-40 overflow-hidden bg-acron-yoke-500 text-white">
        {/* Abstract Background Design */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-acron-pitch opacity-20 blur-[130px] animate-gradient" style={{ backgroundSize: '200% 200%' }} />
          <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-acron-thrust opacity-15 blur-[100px]" />
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8 shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-acron-pitch animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest uppercase text-gray-200">The Premier Knowledge Network</span>
          </div>

          <h1 className="animate-fade-in-up delay-100 text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.1]">
            Powering the Future of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-acron-thrust to-acron-pitch drop-shadow-sm">
              Debate & Collaboration
            </span>
          </h1>

          <p className="animate-fade-in-up delay-200 mt-4 max-w-2xl mx-auto text-xl text-gray-300 font-medium leading-relaxed mb-12">
            Connect with industry experts, access valuable resources, and elevate your operational efficiency in one unified portal.
          </p>

          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-acron-pitch text-acron-yoke-500 font-extrabold text-lg hover:bg-white hover:-translate-y-1 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(2,230,141,0.5)] hover:shadow-[0_0_60px_-10px_rgba(2,230,141,0.7)] active:scale-95">
              Join the Debate
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 text-white border border-white/20 font-bold text-lg hover:bg-white/20 backdrop-blur-md hover:-translate-y-1 transition-all duration-300 active:scale-95">
              Member Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto border-t border-white/10 pt-12">
            {[
              { value: '50k+', label: 'Active Members' },
              { value: '99.9%', label: 'System Uptime' },
              { value: '10k+', label: 'Resources Available' },
              { value: '24/7', label: 'Expert Support' }
            ].map((stat, i) => (
              <div key={stat.label} className={`animate-fade-in-up`} style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                <AnimatedCounter target={stat.value} />
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Features Section - Light */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-acron-yoke-500 tracking-tight">Everything you need to succeed</h2>
            <p className="mt-4 text-gray-500 font-medium max-w-2xl mx-auto text-lg">Our unified portal provides comprehensive access to the tools and knowledge required for professional excellence.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Precision Training',
                desc: 'Access highly detailed simulation configurations and specialized training modules designed by industry veterans.',
                gradient: 'from-emerald-400/20 to-teal-500/10'
              },
              {
                icon: '📊',
                title: 'Data Analytics',
                desc: 'Unlock powerful insights with our analytics platform, optimizing performance and productivity.',
                gradient: 'from-blue-400/20 to-indigo-500/10'
              },
              {
                icon: '🤝',
                title: 'Expert Debate',
                desc: 'Engage in high-level technical discussions, share best practices, and solve complex challenges together.',
                gradient: 'from-purple-400/20 to-pink-500/10'
              }
            ].map((feature, i) => (
              <div key={i} className={`bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:border-acron-pitch/40 hover:shadow-2xl hover:shadow-acron-pitch/10 transition-all duration-500 group hover:-translate-y-2 relative overflow-hidden hover-gradient-border`}>
                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700`} />
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100 mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 relative z-10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-acron-yoke-500 mb-3 relative z-10">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium relative z-10">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-acron-yoke-500 via-acron-thrust to-acron-yoke-500 animate-gradient" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center text-white">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-8 backdrop-blur-sm border border-white/20 animate-float">
            🚀
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-6">
            Ready to elevate your operations?
          </h2>
          <p className="text-lg text-gray-300 font-medium mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of professionals who are already leveraging our platform to drive excellence.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth/register" className="px-8 py-4 rounded-xl bg-acron-pitch text-acron-yoke-500 font-extrabold text-lg hover:bg-white transition-all duration-300 shadow-xl hover:-translate-y-1 active:scale-95">
              Get Started Free
            </Link>
            <Link href="/auth/login" className="px-8 py-4 rounded-xl border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 active:scale-95">
              Sign In →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
