'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False while prerendering on the server and during hydration, true in the
 * browser afterwards. Use it to read browser-only or time-dependent values
 * (the current date, window APIs) during render instead of copying them
 * into state from an effect.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
