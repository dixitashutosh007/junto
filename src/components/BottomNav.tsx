'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Car, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function BottomNav() {
  const pathname = usePathname();
  const { membership } = useAuth();
  const isAdmin = membership?.role === 'SOCIETY_ADMIN';

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Find', href: '/rides/find', icon: Search },
    { label: 'Offer', href: '/rides/offer', icon: Car },
    { label: 'My Activity', href: '/rides/my-rides', icon: Clock },
    ...(isAdmin ? [{ label: 'Admin', href: '/admin', icon: ShieldCheck }] : []),
  ];

  return (
    <nav className="sticky bottom-0 z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-3 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-zinc-500 hover:text-zinc-900 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
