'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, History, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { AdminPermissions } from '@/types';
import { ActivityLogTab } from './_components/ActivityLogTab';
import { MembersTab } from './_components/MembersTab';
import { ModerationTab } from './_components/ModerationTab';
import { RbacTab } from './_components/RbacTab';
import { SocietySettingsForm } from './_components/SocietySettingsForm';
import { AdminMember, ModerationReport, Notify } from './_components/types';

type Tab = 'MEMBERS' | 'MODERATION' | 'ACTIVITY_LOGS' | 'RBAC' | 'SOCIETY_DETAILS' | 'COMMUTE_SETTINGS';
const TABS: Tab[] = ['MEMBERS', 'MODERATION', 'ACTIVITY_LOGS', 'RBAC', 'SOCIETY_DETAILS', 'COMMUTE_SETTINGS'];

const ACTION_DONE = {
  APPROVE: 'Resident approved.',
  REJECT: 'Registration rejected.',
  SUSPEND: 'Resident suspended.',
  BLOCK: 'Resident blocked.',
  REACTIVATE: 'Resident reactivated.',
} as const;

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminPortal />
    </Suspense>
  );
}

function AdminPortal() {
  const { society, refreshAuth, membership } = useAuth();
  const requestedTab = useSearchParams().get('tab') as Tab | null;

  const isSuperAdmin = membership?.role === 'SUPER_ADMIN';
  const can = (permission: keyof AdminPermissions) =>
    isSuperAdmin || (membership?.role === 'SOCIETY_ADMIN' && membership.permissions?.[permission] !== false);

  const visibleTabs: { id: Tab; label: React.ReactNode }[] = [];

  const [activeTab, setActiveTab] = useState<Tab>(
    requestedTab && TABS.includes(requestedTab) ? requestedTab : 'MEMBERS'
  );
  const [pendingMembers, setPendingMembers] = useState<AdminMember[]>([]);
  const [allMembers, setAllMembers] = useState<AdminMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [message, setMessage] = useState<{ text: string; kind: 'success' | 'error' } | null>(null);

  const notify: Notify = useCallback((text, kind = 'success') => {
    setMessage({ text, kind });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const loadMembers = useCallback(async () => {
    const [pendingRes, allRes] = await Promise.all([
      apiFetch('/api/v1/admin/residents'),
      apiFetch('/api/v1/admin/residents?all=true'),
    ]);
    if (pendingRes.ok) setPendingMembers((await pendingRes.json()).pending ?? []);
    if (allRes.ok) setAllMembers((await allRes.json()).members ?? []);
    setLoadingMembers(false);
  }, []);

  const loadReports = useCallback(async () => {
    const res = await apiFetch('/api/v1/moderation/reports');
    if (res.ok) setReports((await res.json()).reports ?? []);
    setLoadingReports(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      void loadMembers();
      void loadReports();
    });
    return () => {
      cancelled = true;
    };
  }, [loadMembers, loadReports, society?.id]);

  const handleMemberAction = async (
    targetUserId: string,
    action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'BLOCK' | 'REACTIVATE'
  ) => {
    const res = await apiFetch('/api/v1/admin/residents', { json: { targetUserId, action } });
    if (res.ok) {
      notify(ACTION_DONE[action]);
      await loadMembers();
    } else {
      const data = await res.json().catch(() => null);
      notify(data?.error ?? 'Could not update the member', 'error');
    }
  };

  if (can('canApproveResidents')) {
    visibleTabs.push({
      id: 'MEMBERS',
      label: `Members (${pendingMembers.length > 0 ? pendingMembers.length : allMembers.length})`,
    });
  }
  if (can('canModerateReports')) {
    visibleTabs.push({ id: 'MODERATION', label: `Reports (${reports.filter((r) => r.status === 'OPEN').length})` });
  }
  if (can('canViewAuditLogs')) {
    visibleTabs.push({
      id: 'ACTIVITY_LOGS',
      label: (
        <>
          <History className="w-3 h-3" aria-hidden="true" /> Logs
        </>
      ),
    });
  }
  if (isSuperAdmin) {
    visibleTabs.push({
      id: 'RBAC',
      label: (
        <>
          <Lock className="w-3 h-3" aria-hidden="true" /> RBAC
        </>
      ),
    });
  }
  if (can('canManageSettings')) {
    visibleTabs.push({ id: 'SOCIETY_DETAILS', label: 'Rules' }, { id: 'COMMUTE_SETTINGS', label: 'Settings' });
  }

  const currentTab = visibleTabs.some((t) => t.id === activeTab) ? activeTab : visibleTabs[0]?.id;

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/"
          aria-label="Back to home"
          className="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-zinc-900">Society Admin Portal</h1>
          <p className="text-xs text-zinc-500 font-medium">{society?.name}</p>
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`mb-4 p-3 border text-xs rounded-xl font-medium ${
            message.kind === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {visibleTabs.length === 0 ? (
        <p className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600">
          You don&apos;t have admin access in this society.
        </p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Admin sections"
            className="flex items-center p-1 bg-zinc-100 rounded-xl mb-4 text-xs font-semibold text-zinc-600 overflow-x-auto"
          >
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={currentTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[60px] py-2 px-2 text-center rounded-lg transition-all flex items-center justify-center gap-1 ${
                  currentTab === tab.id ? 'bg-white text-zinc-900 shadow-xs' : 'hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="flex-1 flex flex-col">
            {currentTab === 'MEMBERS' && (
              <MembersTab
                pendingMembers={pendingMembers}
                allMembers={allMembers}
                loading={loadingMembers}
                onAction={handleMemberAction}
              />
            )}
            {currentTab === 'MODERATION' && (
              <ModerationTab reports={reports} loading={loadingReports} notify={notify} onChanged={loadReports} />
            )}
            {currentTab === 'ACTIVITY_LOGS' && <ActivityLogTab />}
            {currentTab === 'RBAC' && <RbacTab members={allMembers} notify={notify} onSaved={loadMembers} />}
            {(currentTab === 'SOCIETY_DETAILS' || currentTab === 'COMMUTE_SETTINGS') && society && (
              <SocietySettingsForm
                key={`${society.id}-${currentTab}`}
                society={society}
                section={currentTab === 'SOCIETY_DETAILS' ? 'DETAILS' : 'COMMUTE'}
                notify={notify}
                onSaved={refreshAuth}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
