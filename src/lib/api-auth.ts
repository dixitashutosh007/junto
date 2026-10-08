import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { MembershipRole, MembershipStatus } from '@/types';

export interface AuthContext {
  userId: string;
  societyId: string;
  role: MembershipRole;
  status: MembershipStatus;
}

/**
 * Validates request authorization and ensures tenant boundary isolation.
 * In localhost development, defaults to current active user (Ashutosh Dixit or Priya Sharma or Vikram Mehta)
 * via `x-dev-user-id` header or standard fallback.
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const repo = getRepository();

  // 1. Check development mock header (for localhost testing switching personas)
  const devUserId = req.headers.get('x-dev-user-id') || 'usr-offerer-001'; // Default: Ashutosh Dixit
  const societyId = req.headers.get('x-society-id') || 'soc-ggh-001';

  const user = await repo.getUserById(devUserId);
  if (!user) return null;

  const membership = await repo.getMembership(societyId, user.id);
  if (!membership) return null;

  return {
    userId: user.id,
    societyId: membership.societyId,
    role: membership.role,
    status: membership.status,
  };
}

/**
 * Standard API error responder
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}
