import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { getAuthContext, errorResponse } from '@/lib/api-auth';

// List registrations for the current society (pending or all)
export async function GET(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);
  if (auth.role !== 'SOCIETY_ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return errorResponse('Forbidden: Society Admin role required', 403);
  }

  const { searchParams } = new URL(req.url);
  const viewAll = searchParams.get('all') === 'true';

  const repo = getRepository();
  if (viewAll) {
    const members = await repo.listSocietyMembers(auth.societyId);
    return NextResponse.json({ members });
  }

  const pending = await repo.listPendingMemberships(auth.societyId);
  return NextResponse.json({ pending });
}

// Approve, reject, block, suspend or reactivate resident registration
export async function POST(req: NextRequest) {
  const auth = await getAuthContext(req);
  if (!auth) return errorResponse('Unauthorized', 401);
  if (auth.role !== 'SOCIETY_ADMIN' && auth.role !== 'SUPER_ADMIN') {
    return errorResponse('Forbidden: Society Admin role required', 403);
  }

  const body = await req.json();
  const { targetUserId, action, reason } = body; // action: 'APPROVE' | 'REJECT' | 'SUSPEND' | 'BLOCK' | 'REACTIVATE'

  if (!targetUserId || !action) {
    return errorResponse('Missing targetUserId or action');
  }

  const repo = getRepository();
  const newStatus =
    action === 'APPROVE' || action === 'REACTIVATE'
      ? 'ACTIVE'
      : action === 'REJECT'
      ? 'REJECTED'
      : action === 'BLOCK'
      ? 'DEACTIVATED'
      : 'SUSPENDED';

  const updated = await repo.updateMembershipStatus(
    auth.societyId,
    targetUserId,
    newStatus,
    auth.userId,
    reason
  );

  // Record audit trail
  await repo.recordAuditEvent({
    id: `audit-${Date.now()}`,
    societyId: auth.societyId,
    actorUserId: auth.userId,
    action: `RESIDENT_${action}`,
    entityType: 'MEMBERSHIP',
    entityId: updated.id,
    metadata: { targetUserId, newStatus, reason },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, membership: updated });
}
