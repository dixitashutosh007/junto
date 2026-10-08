'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Shield, Car, Search } from 'lucide-react';

export function PersonaSwitcher() {
  const { activePersona, switchPersona, user, membership, society } = useAuth();

  const personas = [
    {
      id: 'usr-offerer-001',
      name: 'Ashutosh D.',
      role: 'Ride Offerer',
      flat: 'B-804',
      badge: 'Offerer',
      icon: Car,
    },
    {
      id: 'usr-seeker-001',
      name: 'Priya S.',
      role: 'Ride Seeker',
      flat: 'C-302',
      badge: 'Seeker',
      icon: Search,
    },
    {
      id: 'usr-admin-001',
      name: 'Vikram M.',
      role: 'Society Admin',
      flat: 'A-1402',
      badge: 'Admin',
      icon: Shield,
    },
  ];

  return (
    <div className="bg-emerald-950 text-emerald-100 text-xs px-4 py-2 border-b border-emerald-800">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium truncate">
          <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{society?.name || 'SocietyApps'}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-emerald-300 font-mono mr-1">Switch:</span>
          {personas.map((p) => {
            const isSelected = activePersona === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => switchPersona(p.id)}
                className={`px-2 py-0.5 rounded-full flex items-center gap-1 font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-emerald-950 font-semibold shadow-xs'
                    : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-900'
                }`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{p.badge}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
