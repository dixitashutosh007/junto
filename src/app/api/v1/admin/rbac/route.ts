import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/api-auth';
import { MembershipRole } from '@/types';

// App Admin endpoint to view and update RBAC roles and granular permissions
export async function PUT(req: NextRequest) {
  // App Admin (SUPER_ADMIN) is required to manage RBAC
  const auth = await requireAuth(req, { roles: ['SUPER_ADMIN'] });
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { targetUserId, targetSocietyId, role, permissions } = body;

  if (!targetUserId || !role) {
    return errorResponse('Missing targetUserId or role');
  }

  const societyId = targetSocietyId || auth.societyId;
  const repo = getRepository();

  const updates: any = {
    role: role as MembershipRole,
  };

  if (permissions) {
    updates.permissions = {
      canApproveResidents: Boolean(permissions.canApproveResidents),
      canManageSettings: Boolean(permissions.canManageSettings),
      canModerateReports: Boolean(permissions.canModerateReports),
      canViewAuditLogs: Boolean(permissions.canViewAuditLogs),
    };
  }

  const updated = await repo.updateMembership(societyId, targetUserId, updates);

  await repo.recordAuditEvent({
    id: `audit-${Date.now()}`,
    societyId,
    actorUserId: auth.userId,
    action: 'RBAC_ROLE_PERMISSIONS_UPDATED',
    entityType: 'MEMBERSHIP',
    entityId: updated.id,
    metadata: { targetUserId, role, permissions: updates.permissions },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, membership: updated });
}
