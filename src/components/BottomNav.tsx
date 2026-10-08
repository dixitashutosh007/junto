'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Car, Clock, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
  const pathname = usePathname();
  const { membership, isAuthenticated } = useAuth();
  const isAdmin = membership?.role === 'SOCIETY_ADMIN';

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Find', href: '/rides/find', icon: Search },
    { label: 'Offer', href: '/rides/offer', icon: Car },
    { label: 'My Activity', href: '/rides/my-rides', icon: Clock },
    { label: 'Profile', href: '/profile', icon: User },
    ...(isAdmin ? [{ label: 'Admin', href: '/admin', icon: ShieldCheck }] : []),
  ];

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
