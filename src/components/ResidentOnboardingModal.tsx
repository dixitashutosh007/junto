'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Home,
  Car,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Send,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { PlacesAutocompleteInput } from '@/components/PlacesAutocompleteInput';

interface OnboardingModalProps {
  isOpen: boolean;
  onCompleted: () => void;
}

export function ResidentOnboardingModal({ isOpen, onCompleted }: OnboardingModalProps) {
  const { user, society, refreshAuth } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email?.includes('@societyapps.org') ? '' : (user?.email || ''));
  const [flatNumber, setFlatNumber] = useState('');
  const [commuteRole, setCommuteRole] = useState<'SEEKER' | 'OFFERER'>('SEEKER');
  const [workLocation, setWorkLocation] = useState(user?.workLocationName || 'Manyata Tech Park');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'>('PREFER_NOT_TO_SAY');

  // Vehicle Details (Mandatory if Offerer)
  const [vehicleType, setVehicleType] = useState<'CAR' | 'TWO_WHEELER'>('CAR');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('White');
  const [regNumber, setRegNumber] = useState('');
  const [capacity, setCapacity] = useState(4);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName.trim() || fullName.length < 3) {
      setError('Please provide your full legal name as registered with the society.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid work or personal email required for verification.');
      return;
    }
    if (!flatNumber.trim()) {
      setError('Flat / Apartment number is required for society verification.');
      return;
    }
    if (!agreedToRules) {
      setError('You must review and agree to the society rules and legal peer-matchmaking terms.');
      return;
    }

    // Offerer vehicle validation (Requirement 3: A user cannot be an Offerer till they have given vehicle details)
    if (commuteRole === 'OFFERER') {
      if (!make.trim() || !model.trim() || !regNumber.trim()) {
        setError('To register as a Ride Offerer, vehicle Make, Model, and Registration number are required.');
        return;
      }
    }

    try {
      setSubmitting(true);

      // 1. If Offerer, register vehicle first
      if (commuteRole === 'OFFERER') {
        const vehRes = await fetch('/api/v1/user/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: vehicleType,
            make: make.trim(),
            model: model.trim(),
            color: color.trim(),
            registrationNumber: regNumber.trim().toUpperCase(),
            capacity: vehicleType === 'TWO_WHEELER' ? 1 : Number(capacity),
          }),
        });
        if (!vehRes.ok) {
          const errData = await vehRes.json();
          throw new Error(errData.error || 'Failed to save vehicle details');
        }
      }

      // 2. Save profile updates and mark profile completed
      const profileRes = await fetch('/api/v1/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          flatNumber: flatNumber.trim().toUpperCase(),
          commuteIntent: commuteRole,
          workLocationName: workLocation,
          gender,
          profileCompleted: true,
        }),
      });

      if (!profileRes.ok) {
        const pErr = await profileRes.json();
        throw new Error(pErr.error || 'Failed to submit profile application');
      }

      setSuccess(true);
      await refreshAuth();
      setTimeout(() => {
        onCompleted();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error submitting application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-400">
              {society?.name || 'Mahaveer Ranches'} Resident Verification
            </span>
          </div>
          <h2 className="text-lg font-extrabold text-white">Complete Your Resident Profile</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Society admins verify your flat & identity to maintain a safe co-resident community.
          </p>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center my-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-sm animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Application Submitted!</h3>
            <p className="text-xs text-slate-600 max-w-xs mt-2 leading-relaxed">
              Your details and vehicle have been submitted to the <span className="font-semibold">{society?.name} Management Committee</span> for verification.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Full Name & Mobile */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                  <span>Full Legal Name</span>
                  <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Requires Admin Match</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ashutosh Dixit"
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 bg-white outline-none"
                />
              </div>

              {/* Email with Verification Tag */}
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                  <span>Work / Personal Email</span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">Verification Required</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 bg-white outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>

              {/* Flat Number */}
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                  <span>Flat / Apartment Details</span>
                  <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">Verified against Resident Roster</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    placeholder={society?.settings?.flat_format_example ? `Format: ${society.settings.flat_format_example}` : 'e.g. Tower B - 804'}
                    className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 bg-white outline-none"
                  />
                  <Home className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>
                {society?.settings?.flat_format_example && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Society format requirement: <span className="font-semibold text-slate-700">{society.settings.flat_format_example}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Primary Commute Role: Seeker or Offerer (No "Both" tab) */}
            <div className="pt-1">
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Primary Commute Role
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCommuteRole('SEEKER')}
                  className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    commuteRole === 'SEEKER'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Ride Seeker</span>
                  <span className={`text-[10px] font-normal ${commuteRole === 'SEEKER' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Find seats to work
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCommuteRole('OFFERER')}
                  className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    commuteRole === 'OFFERER'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Ride Offerer</span>
                  <span className={`text-[10px] font-normal ${commuteRole === 'OFFERER' ? 'text-emerald-100' : 'text-slate-500'}`}>
                    Share car / 2-wheeler
                  </span>
                </button>
              </div>
            </div>

            {/* Conditional Vehicle Section if Offerer (Requirement 3: Mandatory for Offerer, 2-wheeler & 4-wheeler support) */}
            {commuteRole === 'OFFERER' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-950">Vehicle Information (Mandatory)</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                    Required for Offerer
                  </span>
                </div>

                {/* 2-Wheeler vs 4-Wheeler */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleType('CAR');
                      setCapacity(3);
                    }}
                    className={`py-2 px-2 rounded-lg border text-center cursor-pointer transition-all ${
                      vehicleType === 'CAR'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-emerald-200'
                    }`}
                  >
                    🚗 Car / 4-Wheeler
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVehicleType('TWO_WHEELER');
                      setCapacity(1);
                    }}
                    className={`py-2 px-2 rounded-lg border text-center cursor-pointer transition-all ${
                      vehicleType === 'TWO_WHEELER'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-emerald-200'
                    }`}
                  >
                    🛵 2-Wheeler / Bike
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">Make (Brand)</span>
                    <input
                      type="text"
                      required={commuteRole === 'OFFERER'}
                      value={make}
                      onChange={(e) => setMake(e.target.value)}
                      placeholder="e.g. Hyundai / Honda"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">Model</span>
                    <input
                      type="text"
                      required={commuteRole === 'OFFERER'}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Creta / Activa"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">Registration Plate</span>
                    <input
                      type="text"
                      required={commuteRole === 'OFFERER'}
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="KA-04-MB-1234"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold uppercase outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">Seats Available</span>
                    <select
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none"
                    >
                      {vehicleType === 'TWO_WHEELER' ? (
                        <option value={1}>1 Pillion Seat</option>
                      ) : (
                        <>
                          <option value={1}>1 Seat</option>
                          <option value={2}>2 Seats</option>
                          <option value={3}>3 Seats</option>
                          <option value={4}>4 Seats</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Work Hub Location */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Typical Work Location / Hub
              </label>
              <input
                type="text"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="e.g. Manyata Tech Park / Bellandur"
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 bg-white outline-none"
              />
            </div>

            {/* Society Rules & Legal Matchmaking Disclaimer */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="text-xs font-bold text-slate-900">
                  {society?.name || 'Society'} Rules & Legal Agreement
                </h4>
              </div>

              {society?.settings?.community_rules ? (
                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 max-h-24 overflow-y-auto leading-relaxed">
                  <span className="font-semibold text-slate-800 block mb-0.5">Community Guidelines:</span>
                  {society.settings.community_rules}
                </div>
              ) : (
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200">
                  Be punctual, respectful to fellow residents, maintain safety protocols, and coordinate cancellations promptly.
                </div>
              )}

              <div className="text-[10px] text-slate-500 leading-normal p-2 bg-amber-50/60 rounded-xl border border-amber-200/60">
                <strong className="text-slate-800">Legal Disclaimer:</strong> Junto is strictly a peer-to-peer matchmaking directory for verified residents. Junto and the Society Management Committee do not provide transportation, do not employ drivers, do not charge commercial fares, and assume no liability for travel incidents, disputes, delays, or damages. Commuters ride entirely at their own mutual discretion.
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  I have read and agree to the society carpool rules and acknowledge that Junto is strictly a non-commercial match facilitation platform.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Verification to Society Admin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
