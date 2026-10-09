'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker (offline page, push notifications) in
 * production builds. Skipped in development so cached assets never get in
 * the way of hot reloading.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  }, []);
  return null;
}
