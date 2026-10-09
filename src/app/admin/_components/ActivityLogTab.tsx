'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { apiErrorMessage, apiFetch } from '@/lib/api-client';
import { AuditLogEntry } from './types';

const timestampFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function badgeColor(action: string): string {
  if (action.includes('APPROVE')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (action.includes('REJECT') || action.includes('BLOCK') || action.includes('SUSPEND')) {
    return 'bg-rose-100 text-rose-800 border-rose-200';
  }
  if (action.includes('RBAC')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  return 'bg-zinc-100 text-zinc-800 border-zinc-200';
}

export function ActivityLogTab() {
  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState('');

  const loadLogs = useCallback(async () => {
    const res = await apiFetch('/api/v1/admin/audit-logs');
    if (res.ok) {
      setLogs((await res.json()).events ?? []);
      setError('');
    } else {
      setError(await apiErrorMessage(res, 'Could not load activity logs'));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) void loadLogs();
    });
    return () => {
      cancelled = true;
    };
  }, [loadLogs]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 mb-3 text-xs text-zinc-600 flex items-center justify-between">
        <div>
          <span className="font-semibold text-zinc-900 block mb-0.5">Society Activities & Audit Trail</span>
          <p className="text-[11px] text-zinc-500">
            Administrative actions, resident approvals, status changes and settings updates (latest 100).
          </p>
        </div>
        <button
          onClick={() => void loadLogs()}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 shadow-2xs"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          {error}
        </p>
      ) : logs === null ? (
        <div className="py-12 text-center text-xs text-zinc-500" role="status">
          Loading activity logs…
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
          <History className="w-8 h-8 text-zinc-400 mx-auto mb-2" aria-hidden="true" />
          <p className="text-xs font-semibold text-zinc-700">No activity logged yet</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Administrative and lifecycle events will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li key={log.id} className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-2xs space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor(log.action)}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-zinc-500 text-[11px]">by</span>
                  <span className="font-semibold text-zinc-900 text-[11px]">{log.actorName || 'Admin'}</span>
                </div>
                <time dateTime={log.createdAt} className="text-[10px] text-zinc-500 font-mono">
                  {timestampFormatter.format(new Date(log.createdAt))}
                </time>
              </div>

              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <pre className="bg-zinc-50 p-2 rounded-lg font-mono text-[10px] text-zinc-600 border border-zinc-100 overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
