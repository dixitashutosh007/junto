'use client';

import { apiFetch } from '@/lib/api-client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Clock,
  MapPin,
  ArrowLeft,
  XCircle,
  Phone,
  Home,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function MyRequestsPage() {
  const { activePersona } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/v1/rides/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [activePersona]);

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this ride request?')) return;
    try {
      const res = await apiFetch(`/api/v1/rides/requests?requestId=${requestId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessage('Seat request cancelled successfully.');
        loadRequests();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/"
          className="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-zinc-900">My Ride Requests</h1>
          <p className="text-xs text-zinc-500">Track and manage your requested commutes</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-400">Loading your requests...</div>
      ) : requests.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50">
          <Search className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
          <p className="text-xs font-semibold text-zinc-700">No active ride requests</p>
          <p className="text-[11px] text-zinc-500 mt-1 mb-4">
            Search for available co-resident rides and request a seat!
          </p>
          <Link
            href="/rides/find"
            className="inline-block px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold"
          >
            Find a Ride
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {requests.map((req) => {
            const isAccepted = req.status === 'ACCEPTED';
            const isCancelled = req.status === 'CANCELLED';
            const isPending = req.status === 'REQUESTED';

            return (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-xs text-zinc-900">
                      Offered by {req.offererName}
                    </h3>
                    <p className="text-[11px] text-zinc-500">{req.vehicleName}</p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isAccepted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCancelled
                        ? 'bg-zinc-100 text-zinc-500'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isAccepted ? 'Accepted' : isCancelled ? 'Cancelled' : 'Pending Review'}
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-50 rounded-xl text-xs text-zinc-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-zinc-900">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Dropoff: {req.dropoffName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Pickup: {req.pickupName}</span>
                  </div>
                </div>

                {/* Confirmed Details Revealed */}
                {isAccepted && (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                    <span className="font-semibold block text-emerald-900 mb-0.5">
                      Co-resident details revealed:
                    </span>
                    {req.offererFlat && (
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Flat: {req.offererFlat}</span>
                      </div>
                    )}
                    {req.offererMobile && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Mobile: <a href={`tel:${req.offererMobile}`} className="font-semibold underline">{req.offererMobile}</a></span>
                      </div>
                    )}
                    {req.vehiclePlate && (
                      <p className="text-[11px] text-zinc-700 font-mono mt-0.5">
                        License Plate: <strong>{req.vehiclePlate}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {!isCancelled && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      onClick={() => handleCancelRequest(req.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Request</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
