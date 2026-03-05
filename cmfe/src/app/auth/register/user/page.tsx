'use client';

import { useState } from 'react';
import { API_BASE_URL, API_URL } from '@/config/api';
import Link from 'next/link';

const INDUSTRIES = ['Technology', 'Education', 'Healthcare', 'Finance', 'Manufacturing', 'Other'];
const PHONE_COUNTRIES = [
    { code: 'US', flag: '🇺🇸', dial: '+1' },
    { code: 'UK', flag: '🇬🇧', dial: '+44' },
    { code: 'CA', flag: '🇨🇦', dial: '+1' },
    { code: 'DE', flag: '🇩🇪', dial: '+49' },
    { code: 'FR', flag: '🇫🇷', dial: '+33' },
    { code: 'AU', flag: '🇦🇺', dial: '+61' },
    { code: 'IN', flag: '🇮🇳', dial: '+91' },
    { code: 'JP', flag: '🇯🇵', dial: '+81' },
];

export default function UserRegisterPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [title, setTitle] = useState('');
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');
    const [location, setLocation] = useState('');
    const [phoneCountry, setPhoneCountry] = useState('US');
    const [phone, setPhone] = useState('');
    const [industry, setIndustry] = useState('');

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const selectedCountry = PHONE_COUNTRIES.find(c => c.code === phoneCountry) || PHONE_COUNTRIES[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/register/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName, lastName, title, email, company, location,
                    phone: `${selectedCountry.dial} ${phone}`,
                    phoneCountry: phoneCountry,
                    industry: industry || undefined,

                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Submission failed'); }
            else { setSubmitted(true); }
        } catch { setError('Unable to connect to server'); }
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-acron-yoke-500 to-acron-yoke-400 text-white px-8 py-8 rounded-xl">
                    <h1 className="text-3xl font-bold">Register as User</h1>
                    <nav className="mt-2 text-sm text-gray-300"><Link href="/" className="hover:text-acron-pitch">Home</Link> &gt; <span className="text-acron-pitch">Register as user</span></nav>
                </div>
                <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
                    <div className="w-20 h-20 bg-acron-pitch/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-acron-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-acron-yoke-500 mb-3">Request Submitted Successfully</h2>
                    <p className="text-gray-500 max-w-md mx-auto">Your registration request has been submitted. Our team will review your request and you will be notified via email once a decision is made.</p>
                    <Link href="/" className="inline-block mt-6 bg-acron-pitch text-acron-yoke-500 font-bold py-2.5 px-8 rounded-lg hover:bg-acron-pitch transition-all">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-acron-yoke-500 to-acron-yoke-400 text-white px-8 py-8 rounded-xl">
                <h1 className="text-3xl font-bold">Register as User</h1>
            </div>

            {/* Breadcrumbs + Form Container */}
            <div className="bg-gray-100 rounded-xl p-6">
                <nav className="text-sm text-gray-500 mb-4">
                    <Link href="/" className="hover:text-acron-pitch">Home</Link> &gt; <span className="text-acron-pitch font-medium">Register as user</span>
                </nav>

                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-acron-yoke-500 mb-6">User details</h2>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* First/Last Name */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">First Name<span className="text-red-500">*</span></label>
                                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm text-gray-900 focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Jane" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">Last Name<span className="text-red-500">*</span></label>
                                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm text-gray-900 focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Doe" />
                            </div>
                        </div>

                        {/* Title / Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm text-gray-900 focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Title" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">Email Address<span className="text-red-500">*</span></label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm text-gray-900 focus:border-acron-pitch focus:ring-acron-pitch" placeholder="jane.doe@business.com" />
                            </div>
                        </div>

                        {/* Organization / Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">My Organization Name<span className="text-red-500">*</span></label>
                                <input type="text" required value={company} onChange={e => setCompany(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm text-gray-900 focus:border-acron-pitch focus:ring-acron-pitch" placeholder="My Company" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">Location<span className="text-red-500">*</span></label>
                                <input type="text" required value={location} onChange={e => setLocation(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm text-gray-900 focus:border-acron-pitch focus:ring-acron-pitch" placeholder="London" />
                            </div>
                        </div>

                        {/* Phone Number with Country Selector */}
                        <div className="max-w-md">
                            <label className="block text-sm font-semibold text-acron-yoke-500 mb-1.5">Phone Number<span className="text-red-500">*</span></label>
                            <div className="flex">
                                <select value={phoneCountry} onChange={e => setPhoneCountry(e.target.value)}
                                    className="rounded-l-lg border border-r-0 border-gray-300 shadow-sm p-3 pr-2 text-sm text-gray-900 focus:border-acron-pitch focus:ring-acron-pitch bg-white w-24">
                                    {PHONE_COUNTRIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.flag} {c.dial}</option>
                                    ))}
                                </select>
                                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                                    className="flex-1 rounded-r-lg border border-gray-300 shadow-sm p-3 text-sm text-gray-900 focus:border-acron-pitch focus:ring-acron-pitch" placeholder="(555) 123 4567" />
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-4">
                            <button type="submit" disabled={loading}
                                className="bg-acron-yoke-500 text-white font-bold py-3 px-12 rounded-lg hover:bg-acron-yoke-400 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm">
                                {loading ? 'Submitting...' : 'SUBMIT  ›'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
