'use client';

import { apiFetch } from '@/lib/api-client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  Check,
  X,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Users,
  Settings,
  Building,
  MapPin,
  FileText,
  UserX,
  UserCheck,
  Save,
  Flag,
  ShieldAlert,
  History,
  KeyRound,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { activePersona, society, refreshAuth, membership } = useAuth();
  const isSuperAdmin = membership?.role === 'SUPER_ADMIN';

  // Tab State: 'MEMBERS' | 'MODERATION' | 'ACTIVITY_LOGS' | 'RBAC' | 'SOCIETY_DETAILS' | 'COMMUTE_SETTINGS'
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'MODERATION' | 'ACTIVITY_LOGS' | 'RBAC' | 'SOCIETY_DETAILS' | 'COMMUTE_SETTINGS'>('MEMBERS');

  // Members State
  const [membersView, setMembersView] = useState<'PENDING' | 'ALL'>('PENDING');
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Activity Logs State (Requirement 7)
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // RBAC State (Requirement 6)
  const [editingRbacUserId, setEditingRbacUserId] = useState<string | null>(null);
  const [rbacRole, setRbacRole] = useState<'RESIDENT' | 'SOCIETY_ADMIN' | 'SUPER_ADMIN'>('RESIDENT');
  const [rbacPerms, setRbacPerms] = useState({
    canApproveResidents: true,
    canManageSettings: true,
    canModerateReports: true,
    canViewAuditLogs: true,
  });

  // Moderation Reports State
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  // Society Details State
  const [societyName, setSocietyName] = useState(society?.name ?? '');
  const [societyAddress, setSocietyAddress] = useState(
    society?.address || 'Hosa Road, Off Hosur Road, Electronic City Post, Bangalore, Karnataka 560100'
  );
  const [societyLat, setSocietyLat] = useState(society?.latitude || 12.8715);
  const [societyLng, setSocietyLng] = useState(society?.longitude || 77.6534);
  const [communityRules, setCommunityRules] = useState(
    society?.settings?.community_rules ||
      '1. Be punctual and arrive at the clubhouse gate 5 minutes early.\n2. Respect co-residents and maintain a quiet, clean carpool atmosphere.\n3. Cancel at least 1 hour in advance if your commute plan changes.\n4. No commercial fares or unauthorized non-residents.'
  );

  // Commute Detour Settings State
  const [maxDetour, setMaxDetour] = useState(society?.settings?.max_detour_minutes || 10);
  const [requireApproval, setRequireApproval] = useState(
    society?.settings?.require_admin_approval !== false
  );
  const [allowGenderPref, setAllowGenderPref] = useState(
    society?.settings?.allow_gender_preferences !== false
  );

  // Tower & Flat Listing Format State (Requirement 4)
  const [flatFormatPattern, setFlatFormatPattern] = useState(
    society?.settings?.flat_format_pattern || 'TOWER_FLAT'
  );
  const [flatFormatExample, setFlatFormatExample] = useState(
    society?.settings?.flat_format_example || 'Tower A - 1202'
  );

  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load Members
  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      // Pending
      const resPending = await apiFetch('/api/v1/admin/residents');
      if (resPending.ok) {
        const data = await resPending.json();
        setPendingMembers(data.pending || []);
      }

      // All Members
      const resAll = await apiFetch('/api/v1/admin/residents?all=true');
      if (resAll.ok) {
        const dataAll = await resAll.json();
        setAllMembers(dataAll.members || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      const res = await apiFetch('/api/v1/moderation/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReports(false);
    }
  };

  // Member Status Filter: 'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  const [memberStatusFilter, setMemberStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await apiFetch('/api/v1/admin/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.events || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveRbac = async (targetUserId: string) => {
    try {
      setIsSaving(true);
      const res = await apiFetch('/api/v1/admin/rbac', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          role: rbacRole,
          permissions: rbacPerms,
        }),
      });
      if (res.ok) {
        setMessage('Role & permissions successfully updated!');
        setEditingRbacUserId(null);
        loadMembers();
        loadAuditLogs();
        setTimeout(() => setMessage(''), 4000);
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error || 'Failed to update RBAC'}`);
      }
    } catch (e) {
      console.error(e);
      setMessage('Failed to update RBAC');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadMembers();
    loadReports();
    loadAuditLogs();
    if (society) {
      setSocietyName(society.name);
      setSocietyAddress(society.address);
      setSocietyLat(society.latitude);
      setSocietyLng(society.longitude);
      setCommunityRules(society.settings.community_rules || '');
      setMaxDetour(society.settings.max_detour_minutes || 10);
      if (society.settings.flat_format_pattern) setFlatFormatPattern(society.settings.flat_format_pattern);
      if (society.settings.flat_format_example) setFlatFormatExample(society.settings.flat_format_example);
    }
  }, [activePersona, society]);

  // Handle Moderation Action (RESOLVE | DISMISS)
  const handleReportAction = async (reportId: string, status: 'RESOLVED' | 'DISMISSED', notes: string) => {
    try {
      const res = await apiFetch('/api/v1/moderation/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          status,
          resolutionNotes: notes,
        }),
      });
      if (res.ok) {
        setMessage(`Report marked as ${status}`);
        setResolvingReportId(null);
        setResolutionText('');
        loadReports();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Member Lifecycle Action: APPROVE | REJECT | BLOCK | REACTIVATE
  const handleMemberAction = async (targetUserId: string, action: string) => {
    try {
      const res = await apiFetch('/api/v1/admin/residents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          action,
        }),
      });
      if (res.ok) {
        setMessage(`Member status updated to ${action}`);
        loadMembers();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Society Details & Rules
  const handleSaveSocietyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiFetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: societyName,
          address: societyAddress,
          latitude: Number(societyLat),
          longitude: Number(societyLng),
          community_rules: communityRules,
          flat_format_pattern: flatFormatPattern,
          flat_format_example: flatFormatExample,
          max_detour_minutes: maxDetour,
          require_admin_approval: requireApproval,
          allow_gender_preferences: allowGenderPref,
        }),
      });
      if (res.ok) {
        setMessage('Society details and rules updated successfully!');
        await refreshAuth();
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/"
          className="p-2 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-zinc-900">Society Admin Portal</h1>
          <p className="text-xs text-zinc-500 font-medium">{societyName}</p>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium animate-fade-in">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center p-1 bg-zinc-100 rounded-xl mb-4 text-xs font-semibold text-zinc-600 overflow-x-auto">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex-1 min-w-[70px] py-2 px-2 text-center rounded-lg transition-all ${
            activeTab === 'MEMBERS'
              ? 'bg-white text-zinc-900 shadow-xs'
              : 'hover:text-zinc-900'
          }`}
        >
          Members ({pendingMembers.length > 0 ? `${pendingMembers.length}` : allMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('MODERATION')}
          className={`flex-1 min-w-[65px] py-2 px-2 text-center rounded-lg transition-all ${
            activeTab === 'MODERATION'
              ? 'bg-white text-zinc-900 shadow-xs'
              : 'hover:text-zinc-900'
          }`}
        >
          Reports ({reports.filter((r) => r.status === 'OPEN').length})
        </button>
        <button
          onClick={() => setActiveTab('ACTIVITY_LOGS')}
          className={`flex-1 min-w-[65px] py-2 px-2 text-center rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'ACTIVITY_LOGS'
              ? 'bg-white text-zinc-900 shadow-xs'
              : 'hover:text-zinc-900'
          }`}
        >
          <History className="w-3 h-3" />
          <span>Logs</span>
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('RBAC')}
            className={`flex-1 min-w-[65px] py-2 px-2 text-center rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'RBAC'
                ? 'bg-white text-zinc-900 shadow-xs text-indigo-700'
                : 'hover:text-zinc-900 text-indigo-600'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>RBAC</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('SOCIETY_DETAILS')}
          className={`flex-1 min-w-[55px] py-2 px-2 text-center rounded-lg transition-all ${
            activeTab === 'SOCIETY_DETAILS'
              ? 'bg-white text-zinc-900 shadow-xs'
              : 'hover:text-zinc-900'
          }`}
        >
          Rules
        </button>
        <button
          onClick={() => setActiveTab('COMMUTE_SETTINGS')}
          className={`flex-1 min-w-[65px] py-2 px-2 text-center rounded-lg transition-all ${
            activeTab === 'COMMUTE_SETTINGS'
              ? 'bg-white text-zinc-900 shadow-xs'
              : 'hover:text-zinc-900'
          }`}
        >
          Settings
        </button>
      </div>

      {/* TAB 1: MEMBERS MANAGEMENT */}
      {activeTab === 'MEMBERS' && (
        <div className="flex-1 flex flex-col">
          {/* Sub-Filter (Pending vs All & Status Pills) */}
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMembersView('PENDING');
                  setMemberStatusFilter('PENDING');
                }}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                  membersView === 'PENDING'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Pending Approvals ({pendingMembers.length})
              </button>
              <button
                onClick={() => {
                  setMembersView('ALL');
                  setMemberStatusFilter('ALL');
                }}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                  membersView === 'ALL'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                All Residents ({allMembers.length})
              </button>
            </div>

            {membersView === 'ALL' && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <span className="text-[11px] text-zinc-400 font-medium mr-1">Filter:</span>
                {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setMemberStatusFilter(st)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium transition-colors ${
                      memberStatusFilter === st
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Active / Approved' : st === 'PENDING' ? 'Pending' : 'Suspended / Blocked'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingMembers ? (
            <div className="py-12 text-center text-xs text-zinc-400">Loading members...</div>
          ) : membersView === 'PENDING' ? (
            pendingMembers.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-400 border border-dashed rounded-2xl">
                No pending resident verification requests.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingMembers.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-zinc-900">{mem.user.fullName}</h3>
                        <p className="text-xs text-zinc-500 font-medium">Flat {mem.flatNumber}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{mem.user.mobile}</p>
                        {mem.user.email && (
                          <p className="text-[11px] text-zinc-400 font-mono">{mem.user.email}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Awaiting Approval
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleMemberAction(mem.userId, 'REJECT')}
                        className="px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-semibold hover:bg-zinc-50 flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button
                        onClick={() => handleMemberAction(mem.userId, 'APPROVE')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Resident
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* ALL MEMBERS ROSTER WITH BLOCK / SUSPEND */
            <div className="space-y-3">
              {allMembers
                .filter((mem) => {
                  if (memberStatusFilter === 'ALL') return true;
                  if (memberStatusFilter === 'ACTIVE') return mem.status === 'ACTIVE';
                  if (memberStatusFilter === 'PENDING') return mem.status === 'PENDING_APPROVAL';
                  if (memberStatusFilter === 'SUSPENDED') return mem.status === 'SUSPENDED' || mem.status === 'DEACTIVATED' || mem.status === 'REJECTED';
                  return true;
                })
                .map((mem) => {
                  const isActive = mem.status === 'ACTIVE';
                  const isSuspended = mem.status === 'SUSPENDED';
                  const isBlocked = mem.status === 'DEACTIVATED';
                  const isPending = mem.status === 'PENDING_APPROVAL';

                  return (
                    <div
                      key={mem.id}
                      className="p-4 rounded-2xl border border-zinc-200 bg-white shadow-xs flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-zinc-900">
                              {mem.user.fullName}
                            </span>
                            {mem.role === 'SOCIETY_ADMIN' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-900 text-white">
                                Admin
                              </span>
                            )}
                            {mem.role === 'SUPER_ADMIN' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-600 text-white">
                                Super Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500">Flat {mem.flatNumber || 'Unassigned'}</p>
                          <p className="text-[11px] text-zinc-400 font-mono">{mem.user.mobile}</p>
                          {mem.user.email && (
                            <p className="text-[11px] text-zinc-400 font-mono">{mem.user.email}</p>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPending
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {mem.status}
                        </span>
                      </div>

                      {mem.role !== 'SUPER_ADMIN' && (
                        <div className="pt-2 border-t border-zinc-100 flex items-center justify-end gap-2 text-xs">
                          {isActive && (
                            <>
                              <button
                                onClick={() => handleMemberAction(mem.userId, 'SUSPEND')}
                                className="px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 font-medium"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => handleMemberAction(mem.userId, 'BLOCK')}
                                className="px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-medium"
                              >
                                Block User
                              </button>
                            </>
                          )}
                          {(isSuspended || isBlocked) && (
                            <button
                              onClick={() => handleMemberAction(mem.userId, 'REACTIVATE')}
                              className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                            >
                              Reactivate Resident
                            </button>
                          )}
                          {isPending && (
                            <button
                              onClick={() => handleMemberAction(mem.userId, 'APPROVE')}
                              className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB: ACTIVITY LOGS (Requirement 7) */}
      {activeTab === 'ACTIVITY_LOGS' && (
        <div className="flex-1 flex flex-col">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 mb-3 text-xs text-zinc-600 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-900 block mb-0.5">Society Activities & Audit Trail</span>
              <p className="text-[11px] text-zinc-500">
                Transparent log of all administrative actions, resident approvals, status changes, and settings updates.
              </p>
            </div>
            <button
              onClick={loadAuditLogs}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 shadow-2xs"
            >
              Refresh
            </button>
          </div>

          {loadingLogs ? (
            <div className="py-12 text-center text-xs text-zinc-400">Loading activity logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <History className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-700">No activity logged yet</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Administrative and lifecycle events will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => {
                const actionBadgeColor =
                  log.action.includes('APPROVE')
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : log.action.includes('REJECT') || log.action.includes('BLOCK') || log.action.includes('SUSPEND')
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : log.action.includes('RBAC')
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    : 'bg-zinc-100 text-zinc-800 border-zinc-200';

                return (
                  <div
                    key={log.id}
                    className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${actionBadgeColor}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-zinc-500 text-[11px]">by</span>
                        <span className="font-semibold text-zinc-900 text-[11px]">{log.actorName || 'Admin'}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="bg-zinc-50 p-2 rounded-lg font-mono text-[10px] text-zinc-600 border border-zinc-100 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: RBAC CONTROL (Requirement 6 - App Admin Only) */}
      {activeTab === 'RBAC' && (
        <div className="flex-1 flex flex-col">
          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/80 mb-3 text-xs text-indigo-950">
            <span className="font-semibold block mb-0.5 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              Role-Based Access Control (RBAC)
            </span>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              As App Admin, designate which residents become Society Admins and configure granular management permissions.
            </p>
          </div>

          <div className="space-y-3">
            {allMembers.map((mem) => {
              const isEditing = editingRbacUserId === mem.userId;
              const isCurrentSuper = mem.role === 'SUPER_ADMIN';

              return (
                <div
                  key={mem.id}
                  className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900">{mem.user.fullName}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            mem.role === 'SUPER_ADMIN'
                              ? 'bg-indigo-100 text-indigo-800'
                              : mem.role === 'SOCIETY_ADMIN'
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {mem.role}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Flat {mem.flatNumber || 'N/A'} • {mem.user.mobile}
                      </p>
                    </div>

                    {!isCurrentSuper && (
                      <button
                        onClick={() => {
                          if (isEditing) {
                            setEditingRbacUserId(null);
                          } else {
                            setEditingRbacUserId(mem.userId);
                            setRbacRole(mem.role);
                            setRbacPerms(
                              mem.permissions || {
                                canApproveResidents: true,
                                canManageSettings: true,
                                canModerateReports: true,
                                canViewAuditLogs: true,
                              }
                            );
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all ${
                          isEditing
                            ? 'bg-zinc-100 border-zinc-300 text-zinc-700'
                            : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                        }`}
                      >
                        {isEditing ? 'Cancel' : 'Edit Permissions'}
                      </button>
                    )}
                  </div>

                  {/* Editing Panel */}
                  {isEditing && (
                    <div className="pt-3 border-t border-zinc-100 space-y-3 bg-zinc-50/60 p-3 rounded-xl">
                      <div>
                        <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                          Assigned Persona / Role
                        </label>
                        <select
                          value={rbacRole}
                          onChange={(e) => setRbacRole(e.target.value as any)}
                          className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white"
                        >
                          <option value="RESIDENT">RESIDENT (Commuter only)</option>
                          <option value="SOCIETY_ADMIN">SOCIETY_ADMIN (Society Manager)</option>
                        </select>
                      </div>

                      {rbacRole === 'SOCIETY_ADMIN' && (
                        <div>
                          <label className="text-[11px] font-bold text-zinc-700 block mb-1.5">
                            Granular Society Admin Capabilities
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rbacPerms.canApproveResidents}
                                onChange={(e) =>
                                  setRbacPerms((p) => ({ ...p, canApproveResidents: e.target.checked }))
                                }
                                className="w-4 h-4 text-indigo-600 rounded-sm"
                              />
                              <span>Approve & reject new residents</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rbacPerms.canManageSettings}
                                onChange={(e) =>
                                  setRbacPerms((p) => ({ ...p, canManageSettings: e.target.checked }))
                                }
                                className="w-4 h-4 text-indigo-600 rounded-sm"
                              />
                              <span>Update society settings, rules & detour threshold</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rbacPerms.canModerateReports}
                                onChange={(e) =>
                                  setRbacPerms((p) => ({ ...p, canModerateReports: e.target.checked }))
                                }
                                className="w-4 h-4 text-indigo-600 rounded-sm"
                              />
                              <span>Moderate safety reports & resolve user flags</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={rbacPerms.canViewAuditLogs}
                                onChange={(e) =>
                                  setRbacPerms((p) => ({ ...p, canViewAuditLogs: e.target.checked }))
                                }
                                className="w-4 h-4 text-indigo-600 rounded-sm"
                              />
                              <span>View audit logs & activity history</span>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleSaveRbac(mem.userId)}
                          disabled={isSaving}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-xs flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? 'Saving...' : 'Save RBAC Permissions'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: MODERATION REPORTS */}
      {activeTab === 'MODERATION' && (
        <div className="flex-1 flex flex-col">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 mb-3 text-xs text-zinc-600">
            <span className="font-semibold text-zinc-900 block mb-0.5">Community Safety Reports</span>
            Review resident complaints, reported no-shows, and safety concerns confidentially.
          </div>

          {loadingReports ? (
            <div className="p-8 text-center text-xs text-zinc-400">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <ShieldAlert className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-700">No open moderation reports</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Your society carpool community is in good standing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-3.5 bg-white rounded-xl border border-zinc-200 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">
                          {report.category.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            report.status === 'OPEN'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Reported on {new Date(report.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 leading-relaxed">
                    &ldquo;{report.description}&rdquo;
                  </p>

                  {report.resolutionNotes && (
                    <div className="p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-800">
                      <span className="font-semibold block">Resolution note:</span>
                      {report.resolutionNotes}
                    </div>
                  )}

                  {report.status === 'OPEN' && (
                    <div className="pt-2 border-t border-zinc-100 space-y-2">
                      {resolvingReportId === report.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                            placeholder="Add action taken / resolution note..."
                            className="w-full text-xs p-2 rounded-lg border border-zinc-200"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReportAction(report.id, 'RESOLVED', resolutionText)}
                              className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
                            >
                              Confirm Resolved
                            </button>
                            <button
                              onClick={() => {
                                setResolvingReportId(null);
                                setResolutionText('');
                              }}
                              className="px-3 py-1.5 bg-zinc-100 text-zinc-600 text-xs font-semibold rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReportAction(report.id, 'DISMISSED', 'Reviewed and dismissed')}
                            className="px-3 py-1 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-medium hover:bg-zinc-50"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => setResolvingReportId(report.id)}
                            className="px-3 py-1 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800"
                          >
                            Resolve Report
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SOCIETY DETAILS & RULES (Requirement 3 & 4) */}
      {activeTab === 'SOCIETY_DETAILS' && (
        <form onSubmit={handleSaveSocietyProfile} className="flex-1 flex flex-col gap-4">
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-emerald-950">
            <span className="font-semibold block mb-0.5">Society Profile Settings</span>
            Update society name, gate location coordinates, and community carpool rules.
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Society Official Name
            </label>
            <input
              type="text"
              required
              value={societyName}
              onChange={(e) => setSocietyName(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Society Address & Gate
            </label>
            <textarea
              rows={2}
              required
              value={societyAddress}
              onChange={(e) => setSocietyAddress(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Gate Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={societyLat}
                onChange={(e) => setSocietyLat(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Gate Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={societyLng}
                onChange={(e) => setSocietyLng(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Society Carpool & Community Rules
            </label>
            <textarea
              rows={5}
              value={communityRules}
              onChange={(e) => setCommunityRules(e.target.value)}
              placeholder="Enter society-specific carpool guidelines and etiquette..."
              className="w-full text-xs p-3 rounded-xl border border-zinc-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              These guidelines are displayed to residents before they offer or request rides.
            </p>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            <h4 className="text-xs font-bold text-zinc-800 mb-1">Tower & Flat Format Configuration</h4>
            <p className="text-[11px] text-zinc-500 mb-3">
              Configure how residents should write their flat and tower numbers during registration. This pattern guides input placeholder and format.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">Format Example Placeholder</label>
                <input
                  type="text"
                  value={flatFormatExample}
                  onChange={(e) => setFlatFormatExample(e.target.value)}
                  placeholder="e.g. Tower A - 1202 or #422"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 block mb-1">Validation Pattern (Regex Optional)</label>
                <input
                  type="text"
                  value={flatFormatPattern}
                  onChange={(e) => setFlatFormatPattern(e.target.value)}
                  placeholder="e.g. ^(Tower [A-Z]|#)[0-9A-Za-z -]+$"
                  className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Society Details & Rules'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: COMMUTE SETTINGS */}
      {activeTab === 'COMMUTE_SETTINGS' && (
        <form onSubmit={handleSaveSocietyProfile} className="flex-1 flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Max Allowed Commute Detour (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={30}
                value={maxDetour}
                onChange={(e) => setMaxDetour(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-200 bg-white"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Commute matches with a detour exceeding this threshold will not be recommended.
              </p>
            </div>

            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-800 block">Require Admin Approval</span>
                <span className="text-[10px] text-zinc-500">
                  New residents require manual review before accessing Ride Share
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm"
              />
            </div>

            <div className="pt-3 border-t border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-800 block">Allow Gender Preferences</span>
                <span className="text-[10px] text-zinc-500">
                  Allow riders and offerers to specify gender preferences
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowGenderPref}
                onChange={(e) => setAllowGenderPref(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm"
              />
            </div>
          </div>

          <div className="mt-auto pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Update Commute Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
