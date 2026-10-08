import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { errorResponse } from '@/lib/api-auth';
import { User, SocietyMembership } from '@/types';
import { MemberRegistrationSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parseResult = MemberRegistrationSchema.safeParse(body);
    if (!parseResult.success) {
      return errorResponse(parseResult.error.issues[0]?.message || 'Invalid registration details');
    }

    const { societyCode, fullName, email, mobile, flatNumber, gender, workLocationName } = parseResult.data;

    const repo = getRepository();

    // Verify society code exists
    const society = await repo.getSocietyByCode(societyCode);
    if (!society || society.status !== 'ACTIVE') {
      return errorResponse('Invalid or inactive society invitation code', 404);
    }

    // Check if user email already exists
    let user = await repo.getUserByEmail(email);
    if (!user) {
      user = await repo.createUser({
        id: `usr-${Date.now()}`,
        cognitoSub: `cognito-${Date.now()}`,
        email,
        mobile,
        fullName,
        gender: gender || 'PREFER_NOT_TO_SAY',
        workLocationName,
        createdAt: new Date().toISOString(),
      });
    }

    // Check if membership already exists
    let membership = await repo.getMembership(society.id, user.id);
    if (membership) {
      return NextResponse.json({
        message: 'Membership already registered',
        user,
        society,
        membership,
      });
    }

    // Create pending membership
    membership = await repo.createMembership({
      id: `mem-${Date.now()}`,
      societyId: society.id,
      userId: user.id,
      flatNumber,
      role: 'RESIDENT',
      status: society.settings.require_admin_approval ? 'PENDING_APPROVAL' : 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Record audit event
    await repo.recordAuditEvent({
      id: `audit-${Date.now()}`,
      societyId: society.id,
      actorUserId: user.id,
      action: 'RESIDENT_REGISTERED',
      entityType: 'MEMBERSHIP',
      entityId: membership.id,
      metadata: { flatNumber, status: membership.status },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      user,
      society,
      membership,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return errorResponse(message, 500);
  }
}
