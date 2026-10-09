import { ModerationReport, SocietyMembership } from '@/types';

/** Upheld (RESOLVED) reports after which a resident is suspended automatically */
export const AUTO_SUSPEND_AFTER_UPHELD_REPORTS = 3;

/**
 * Whether upholding reports should suspend this member now: an active
 * resident with enough upheld reports. Admins are never suspended
 * automatically; another admin reviews them instead.
 */
export function shouldAutoSuspend(
  reports: Pick<ModerationReport, 'reportedUserId' | 'status'>[],
  membership: Pick<SocietyMembership, 'userId' | 'role' | 'status'> | null
): boolean {
  if (!membership || membership.status !== 'ACTIVE' || membership.role !== 'RESIDENT') return false;
  const upheld = reports.filter((r) => r.reportedUserId === membership.userId && r.status === 'RESOLVED');
  return upheld.length >= AUTO_SUSPEND_AFTER_UPHELD_REPORTS;
}
