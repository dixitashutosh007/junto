import React from 'react';
import { Loader2 } from 'lucide-react';

/** Inline "loading" indicator announced to screen readers */
export function Loading({ label }: { label: string }) {
  return (
    <div role="status" className="py-12 flex items-center justify-center gap-2 text-xs text-zinc-500">
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

/** Failed-to-load message with a retry button */
export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-xs text-rose-800 space-y-2">
      <p>{message}</p>
      <button type="button" onClick={onRetry} className="font-semibold underline">
        Try again
      </button>
    </div>
  );
}
