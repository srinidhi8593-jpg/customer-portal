'use client';

import { useState } from 'react';
import { API_BASE_URL, API_URL } from '@/config/api';
import Link from 'next/link';

const COUNTRIES = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia', 'India', 'Japan', 'Brazil', 'Other'];

interface AddressFields {
    company: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    country: string;
    zipCode: string;
    city: string;
    state: string;
}

const emptyAddress: AddressFields = {
    company: '', phone: '', email: '', addressLine1: '', addressLine2: '',
    country: '', zipCode: '', city: '', state: ''
};

const AddressSection = ({
    title, data, setData, showSameAs, sameAsOptions, sameAsValue, onSameAsChange, disabled, showSalesTaxExempt, salesTaxExemptValue, onSalesTaxChange, showSaveForFuture, saveForFutureValue, onSaveForFutureChange
}: {
    title: string; data: AddressFields; setData: (d: AddressFields) => void;
    showSameAs?: boolean; sameAsOptions?: { label: string; value: string }[];
    sameAsValue?: string; onSameAsChange?: (v: string) => void; disabled?: boolean;
    showSalesTaxExempt?: boolean; salesTaxExemptValue?: boolean; onSalesTaxChange?: (v: boolean) => void;
    showSaveForFuture?: boolean; saveForFutureValue?: boolean; onSaveForFutureChange?: (v: boolean) => void;
}) => (
    <section className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-bold text-acron-yoke-500 mb-1">{title}</h2>

        {showSameAs && sameAsOptions && (
            <div className="flex items-center space-x-4 mb-4 mt-2">
                {sameAsOptions.map(opt => (
                    <label key={opt.value} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={sameAsValue === opt.value}
                            onChange={() => onSameAsChange?.(sameAsValue === opt.value ? 'none' : opt.value)}
                            className="rounded text-acron-pitch focus:ring-acron-pitch border-gray-300" />
                        <span className="text-sm text-gray-600">{opt.label}</span>
                    </label>
                ))}
            </div>
        )}

        <div className={`space-y-4 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Organization Name*</label>
                    <input type="text" required value={data.company} onChange={e => setData({ ...data, company: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Organization Name" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number*</label>
                    <input type="tel" required value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="(555) 123-4567" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email Address*</label>
                    <input type="email" required value={data.email} onChange={e => setData({ ...data, email: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Email Address" />
                </div>
            </div>

            <h3 className="text-sm font-semibold text-acron-yoke-500">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Address Line 1*</label>
                    <input type="text" required value={data.addressLine1} onChange={e => setData({ ...data, addressLine1: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Address Line 1" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Address Line 2</label>
                    <input type="text" value={data.addressLine2} onChange={e => setData({ ...data, addressLine2: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Address Line 2" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Country*</label>
                    <select required value={data.country} onChange={e => setData({ ...data, country: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch bg-white">
                        <option value="">Choose</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Zip Code*</label>
                    <input type="text" required value={data.zipCode} onChange={e => setData({ ...data, zipCode: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Zip Code" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">City*</label>
                    <input type="text" required value={data.city} onChange={e => setData({ ...data, city: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="City" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">State*</label>
                    <input type="text" required value={data.state} onChange={e => setData({ ...data, state: e.target.value })}
                        className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="State" />
                </div>
            </div>

            {showSalesTaxExempt && (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Sales Tax Exempt?</label>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name={`salesTax-${title}`} checked={salesTaxExemptValue === true} onChange={() => onSalesTaxChange?.(true)}
                                className="text-acron-pitch focus:ring-acron-pitch" />
                            <span className="text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name={`salesTax-${title}`} checked={salesTaxExemptValue === false} onChange={() => onSalesTaxChange?.(false)}
                                className="text-acron-pitch focus:ring-acron-pitch" />
                            <span className="text-sm text-gray-700">No</span>
                        </label>
                    </div>
                </div>
            )}

            {showSaveForFuture && (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Save for Future?</label>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="saveForFuture" checked={saveForFutureValue === true} onChange={() => onSaveForFutureChange?.(true)}
                                className="text-acron-pitch focus:ring-acron-pitch" />
                            <span className="text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="saveForFuture" checked={saveForFutureValue === false} onChange={() => onSaveForFutureChange?.(false)}
                                className="text-acron-pitch focus:ring-acron-pitch" />
                            <span className="text-sm text-gray-700">No</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    </section>
);

export default function OrgRegisterPage() {
    const [soldTo, setSoldTo] = useState<AddressFields>({ ...emptyAddress });
    const [soldToSalesTaxExempt, setSoldToSalesTaxExempt] = useState(false);
    const [billToSameAsSoldTo, setBillToSameAsSoldTo] = useState(false);
    const [billTo, setBillTo] = useState<AddressFields>({ ...emptyAddress });
    const [shipToSameAs, setShipToSameAs] = useState<'none' | 'soldTo' | 'billTo'>('none');
    const [shipTo, setShipTo] = useState<AddressFields>({ ...emptyAddress });
    const [shipToSaveForFuture, setShipToSaveForFuture] = useState(false);
    const [carrier, setCarrier] = useState('');
    const [carrierAccountNumber, setCarrierAccountNumber] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminPhone, setAdminPhone] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [adminTitle, setAdminTitle] = useState('');
    const [adminFax, setAdminFax] = useState('');
    const [adminCountry, setAdminCountry] = useState('United States');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const getEffectiveBillTo = () => billToSameAsSoldTo ? soldTo : billTo;
    const getEffectiveShipTo = () => {
        if (shipToSameAs === 'soldTo') return soldTo;
        if (shipToSameAs === 'billTo') return getEffectiveBillTo();
        return shipTo;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!agreedToTerms) {
            setError('Please agree to the Terms & Conditions and Privacy Policy');
            return;
        }

        setLoading(true);
        const effectiveBillTo = getEffectiveBillTo();
        const effectiveShipTo = getEffectiveShipTo();

        try {
            const res = await fetch(`${API_URL}/auth/register/org`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    soldToCompany: soldTo.company, soldToAddress: `${soldTo.addressLine1} ${soldTo.addressLine2}`.trim(),
                    soldToCity: soldTo.city, soldToState: soldTo.state, soldToPostalCode: soldTo.zipCode,
                    soldToCountry: soldTo.country, soldToPhone: soldTo.phone, soldToEmail: soldTo.email,
                    soldToSalesTaxExempt,
                    billToCompany: effectiveBillTo.company, billToAddress: `${effectiveBillTo.addressLine1} ${effectiveBillTo.addressLine2}`.trim(),
                    billToCity: effectiveBillTo.city, billToState: effectiveBillTo.state, billToPostalCode: effectiveBillTo.zipCode,
                    billToCountry: effectiveBillTo.country, billToPhone: effectiveBillTo.phone, billToEmail: effectiveBillTo.email,
                    shipToCompany: effectiveShipTo.company, shipToAddress: `${effectiveShipTo.addressLine1} ${effectiveShipTo.addressLine2}`.trim(),
                    shipToCity: effectiveShipTo.city, shipToState: effectiveShipTo.state, shipToPostalCode: effectiveShipTo.zipCode,
                    shipToCountry: effectiveShipTo.country, shipToPhone: effectiveShipTo.phone, shipToEmail: effectiveShipTo.email,
                    carrier, carrierAccountNumber,
                    authorityAdminName: adminName, authorityAdminPhone: adminPhone,
                    authorityAdminEmail: adminEmail, authorityAdminPosition: adminTitle, authorityAdminFax: adminFax
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
                    <h1 className="text-3xl font-bold">Register as Organization</h1>
                    <nav className="mt-2 text-sm text-gray-300"><Link href="/" className="hover:text-acron-pitch">Home</Link> &gt; Organization Register</nav>
                </div>
                <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm text-center">
                    <div className="w-20 h-20 bg-acron-pitch/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-acron-pitch" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-acron-yoke-500 mb-3">Request Submitted Successfully</h2>
                    <p className="text-gray-500 max-w-md mx-auto">Your organization registration request has been submitted for review. A business administrator will review your request and you will be notified via email once a decision is made.</p>
                    <Link href="/" className="inline-block mt-6 bg-acron-pitch text-acron-yoke-500 font-bold py-2.5 px-8 rounded-lg hover:bg-acron-pitch transition-all">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-acron-yoke-500 to-acron-yoke-400 text-white px-8 py-8 rounded-xl">
                <h1 className="text-3xl font-bold">Register as Organization</h1>
                <nav className="mt-2 text-sm text-gray-300">
                    <Link href="/" className="hover:text-acron-pitch">Home</Link> &gt; Organization Register
                </nav>
            </div>

            {/* Form */}
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-6">Welcome! To gain access to our customer portal, your organization must first complete a quick registration.</p>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Sold To */}
                    <AddressSection title="Sold To Information" data={soldTo} setData={setSoldTo}
                        showSalesTaxExempt salesTaxExemptValue={soldToSalesTaxExempt} onSalesTaxChange={setSoldToSalesTaxExempt} />

                    {/* Bill To */}
                    <AddressSection title="Bill To Information" data={billToSameAsSoldTo ? soldTo : billTo}
                        setData={setBillTo} disabled={billToSameAsSoldTo}
                        showSameAs sameAsOptions={[{ label: 'Same as Sold To', value: 'soldTo' }]}
                        sameAsValue={billToSameAsSoldTo ? 'soldTo' : 'none'}
                        onSameAsChange={(v) => setBillToSameAsSoldTo(v === 'soldTo')} />

                    {/* Ship To */}
                    <AddressSection title="Ship To Information"
                        data={shipToSameAs === 'soldTo' ? soldTo : shipToSameAs === 'billTo' ? getEffectiveBillTo() : shipTo}
                        setData={setShipTo} disabled={shipToSameAs !== 'none'}
                        showSameAs sameAsOptions={[{ label: 'Same as Sold To', value: 'soldTo' }, { label: 'Same as Bill To', value: 'billTo' }]}
                        sameAsValue={shipToSameAs} onSameAsChange={(v) => setShipToSameAs(v as 'none' | 'soldTo' | 'billTo')}
                        showSaveForFuture saveForFutureValue={shipToSaveForFuture} onSaveForFutureChange={setShipToSaveForFuture} />

                    {/* Carrier */}
                    <section className="border-t border-gray-200 pt-6">
                        <h2 className="text-lg font-bold text-acron-yoke-500 mb-4">Carrier Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Carrier</label>
                                <input type="text" value={carrier} onChange={e => setCarrier(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Carrier" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Account Number*</label>
                                <input type="text" value={carrierAccountNumber} onChange={e => setCarrierAccountNumber(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Account Number" />
                            </div>
                        </div>
                    </section>

                    {/* Contact Information */}
                    <section className="border-t border-gray-200 pt-6">
                        <h2 className="text-lg font-bold text-acron-yoke-500 mb-1">Contact Information</h2>
                        <h3 className="text-sm font-semibold text-gray-600 mb-4">Authority Admin Contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Name*</label>
                                <input type="text" required value={adminName} onChange={e => setAdminName(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Name" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number*</label>
                                <input type="tel" required value={adminPhone} onChange={e => setAdminPhone(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="(555) 123-4567" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Email Address*</label>
                                <input type="email" required value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Email Address" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                                <input type="text" value={adminTitle} onChange={e => setAdminTitle(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Title" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Fax</label>
                                <input type="text" value={adminFax} onChange={e => setAdminFax(e.target.value)}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch" placeholder="Fax" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Full Postal/order</label>
                            <select value={adminCountry} onChange={e => setAdminCountry(e.target.value)}
                                className="block w-full md:w-1/3 rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:border-acron-pitch focus:ring-acron-pitch bg-white">
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </section>

                    {/* Terms */}
                    <div className="border-t border-gray-200 pt-6">
                        <label className="flex items-start space-x-3 cursor-pointer">
                            <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                                className="mt-0.5 rounded text-acron-pitch focus:ring-acron-pitch border-gray-300" />
                            <span className="text-sm text-gray-600">
                                I have read and agree to the <a href="#" className="text-acron-pitch underline">Terms & Conditions</a> and <a href="#" className="text-acron-pitch underline">Privacy Policy</a>.
                            </span>
                        </label>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={loading}
                        className="w-full md:w-auto bg-acron-yoke-500 text-white font-bold py-3 px-12 rounded-lg hover:bg-acron-yoke-400 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm">
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            </div>
        </div>
    );
}
