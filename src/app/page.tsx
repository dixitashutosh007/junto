'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Car,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  Sparkles,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { PublicJourneyView } from '@/types';
import { NotificationBell } from '@/components/NotificationBell';

export default function HomePage() {
  const { user, society, membership, activePersona } = useAuth();
  const [rides, setRides] = useState<PublicJourneyView[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestStatusMap, setRequestStatusMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load available rides
        const res = await fetch('/api/v1/rides', {
          headers: {
            'x-dev-user-id': activePersona,
            'x-society-id': 'soc-ggh-001',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setRides(data.rides || []);
        }

        // Load automated matches for user commute
        const matchRes = await fetch('/api/v1/rides/matches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-dev-user-id': activePersona,
            'x-society-id': 'soc-ggh-001',
          },
          body: JSON.stringify({
            dropoffName: 'Manyata Tech Park',
            dropoffLat: 13.05,
            dropoffLng: 77.62,
          }),
        });
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          setMatches(matchData.matches || []);
        }
      } catch (err) {
        console.error('Error fetching home data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activePersona]);

  const handleRequestRide = async (journeyId: string) => {
    try {
      const res = await fetch('/api/v1/rides/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-user-id': activePersona,
          'x-society-id': 'soc-ggh-001',
        },
        body: JSON.stringify({
          journeyId,
          requestedSeats: 1,
        }),
      });
      if (res.ok) {
        setRequestStatusMap((prev) => ({ ...prev, [journeyId]: 'REQUESTED' }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const firstName = user?.fullName.split(' ')[0] || 'Resident';

  return (
    <div className="flex-1 flex flex-col pb-8">
      {/* Header */}
      <header className="p-5 bg-gradient-to-b from-emerald-50 to-white border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-800 tracking-wide uppercase">
              {society?.name || 'Mahaveer Ranches'}
            </p>
            <h1 className="text-xl font-bold text-zinc-900 mt-0.5">
              Good morning, {firstName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-100/80 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Verified Resident</span>
            </div>
            <NotificationBell />
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Flat {membership?.flatNumber || 'B-804'} · {membership?.role === 'SOCIETY_ADMIN' ? 'Society Admin' : 'Resident Member'}
        </p>
      </header>

      {/* Main Core CTAs: Find a Ride & Offer a Ride */}
      <div className="p-5 pb-2 grid grid-cols-2 gap-3.5">
        <Link
          href="/rides/find"
          className="flex flex-col items-start p-4 rounded-2xl bg-zinc-900 text-white shadow-md active:scale-98 transition-transform"
        >
          <div className="p-2.5 rounded-xl bg-zinc-800 text-emerald-400 mb-3">
            <Search className="w-5 h-5" />
          </div>
          <span className="font-semibold text-base leading-tight">Find a Ride</span>
          <span className="text-zinc-400 text-xs mt-1">Join a co-resident commute</span>
        </Link>

        <Link
          href="/rides/offer"
          className="flex flex-col items-start p-4 rounded-2xl bg-emerald-600 text-white shadow-md active:scale-98 transition-transform"
        >
          <div className="p-2.5 rounded-xl bg-emerald-700 text-emerald-100 mb-3">
            <Car className="w-5 h-5" />
          </div>
          <span className="font-semibold text-base leading-tight">Offer a Ride</span>
          <span className="text-emerald-100 text-xs mt-1">Share seats travelling your way</span>
        </Link>
      </div>

      {/* Quick Navigation for Offerer & Seeker Activities */}
      <div className="px-5 mb-4 grid grid-cols-2 gap-2 text-xs">
        <Link
          href="/rides/my-rides"
          className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 font-semibold flex items-center justify-between hover:bg-zinc-100 transition-colors"
        >
          <span>My Offered Rides</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </Link>
        <Link
          href="/rides/my-requests"
          className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-800 font-semibold flex items-center justify-between hover:bg-zinc-100 transition-colors"
        >
          <span>My Ride Requests</span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </Link>
      </div>

      {/* Admin Quick Link if admin */}
      {membership?.role === 'SOCIETY_ADMIN' && (
        <div className="px-5 mb-4">
          <Link
            href="/admin"
            className="flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-950 text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Society Admin Portal (Approvals & Moderation)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600" />
          </Link>
        </div>
      )}

      {/* Matches For You */}
      {matches.length > 0 && (
        <section className="px-5 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Matches for Your Commute
              </h2>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {matches.length} active
            </span>
          </div>

          <div className="space-y-2.5">
            {matches.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-900 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    8:00 AM – 8:20 AM
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                    {item.match.qualityLabel} Match
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-medium text-zinc-800">{item.journey.destinationName}</span>
                  </div>
                  <span className="text-zinc-500">Detour: ~{item.match.detourMinutes} min</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-emerald-100 text-xs">
                  <span className="text-zinc-600 font-medium">Offered by {item.offererName}</span>
                  <span className="text-emerald-700 font-semibold">{item.journey.availableSeats} seats left</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Rides Feed */}
      <section className="px-5 flex-1">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Available Society Rides
          </h2>
          <span className="text-xs text-zinc-500">Today & Tomorrow</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">Loading society rides...</div>
        ) : rides.length === 0 ? (
          <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50">
            <Car className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
            <p className="text-xs font-semibold text-zinc-700">No rides scheduled for this window</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Be the first to offer a seat!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rides.map((ride) => {
              const reqState = requestStatusMap[ride.id] || ride.userRequestStatus;
              const isAccepted = reqState === 'ACCEPTED';
              const isRequested = reqState === 'REQUESTED';

              return (
                <div
                  key={ride.id}
                  className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs hover:border-zinc-300 transition-all flex flex-col gap-2.5"
                >
                  {/* Card Header: Driver & Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-zinc-900">
                          {ride.offerer.displayName}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          Verified Resident
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}
                        {ride.vehicle.registrationNumber && (
                          <span className="font-mono text-zinc-700 font-semibold ml-1">
                            ({ride.vehicle.registrationNumber})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {ride.availableSeats} of {ride.totalSeats} seats
                      </span>
                    </div>
                  </div>

                  {/* Route & Timing */}
                  <div className="bg-zinc-50 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-zinc-700">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="font-semibold text-zinc-800">
                          {new Date(ride.departureWindowStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {new Date(ride.departureWindowEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        {ride.journeyDate === new Date().toISOString().split('T')[0]
                          ? 'Today'
                          : ride.journeyDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-800 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{ride.destinationName}</span>
                    </div>
                  </div>

                  {/* Contact Revealed when accepted */}
                  {isAccepted && ride.offerer.mobile && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex flex-col gap-1">
                      <span className="font-semibold text-emerald-900">Commute Confirmed! Details revealed:</span>
                      <p>Flat: <span className="font-semibold">{ride.offerer.flatNumber}</span></p>
                      <p>Mobile: <a href={`tel:${ride.offerer.mobile}`} className="font-semibold underline">{ride.offerer.mobile}</a></p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">Departing from Society Gate</span>
                    {isAccepted ? (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Accepted
                      </span>
                    ) : isRequested ? (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        Request Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRequestRide(ride.id)}
                        className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 active:scale-95 transition-all"
                      >
                        Request Ride
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Safety & Feedback Quick Links */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-2 text-xs">
        <Link
          href="/feedback"
          className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-semibold text-[11px]">Leave Feedback</span>
        </Link>
        <Link
          href="/report"
          className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100/70 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          <span className="font-semibold text-[11px]">Report an Issue</span>
        </Link>
      </div>

      {/* Community Disclaimer Footer */}
      <footer className="mt-6 px-5 pt-4 border-t border-zinc-100 text-center">
        <div className="flex items-center justify-center gap-1.5 text-zinc-400 text-xs mb-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="font-semibold">Community Facilitation Service</span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
          SocietyApps connects verified co-residents travelling in compatible directions. We do not provide transportation or guarantee safety and punctuality. Residents independently verify vehicle and arrangements.
        </p>
      </footer>
    </div>
  );
}
