'use client';

import { apiFetch } from '@/lib/api-client';
import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ReportPage() {
  const { activePersona } = useAuth();
  const router = useRouter();

  const [category, setCategory] = useState('INAPPROPRIATE_BEHAVIOUR');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/moderation/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportedUserId: 'usr-offerer-001',
          category,
          description,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => router.push('/'), 1200);
      }
    } catch (e) {
      console.error(e);
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
          <h1 className="text-lg font-bold text-zinc-900">Report an Issue</h1>
          <p className="text-xs text-zinc-500">Confidential safety and conduct reporting</p>
        </div>
      </div>

      {submitted ? (
        <div className="my-auto text-center py-12 px-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Report Received</h2>
          <p className="text-xs text-zinc-500">
            Society administrators have received your report and will review it confidentially.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white"
            >
              <option value="INAPPROPRIATE_BEHAVIOUR">Inappropriate Behaviour</option>
              <option value="MISREPRESENTATION">Misrepresentation</option>
              <option value="REPEATED_CANCELLATION">Repeated Cancellation</option>
              <option value="NO_SHOW">No-Show</option>
              <option value="SAFETY_CONCERN">Safety Concern</option>
              <option value="HARASSMENT">Harassment</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Description of the Incident
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details of what occurred..."
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:outline-hidden"
            />
          </div>

          <div className="mt-auto pt-4">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-rose-600 text-white font-semibold text-xs active:scale-98 transition-all hover:bg-rose-700"
            >
              Submit Confidential Report
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
