'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Car,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Grid,
  CheckCircle2,
} from 'lucide-react';

interface AppHubScreenProps {
  onSelectApp: (appName: string) => void;
}

export function AppHubScreen({ onSelectApp }: AppHubScreenProps) {
  const { user, society } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] || 'Resident';

  const apps = [
    {
      id: 'rideshare',
      title: 'Junto RideShare',
      badge: 'Active & Verified',
      icon: Car,
      color: 'from-emerald-600 to-teal-700',
      description: 'Peer-to-peer co-resident carpooling to tech parks and hubs with zero commercial fares.',
      isReady: true,
      tag: 'Ready to Commute',
    },
    {
      id: 'announcements',
      title: 'Society Circulars',
      badge: 'Coming Soon',
      icon: Building2,
      color: 'from-slate-700 to-slate-800',
      description: 'Official Management Committee circulars, maintenance advisories, and notices.',
      isReady: false,
      tag: 'Next Phase',
    },
    {
      id: 'services',
      title: 'Domestic Help & Services',
      badge: 'Coming Soon',
      icon: Users,
      color: 'from-slate-700 to-slate-800',
      description: 'Directory of verified maids, cooks, and technicians inside our society.',
      isReady: false,
      tag: 'Next Phase',
    },
    {
      id: 'marketplace',
      title: 'Resident Marketplace',
      badge: 'Coming Soon',
      icon: Sparkles,
      color: 'from-slate-700 to-slate-800',
      description: 'Buy, sell, and rent household goods and furniture securely with neighbours.',
      isReady: false,
      tag: 'Next Phase',
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 min-h-[90vh] p-5">
      <div>
        {/* Header Greeting */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold tracking-wider uppercase mb-2">
            <Grid className="w-3.5 h-3.5" />
            <span>{society?.name || 'Mahaveer Ranches'} Apps</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Select a community product from the SocietyApps suite to continue:
          </p>
        </div>

        {/* Product Cards */}
        <div className="space-y-3.5">
          {apps.map((app) => {
            const Icon = app.icon;
            return (
              <div
                key={app.id}
                onClick={() => {
                  if (app.isReady) {
                    onSelectApp(app.id);
                  }
                }}
                className={`p-4 rounded-3xl border transition-all ${
                  app.isReady
                    ? 'bg-white border-slate-200 shadow-md hover:shadow-lg hover:border-emerald-300 cursor-pointer active:scale-98 group'
                    : 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.color} text-white flex items-center justify-center shrink-0 shadow-sm ${
                      app.isReady ? 'group-hover:scale-105 transition-transform' : ''
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-extrabold text-sm text-slate-900 truncate">
                        {app.title}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          app.isReady
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {app.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                      {app.description}
                    </p>

                    {app.isReady && (
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Commute Facilitation
                        </span>
                        <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                          <span>Open RideShare</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-6 text-center">
        <p className="text-[10px] text-slate-400 font-medium">
          SocietyApps Platform · Version 1.0 Pilot for {society?.name}
        </p>
      </div>
    </div>
  );
}
