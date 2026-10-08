'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  ChevronDown,
  User,
  Shield,
  ShieldCheck,
  Car,
  Search,
  Grid,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';

export function TopBarNav() {
  const {
    society,
    societiesList,
    activeSocietyId,
    switchSociety,
    activePersona,
    switchPersona,
    membership,
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  const [societyMenuOpen, setSocietyMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [appsDrawerOpen, setAppsDrawerOpen] = useState(false);

  const societyRef = useRef<HTMLDivElement>(null);
  const personaRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (societyRef.current && !societyRef.current.contains(event.target as Node)) {
        setSocietyMenuOpen(false);
      }
      if (personaRef.current && !personaRef.current.contains(event.target as Node)) {
        setPersonaMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available personas based on user access
  const availablePersonas = [
    {
      id: 'usr-offerer-001',
      label: 'Ride Offerer',
      icon: Car,
      color: 'text-emerald-700 bg-emerald-50',
      description: 'Offer seats in your vehicle',
    },
    {
      id: 'usr-seeker-001',
      label: 'Ride Seeker',
      icon: Search,
      color: 'text-blue-700 bg-blue-50',
      description: 'Find rides to work',
    },
    {
      id: 'usr-admin-001',
      label: 'Society Admin',
      icon: ShieldCheck,
      color: 'text-amber-700 bg-amber-50',
      description: 'Moderate residents & rules',
    },
    {
      id: 'usr-app-admin-001',
      label: 'App Admin',
      icon: Shield,
      color: 'text-purple-700 bg-purple-50',
      description: 'Platform super admin',
    },
  ];

  // Active persona descriptor
  const currentPersona =
    availablePersonas.find((p) => p.id === activePersona) || availablePersonas[0];
  const CurrentIcon = currentPersona.icon;

  // SocietyApps Product Suite
  const societyAppsSuite = [
    {
      name: 'Ride Share',
      icon: '🚗',
      description: 'Peer-to-peer co-resident carpooling',
      active: true,
      href: '/',
    },
    {
      name: 'Announcements',
      icon: '📢',
      description: 'Official MC & society circulars',
      active: false,
    },
    {
      name: 'Local Services',
      icon: '🛠️',
      description: 'Verified maids, cooks, plumbers',
      active: false,
    },
    {
      name: 'Buy, Sell & Rent',
      icon: '🏷️',
      description: 'Society resident marketplace',
      active: false,
    },
    {
      name: 'Lessons & Skills',
      icon: '📚',
      description: 'Music, fitness, tuition in society',
      active: false,
    },
    {
      name: 'Clubhouse & Amenities',
      icon: '🏸',
      description: 'Badminton, party hall bookings',
      active: false,
    },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Top Navbar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 px-3.5 py-2.5 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* Top Left: Society Switcher */}
          <div className="relative" ref={societyRef}>
            <button
              onClick={() => {
                setSocietyMenuOpen(!societyMenuOpen);
                setPersonaMenuOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 text-slate-900 transition-all text-left shadow-2xs active:scale-98 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                  Society
                </span>
                <span className="text-xs font-bold truncate max-w-[110px] leading-tight mt-0.5 text-slate-800">
                  {society?.name || 'Mahaveer Ranches'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
            </button>

            {/* Society Dropdown Menu */}
            {societyMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-zinc-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Select Residential Society
                </div>
                <div className="space-y-1">
                  {societiesList.map((soc) => {
                    const isSelected = soc.id === activeSocietyId;
                    return (
                      <button
                        key={soc.id}
                        onClick={() => {
                          switchSociety(soc.id);
                          setSocietyMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 font-semibold'
                            : 'hover:bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold">{soc.name}</p>
                          <p className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                            {soc.address}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Center-Right: Products Suite Drawer Trigger */}
          <button
            onClick={() => setAppsDrawerOpen(true)}
            className="p-2 rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex items-center gap-1.5 shadow-2xs active:scale-98 cursor-pointer"
            title="Junto Suite"
          >
            <Grid className="w-4 h-4 text-emerald-700" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider hidden sm:inline">Junto</span>
          </button>

          {/* Top Right: Persona Switcher */}
          <div className="relative" ref={personaRef}>
            <button
              onClick={() => {
                setPersonaMenuOpen(!personaMenuOpen);
                setSocietyMenuOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 text-slate-900 transition-all shadow-2xs active:scale-98 cursor-pointer"
            >
              <div className={`p-1 rounded-lg ${currentPersona.color} shadow-2xs`}>
                <CurrentIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                  Role
                </span>
                <span className="text-xs font-bold leading-tight mt-0.5 text-slate-800">
                  {currentPersona.label}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
            </button>

            {/* Persona Dropdown Menu */}
            {personaMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-zinc-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Switch Active Role
                </div>
                <div className="space-y-1">
                  {availablePersonas.map((p) => {
                    const isSelected = p.id === activePersona;
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          switchPersona(p.id);
                          setPersonaMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-zinc-900 text-white font-semibold'
                            : 'hover:bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isSelected ? 'bg-zinc-800 text-white' : p.color
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="font-bold">{p.label}</p>
                            <p
                              className={`text-[10px] ${
                                isSelected ? 'text-zinc-300' : 'text-zinc-400'
                              }`}
                            >
                              {p.description}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Society Admin Portal Direct Link */}
                <div className="pt-1.5 mt-1 border-t border-slate-100">
                  <Link
                    href="/admin"
                    onClick={() => setPersonaMenuOpen(false)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs text-amber-900 bg-amber-50 hover:bg-amber-100/80 font-bold transition-colors cursor-pointer"
                  >
                    <div className="p-1 rounded-lg bg-amber-200 text-amber-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <span className="block leading-none">Admin Management Portal</span>
                      <span className="text-[10px] text-amber-700 font-normal">Approve members & edit society</span>
                    </div>
                  </Link>
                </div>

                {/* Logout Action */}
                <div className="pt-2 mt-1.5 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      setPersonaMenuOpen(false);
                      await logout();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs text-rose-600 hover:bg-rose-50 font-semibold transition-colors cursor-pointer"
                  >
                    <div className="p-1 rounded-lg bg-rose-100/80 text-rose-600">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SocietyApps Suite Full Drawer Modal */}
      {appsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col p-5 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-zinc-900">Junto Community Suite</h3>
              </div>
              <button
                onClick={() => setAppsDrawerOpen(false)}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-800"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-zinc-500 mt-2 mb-4">
              Integrated residential applications for {society?.name || 'Mahaveer Ranches'}.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {societyAppsSuite.map((app) => (
                <div
                  key={app.name}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
                    app.active
                      ? 'border-emerald-300 bg-emerald-50/60 shadow-xs cursor-pointer'
                      : 'border-zinc-200 bg-zinc-50/80 opacity-70 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (app.active) setAppsDrawerOpen(false);
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{app.icon}</span>
                      {app.active ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600">
                          SOON
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900">{app.name}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                      {app.description}
                    </p>
                  </div>
                  {app.active && (
                    <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <span>Launch app</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
