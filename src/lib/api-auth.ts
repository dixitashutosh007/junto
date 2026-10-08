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
 * Validates request authorization and ensures strict multi-tenant boundary isolation.
 *
 * Priority order:
 * 1. HTTP-Only `societyapps_session` cookie (authenticated Firebase Phone OTP session)
 * 2. `x-dev-user-id` header (for localhost testing & persona switcher)
 * 3. Default fallback to primary demo resident (Ashutosh Dixit)
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const repo = getRepository();

  // 1. Resolve session userId from cookie, or development header (in non-production only)
  const cookieSessionUid = req.cookies.get('societyapps_session')?.value;
  const devUserId = req.headers.get('x-dev-user-id');
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, session cookie is strictly mandatory.
  // In development, allow explicit x-dev-user-id or persona fallback for test suites.
  let userId: string | undefined = cookieSessionUid;
  if (!userId && !isProduction) {
    userId = devUserId || 'usr-offerer-001';
  }

  if (!userId) {
    return null; // Unauthenticated request
  }

  // 2. Resolve target societyId
  const cookieSocietyId = req.cookies.get('societyapps_society_id')?.value;
  const headerSocietyId = req.headers.get('x-society-id');
  const societyId = headerSocietyId || cookieSocietyId || 'soc-ggh-001';

  // 3. Verify user and membership exist within this tenant boundary
  const user = await repo.getUserById(userId);
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
