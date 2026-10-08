'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, CheckCircle2, Clock, MapPin, ArrowLeft, Check, X, Phone, Home } from 'lucide-react';
import Link from 'next/link';
import { RideRequest } from '@/types';

export default function RideRequestsManagePage() {
  const { activePersona } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      // Hardcoded journey for demo: jrn-001
      const res = await fetch('/api/v1/rides/requests?journeyId=jrn-001', {
        headers: {
          'x-dev-user-id': activePersona,
          'x-society-id': 'soc-ggh-001',
        },
      });
      // In demo fallback: display active pending or accepted request
      setRequests([
        {
          id: 'req-demo-001',
          seeker: {
            name: 'Priya Sharma',
            flatNumber: 'Tower C-302',
            mobile: '+919822233344',
          },
          pickupName: 'Society Gate 1',
          dropoffName: 'Nagavara / Manyata Gate',
          requestedSeats: 1,
          detourMinutes: 6,
          status: 'REQUESTED',
        },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [activePersona]);

  const handleAction = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const res = await fetch('/api/v1/rides/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-user-id': activePersona,
          'x-society-id': 'soc-ggh-001',
        },
        body: JSON.stringify({
          requestId,
          action,
        }),
      });
      if (res.ok) {
        setMessage(
          action === 'ACCEPT'
            ? 'Request accepted! Contact details and vehicle registration disclosed to both parties.'
            : 'Request declined.'
        );
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/"
          className="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-zinc-900">Seat Inquiries</h1>
          <p className="text-xs text-zinc-500">Manage requests for your offered rides</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
          {message}
        </div>
      )}

      <div className="flex-1 space-y-3">
        {requests.map((req) => {
          const isAccepted = req.status === 'ACCEPTED';
          return (
            <div
              key={req.id}
              className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-zinc-900">{req.seeker.name}</h3>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    Verified Co-Resident
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isAccepted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {isAccepted ? 'Accepted' : 'Pending Review'}
                </span>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl text-xs space-y-1.5 text-zinc-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pickup: {req.pickupName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Route Detour: ~{req.detourMinutes} minutes</span>
                </div>
              </div>

              {/* Revealed Contact Details Upon Acceptance */}
              {isAccepted ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                  <span className="font-semibold block text-emerald-900 mb-0.5">
                    Co-resident details revealed:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Flat: {req.seeker.flatNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Mobile: <a href={`tel:${req.seeker.mobile}`} className="font-semibold underline">{req.seeker.mobile}</a></span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => handleAction(req.id, 'REJECT')}
                    className="px-3.5 py-1.5 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-semibold hover:bg-zinc-50 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>
                  <button
                    onClick={() => handleAction(req.id, 'ACCEPT')}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept Request
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
