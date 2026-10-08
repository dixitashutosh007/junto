'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Car, Clock, ShieldCheck, User, Users, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
  const pathname = usePathname();
  const { membership, isAuthenticated, activePersona } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const role = membership?.role || 'RESIDENT';
  const isSocietyAdmin = role === 'SOCIETY_ADMIN' || activePersona === 'usr-admin-001';
  const isAppAdmin = role === 'SUPER_ADMIN' || activePersona === 'usr-app-admin-001';

  let navItems = [];

  if (isSocietyAdmin || isAppAdmin) {
    // Admin View: focused exclusively on management, approvals, moderation and activity logs
    navItems = [
      { label: 'Admin Portal', href: '/admin', icon: ShieldCheck },
      { label: 'Residents', href: '/admin?tab=MEMBERS', icon: Users },
      { label: 'Moderation', href: '/admin?tab=MODERATION', icon: ShieldAlert },
      { label: 'Profile', href: '/profile', icon: User },
    ];
  } else if (activePersona === 'usr-offerer-001') {
    // Offerer View
    navItems = [
      { label: 'Home', href: '/', icon: Home },
      { label: 'Offer Ride', href: '/rides/offer', icon: Car },
      { label: 'My Rides', href: '/rides/my-rides', icon: Clock },
      { label: 'Profile', href: '/profile', icon: User },
    ];
  } else {
    // Seeker / General Resident View
    navItems = [
      { label: 'Home', href: '/', icon: Home },
      { label: 'Find Ride', href: '/rides/find', icon: Search },
      { label: 'My Requests', href: '/rides/my-requests', icon: Clock },
      { label: 'Profile', href: '/profile', icon: User },
    ];
  }

  return (
    <nav className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 py-2 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-700 font-bold bg-emerald-50/80'
                  : 'text-slate-500 hover:text-slate-900 font-medium hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-emerald-700' : 'stroke-[1.75px]'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
