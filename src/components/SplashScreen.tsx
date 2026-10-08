'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Car,
  ShieldCheck,
  Users,
  Sparkles,
  ArrowRight,
  Phone,
  Building2,
  CheckCircle2,
  MapPin,
  Clock,
  Layers,
} from 'lucide-react';
import { PhoneOtpModal } from '@/components/PhoneOtpModal';
import Link from 'next/link';

interface SplashScreenProps {
  onSuccessLogin?: () => void;
}

export function SplashScreen({ onSuccessLogin }: SplashScreenProps) {
  const { society, switchPersona, refreshAuth } = useAuth();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'OFFERER' | 'SEEKER'>('OFFERER');

  return (
    <div className="flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white min-h-[90vh] px-6 py-8 relative overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-28 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <div className="relative z-10 flex flex-col items-center text-center pt-4">
        {/* Logo Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-xl shadow-emerald-950/60 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950/80 rounded-[14px] flex items-center justify-center backdrop-blur-xs">
            <Car className="w-8 h-8 text-emerald-400 stroke-[2.2]" />
          </div>
        </div>

        {/* Product Suite & App Name */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Junto Community Suite</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          Junto <span className="text-emerald-400">RideShare</span>
        </h1>

        <p className="text-sm text-slate-300 max-w-xs leading-relaxed font-normal">
          Peer-to-peer co-commute facilitation exclusively for verified residents of{' '}
          <span className="text-white font-semibold">{society?.name || 'Mahaveer Ranches'}</span>.
        </p>
      </div>

      {/* Center Value Props */}
      <div className="relative z-10 py-6 space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">100% Verified Co-Residents</h3>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              Only approved residents from your society clubhouse and gates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Smart Detour Matching</h3>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              Matched strictly along your commute corridor with ≤ 10 min detours.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Peer Facilitation (Zero Fares)</h3>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              Friendly shared rides to Manyata, Bellandur, Electronic City & Whitefield.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions: Login & Registration */}
      <div className="relative z-10 space-y-3 pt-2">
        {/* Primary Action: Phone / OTP Sign In */}
        <button
          onClick={() => setShowOtpModal(true)}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <Phone className="w-4 h-4 text-slate-950" />
          <span>Continue with Mobile (SMS OTP)</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>

        {/* Secondary Action: Join with Society Invite Code */}
        <Link
          href={`/join/${society?.code || 'MR2024'}`}
          className="w-full py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>New Resident? Register with Code ({society?.code || 'MR2024'})</span>
        </Link>
      </div>

      {/* Firebase Phone Auth OTP Modal */}
      <PhoneOtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onSuccess={() => {
          setShowOtpModal(false);
          localStorage.removeItem('societyapps_logged_out');
          if (onSuccessLogin) onSuccessLogin();
          else window.location.reload();
        }}
      />
    </div>
  );
}
