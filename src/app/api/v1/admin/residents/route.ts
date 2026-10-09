import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { requireAuth, errorResponse } from '@/lib/api-auth';
import { ResidentActionSchema, ResidentsQuerySchema } from '@/lib/validation/schemas';
import { parseBody, parseQuery } from '@/lib/validation/parse';
import { MembershipStatus } from '@/types';

// List registrations for the current society (pending or all)
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, { permission: 'canApproveResidents' });
  if (auth instanceof NextResponse) return auth;

  const query = parseQuery(req, ResidentsQuerySchema);
  if (query instanceof NextResponse) return query;

  const repo = getRepository();
  if (query.all === 'true') {
    const members = await repo.listSocietyMembers(auth.societyId);
    return NextResponse.json({ members });
  }

  const pending = await repo.listPendingMemberships(auth.societyId);
  return NextResponse.json({ pending });
}

type ResidentAction = 'APPROVE' | 'REJECT' | 'SUSPEND' | 'BLOCK' | 'REACTIVATE';

// Which membership statuses each action applies to, and the resulting status
const TRANSITIONS: Record<ResidentAction, { from: MembershipStatus[]; to: MembershipStatus }> = {
  APPROVE: { from: ['PENDING_APPROVAL', 'REGISTERED', 'INVITED'], to: 'ACTIVE' },
  REJECT: { from: ['PENDING_APPROVAL', 'REGISTERED', 'INVITED'], to: 'REJECTED' },
  SUSPEND: { from: ['ACTIVE'], to: 'SUSPENDED' },
  BLOCK: { from: ['ACTIVE', 'SUSPENDED', 'PENDING_APPROVAL', 'REGISTERED'], to: 'DEACTIVATED' },
  REACTIVATE: { from: ['SUSPENDED', 'DEACTIVATED', 'REJECTED'], to: 'ACTIVE' },
};

// Approve, reject, block, suspend or reactivate resident registration
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, { permission: 'canApproveResidents' });
  if (auth instanceof NextResponse) return auth;

  const body = await parseBody(req, ResidentActionSchema);
  if (body instanceof NextResponse) return body;
  const { targetUserId, action, reason } = body;

  if (targetUserId === auth.userId) {
    return errorResponse('You cannot change your own membership status', 403);
  }

  const repo = getRepository();
  const target = await repo.getMembership(auth.societyId, targetUserId);
  if (!target) return errorResponse('Resident not found in this society', 404);

  // Society admins manage residents; only a platform admin can act on admins
  if (target.role !== 'RESIDENT' && auth.role !== 'SUPER_ADMIN') {
    return errorResponse('Only a platform admin can change the status of an admin', 403);
  }
  if (target.role === 'SUPER_ADMIN') {
    return errorResponse('Platform admins cannot be changed here', 403);
  }

  const transition = TRANSITIONS[action];
  if (!transition.from.includes(target.status)) {
    return errorResponse(`Cannot ${action.toLowerCase()} a member who is ${target.status}`, 409);
  }

  const updated = await repo.updateMembershipStatus(
    auth.societyId,
    targetUserId,
    transition.to,
    auth.userId,
    reason
  );

  // Record audit trail
  await repo.recordAuditEvent({
    id: `audit-${crypto.randomUUID()}`,
    societyId: auth.societyId,
    actorUserId: auth.userId,
    action: `RESIDENT_${action}`,
    entityType: 'MEMBERSHIP',
    entityId: updated.id,
    metadata: { targetUserId, newStatus: transition.to, reason },
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, membership: updated });
}
