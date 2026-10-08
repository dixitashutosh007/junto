'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  User as UserIcon,
  Mail,
  Phone,
  Home,
  Car,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Save,
  ArrowLeft,
  Plus,
  ShieldCheck,
  Check,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Vehicle } from '@/types';

export default function ProfilePage() {
  const { user, membership, society, refreshAuth, activePersona } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [flatNumber, setFlatNumber] = useState(membership?.flatNumber || '');
  const [commuteIntent, setCommuteIntent] = useState<'OFFERER' | 'SEEKER'>(
    user?.commuteIntent === 'OFFERER' ? 'OFFERER' : 'SEEKER'
  );
  const [workLocation, setWorkLocation] = useState(user?.workLocationName || '');
  const [gender, setGender] = useState(user?.gender || 'PREFER_NOT_TO_SAY');

  // Vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehType, setNewVehType] = useState<'CAR' | 'TWO_WHEELER'>('CAR');
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newColor, setNewColor] = useState('White');
  const [newReg, setNewReg] = useState('');
  const [newCapacity, setNewCapacity] = useState(3);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setWorkLocation(user.workLocationName || '');
      setGender(user.gender || 'PREFER_NOT_TO_SAY');
      if (user.commuteIntent === 'OFFERER' || user.commuteIntent === 'SEEKER') {
        setCommuteIntent(user.commuteIntent);
      }
    }
    if (membership) {
      setFlatNumber(membership.flatNumber || '');
    }
  }, [user, membership]);

  // Load vehicles
  const loadVehicles = async () => {
    try {
      const res = await fetch('/api/v1/user/vehicles', {
        headers: {
          'x-dev-user-id': activePersona,
          'x-society-id': 'soc-ggh-001',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      }
    } catch (e) {
      console.error('Error fetching vehicles', e);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [activePersona]);

  // Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Requirement 3: A user cannot be an Offerer till they have given vehicle details
    if (commuteIntent === 'OFFERER' && vehicles.length === 0 && !newReg) {
      setStatusMessage({
        type: 'error',
        text: 'You cannot set your role as Ride Offerer without registering a vehicle (2-wheeler or 4-wheeler).',
      });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/v1/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-user-id': activePersona,
          'x-society-id': 'soc-ggh-001',
        },
        body: JSON.stringify({
          fullName,
          email,
          flatNumber,
          commuteIntent,
          workLocationName: workLocation,
          gender,
        }),
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
        await refreshAuth();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  // Add vehicle
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMake || !newModel || !newReg) return;

    try {
      const res = await fetch('/api/v1/user/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-user-id': activePersona,
          'x-society-id': 'soc-ggh-001',
        },
        body: JSON.stringify({
          type: newVehType,
          make: newMake,
          model: newModel,
          color: newColor,
          registrationNumber: newReg.toUpperCase(),
          capacity: newVehType === 'TWO_WHEELER' ? 1 : Number(newCapacity),
        }),
      });

      if (res.ok) {
        setShowAddVehicle(false);
        setNewMake('');
        setNewModel('');
        setNewReg('');
        await loadVehicles();
        setStatusMessage({ type: 'success', text: 'Vehicle registered successfully!' });
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add vehicle');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving vehicle' });
    }
  };

  const isApproved = membership?.status === 'ACTIVE';

  return (
    <div className="flex-1 flex flex-col p-5 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/"
          className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Resident Profile</h1>
          <p className="text-xs text-slate-500 font-medium">{society?.name || 'Mahaveer Ranches'}</p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span className="font-semibold">{statusMessage.text}</span>
        </div>
      )}

      {/* Verification Status Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isApproved ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-slate-900">
                {isApproved ? 'Approved Resident' : 'Pending Admin Verification'}
              </span>
              {isApproved ? (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                  <Clock className="w-2.5 h-2.5 stroke-[3]" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isApproved
                ? 'Your flat and mobile identity are active on this society roster.'
                : 'Society admin will review and approve your application.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-4">
        {/* Profile Card */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Identity & Contact
          </h2>

          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
              <span>Full Name</span>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                Verified against Roster
              </span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
              <span>Mobile Number</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                Phone Auth Verified
              </span>
            </label>
            <input
              type="text"
              disabled
              value={user?.mobile || '+91 98111 22233'}
              className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
              <span>Email Address</span>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                Verification Required
              </span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
              <span>Flat Number</span>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                Admin Verified
              </span>
            </label>
            <input
              type="text"
              required
              value={flatNumber}
              onChange={(e) => setFlatNumber(e.target.value)}
              placeholder="e.g. Tower B - 804"
              className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 outline-none"
            />
          </div>
        </div>

        {/* Commute Role Section */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Commute Preference
            </h2>
            <span className="text-[10px] text-slate-400">Sets your default view</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setCommuteIntent('SEEKER')}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                commuteIntent === 'SEEKER'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Ride Seeker</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (vehicles.length === 0) {
                  setStatusMessage({
                    type: 'error',
                    text: 'Please add a vehicle below before selecting Ride Offerer.',
                  });
                }
                setCommuteIntent('OFFERER');
              }}
              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                commuteIntent === 'OFFERER'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Ride Offerer</span>
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Destination / Primary Tech Park
            </label>
            <input
              type="text"
              value={workLocation}
              onChange={(e) => setWorkLocation(e.target.value)}
              placeholder="e.g. Manyata Tech Park, Hebbal"
              className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-emerald-600 outline-none"
            />
          </div>
        </div>

        {/* Vehicles Section (Mandatory if Offerer) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Registered Vehicles
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Required for Ride Offerers (2-Wheelers & 4-Wheelers supported)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddVehicle(!showAddVehicle)}
              className="py-1 px-2.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vehicle</span>
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
              <Car className="w-6 h-6 text-slate-300 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-700">No vehicles added</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Add your car or bike to offer rides to fellow residents.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {vehicles.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      {v.type === 'TWO_WHEELER' ? '🛵' : '🚗'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {v.color} {v.make} {v.model}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-slate-500">
                        {v.registrationNumber} · {v.capacity} seats
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Add Vehicle Inline Form */}
          {showAddVehicle && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">New Vehicle Details</span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                  Requires Admin Verification
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setNewVehType('CAR');
                    setNewCapacity(3);
                  }}
                  className={`py-2 px-2 rounded-lg border text-center cursor-pointer transition-all ${
                    newVehType === 'CAR'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-emerald-200'
                  }`}
                >
                  🚗 Car / 4-Wheeler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewVehType('TWO_WHEELER');
                    setNewCapacity(1);
                  }}
                  className={`py-2 px-2 rounded-lg border text-center cursor-pointer transition-all ${
                    newVehType === 'TWO_WHEELER'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-slate-700 border-emerald-200'
                  }`}
                >
                  🛵 2-Wheeler / Bike
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Make (e.g. Hyundai)"
                  value={newMake}
                  onChange={(e) => setNewMake(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none"
                />
                <input
                  type="text"
                  placeholder="Model (e.g. Creta)"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Registration (KA-04-MB-1234)"
                  value={newReg}
                  onChange={(e) => setNewReg(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold uppercase outline-none"
                />
                <input
                  type="text"
                  placeholder="Color (e.g. White)"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddVehicle(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddVehicle}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-2xs"
                >
                  Save Vehicle
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit Save */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/20 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
