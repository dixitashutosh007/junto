import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';
import { ONBOARDING_STATUSES, errorResponse, requireAuth } from '@/lib/api-auth';
import { UpdateProfileSchema } from '@/lib/validation/schemas';
import { MembershipStatus, User } from '@/types';

// Any membership status may read its own profile, so the UI can show
// pending, suspended or rejected states
const ALL_STATUSES: MembershipStatus[] = [
  'INVITED',
  'REGISTERED',
  'PENDING_APPROVAL',
  'ACTIVE',
  'REJECTED',
  'SUSPENDED',
  'DEACTIVATED',
];

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, { statuses: ALL_STATUSES });
  if (auth instanceof NextResponse) return auth;

  const repo = getRepository();
  const user = await repo.getUserById(auth.userId);
  const society = await repo.getSocietyById(auth.societyId);
  const membership = await repo.getMembership(auth.societyId, auth.userId);

  return NextResponse.json({
    user,
    society,
    membership,
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, { statuses: ONBOARDING_STATUSES });
  if (auth instanceof NextResponse) return auth;

  const parsed = UpdateProfileSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message || 'Invalid profile details');
  }
  const { fullName, email, flatNumber, commuteIntent, workLocationName, gender, profileCompleted } =
    parsed.data;

  const repo = getRepository();
  const existingUser = await repo.getUserById(auth.userId);
  if (!existingUser) return errorResponse('Unauthorized', 401);

  // 1. Update user record
  const userUpdates: Partial<User> = {};
  if (fullName) userUpdates.fullName = fullName;
  if (email && email !== existingUser.email) {
    // Email is contact info only, never an identity; mark it unverified
    userUpdates.email = email;
    userUpdates.emailVerified = false;
  }
  if (commuteIntent) userUpdates.commuteIntent = commuteIntent;
  if (workLocationName !== undefined) userUpdates.workLocationName = workLocationName;
  if (gender) userUpdates.gender = gender;
  if (profileCompleted !== undefined) userUpdates.profileCompleted = profileCompleted;

  const updatedUser = await repo.updateUser(auth.userId, userUpdates);

  // 2. Update membership flat if provided
  let updatedMembership = await repo.getMembership(auth.societyId, auth.userId);
  if (flatNumber && updatedMembership) {
    updatedMembership = await repo.updateMembership(auth.societyId, auth.userId, { flatNumber });
  }

  // 3. Check vehicles if user wants to be an OFFERER
  const vehicles = await repo.listUserVehicles(auth.societyId, auth.userId);

  return NextResponse.json({
    success: true,
    user: updatedUser,
    membership: updatedMembership,
    hasVehicle: vehicles.length > 0,
  });
}
