'use client';

import { apiFetch } from '@/lib/api-client';
import { formatIstTime, istDateString, istDateTime, istTimeHHMM } from '@/lib/utils/time';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Car,
  Clock,
  MapPin,
  ArrowLeft,
  Trash2,
  Edit2,
  Users,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Save,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function MyRidesPage() {
  const { activePersona } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRideId, setEditingRideId] = useState<string | null>(null);

  // Edit fields
  const [editDest, setEditDest] = useState('');
  const [editSeats, setEditSeats] = useState(2);
  const [editStart, setEditStart] = useState('08:00');
  const [editEnd, setEditEnd] = useState('08:20');

  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadMyRides = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/v1/rides?mine=true');
      if (res.ok) {
        const data = await res.json();
        setRides(data.rides || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyRides();
  }, [activePersona]);

  const startEdit = (ride: any) => {
    setEditingRideId(ride.id);
    setEditDest(ride.destinationName);
    setEditSeats(ride.totalSeats);
    setEditStart(istTimeHHMM(ride.departureWindowStart));
    setEditEnd(istTimeHHMM(ride.departureWindowEnd));
  };

  const handleSaveEdit = async (rideId: string, journeyDate: string) => {
    setIsSaving(true);
    try {
      const res = await apiFetch('/api/v1/rides', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          journeyId: rideId,
          destinationName: editDest,
          totalSeats: editSeats,
          departureWindowStart: istDateTime(journeyDate, editStart),
          departureWindowEnd: istDateTime(journeyDate, editEnd),
        }),
      });

      if (res.ok) {
        setMessage('Ride updated successfully!');
        setEditingRideId(null);
        loadMyRides();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || 'Could not update this ride.');
      }
      setTimeout(() => setMessage(''), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (journeyId: string) => {
    if (!confirm('Cancel this ride? Residents who requested or booked seats will be notified.')) return;
    try {
      const res = await apiFetch(`/api/v1/rides?journeyId=${journeyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessage('Ride cancelled. Passengers have been notified.');
        loadMyRides();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(data.error || 'Could not cancel this ride.');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">My Offered Rides</h1>
            <p className="text-xs text-zinc-500">Manage and edit your scheduled carpools</p>
          </div>
        </div>

        <Link
          href="/rides/offer"
          className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 text-xs font-semibold shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Offer New</span>
        </Link>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
          {message}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-400">Loading your rides...</div>
      ) : rides.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50">
          <Car className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
          <p className="text-xs font-semibold text-zinc-700">You haven't offered any rides yet</p>
          <p className="text-[11px] text-zinc-500 mt-1 mb-4">
            Share available seats in your car with co-residents!
          </p>
          <Link
            href="/rides/offer"
            className="inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
          >
            Offer a Ride Now
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {rides.map((ride) => {
            const isEditing = editingRideId === ride.id;
            const isToday = ride.journeyDate === istDateString();

            return (
              <div
                key={ride.id}
                className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {formatIstTime(ride.departureWindowStart)}
                      {' – '}
                      {formatIstTime(ride.departureWindowEnd)}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {isToday ? 'Today' : ride.journeyDate}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ride.status === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-700'
                        : ride.status === 'FULL'
                        ? 'bg-zinc-100 text-zinc-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {ride.status}
                  </span>
                </div>

                {isEditing ? (
                  /* INLINE EDIT FORM */
                  <div className="space-y-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                    <div>
                      <label className="font-semibold text-zinc-700 block mb-1">Destination</label>
                      <input
                        type="text"
                        value={editDest}
                        onChange={(e) => setEditDest(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-zinc-700 block mb-1">Seats</label>
                        <select
                          value={editSeats}
                          onChange={(e) => setEditSeats(Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-lg border border-zinc-200 bg-white"
                        >
                          <option value={1}>1 seat</option>
                          <option value={2}>2 seats</option>
                          <option value={3}>3 seats</option>
                          <option value={4}>4 seats</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-zinc-700 block mb-1">Time Window</label>
                        <div className="flex gap-1 items-center">
                          <input
                            type="time"
                            value={editStart}
                            onChange={(e) => setEditStart(e.target.value)}
                            className="w-full text-[11px] p-1.5 rounded-lg border border-zinc-200 bg-white"
                          />
                          <span className="text-zinc-400">-</span>
                          <input
                            type="time"
                            value={editEnd}
                            onChange={(e) => setEditEnd(e.target.value)}
                            className="w-full text-[11px] p-1.5 rounded-lg border border-zinc-200 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingRideId(null)}
                        className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 font-semibold text-xs flex items-center gap-1 hover:bg-zinc-100"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(ride.id, ride.journeyDate)}
                        disabled={isSaving}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1 hover:bg-emerald-700 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-zinc-700">
                      <div className="flex items-center gap-1.5 font-medium text-zinc-900 truncate">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{ride.destinationName}</span>
                      </div>
                      <span className="text-zinc-500 font-medium shrink-0 ml-2">
                        {ride.availableSeats} of {ride.totalSeats} seats free
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                      <Link
                        href="/rides/requests"
                        className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Passenger Inquiries</span>
                      </Link>

                      {ride.status !== 'CANCELLED' && ride.status !== 'COMPLETED' && ride.status !== 'EXPIRED' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(ride)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                            title="Edit Ride"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ride.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Cancel Ride"
                            aria-label="Cancel ride"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
