'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { apiErrorMessage, apiFetch } from '@/lib/api-client';

interface EmailChangeDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

/** Email is contact information only and is stored as unverified */
export function EmailChangeDialog({ open, onClose, onSaved }: EmailChangeDialogProps) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setEmail('');
    setError('');
    onClose();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await apiFetch('/api/v1/auth/me', { method: 'PUT', json: { email: email.trim().toLowerCase() } });
      if (!res.ok) {
        setError(await apiErrorMessage(res, 'Failed to update email'));
        return;
      }
      await onSaved();
      close();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Update Email Address"
      description="Used for account notices only. It is never shown to other residents."
    >
      {error && (
        <p role="alert" className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </p>
      )}
      <form onSubmit={save} className="space-y-3">
        <div>
          <label htmlFor="new-email" className="text-xs font-bold text-slate-700 block mb-1">
            New Email Address
          </label>
          <input
            id="new-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="resident@workplace.com"
            className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={close}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-label="Saving" /> : 'Save'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
