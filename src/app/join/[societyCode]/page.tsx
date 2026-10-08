'use client';

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Building } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function JoinSocietyPage({ params }: { params: Promise<{ societyCode: string }> }) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [gender, setGender] = useState('MALE');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToRules) {
      setError('Please review and accept the community carpool rules and legal terms.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          societyCode: 'GGH2024',
          fullName,
          email,
          mobile,
          flatNumber,
          gender,
          workLocationName: workLocation,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (e) {
      console.error(e);
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/"
          className="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-zinc-900">Join Green Glen Heights</h1>
          <p className="text-xs text-zinc-500">Official Society Invitation</p>
        </div>
      </div>

      {submitted ? (
        <div className="my-auto text-center py-12 px-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Registration Submitted!</h2>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Your registration is currently under review by your Society Admins. Once approved, you will have full access to Ride Share.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold"
          >
            Return to Home
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3.5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Iyer"
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Flat / Unit Number</label>
              <input
                type="text"
                required
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                placeholder="e.g. Tower A-503"
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Mobile Number</label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="resident@example.com"
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Primary Work Location</label>
            <input
              type="text"
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="e.g. Manyata Tech Park, Hebbal"
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white"
            />
          </div>

          {/* Society Rules & Legal Disclaimer */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-zinc-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Society Guidelines & Platform Disclaimer</span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed bg-white p-2.5 rounded-xl border border-zinc-200">
              Residents commit to mutual punctuality, respect, civil conduct, and safety during all shared commutes.
            </p>
            <div className="text-[10px] text-zinc-500 leading-normal p-2 bg-amber-50/70 rounded-xl border border-amber-200">
              <strong className="text-zinc-800">Legal Notice:</strong> Junto is an independent residential peer matchmaking facilitation tool. Junto and the Society Management Committee do not provide transportation or taxi services, employ no drivers, and possess zero liability or obligation for any rides, vehicle conditions, delays, or road incidents.
            </div>
            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-zinc-800">
                I agree to the society carpool rules and acknowledge Junto&apos;s non-liability peer facilitation status.
              </span>
            </label>
          </div>

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold text-xs active:scale-98 transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Submit Society Registration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
