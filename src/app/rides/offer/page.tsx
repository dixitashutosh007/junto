'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Car, Clock, MapPin, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Vehicle } from '@/types';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';

export default function OfferRidePage() {
  const { user, activePersona } = useAuth();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');
  const [next7Days, setNext7Days] = useState<{ dateStr: string; label: string; weekday: string }[]>([]);
  const [destinationName, setDestinationName] = useState('Manyata Tech Park, Hebbal');
  const [timeWindowStart, setTimeWindowStart] = useState('08:00');
  const [timeWindowEnd, setTimeWindowEnd] = useState('08:20');
  const [seats, setSeats] = useState(2);
  const [genderPref, setGenderPref] = useState('ANY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setMinDate(todayStr);

    const maxD = new Date();
    maxD.setDate(maxD.getDate() + 7);
    setMaxDate(maxD.toISOString().split('T')[0]);

    // Build next 7 days list
    const daysList = [];
    for (let i = 0; i <= 7; i++) {
      const day = new Date();
      day.setDate(today.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      const weekday = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : day.toLocaleDateString([], { weekday: 'short' });
      const label = day.toLocaleDateString([], { month: 'short', day: 'numeric' });
      daysList.push({ dateStr, label, weekday });
    }
    setNext7Days(daysList);

    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    setJourneyDate(tomorrow.toISOString().split('T')[0]);

    async function loadVehicles() {
      const res = await fetch('/api/v1/user/vehicles', {
        headers: {
          'x-dev-user-id': activePersona,
          'x-society-id': 'soc-ggh-001',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
        if (data.vehicles?.length > 0) {
          setSelectedVehicleId(data.vehicles[0].id);
        }
      }
    }
    loadVehicles();
  }, [activePersona]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) return;

    setIsSubmitting(true);
    const dateStr = journeyDate || new Date().toISOString().split('T')[0];

    try {
      const res = await fetch('/api/v1/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-user-id': activePersona,
          'x-society-id': 'soc-ggh-001',
        },
        body: JSON.stringify({
          vehicleId: selectedVehicleId,
          journeyDate: dateStr,
          destinationName,
          departureWindowStart: `${dateStr}T${timeWindowStart}:00.000Z`,
          departureWindowEnd: `${dateStr}T${timeWindowEnd}:00.000Z`,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/');
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-zinc-900">Offer a Ride</h1>
          <p className="text-xs text-zinc-500">Share your commute with co-residents</p>
        </div>
      </div>

      {success ? (
        <div className="my-auto text-center py-12 px-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Ride Offered!</h2>
          <p className="text-xs text-zinc-500 mb-6">
            Fellow residents with compatible commutes will be able to discover and request your available seats.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
          {/* Origin */}
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
              Origin (Starting Point)
            </label>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-800">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Mahaveer Ranches (Main Clubhouse Gate)</span>
            </div>
          </div>

          {/* Date Selection (Next 7 Days) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700">Select Date (Next 7 Days)</label>
              <span className="text-[10px] text-zinc-400">Up to 7 days ahead</span>
            </div>

            {/* Quick 7-Day Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {next7Days.map((d) => {
                const isSelected = journeyDate === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setJourneyDate(d.dateStr)}
                    className={`flex flex-col items-center justify-center min-w-[70px] px-2.5 py-2 rounded-xl border text-center transition-all shrink-0 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-600/30'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase">{d.weekday}</span>
                    <span className="text-xs font-bold mt-0.5">{d.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <input
                type="date"
                required
                value={journeyDate}
                min={minDate}
                max={maxDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Destination */}
          <PlacesAutocompleteInput
            value={destinationName}
            onChange={(val) => setDestinationName(val)}
            placeholder="Search Tech Park, IT corridor, or hub..."
            label="Destination (Workplace / Hub)"
            required
          />

          {/* Departure Time Window */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Departure Window</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-zinc-400 block mb-0.5">Earliest</span>
                <input
                  type="time"
                  value={timeWindowStart}
                  onChange={(e) => setTimeWindowStart(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block mb-0.5">Latest</span>
                <input
                  type="time"
                  value={timeWindowEnd}
                  onChange={(e) => setTimeWindowEnd(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Seats & Vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Available Seats</label>
              <select
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value={1}>1 seat</option>
                <option value={2}>2 seats (Recommended)</option>
                <option value={3}>3 seats</option>
                <option value={4}>4 seats</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Gender Preference</label>
              <select
                value={genderPref}
                onChange={(e) => setGenderPref(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ANY">Any</option>
                <option value="FEMALE_ONLY">Female Only</option>
                <option value="MALE_ONLY">Male Only</option>
              </select>
            </div>
          </div>

          {/* Vehicle Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Vehicle</label>
            {vehicles.length > 0 ? (
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.color} {v.make} {v.model} ({v.registrationNumber})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
                No vehicles registered. Register your car first.
              </div>
            )}
            <p className="text-[10px] text-zinc-400">
              Registration number is masked until you accept a ride request.
            </p>
          </div>

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !selectedVehicleId}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold text-xs active:scale-98 transition-all hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-600/20"
            >
              {isSubmitting ? 'Publishing Ride...' : 'Publish Ride Offer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
